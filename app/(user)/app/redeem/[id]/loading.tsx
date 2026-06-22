import { CardSkeleton } from "@/components/ui/loading-skeletons"

export default function RedeemLoading() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-lg">
      <CardSkeleton />
    </div>
  )
}
