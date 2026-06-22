import { Skeleton } from "@/components/ui/skeleton"
import { WarmCard } from "@/components/warm-card"

export function CardSkeleton() {
  return (
    <WarmCard padding="lg">
      <Skeleton className="h-4 w-[100px] mb-3" />
      <Skeleton className="h-8 w-full mb-2" />
      <Skeleton className="h-4 w-3/4" />
    </WarmCard>
  )
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  )
}

export function FormSkeleton() {
  return (
    <div className="space-y-4">
      <div>
        <Skeleton className="h-4 w-[100px] mb-2" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div>
        <Skeleton className="h-4 w-[120px] mb-2" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div>
        <Skeleton className="h-4 w-[80px] mb-2" />
        <Skeleton className="h-24 w-full" />
      </div>
      <Skeleton className="h-10 w-[120px]" />
    </div>
  )
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-[200px] mb-2" />
        <Skeleton className="h-4 w-[300px]" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <WarmCard padding="lg">
          <Skeleton className="h-6 w-[150px] mb-4" />
          <Skeleton className="h-[200px] w-full" />
        </WarmCard>
        <WarmCard padding="lg">
          <Skeleton className="h-6 w-[150px] mb-4" />
          <Skeleton className="h-[200px] w-full" />
        </WarmCard>
      </div>
    </div>
  )
}

export function ListSkeleton({ items = 3 }: { items?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 border border-[var(--border)] rounded-xl">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="flex-1">
            <Skeleton className="h-4 w-[200px] mb-2" />
            <Skeleton className="h-3 w-[150px]" />
          </div>
          <Skeleton className="h-8 w-[80px]" />
        </div>
      ))}
    </div>
  )
}

export function ChartSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-[200px] mb-2" />
        <Skeleton className="h-4 w-[300px]" />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <WarmCard padding="lg">
          <Skeleton className="h-6 w-[150px] mb-4" />
          <Skeleton className="h-[250px] w-full" />
        </WarmCard>
        <WarmCard padding="lg">
          <Skeleton className="h-6 w-[150px] mb-4" />
          <Skeleton className="h-[250px] w-full" />
        </WarmCard>
      </div>
      <WarmCard padding="lg">
        <Skeleton className="h-6 w-[180px] mb-4" />
        <Skeleton className="h-[200px] w-full" />
      </WarmCard>
    </div>
  )
}

export function VoucherCardSkeleton() {
  return (
    <WarmCard padding="none" className="overflow-hidden">
      <div className="px-4 pt-4 pb-3 gradient-warm">
        <div className="flex items-start justify-between gap-3">
          <Skeleton className="h-12 w-12 rounded-lg" />
          <Skeleton className="h-6 w-[60px] rounded-[8px]" />
        </div>
      </div>
      <div className="p-4 space-y-3">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-10 w-full rounded-[16px]" />
      </div>
    </WarmCard>
  )
}
