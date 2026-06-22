/**
 * Request-scoped merchant access context.
 *
 * Uses React.cache() to store the merchant access result per request.
 * The layout resolves access once, and any server component in the tree
 * can retrieve it without re-querying.
 */

import { cache } from "react";
import type { TenantMembershipRole } from "@/lib/access-control/roles";

export type MerchantAccess = {
  merchantId: string;
  merchantSlug: string;
  merchantName: string;
  effectiveRole: TenantMembershipRole;
  userId: string;
};

const getStore = cache(() => ({ current: null as MerchantAccess | null }));

/**
 * Store merchant access in the request-scoped cache.
 * Called by the merchant layout after resolving access.
 */
export function setMerchantAccess(access: MerchantAccess): void {
  getStore().current = access;
}

/**
 * Retrieve merchant access from the request-scoped cache.
 * Returns null if not in a merchant context (no layout ran).
 */
export function getMerchantAccess(): MerchantAccess | null {
  return getStore().current;
}

/**
 * Require merchant access — throws if not in a merchant context.
 */
export function requireMerchantAccess(): MerchantAccess {
  const access = getMerchantAccess();
  if (!access) {
    throw new Error("Not in a merchant context. Ensure the merchant layout has resolved access.");
  }
  return access;
}
