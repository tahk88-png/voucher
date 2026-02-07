import * as React from 'react';

export function MerchantAnnouncementEmail(params: {
  merchantName: string;
  title: string;
  body: string;
  ctaUrl: string;
  type: 'voucher_published' | 'campaign_started';
}) {
  const ctaLabel = params.type === 'campaign_started' ? 'View campaign' : 'View voucher';

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', lineHeight: 1.6, color: '#1e1e1e' }}>
      <h1 style={{ fontSize: '20px', marginBottom: '8px' }}>{params.title}</h1>
      <p style={{ marginTop: 0, color: '#7a6f5d' }}>{params.merchantName}</p>
      <p>{params.body}</p>
      {params.ctaUrl ? (
        <p style={{ margin: '24px 0' }}>
          <a
            href={params.ctaUrl}
            style={{
              backgroundColor: '#f6c343',
              color: '#1e1e1e',
              padding: '10px 18px',
              textDecoration: 'none',
              borderRadius: '10px',
              display: 'inline-block',
              fontWeight: 600,
            }}
          >
            {ctaLabel}
          </a>
        </p>
      ) : null}
      <p style={{ fontSize: '12px', color: '#7a6f5d' }}>
        You are receiving this because you subscribed to merchant updates.
      </p>
    </div>
  );
}

export function merchantAnnouncementText(params: {
  merchantName: string;
  title: string;
  body: string;
  ctaUrl: string;
  type: 'voucher_published' | 'campaign_started';
}) {
  const ctaLabel = params.type === 'campaign_started' ? 'View campaign' : 'View voucher';
  return [
    params.title,
    params.merchantName,
    '',
    params.body,
    params.ctaUrl ? `${ctaLabel}: ${params.ctaUrl}` : '',
    '',
    'You are receiving this because you subscribed to merchant updates.',
  ]
    .filter(Boolean)
    .join('\n');
}
