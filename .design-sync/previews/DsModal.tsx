import { DsModal, DsButton } from 'voucher-platform';

const body: React.CSSProperties = {
  fontSize: 14,
  lineHeight: 1.6,
};

export const Default = () => (
  <DsModal
    open={true}
    onClose={() => {}}
    size="md"
    title="Delete campaign?"
    footer={
      <>
        <DsButton variant="ghost" onClick={() => {}}>Cancel</DsButton>
        <DsButton variant="danger" onClick={() => {}}>Delete campaign</DsButton>
      </>
    }
  >
    <p style={body}>
      Deleting <strong>“Summer Spa Escape”</strong> will permanently remove all 1,240 issued
      vouchers and stop redemptions immediately. Customers who already purchased will be
      refunded automatically. This action cannot be undone.
    </p>
  </DsModal>
);
