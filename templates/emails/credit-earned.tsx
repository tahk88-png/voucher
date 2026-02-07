import React from 'react';

interface CreditEarnedProps {
  merchantName: string;
  creditAmount: string;
  currency: string;
  totalBalance: string;
  walletUrl: string;
}

export function CreditEarned({
  merchantName,
  creditAmount,
  currency,
  totalBalance,
  walletUrl,
}: CreditEarnedProps) {
  const emailStyles = `
    .ce-container { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; }
    .ce-h1 { color: #333; }
    .ce-box { background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .ce-box-p1 { margin: 0 0 10px 0; }
    .ce-box-p2 { margin: 0; }
    .ce-link { color: #0066cc; text-decoration: none; }
    .ce-footer { color: #666; font-size: 14px; margin-top: 30px; }
  `;

  return (
    <>
      <style>{emailStyles}</style>
      <div className="ce-container">
        <h1 className="ce-h1">You earned credit! 🎁</h1>
        <p>Great news! You've earned credit from {merchantName}.</p>
        
        <div className="ce-box">
          <p className="ce-box-p1">
            <strong>Credit Earned:</strong> {currency} {creditAmount}
          </p>
          <p className="ce-box-p2">
            <strong>Total Balance:</strong> {currency} {totalBalance}
          </p>
        </div>

        <p>
          <a href={walletUrl} className="ce-link">
            View your wallet →
          </a>
        </p>

        <p className="ce-footer">
          You can use this credit on your next purchase at {merchantName}.
        </p>
      </div>
    </>
  );
}

export function creditEarnedText({
  merchantName,
  creditAmount,
  currency,
  totalBalance,
  walletUrl,
}: CreditEarnedProps): string {
  return `
You earned credit! 🎁

Great news! You've earned credit from ${merchantName}.

Credit Earned: ${currency} ${creditAmount}
Total Balance: ${currency} ${totalBalance}

View your wallet: ${walletUrl}

You can use this credit on your next purchase at ${merchantName}.
  `.trim();
}
