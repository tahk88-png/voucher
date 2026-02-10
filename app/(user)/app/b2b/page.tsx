"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { WarmCard } from "@/components/warm-card"
import { WarmButton } from "@/components/warm-button"

interface OrgItem {
  id: string
  name: string
  type: string
  status: string
  role: string
}

export default function B2BOrgsPage() {
  const [orgs, setOrgs] = useState<OrgItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch("/api/orgs")
        const data = await res.json()
        if (!res.ok) throw new Error(data?.error || "Failed to load orgs")
        if (active) setOrgs(data.orgs ?? [])
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "Failed to load orgs")
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => {
      active = false
    }
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#2D2721]">B2B Organizations</h1>
        <p className="text-[#6B5744]">Company workspaces with campaigns, vouchers, and orders.</p>
      </div>

      {loading && <div className="text-sm text-[#8B7355]">Loading organizations...</div>}
      {error && <div className="text-sm text-red-600">{error}</div>}

      {!loading && !error && orgs.length === 0 && (
        <WarmCard padding="lg" className="border border-[rgba(139,115,85,0.15)]">
          <div className="text-[#6B5744]">No organizations found. Ask an admin to invite you.</div>
        </WarmCard>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {orgs.map((org) => (
          <WarmCard key={org.id} padding="lg" className="border border-[rgba(139,115,85,0.15)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-[#2D2721]">{org.name}</h2>
                <div className="text-xs text-[#8B7355] uppercase tracking-wide mt-1">
                  {org.type} · {org.status} · {org.role}
                </div>
              </div>
              <WarmButton asChild size="sm">
                <Link href={`/app/b2b/orgs/${org.id}`}>Open</Link>
              </WarmButton>
            </div>
          </WarmCard>
        ))}
      </div>
    </div>
  )
}
