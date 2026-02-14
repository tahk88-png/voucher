import React from 'react';

interface VoucherExpiryReminderProps {
  merchantName: string;
  voucherName: string;
  daysUntilExpiry: number;
  voucherUrl: string;
}

export function VoucherExpiryReminder({
  merchantName,
  voucherName,
  daysUntilExpiry,
  voucherUrl,
}: VoucherExpiryReminderProps) {
  const emailStyles = `
    .ver-container { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; }
    .ver-h1 { color: #333; }
    .ver-box { background: #FFF9ED; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #FFE5B4; }
    .ver-box-p { margin: 0 0 10px 0; }
    .ver-box-p:last-child { margin: 0; }
    .ver-cta { display: inline-block; background: #FFC857; color: #2D2721; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 16px; }
    .ver-footer { color: #666; font-size: 14px; margin-top: 30px; }
  `;

  const urgencyText = daysUntilExpiry === 1
    ? 'expires tomorrow'
    : `expires in ${daysUntilExpiry} days`;

  return (
    <>
      <style>{emailStyles}</style>
      <div className="ver-container">
        <h1 className="ver-h1">Your voucher {urgencyText}!</h1>
        <p>Don&apos;t miss out - your voucher from {merchantName} is about to expire.</p>

        <div className="ver-box">
          <p className="ver-box-p">
            <strong>Voucher:</strong> {voucherName}
          </p>
          <p className="ver-box-p">
            <strong>From:</strong> {merchantName}
          </p>
          <p className="ver-box-p">
            <strong>Expires:</strong> in {daysUntilExpiry} {daysUntilExpiry === 1 ? 'day' : 'days'}
          </p>
        </div>

        <p>
          <a href={voucherUrl} className="ver-cta">
            Use your voucher now &rarr;
          </a>
        </p>

        <p className="ver-footer">
          Use it before it&apos;s gone! Visit your voucher page to redeem.
        </p>
      </div>
    </>
  );
}

export function voucherExpiryReminderText({
  merchantName,
  voucherName,
  daysUntilExpiry,
  voucherUrl,
}: VoucherExpiryReminderProps): string {
  const urgencyText = daysUntilExpiry === 1
    ? 'expires tomorrow'
    : `expires in ${daysUntilExpiry} days`;

  return `
Your voucher ${urgencyText}!

Don't miss out - your voucher from ${merchantName} is about to expire.

Voucher: ${voucherName}
From: ${merchantName}
Expires: in ${daysUntilExpiry} ${daysUntilExpiry === 1 ? 'day' : 'days'}

Use your voucher now: ${voucherUrl}

Use it before it's gone!
  `.trim();
}
