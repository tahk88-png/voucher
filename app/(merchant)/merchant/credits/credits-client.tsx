"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { WarmCard } from "@/components/warm-card"
import { WarmButton } from "@/components/warm-button"
import { StatCard } from "@/components/stat-card"
import { Badge } from "@/components/ui/badge"
import { showError, showSuccess } from "@/lib/toast-helpers"
import { DollarSign, TrendingUp } from "lucide-react"

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
  const router = useRouter()
  const [isRequesting, setIsRequesting] = useState(false)
  const canRequest = availableBalance >= 10000 && !isRequesting

  const formatMoney = (value: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency }).format(value / 100)

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
        throw new Error(data.error || "Failed to request payout")
      }
      showSuccess("Payout request submitted")
      router.refresh()
    } catch (error) {
      showError(error instanceof Error ? error.message : "Failed to request payout")
    } finally {
      setIsRequesting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StatCard
          title="Available Balance"
          value={formatMoney(availableBalance)}
          icon={DollarSign}
          description="Ready for payout"
        />
        <StatCard
          title="Pending Revenue"
          value={formatMoney(pendingBalance)}
          icon={TrendingUp}
          description="Processing"
        />
      </div>

      <WarmCard padding="lg" className="bg-white border border-[#E7DCC7]">
        <h2 className="text-base font-semibold text-[#2D2721]">Recent revenue</h2>
        <div className="space-y-4 mt-4">
          {revenueHistory.length > 0 ? (
            revenueHistory.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between p-4 border border-[#E7DCC7] rounded-lg"
              >
                <div>
                  <p className="font-medium text-[#2D2721]">{formatMoney(entry.amount)}</p>
                  <p className="text-sm text-[#6B5744]">
                    {new Date(entry.createdAt).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}{" "}
                    · {entry.type === "ticket" ? "Ticket sale" : "Voucher sale"}
                  </p>
                </div>
                <Badge variant="success">{entry.status}</Badge>
              </div>
            ))
          ) : (
            <div className="text-center py-12 text-[#6B5744]">
              <p className="text-sm">No revenue recorded yet</p>
            </div>
          )}
        </div>
      </WarmCard>

      <WarmCard padding="lg" className="bg-white border border-[#E7DCC7]">
        <h2 className="text-base font-semibold text-[#2D2721]">Payout requests</h2>
        <div className="space-y-4 mt-4">
          {payoutRequests.length > 0 ? (
            payoutRequests.map((payout) => (
              <div
                key={payout.id}
                className="flex items-center justify-between p-4 border border-[#E7DCC7] rounded-lg"
              >
                <div>
                  <p className="font-medium text-[#2D2721]">{formatMoney(payout.amount)}</p>
                  <p className="text-sm text-[#6B5744]">
                    {new Date(payout.createdAt).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <Badge variant={payout.status === "completed" ? "success" : "warning"}>
                  {payout.status}
                </Badge>
              </div>
            ))
          ) : (
            <div className="text-center py-12 text-[#6B5744]">
              <p className="text-sm">No payout requests yet</p>
            </div>
          )}
        </div>
      </WarmCard>

      <WarmCard padding="lg" className="bg-white border border-[#E7DCC7]">
        <h2 className="text-base font-semibold text-[#2D2721]">Request payout</h2>
        <p className="text-sm text-[#6B5744] mb-4 mt-2">Minimum payout amount: {formatMoney(10000)}</p>
        <WarmButton disabled={!canRequest} onClick={requestPayout}>
          {isRequesting ? "Submitting..." : "Request payout"}
        </WarmButton>
      </WarmCard>
    </div>
  )
}
