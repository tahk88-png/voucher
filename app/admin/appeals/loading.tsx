import { TableSkeleton } from "@/components/ui/loading-skeletons"

export default function AdminAppealsLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <TableSkeleton rows={6} />
    </div>
  )
}
