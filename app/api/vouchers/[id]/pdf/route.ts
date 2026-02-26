import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createVoucherPDF, generatePDFBuffer } from '@/lib/pdf';
import { withErrorHandler } from '@/lib/error-handler';
import QRCode from 'qrcode';

/**
 * Format voucher value for display
 */
function formatVoucherValue(voucher: { type: string; value: number; currency: string }): string {
  if (voucher.type === 'percentage') {
    return `${voucher.value / 100}%`;
  }
  // Fixed amount or credit amount - value is in minor units
  const majorUnits = voucher.value / 100;
  return `${voucher.currency} ${majorUnits.toFixed(2)}`;
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withErrorHandler(async () => {
    const voucher = await prisma.voucher.findUnique({
      where: { id: params.id },
      include: { merchant: true },
    });

    if (!voucher) {
      return NextResponse.json({ error: 'Voucher not found' }, { status: 404 });
    }

    // Only allow PDF export for published vouchers (or authenticated merchant staff)
    if (voucher.status !== 'published') {
      return NextResponse.json({ error: 'Voucher not available' }, { status: 403 });
    }

    // Generate voucher code
    const voucherCode = `${voucher.codePrefix || 'V'}-${voucher.id.slice(0, 8).toUpperCase()}`;
    const voucherUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/v/${voucher.id}`;

    // Generate QR code
    let qrCodeDataUrl: string | undefined;
    try {
      qrCodeDataUrl = await QRCode.toDataURL(voucherUrl);
    } catch {
      // QR code generation failed, continue without it
    }

    // Format value
    const value = formatVoucherValue(voucher);
    const validUntil = voucher.validTo.toISOString().split('T')[0];

    // Create PDF
    const doc = createVoucherPDF({
      merchantName: voucher.merchant.name,
      voucherCode,
      value,
      validUntil,
      qrCodeDataUrl,
    });

    const buffer = await generatePDFBuffer(doc);

    return new NextResponse(buffer as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="voucher-${voucherCode}.pdf"`,
      },
    });
  });
}
