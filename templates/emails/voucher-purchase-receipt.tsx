import React from 'react';

interface VoucherPurchaseReceiptProps {
  merchantName: string;
  voucherCode: string;
  amount: number;
  currency: string;
  voucherUrl: string;
}

export function VoucherPurchaseReceipt({
  merchantName,
  voucherCode,
  amount,
  currency,
  voucherUrl,
}: VoucherPurchaseReceiptProps) {
  const formattedAmount = (amount / 100).toFixed(2);

  const emailStyles = `
    .vpr-container { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; }
    .vpr-h1 { color: #333; }
    .vpr-box { background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .vpr-box-p1 { margin: 0 0 10px 0; }
    .vpr-box-p2 { margin: 0 0 10px 0; }
    .vpr-link { color: #0066cc; text-decoration: none; }
    .vpr-footer { color: #666; font-size: 14px; margin-top: 30px; }
  `;

  return (
    <>
      <style>{emailStyles}</style>
      <div className="vpr-container">
        <h1 className="vpr-h1">Thank you for your purchase!</h1>
        <p>Your voucher from {merchantName} is ready.</p>
        
        <div className="vpr-box">
          <p className="vpr-box-p1">
            <strong>Voucher Code:</strong> {voucherCode}
          </p>
          <p className="vpr-box-p2">
            <strong>Amount Paid:</strong> {currency} {formattedAmount}
          </p>
        </div>

        <p>
          <a href={voucherUrl} className="vpr-link">
            View your voucher →
          </a>
        </p>

        <p className="vpr-footer">
          This is a receipt for your purchase. Keep this email for your records.
        </p>
      </div>
    </>
  );
}

export function voucherPurchaseReceiptText({
  merchantName,
  voucherCode,
  amount,
  currency,
  voucherUrl,
}: VoucherPurchaseReceiptProps): string {
  const formattedAmount = (amount / 100).toFixed(2);
  return `
Thank you for your purchase!

Your voucher from ${merchantName} is ready.

Voucher Code: ${voucherCode}
Amount Paid: ${currency} ${formattedAmount}

View your voucher: ${voucherUrl}

This is a receipt for your purchase. Keep this email for your records.
  `.trim();
}
