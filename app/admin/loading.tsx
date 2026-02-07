import { DashboardSkeleton } from "@/components/ui/loading-skeletons"

export default function AdminLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <DashboardSkeleton />
    </div>
  )
}
