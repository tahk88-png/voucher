"use client"

import * as React from "react"
import { WarmCard } from "@/components/warm-card"
import { WarmButton } from "@/components/warm-button"
import { Clock, Eye, EyeOff } from "lucide-react"
import { cn } from "@/lib/utils"

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
  const expiryDateObj = expiryDate
    ? typeof expiryDate === "string"
      ? new Date(expiryDate)
      : expiryDate
    : null

  const [qrDataUrl, setQrDataUrl] = React.useState<string | null>(null)
  const [qrError, setQrError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!code) {
      setQrDataUrl(null)
      setQrError(null)
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
          setQrError(null)
        }
      } catch (error) {
        if (isMounted) {
          setQrError(error instanceof Error ? error.message : "Failed to generate QR code")
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
    <div className={cn("flex flex-col items-center justify-center min-h-screen p-4 bg-[#FFF9ED]", className)}>
      <WarmCard padding="lg" className="w-full max-w-sm bg-white border border-[#E7DCC7]">
        <div className="space-y-6">
          <div className="flex justify-center">
            <div className="w-full aspect-square bg-white p-4 rounded-lg border-2 border-[#E7DCC7] flex items-center justify-center">
              {qrError ? (
                <p className="text-xs text-[#8B7355]">{qrError}</p>
              ) : qrDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={qrDataUrl} alt="QR code" className="h-full w-full object-contain" />
              ) : showPlaceholder ? (
                <div className="h-full w-full rounded-md border-2 border-dashed border-[#E7DCC7] bg-[#FFF9ED] flex items-center justify-center">
                  <p className="text-xs text-[#8B7355]">QR code will appear here</p>
                </div>
              ) : (
                <p className="text-xs text-[#8B7355]">
                  {isGenerating ? "Generating QR..." : "QR unavailable"}
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
                    Hide code
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4 mr-2" />
                    Show code
                  </>
                )}
              </WarmButton>

              {showCode && (
                <div className="px-4 py-3 bg-[#FFF9ED] border border-[#E7DCC7] rounded-lg">
                  <p className="text-center font-mono text-lg font-semibold text-[#2D2721]">
                    {code}
                  </p>
                </div>
              )}
            </div>
          )}

          {expiryDateObj && (
            <div className="flex items-center justify-center gap-2 text-sm text-[#6B5744]">
              <Clock className="h-4 w-4" />
              <span>
                Expires {expiryDateObj.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
          )}

          <div className="text-center">
            <p className="text-xs text-[#8B7355]">Code refreshes every 30 seconds</p>
          </div>
        </div>
      </WarmCard>
    </div>
  )
}
