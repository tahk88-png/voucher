/**
 * Audit diff and redaction utilities.
 *
 * Captures before/after state diffs for admin mutations and redacts
 * sensitive fields before persisting to audit logs.
 */

// ---------------------------------------------------------------------------
// Redaction
// ---------------------------------------------------------------------------

const DEFAULT_REDACT_FIELDS = new Set([
  "password",
  "passwordHash",
  "token",
  "secret",
  "apiKey",
  "accessToken",
  "refreshToken",
  "stripeCustomerId",
  "stripeAccountId",
  "stripeRefundId",
  "sessionToken",
  "verificationToken",
  "creditCardNumber",
  "cvv",
  "ssn",
]);

/**
 * Deep-clone an object and replace sensitive field values with `[REDACTED]`.
 *
 * @param obj  - The object to redact.
 * @param extra - Additional field names to redact beyond the defaults.
 */
export function redact<T extends Record<string, unknown>>(
  obj: T,
  extra: string[] = [],
): Record<string, unknown> {
  const blocked = new Set([...DEFAULT_REDACT_FIELDS, ...extra]);

  function walk(value: unknown, key?: string): unknown {
    if (key && blocked.has(key)) return "[REDACTED]";

    if (value === null || value === undefined) return value;
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      return value;
    }
    if (value instanceof Date) return value.toISOString();

    if (Array.isArray(value)) {
      return value.map((v, i) => walk(v, String(i)));
    }

    if (typeof value === "object") {
      const result: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
        result[k] = walk(v, k);
      }
      return result;
    }

    return String(value);
  }

  return walk(obj) as Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Diff
// ---------------------------------------------------------------------------

export type FieldDiff = {
  field: string;
  before: unknown;
  after: unknown;
};

/**
 * Compute a shallow diff between two objects.
 *
 * Returns only the fields that changed. Both before and after values are
 * included in the diff entries, redacted through the default sensitive-field
 * list. Fields present in only one of the two objects are included as
 * `undefined` for the missing side.
 *
 * @param before - State before the mutation (fetched from DB).
 * @param after  - State after the mutation.
 * @param extraRedact - Additional field names to redact.
 */
export function computeDiff(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
  extraRedact: string[] = [],
): FieldDiff[] {
  const blocked = new Set([...DEFAULT_REDACT_FIELDS, ...extraRedact]);
  const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);
  const diffs: FieldDiff[] = [];

  for (const key of allKeys) {
    const bVal = before[key];
    const aVal = after[key];

    // Skip if values are identical (shallow compare or JSON compare for objects)
    if (bVal === aVal) continue;
    if (
      typeof bVal === "object" &&
      typeof aVal === "object" &&
      JSON.stringify(bVal) === JSON.stringify(aVal)
    ) {
      continue;
    }

    diffs.push({
      field: key,
      before: blocked.has(key) ? "[REDACTED]" : bVal,
      after: blocked.has(key) ? "[REDACTED]" : aVal,
    });
  }

  return diffs;
}

/**
 * Convenience: capture the "before" state, run the mutation, capture "after",
 * and return the diff.
 *
 * Usage:
 * ```ts
 * const { result, diff } = await captureAuditDiff(
 *   () => prisma.user.findUnique({ where: { id } }),
 *   async () => {
 *     return prisma.user.update({ where: { id }, data: { status: 'disabled' } });
 *   },
 * );
 * // diff is a FieldDiff[] you can pass to recordAdminAudit metadata
 * ```
 */
export async function captureAuditDiff<T extends Record<string, unknown>>(
  fetchState: () => Promise<T | null>,
  mutate: () => Promise<T>,
  extraRedact?: string[],
): Promise<{ result: T; diff: FieldDiff[] }> {
  const before = await fetchState();
  const result = await mutate();

  const diff = before
    ? computeDiff(
        before as Record<string, unknown>,
        result as Record<string, unknown>,
        extraRedact,
      )
    : [];

  return { result, diff };
}
