'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { DollarSign, Plus, Trash2, ToggleLeft, ToggleRight } from 'lucide-react'
import { WarmCard } from '@/components/warm-card'
import { WarmButton } from '@/components/warm-button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type PricingRule = {
  id: string
  merchantId: string
  ruleType: string
  config: Record<string, unknown>
  voucherId: string | null
  campaignId: string | null
  isActive: boolean
  priority: number
  createdAt: string
}

const RULE_TYPES = [
  { value: 'demand', label: 'Demand-based', desc: 'Adjust price based on view/purchase ratio' },
  { value: 'time_of_day', label: 'Time of Day', desc: 'Peak vs off-peak hour pricing' },
  { value: 'inventory', label: 'Inventory', desc: 'Price changes based on remaining stock' },
  { value: 'surge', label: 'Surge', desc: 'Special events/holidays markup' },
  { value: 'loyalty', label: 'Loyalty', desc: 'Discounts for repeat customers' },
]

const DEFAULT_CONFIGS: Record<string, Record<string, unknown>> = {
  demand: { threshold: 50, highDemandMultiplier: 1.1, lowDemandMultiplier: 0.95 },
  time_of_day: { peakHours: [11, 12, 13, 14, 18, 19, 20], multiplier: 1.15, offPeakMultiplier: 0.9 },
  inventory: { lowInventoryThreshold: 5, lowInventoryMultiplier: 1.2, highInventoryThreshold: 100, highInventoryMultiplier: 0.9 },
  surge: { surgeMultiplier: 1.25, surgeDaysOfWeek: [0, 6], surgeDates: [] },
  loyalty: { loyaltyDiscount: 10, minPurchases: 3 },
}

