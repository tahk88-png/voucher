import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap text-sm font-medium shadow-warm transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFC857]/40 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-br from-[#FFC857] to-[#FFB627] text-[#2D2721] hover:shadow-warm-lg hover:scale-[1.02] active:scale-[0.98]",
        destructive:
          "bg-[#E17B5C] text-white hover:bg-[#D56B4C] hover:shadow-warm-lg",
        outline:
          "border-2 border-[#FFC857] bg-transparent text-[#2D2721] hover:bg-[#FFF9ED]",
        secondary:
          "bg-white text-[#2D2721] border-2 border-[rgba(139,115,85,0.15)] hover:border-[rgba(139,115,85,0.3)] hover:shadow-warm",
        ghost: "bg-transparent text-[#6B5744] shadow-none hover:bg-[#F8F6F1]",
        link: "text-[#2D2721] underline-offset-4 shadow-none hover:underline",
      },
      size: {
        default: "h-10 px-6 py-2 rounded-[16px]",
        sm: "h-9 px-4 py-2 text-sm rounded-[12px]",
        lg: "h-11 px-8 py-3 text-base rounded-[20px]",
        icon: "h-10 w-10 rounded-[12px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, children, ...props }, ref) => {
    const shouldSlot =
      Boolean(asChild) &&
      React.isValidElement(children) &&
      React.Children.count(children) === 1
    const Comp = shouldSlot ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      >
        {children}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
