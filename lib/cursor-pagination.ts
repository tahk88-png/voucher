/**
 * Cursor-based pagination utilities.
 *
 * Spec: cursor-based (never offset) for lists >100 items.
 * Uses Prisma's native cursor support for efficient keyset pagination.
 */

export interface CursorPaginationParams {
  cursor?: string | null;
  limit?: number;
  direction?: 'forward' | 'backward';
}

export interface CursorPaginatedResult<T> {
  data: T[];
  nextCursor: string | null;
  prevCursor: string | null;
  hasMore: boolean;
}

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

/**
 * Parse cursor pagination params from request search params.
 */
export function parseCursorParams(searchParams: URLSearchParams): CursorPaginationParams {
  const cursor = searchParams.get('cursor') || null;
  const rawLimit = searchParams.get('limit');
  const limit = rawLimit ? Math.min(Math.max(1, parseInt(rawLimit, 10) || DEFAULT_LIMIT), MAX_LIMIT) : DEFAULT_LIMIT;
  const direction = searchParams.get('direction') === 'backward' ? 'backward' : 'forward';
  return { cursor, limit, direction };
}

/**
 * Build Prisma cursor query args.
 *
 * Usage:
 * ```ts
 * const { cursor, limit } = parseCursorParams(searchParams);
 * const paginationArgs = buildCursorQuery({ cursor, limit });
 * const items = await prisma.campaign.findMany({
 *   where: { merchantId },
 *   orderBy: { createdAt: 'desc' },
 *   ...paginationArgs,
 * });
 * const result = buildCursorResult(items, limit);
 * ```
 */
export function buildCursorQuery(params: CursorPaginationParams): {
  take: number;
  skip?: number;
  cursor?: { id: string };
} {
  const limit = Math.min(params.limit ?? DEFAULT_LIMIT, MAX_LIMIT);

  if (!params.cursor) {
    return { take: limit + 1 };
  }

  return {
    take: limit + 1,
    skip: 1, // Skip the cursor itself
    cursor: { id: params.cursor },
  };
}

/**
 * Build cursor-paginated result from query results.
 * Assumes items were fetched with take: limit + 1.
 */
export function buildCursorResult<T extends { id: string }>(
  items: T[],
  limit: number = DEFAULT_LIMIT,
  cursor?: string | null
): CursorPaginatedResult<T> {
  const effectiveLimit = Math.min(limit, MAX_LIMIT);
  const hasMore = items.length > effectiveLimit;
  const data = hasMore ? items.slice(0, effectiveLimit) : items;

  return {
    data,
    nextCursor: hasMore ? data[data.length - 1]?.id ?? null : null,
    prevCursor: cursor ?? null,
    hasMore,
  };
}
