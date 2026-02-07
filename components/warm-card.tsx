"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

type WarmCardPadding = "none" | "sm" | "md" | "lg" | "xl"

interface WarmCardProps extends React.HTMLAttributes<HTMLDivElement> {
  gradient?: boolean
  hover?: boolean
  padding?: WarmCardPadding
}

export const WarmCard = React.forwardRef<HTMLDivElement, WarmCardProps>(
  ({ className, gradient, hover, padding = "md", children, ...props }, ref) => {
    const paddingStyles: Record<WarmCardPadding, string> = {
      none: "p-0",
      sm: "p-3",
      md: "p-4",
      lg: "p-6",
      xl: "p-8",
    }

  return (
      <div
        ref={ref}
        className={cn(
          "rounded-xl shadow-warm",
          gradient ? "bg-gradient-to-br from-[#FFF9ED] to-[#FFE5B4]" : "bg-white",
          hover && "transition-all duration-200 hover:shadow-warm-lg hover:scale-[1.01]",
          paddingStyles[padding],
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)

WarmCard.displayName = "WarmCard"
