"use client"

import { useCallback, useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { WarmCard } from "@/components/warm-card"
import { WarmButton } from "@/components/warm-button"
import { Input } from "@/components/ui/input"

interface RedemptionRow {
  id: string
  voucherId: string
  partnerOrg: { id: string; name: string }
  amountRedeemed: number
  currency: string
  status: string
  locationId: string | null
  createdAt: string
  campaignId: string
}

interface VoucherRow {
  id: string
  campaignId: string
  campaignName: string
  status: string
  valueType: string
  initialValue: number
  remainingValue: number | null
  currency: string
  redeemedCount: number
  issuedToEmail: string | null
  activatedAt: string | null
  expiresAt: string | null
  createdAt: string
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

type Tab = "redemptions" | "vouchers"

export default function B2BReportsPage() {
  const params = useParams()
  const orgId = typeof params?.orgId === "string" ? params.orgId : params?.orgId?.[0]

  const [tab, setTab] = useState<Tab>("redemptions")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Redemption state
  const [redemptions, setRedemptions] = useState<RedemptionRow[]>([])
  const [redemptionPagination, setRedemptionPagination] = useState<Pagination>({ page: 1, limit: 50, total: 0, totalPages: 0 })
  const [redemptionSummary, setRedemptionSummary] = useState({ totalRedemptions: 0, totalAmountRedeemed: 0 })
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")

  // Voucher state
  const [vouchers, setVouchers] = useState<VoucherRow[]>([])
  const [voucherPagination, setVoucherPagination] = useState<Pagination>({ page: 1, limit: 50, total: 0, totalPages: 0 })
  const [statusBreakdown, setStatusBreakdown] = useState<Record<string, number>>({})
  const [statusFilter, setStatusFilter] = useState("")

  const loadRedemptions = useCallback(async (page = 1) => {
    if (!orgId) return
    setLoading(true)
    setError(null)
    try {
      const qs = new URLSearchParams({ page: String(page), limit: "50" })
      if (fromDate) qs.set("from", fromDate)
      if (toDate) qs.set("to", toDate)
      const res = await fetch(`/api/orgs/${orgId}/reports/redemptions?${qs}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Failed to load")
      setRedemptions(data.redemptions)
      setRedemptionPagination(data.pagination)
      setRedemptionSummary(data.summary)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load")
    } finally {
      setLoading(false)
    }
  }, [orgId, fromDate, toDate])

  const loadVouchers = useCallback(async (page = 1) => {
    if (!orgId) return
    setLoading(true)
    setError(null)
    try {
      const qs = new URLSearchParams({ page: String(page), limit: "50" })
      if (statusFilter) qs.set("status", statusFilter)
      const res = await fetch(`/api/orgs/${orgId}/reports/vouchers?${qs}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Failed to load")
      setVouchers(data.vouchers)
      setVoucherPagination(data.pagination)
      setStatusBreakdown(data.statusBreakdown)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load")
    } finally {
      setLoading(false)
    }
  }, [orgId, statusFilter])

  useEffect(() => {
    if (tab === "redemptions") loadRedemptions()
    else loadVouchers()
  }, [tab, loadRedemptions, loadVouchers])

  const formatAmount = (amount: number, currency: string) => {
    return `${(amount / 100).toFixed(2)} ${currency}`
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#2D2721]">Reports</h1>
          <p className="text-[#6B5744]">Redemption and voucher reports</p>
        </div>
        <WarmButton asChild variant="outline" size="sm">
          <Link href={`/app/b2b/orgs/${orgId}`}>Back to workspace</Link>
        </WarmButton>
      </div>

      {error && <div className="text-sm text-red-600">{error}</div>}

      {/* Tab Switcher */}
      <div className="flex gap-2">
        <WarmButton variant={tab === "redemptions" ? "default" : "outline"} size="sm" onClick={() => setTab("redemptions")}>
          Redemptions
        </WarmButton>
        <WarmButton variant={tab === "vouchers" ? "default" : "outline"} size="sm" onClick={() => setTab("vouchers")}>
          Vouchers
        </WarmButton>
      </div>

      {/* Redemptions Tab */}
      {tab === "redemptions" && (
        <>
          {/* Summary */}
          <div className="grid gap-4 md:grid-cols-2">
            <WarmCard padding="lg" className="border border-[rgba(139,115,85,0.15)]">
              <div className="text-xs text-[#8B7355] uppercase">Total Redemptions</div>
              <div className="text-2xl font-semibold text-[#2D2721] mt-2">{redemptionSummary.totalRedemptions}</div>
            </WarmCard>
            <WarmCard padding="lg" className="border border-[rgba(139,115,85,0.15)]">
              <div className="text-xs text-[#8B7355] uppercase">Total Amount Redeemed</div>
              <div className="text-2xl font-semibold text-[#2D2721] mt-2">{formatAmount(redemptionSummary.totalAmountRedeemed, "EUR")}</div>
            </WarmCard>
          </div>

          {/* Filters */}
          <WarmCard padding="lg" className="border border-[rgba(139,115,85,0.15)]">
            <div className="grid gap-3 md:grid-cols-3">
              <div className="space-y-1.5">
                <label htmlFor="from-date" className="text-sm font-medium text-[#2D2721]">From</label>
                <Input id="from-date" type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="to-date" className="text-sm font-medium text-[#2D2721]">To</label>
                <Input id="to-date" type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
              </div>
              <WarmButton onClick={() => loadRedemptions(1)} className="self-end">Filter</WarmButton>
            </div>
          </WarmCard>

          {/* Redemption Table */}
          <WarmCard padding="lg" className="border border-[rgba(139,115,85,0.15)]">
            {loading && <div className="text-sm text-[#8B7355]">Loading...</div>}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[rgba(139,115,85,0.15)] text-left">
                    <th className="p-2 text-[#8B7355] font-medium">Date</th>
                    <th className="p-2 text-[#8B7355] font-medium">Partner</th>
                    <th className="p-2 text-[#8B7355] font-medium">Amount</th>
                    <th className="p-2 text-[#8B7355] font-medium">Status</th>
                    <th className="p-2 text-[#8B7355] font-medium">Location</th>
                  </tr>
                </thead>
                <tbody>
                  {redemptions.map((r) => (
                    <tr key={r.id} className="border-b border-[rgba(139,115,85,0.08)]">
                      <td className="p-2 text-[#2D2721]">{new Date(r.createdAt).toLocaleDateString()}</td>
                      <td className="p-2 text-[#2D2721]">{r.partnerOrg.name}</td>
                      <td className="p-2 text-[#2D2721]">{formatAmount(r.amountRedeemed, r.currency)}</td>
                      <td className="p-2"><span className={`px-2 py-0.5 rounded text-xs ${r.status === "approved" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>{r.status}</span></td>
                      <td className="p-2 text-[#6B5744]">{r.locationId ?? "-"}</td>
                    </tr>
                  ))}
                  {!loading && redemptions.length === 0 && (
                    <tr><td colSpan={5} className="p-4 text-center text-[#8B7355]">No redemptions found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {redemptionPagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-xs text-[#8B7355]">
                  Page {redemptionPagination.page} of {redemptionPagination.totalPages} ({redemptionPagination.total} total)
                </div>
                <div className="flex gap-2">
                  <WarmButton size="sm" variant="outline" disabled={redemptionPagination.page <= 1} onClick={() => loadRedemptions(redemptionPagination.page - 1)}>
                    Previous
                  </WarmButton>
                  <WarmButton size="sm" variant="outline" disabled={redemptionPagination.page >= redemptionPagination.totalPages} onClick={() => loadRedemptions(redemptionPagination.page + 1)}>
                    Next
                  </WarmButton>
                </div>
              </div>
            )}
          </WarmCard>
        </>
      )}

      {/* Vouchers Tab */}
      {tab === "vouchers" && (
        <>
          {/* Status Breakdown */}
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
            {Object.entries(statusBreakdown).map(([status, count]) => (
              <WarmCard key={status} padding="lg" className="border border-[rgba(139,115,85,0.15)] cursor-pointer" onClick={() => setStatusFilter(status === statusFilter ? "" : status)}>
                <div className="text-xs text-[#8B7355] uppercase">{status}</div>
                <div className={`text-2xl font-semibold mt-2 ${status === statusFilter ? "text-[#8B4513]" : "text-[#2D2721]"}`}>{count}</div>
              </WarmCard>
            ))}
          </div>

          {/* Voucher Table */}
          <WarmCard padding="lg" className="border border-[rgba(139,115,85,0.15)]">
            {loading && <div className="text-sm text-[#8B7355]">Loading...</div>}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[rgba(139,115,85,0.15)] text-left">
                    <th className="p-2 text-[#8B7355] font-medium">Campaign</th>
                    <th className="p-2 text-[#8B7355] font-medium">Status</th>
                    <th className="p-2 text-[#8B7355] font-medium">Type</th>
                    <th className="p-2 text-[#8B7355] font-medium">Value</th>
                    <th className="p-2 text-[#8B7355] font-medium">Remaining</th>
                    <th className="p-2 text-[#8B7355] font-medium">Redeemed</th>
                    <th className="p-2 text-[#8B7355] font-medium">Issued To</th>
                    <th className="p-2 text-[#8B7355] font-medium">Expires</th>
                  </tr>
                </thead>
                <tbody>
                  {vouchers.map((v) => (
                    <tr key={v.id} className="border-b border-[rgba(139,115,85,0.08)]">
                      <td className="p-2 text-[#2D2721]">{v.campaignName}</td>
                      <td className="p-2">
                        <span className={`px-2 py-0.5 rounded text-xs ${
                          v.status === "active" ? "bg-green-100 text-green-800" :
                          v.status === "redeemed" ? "bg-blue-100 text-blue-800" :
                          v.status === "expired" ? "bg-yellow-100 text-yellow-800" :
                          v.status === "voided" ? "bg-red-100 text-red-800" :
                          "bg-gray-100 text-gray-800"
                        }`}>{v.status}</span>
                      </td>
                      <td className="p-2 text-[#6B5744]">{v.valueType}</td>
                      <td className="p-2 text-[#2D2721]">{formatAmount(v.initialValue, v.currency)}</td>
                      <td className="p-2 text-[#2D2721]">{v.remainingValue != null ? formatAmount(v.remainingValue, v.currency) : "-"}</td>
                      <td className="p-2 text-[#2D2721]">{v.redeemedCount}</td>
                      <td className="p-2 text-[#6B5744]">{v.issuedToEmail ?? "-"}</td>
                      <td className="p-2 text-[#6B5744]">{v.expiresAt ? new Date(v.expiresAt).toLocaleDateString() : "-"}</td>
                    </tr>
                  ))}
                  {!loading && vouchers.length === 0 && (
                    <tr><td colSpan={8} className="p-4 text-center text-[#8B7355]">No vouchers found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {voucherPagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-xs text-[#8B7355]">
                  Page {voucherPagination.page} of {voucherPagination.totalPages} ({voucherPagination.total} total)
                </div>
                <div className="flex gap-2">
                  <WarmButton size="sm" variant="outline" disabled={voucherPagination.page <= 1} onClick={() => loadVouchers(voucherPagination.page - 1)}>
                    Previous
                  </WarmButton>
                  <WarmButton size="sm" variant="outline" disabled={voucherPagination.page >= voucherPagination.totalPages} onClick={() => loadVouchers(voucherPagination.page + 1)}>
                    Next
                  </WarmButton>
                </div>
              </div>
            )}
          </WarmCard>
        </>
      )}
    </div>
  )
}
