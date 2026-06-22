import { FormSkeleton } from "@/components/ui/loading-skeletons"
import { WarmCard } from "@/components/warm-card"

export default function LoginLoading() {
  return (
    <div className="flex items-center justify-center min-h-[60vh] px-4">
      <WarmCard padding="lg" className="w-full max-w-md">
        <FormSkeleton />
      </WarmCard>
    </div>
  )
}
