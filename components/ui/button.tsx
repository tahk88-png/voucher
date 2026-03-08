import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "relative inline-flex items-center justify-center whitespace-nowrap font-semibold tracking-[0.01em] transition-all duration-200 ease-spring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface)] disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden select-none",
  {
    variants: {
      variant: {
        default:
          "gradient-brand text-[var(--primary-foreground)] border border-[var(--primary)] shadow-md hover:shadow-primary hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] active:shadow-sm",
        primary:
          "gradient-brand text-[var(--primary-foreground)] border border-[var(--primary)] shadow-md hover:shadow-primary hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] active:shadow-sm",
        secondary:
          "bg-[var(--surface)] text-[var(--text)] border border-[var(--border)] shadow-sm hover:border-[var(--border-strong)] hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]",
        ghost:
          "bg-transparent text-[var(--text-muted)] shadow-none hover:bg-[var(--surface-dim)] hover:text-[var(--text)] active:scale-[0.98]",
        accent:
          "bg-[var(--accent)] text-[var(--accent-foreground)] border border-[var(--border)] hover:bg-[var(--surface-muted)] hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] shadow-sm",
        destructive:
          "bg-[var(--danger)] text-white shadow-sm hover:shadow-danger hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]",
        outline:
          "border-2 border-[var(--primary)] bg-transparent text-[var(--text)] hover:bg-[var(--accent)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]",
        link:
          "text-[var(--text)] underline-offset-4 shadow-none hover:underline hover:text-[var(--primary)]",
      },
      size: {
        default: "px-6 py-3 text-sm rounded-[var(--r-md)] gap-2",
        sm:      "px-4 py-2 text-sm rounded-[var(--r-sm)] gap-1.5",
        md:      "px-6 py-3 text-sm rounded-[var(--r-md)] gap-2",
        lg:      "px-8 py-3.5 text-base rounded-[var(--r-lg)] gap-2.5",
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
