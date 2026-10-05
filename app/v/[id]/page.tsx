import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { isMerchantActive } from '@/lib/merchant-status';
import { safeParseJson } from '@/lib/utils';
import { generateVoucherMetadata } from '@/lib/seo/generate-metadata';
import { generateProductStructuredData } from '@/lib/seo/structured-data';
import VoucherClient from './voucher-client';
import { formatVoucherCode } from '@/lib/voucher-code';
import QRCode from 'qrcode';
import { getTranslations } from 'next-intl/server';

async function generateQRCode(text: string): Promise<string> {
  try {
    return await QRCode.toDataURL(text);
  } catch {
    return '';
  }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const t = await getTranslations('purchase');
  const tVoucher = await getTranslations('voucher');
  const voucher = await prisma.voucher.findUnique({
    where: { id },
    include: {
      merchant: true,
    },
  });

  if (!voucher || voucher.status !== 'published') {
    return {
      title: t('voucherPage.notFoundTitle'),
      description: t('voucherPage.notFoundDescription'),
    };
  }

  const design = safeParseJson<Record<string, any>>(voucher.designJson);
  const title = (design?.headline as string) || tVoucher('specialOffer');
  const description = (design?.subHeadline as string) || t('voucherPage.descriptionFallback');
  const image = (design?.image as string) || undefined;

  return generateVoucherMetadata({
    title,
    description,
    merchantName: voucher.merchant.name,
    value: voucher.value,
    currency: voucher.currency,
    image,
    voucherId: voucher.id,
  });
}

export default async function VoucherPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const t = await getTranslations('purchase');
  const tVoucher = await getTranslations('voucher');
  const voucher = await prisma.voucher.findUnique({
    where: { id },
    include: { 
      merchant: true,
      campaign: true,
    },
  });

  if (!voucher || voucher.status !== 'published') {
    notFound();
  }

  // Check merchant is active (kill switch) - hide inactive merchants from public
  const isActive = await isMerchantActive(voucher.merchantId);
  if (!isActive) {
    notFound();
  }

  const session = await auth();
  const design = safeParseJson<Record<string, any>>(voucher.designJson);
  const brandColors = safeParseJson<Record<string, string>>(voucher.merchant.brandColorsJson);

  // Generate voucher code
  // Same format the merchant scanner accepts (see lib/voucher-code.ts).
  const voucherCode = formatVoucherCode(voucher);
  const headersList = await headers();
  const host = headersList.get('x-forwarded-host') || headersList.get('host') || '';
  const proto =
    headersList.get('x-forwarded-proto') ||
    (host.includes('localhost') ? 'http' : 'https');
  const baseUrl = host ? `${proto}://${host}` : process.env.NEXT_PUBLIC_APP_URL || '';
  const voucherUrl = `${baseUrl}/v/${voucher.id}`;
  const qrCodeDataUrl = await generateQRCode(voucherUrl);

  const jsonLd = generateProductStructuredData(
    (design?.headline as string) || tVoucher('specialOffer'),
    (design?.subHeadline as string) || t('voucherPage.descriptionFallback'),
    voucher.value,
    voucher.currency,
    voucher.merchant.name,
    design?.image as string | undefined,
  );

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <VoucherClient
        voucher={voucher}
        design={design}
        brandColors={brandColors}
        voucherCode={voucherCode}
        qrCodeDataUrl={qrCodeDataUrl}
        isAuthenticated={!!session?.user}
        campaign={voucher.campaign}
      />
    </>
  );
}
