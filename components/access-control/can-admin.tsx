import { requireAdminProfile } from "@/lib/admin/guards";
import { hasAdminPermission, type AdminPermission } from "@/lib/admin/roles";

type Props = {
  permission: AdminPermission;
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

/**
 * Server component that conditionally renders children based on the
 * current admin user's sub-role permission. Only use inside /admin routes.
 */
export async function CanAdmin({ permission, children, fallback = null }: Props) {
  try {
    const ctx = await requireAdminProfile();
    if (!hasAdminPermission(ctx.adminRole, permission)) return <>{fallback}</>;
    return <>{children}</>;
  } catch {
    return <>{fallback}</>;
  }
}