export default function PricingRulesPage() {
  const params = useParams()
  const slug = params.slug as string
  const [rules, setRules] = useState<PricingRule[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Create form
  const [newRuleType, setNewRuleType] = useState('demand')
  const [newPriority, setNewPriority] = useState('0')
  const [newConfigJson, setNewConfigJson] = useState(JSON.stringify(DEFAULT_CONFIGS.demand, null, 2))

  // Preview
  const [previewPrice, setPreviewPrice] = useState('')
  const [previewResult, setPreviewResult] = useState<any>(null)

  const fetchRules = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/merchant/${slug}/pricing-rules`)
      if (res.ok) {
        const data = await res.json()
        setRules(data.rules ?? [])
      }
    } finally {
      setLoading(false)
    }
  }, [slug])

  useEffect(() => { fetchRules() }, [fetchRules])

  async function toggleRule(rule: PricingRule) {
    setActionLoading(rule.id)
    try {
      await fetch(`/api/merchant/${slug}/pricing-rules/${rule.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !rule.isActive }),
      })
      fetchRules()
    } finally {
      setActionLoading(null)
    }
  }

  async function deleteRule(id: string) {
    if (!confirm('Delete this pricing rule?')) return
    setActionLoading(id)
    try {
      await fetch(`/api/merchant/${slug}/pricing-rules/${id}`, { method: 'DELETE' })
      fetchRules()
    } finally {
      setActionLoading(null)
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    let config: Record<string, unknown>
    try {
      config = JSON.parse(newConfigJson)
    } catch {
      alert('Invalid JSON config')
      return
    }

    setActionLoading('create')
    try {
      const res = await fetch(`/api/merchant/${slug}/pricing-rules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ruleType: newRuleType,
          config,
          priority: Number(newPriority) || 0,
        }),
      })
      if (res.ok) {
        setShowCreate(false)
        setNewRuleType('demand')
        setNewConfigJson(JSON.stringify(DEFAULT_CONFIGS.demand, null, 2))
        setNewPriority('0')
        fetchRules()
      }
    } finally {
      setActionLoading(null)
    }
  }

  function handleRuleTypeChange(type: string) {
    setNewRuleType(type)
    setNewConfigJson(JSON.stringify(DEFAULT_CONFIGS[type] ?? {}, null, 2))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <DollarSign className="h-6 w-6 text-[var(--primary)]" />
          <h1 className="text-2xl font-bold text-[var(--text)]">Dynamic Pricing</h1>
        </div>
        <WarmButton size="sm" onClick={() => setShowCreate(!showCreate)}>
          <Plus className="h-4 w-4" />
          New Rule
        </WarmButton>
      </div>

      {showCreate && (
        <WarmCard>
          <form onSubmit={handleCreate} className="space-y-4">
            <h2 className="text-lg font-semibold text-[var(--text)]">Create Pricing Rule</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Rule Type</Label>
                <select
                  value={newRuleType}
                  onChange={(e) => handleRuleTypeChange(e.target.value)}
                  className="w-full rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[var(--text)]"
                >
                  {RULE_TYPES.map((rt) => (
                    <option key={rt.value} value={rt.value}>
                      {rt.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  {RULE_TYPES.find((rt) => rt.value === newRuleType)?.desc}
                </p>
              </div>
              <div>
                <Label>Priority</Label>
                <Input
                  type="number"
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value)}
                  placeholder="Higher = applied first"
                />
              </div>
            </div>

            <div>
              <Label>Configuration (JSON)</Label>
              <textarea
                value={newConfigJson}
                onChange={(e) => setNewConfigJson(e.target.value)}
                rows={6}
                className="w-full rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[var(--text)] font-mono text-sm"
              />
            </div>

            <div className="flex gap-2">
              <WarmButton type="submit" size="sm" isLoading={actionLoading === 'create'}>
                Create Rule
              </WarmButton>
              <WarmButton type="button" variant="ghost" size="sm" onClick={() => setShowCreate(false)}>
                Cancel
              </WarmButton>
            </div>
          </form>
        </WarmCard>
      )}

      {loading ? (
        <p className="text-[var(--text-muted)]">Loading rules...</p>
      ) : rules.length === 0 ? (
        <WarmCard>
          <p className="text-center text-[var(--text-muted)] py-8">
            No pricing rules yet. Create one to enable dynamic pricing.
          </p>
        </WarmCard>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="text-left py-3 px-4 text-[var(--text-muted)] font-medium">Type</th>
                <th className="text-left py-3 px-4 text-[var(--text-muted)] font-medium">Priority</th>
                <th className="text-left py-3 px-4 text-[var(--text-muted)] font-medium">Config</th>
                <th className="text-left py-3 px-4 text-[var(--text-muted)] font-medium">Status</th>
                <th className="text-right py-3 px-4 text-[var(--text-muted)] font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rules.map((rule) => {
                const typeInfo = RULE_TYPES.find((rt) => rt.value === rule.ruleType)
                return (
                  <tr key={rule.id} className="border-b border-[var(--border)] hover:bg-[var(--surface-dim)]">
                    <td className="py-3 px-4">
                      <span className="font-medium text-[var(--text)]">
                        {typeInfo?.label ?? rule.ruleType}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[var(--text-muted)]">{rule.priority}</td>
                    <td className="py-3 px-4">
                      <code className="text-xs bg-[var(--surface-dim)] px-2 py-1 rounded text-[var(--text-muted)]">
                        {JSON.stringify(rule.config).slice(0, 60)}
                        {JSON.stringify(rule.config).length > 60 ? '...' : ''}
                      </code>
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => toggleRule(rule)}
                        disabled={actionLoading === rule.id}
                        className="flex items-center gap-1 text-sm"
                      >
                        {rule.isActive ? (
                          <>
                            <ToggleRight className="h-5 w-5 text-green-600" />
                            <span className="text-green-600">Active</span>
                          </>
                        ) : (
                          <>
                            <ToggleLeft className="h-5 w-5 text-[var(--text-muted)]" />
                            <span className="text-[var(--text-muted)]">Inactive</span>
                          </>
                        )}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <WarmButton
                        size="icon"
                        variant="ghost"
                        onClick={() => deleteRule(rule.id)}
                        disabled={actionLoading === rule.id}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </WarmButton>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Price preview section */}
      <WarmCard>
        <h2 className="text-lg font-semibold text-[var(--text)] mb-3">Price Preview</h2>
        <p className="text-sm text-[var(--text-muted)] mb-3">
          Enter a voucher ID to see how active rules would affect its price.
        </p>
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <Label>Voucher ID</Label>
            <Input
              value={previewPrice}
              onChange={(e) => setPreviewPrice(e.target.value)}
              placeholder="Enter voucher ID"
            />
          </div>
          <WarmButton
            size="sm"
            variant="secondary"
            onClick={async () => {
              if (!previewPrice.trim()) return
              const res = await fetch(`/api/pricing/calculate?voucherId=${encodeURIComponent(previewPrice.trim())}`)
              if (res.ok) {
                const data = await res.json()
                setPreviewResult(data.price)
              } else {
                setPreviewResult({ error: 'Could not calculate price' })
              }
            }}
          >
            Calculate
          </WarmButton>
        </div>

        {previewResult && !previewResult.error && (
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-[var(--text-muted)]">Base Price</span>
              <span className="text-[var(--text)] font-mono">{previewResult.basePrice}</span>
            </div>
            {previewResult.adjustments?.map((adj: any, i: number) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="text-[var(--text-muted)]">{adj.reason}</span>
                <span className={`font-mono ${adj.amount >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {adj.amount >= 0 ? '+' : ''}{adj.amount}
                </span>
              </div>
            ))}
            <div className="flex items-center justify-between text-sm font-semibold border-t border-[var(--border)] pt-2">
              <span className="text-[var(--text)]">Final Price</span>
              <span className="text-[var(--text)] font-mono">{previewResult.finalPrice}</span>
            </div>
          </div>
        )}

        {previewResult?.error && (
          <p className="mt-3 text-sm text-red-600">{previewResult.error}</p>
        )}
      </WarmCard>
    </div>
  )
}
