import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireOrgMembership } from "@/lib/b2b/auth";
import { hasOrgPermission, type OrgRoleType } from "@/lib/b2b/roles";
import { notFound, redirect } from "next/navigation";
import { WarmCard } from "@/components/warm-card";
import { pageMetadata } from "@/lib/seo/page-metadata";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
  const t = await getTranslations("b2b.billing");
  return pageMetadata({ title: t("metaTitle"), noIndex: true });
}

export default async function OrgBillingPage({
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
  if (!hasOrgPermission(role, "org.billing.read")) notFound();

  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { id: true, name: true, billingEmail: true, vatNumber: true, registryCode: true },
  });
  if (!org) notFound();

  const orders = await prisma.b2BOrder.findMany({
    where: { orgId },
    orderBy: { createdAt: "desc" },
    take: 20,
    include: { invoice: true },
  });

  const totalRevenue = orders
    .filter((o) => o.status === "paid")
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const t = await getTranslations("b2b.billing");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[var(--text)]">{t("title")}</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <WarmCard padding="lg">
          <p className="text-xs text-[var(--text-faint)] mb-1">{t("totalPaidOrders")}</p>
          <p className="text-2xl font-bold text-[var(--text)]">{orders.filter((o) => o.status === "paid").length}</p>
        </WarmCard>
        <WarmCard padding="lg">
          <p className="text-xs text-[var(--text-faint)] mb-1">{t("totalRevenue")}</p>
          <p className="text-2xl font-bold text-[var(--text)]">EUR {(totalRevenue / 100).toFixed(2)}</p>
        </WarmCard>
        <WarmCard padding="lg">
          <p className="text-xs text-[var(--text-faint)] mb-1">{t("vatNumber")}</p>
          <p className="text-lg font-semibold text-[var(--text)]">{org.vatNumber || t("notSet")}</p>
        </WarmCard>
      </div>

      <WarmCard padding="lg">
        <h2 className="text-lg font-semibold text-[var(--text)] mb-4">{t("recentOrders")}</h2>
        {orders.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">{t("noOrders")}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="text-left py-2 text-[var(--text-faint)] font-medium">{t("table.date")}</th>
                  <th className="text-left py-2 text-[var(--text-faint)] font-medium">{t("table.qty")}</th>
                  <th className="text-left py-2 text-[var(--text-faint)] font-medium">{t("table.total")}</th>
                  <th className="text-left py-2 text-[var(--text-faint)] font-medium">{t("table.status")}</th>
                  <th className="text-left py-2 text-[var(--text-faint)] font-medium">{t("table.invoice")}</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-b border-[var(--border)]">
                    <td className="py-2 text-[var(--text)]">{new Date(order.createdAt).toLocaleDateString()}</td>
                    <td className="py-2 text-[var(--text)]">{order.quantity}</td>
                    <td className="py-2 text-[var(--text)] font-medium">{order.currency} {(order.totalAmount / 100).toFixed(2)}</td>
                    <td className="py-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        order.status === "paid" ? "bg-green-100 text-green-700" :
                        order.status === "cancelled" ? "bg-red-100 text-red-700" :
                        "bg-amber-100 text-amber-700"
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="py-2 text-[var(--text-muted)]">
                      {order.invoice ? order.invoice.invoiceNumber : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </WarmCard>
    </div>
  );
}
