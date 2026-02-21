import { Suspense } from "react"
import { prisma } from "@/lib/prisma"
import { StatsCard } from "@/components/ui/stats-card"
import { DollarSign, CreditCard, TrendingUp, AlertCircle } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

async function RevenueStatsContent({
  merchantId,
  merchantSlug,
  currency,
}: {
  merchantId: string
  merchantSlug: string
  currency: string
}) {
  const [
    totalCreditsIssued,
    totalRevenue,
    outstandingPurchases,
    ticketRevenue,
  ] = await Promise.all([
    prisma.creditLedger.aggregate({
      where: { merchantId },
      _sum: { amount: true },
    }),
    prisma.voucherPurchase.aggregate({
      where: {
        merchantId,
        status: "paid",
      },
      _sum: { amount: true },
    }),
    prisma.voucherPurchase.findMany({
      where: {
        merchantId,
        status: "paid",
        voucher: {
          redemptions: {
            none: {
              confirmedAt: { not: null },
            },
          },
        },
      },
      select: {
        voucher: {
          select: { value: true },
        },
      },
    }),
    prisma.ticketPurchase.aggregate({
      where: {
        merchantId,
        status: "paid",
      },
      _sum: { amount: true },
    }),
  ])

  const creditsIssued = totalCreditsIssued._sum.amount ?? 0
  const voucherRevenue = totalRevenue._sum.amount ?? 0

  const outstandingLiability = outstandingPurchases.reduce(
    (sum, purchase) => sum + (purchase.voucher?.value || 0),
    0
  )
  const ticketRevenueValue = ticketRevenue._sum.amount ?? 0

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatsCard
        title="Voucher Revenue"
        value={formatCurrency(voucherRevenue, currency)}
        description="Paid voucher sales"
        icon={DollarSign}
        href={`/merchant/${merchantSlug}/campaigns`}
        actionLabel="Open campaign sales"
      />
      <StatsCard
        title="Ticket Revenue"
        value={formatCurrency(ticketRevenueValue, currency)}
        description="Paid ticket sales"
        icon={TrendingUp}
        href={`/merchant/${merchantSlug}/events`}
        actionLabel="Open event sales"
      />
      <StatsCard
        title="Credits Issued"
        value={formatCurrency(creditsIssued, currency)}
        description="Total credits distributed"
        icon={CreditCard}
        href={`/merchant/${merchantSlug}/referrals`}
        actionLabel="Open referral credits"
      />
      <StatsCard
        title="Outstanding Liability"
        value={formatCurrency(outstandingLiability, currency)}
        description="Unredeemed voucher value"
        icon={AlertCircle}
        href={`/merchant/${merchantSlug}/vouchers`}
        actionLabel="Open voucher liability"
      />
    </div>
  )
}

function RevenueStatsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="h-32 animate-pulse rounded-[16px] bg-[#F8F6F1]"
        />
      ))}
    </div>
  )
}

export function RevenueStats({
  merchantId,
  merchantSlug,
  currency,
}: {
  merchantId: string
  merchantSlug: string
  currency: string
}) {
  return (
    <Suspense fallback={<RevenueStatsSkeleton />}>
      <RevenueStatsContent merchantId={merchantId} merchantSlug={merchantSlug} currency={currency} />
    </Suspense>
  )
}
