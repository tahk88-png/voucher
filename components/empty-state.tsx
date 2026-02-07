import * as React from "react"
import Link from "next/link"
import { WarmCard } from "@/components/warm-card"
import { WarmButton } from "@/components/warm-button"
import { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  action?: {
    label: string
    href?: string
    onClick?: () => void
  }
  className?: string
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  const content = (
    <WarmCard padding="lg" className="bg-white border border-[#E7DCC7]">
      <div className={cn("py-10 text-center", className)}>
        {Icon && <Icon className="h-12 w-12 mx-auto text-[#8B7355] mb-4" />}
        <h3 className="text-lg font-semibold text-[#2D2721] mb-2">{title}</h3>
        {description && <p className="text-sm text-[#6B5744] mb-4">{description}</p>}
        {action && (
          <div>
            {action.href ? (
              <WarmButton asChild variant="outline">
                <Link href={action.href}>{action.label}</Link>
              </WarmButton>
            ) : (
              <WarmButton variant="outline" onClick={action.onClick}>
                {action.label}
              </WarmButton>
            )}
          </div>
        )}
      </div>
    </WarmCard>
  )

  return content
}
