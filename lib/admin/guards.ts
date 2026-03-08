/**
 * Admin auth guard middleware.
 *
 * Provides functions to verify admin sessions, check granular permissions,
 * and enforce step-up re-authentication for destructive actions.
 */

import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isPlatformAdmin } from '@/lib/admin';
import { AccessControlError } from '@/lib/access-control/guards';
import { StepUpRequiredError } from '@/lib/error-handler';
import {
  type AdminRoleType,
  type AdminPermission,
  ADMIN_ROLE_PERMISSIONS,
  hasAdminPermission,
  isStepUpRequired,
} from './roles';
import { verifyStepUpToken } from './step-up';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AdminContext = {
  userId: string;
  email: string;
  adminRole: AdminRoleType;
  permissions: readonly AdminPermission[];
};

// ---------------------------------------------------------------------------
// Guards
// ---------------------------------------------------------------------------

/**
 * Require that the current request comes from an authenticated admin user.
 *
 * Resolution order:
 * 1. Check session via `auth()`.
 * 2. Look up User record and its `adminRole` field.
 * 3. If `adminRole` is null but `isPlatformAdmin(email)` returns true,
 *    treat the user as `super_admin` (backward-compat with env-based config).
 *
 * @throws AccessControlError 401 if no session / user not found.
 * @throws AccessControlError 403 if user is not an admin.
 */
export async function requireAdminProfile(): Promise<AdminContext> {
  const session = await auth();

  if (!session?.user?.id || !session?.user?.email) {
    throw new AccessControlError(
      'Authentication required.',
      401,
      'AUTH_REQUIRED',
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, adminRole: true },
  });

  if (!user) {
    throw new AccessControlError(
      'User account not found.',
      401,
      'AUTH_PROFILE_NOT_FOUND',
    );
  }

  let adminRole: AdminRoleType | null = user.adminRole as AdminRoleType | null;

  // Fallback: env-based platform admin list -> super_admin
  if (!adminRole && isPlatformAdmin(user.email)) {
    adminRole = 'super_admin';
  }

  if (!adminRole) {
    throw new AccessControlError(
      'Admin access required.',
      403,
      'ADMIN_ACCESS_DENIED',
    );
  }

  const permissions = ADMIN_ROLE_PERMISSIONS[adminRole];

  return {
    userId: user.id,
    email: user.email,
    adminRole,
    permissions,
  };
}

/**
 * Require that the current admin has a specific permission.
 *
 * If the permission is in the step-up list, also verifies that a valid
 * step-up token is present in the `X-Admin-Step-Up-Token` request header.
 *
 * @throws AccessControlError 401/403 (via requireAdminProfile)
 * @throws AccessControlError 403 if permission is missing
 * @throws StepUpRequiredError 428 if step-up token is missing/invalid
 */
export async function requireAdminPermission(
  permission: AdminPermission,
): Promise<AdminContext> {
  const ctx = await requireAdminProfile();

  if (!hasAdminPermission(ctx.adminRole, permission)) {
    throw new AccessControlError(
      'You do not have permission to perform this action.',
      403,
      'ADMIN_PERMISSION_DENIED',
      { permission, role: ctx.adminRole },
    );
  }

  // Step-up check for high-privilege actions
  if (isStepUpRequired(permission)) {
    const headerStore = await headers();
    const stepUpToken = headerStore.get('x-admin-step-up-token');

    if (!stepUpToken) {
      throw new StepUpRequiredError(
        'Step-up authentication required for this action.',
        { permission },
      );
    }

    await requireStepUpAuth(stepUpToken, ctx.userId);
  }

  return ctx;
}

/**
 * Verify a step-up re-authentication token.
 *
 * @throws StepUpRequiredError if the token is invalid or expired.
 */
export async function requireStepUpAuth(
  token: string,
  userId: string,
): Promise<void> {
  const valid = await verifyStepUpToken(userId, token);

  if (!valid) {
    throw new StepUpRequiredError(
      'Step-up token is invalid or has expired.',
    );
  }
}
