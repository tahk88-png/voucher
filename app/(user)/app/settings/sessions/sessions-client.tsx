"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useLocale, useTranslations } from "next-intl"
import { Monitor, Smartphone, Globe, Clock, LogOut, AlertTriangle, Shield, ArrowLeft } from "lucide-react"
import { WarmCard } from "@/components/warm-card"
import { WarmButton } from "@/components/warm-button"
import type { DeviceDescription } from "./device"

interface SessionInfo {
  id: string
  deviceInfo: string
  ipAddress: string
  lastActiveAt: string
  isCurrent: boolean
}

function DeviceIcon({ mobile }: { mobile: boolean }) {
  return mobile ? (
    <Smartphone className="h-5 w-5 text-[#8B7355]" aria-hidden="true" />
  ) : (
    <Monitor className="h-5 w-5 text-[#8B7355]" aria-hidden="true" />
  )
}

export default function SessionsClient({ currentDevice }: { currentDevice: DeviceDescription }) {
  const t = useTranslations("sessions")
  const locale = useLocale()
  const [sessions, setSessions] = useState<SessionInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [revoking, setRevoking] = useState<string | null>(null)
  const [revokingAll, setRevokingAll] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const fetchSessions = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/sessions")
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setSessions(data.sessions ?? [])
    } catch (err) {
      console.error("Loading sessions failed", err)
      setError(t("loadFailed"))
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    fetchSessions()
  }, [fetchSessions])

  async function revoke(body: { sessionId: string } | { revokeAll: true }) {
    setError(null)
    setSuccessMsg(null)
    const res = await fetch("/api/auth/sessions", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
  }

  async function revokeSession(sessionId: string) {
    setRevoking(sessionId)
    try {
      await revoke({ sessionId })
      setSuccessMsg(t("revoked"))
      setSessions((prev) => prev.filter((s) => s.id !== sessionId))
    } catch (err) {
      console.error("Revoking session failed", err)
      setError(t("revokeFailed"))
    } finally {
      setRevoking(null)
    }
  }

  async function revokeAllSessions() {
    setRevokingAll(true)
    try {
      await revoke({ revokeAll: true })
      setSuccessMsg(t("revokedAll"))
      setSessions([])
    } catch (err) {
      console.error("Revoking sessions failed", err)
      setError(t("revokeFailed"))
    } finally {
      setRevokingAll(false)
    }
  }

  function formatRelative(isoString: string) {
    const diffSeconds = Math.round((new Date(isoString).getTime() - Date.now()) / 1000)
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" })
    const abs = Math.abs(diffSeconds)
    if (abs < 60) return rtf.format(0, "minute")
    if (abs < 3600) return rtf.format(Math.round(diffSeconds / 60), "minute")
    if (abs < 86400) return rtf.format(Math.round(diffSeconds / 3600), "hour")
    if (abs < 7 * 86400) return rtf.format(Math.round(diffSeconds / 86400), "day")
    return new Date(isoString).toLocaleDateString(locale)
  }

  const currentLabel =
    currentDevice.browser && currentDevice.os
      ? t("deviceOn", { browser: currentDevice.browser, os: currentDevice.os })
      : currentDevice.browser || currentDevice.os || t("unknownDevice")

  const otherSessions = sessions.filter((s) => !s.isCurrent)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/app/settings"
          className="p-2 rounded-lg hover:bg-[var(--surface)] transition-colors"
          aria-label={t("backToSettings")}
        >
          <ArrowLeft className="h-4 w-4 text-[var(--text-muted)]" aria-hidden="true" />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-[#2D2721]">{t("title")}</h1>
          <p className="text-sm text-[#6B5744]">{t("description")}</p>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-[var(--r-sm)] px-3 py-2.5"
        >
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div
          role="status"
          className="flex items-start gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-[var(--r-sm)] px-3 py-2.5"
        >
          <Shield className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
          <span>{successMsg}</span>
        </div>
      )}

      <WarmCard padding="lg" className="bg-white border border-[rgba(139,115,85,0.15)]">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-[#FFF9ED] flex items-center justify-center shrink-0">
            <DeviceIcon mobile={currentDevice.mobile} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-[#2D2721]">{currentLabel}</span>
              <span className="text-xs font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                {t("thisDevice")}
              </span>
            </div>
            <p className="text-xs text-[#8B7355] mt-1">{t("signedInHere")}</p>
          </div>
        </div>
      </WarmCard>

      <WarmCard padding="lg" className="bg-white border border-[rgba(139,115,85,0.15)] space-y-4">
        <h2 className="text-base font-semibold text-[#2D2721]">{t("otherDevicesTitle")}</h2>
        {loading ? (
          <div className="space-y-3" aria-busy="true">
            {[1, 2].map((i) => (
              <div key={i} className="flex items-center gap-4 animate-pulse">
                <div className="w-10 h-10 rounded-xl bg-gray-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-1/3 bg-gray-200 rounded" />
                  <div className="h-3 w-1/4 bg-gray-200 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : otherSessions.length === 0 ? (
          <div className="space-y-3">
            <p className="text-sm text-[#6B5744]">{t("otherDevicesNone")}</p>
            <WarmButton asChild variant="outline" size="sm">
              <Link href="/app/settings/security">{t("securitySettings")}</Link>
            </WarmButton>
          </div>
        ) : (
          <>
            <div className="divide-y divide-[var(--border)]">
              {otherSessions.map((s) => (
                <div key={s.id} className="flex flex-wrap items-center gap-4 py-4 first:pt-0 last:pb-0">
                  <div className="w-10 h-10 rounded-xl bg-[#FFF9ED] flex items-center justify-center shrink-0">
                    <DeviceIcon mobile={/android|iphone|ios/i.test(s.deviceInfo)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-[#2D2721] truncate block">{s.deviceInfo}</span>
                    <div className="flex flex-wrap items-center gap-3 mt-1">
                      <span className="text-xs text-[#8B7355] flex items-center gap-1">
                        <Globe className="h-3 w-3" aria-hidden="true" />
                        {s.ipAddress}
                      </span>
                      <span className="text-xs text-[#8B7355] flex items-center gap-1">
                        <Clock className="h-3 w-3" aria-hidden="true" />
                        {t("lastActive", { time: formatRelative(s.lastActiveAt) })}
                      </span>
                    </div>
                  </div>
                  <WarmButton
                    variant="outline"
                    size="sm"
                    isLoading={revoking === s.id}
                    onClick={() => revokeSession(s.id)}
                    disabled={revoking !== null}
                  >
                    <LogOut className="h-3.5 w-3.5 mr-1" aria-hidden="true" />
                    {t("logout")}
                  </WarmButton>
                </div>
              ))}
            </div>
            {otherSessions.length > 1 && (
              <div className="flex flex-col gap-3 border-t border-[var(--border)] pt-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-[#6B5744]">{t("logoutAllBody")}</p>
                <WarmButton
                  variant="outline"
                  size="sm"
                  isLoading={revokingAll}
                  onClick={revokeAllSessions}
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  <LogOut className="h-3.5 w-3.5 mr-1" aria-hidden="true" />
                  {t("logoutAll")}
                </WarmButton>
              </div>
            )}
          </>
        )}
      </WarmCard>
    </div>
  )
}
