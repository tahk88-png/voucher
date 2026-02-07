"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { WarmCard } from "@/components/warm-card"
import { WarmButton } from "@/components/warm-button"
import { Input } from "@/components/ui/input"

interface OrgItem {
  id: string
  name: string
  type: string
  status: string
  role: string
}

interface CampaignItem {
  id: string
  name: string
  status: string
  valueType: string
  valueAmount: number
  currency: string
  usageType: string
}

interface VoucherItem {
  id: string
  code: string
  status: string
  remainingValueAmount?: number | null
  initialValueAmount: number
}

interface OrderItem {
  id: string
  status: string
  totalAmount: number
  currency: string
}

export default function B2BOrgDetailPage() {
  const params = useParams()
  const orgId = typeof params?.orgId === "string" ? params.orgId : params?.orgId?.[0]

  const [org, setOrg] = useState<OrgItem | null>(null)
  const [campaigns, setCampaigns] = useState<CampaignItem[]>([])
  const [vouchers, setVouchers] = useState<VoucherItem[]>([])
  const [orders, setOrders] = useState<OrderItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [campaignName, setCampaignName] = useState("")
  const [campaignValue, setCampaignValue] = useState(5000)
  const [campaignCurrency, setCampaignCurrency] = useState("EUR")
  const [creating, setCreating] = useState(false)

  const refresh = useCallback(async () => {
    if (!orgId) return
    setLoading(true)
    setError(null)
    try {
      const [orgRes, campaignRes, voucherRes, orderRes] = await Promise.all([
        fetch("/api/orgs"),
        fetch(`/api/orgs/${orgId}/campaigns`),
        fetch(`/api/orgs/${orgId}/vouchers`),
        fetch(`/api/orgs/${orgId}/orders`),
      ])

      const orgData = await orgRes.json()
      const campaignData = await campaignRes.json()
      const voucherData = await voucherRes.json()
      const orderData = await orderRes.json()

      if (!orgRes.ok) throw new Error(orgData?.error || "Failed to load org")
      if (!campaignRes.ok) throw new Error(campaignData?.error || "Failed to load campaigns")
      if (!voucherRes.ok) throw new Error(voucherData?.error || "Failed to load vouchers")
      if (!orderRes.ok) throw new Error(orderData?.error || "Failed to load orders")

      const orgMatch = (orgData.orgs ?? []).find((item: OrgItem) => item.id === orgId) ?? null
      setOrg(orgMatch)
      setCampaigns(campaignData.campaigns ?? [])
      setVouchers(voucherData.vouchers ?? [])
      setOrders(orderData.orders ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load")
    } finally {
      setLoading(false)
    }
  }, [orgId])

  useEffect(() => {
    refresh()
  }, [refresh])

  const totals = useMemo(() => {
    return {
      campaigns: campaigns.length,
      vouchers: vouchers.length,
      orders: orders.length,
    }
  }, [campaigns.length, vouchers.length, orders.length])

  const handleCreateCampaign = async () => {
    if (!orgId || !campaignName.trim()) return
    setCreating(true)
    try {
      const res = await fetch(`/api/orgs/${orgId}/campaigns`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: campaignName,
          valueType: "fixed",
          valueAmount: campaignValue,
          currency: campaignCurrency,
          usageType: "single",
          status: "active",
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Failed to create campaign")
      setCampaignName("")
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create campaign")
    } finally {
      setCreating(false)
    }
  }

  const handleBulkIssue = async (campaignId: string) => {
    if (!orgId) return
    setError(null)
    try {
      const res = await fetch(`/api/orgs/${orgId}/campaigns/${campaignId}/vouchers/bulk-create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: 10, activateNow: true }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Failed to issue vouchers")
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to issue vouchers")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#2D2721]">{org?.name ?? "Organization"}</h1>
          <p className="text-[#6B5744]">B2B workspace overview</p>
        </div>
        <div className="flex items-center gap-2">
          <WarmButton asChild variant="outline" size="sm">
            <Link href={`/app/b2b/orgs/${orgId}/audit`}>Audit</Link>
          </WarmButton>
          <WarmButton asChild variant="outline" size="sm">
            <Link href={`/app/b2b/orgs/${orgId}/keys`}>Partner Keys</Link>
          </WarmButton>
          <WarmButton asChild variant="outline" size="sm">
            <Link href="/app/b2b">Back to orgs</Link>
          </WarmButton>
        </div>
      </div>

      {loading && <div className="text-sm text-[#8B7355]">Loading workspace...</div>}
      {error && <div className="text-sm text-red-600">{error}</div>}

      <div className="grid gap-4 md:grid-cols-3">
        <WarmCard padding="lg" className="border border-[#E7DCC7]">
          <div className="text-xs text-[#8B7355] uppercase">Campaigns</div>
          <div className="text-2xl font-semibold text-[#2D2721] mt-2">{totals.campaigns}</div>
        </WarmCard>
        <WarmCard padding="lg" className="border border-[#E7DCC7]">
          <div className="text-xs text-[#8B7355] uppercase">Vouchers</div>
          <div className="text-2xl font-semibold text-[#2D2721] mt-2">{totals.vouchers}</div>
        </WarmCard>
        <WarmCard padding="lg" className="border border-[#E7DCC7]">
          <div className="text-xs text-[#8B7355] uppercase">Orders</div>
          <div className="text-2xl font-semibold text-[#2D2721] mt-2">{totals.orders}</div>
        </WarmCard>
      </div>

      <WarmCard padding="lg" className="border border-[#E7DCC7]">
        <h2 className="text-lg font-semibold text-[#2D2721] mb-4">Create campaign</h2>
        <div className="grid gap-3 md:grid-cols-4">
          <div className="space-y-1.5">
            <label htmlFor="b2b-campaign-name" className="text-sm font-medium text-[#2D2721]">
              Campaign name
            </label>
            <Input
              id="b2b-campaign-name"
              placeholder="Campaign name"
              value={campaignName}
              onChange={(e) => setCampaignName(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="b2b-campaign-value" className="text-sm font-medium text-[#2D2721]">
              Value (minor units)
            </label>
            <Input
              id="b2b-campaign-value"
              type="number"
              placeholder="Value (minor units)"
              value={campaignValue}
              onChange={(e) => setCampaignValue(Number(e.target.value))}
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="b2b-campaign-currency" className="text-sm font-medium text-[#2D2721]">
              Currency
            </label>
            <Input
              id="b2b-campaign-currency"
              placeholder="Currency"
              value={campaignCurrency}
              onChange={(e) => setCampaignCurrency(e.target.value.toUpperCase())}
            />
          </div>
          <WarmButton onClick={handleCreateCampaign} isLoading={creating}>
            Create
          </WarmButton>
        </div>
      </WarmCard>

      <WarmCard padding="lg" className="border border-[#E7DCC7]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[#2D2721]">Campaigns</h2>
        </div>
        <div className="space-y-3">
          {campaigns.length === 0 && <div className="text-sm text-[#8B7355]">No campaigns yet.</div>}
          {campaigns.map((campaign) => (
            <div key={campaign.id} className="border border-[#E7DCC7] rounded-[16px] p-4 flex items-center justify-between gap-3">
              <div>
                <div className="font-medium text-[#2D2721]">{campaign.name}</div>
                <div className="text-xs text-[#8B7355]">
                  {campaign.status} • {campaign.valueType} • {campaign.valueAmount} {campaign.currency}
                </div>
              </div>
              <WarmButton size="sm" variant="outline" onClick={() => handleBulkIssue(campaign.id)}>
                Issue 10 vouchers
              </WarmButton>
            </div>
          ))}
        </div>
      </WarmCard>

      <div className="grid gap-4 md:grid-cols-2">
        <WarmCard padding="lg" className="border border-[#E7DCC7]">
          <h2 className="text-lg font-semibold text-[#2D2721] mb-4">Recent Vouchers</h2>
          <div className="space-y-3">
            {vouchers.slice(0, 5).map((voucher) => (
              <div key={voucher.id} className="flex items-center justify-between text-sm">
                <div>
                  <div className="font-medium text-[#2D2721]">{voucher.code}</div>
                  <div className="text-xs text-[#8B7355]">{voucher.status}</div>
                </div>
                <div className="text-[#6B5744]">
                  {voucher.remainingValueAmount ?? voucher.initialValueAmount}
                </div>
              </div>
            ))}
            {vouchers.length === 0 && <div className="text-sm text-[#8B7355]">No vouchers issued.</div>}
          </div>
        </WarmCard>
        <WarmCard padding="lg" className="border border-[#E7DCC7]">
          <h2 className="text-lg font-semibold text-[#2D2721] mb-4">Recent Orders</h2>
          <div className="space-y-3">
            {orders.slice(0, 5).map((order) => (
              <div key={order.id} className="flex items-center justify-between text-sm">
                <div>
                  <div className="font-medium text-[#2D2721]">{order.id.slice(0, 8)}</div>
                  <div className="text-xs text-[#8B7355]">{order.status}</div>
                </div>
                <div className="text-[#6B5744]">
                  {order.totalAmount} {order.currency}
                </div>
              </div>
            ))}
            {orders.length === 0 && <div className="text-sm text-[#8B7355]">No orders yet.</div>}
          </div>
        </WarmCard>
      </div>
    </div>
  )
}
