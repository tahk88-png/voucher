import { DsTooltip, DsButton } from 'voucher-platform';

const row: React.CSSProperties = {
  display: 'flex',
  gap: 24,
  flexWrap: 'wrap',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 40,
};

export const Triggers = () => (
  <div style={row}>
    <DsTooltip content="Save changes" position="top">
      <DsButton variant="secondary">Hover top</DsButton>
    </DsTooltip>
    <DsTooltip content="Copy link" position="bottom">
      <DsButton variant="secondary">Hover bottom</DsButton>
    </DsTooltip>
    <DsTooltip content="Duplicate voucher" position="left">
      <DsButton variant="secondary">Hover left</DsButton>
    </DsTooltip>
    <DsTooltip content="Archive campaign" position="right">
      <DsButton variant="secondary">Hover right</DsButton>
    </DsTooltip>
  </div>
);
