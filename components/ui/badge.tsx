import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-[var(--r-sm)] px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default:   "gradient-brand text-[var(--primary-foreground)]",
        primary:   "gradient-brand text-[var(--primary-foreground)]",
        accent:    "bg-[var(--accent)] text-[var(--accent-foreground)] border border-[var(--border)]",
        secondary: "bg-[var(--surface-muted)] text-[var(--text-muted)] border border-[var(--border)]",
        success:   "bg-[var(--success)] text-white",
        warning:   "bg-[var(--warning)] text-[var(--primary-foreground)]",
        danger:    "bg-[var(--danger)] text-white",
        outline:   "border-2 border-[var(--border)] text-[var(--text)] bg-transparent",
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
