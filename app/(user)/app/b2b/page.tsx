"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useTranslations } from "next-intl"
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
  const t = useTranslations("b2b")
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
        if (!res.ok) throw new Error(data?.error || t("orgs.loadFailed"))
        if (active) setOrgs(data.orgs ?? [])
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : t("orgs.loadFailed"))
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => {
      active = false
    }
  }, [t])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#2D2721]">{t("orgs.title")}</h1>
        <p className="text-[#6B5744]">{t("orgs.subtitle")}</p>
      </div>

      {loading && <div className="text-sm text-[#8B7355]">{t("orgs.loading")}</div>}
      {error && <div className="text-sm text-red-600">{error}</div>}

      {!loading && !error && orgs.length === 0 && (
        <WarmCard padding="lg" className="border border-[rgba(139,115,85,0.15)]">
          <div className="text-[#6B5744]">{t("orgs.empty")}</div>
        </WarmCard>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {orgs.map((org) => (
          <WarmCard key={org.id} padding="lg" className="border border-[rgba(139,115,85,0.15)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-[#2D2721]">{org.name}</h2>
                <div className="text-xs text-[#8B7355] uppercase tracking-wide mt-1">
                  {org.type} · {org.status} · {t.has(`roles.${org.role}`) ? t(`roles.${org.role}`) : org.role}
                </div>
              </div>
              <WarmButton asChild size="sm">
                <Link href={`/app/b2b/orgs/${org.id}`}>{t("orgs.open")}</Link>
              </WarmButton>
            </div>
          </WarmCard>
        ))}
      </div>
    </div>
  )
}
