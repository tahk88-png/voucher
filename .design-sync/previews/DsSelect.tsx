import { DsSelect } from 'voucher-platform';

const stack: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
  width: 320,
  padding: 8,
};

const countries = [
  { value: 'us', label: 'United States' },
  { value: 'gb', label: 'United Kingdom' },
  { value: 'de', label: 'Germany' },
  { value: 'fr', label: 'France' },
  { value: 'jp', label: 'Japan' },
];

export const Default = () => (
  <div style={stack}>
    <DsSelect
      label="Country"
      options={countries}
      placeholder="Choose a country"
      onChange={() => {}}
    />
  </div>
);

export const WithValue = () => (
  <div style={stack}>
    <DsSelect
      label="Country"
      options={countries}
      value="de"
      onChange={() => {}}
    />
  </div>
);

export const States = () => (
  <div style={stack}>
    <DsSelect
      label="Country"
      options={countries}
      placeholder="Choose a country"
      error="Please choose one"
      onChange={() => {}}
    />
    <DsSelect
      label="Country"
      options={countries}
      value="fr"
      disabled
      onChange={() => {}}
    />
  </div>
);
