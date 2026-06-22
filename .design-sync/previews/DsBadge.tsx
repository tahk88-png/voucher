import { DsBadge } from 'voucher-platform';

const row: React.CSSProperties = {
  display: 'flex',
  gap: 10,
  flexWrap: 'wrap',
  alignItems: 'center',
  padding: 8,
};

export const Colors = () => (
  <div style={row}>
    <DsBadge variant="soft" color="primary">Featured</DsBadge>
    <DsBadge variant="soft" color="secondary">Draft</DsBadge>
    <DsBadge variant="soft" color="success">Active</DsBadge>
    <DsBadge variant="soft" color="warning">Pending</DsBadge>
    <DsBadge variant="soft" color="error">Failed</DsBadge>
    <DsBadge variant="soft" color="neutral">Archived</DsBadge>
  </div>
);

export const Variants = () => (
  <div style={row}>
    <DsBadge variant="solid" color="primary">Pro plan</DsBadge>
    <DsBadge variant="soft" color="primary">Pro plan</DsBadge>
    <DsBadge variant="outline" color="primary">Pro plan</DsBadge>
    <DsBadge variant="glass" color="primary">Pro plan</DsBadge>
  </div>
);

export const WithDotAndRemovable = () => (
  <div style={row}>
    <DsBadge variant="soft" color="success" dot>Live now</DsBadge>
    <DsBadge variant="soft" color="primary" removable onRemove={() => {}}>
      Coffee &amp; Tea
    </DsBadge>
  </div>
);
