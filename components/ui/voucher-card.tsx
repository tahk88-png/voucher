import * as React from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { WarmCard } from "@/components/warm-card"
import { Badge } from "@/components/ui/badge"
import { WarmButton } from "@/components/warm-button"
import { Clock } from "lucide-react"

export interface VoucherCardProps {
  merchantLogo?: string
  merchantLogoUrl?: string
  merchantName?: string
  title: string
  description?: string
  expiryDate: Date | string
  status?: "active" | "redeemed" | "expired"
  statusLabel?: string
  code?: string
  accentColor?: string
  onPrimaryAction?: () => void
  className?: string
  children?: React.ReactNode
}

const statusConfig = {
  active: {
    variant: "success" as const,
    defaultLabel: "Active",
  },
  redeemed: {
    variant: "secondary" as const,
    defaultLabel: "Used",
  },
  expired: {
    variant: "muted" as const,
    defaultLabel: "Expired",
  },
} as const

export function VoucherCard({
  merchantLogo,
  merchantName,
  merchantLogoUrl,
  title,
  description,
  expiryDate,
  status = "active",
  statusLabel,
  code,
  accentColor,
  onPrimaryAction,
  className,
  children,
}: VoucherCardProps) {
  const statusInfo = statusConfig[status]
  const displayStatusLabel = statusLabel || statusInfo.defaultLabel

  const expiryDateObj = typeof expiryDate === "string" ? new Date(expiryDate) : expiryDate
  const formattedExpiry = expiryDateObj.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })

  const getActionLabel = () => {
    if (status === "redeemed") return "Used"
    if (status === "expired") return "Expired"
    return "Redeem"
  }

  const logoUrl = merchantLogoUrl || merchantLogo

  const accentStyle = accentColor
    ? ({ "--accent": accentColor, "--accent-bg": `${accentColor}15` } as React.CSSProperties)
    : undefined

  return (
    <WarmCard
      padding="none"
      className={cn(
        "overflow-hidden transition-all duration-200",
        "hover:shadow-warm-lg shadow-warm",
        "border border-[#E7DCC7]",
        className
      )}
      style={accentStyle}
    >
      <div
        className={cn(
          "relative px-4 pt-4 pb-3",
          accentColor ? "bg-[var(--accent-bg)]" : "bg-gradient-to-br from-[#FFF9ED] to-[#FFE5B4]"
        )}
      >
        <div className="flex items-start justify-between gap-3">
          {logoUrl && (
            <div className="flex-shrink-0">
              <Image
                src={logoUrl}
                alt={merchantName || "Merchant"}
                width={48}
                height={48}
                className="rounded-lg object-contain bg-white/80 p-1.5 shadow-sm"
                unoptimized
              />
            </div>
          )}

          <Badge variant={statusInfo.variant} className="shrink-0 text-xs font-medium">
            {displayStatusLabel}
          </Badge>
        </div>
      </div>

      <div className="p-4 space-y-3">
        <h3 className="text-lg font-semibold leading-tight text-[#2D2721]">{title}</h3>

        {description && (
          <p className="text-sm text-[#6B5744] leading-relaxed line-clamp-2">{description}</p>
        )}

        <div className="flex items-center gap-1.5 text-xs text-[#8B7355]">
          <Clock className="h-3.5 w-3.5 shrink-0" />
          <span>Expires {formattedExpiry}</span>
        </div>

        {code && (
          <div className="px-3 py-2 bg-[#FFF9ED] border border-[#E7DCC7] rounded-md">
            <p className="text-sm font-mono font-semibold text-center text-[#2D2721]">{code}</p>
          </div>
        )}

        {children}

        {onPrimaryAction && (
          <WarmButton
            className={cn(
              "w-full mt-2",
              accentColor ? "text-white" : ""
            )}
            onClick={onPrimaryAction}
            disabled={status === "expired" || status === "redeemed"}
            style={accentColor ? { backgroundColor: "var(--accent)" } : undefined}
          >
            {getActionLabel()}
          </WarmButton>
        )}
      </div>
    </WarmCard>
  )
}
