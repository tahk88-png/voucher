import * as React from "react"

import { cn } from "@/lib/utils"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-[12px] border-2 border-[rgba(139,115,85,0.15)] bg-white px-4 py-3 text-sm text-[#2D2721] transition-all placeholder:text-[#8B7355]/50 focus-visible:outline-none focus-visible:border-[#FFC857] focus-visible:ring-2 focus-visible:ring-[#FFC857]/20 disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-[#FAF7F2]",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }
