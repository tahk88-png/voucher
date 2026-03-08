/**
 * AsyncLocalStorage-based Tenant Context
 *
 * Provides per-request, per-tenant isolation for multi-tenant SaaS.
 * Enables service layer and repositories to access tenant context without
 * passing it through function parameters.
 *
 * CRITICAL: This isolation is MANDATORY for multi-tenant data safety.
 * Every database query MUST be scoped to the current tenant from this context.
 */

import { AsyncLocalStorage } from 'async_hooks';

/**
 * TenantContext: Complete execution context for a request
 *
 * RULES:
 * - tenantId is NEVER nullable in authenticated routes
 * - userId identifies the current actor
 * - userRoles must be populated by middleware/tenant-guard.ts
 * - All mutations MUST be logged to auditLogs with this context
 */
export interface TenantContext {
  // Tenant identification (MANDATORY)
  tenantId: string;
  tenantType: 'merchant' | 'organization';

  // User identification (MANDATORY in authenticated routes)
  userId: string | null;

  // User's roles in this tenant
  userRoles: string[];  // e.g., ["merchant_staff", "merchant_admin"]

  // User's plan/entitlements (for feature gating)
  userPlan?: string;

  // Request context (for audit & compliance)
  ipAddress?: string;
  userAgent?: string;
  locale?: string;

  // Request tracking
  requestId?: string;
}

/**
 * TenantContextNotFoundError: Thrown when context is accessed but not initialized
 *
 * This should NEVER happen in production if middleware is correctly ordered.
 * Indicates a middleware ordering issue or missing tenant context setup.
 */
export class TenantContextNotFoundError extends Error {
  constructor(operation: string) {
    super(
      `TenantContext not found during: ${operation}. ` +
      `This indicates middleware ordering is incorrect or tenant context was not initialized. ` +
      `Ensure middleware/tenant-context.ts runs FIRST.`
    );
    this.name = 'TenantContextNotFoundError';
  }
}

/**
 * Async context storage (isolated per async context/request)
 */
const tenantContextStorage = new AsyncLocalStorage<TenantContext>();

/**
 * Initialize tenant context for current request
 *
 * MUST be called early in middleware chain (middleware/tenant-context.ts)
 *
 * @param context Complete tenant context for this request
 * @param callback Function to execute within this context
 * @returns Result of callback function
 */
export function withTenantContext<T>(
  context: TenantContext,
  callback: () => T | Promise<T>
): Promise<T> {
  return tenantContextStorage.run(context, callback);
}

/**
 * Retrieve current tenant context
 *
 * @throws TenantContextNotFoundError if not in a tenant context
 * @returns Current TenantContext
 */
export function getTenantContext(): TenantContext {
  const context = tenantContextStorage.getStore();
  if (!context) {
    throw new TenantContextNotFoundError('getTenantContext()');
  }
  return context;
}

/**
 * Retrieve current tenant ID
 *
 * Convenience method for the most common use case.
 *
 * @throws TenantContextNotFoundError if not in a tenant context
 * @returns Current tenant ID
 */
export function getTenantId(): string {
  return getTenantContext().tenantId;
}

/**
 * Retrieve current user ID
 *
 * @throws TenantContextNotFoundError if not in a tenant context
 * @returns Current user ID (null if not authenticated)
 */
export function getUserId(): string | null {
  return getTenantContext().userId;
}

/**
 * Retrieve current user's roles in tenant
 *
 * @throws TenantContextNotFoundError if not in a tenant context
 * @returns Array of role strings
 */
export function getUserRoles(): string[] {
  return getTenantContext().userRoles;
}

/**
 * Check if user has any of the given roles
 *
 * @throws TenantContextNotFoundError if not in a tenant context
 * @param roles Roles to check for
 * @returns True if user has any of the roles
 */
export function hasAnyRole(...roles: string[]): boolean {
  const userRoles = getUserRoles();
  return roles.some((role) => userRoles.includes(role));
}

/**
 * Check if user has all of the given roles
 *
 * @throws TenantContextNotFoundError if not in a tenant context
 * @param roles Roles to check for
 * @returns True if user has all roles
 */
export function hasAllRoles(...roles: string[]): boolean {
  const userRoles = getUserRoles();
  return roles.every((role) => userRoles.includes(role));
}

/**
 * Safely get tenant context or undefined
 *
 * Use this in utilities where context might not be initialized.
 *
 * @returns TenantContext or undefined
 */
export function getTenantContextOrUndefined(): TenantContext | undefined {
  return tenantContextStorage.getStore();
}

/**
 * Check if we're currently in a tenant context
 *
 * @returns True if context is initialized
 */
export function hasTenantContext(): boolean {
  return tenantContextStorage.getStore() !== undefined;
}
