import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-[var(--r-full)] px-3 py-0.5 text-xs font-semibold tracking-wide transition-all duration-150",
  {
    variants: {
      variant: {
        default:   "gradient-brand text-[var(--primary-foreground)] shadow-sm",
        primary:   "gradient-brand text-[var(--primary-foreground)] shadow-sm",
        accent:    "bg-[var(--accent)] text-[var(--accent-foreground)] border border-[var(--border)]",
        secondary: "bg-[var(--surface-muted)] text-[var(--text-muted)] border border-[var(--border)]",
        success:   "bg-[var(--success)]/15 text-[var(--success)] border border-[var(--success)]/20",
        warning:   "bg-[var(--warning)]/15 text-[var(--primary-foreground)] border border-[var(--warning)]/20",
        danger:    "bg-[var(--danger)]/15 text-[var(--danger)] border border-[var(--danger)]/20",
        outline:   "border border-[var(--border)] text-[var(--text)] bg-transparent",
        muted:     "bg-[var(--surface-dim)] text-[var(--text-faint)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
