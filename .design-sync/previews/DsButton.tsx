import { DsButton } from 'voucher-platform';

const row: React.CSSProperties = {
  display: 'flex',
  gap: 12,
  flexWrap: 'wrap',
  alignItems: 'center',
  padding: 8,
};

export const Variants = () => (
  <div style={row}>
    <DsButton variant="primary">Get started</DsButton>
    <DsButton variant="secondary">Learn more</DsButton>
    <DsButton variant="outline">Preview</DsButton>
    <DsButton variant="ghost">Cancel</DsButton>
    <DsButton variant="danger">Delete</DsButton>
  </div>
);

export const Sizes = () => (
  <div style={row}>
    <DsButton variant="primary" size="xs">Extra small</DsButton>
    <DsButton variant="primary" size="sm">Small</DsButton>
    <DsButton variant="primary" size="md">Medium</DsButton>
    <DsButton variant="primary" size="lg">Large</DsButton>
    <DsButton variant="primary" size="xl">Extra large</DsButton>
  </div>
);

export const States = () => (
  <div style={row}>
    <DsButton variant="primary" loading>Saving…</DsButton>
    <DsButton variant="primary" disabled>Disabled</DsButton>
    <DsButton variant="secondary" iconLeft={<span aria-hidden>★</span>}>With icon</DsButton>
  </div>
);
