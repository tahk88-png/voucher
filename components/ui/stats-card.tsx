import * as React from "react"
import Link from "next/link"
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { WarmCard } from "@/components/warm-card"

interface StatsCardProps {
  title: string
  value: string | number
  description?: string
  icon?: LucideIcon
  trend?: {
    value: number
    label?: string
    isPositive?: boolean
  }
  href?: string
  actionLabel?: string
  className?: string
}

export function StatsCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  href,
  actionLabel = "Open",
  className,
}: StatsCardProps) {
  const card = (
    <WarmCard padding="lg" className={cn("", className)}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-[var(--text-faint)]">{title}</p>
          <div className="mt-2 flex items-baseline gap-2">
            <h3 className="text-2xl font-bold text-[var(--text)]">{value}</h3>
            {trend && (
              <div
                className={cn(
                  "flex items-center gap-1 text-xs font-medium",
                  trend.isPositive ? "text-[var(--success)]" : "text-[var(--danger)]"
                )}
              >
                {trend.isPositive ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                <span>
                  {trend.isPositive ? "+" : ""}
                  {trend.value}%
                </span>
                {trend.label && (
                  <span className="text-[var(--text-faint)]">{trend.label}</span>
                )}
              </div>
            )}
          </div>
          {description && (
            <p className="mt-1 text-xs text-[var(--text-muted)]">{description}</p>
          )}
          {href && (
            <span className="mt-3 inline-flex text-xs font-semibold text-primary">
              {actionLabel}
            </span>
          )}
        </div>
        {Icon && (
          <div className="rounded-xl bg-[var(--bg-2)] p-2">
            <Icon className="h-5 w-5 text-[var(--text-faint)]" />
          </div>
        )}
      </div>
    </WarmCard>
  )

  if (!href) {
    return card
  }

  return (
    <Link href={href} className="block rounded-[22px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
      {card}
    </Link>
  )
}
