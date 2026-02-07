"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

type WarmButtonVariant = "primary" | "secondary" | "outline" | "ghost"
type WarmButtonSize = "sm" | "md" | "lg"

interface WarmButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: WarmButtonVariant
  size?: WarmButtonSize
  isLoading?: boolean
  fullWidth?: boolean
  asChild?: boolean
}

export const WarmButton = React.forwardRef<HTMLButtonElement, WarmButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading,
      fullWidth,
      asChild,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-warm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFC857]/40 focus-visible:ring-offset-2"

    const variants: Record<WarmButtonVariant, string> = {
      primary:
        "bg-gradient-to-br from-[#FFC857] to-[#FFB627] text-[#2D2721] hover:shadow-warm-lg hover:scale-[1.02] active:scale-[0.98]",
      secondary:
        "bg-white text-[#2D2721] border-2 border-[rgba(139,115,85,0.15)] hover:border-[rgba(139,115,85,0.3)] hover:shadow-warm",
      outline: "bg-transparent text-[#2D2721] border-2 border-[#FFC857] hover:bg-[#FFF9ED]",
      ghost: "bg-transparent text-[#6B5744] hover:bg-[#F8F6F1]",
    }

    const sizes: Record<WarmButtonSize, string> = {
      sm: "px-4 py-2 text-sm rounded-[12px]",
      md: "px-6 py-3 text-base rounded-[16px]",
      lg: "px-8 py-4 text-lg rounded-[20px]",
    }

    const shouldSlot =
      Boolean(asChild) &&
      React.isValidElement(children) &&
      React.Children.count(children) === 1
    const Comp = shouldSlot ? Slot : "button"

    const content = shouldSlot ? (
      children
    ) : (
      <>
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {children}
      </>
    )

    return (
      <Comp
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], fullWidth && "w-full", className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {content}
      </Comp>
    )
  }
)

WarmButton.displayName = "WarmButton"
