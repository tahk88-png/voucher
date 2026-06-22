import { TableSkeleton } from "@/components/ui/loading-skeletons"

export default function AdminVatLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <TableSkeleton rows={6} />
    </div>
  )
}
