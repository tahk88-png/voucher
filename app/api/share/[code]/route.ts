import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/share/[code]
 *
 * Redirects to the shared item and tracks the referral click.
 * Code format: "{type}-{id}" e.g. "voucher-clx123abc"
 * Optional: ?ref=REFERRAL_CODE to track referral source.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const refCode = req.nextUrl.searchParams.get('ref');

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    // Parse the code: "voucher-clx123", "campaign-clx456", "merchant-clx789"
    const dashIndex = code.indexOf('-');
    if (dashIndex === -1) {
      return NextResponse.redirect(`${baseUrl}/`, { status: 302 });
    }

    const type = code.substring(0, dashIndex);
    const id = code.substring(dashIndex + 1);

    if (!id || !['voucher', 'campaign', 'merchant'].includes(type)) {
      return NextResponse.redirect(`${baseUrl}/`, { status: 302 });
    }

    // Track the share click (fire and forget)
    trackShareClick(type, id, refCode, req).catch((err) =>
      console.error('[share] Tracking error:', err)
    );

    // Determine redirect URL
    let redirectUrl: string;
    switch (type) {
      case 'voucher': {
        // Redirect to the campaign/merchant page the voucher belongs to
        const voucher = await prisma.voucher.findUnique({
          where: { id },
          select: {
            merchant: { select: { slug: true } },
            campaignId: true,
          },
        });
        if (voucher?.merchant) {
          redirectUrl = voucher.campaignId
            ? `${baseUrl}/m/${voucher.merchant.slug}/campaigns/${voucher.campaignId}`
            : `${baseUrl}/m/${voucher.merchant.slug}`;
        } else {
          redirectUrl = baseUrl;
        }
        break;
      }
      case 'campaign': {
        const campaign = await prisma.campaign.findUnique({
          where: { id },
          select: { merchant: { select: { slug: true } } },
        });
        redirectUrl = campaign?.merchant
          ? `${baseUrl}/m/${campaign.merchant.slug}/campaigns/${id}`
          : baseUrl;
        break;
      }
      case 'merchant': {
        const merchant = await prisma.merchant.findUnique({
          where: { id },
          select: { slug: true },
        });
        redirectUrl = merchant
          ? `${baseUrl}/m/${merchant.slug}`
          : baseUrl;
        break;
      }
      default:
        redirectUrl = baseUrl;
    }

    // Add referral code as query param so the destination page can capture it
    if (refCode) {
      const url = new URL(redirectUrl);
      url.searchParams.set('ref', refCode);
      redirectUrl = url.toString();
    }

    return NextResponse.redirect(redirectUrl, { status: 302 });
  } catch (error) {
    console.error('[share] Error:', error);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    return NextResponse.redirect(baseUrl, { status: 302 });
  }
}

/**
 * Track share click in audit log for analytics.
 */
async function trackShareClick(
  type: string,
  itemId: string,
  refCode: string | null,
  req: NextRequest
) {
  try {
    const userAgent = req.headers.get('user-agent') || undefined;
    const forwarded = req.headers.get('x-forwarded-for');
    const ip = forwarded?.split(',')[0]?.trim() || undefined;

    // Find the merchant ID for audit logging
    let merchantId: string | undefined;
    switch (type) {
      case 'voucher': {
        const v = await prisma.voucher.findUnique({
          where: { id: itemId },
          select: { merchantId: true },
        });
        merchantId = v?.merchantId;
        break;
      }
      case 'campaign': {
        const c = await prisma.campaign.findUnique({
          where: { id: itemId },
          select: { merchantId: true },
        });
        merchantId = c?.merchantId;
        break;
      }
      case 'merchant':
        merchantId = itemId;
        break;
    }

    if (!merchantId) return;

    // Log as a share-click audit event
    await prisma.auditLog.create({
      data: {
        merchantId,
        actorUserId: 'system', // Anonymous click — no user session
        action: 'share_click',
        resourceType: type,
        resourceId: itemId,
        payloadJson: {
          referralCode: refCode,
          userAgent,
          ipAddress: ip,
          timestamp: new Date().toISOString(),
        },
      },
    });
  } catch {
    // Silently fail — tracking should never block the redirect
  }
}
