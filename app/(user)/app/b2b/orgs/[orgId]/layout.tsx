import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { requireOrgMembership } from "@/lib/b2b/auth";
import { getOrgNavForRole } from "@/lib/b2b/navigation";
import type { OrgRoleType } from "@/lib/b2b/roles";
import { B2bOrgNav } from "@/components/navigation/b2b-org-nav";

export default async function OrgLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const membership = await requireOrgMembership(session.user.id, orgId);
  if (!membership) notFound();

  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { id: true, name: true },
  });
  if (!org) notFound();

  const orgRole = membership.role as OrgRoleType;
  const navItems = getOrgNavForRole(orgRole);

  return (
    <div>
      <B2bOrgNav
        orgId={org.id}
        orgName={org.name}
        orgRole={orgRole}
        navItems={navItems}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {children}
      </div>
    </div>
  );
}
