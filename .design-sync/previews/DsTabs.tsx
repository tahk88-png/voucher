import { DsTabs } from 'voucher-platform';

const stack: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 20,
  width: 480,
  padding: 8,
};

const sectionTabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'activity', label: 'Activity' },
  { id: 'settings', label: 'Settings' },
];

export const Variants = () => (
  <div style={stack}>
    <DsTabs
      tabs={sectionTabs}
      variant="underline"
      defaultValue="overview"
      onChange={() => {}}
    />
    <DsTabs
      tabs={sectionTabs}
      variant="pills"
      defaultValue="activity"
      onChange={() => {}}
    />
    <DsTabs
      tabs={sectionTabs}
      variant="glass"
      defaultValue="settings"
      onChange={() => {}}
    />
  </div>
);

export const WithBadges = () => (
  <div style={stack}>
    <DsTabs
      tabs={[
        { id: 'inbox', label: 'Inbox', badge: 12 },
        { id: 'drafts', label: 'Drafts', badge: 3 },
        { id: 'sent', label: 'Sent' },
        { id: 'archive', label: 'Archive', badge: 'new' },
      ]}
      variant="pills"
      defaultValue="inbox"
      onChange={() => {}}
    />
  </div>
);
