import * as React from "react"
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
  className?: string
}

export function StatsCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  className,
}: StatsCardProps) {
  return (
    <WarmCard padding="lg" className={cn("", className)}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-[#8B7355]">{title}</p>
          <div className="mt-2 flex items-baseline gap-2">
            <h3 className="text-2xl font-bold text-[#2D2721]">{value}</h3>
            {trend && (
              <div
                className={cn(
                  "flex items-center gap-1 text-xs font-medium",
                  trend.isPositive ? "text-[#9DB5A5]" : "text-[#E17B5C]"
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
                  <span className="text-[#8B7355]">{trend.label}</span>
                )}
              </div>
            )}
          </div>
          {description && (
            <p className="mt-1 text-xs text-[#6B5744]">{description}</p>
          )}
        </div>
        {Icon && (
          <div className="rounded-xl bg-[#FFF9ED] p-2">
            <Icon className="h-5 w-5 text-[#8B7355]" />
          </div>
        )}
      </div>
    </WarmCard>
  )
}
