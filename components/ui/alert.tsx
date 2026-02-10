import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const alertVariants = cva(
  "relative w-full rounded-[var(--r-sm)] border-2 p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-[var(--text)]",
  {
    variants: {
      variant: {
        default:     "bg-[var(--surface)] border-[var(--border)] text-[var(--text)]",
        success:     "bg-[var(--success)]/10 border-[var(--success)] text-[var(--text)] [&>svg]:text-[var(--success)]",
        warning:     "bg-[var(--warning)]/10 border-[var(--warning)] text-[var(--text)] [&>svg]:text-[var(--warning)]",
        destructive: "bg-[var(--danger)]/10 border-[var(--danger)] text-[var(--text)] [&>svg]:text-[var(--danger)]",
        info:        "bg-[var(--info)]/10 border-[var(--info)] text-[var(--text)] [&>svg]:text-[var(--info)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, ...props }, ref) => (
  <div
    ref={ref}
    role="alert"
    className={cn(alertVariants({ variant }), className)}
    {...props}
  />
))
Alert.displayName = "Alert"

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("mb-1 font-bold leading-none tracking-tight text-[var(--text)]", className)}
    {...props}
  />
))
AlertTitle.displayName = "AlertTitle"

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm text-[var(--text-muted)] [&_p]:leading-relaxed", className)}
    {...props}
  />
))
AlertDescription.displayName = "AlertDescription"

export { Alert, AlertTitle, AlertDescription }
