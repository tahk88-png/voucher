import { auth } from "@/lib/auth";
import { resolveAccessProfile, profileHasPermission } from "@/lib/access-control/profile";
import type { AppPermission } from "@/lib/access-control/roles";

type Props = {
  permission: AppPermission;
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

/**
 * Server component that conditionally renders children based on the
 * current user's AppPermission. Zero extra DB queries — reuses
 * the profile resolution that layouts already perform.
 */
export async function Can({ permission, children, fallback = null }: Props) {
  const session = await auth();
  if (!session?.user?.id) return <>{fallback}</>;

  const profile = await resolveAccessProfile(session.user.id, session.user.email);
  if (!profile) return <>{fallback}</>;

  if (!profileHasPermission(profile, permission)) return <>{fallback}</>;

  return <>{children}</>;
}
