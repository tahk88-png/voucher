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
          "rounded-[var(--r-lg)] border border-[var(--border)] backdrop-blur-sm shadow-md",
          gradient ? "bg-gradient-to-br from-[var(--bg-2)]/95 to-[var(--accent)]/95" : "bg-[var(--surface)]/95",
          hover && "transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5",
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
