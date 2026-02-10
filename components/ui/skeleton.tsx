import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-[12px] bg-[var(--surface-dim)]", className)}
      {...props}
    />
  )
}

export { Skeleton }
