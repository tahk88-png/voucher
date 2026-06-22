import { FormSkeleton } from "@/components/ui/loading-skeletons"
import { Skeleton } from "@/components/ui/skeleton"
import { WarmCard } from "@/components/warm-card"

export default function ProfileLoading() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-[140px]" />
        <Skeleton className="h-4 w-[260px]" />
      </div>
      <WarmCard padding="lg">
        <FormSkeleton />
      </WarmCard>
    </div>
  )
}
