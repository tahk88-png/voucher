import type { TenantMembershipRole } from "@/lib/access-control/roles";

const ROLE_RANK: Record<TenantMembershipRole, number> = {
  merchant_staff: 0,
  merchant_admin: 1,
};

type Props = {
  effectiveRole: TenantMembershipRole;
  requiredRole: TenantMembershipRole;
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

/**
 * Server or client component that conditionally renders children
 * based on the user's effective merchant role. The effectiveRole
 * is passed from the merchant layout (already resolved).
 */
export function CanMerchant({ effectiveRole, requiredRole, children, fallback = null }: Props) {
  if (ROLE_RANK[effectiveRole] < ROLE_RANK[requiredRole]) {
    return <>{fallback}</>;
  }
  return <>{children}</>;
}
