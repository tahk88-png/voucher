"use client";

type Props = {
  /** Permissions the user currently has */
  userPermissions: string[];
  /** Permission(s) required to render children */
  required: string | string[];
  /** Match mode: "any" = at least one, "all" = every one */
  mode?: "any" | "all";
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

/**
 * Client component for conditional rendering based on permissions.
 * The parent server component passes the resolved permission list.
 */
export function CanClient({ userPermissions, required, mode = "any", children, fallback = null }: Props) {
  const requiredArr = Array.isArray(required) ? required : [required];

  const allowed =
    mode === "all"
      ? requiredArr.every((p) => userPermissions.includes(p))
      : requiredArr.some((p) => userPermissions.includes(p));

  if (!allowed) return <>{fallback}</>;
  return <>{children}</>;
}
