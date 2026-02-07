import React from 'react';

/**
 * Email template for credit expiry warnings.
 *
 * NOTE: Inline styles are required for email templates.
 * Many email clients (Outlook, Gmail, etc.) strip out <style> tags
 * and block external stylesheets. Inline styles are the industry
 * standard for HTML email compatibility.
 */

interface CreditExpiryWarningProps {
  merchantName: string;
  creditAmount: string;
  currency: string;
  daysUntilExpiry: number;
  walletUrl: string;
}

export function CreditExpiryWarning({
  merchantName,
  creditAmount,
  currency,
  daysUntilExpiry,
  walletUrl,
}: CreditExpiryWarningProps) {
  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif', maxWidth: '600px', margin: '0 auto' }}>
      <div style={{ backgroundColor: '#fef3c7', padding: '24px', borderRadius: '8px', marginBottom: '24px', border: '1px solid #fbbf24' }}>
        <h1 style={{ margin: '0 0 16px 0', fontSize: '24px', fontWeight: '600', color: '#92400e' }}>
          ⚠️ Credit Expiring Soon
        </h1>
        <p style={{ margin: '0', fontSize: '16px', color: '#78350f' }}>
          You have credit from {merchantName} that will expire in {daysUntilExpiry} {daysUntilExpiry === 1 ? 'day' : 'days'}.
        </p>
      </div>

      <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '8px', border: '1px solid #e5e7eb', marginBottom: '24px' }}>
        <div style={{ marginBottom: '16px' }}>
          <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Expiring Credit
          </p>
          <p style={{ margin: '0', fontSize: '32px', fontWeight: '700', color: '#111827' }}>
            {currency} {creditAmount}
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
          Use Credit Now
        </a>
      </div>

      <p style={{ margin: '0', fontSize: '14px', color: '#6b7280', lineHeight: '1.5' }}>
        Don't let your credit go to waste! Use it before it expires.
      </p>
    </div>
  );
}

export function creditExpiryWarningText({
  merchantName,
  creditAmount,
  currency,
  daysUntilExpiry,
  walletUrl,
}: CreditExpiryWarningProps): string {
  return `
⚠️ Credit Expiring Soon

You have credit from ${merchantName} that will expire in ${daysUntilExpiry} ${daysUntilExpiry === 1 ? 'day' : 'days'}.

Expiring Credit: ${currency} ${currency}

Use your credit: ${walletUrl}

Don't let your credit go to waste! Use it before it expires.
  `.trim();
}
