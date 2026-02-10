import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap font-semibold tracking-[0.01em] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed",
  {
    variants: {
      variant: {
        default:
          "gradient-brand text-[var(--primary-foreground)] border border-[var(--primary)] shadow-md hover:shadow-lg hover:scale-[1.015] active:scale-[0.98]",
        primary:
          "gradient-brand text-[var(--primary-foreground)] border border-[var(--primary)] shadow-md hover:shadow-lg hover:scale-[1.015] active:scale-[0.98]",
        secondary:
          "bg-[var(--surface)] text-[var(--text)] border-2 border-[var(--border)] hover:border-[var(--border-strong)] hover:shadow-md",
        ghost:
          "bg-transparent text-[var(--text-muted)] shadow-none hover:bg-[var(--surface-dim)]",
        accent:
          "bg-[var(--accent)] text-[var(--accent-foreground)] border border-[var(--border)] hover:bg-[var(--surface-muted)] shadow-sm",
        destructive:
          "bg-[var(--danger)] text-white hover:opacity-90 hover:shadow-lg",
        outline:
          "border-2 border-[var(--primary)] bg-transparent text-[var(--text)] hover:bg-[var(--accent)]",
        link:
          "text-[var(--text)] underline-offset-4 shadow-none hover:underline",
      },
      size: {
        default: "px-6 py-3 text-sm rounded-[var(--r-md)]",
        sm:      "px-4 py-2 text-sm rounded-[var(--r-sm)]",
        md:      "px-6 py-3 text-sm rounded-[var(--r-md)]",
        lg:      "px-8 py-3.5 text-base rounded-[var(--r-lg)]",
        icon:    "h-10 w-10 rounded-[var(--r-sm)] p-0",
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
  isLoading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, isLoading, children, disabled, ...props }, ref) => {
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
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {content}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
