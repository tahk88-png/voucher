/**
 * Auto-expire cron: transitions vouchers and campaigns to terminal
 * states once their lifetime ends, and emits the corresponding merchant
 * webhook events.
 *
 * Without this job the schema's temporal fields (`Voucher.validTo`,
 * `Campaign.endDate`) have no practical effect on `status`: vouchers
 * past their `validTo` would stay `published` forever, and campaigns
 * past their `endDate` would stay `active`. That means:
 *
 *   - filter queries that gate on `status = 'published'` mis-include
 *     expired items
 *   - merchants never receive a `voucher.expired` / `campaign.ended`
 *     webhook (both events live in the catalog but were never emitted)
 *
 * Vercel cron: hourly at :05 past, so it doesn't collide with the
 * :00 wave of reminder/digest jobs.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { startJobRun, completeJobRun } from '@/lib/admin/jobs';
import { queueWebhook } from '@/lib/webhooks';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const cronSecret = req.headers.get('authorization') || req.headers.get('x-cron-secret');
  if (
    cronSecret !== `Bearer ${process.env.CRON_SECRET}` &&
    process.env.NODE_ENV === 'production'
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const runId = await startJobRun('auto-expire', 'cron');
  const now = new Date();

  try {
    // ─── Vouchers: published + validTo < now → expired ───
    //
    // We deliberately read rows first so we can emit one webhook per
    // voucher after the bulk UPDATE succeeds. `updateMany` doesn't
    // return rows, and we'd rather not round-trip the DB twice per
    // voucher. Reading then bulk-updating keeps it to two queries.
    const expiredVouchers = await prisma.voucher.findMany({
      where: {
        status: 'published',
        validTo: { lt: now },
      },
      select: {
        id: true,
        merchantId: true,
        campaignId: true,
        currency: true,
        validTo: true,
      },
    });

    if (expiredVouchers.length > 0) {
      await prisma.voucher.updateMany({
        where: { id: { in: expiredVouchers.map((v) => v.id) } },
        data: { status: 'expired' },
      });
      for (const v of expiredVouchers) {
        queueWebhook(v.merchantId, 'voucher.expired', {
          voucherId: v.id,
          merchantId: v.merchantId,
          campaignId: v.campaignId,
          currency: v.currency,
          validTo: v.validTo?.toISOString() ?? null,
          expiredAt: now.toISOString(),
        });
      }
    }

    // ─── Campaigns: active + endDate < now → ended ───
    const endedCampaigns = await prisma.campaign.findMany({
      where: {
        status: 'active',
        endDate: { lt: now },
      },
      select: {
        id: true,
        merchantId: true,
        name: true,
        type: true,
        endDate: true,
      },
    });

    if (endedCampaigns.length > 0) {
      await prisma.campaign.updateMany({
        where: { id: { in: endedCampaigns.map((c) => c.id) } },
        data: { status: 'ended' },
      });
      for (const c of endedCampaigns) {
        queueWebhook(c.merchantId, 'campaign.ended', {
          campaignId: c.id,
          merchantId: c.merchantId,
          name: c.name,
          type: c.type,
          endDate: c.endDate.toISOString(),
          endedAt: now.toISOString(),
        });
      }
    }

    // ─── Credit: available + expiresAt < now → expired ───
    //
    // Without this, CreditLedger.expiresAt is cosmetic: the spend path
    // (applyCredit) already refuses expired credit, but balance readers
    // would keep counting it until the status flips. Bulk-update; no
    // per-row side effects needed.
    const creditsExpired = await prisma.creditLedger.updateMany({
      where: {
        status: 'available',
        expiresAt: { lt: now },
      },
      data: { status: 'expired' },
    });

    // ─── Leaked referral locks: redemption never confirmed → reverse ───
    //
    // An in-store redemption locks referral credit immediately on creation.
    // If the QR is never scanned (confirmedAt stays null), that locked credit
    // would sit on the books forever — never spendable, but inflating the
    // referrer's "locked" balance. Reverse locks whose redemption is still
    // unconfirmed 30+ days after creation.
    const LOCK_TTL_DAYS = 30;
    const lockCutoff = new Date(now.getTime() - LOCK_TTL_DAYS * 24 * 60 * 60 * 1000);
    const staleRedemptions = await prisma.redemption.findMany({
      where: { confirmedAt: null, createdAt: { lt: lockCutoff } },
      select: { id: true },
    });
    let locksReversed = 0;
    if (staleRedemptions.length > 0) {
      const reversed = await prisma.creditLedger.updateMany({
        where: {
          status: 'locked',
          source: 'referral_redemption',
          sourceId: { in: staleRedemptions.map((r) => r.id) },
        },
        data: { status: 'reversed' },
      });
      locksReversed = reversed.count;
    }

    const result = {
      vouchersExpired: expiredVouchers.length,
      campaignsEnded: endedCampaigns.length,
      creditsExpired: creditsExpired.count,
      locksReversed,
    };

    logger.info('auto-expire cron finished', result);

    await completeJobRun(runId, {
      status: 'succeeded',
      result,
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('auto-expire cron failed', { error: message });
    await completeJobRun(runId, { status: 'failed', error: message });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
