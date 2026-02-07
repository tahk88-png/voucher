import React from 'react';

/**
 * Email template for credit-unlocked notifications.
 *
 * NOTE: Inline styles are required for email templates.
 * Many email clients strip <style> tags and block external stylesheets.
 * Inline styles are the industry standard for HTML email compatibility.
 */

interface CreditUnlockedProps {
  merchantName: string;
  creditAmount: string;
  currency: string;
  totalBalance: string;
  walletUrl: string;
}

export function CreditUnlocked({
  merchantName,
  creditAmount,
  currency,
  totalBalance,
  walletUrl,
}: CreditUnlockedProps) {
  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif', maxWidth: '600px', margin: '0 auto' }}>
      <div style={{ backgroundColor: '#f9fafb', padding: '24px', borderRadius: '8px', marginBottom: '24px' }}>
        <h1 style={{ margin: '0 0 16px 0', fontSize: '24px', fontWeight: '600', color: '#111827' }}>
          Your Credit is Now Available! 🎉
        </h1>
        <p style={{ margin: '0', fontSize: '16px', color: '#6b7280' }}>
          Great news! Your credit from {merchantName} has been unlocked and is ready to use.
        </p>
      </div>

      <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '8px', border: '1px solid #e5e7eb', marginBottom: '24px' }}>
        <div style={{ marginBottom: '16px' }}>
          <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Credit Unlocked
          </p>
          <p style={{ margin: '0', fontSize: '32px', fontWeight: '700', color: '#111827' }}>
            {currency} {creditAmount}
          </p>
        </div>

        <div style={{ paddingTop: '16px', borderTop: '1px solid #e5e7eb' }}>
          <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#6b7280' }}>Total Balance</p>
          <p style={{ margin: '0', fontSize: '20px', fontWeight: '600', color: '#111827' }}>
            {currency} {totalBalance}
          </p>
        </div>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <a
          href={walletUrl}
          style={{
            display: 'inline-block',
            backgroundColor: '#111827',
            color: '#ffffff',
            padding: '12px 24px',
            borderRadius: '6px',
            textDecoration: 'none',
            fontWeight: '600',
            fontSize: '16px',
          }}
        >
          View Wallet
        </a>
      </div>

      <p style={{ margin: '0', fontSize: '14px', color: '#6b7280', lineHeight: '1.5' }}>
        You can now use this credit when making purchases at {merchantName}. Thank you for sharing!
      </p>
    </div>
  );
}

export function creditUnlockedText({
  merchantName,
  creditAmount,
  currency,
  totalBalance,
  walletUrl,
}: CreditUnlockedProps): string {
  return `
Your Credit is Now Available! 🎉

Great news! Your credit from ${merchantName} has been unlocked and is ready to use.

Credit Unlocked: ${currency} ${creditAmount}
Total Balance: ${currency} ${totalBalance}

View your wallet: ${walletUrl}

You can now use this credit when making purchases at ${merchantName}. Thank you for sharing!
  `.trim();
}
