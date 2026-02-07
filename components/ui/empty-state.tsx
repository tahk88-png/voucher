import * as React from "react"
import { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { WarmButton } from "@/components/warm-button"

interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: LucideIcon
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-[rgba(139,115,85,0.15)] bg-[#FAF7F2]/50 p-12 text-center",
        className
      )}
      {...props}
    >
      {Icon && (
        <div className="mb-4 rounded-xl bg-[#FFF9ED] p-3">
          <Icon className="h-8 w-8 text-[#8B7355]" />
        </div>
      )}
      <h3 className="mb-2 text-lg font-bold text-[#2D2721]">{title}</h3>
      {description && (
        <p className="mb-6 max-w-sm text-sm text-[#6B5744]">{description}</p>
      )}
      {action && (
        <WarmButton onClick={action.onClick} size="sm">
          {action.label}
        </WarmButton>
      )}
    </div>
  )
}
