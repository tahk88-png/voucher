"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

type WarmButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "default"
type WarmButtonSize = "sm" | "md" | "lg" | "icon"

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
      "relative inline-flex items-center justify-center font-semibold tracking-[0.01em] transition-all duration-200 ease-spring disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface)] overflow-hidden select-none"

    const variants: Record<WarmButtonVariant, string> = {
      primary:
        "gradient-brand text-[var(--primary-foreground)] border border-[var(--primary)] shadow-md hover:shadow-primary hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] active:shadow-sm",
      default:
        "gradient-brand text-[var(--primary-foreground)] border border-[var(--primary)] shadow-md hover:shadow-primary hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] active:shadow-sm",
      secondary:
        "bg-[var(--surface)] text-[var(--text)] border border-[var(--border)] shadow-sm hover:border-[var(--border-strong)] hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]",
      outline:
        "bg-[var(--surface)] text-[var(--text)] border-2 border-[var(--primary)] hover:bg-[var(--accent)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]",
      ghost:
        "bg-transparent text-[var(--text-muted)] shadow-none hover:bg-[var(--surface-dim)] hover:text-[var(--text)] active:scale-[0.98]",
    }

    const sizes: Record<WarmButtonSize, string> = {
      sm: "px-4 py-2 text-sm rounded-[var(--r-sm)] gap-1.5",
      md: "px-6 py-3 text-base rounded-[var(--r-md)] gap-2",
      lg: "px-8 py-3.5 text-lg rounded-[var(--r-lg)] gap-2.5",
      icon: "h-10 w-10 rounded-[var(--r-sm)] p-0",
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
