import { DsInput } from 'voucher-platform';

const stack: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
  width: 320,
  padding: 8,
};

export const Labeled = () => (
  <div style={stack}>
    <DsInput
      label="Work email"
      defaultValue="alex@brightwave.com"
      helperText="We'll send your receipt here."
      type="email"
    />
    <DsInput
      label="Campaign name"
      defaultValue="Summer launch"
      helperText="Shown to customers on the offer page."
    />
  </div>
);

export const States = () => (
  <div style={stack}>
    <DsInput label="Full name" defaultValue="Anna Tamm" />
    <DsInput label="Email" defaultValue="anna@company.com" error="Email already in use" />
    <DsInput label="Account ID" defaultValue="acct_8f21c0" disabled />
  </div>
);

export const Sizes = () => (
  <div style={stack}>
    <DsInput inputSize="sm" label="Discount code" defaultValue="WELCOME10" />
    <DsInput inputSize="md" label="Voucher title" defaultValue="Free dessert" />
    <DsInput inputSize="lg" label="Redemption limit" defaultValue="100" type="number" />
  </div>
);
