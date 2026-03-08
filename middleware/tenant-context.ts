/**
 * Tenant Context Middleware
 *
 * Extracts tenant information from the request and initializes TenantContext
 * in AsyncLocalStorage for the duration of the request.
 *
 * MUST run FIRST in middleware chain, before all other middlewares.
 *
 * Tenant resolution strategy (in priority order):
 * 1. URL path: /api/v1/merchants/:id/* → tenant ID from URL param
 * 2. Request header: X-Tenant-ID → tenant ID from header (for APIs)
 * 3. Session: user.merchantId → tenant from user's session
 *
 * CRITICAL: Every request MUST have a tenant context. Unauthenticated requests
 * to tenant-specific endpoints without explicit tenant ID result in 400 Bad Request.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import {
  TenantContext,
  withTenantContext,
  getTenantContextOrUndefined,
} from '@/lib/async-context';

/**
 * Extract tenant ID from different sources in priority order
 */
async function extractTenantId(request: NextRequest): Promise<string | null> {
  // 1. Try URL parameter (e.g., /api/v1/merchants/[id]/campaigns)
  // Extract from URL path - example: /api/v1/merchants/merchant123/campaigns
  const merchantMatch = request.nextUrl.pathname.match(
    /\/api\/v1\/merchants\/([a-z0-9]+)/i
  );
  if (merchantMatch) {
    return merchantMatch[1];
  }

  // 2. Try request header (for B2B APIs)
  const headerTenantId = request.headers.get('X-Tenant-ID');
  if (headerTenantId) {
    return headerTenantId;
  }

  // 3. Try session (user's default merchant)
  try {
    const session = await getSession();
    if (session?.user?.id) {
      // Get user's first merchant membership
      const membership = await prisma.merchantMember.findFirst({
        where: { userId: session.user.id },
        select: { merchantId: true },
      });
      if (membership) {
        return membership.merchantId;
      }
    }
  } catch (error) {
    // Session or DB error - not critical for tenant extraction
    logger.warn('Failed to extract tenant from session', { error: error instanceof Error ? error.message : String(error) });
  }

  return null;
}

/**
 * Verify tenant exists and is active
 */
async function verifyTenantExists(tenantId: string): Promise<boolean> {
  try {
    const merchant = await prisma.merchant.findUnique({
      where: { id: tenantId },
      select: { id: true, isActive: true },
    });
    return !!merchant && merchant.isActive;
  } catch (error) {
    logger.warn('Failed to verify tenant', { tenantId, error: error instanceof Error ? error.message : String(error) });
    return false;
  }
}

/**
 * Get user ID from session (if authenticated)
 */
async function extractUserId(): Promise<string | null> {
  try {
    const session = await getSession();
    return session?.user?.id ?? null;
  } catch (error) {
    return null;
  }
}

/**
 * Tenant context handler for API routes
 *
 * Usage in API route:
 * ```typescript
 * import { withTenantContextHandler } from '@/middleware/tenant-context';
 *
 * export const POST = withTenantContextHandler(async (request) => {
 *   const context = getTenantContext();
 *   // ... handler code
 * });
 * ```
 */
export function withTenantContextHandler(
  handler: (request: NextRequest) => Promise<Response>
) {
  return async (request: NextRequest): Promise<Response> => {
    try {
      // Extract tenant ID
      const tenantId = await extractTenantId(request);
      if (!tenantId) {
        return NextResponse.json(
          {
            ok: false,
            error: [
              'Tenant ID could not be determined from request.',
              'Provide via: URL path, X-Tenant-ID header, or user session.',
            ].join(' '),
          },
          { status: 400 }
        );
      }

      // Verify tenant exists and is active
      const isValid = await verifyTenantExists(tenantId);
      if (!isValid) {
        return NextResponse.json(
          {
            ok: false,
            error: 'Tenant not found or inactive.',
          },
          { status: 404 }
        );
      }

      // Extract user context
      const userId = await extractUserId();

      // Build TenantContext
      const context: TenantContext = {
        tenantId,
        tenantType: 'merchant', // TODO: Support 'organization' type
        userId,
        userRoles: [], // Will be filled by tenant-guard middleware
        ipAddress: request.headers.get('x-forwarded-for') || undefined,
        userAgent: request.headers.get('user-agent') || undefined,
        requestId: request.headers.get('x-request-id') || undefined,
      };

      // Execute handler within tenant context
      return await withTenantContext(context, () => handler(request));
    } catch (error) {
      logger.error('Unexpected error in tenant context', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
      return NextResponse.json(
        {
          ok: false,
          error: 'Internal server error during tenant context initialization.',
        },
        { status: 500 }
      );
    }
  };
}

/**
 * Tenant context handler for page/app handler
 *
 * Similar to withTenantContextHandler but for page.tsx getServerSideProps-like usage
 */
export async function initTenantContext(
  request: NextRequest
): Promise<TenantContext | null> {
  try {
    const tenantId = await extractTenantId(request);
    if (!tenantId) {
      return null;
    }

    const isValid = await verifyTenantExists(tenantId);
    if (!isValid) {
      return null;
    }

    const userId = await extractUserId();

    return {
      tenantId,
      tenantType: 'merchant',
      userId,
      userRoles: [],
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
      requestId: request.headers.get('x-request-id') || undefined,
    };
  } catch (error) {
    logger.error('Error initializing tenant context', { error: error instanceof Error ? error.message : String(error) });
    return null;
  }
}

/**
 * Middleware wrapper for Next.js edge middleware
 *
 * Note: This runs in the Edge Runtime and has different limitations.
 * For full tenant verification, use withTenantContextHandler in API routes.
 */
export async function tenantContextMiddleware(
  request: NextRequest
): Promise<NextResponse | undefined> {
  // In edge middleware, we can't access the full DB
  // This is mainly for logging and basic validation
  const tenantIdHeader = request.headers.get('X-Tenant-ID');
  const pathname = request.nextUrl.pathname;

  // Mark that we've attempted to process tenant context
  const response = NextResponse.next();
  if (tenantIdHeader) {
    response.headers.set('X-Tenant-ID', tenantIdHeader);
  }

  return response;
}

/**
 * DEBUGGING: Helper to inspect current tenant context
 * Remove in production
 */
export function debugTenantContext(): TenantContext | string {
  const context = getTenantContextOrUndefined();
  if (!context) {
    return 'No tenant context initialized';
  }
  return {
    tenantId: context.tenantId,
    userId: context.userId,
    userRoles: context.userRoles,
    tenantType: context.tenantType,
  };
}
