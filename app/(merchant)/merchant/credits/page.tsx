import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import CreditsClient from "./credits-client"
import { getMerchantRevenueSummary } from "@/lib/merchant-finance"
import { requireMerchantRole } from "@/lib/rbac"
import { WarmCard } from "@/components/warm-card"
import { WarmButton } from "@/components/warm-button"
import Link from "next/link"
import { Gift, Plus } from "lucide-react"

export default async function CreditsPage() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/login")
  }

  const member = await prisma.merchantMember.findFirst({
    where: { userId: session.user.id },
    include: { merchant: true },
    orderBy: { createdAt: "asc" },
  })

  if (!member?.merchant) {
    return (
      <WarmCard padding="lg" className="bg-white text-center border border-[rgba(139,115,85,0.15)]">
        <Gift className="h-12 w-12 mx-auto text-[#8B7355] mb-4" />
        <h3 className="text-lg font-semibold text-[#2D2721] mb-2">No merchant access</h3>
        <p className="text-sm text-[#6B5744] mb-4">
          Connect to a merchant account to view revenue and payouts.
        </p>
        <WarmButton asChild>
          <Link href="/campaigns">
            <span className="inline-flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Explore campaigns
            </span>
          </Link>
        </WarmButton>
      </WarmCard>
    )
  }

  const merchant = member.merchant
  await requireMerchantRole(session.user.id, merchant.id, "merchant_staff")

  const { paidTotal, pendingTotal } = await getMerchantRevenueSummary(merchant.id)

  const [voucherSales, ticketSales, payoutLogs] = await Promise.all([
    prisma.voucherPurchase.findMany({
      where: { merchantId: merchant.id, status: "paid" },
      select: { id: true, amount: true, currency: true, createdAt: true, status: true },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.ticketPurchase.findMany({
      where: { merchantId: merchant.id, status: "paid" },
      select: { id: true, amount: true, currency: true, createdAt: true, status: true },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.auditLog.findMany({
      where: { merchantId: merchant.id, action: "payout_request" },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ])

  const revenueHistory = [
    ...voucherSales.map((sale) => ({ ...sale, type: "voucher" as const })),
    ...ticketSales.map((sale) => ({ ...sale, type: "ticket" as const })),
  ]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 10)
    .map((sale) => ({
      id: sale.id,
      amount: sale.amount,
      currency: sale.currency,
      createdAt: sale.createdAt.toISOString(),
      status: sale.status,
      type: sale.type,
    }))

  const payoutRequests = payoutLogs.map((log) => {
    const payload = (log.payloadJson || {}) as { amount?: number; currency?: string; status?: string }
    return {
      id: log.id,
      amount: payload.amount ?? 0,
      currency: payload.currency ?? merchant.defaultCurrency,
      status: payload.status ?? "requested",
      createdAt: log.createdAt.toISOString(),
    }
  })

  return (
    <CreditsClient
      merchantSlug={merchant.slug}
      currency={merchant.defaultCurrency}
      availableBalance={paidTotal}
      pendingBalance={pendingTotal}
      revenueHistory={revenueHistory}
      payoutRequests={payoutRequests}
    />
  )
}
