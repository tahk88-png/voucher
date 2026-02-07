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
          "flex h-10 w-full rounded-[12px] border-2 border-[rgba(139,115,85,0.15)] bg-white px-4 py-2 text-sm text-[#2D2721] transition-all file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-[#8B7355]/50 focus-visible:outline-none focus-visible:border-[#FFC857] focus-visible:ring-2 focus-visible:ring-[#FFC857]/20 disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-[#FAF7F2]",
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
