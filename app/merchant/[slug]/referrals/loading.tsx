import { TableSkeleton } from "@/components/ui/loading-skeletons"
import { Skeleton } from "@/components/ui/skeleton"
import { WarmCard } from "@/components/warm-card"

export default function MerchantReferralsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-[160px]" />
          <Skeleton className="h-4 w-[260px]" />
        </div>
        <Skeleton className="h-10 w-[140px] rounded-[12px]" />
      </div>
      <WarmCard padding="none">
        <TableSkeleton rows={8} />
      </WarmCard>
    </div>
  )
}
