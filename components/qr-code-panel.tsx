"use client"

import * as React from "react"
import { WarmCard } from "@/components/warm-card"
import { WarmButton } from "@/components/warm-button"
import { Clock, Eye, EyeOff } from "lucide-react"
import { cn } from "@/lib/utils"
import { useFormatter, useTranslations } from "next-intl"

interface QRCodePanelProps {
  code?: string
  expiryDate?: Date | string
  onShowCode?: () => void
  showCode?: boolean
  className?: string
}

export function QRCodePanel({
  code,
  expiryDate,
  onShowCode,
  showCode = false,
  className,
}: QRCodePanelProps) {
  const t = useTranslations("purchase")
  const format = useFormatter()
  const expiryDateObj = expiryDate
    ? typeof expiryDate === "string"
      ? new Date(expiryDate)
      : expiryDate
    : null

  const [qrDataUrl, setQrDataUrl] = React.useState<string | null>(null)
  const [qrError, setQrError] = React.useState(false)

  React.useEffect(() => {
    if (!code) {
      setQrDataUrl(null)
      setQrError(false)
      return
    }
    let isMounted = true

    const fetchQr = async () => {
      try {
        const res = await fetch(`/api/qr?text=${encodeURIComponent(code)}`)
        if (!res.ok) throw new Error("Failed to generate QR code")
        const data = await res.json()
        if (isMounted) {
          setQrDataUrl(data.dataUrl)
          setQrError(false)
        }
      } catch {
        if (isMounted) {
          setQrError(true)
        }
      }
    }

    fetchQr()
    const interval = setInterval(fetchQr, 30000)
    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [code])

  const isGenerating = Boolean(code) && !qrDataUrl && !qrError
  const showPlaceholder = !code && !qrDataUrl && !qrError

  return (
    <div className={cn("flex flex-col items-center justify-center min-h-screen p-4 bg-[var(--bg-2)]", className)}>
      <WarmCard padding="lg" className="w-full max-w-sm bg-[var(--surface)] border border-[var(--border)]">
        <div className="space-y-6">
          <div className="flex justify-center">
            <div className="w-full aspect-square bg-[var(--surface)] p-4 rounded-lg border-2 border-[var(--border)] flex items-center justify-center">
              {qrError ? (
                <p className="text-xs text-[var(--text-faint)]">{t("qrPanel.generateFailed")}</p>
              ) : qrDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={qrDataUrl} alt={t("qrPanel.qrAlt")} className="h-full w-full object-contain" />
              ) : showPlaceholder ? (
                <div className="h-full w-full rounded-md border-2 border-dashed border-[var(--border)] bg-[var(--bg-2)] flex items-center justify-center">
                  <p className="text-xs text-[var(--text-faint)]">{t("qrPanel.placeholder")}</p>
                </div>
              ) : (
                <p className="text-xs text-[var(--text-faint)]">
                  {isGenerating ? t("qrPanel.generating") : t("qrPanel.unavailable")}
                </p>
              )}
            </div>
          </div>

          {code && (
            <div className="space-y-3">
              <WarmButton variant="outline" className="w-full" onClick={onShowCode}>
                {showCode ? (
                  <>
                    <EyeOff className="h-4 w-4 mr-2" />
                    {t("qrPanel.hideCode")}
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4 mr-2" />
                    {t("qrPanel.showCode")}
                  </>
                )}
              </WarmButton>

              {showCode && (
                <div className="px-4 py-3 bg-[var(--bg-2)] border border-[var(--border)] rounded-lg">
                  <p className="text-center font-mono text-lg font-semibold text-[var(--text)]">
                    {code}
                  </p>
                </div>
              )}
            </div>
          )}

          {expiryDateObj && (
            <div className="flex items-center justify-center gap-2 text-sm text-[var(--text-muted)]">
              <Clock className="h-4 w-4" />
              <span>
                {t("qrPanel.expires", {
                  date: format.dateTime(expiryDateObj, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  }),
                })}
              </span>
            </div>
          )}

          <div className="text-center">
            <p className="text-xs text-[var(--text-faint)]">{t("qrPanel.refreshNote")}</p>
          </div>
        </div>
      </WarmCard>
    </div>
  )
}
