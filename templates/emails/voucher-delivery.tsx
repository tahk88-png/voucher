import React from 'react';

interface VoucherDeliveryProps {
  merchantName: string;
  voucherCode: string;
  value: string;
  validUntil: string;
  voucherUrl: string;
}

export function VoucherDelivery({
  merchantName,
  voucherCode,
  value,
  validUntil,
  voucherUrl,
}: VoucherDeliveryProps) {
  const emailStyles = `
    .vd-container { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; }
    .vd-h1 { color: #333; }
    .vd-box { background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .vd-box-p1 { margin: 0 0 10px 0; }
    .vd-box-p2 { margin: 0 0 10px 0; }
    .vd-box-p3 { margin: 0; }
    .vd-link { color: #0066cc; text-decoration: none; }
    .vd-footer { color: #666; font-size: 14px; margin-top: 30px; }
  `;

  return (
    <>
      <style>{emailStyles}</style>
      <div className="vd-container">
        <h1 className="vd-h1">Your voucher is here! 🎉</h1>
        <p>You've received a voucher from {merchantName}.</p>
        
        <div className="vd-box">
          <p className="vd-box-p1">
            <strong>Voucher Code:</strong> {voucherCode}
          </p>
          <p className="vd-box-p2">
            <strong>Value:</strong> {value}
          </p>
          <p className="vd-box-p3">
            <strong>Valid Until:</strong> {validUntil}
          </p>
        </div>

        <p>
          <a href={voucherUrl} className="vd-link">
            View and redeem your voucher →
          </a>
        </p>

        <p className="vd-footer">
          Present this voucher code at checkout to redeem your discount.
        </p>
      </div>
    </>
  );
}

export function voucherDeliveryText({
  merchantName,
  voucherCode,
  value,
  validUntil,
  voucherUrl,
}: VoucherDeliveryProps): string {
  return `
Your voucher is here! 🎉

You've received a voucher from ${merchantName}.

Voucher Code: ${voucherCode}
Value: ${value}
Valid Until: ${validUntil}

View and redeem your voucher: ${voucherUrl}

Present this voucher code at checkout to redeem your discount.
  `.trim();
}
