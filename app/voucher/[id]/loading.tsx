import { WarmCard } from "@/components/warm-card"

export default function VoucherLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Image skeleton */}
        <WarmCard padding="none" className="overflow-hidden">
          <div className="aspect-square w-full animate-pulse bg-[#F8F6F1]" />
        </WarmCard>

        {/* Details skeleton */}
        <div className="space-y-6">
          <div className="space-y-3">
            <div className="h-8 w-3/4 animate-pulse rounded-[8px] bg-[#F8F6F1]" />
            <div className="h-4 w-1/2 animate-pulse rounded-[8px] bg-[#F8F6F1]" />
          </div>

          <WarmCard padding="md">
            <div className="space-y-2">
              <div className="h-10 w-32 animate-pulse rounded-[8px] bg-[#F8F6F1]" />
              <div className="h-4 w-24 animate-pulse rounded-[8px] bg-[#F8F6F1]" />
            </div>
          </WarmCard>

          <div className="space-y-2">
            <div className="h-4 w-full animate-pulse rounded-[8px] bg-[#F8F6F1]" />
            <div className="h-4 w-full animate-pulse rounded-[8px] bg-[#F8F6F1]" />
            <div className="h-4 w-3/4 animate-pulse rounded-[8px] bg-[#F8F6F1]" />
          </div>

          <div className="flex gap-3">
            <div className="h-12 flex-1 animate-pulse rounded-[12px] bg-[#F8F6F1]" />
            <div className="h-12 w-12 animate-pulse rounded-[12px] bg-[#F8F6F1]" />
          </div>

          <WarmCard padding="md">
            <div className="space-y-3">
              <div className="h-5 w-32 animate-pulse rounded-[8px] bg-[#F8F6F1]" />
              <div className="space-y-2">
                <div className="h-3 w-full animate-pulse rounded-[8px] bg-[#F8F6F1]" />
                <div className="h-3 w-full animate-pulse rounded-[8px] bg-[#F8F6F1]" />
                <div className="h-3 w-2/3 animate-pulse rounded-[8px] bg-[#F8F6F1]" />
              </div>
            </div>
          </WarmCard>
        </div>
      </div>
    </div>
  )
}
