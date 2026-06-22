import { DsSidebar } from 'voucher-platform';

const frame: React.CSSProperties = {
  height: 420,
  display: 'flex',
};

const brand: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  fontWeight: 600,
  fontSize: 15,
};

const mark: React.CSSProperties = {
  width: 28,
  height: 28,
  borderRadius: 8,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'var(--primary)',
  color: 'var(--on-primary, #fff)',
  fontWeight: 700,
  fontSize: 14,
};

const sections = [
  {
    title: 'Main',
    items: [
      { id: 'dashboard', label: 'Dashboard' },
      { id: 'campaigns', label: 'Campaigns', badge: 3 },
      { id: 'vouchers', label: 'Vouchers' },
      { id: 'customers', label: 'Customers' },
    ],
  },
  {
    title: 'Account',
    items: [
      { id: 'settings', label: 'Settings' },
      { id: 'billing', label: 'Billing', badge: 'Pro' },
    ],
  },
];

export const Expanded = () => (
  <div style={frame}>
    <DsSidebar
      sections={sections}
      activeId="campaigns"
      header={
        <div style={brand}>
          <span style={mark}>V</span>
          <span>Voucher</span>
        </div>
      }
    />
  </div>
);
