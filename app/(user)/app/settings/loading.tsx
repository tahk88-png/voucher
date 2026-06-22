import { FormSkeleton } from "@/components/ui/loading-skeletons"

export default function SettingsLoading() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <FormSkeleton />
    </div>
  )
}
