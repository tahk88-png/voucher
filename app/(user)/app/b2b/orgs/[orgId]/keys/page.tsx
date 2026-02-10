"use client"

import { useCallback, useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { WarmCard } from "@/components/warm-card"
import { WarmButton } from "@/components/warm-button"
import { Input } from "@/components/ui/input"

interface PartnerKey {
  id: string
  label?: string | null
  createdAt: string
  lastUsedAt?: string | null
}

export default function PartnerKeysPage() {
  const params = useParams()
  const orgId = typeof params?.orgId === "string" ? params.orgId : params?.orgId?.[0]

  const [keys, setKeys] = useState<PartnerKey[]>([])
  const [label, setLabel] = useState("")
  const [createdKey, setCreatedKey] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  const load = useCallback(async () => {
    if (!orgId) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/orgs/${orgId}/partner-keys`)
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Failed to load keys")
      setKeys(data.keys ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load keys")
    } finally {
      setLoading(false)
    }
  }, [orgId])

  useEffect(() => {
    load()
  }, [load])

  const handleCreate = async () => {
    if (!orgId) return
    setCreating(true)
    setCreatedKey(null)
    try {
      const res = await fetch(`/api/orgs/${orgId}/partner-keys`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: label.trim() || undefined }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Failed to create key")
      setCreatedKey(data.key)
      setLabel("")
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create key")
    } finally {
      setCreating(false)
    }
  }

  const handleRevoke = async (keyId: string) => {
    if (!orgId) return
    setError(null)
    try {
      const res = await fetch(`/api/orgs/${orgId}/partner-keys/${keyId}/revoke`, {
        method: "POST",
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Failed to revoke key")
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to revoke key")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#2D2721]">Partner API Keys</h1>
          <p className="text-[#6B5744]">Use these for partner voucher validation & redemption.</p>
        </div>
        <WarmButton asChild variant="outline" size="sm">
          <Link href={`/app/b2b/orgs/${orgId}`}>Back</Link>
        </WarmButton>
      </div>

      <WarmCard padding="lg" className="border border-[rgba(139,115,85,0.15)]">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="flex-1 space-y-1.5">
            <label htmlFor="partner-key-label" className="text-sm font-medium text-[#2D2721]">
              Key label (optional)
            </label>
            <Input
              id="partner-key-label"
              placeholder="Key label (optional)"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />
          </div>
          <WarmButton onClick={handleCreate} isLoading={creating}>
            Create key
          </WarmButton>
        </div>
        {createdKey && (
          <div className="mt-4 text-sm">
            <div className="text-xs text-[#8B7355] uppercase mb-1">New key (copy now)</div>
            <div className="p-3 bg-[#FFF9ED] border border-[rgba(139,115,85,0.15)] rounded-[12px] font-mono break-all">
              {createdKey}
            </div>
          </div>
        )}
      </WarmCard>

      {loading && <div className="text-sm text-[#8B7355]">Loading keys...</div>}
      {error && <div className="text-sm text-red-600">{error}</div>}

      <WarmCard padding="lg" className="border border-[rgba(139,115,85,0.15)]">
        <div className="space-y-3">
          {keys.length === 0 && !loading && <div className="text-sm text-[#8B7355]">No keys yet.</div>}
          {keys.map((key) => (
            <div key={key.id} className="flex items-center justify-between gap-3 text-sm border-b border-[#F0E2C9] pb-2">
              <div>
                <div className="font-medium text-[#2D2721]">{key.label || "Untitled key"}</div>
                <div className="text-xs text-[#8B7355]">
                  Created {new Date(key.createdAt).toLocaleDateString()}
                  {key.lastUsedAt ? ` • Last used ${new Date(key.lastUsedAt).toLocaleString()}` : ""}
                </div>
              </div>
              <WarmButton size="sm" variant="outline" onClick={() => handleRevoke(key.id)}>
                Revoke
              </WarmButton>
            </div>
          ))}
        </div>
      </WarmCard>
    </div>
  )
}
