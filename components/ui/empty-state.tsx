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
        "flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-[var(--border)] bg-[var(--surface-muted)]/50 p-12 text-center",
        className
      )}
      {...props}
    >
      {Icon && (
        <div className="mb-4 rounded-xl bg-[var(--bg-2)] p-3">
          <Icon className="h-8 w-8 text-[var(--text-faint)]" />
        </div>
      )}
      <h3 className="mb-2 text-lg font-bold text-[var(--text)]">{title}</h3>
      {description && (
        <p className="mb-6 max-w-sm text-sm text-[var(--text-muted)]">{description}</p>
      )}
      {action && (
        <WarmButton onClick={action.onClick} size="sm">
          {action.label}
        </WarmButton>
      )}
    </div>
  )
}
