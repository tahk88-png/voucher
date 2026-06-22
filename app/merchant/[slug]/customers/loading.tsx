import { TableSkeleton } from "@/components/ui/loading-skeletons"
import { Skeleton } from "@/components/ui/skeleton"
import { WarmCard } from "@/components/warm-card"

export default function CustomersLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-[180px]" />
          <Skeleton className="h-4 w-[280px]" />
        </div>
        <Skeleton className="h-10 w-[120px] rounded-[12px]" />
      </div>
      <WarmCard padding="none">
        <TableSkeleton rows={8} />
      </WarmCard>
    </div>
  )
}
