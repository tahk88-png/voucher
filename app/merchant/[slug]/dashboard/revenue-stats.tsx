import { Suspense } from "react"
import { prisma } from "@/lib/prisma"
import { StatsCard } from "@/components/ui/stats-card"
import { DollarSign, CreditCard, TrendingUp, AlertCircle } from "lucide-react"
import { formatPrice } from "@/lib/currency-constants"
import { getTranslations } from "next-intl/server"

const formatCurrency = (minor: number, currency: string) => formatPrice(minor, currency.toUpperCase(), "en-GB")

async function RevenueStatsContent({
  merchantId,
  merchantSlug,
  currency,
}: {
  merchantId: string
  merchantSlug: string
  currency: string
}) {
  const t = await getTranslations("merchantDashboard.revenue")
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
        title={t("voucherRevenue")}
        value={formatCurrency(voucherRevenue, currency)}
        description={t("paidVoucherSales")}
        icon={DollarSign}
        href={`/merchant/${merchantSlug}/campaigns`}
        actionLabel={t("openCampaignSales")}
      />
      <StatsCard
        title={t("ticketRevenue")}
        value={formatCurrency(ticketRevenueValue, currency)}
        description={t("paidTicketSales")}
        icon={TrendingUp}
        href={`/merchant/${merchantSlug}/events`}
        actionLabel={t("openEventSales")}
      />
      <StatsCard
        title={t("creditsIssued")}
        value={formatCurrency(creditsIssued, currency)}
        description={t("totalCreditsDistributed")}
        icon={CreditCard}
        href={`/merchant/${merchantSlug}/referrals`}
        actionLabel={t("openReferralCredits")}
      />
      <StatsCard
        title={t("outstandingLiability")}
        value={formatCurrency(outstandingLiability, currency)}
        description={t("unredeemedValue")}
        icon={AlertCircle}
        href={`/merchant/${merchantSlug}/vouchers`}
        actionLabel={t("openVoucherLiability")}
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
