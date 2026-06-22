/**
 * Base Repository Pattern with Tenant Isolation
 *
 * CRITICAL: All repositories MUST inherit from this and MUST scope queries by tenantId.
 * This enforces multi-tenant data isolation at the data access layer.
 *
 * Pattern:
 * ```typescript
 * export class CampaignRepository extends BaseRepository {
 *   async create(data: CreateCampaignInput): Promise<Campaign> {
 *     const tenantId = this.requireTenantId();
 *
 *     return this.prisma.campaign.create({
 *       data: {
 *         ...data,
 *         merchantId: tenantId, ← MANDATORY
 *       },
 *     });
 *   }
 * }
 * ```
 */

import { getTenantContext, getTenantContextOrUndefined } from '@/lib/async-context';
import { TenantContextNotFoundError } from '@/lib/async-context';
import { NotFoundError } from '@/modules/core/errors';
import { prisma } from '@/lib/prisma';

export abstract class BaseRepository {
  protected prisma = prisma;

  /**
   * Require tenant context to be initialized
   *
   * @throws TenantContextNotFoundError if not in tenant context
   * @returns Current tenant ID
   */
  protected requireTenantId(): string {
    const context = getTenantContext();
    return context.tenantId;
  }

  /**
   * Get tenant ID or undefined if not in context
   *
   * Use this in utilities that might be called outside request context.
   */
  protected getTenantIdOrUndefined(): string | undefined {
    const context = getTenantContextOrUndefined();
    return context?.tenantId;
  }

  /**
   * Defensive check: verify retrieved object belongs to current tenant
   *
   * Use this to prevent accidental cross-tenant data leaks if queries are misconfigured.
   *
   * @param item Retrieved object with merchantId or tenantId field
   * @param itemTenantField Field name containing tenant ID (default: 'merchantId')
   * @returns item if matches current tenant, null otherwise
   */
  protected validateTenantOwnership<T extends Record<string, any>>(
    item: T | null,
    itemTenantField = 'merchantId'
  ): T | null {
    if (!item) {
      return null;
    }

    const currentTenantId = this.getTenantIdOrUndefined();
    if (!currentTenantId) {
      // Not in tenant context - allow (used in background jobs, etc.)
      return item;
    }

    const itemTenantId = item[itemTenantField];
    if (itemTenantId !== currentTenantId) {
      // SECURITY: Item belongs to different tenant - return null
      return null;
    }

    return item;
  }

  /**
   * Validate array of items belong to current tenant
   *
   * @param items Array of objects
   * @param itemTenantField Field containing tenant ID
   * @returns Filtered array (only items belonging to current tenant)
   */
  protected validateTenantOwnershipBatch<T extends Record<string, any>>(
    items: T[],
    itemTenantField = 'merchantId'
  ): T[] {
    const currentTenantId = this.getTenantIdOrUndefined();
    if (!currentTenantId) {
      return items;
    }

    return items.filter((item) => item[itemTenantField] === currentTenantId);
  }
}

/**
 * Pagination helpers for repository queries.
 *
 * PREFER cursor-based pagination for all list endpoints.
 * Offset-based kept for backwards compatibility only.
 */

// ─── Cursor-based (preferred) ───

export interface CursorPaginationParams {
  cursor?: string | null;
  limit?: number;
}

export interface CursorPaginatedResult<T> {
  data: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export function getCursorPaginationArgs(params: CursorPaginationParams) {
  const limit = Math.min(Math.max(1, params.limit ?? DEFAULT_LIMIT), MAX_LIMIT);

  if (!params.cursor) {
    return { take: limit + 1 };
  }

  return {
    take: limit + 1,
    skip: 1,
    cursor: { id: params.cursor },
  };
}

export function buildCursorPaginatedResult<T extends { id: string }>(
  items: T[],
  limit: number = DEFAULT_LIMIT
): CursorPaginatedResult<T> {
  const effectiveLimit = Math.min(limit, MAX_LIMIT);
  const hasMore = items.length > effectiveLimit;
  const data = hasMore ? items.slice(0, effectiveLimit) : items;

  return {
    data,
    nextCursor: hasMore ? data[data.length - 1]?.id ?? null : null,
    hasMore,
  };
}

// ─── Offset-based (legacy, backwards compat) ───

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

/** @deprecated Use getCursorPaginationArgs instead for new endpoints. */
export function getPaginationSkipTake(params: PaginationParams) {
  const page = Math.max(1, params.page);
  const limit = Math.min(100, Math.max(1, params.limit));

  return {
    skip: (page - 1) * limit,
    take: limit,
    page,
    limit,
  };
}

/** @deprecated Use buildCursorPaginatedResult instead for new endpoints. */
export function buildPaginatedResult<T>(
  data: T[],
  total: number,
  page: number,
  limit: number
): PaginatedResult<T> {
  return {
    data,
    total,
    page,
    limit,
    pages: Math.ceil(total / limit),
  };
}
