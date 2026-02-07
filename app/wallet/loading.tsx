import { WarmCard } from "@/components/warm-card"
import { VoucherCardSkeleton } from "@/components/ui/loading-skeletons"

export default function WalletLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 space-y-2">
        <div className="h-10 w-48 animate-pulse rounded-[12px] bg-[#F8F6F1]" />
        <div className="h-5 w-64 animate-pulse rounded-[8px] bg-[#F8F6F1]" />
      </div>

      <WarmCard padding="lg" className="mb-8">
        <div className="space-y-4">
          <div className="h-5 w-32 animate-pulse rounded-[8px] bg-[#F8F6F1]" />
          <div className="h-12 w-40 animate-pulse rounded-[8px] bg-[#F8F6F1]" />
          <div className="flex gap-3">
            <div className="h-10 flex-1 animate-pulse rounded-[12px] bg-[#F8F6F1]" />
            <div className="h-10 flex-1 animate-pulse rounded-[12px] bg-[#F8F6F1]" />
          </div>
        </div>
      </WarmCard>

      <div className="space-y-4">
        <div className="h-6 w-40 animate-pulse rounded-[8px] bg-[#F8F6F1]" />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <VoucherCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  )
}
