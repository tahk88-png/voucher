/**
 * In-memory QR-checkout intent store.
 *
 * The route.ts at app/api/qr-checkout/[intentId] previously exported
 * `setIntent` directly, but Next.js 15 forbids non-handler exports from
 * route files (the generated PageProps validator rejects them).
 * Lifting the state into a regular lib module fixes the validation and
 * gives any server-side caller a clean entry point.
 *
 * NOTE: this is a single-process Map — production traffic should swap
 * this for Redis or a DB-backed store (no cross-process sharing).
 */

type Intent = {
  status: 'pending' | 'confirmed';
  merchantSlug: string;
  voucherId?: string;
  createdAt: number;
};

const intents = new Map<string, Intent>();

export function setIntent(
  intentId: string,
  data: { merchantSlug: string; voucherId?: string },
): void {
  intents.set(intentId, { ...data, status: 'pending', createdAt: Date.now() });
}

export function getIntent(intentId: string): Intent | undefined {
  return intents.get(intentId);
}

export function confirmIntent(intentId: string): Intent | undefined {
  const intent = intents.get(intentId);
  if (intent) intent.status = 'confirmed';
  return intent;
}
