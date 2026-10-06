import { NextRequest, NextResponse } from 'next/server';
// The shared client is a lazy Proxy: it constructs Resend on first property
// access (request time) instead of at import time. Constructing it at module
// scope threw "Missing API key" while `next build` collected page data for
// this route, which broke the build anywhere RESEND_API_KEY is absent —
// including CI and the Docker image build.
import { resend, isResendConfigured } from '@/lib/resend';
import { prisma } from '@/lib/prisma';
import { requireMerchantProfileAccessBySlug } from '@/lib/access-control';
import { logger } from '@/lib/logger';
import { withErrorHandler } from '@/lib/error-handler';
import { buildEmailHtml, type EmailSection } from '@/lib/email-builder';
import { getSenderEmail } from '@/lib/app-url';

async function getRecipients(merchantId: string, filter: string) {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

  switch (filter) {
    case 'redeemed_30d': {
      // Users who redeemed in last 30 days
      const redemptions = await prisma.redemption.findMany({
        where: {
          merchantId,
          confirmedAt: { gte: thirtyDaysAgo },
          redeemedByUserId: { not: null },
        },
        select: { redeemedByUserId: true },
        distinct: ['redeemedByUserId'],
      });
      const userIds = redemptions.map(r => r.redeemedByUserId!).filter(Boolean);
      if (userIds.length === 0) return [];
      return prisma.user.findMany({
        where: { id: { in: userIds }, status: 'active', deleted: false },
        select: { id: true, email: true, name: true },
      });
    }

    case 'inactive': {
      // Users who haven't purchased/redeemed in 90+ days
      const activeUserIds = await prisma.redemption.findMany({
        where: {
          merchantId,
          confirmedAt: { gte: ninetyDaysAgo },
          redeemedByUserId: { not: null },
        },
        select: { redeemedByUserId: true },
        distinct: ['redeemedByUserId'],
      });
      const activeIds = activeUserIds.map(r => r.redeemedByUserId!).filter(Boolean);

      // Get all customers who had any interaction
      const allCustomerIds = await prisma.redemption.findMany({
        where: { merchantId, redeemedByUserId: { not: null } },
        select: { redeemedByUserId: true },
        distinct: ['redeemedByUserId'],
      });
      const allIds = allCustomerIds.map(r => r.redeemedByUserId!).filter(Boolean);
      const inactiveIds = allIds.filter(id => !activeIds.includes(id));

      if (inactiveIds.length === 0) return [];
      return prisma.user.findMany({
        where: { id: { in: inactiveIds }, status: 'active', deleted: false },
        select: { id: true, email: true, name: true },
      });
    }

    default: {
      // "all" — all customers who have interacted with this merchant
      const purchases = await prisma.voucherPurchase.findMany({
        where: { merchantId, status: 'paid' },
        select: { userId: true },
        distinct: ['userId'],
      });
      const redemptions = await prisma.redemption.findMany({
        where: { merchantId, redeemedByUserId: { not: null } },
        select: { redeemedByUserId: true },
        distinct: ['redeemedByUserId'],
      });
      const userIds = [
        ...new Set([
          ...purchases.map(p => p.userId),
          ...redemptions.map(r => r.redeemedByUserId!).filter(Boolean),
        ]),
      ];

      if (userIds.length === 0) return [];
      return prisma.user.findMany({
        where: { id: { in: userIds }, status: 'active', deleted: false },
        select: { id: true, email: true, name: true },
      });
    }
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  return withErrorHandler(async () => {
    const { slug, id } = await params;
    const { merchant } = await requireMerchantProfileAccessBySlug(slug, 'merchant_admin');

    const campaign = await prisma.emailCampaign.findFirst({
      where: { id, merchantId: merchant.id },
    });

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    if (campaign.status === 'sent') {
      return NextResponse.json({ error: 'Campaign already sent' }, { status: 400 });
    }

    // Campaign emails go out through Resend. Without it every send fails, so
    // refuse up front instead of "sending" to nobody and marking it sent.
    if (!isResendConfigured()) {
      return NextResponse.json(
        {
          error:
            "Email sending isn't set up on this platform yet, so this campaign can't be sent. It is still saved as a draft. Contact support to enable email sending.",
          code: 'EMAIL_PROVIDER_NOT_CONFIGURED',
        },
        { status: 503 }
      );
    }

    // Get recipients based on filter
    const recipients = await getRecipients(merchant.id, campaign.recipientFilter);

    if (recipients.length === 0) {
      return NextResponse.json({ error: 'No recipients found for the selected filter' }, { status: 400 });
    }

    // Build email HTML
    const sections = campaign.sectionsJson as unknown as EmailSection[];
    const html = buildEmailHtml(sections, { previewText: campaign.subject });

    // Fetch supportEmail separately since the access control guard doesn't return it
    const merchantDetails = await prisma.merchant.findUnique({
      where: { id: merchant.id },
      select: { supportEmail: true },
    });
    // Mail goes out from the platform's verified sender under the merchant's
    // name; replies reach the merchant. The merchant's own address can't be the
    // From: its domain isn't verified with our email provider, so every send
    // from it would be rejected.
    const fromEmail = getSenderEmail();
    const replyTo = merchantDetails?.supportEmail || undefined;

    // Send emails in batches
    let sentCount = 0;
    let failedCount = 0;
    const batchSize = 50;

    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);

      const sendPromises = batch.map(async (recipient) => {
        try {
          const { error: sendError } = await resend.emails.send({
            from: `${merchant.name} <${fromEmail}>`,
            reply_to: replyTo,
            to: recipient.email,
            subject: campaign.subject,
            html,
          });
          // Resend returns API failures instead of throwing them
          if (sendError) throw new Error(sendError.message);

          await prisma.emailCampaignDelivery.create({
            data: {
              campaignId: campaign.id,
              userId: recipient.id,
              email: recipient.email,
              status: 'sent',
            },
          });

          sentCount++;
        } catch (err) {
          // Log error but continue sending to other recipients
          failedCount++;
          logger.error('Failed to send email', { recipient: recipient.email, error: err instanceof Error ? err.message : String(err) });
          // "failed" = the provider refused the send (not a recipient bounce).
          await prisma.emailCampaignDelivery.create({
            data: {
              campaignId: campaign.id,
              userId: recipient.id,
              email: recipient.email,
              status: 'failed',
            },
          });
        }
      });

      await Promise.allSettled(sendPromises);
    }

    // Nothing went out: keep the campaign as it was so it can be retried,
    // and say so instead of reporting success.
    if (sentCount === 0) {
      return NextResponse.json(
        {
          error: `None of the ${recipients.length} emails could be sent. The campaign has not been marked as sent; please try again later.`,
          code: 'EMAIL_SEND_FAILED',
          recipientCount: 0,
          failedCount,
          totalRecipients: recipients.length,
        },
        { status: 502 }
      );
    }

    await prisma.emailCampaign.update({
      where: { id: campaign.id },
      data: {
        status: 'sent',
        sentAt: new Date(),
        recipientCount: sentCount,
      },
    });

    return NextResponse.json({
      success: true,
      partial: failedCount > 0,
      recipientCount: sentCount,
      failedCount,
      totalRecipients: recipients.length,
    });
  });
}
