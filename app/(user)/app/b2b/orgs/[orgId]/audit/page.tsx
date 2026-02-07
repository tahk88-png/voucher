"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { WarmCard } from "@/components/warm-card"
import { WarmButton } from "@/components/warm-button"
import { Input } from "@/components/ui/input"

interface AuditEvent {
  id: string
  entityType: string
  entityId: string
  eventType: string
  actorType: string
  createdAt: string
}

export default function B2BAuditPage() {
  const params = useParams()
  const orgId = typeof params?.orgId === "string" ? params.orgId : params?.orgId?.[0]

  const [events, setEvents] = useState<AuditEvent[]>([])
  const [entityType, setEntityType] = useState("")
  const [entityId, setEntityId] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!orgId) return
    let active = true
    async function load() {
      setLoading(true)
      setError(null)
      const params = new URLSearchParams()
      if (entityType) params.set("entityType", entityType)
      if (entityId) params.set("entityId", entityId)

      try {
        const res = await fetch(`/api/orgs/${orgId}/audit?${params.toString()}`)
        const data = await res.json()
        if (!res.ok) throw new Error(data?.error || "Failed to load audit")
        if (active) setEvents(data.events ?? [])
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "Failed to load audit")
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => {
      active = false
    }
  }, [orgId, entityType, entityId])

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#2D2721]">Audit Log</h1>
          <p className="text-[#6B5744]">Track voucher lifecycle and changes.</p>
        </div>
        <WarmButton asChild variant="outline" size="sm">
          <Link href={`/app/b2b/orgs/${orgId}`}>Back</Link>
        </WarmButton>
      </div>

      <WarmCard padding="lg" className="border border-[#E7DCC7]">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="space-y-1.5">
            <label htmlFor="audit-entity-type" className="text-sm font-medium text-[#2D2721]">
              Entity type (voucher, campaign, order)
            </label>
            <Input
              id="audit-entity-type"
              placeholder="Entity type (voucher, campaign, order)"
              value={entityType}
              onChange={(e) => setEntityType(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="audit-entity-id" className="text-sm font-medium text-[#2D2721]">
              Entity ID
            </label>
            <Input
              id="audit-entity-id"
              placeholder="Entity ID"
              value={entityId}
              onChange={(e) => setEntityId(e.target.value)}
            />
          </div>
        </div>
      </WarmCard>

      {loading && <div className="text-sm text-[#8B7355]">Loading audit...</div>}
      {error && <div className="text-sm text-red-600">{error}</div>}

      <WarmCard padding="lg" className="border border-[#E7DCC7]">
        <div className="space-y-3">
          {events.length === 0 && !loading && <div className="text-sm text-[#8B7355]">No events.</div>}
          {events.map((event) => (
            <div key={event.id} className="flex items-center justify-between text-sm border-b border-[#F0E2C9] pb-2">
              <div>
                <div className="font-medium text-[#2D2721]">{event.eventType}</div>
                <div className="text-xs text-[#8B7355]">
                  {event.entityType} • {event.entityId.slice(0, 8)} • {event.actorType}
                </div>
              </div>
              <div className="text-xs text-[#8B7355]">{new Date(event.createdAt).toLocaleString()}</div>
            </div>
          ))}
        </div>
      </WarmCard>
    </div>
  )
}
