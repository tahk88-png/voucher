/**
 * Tenant Guard Middleware
 *
 * Verifies that the current user has a role in the current tenant.
 * This MUST run after middleware/tenant-context.ts has initialized the context.
 *
 * Usage:
 * ```typescript
 * import { withTenantGuard } from '@/middleware/tenant-guard';
 *
 * export const POST = withTenantGuard(
 *   async (request) => {
 *     // Handler code - user is now verified as tenant member
 *   },
 *   { requiredRoles: ['merchant_admin'] }
 * );
 * ```
 *
 * CRITICAL: Do NOT use this for unauthenticated endpoints or public APIs.
 */

import { NextRequest, NextResponse } from 'next/server';
import { ForbiddenError, UnauthorizedError } from '@/modules/core/errors';
import {
  getTenantContext,
  getTenantContextOrUndefined,
} from '@/lib/async-context';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export interface TenantGuardOptions {
  // Require user to have ANY of these roles
  requiredRoles?: string[];
  // Require user to have ALL of these roles
  requireAllRoles?: boolean;
  // Allow public/unauthenticated access
  allowPublic?: boolean;
}

/**
 * Verify user has required role(s) in tenant
 *
 * @throws UnauthorizedError if user not authenticated
 * @throws ForbiddenError if user lacks required roles
 */
async function verifyTenantMembership(
  tenantId: string,
  userId: string | null,
  requiredRoles?: string[],
  requireAllRoles?: boolean
): Promise<string[]> {
  // Check authentication
  if (!userId) {
    throw new UnauthorizedError('User must be authenticated to access this resource.');
  }

  // Get user's roles in this tenant
  const membership = await prisma.merchantMember.findUnique({
    where: {
      merchantId_userId: {
        merchantId: tenantId,
        userId,
      },
    },
    select: {
      role: true,
    },
  });

  if (!membership) {
    // User is not a member of this tenant
    throw new ForbiddenError('Access denied to this merchant.');
  }

  const userRoles = [membership.role]; // Currently single role, can be extended to array

  // Check role requirements
  if (requiredRoles && requiredRoles.length > 0) {
    const hasRequired = requireAllRoles
      ? requiredRoles.every((role) => userRoles.includes(role))
      : requiredRoles.some((role) => userRoles.includes(role));

    if (!hasRequired) {
      throw new ForbiddenError(
        `User lacks required role(s): ${requiredRoles.join(', ')}.`
      );
    }
  }

  return userRoles;
}

/**
 * Tenant guard handler for API routes
 *
 * Wraps a request handler and verifies tenant membership before executing it.
 *
 * @param handler Function to execute if tenant guard passes
 * @param options Guard options (roles, etc.)
 * @returns Wrapped handler function
 */
export function withTenantGuard(
  handler: (request: NextRequest) => Promise<Response>,
  options: TenantGuardOptions = {}
) {
  return async (request: NextRequest): Promise<Response> => {
    try {
      // Get tenant context (must be initialized by tenant-context middleware)
      const context = getTenantContextOrUndefined();
      if (!context) {
        return NextResponse.json(
          {
            ok: false,
            error: 'Tenant context not initialized. Ensure tenant-context middleware runs first.',
          },
          { status: 500 }
        );
      }

      // Verify tenant membership and get roles
      const userRoles = await verifyTenantMembership(
        context.tenantId,
        context.userId,
        options.requiredRoles,
        options.requireAllRoles
      );

      // Update context with verified roles
      context.userRoles = userRoles;

      // Execute handler with verified context
      return await handler(request);
    } catch (error) {
      // Log the error
      if (!(error instanceof UnauthorizedError || error instanceof ForbiddenError)) {
        logger.error('Error in tenant guard', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
      }
      
      // Handle domain errors
      if (error instanceof UnauthorizedError) {
        return NextResponse.json(
          {
            ok: false,
            error: error.message,
          },
          { status: 401 }
        );
      }

      if (error instanceof ForbiddenError) {
        return NextResponse.json(
          {
            ok: false,
            error: error.message,
          },
          { status: 403 }
        );
      }

      return NextResponse.json(
        {
          ok: false,
          error: 'Internal server error during authorization check.',
        },
        { status: 500 }
      );
    }
  };
}

/**
 * Verify function for use in other contexts (services, utils)
 *
 * @throws UnauthorizedError if not authenticated
 * @throws ForbiddenError if lacking required roles
 */
export async function verifyTenantAccess(
  requiredRoles?: string[],
  requireAllRoles?: boolean
): Promise<string[]> {
  const context = getTenantContext();
  return verifyTenantMembership(
    context.tenantId,
    context.userId,
    requiredRoles,
    requireAllRoles
  );
}

/**
 * RBAC Matrix: Define which roles have which permissions
 *
 * Format: [role]: [permission1, permission2, ...]
 *
 * Permissions are checked like:
 * ```typescript
 * if (!hasPermission('read:campaigns')) {
 *   throw new ForbiddenError('No permission to read campaigns');
 * }
 * ```
 *
 * IMPORTANT: Keep this In sync with your database schema and business rules.
 */
export const ROLE_PERMISSIONS: Record<string, string[]> = {
  merchant_staff: [
    // Read operations
    'read:campaigns',
    'read:vouchers',
    'read:redemptions',
    'read:analytics',

    // Redeem operations
    'redeem:vouchers',
  ],

  merchant_admin: [
    // All staff permissions
    ...(['read:campaigns', 'read:vouchers', 'read:redemptions', 'read:analytics', 'redeem:vouchers'] as const),

    // Create/Update operations
    'create:campaigns',
    'update:campaigns',
    'create:vouchers',
    'update:vouchers',
    'delete:vouchers',

    // Team management
    'manage:team',
    'invite:users',
    'remove:users',

    // Settings
    'update:settings',
    'view:billing',
  ],

  merchant_owner: [
    // All admin permissions (simplified - in reality, enumerate all)
    '*', // Owner has all permissions
  ],
};

/**
 * Check if user has a specific permission
 *
 * Usage:
 * ```typescript
 * if (!hasPermission('read:campaigns')) {
 *   throw new ForbiddenError('No permission');
 * }
 * ```
 */
export function hasPermission(permission: string): boolean {
  try {
    const context = getTenantContext();
    const roles = context.userRoles;

    // Check if any role has this permission
    for (const role of roles) {
      const permissions = ROLE_PERMISSIONS[role] || [];

      // Check for wildcard permission
      if (permissions.includes('*')) {
        return true;
      }

      // Check exact permission
      if (permissions.includes(permission)) {
        return true;
      }
    }

    return false;
  } catch (error) {
    // No context means no permission
    return false;
  }
}

/**
 * Guard wrapper for permission checking
 *
 * Usage:
 * ```typescript
 * export const DELETE = requirePermission('delete:vouchers')(deleteHandler);
 * ```
 */
export function requirePermission(permission: string) {
  return (handler: (request: NextRequest) => Promise<Response>) => {
    return async (request: NextRequest): Promise<Response> => {
      if (!hasPermission(permission)) {
        return NextResponse.json(
          {
            ok: false,
            error: `Access denied. Required permission: ${permission}`,
          },
          { status: 403 }
        );
      }
      return handler(request);
    };
  };
}
