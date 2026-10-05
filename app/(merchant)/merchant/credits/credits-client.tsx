"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { WarmCard } from "@/components/warm-card"
import { WarmButton } from "@/components/warm-button"
import { StatCard } from "@/components/stat-card"
import { Badge } from "@/components/ui/badge"
import { showError, showSuccess } from "@/lib/toast-helpers"
import { DollarSign, TrendingUp } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"

interface RevenueItem {
  id: string
  amount: number
  currency: string
  createdAt: string
  status: string
  type: "voucher" | "ticket"
}

interface PayoutRequest {
  id: string
  amount: number
  currency: string
  createdAt: string
  status: string
}

interface CreditsClientProps {
  merchantSlug: string
  currency: string
  availableBalance: number
  pendingBalance: number
  revenueHistory: RevenueItem[]
  payoutRequests: PayoutRequest[]
}

export default function CreditsClient({
  merchantSlug,
  currency,
  availableBalance,
  pendingBalance,
  revenueHistory,
  payoutRequests,
}: CreditsClientProps) {
  const t = useTranslations("merchantLegacy.credits")
  const locale = useLocale()
  const router = useRouter()
  const [isRequesting, setIsRequesting] = useState(false)
  const canRequest = availableBalance >= 10000 && !isRequesting

  const formatMoney = (value: number) =>
    new Intl.NumberFormat(locale, { style: "currency", currency }).format(value / 100)

  const formatDate = (value: string) =>
    new Date(value).toLocaleDateString(locale, {
      month: "long",
      day: "numeric",
      year: "numeric",
    })

  const statusLabel = (status: string) => {
    switch (status) {
      case "paid":
        return t("status.paid")
      case "pending":
        return t("status.pending")
      case "requested":
        return t("status.requested")
      case "completed":
        return t("status.completed")
      case "failed":
        return t("status.failed")
      default:
        return status
    }
  }

  const requestPayout = async () => {
    if (!canRequest) return
    setIsRequesting(true)
    try {
      const res = await fetch(`/api/merchant/${merchantSlug}/payouts/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: availableBalance }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data.error || t("requestFailed"))
      }
      showSuccess(t("requestSubmitted"))
      router.refresh()
    } catch (error) {
      showError(error instanceof Error ? error.message : t("requestFailed"))
    } finally {
      setIsRequesting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StatCard
          title={t("availableBalance")}
          value={formatMoney(availableBalance)}
          icon={DollarSign}
          description={t("availableBalanceHint")}
        />
        <StatCard
          title={t("pendingRevenue")}
          value={formatMoney(pendingBalance)}
          icon={TrendingUp}
          description={t("pendingRevenueHint")}
        />
      </div>

      <WarmCard padding="lg" className="bg-white border border-[rgba(139,115,85,0.15)]">
        <h2 className="text-base font-semibold text-[#2D2721]">{t("recentRevenue")}</h2>
        <div className="space-y-4 mt-4">
          {revenueHistory.length > 0 ? (
            revenueHistory.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between p-4 border border-[rgba(139,115,85,0.15)] rounded-lg"
              >
                <div>
                  <p className="font-medium text-[#2D2721]">{formatMoney(entry.amount)}</p>
                  <p className="text-sm text-[#6B5744]">
                    {formatDate(entry.createdAt)}{" "}
                    · {entry.type === "ticket" ? t("ticketSale") : t("voucherSale")}
                  </p>
                </div>
                <Badge variant="success">{statusLabel(entry.status)}</Badge>
              </div>
            ))
          ) : (
            <div className="text-center py-12 text-[#6B5744]">
              <p className="text-sm">{t("noRevenue")}</p>
            </div>
          )}
        </div>
      </WarmCard>

      <WarmCard padding="lg" className="bg-white border border-[rgba(139,115,85,0.15)]">
        <h2 className="text-base font-semibold text-[#2D2721]">{t("payoutRequests")}</h2>
        <div className="space-y-4 mt-4">
          {payoutRequests.length > 0 ? (
            payoutRequests.map((payout) => (
              <div
                key={payout.id}
                className="flex items-center justify-between p-4 border border-[rgba(139,115,85,0.15)] rounded-lg"
              >
                <div>
                  <p className="font-medium text-[#2D2721]">{formatMoney(payout.amount)}</p>
                  <p className="text-sm text-[#6B5744]">
                    {formatDate(payout.createdAt)}
                  </p>
                </div>
                <Badge variant={payout.status === "completed" ? "success" : "warning"}>
                  {statusLabel(payout.status)}
                </Badge>
              </div>
            ))
          ) : (
            <div className="text-center py-12 text-[#6B5744]">
              <p className="text-sm">{t("noPayoutRequests")}</p>
            </div>
          )}
        </div>
      </WarmCard>

      <WarmCard padding="lg" className="bg-white border border-[rgba(139,115,85,0.15)]">
        <h2 className="text-base font-semibold text-[#2D2721]">{t("requestPayoutHeading")}</h2>
        <p className="text-sm text-[#6B5744] mb-4 mt-2">{t("minimumPayout", { amount: formatMoney(10000) })}</p>
        <WarmButton disabled={!canRequest} onClick={requestPayout}>
          {isRequesting ? t("submitting") : t("requestPayout")}
        </WarmButton>
      </WarmCard>
    </div>
  )
}
