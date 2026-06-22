import { CardSkeleton } from "@/components/ui/loading-skeletons"

export default function PaymentCancelLoading() {
  return (
    <div className="flex items-center justify-center min-h-[60vh] px-4">
      <div className="w-full max-w-md">
        <CardSkeleton />
      </div>
    </div>
  )
}
