import { CardSkeleton } from "@/components/ui/loading-skeletons"
import { WarmCard } from "@/components/warm-card"

export default function MerchantCampaignsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 w-48 animate-pulse rounded-[8px] bg-[#F8F6F1]" />
          <div className="h-4 w-64 animate-pulse rounded-[8px] bg-[#F8F6F1]" />
        </div>
        <div className="h-10 w-40 animate-pulse rounded-[12px] bg-[#F8F6F1]" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <WarmCard key={i} padding="md" className="space-y-4">
            <div className="aspect-video w-full animate-pulse rounded-[12px] bg-[#F8F6F1]" />
            <div className="space-y-3">
              <div className="h-6 w-3/4 animate-pulse rounded-[8px] bg-[#F8F6F1]" />
              <div className="space-y-2">
                <div className="h-3 w-full animate-pulse rounded-[8px] bg-[#F8F6F1]" />
                <div className="h-3 w-full animate-pulse rounded-[8px] bg-[#F8F6F1]" />
                <div className="h-3 w-2/3 animate-pulse rounded-[8px] bg-[#F8F6F1]" />
              </div>
              <div className="flex gap-2">
                <div className="h-6 w-20 animate-pulse rounded-[8px] bg-[#F8F6F1]" />
                <div className="h-6 w-24 animate-pulse rounded-[8px] bg-[#F8F6F1]" />
              </div>
            </div>
          </WarmCard>
        ))}
      </div>
    </div>
  )
}
