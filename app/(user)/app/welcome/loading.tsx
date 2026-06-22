import { FormSkeleton } from "@/components/ui/loading-skeletons"

export default function WelcomeLoading() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-md">
      <FormSkeleton />
    </div>
  )
}
