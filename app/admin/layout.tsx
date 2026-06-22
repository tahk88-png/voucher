import { requireAdminProfile } from "@/lib/admin/guards";
import { getAdminNavForRole } from "@/lib/admin/navigation";
import { AdminShell } from "@/components/navigation/admin-shell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await requireAdminProfile();
  const navItems = getAdminNavForRole(ctx.adminRole);

  return (
    <AdminShell adminRole={ctx.adminRole} email={ctx.email} navItems={navItems}>
      {children}
    </AdminShell>
  );
}
