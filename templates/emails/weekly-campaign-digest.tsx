import * as React from 'react';

type CampaignDigestItem = {
  name: string;
  merchantName: string;
  url: string;
  dateRange: string;
  promoted?: boolean;
};

export function WeeklyCampaignDigestEmail(params: {
  title: string;
  intro: string;
  items: CampaignDigestItem[];
  footer: string;
}) {
  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', color: '#1e1e1e', lineHeight: 1.6 }}>
      <h1 style={{ fontSize: '20px', marginBottom: '8px' }}>{params.title}</h1>
      <p style={{ marginTop: 0, color: '#7a6f5d' }}>{params.intro}</p>
      <div style={{ marginTop: '20px' }}>
        {params.items.map((item) => (
          <div
            key={item.url}
            style={{
              border: '1px solid #f1e4c6',
              borderRadius: '12px',
              padding: '12px 14px',
              marginBottom: '12px',
              background: '#fff1d0',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
              <div style={{ fontWeight: 600 }}>{item.name}</div>
              {item.promoted ? (
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    color: '#7a6f5d',
                    background: '#fff7e6',
                    border: '1px solid #f1e4c6',
                    borderRadius: '999px',
                    padding: '2px 8px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Sponsored
                </span>
              ) : null}
            </div>
            <div style={{ fontSize: '12px', color: '#7a6f5d' }}>{item.merchantName}</div>
            <div style={{ fontSize: '12px', color: '#7a6f5d' }}>{item.dateRange}</div>
            <div style={{ marginTop: '8px' }}>
              <a
                href={item.url}
                style={{
                  backgroundColor: '#f6c343',
                  color: '#1e1e1e',
                  padding: '8px 14px',
                  textDecoration: 'none',
                  borderRadius: '10px',
                  display: 'inline-block',
                  fontWeight: 600,
                  fontSize: '12px',
                }}
              >
                View campaign
              </a>
            </div>
          </div>
        ))}
      </div>
      <p style={{ fontSize: '12px', color: '#7a6f5d' }}>{params.footer}</p>
    </div>
  );
}

export function weeklyCampaignDigestText(params: {
  title: string;
  intro: string;
  items: CampaignDigestItem[];
  footer: string;
}) {
  const lines = [params.title, params.intro, ''];
  for (const item of params.items) {
    const tag = item.promoted ? ' (Sponsored)' : '';
    lines.push(`${item.name} — ${item.merchantName}${tag}`);
    lines.push(item.dateRange);
    lines.push(item.url);
    lines.push('');
  }
  lines.push(params.footer);
  return lines.join('\n');
}
