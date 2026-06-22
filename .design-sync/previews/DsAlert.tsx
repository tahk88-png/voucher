import { DsAlert, DsButton } from 'voucher-platform';

const stack: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  width: 420,
  padding: 8,
};

export const Variants = () => (
  <div style={stack}>
    <DsAlert variant="info" title="New analytics dashboard">
      Your revenue and redemption charts now update in real time.
    </DsAlert>
    <DsAlert variant="success" title="Campaign published">
      Your Summer launch offer is now visible to customers nearby.
    </DsAlert>
    <DsAlert variant="warning" title="Trial ending soon">
      Add a payment method to keep your Pro features after Jun 30.
    </DsAlert>
    <DsAlert variant="error" title="Payout failed">
      We couldn't reach your bank. Update your payout details to retry.
    </DsAlert>
  </div>
);

export const Dismissible = () => (
  <div style={stack}>
    <DsAlert
      variant="warning"
      title="Verify your business"
      dismissible
      onDismiss={() => {}}
      action={
        <DsButton variant="primary" size="sm">
          Verify now
        </DsButton>
      }
    >
      Complete verification to start accepting redemptions.
    </DsAlert>
  </div>
);
