import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-[var(--r-sm)] bg-[var(--surface-dim)] relative overflow-hidden",
        "after:absolute after:inset-0 after:bg-gradient-to-r after:from-transparent after:via-[var(--surface)]/40 after:to-transparent after:animate-[shimmer_2s_ease-in-out_infinite] after:bg-[length:200%_100%]",
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }
