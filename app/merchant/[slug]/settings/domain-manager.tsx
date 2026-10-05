"use client"

import { useState } from "react"
import { WarmButton } from "@/components/warm-button"
import { WarmCard } from "@/components/warm-card"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { useTranslations } from "next-intl"

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
  const t = useTranslations("merchantSettings.domains")
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
      toast({ title: t("addedTitle"), description: t("addedDescription") })
    } catch {
      toast({ title: t("addErrorTitle"), description: t("addErrorDescription"), variant: "destructive" })
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
      toast({ title: t("verifiedTitle"), description: t("verifiedDescription") })
    } catch {
      toast({
        title: t("verifyErrorTitle"),
        description: t("verifyErrorDescription"),
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
      toast({ title: t("removedTitle") })
    } catch {
      toast({ title: t("removeErrorTitle"), description: t("removeErrorDescription"), variant: "destructive" })
    }
  }

  return (
    <WarmCard padding="lg" className="mb-4 bg-[var(--surface)] border border-[var(--border)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-[var(--text)]">{t("title")}</h2>
          <p className="text-sm text-[var(--text-muted)]">
            {t("subtitle")}
          </p>
        </div>
      </div>
      <div className="mt-4 flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <label htmlFor="custom-domain" className="sr-only">
            {t("inputLabel")}
          </label>
          <Input
            id="custom-domain"
            placeholder="merchant.example.com"
            value={newDomain}
            onChange={(event) => setNewDomain(event.target.value)}
          />
        </div>
        <WarmButton onClick={addDomain} disabled={isSubmitting}>
          {isSubmitting ? t("adding") : t("add")}
        </WarmButton>
      </div>
      <div className="mt-4 space-y-3">
        {domains.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">{t("empty")}</p>
        ) : (
          domains.map((domain) => (
            <div
              key={domain.id}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border border-[var(--border)]/70 rounded-xl p-3"
            >
              <div>
                <p className="text-sm font-semibold text-[var(--text)]">{domain.domain}</p>
                <p className="text-xs text-[var(--text-muted)]">
                  {t("statusLine", {
                    status:
                      domain.status === "pending" || domain.status === "verified"
                        ? t(`statusValue.${domain.status}`)
                        : domain.status,
                  })}
                </p>
                {domain.verificationToken && domain.status !== "verified" ? (
                  <p className="text-xs text-[var(--text-muted)]">
                    TXT: _vouchr.{domain.domain} = vouchr-verification={domain.verificationToken}
                  </p>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-2">
                {domain.status !== "verified" ? (
                  <WarmButton size="sm" onClick={() => verifyDomain(domain.domain)}>
                    {t("verify")}
                  </WarmButton>
                ) : null}
                <WarmButton size="sm" variant="outline" onClick={() => removeDomain(domain.domain)}>
                  {t("remove")}
                </WarmButton>
              </div>
            </div>
          ))
        )}
      </div>
    </WarmCard>
  )
}
