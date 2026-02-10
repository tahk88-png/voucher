import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const statusVariants = cva(
  "inline-flex items-center gap-2 rounded-[var(--r-full)] px-3 py-1 text-xs font-medium",
  {
    variants: {
      variant: {
        ok:      "bg-[var(--success)]/10 text-[var(--success)] border border-[var(--success)]/20",
        warning: "bg-[var(--warning)]/10 text-[var(--text)] border border-[var(--warning)]/20",
        error:   "bg-[var(--danger)]/10 text-[var(--danger)] border border-[var(--danger)]/20",
        info:    "bg-[var(--info)]/10 text-[var(--info)] border border-[var(--info)]/20",
        neutral: "bg-[var(--surface-dim)] text-[var(--text-faint)] border border-[var(--border)]",
      },
    },
    defaultVariants: {
      variant: "neutral",
    },
  }
)

const dotColors: Record<string, string> = {
  ok:      "bg-[var(--success)]",
  warning: "bg-[var(--warning)]",
  error:   "bg-[var(--danger)]",
  info:    "bg-[var(--info)]",
  neutral: "bg-[var(--text-faint)]",
}

export interface StatusProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof statusVariants> {}

function Status({ className, variant = "neutral", children, ...props }: StatusProps) {
  const v = variant ?? "neutral"
  return (
    <span className={cn(statusVariants({ variant }), className)} {...props}>
      <span className={cn("h-2 w-2 rounded-full shrink-0", dotColors[v])} />
      {children}
    </span>
  )
}

export { Status, statusVariants }
