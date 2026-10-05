"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { useTranslations } from "next-intl"
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
  const t = useTranslations("b2b.workspace")
  const tc = useTranslations("common")
  const te = useTranslations("b2b.enums")
  const enumLabel = (group: string, value: string) =>
    te.has(`${group}.${value}`) ? te(`${group}.${value}`) : value
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

  // Edit campaign state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const [editValue, setEditValue] = useState(0)
  const [saving, setSaving] = useState(false)

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

      if (!orgRes.ok) throw new Error(orgData?.error || t("errors.loadOrg"))
      if (!campaignRes.ok) throw new Error(campaignData?.error || t("errors.loadCampaigns"))
      if (!voucherRes.ok) throw new Error(voucherData?.error || t("errors.loadVouchers"))
      if (!orderRes.ok) throw new Error(orderData?.error || t("errors.loadOrders"))

      const orgMatch = (orgData.orgs ?? []).find((item: OrgItem) => item.id === orgId) ?? null
      setOrg(orgMatch)
      setCampaigns(campaignData.campaigns ?? [])
      setVouchers(voucherData.vouchers ?? [])
      setOrders(orderData.orders ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errors.load"))
    } finally {
      setLoading(false)
    }
  }, [orgId, t])

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
      if (!res.ok) throw new Error(data?.error || t("errors.createCampaign"))
      setCampaignName("")
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errors.createCampaign"))
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
      if (!res.ok) throw new Error(data?.error || t("errors.issueVouchers"))
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errors.issueVouchers"))
    }
  }

  const startEditing = (campaign: CampaignItem) => {
    setEditingId(campaign.id)
    setEditName(campaign.name)
    setEditValue(campaign.valueAmount)
  }

  const handleSaveEdit = async () => {
    if (!orgId || !editingId || !editName.trim()) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/orgs/${orgId}/campaigns/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName, valueAmount: editValue }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || t("errors.updateCampaign"))
      setEditingId(null)
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errors.updateCampaign"))
    } finally {
      setSaving(false)
    }
  }

  const campaignActionError = (action: "activate" | "pause" | "archive") =>
    action === "activate"
      ? t("errors.activateCampaign")
      : action === "pause"
        ? t("errors.pauseCampaign")
        : t("errors.archiveCampaign")

  const handleCampaignAction = async (campaignId: string, action: "activate" | "pause" | "archive") => {
    if (!orgId) return
    setError(null)
    try {
      const res = await fetch(`/api/orgs/${orgId}/campaigns/${campaignId}/${action}`, {
        method: "POST",
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || campaignActionError(action))
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : campaignActionError(action))
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#2D2721]">{org?.name ?? t("fallbackName")}</h1>
          <p className="text-[#6B5744]">{t("subtitle")}</p>
        </div>
        <div className="flex items-center gap-2">
          <WarmButton asChild variant="outline" size="sm">
            <Link href={`/app/b2b/orgs/${orgId}/reports`}>{t("reports")}</Link>
          </WarmButton>
          <WarmButton asChild variant="outline" size="sm">
            <Link href={`/app/b2b/orgs/${orgId}/audit`}>{t("audit")}</Link>
          </WarmButton>
          <WarmButton asChild variant="outline" size="sm">
            <Link href={`/app/b2b/orgs/${orgId}/keys`}>{t("partnerKeys")}</Link>
          </WarmButton>
          <WarmButton asChild variant="outline" size="sm">
            <Link href="/app/b2b">{t("backToOrgs")}</Link>
          </WarmButton>
        </div>
      </div>

      {loading && <div className="text-sm text-[#8B7355]">{t("loading")}</div>}
      {error && <div className="text-sm text-red-600">{error}</div>}

      <div className="grid gap-4 md:grid-cols-3">
        <WarmCard padding="lg" className="border border-[rgba(139,115,85,0.15)]">
          <div className="text-xs text-[#8B7355] uppercase">{t("stats.campaigns")}</div>
          <div className="text-2xl font-semibold text-[#2D2721] mt-2">{totals.campaigns}</div>
        </WarmCard>
        <WarmCard padding="lg" className="border border-[rgba(139,115,85,0.15)]">
          <div className="text-xs text-[#8B7355] uppercase">{t("stats.vouchers")}</div>
          <div className="text-2xl font-semibold text-[#2D2721] mt-2">{totals.vouchers}</div>
        </WarmCard>
        <WarmCard padding="lg" className="border border-[rgba(139,115,85,0.15)]">
          <div className="text-xs text-[#8B7355] uppercase">{t("stats.orders")}</div>
          <div className="text-2xl font-semibold text-[#2D2721] mt-2">{totals.orders}</div>
        </WarmCard>
      </div>

      <WarmCard padding="lg" className="border border-[rgba(139,115,85,0.15)]">
        <h2 className="text-lg font-semibold text-[#2D2721] mb-4">{t("create.title")}</h2>
        <div className="grid gap-3 md:grid-cols-4">
          <div className="space-y-1.5">
            <label htmlFor="b2b-campaign-name" className="text-sm font-medium text-[#2D2721]">
              {t("create.name")}
            </label>
            <Input
              id="b2b-campaign-name"
              placeholder={t("create.name")}
              value={campaignName}
              onChange={(e) => setCampaignName(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="b2b-campaign-value" className="text-sm font-medium text-[#2D2721]">
              {t("create.value")}
            </label>
            <Input
              id="b2b-campaign-value"
              type="number"
              placeholder={t("create.value")}
              value={campaignValue}
              onChange={(e) => setCampaignValue(Number(e.target.value))}
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="b2b-campaign-currency" className="text-sm font-medium text-[#2D2721]">
              {t("create.currency")}
            </label>
            <Input
              id="b2b-campaign-currency"
              placeholder={t("create.currency")}
              value={campaignCurrency}
              onChange={(e) => setCampaignCurrency(e.target.value.toUpperCase())}
            />
          </div>
          <WarmButton onClick={handleCreateCampaign} isLoading={creating}>
            {t("create.submit")}
          </WarmButton>
        </div>
      </WarmCard>

      <WarmCard padding="lg" className="border border-[rgba(139,115,85,0.15)]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[#2D2721]">{t("campaigns.title")}</h2>
        </div>
        <div className="space-y-3">
          {campaigns.length === 0 && <div className="text-sm text-[#8B7355]">{t("campaigns.empty")}</div>}
          {campaigns.map((campaign) => (
            <div key={campaign.id} className="border border-[rgba(139,115,85,0.15)] rounded-[16px] p-4">
              {editingId === campaign.id ? (
                <div className="grid gap-3 md:grid-cols-4 items-end">
                  <div className="space-y-1.5">
                    <label className="text-xs text-[#8B7355]">{t("campaigns.name")}</label>
                    <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-[#8B7355]">{t("campaigns.value")}</label>
                    <Input type="number" value={editValue} onChange={(e) => setEditValue(Number(e.target.value))} />
                  </div>
                  <WarmButton size="sm" onClick={handleSaveEdit} isLoading={saving}>{tc("save")}</WarmButton>
                  <WarmButton size="sm" variant="outline" onClick={() => setEditingId(null)}>{tc("cancel")}</WarmButton>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-medium text-[#2D2721]">{campaign.name}</div>
                    <div className="text-xs text-[#8B7355]">
                      {enumLabel("campaignStatus", campaign.status)} &bull; {enumLabel("valueType", campaign.valueType)} &bull; {campaign.valueAmount} {campaign.currency}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {campaign.status === "draft" && (
                      <WarmButton size="sm" variant="outline" onClick={() => handleCampaignAction(campaign.id, "activate")}>{t("campaigns.activate")}</WarmButton>
                    )}
                    {campaign.status === "active" && (
                      <WarmButton size="sm" variant="outline" onClick={() => handleCampaignAction(campaign.id, "pause")}>{t("campaigns.pause")}</WarmButton>
                    )}
                    {campaign.status === "paused" && (
                      <WarmButton size="sm" variant="outline" onClick={() => handleCampaignAction(campaign.id, "activate")}>{t("campaigns.resume")}</WarmButton>
                    )}
                    {campaign.status !== "archived" && (
                      <WarmButton size="sm" variant="outline" onClick={() => handleCampaignAction(campaign.id, "archive")}>{t("campaigns.archive")}</WarmButton>
                    )}
                    <WarmButton size="sm" variant="outline" onClick={() => startEditing(campaign)}>{tc("edit")}</WarmButton>
                    <WarmButton size="sm" variant="outline" onClick={() => handleBulkIssue(campaign.id)}>{t("campaigns.issue", { count: 10 })}</WarmButton>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </WarmCard>

      <div className="grid gap-4 md:grid-cols-2">
        <WarmCard padding="lg" className="border border-[rgba(139,115,85,0.15)]">
          <h2 className="text-lg font-semibold text-[#2D2721] mb-4">{t("recentVouchers")}</h2>
          <div className="space-y-3">
            {vouchers.slice(0, 5).map((voucher) => (
              <div key={voucher.id} className="flex items-center justify-between text-sm">
                <div>
                  <div className="font-medium text-[#2D2721]">{voucher.code}</div>
                  <div className="text-xs text-[#8B7355]">{enumLabel("voucherStatus", voucher.status)}</div>
                </div>
                <div className="text-[#6B5744]">
                  {voucher.remainingValueAmount ?? voucher.initialValueAmount}
                </div>
              </div>
            ))}
            {vouchers.length === 0 && <div className="text-sm text-[#8B7355]">{t("noVouchers")}</div>}
          </div>
        </WarmCard>
        <WarmCard padding="lg" className="border border-[rgba(139,115,85,0.15)]">
          <h2 className="text-lg font-semibold text-[#2D2721] mb-4">{t("recentOrders")}</h2>
          <div className="space-y-3">
            {orders.slice(0, 5).map((order) => (
              <div key={order.id} className="flex items-center justify-between text-sm">
                <div>
                  <div className="font-medium text-[#2D2721]">{order.id.slice(0, 8)}</div>
                  <div className="text-xs text-[#8B7355]">{enumLabel("orderStatus", order.status)}</div>
                </div>
                <div className="text-[#6B5744]">
                  {order.totalAmount} {order.currency}
                </div>
              </div>
            ))}
            {orders.length === 0 && <div className="text-sm text-[#8B7355]">{t("noOrders")}</div>}
          </div>
        </WarmCard>
      </div>
    </div>
  )
}
