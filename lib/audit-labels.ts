/**
 * Human-readable labels for audit log entries (client-safe).
 * Actions are stored as "resource.verb" or "snake_case" strings.
 */

const ACTION_LABELS: Record<string, string> = {
  'voucher.created': 'Voucher created',
  'voucher.updated': 'Voucher updated',
  'voucher.published': 'Voucher published',
  'vouchers.generated': 'Vouchers generated',
  'campaign.created': 'Campaign created',
  'campaign.updated': 'Campaign updated',
  'member.invited': 'Team member invited',
  'member.removed': 'Team member removed',
  'member.role_changed': 'Team member role changed',
  'api_key.created': 'API key created',
  'api_key.revoked': 'API key revoked',
};

/**
 * Message keys (merchantTeam.auditLog.actions.*) for actions the UI translates.
 * Actions not listed here fall back to formatAuditAction().
 */
export const AUDIT_ACTION_MESSAGE_KEYS: Record<string, string> = {
  'voucher.created': 'voucherCreated',
  'voucher.updated': 'voucherUpdated',
  'voucher.published': 'voucherPublished',
  'vouchers.generated': 'vouchersGenerated',
  'campaign.created': 'campaignCreated',
  'campaign.updated': 'campaignUpdated',
  'member.invited': 'memberInvited',
  'member.removed': 'memberRemoved',
  'member.role_changed': 'memberRoleChanged',
  'api_key.created': 'apiKeyCreated',
  'api_key.revoked': 'apiKeyRevoked',
  'api_key.updated': 'apiKeyUpdated',
  'event.created': 'eventCreated',
  'event.updated': 'eventUpdated',
  'event.published': 'eventPublished',
  'merchant.updated': 'merchantUpdated',
  'review.replied': 'reviewReplied',
  'settings.update': 'settingsUpdate',
  'settings.view': 'settingsView',
  'ticket.redeemed': 'ticketRedeemed',
};

export function formatAuditAction(action: string): string {
  if (ACTION_LABELS[action]) return ACTION_LABELS[action];
  const words = action
    .replace(/[._]+/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .trim()
    .toLowerCase();
  return words ? words.charAt(0).toUpperCase() + words.slice(1) : action;
}

// [payload key, English label, stable kind (merchantTeam.auditLog.resources.*)]
const RESOURCE_KEYS: Array<[string, string, string]> = [
  ['voucherId', 'Voucher', 'voucher'],
  ['campaignId', 'Campaign', 'campaign'],
  ['giftCardId', 'Gift card', 'giftCard'],
  ['eventId', 'Event', 'event'],
  ['memberId', 'Team member', 'teamMember'],
  ['apiKeyId', 'API key', 'apiKey'],
  ['webhookId', 'Webhook', 'webhook'],
  ['merchantId', 'Merchant', 'merchant'],
  ['userId', 'User', 'user'],
];

// resourceType column value -> stable kind (merchantTeam.auditLog.resources.*)
const RESOURCE_TYPE_KINDS: Record<string, string> = {
  voucher: 'voucher',
  campaign: 'campaign',
  gift_card: 'giftCard',
  event: 'event',
  member: 'member',
  api_key: 'apiKey',
  webhook: 'webhook',
  merchant: 'merchant',
  user: 'user',
  review: 'review',
};

export type AuditResource = { label: string; id: string | null; name: string | null };

/**
 * Resource for an entry: the explicit resourceType/resourceId columns, or
 * (for older entries that only logged a payload) the first known *Id key.
 * `kind` is a stable id for translating the label (null when unknown).
 */
export function resolveAuditResource(entry: {
  resourceType?: string | null;
  resourceId?: string | null;
  payloadJson?: unknown;
}): (AuditResource & { kind: string | null }) | null {
  let payload: Record<string, unknown> | null = null;
  if (entry.payloadJson && typeof entry.payloadJson === 'object') {
    payload = entry.payloadJson as Record<string, unknown>;
  } else if (typeof entry.payloadJson === 'string') {
    try {
      const parsed = JSON.parse(entry.payloadJson);
      if (parsed && typeof parsed === 'object') payload = parsed as Record<string, unknown>;
    } catch {
      payload = null;
    }
  }
  const name =
    payload && typeof payload.name === 'string'
      ? payload.name
      : payload && typeof payload.headline === 'string' && payload.headline
        ? payload.headline
        : null;

  if (entry.resourceType) {
    const t = entry.resourceType.replace(/[._]+/g, ' ');
    return {
      label: t.charAt(0).toUpperCase() + t.slice(1),
      id: entry.resourceId ?? null,
      name,
      kind: RESOURCE_TYPE_KINDS[entry.resourceType] ?? null,
    };
  }
  if (!payload) return null;
  for (const [key, label, kind] of RESOURCE_KEYS) {
    const v = payload[key];
    if (typeof v === 'string' && v) return { label, id: v, name, kind };
  }
  return null;
}

/** English resource description (see resolveAuditResource). */
export function describeAuditResource(entry: {
  resourceType?: string | null;
  resourceId?: string | null;
  payloadJson?: unknown;
}): AuditResource | null {
  const resolved = resolveAuditResource(entry);
  if (!resolved) return null;
  return { label: resolved.label, id: resolved.id, name: resolved.name };
}
