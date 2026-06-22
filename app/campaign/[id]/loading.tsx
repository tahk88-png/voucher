import { CardSkeleton } from "@/components/ui/loading-skeletons"
import { Skeleton } from "@/components/ui/skeleton"

export default function CampaignLoading() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-[240px]" />
        <Skeleton className="h-4 w-[360px]" />
      </div>
      <CardSkeleton />
    </div>
  )
}
