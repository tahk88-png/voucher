import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-[8px] px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-br from-[#FFC857] to-[#FFB627] text-[#2D2721]",
        secondary: "bg-[#FAF7F2] text-[#6B5744] border border-[rgba(139,115,85,0.15)]",
        outline: "border-2 border-[rgba(139,115,85,0.15)] text-[#2D2721]",
        success: "bg-[#9DB5A5] text-white",
        warning: "bg-[#FFC857] text-[#2D2721]",
        muted: "bg-[#F8F6F1] text-[#8B7355]",
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
