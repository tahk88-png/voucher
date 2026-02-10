"use client"

import { useState } from "react"
import { WarmButton } from "@/components/warm-button"
import { WarmCard } from "@/components/warm-card"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"

interface DomainMapping {
  id: string
  domain: string
  status: string
  verificationToken: string | null
  verifiedAt: string | null
}

export default function DomainManager({
  merchantSlug,
  initialDomains,
}: {
  merchantSlug: string
  initialDomains: DomainMapping[]
}) {
  const { toast } = useToast()
  const [domains, setDomains] = useState<DomainMapping[]>(initialDomains)
  const [newDomain, setNewDomain] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const refresh = async () => {
    const res = await fetch(`/api/merchant/${merchantSlug}/domains`)
    if (res.ok) {
      const data = await res.json()
      setDomains(data.domains || [])
    }
  }

  const addDomain = async () => {
    if (!newDomain.trim()) return
    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/merchant/${merchantSlug}/domains`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: newDomain }),
      })
      if (!res.ok) throw new Error("Failed")
      await refresh()
      setNewDomain("")
      toast({ title: "Domain added", description: "Verify DNS before switching traffic." })
    } catch {
      toast({ title: "Domain error", description: "Unable to add domain.", variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  const verifyDomain = async (domain: string) => {
    try {
      const res = await fetch(`/api/merchant/${merchantSlug}/domains`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain }),
      })
      if (!res.ok) throw new Error("Failed")
      await refresh()
      toast({ title: "Domain verified", description: "Tenant routing is now active." })
    } catch {
      toast({
        title: "Verification error",
        description: "Unable to verify domain.",
        variant: "destructive",
      })
    }
  }

  const removeDomain = async (domain: string) => {
    try {
      const res = await fetch(`/api/merchant/${merchantSlug}/domains?domain=${encodeURIComponent(domain)}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Failed")
      await refresh()
      toast({ title: "Domain removed" })
    } catch {
      toast({ title: "Remove error", description: "Unable to remove domain.", variant: "destructive" })
    }
  }

  return (
    <WarmCard padding="lg" className="mb-4 bg-white border border-[rgba(139,115,85,0.15)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-[#2D2721]">Custom domains</h2>
          <p className="text-sm text-[#6B5744]">
            Connect your own domain and verify it for tenant routing.
          </p>
        </div>
      </div>
      <div className="mt-4 flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <label htmlFor="custom-domain" className="sr-only">
            Custom domain
          </label>
          <Input
            id="custom-domain"
            placeholder="merchant.example.com"
            value={newDomain}
            onChange={(event) => setNewDomain(event.target.value)}
          />
        </div>
        <WarmButton onClick={addDomain} disabled={isSubmitting}>
          {isSubmitting ? "Adding..." : "Add domain"}
        </WarmButton>
      </div>
      <div className="mt-4 space-y-3">
        {domains.length === 0 ? (
          <p className="text-sm text-[#6B5744]">No domains configured.</p>
        ) : (
          domains.map((domain) => (
            <div
              key={domain.id}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border border-[rgba(139,115,85,0.15)]/70 rounded-xl p-3"
            >
              <div>
                <p className="text-sm font-semibold text-[#2D2721]">{domain.domain}</p>
                <p className="text-xs text-[#6B5744]">Status: {domain.status}</p>
                {domain.verificationToken && domain.status !== "verified" ? (
                  <p className="text-xs text-[#6B5744]">
                    TXT: _vouchr.{domain.domain} = vouchr-verification={domain.verificationToken}
                  </p>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-2">
                {domain.status !== "verified" ? (
                  <WarmButton size="sm" onClick={() => verifyDomain(domain.domain)}>
                    Verify
                  </WarmButton>
                ) : null}
                <WarmButton size="sm" variant="outline" onClick={() => removeDomain(domain.domain)}>
                  Remove
                </WarmButton>
              </div>
            </div>
          ))
        )}
      </div>
    </WarmCard>
  )
}
