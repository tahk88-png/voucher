import * as React from "react"

import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm text-[var(--text)] shadow-sm transition-all duration-200 ease-smooth file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-[var(--text-faint)]/60 focus-visible:outline-none focus-visible:border-[var(--primary)] focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:shadow-md disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-[var(--surface-muted)] hover:border-[var(--border-strong)]",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
