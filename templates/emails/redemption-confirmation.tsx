import React from 'react';

interface RedemptionConfirmationProps {
  merchantName: string;
  voucherName: string;
  redeemedAt: string;
  voucherUrl: string;
}

export function RedemptionConfirmation({
  merchantName,
  voucherName,
  redeemedAt,
  voucherUrl,
}: RedemptionConfirmationProps) {
  const emailStyles = `
    .rc-container { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; }
    .rc-h1 { color: #333; }
    .rc-box { background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #bbf7d0; }
    .rc-box-p { margin: 0 0 10px 0; }
    .rc-box-p:last-child { margin: 0; }
    .rc-link { color: #0066cc; text-decoration: none; }
    .rc-footer { color: #666; font-size: 14px; margin-top: 30px; }
  `;

  return (
    <>
      <style>{emailStyles}</style>
      <div className="rc-container">
        <h1 className="rc-h1">Voucher redeemed successfully!</h1>
        <p>Your voucher from {merchantName} has been redeemed.</p>

        <div className="rc-box">
          <p className="rc-box-p">
            <strong>Voucher:</strong> {voucherName}
          </p>
          <p className="rc-box-p">
            <strong>Merchant:</strong> {merchantName}
          </p>
          <p className="rc-box-p">
            <strong>Redeemed at:</strong> {redeemedAt}
          </p>
        </div>

        <p>
          <a href={voucherUrl} className="rc-link">
            View details &rarr;
          </a>
        </p>

        <p className="rc-footer">
          Thank you for using your voucher! Check your wallet for any earned credits.
        </p>
      </div>
    </>
  );
}

export function redemptionConfirmationText({
  merchantName,
  voucherName,
  redeemedAt,
  voucherUrl,
}: RedemptionConfirmationProps): string {
  return `
Voucher redeemed successfully!

Your voucher from ${merchantName} has been redeemed.

Voucher: ${voucherName}
Merchant: ${merchantName}
Redeemed at: ${redeemedAt}

View details: ${voucherUrl}

Thank you for using your voucher! Check your wallet for any earned credits.
  `.trim();
}
