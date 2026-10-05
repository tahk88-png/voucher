import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireOrgMembership } from "@/lib/b2b/auth";
import { hasOrgPermission, ORG_ROLE_LABELS, type OrgRoleType } from "@/lib/b2b/roles";
import { getTranslations } from "next-intl/server";
import { notFound, redirect } from "next/navigation";
import { WarmCard } from "@/components/warm-card";
import { InviteMemberForm } from "@/components/b2b/invite-member-form";
import { pageMetadata } from "@/lib/seo/page-metadata";

export async function generateMetadata() {
  const t = await getTranslations("b2b.members");
  return pageMetadata({ title: t("metaTitle"), noIndex: true });
}

export default async function OrgMembersPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const membership = await requireOrgMembership(session.user.id, orgId);
  if (!membership) notFound();

  const role = membership.role as OrgRoleType;
  if (!hasOrgPermission(role, "org.members.manage")) notFound();

  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { id: true, name: true },
  });
  if (!org) notFound();

  const members = await prisma.orgMembership.findMany({
    where: { orgId },
    include: { user: { select: { id: true, name: true, email: true, image: true } } },
    orderBy: { createdAt: "asc" },
  });

  const pendingInvitations = await prisma.orgInvitation.findMany({
    where: { orgId, acceptedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });

  const t = await getTranslations("b2b");
  const roleLabel = (r: string) =>
    Object.prototype.hasOwnProperty.call(ORG_ROLE_LABELS, r) ? t(`roles.${r as OrgRoleType}`) : r;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[var(--text)]">{t("members.title")}</h1>
        <span className="text-sm text-[var(--text-muted)]">{t("members.count", { count: members.length })}</span>
      </div>

      {/* Only owners/admins can create invitations (enforced by the API too). */}
      {(role === "owner" || role === "admin") && <InviteMemberForm orgId={orgId} />}

      <WarmCard padding="lg">
        <div className="space-y-3">
          {members.map((m) => (
            <div key={m.id} className="flex items-center gap-3 py-2 border-b border-[var(--border)] last:border-0">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--primary-hover)] flex items-center justify-center text-sm font-bold text-white">
                {(m.user.name?.[0] ?? m.user.email?.[0] ?? "?").toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[var(--text)] truncate">{m.user.name || m.user.email}</p>
                <p className="text-xs text-[var(--text-muted)] truncate">{m.user.email}</p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                m.role === "owner" ? "bg-amber-100 text-amber-700" :
                m.role === "admin" ? "bg-blue-100 text-blue-700" :
                "bg-gray-100 text-gray-600"
              }`}>
                {roleLabel(m.role)}
              </span>
            </div>
          ))}
        </div>
      </WarmCard>

      {pendingInvitations.length > 0 && (
        <WarmCard padding="lg">
          <h2 className="text-lg font-semibold text-[var(--text)] mb-3">{t("members.pendingInvitations")}</h2>
          <div className="space-y-2">
            {pendingInvitations.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between py-2 border-b border-[var(--border)] last:border-0">
                <div>
                  <p className="text-sm font-medium text-[var(--text)]">{inv.email}</p>
                  <p className="text-xs text-[var(--text-faint)]">
                    {t("members.expires", { date: new Date(inv.expiresAt).toLocaleDateString() })}
                  </p>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">
                  {roleLabel(inv.role)}
                </span>
              </div>
            ))}
          </div>
        </WarmCard>
      )}
    </div>
  );
}
