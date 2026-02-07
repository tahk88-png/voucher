import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { isMerchantActive } from '@/lib/merchant-status';
import { safeParseJson } from '@/lib/utils';
import ReferralClient from './referral-client';
import QRCode from 'qrcode';

async function generateQRCode(text: string): Promise<string> {
  try {
    return await QRCode.toDataURL(text);
  } catch {
    return '';
  }
}

export default async function ReferralPage({ params }: { params: { id: string } }) {
  const referral = await prisma.referral.findUnique({
    where: { id: params.id },
    include: {
      voucher: {
        include: { merchant: true },
      },
      referrer: {
        select: { name: true, email: true },
      },
    },
  });

  if (!referral || referral.voucher.status !== 'published') {
    notFound();
  }

  // Check merchant is active (kill switch) - hide inactive merchants from public
  const isActive = await isMerchantActive(referral.voucher.merchantId);
  if (!isActive) {
    notFound();
  }

  const session = await auth();
  const design = safeParseJson<Record<string, any>>(referral.voucher.designJson);
  const brandColors = safeParseJson<Record<string, string>>(referral.voucher.merchant.brandColorsJson);

  // Generate voucher code
  const voucherCode = `${referral.voucher.codePrefix || 'V'}-${referral.voucher.id.slice(0, 8).toUpperCase()}`;
  const qrCodeDataUrl = '';

  // Update referral status to 'opened' if it's still 'created'
  if (referral.status === 'created') {
    await prisma.referral.update({
      where: { id: referral.id },
      data: { status: 'opened' },
    });
  }

  return (
    <ReferralClient
      referral={referral}
      voucher={referral.voucher}
      design={design}
      brandColors={brandColors}
      voucherCode={voucherCode}
      qrCodeDataUrl={qrCodeDataUrl}
      isAuthenticated={!!session?.user}
      isSelfReferral={session?.user?.id === referral.referrerUserId}
    />
  );
}
