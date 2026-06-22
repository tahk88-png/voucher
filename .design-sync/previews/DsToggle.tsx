import { DsToggle } from 'voucher-platform';

const stack: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 14,
  padding: 8,
};

export const Sizes = () => (
  <div style={stack}>
    <DsToggle size="sm" label="Small" defaultChecked onChange={() => {}} />
    <DsToggle size="md" label="Medium" defaultChecked onChange={() => {}} />
    <DsToggle size="lg" label="Large" defaultChecked onChange={() => {}} />
  </div>
);

export const OnOff = () => (
  <div style={stack}>
    <DsToggle label="Email notifications" defaultChecked onChange={() => {}} />
    <DsToggle label="SMS notifications" onChange={() => {}} />
  </div>
);

export const LabelPositions = () => (
  <div style={stack}>
    <DsToggle
      label="Label on left"
      labelPosition="left"
      defaultChecked
      onChange={() => {}}
    />
    <DsToggle
      label="Label on right"
      labelPosition="right"
      defaultChecked
      onChange={() => {}}
    />
  </div>
);
