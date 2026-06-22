import { DsCard } from 'voucher-platform';

const grid: React.CSSProperties = {
  display: 'flex',
  gap: 16,
  flexWrap: 'wrap',
  alignItems: 'flex-start',
  padding: 8,
};

const card: React.CSSProperties = {
  width: 280,
};

const title: React.CSSProperties = {
  fontWeight: 600,
  marginBottom: 6,
};

const body: React.CSSProperties = {
  color: 'var(--text-muted)',
  fontSize: 14,
  lineHeight: 1.5,
};

const footerRow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  fontSize: 13,
  color: 'var(--text-muted)',
};

export const Variants = () => (
  <div style={grid}>
    <DsCard variant="default" style={card}>
      <div style={title}>Summer launch</div>
      <p style={body}>Your campaign is live and reaching the first customers in your area.</p>
    </DsCard>
    <DsCard variant="glass" style={card}>
      <div style={title}>Redemptions today</div>
      <p style={body}>142 vouchers claimed across all active offers this morning.</p>
    </DsCard>
    <DsCard variant="gradient" style={card}>
      <div style={title}>Upgrade to Pro</div>
      <p style={body}>Unlock advanced analytics, custom domains, and promotion boosts.</p>
    </DsCard>
    <DsCard variant="elevated" style={card}>
      <div style={title}>Payout scheduled</div>
      <p style={body}>€1,280 will arrive in your account within two business days.</p>
    </DsCard>
  </div>
);

export const WithHeaderFooter = () => (
  <div style={grid}>
    <DsCard
      variant="elevated"
      style={card}
      header={<div style={title}>Weekend Coffee Deal</div>}
      footer={
        <div style={footerRow}>
          <span>Expires Jun 30</span>
          <span style={{ color: 'var(--primary)', fontWeight: 600 }}>Active</span>
        </div>
      }
    >
      <p style={body}>Buy one specialty latte, get the second free — every Saturday and Sunday.</p>
    </DsCard>
  </div>
);
