export type PaywallDetails = {
  message: string;
  code: string;
  capability?: string;
  billingState?: string;
  planTier?: string;
  requiredPlan?: string;
  upgradePath?: string;
  limit?: { key: string; current: number; max: number } | null;
  graceEndsAt?: string | null;
};

export function isPaywallError(status: number, body: Record<string, unknown>): boolean {
  return status === 402 && typeof body?.code === 'string' && (body.code as string).startsWith('PAYWALL_');
}

export function parsePaywallResponse(body: Record<string, unknown>): PaywallDetails {
  const details = (body.details ?? {}) as Record<string, unknown>;
  return {
    message: (body.error as string) || 'Upgrade required',
    code: (body.code as string) || 'PAYWALL_BLOCKED',
    capability: details.capability as string | undefined,
    billingState: details.billingState as string | undefined,
    planTier: details.planTier as string | undefined,
    requiredPlan: details.requiredPlan as string | undefined,
    upgradePath: details.upgradePath as string | undefined,
    limit: details.limit as PaywallDetails['limit'] ?? null,
    graceEndsAt: details.graceEndsAt as string | undefined ?? null,
  };
}
