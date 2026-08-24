import { ListSkeleton } from "@/components/ui/loading-skeletons"

export default function GiftsLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <ListSkeleton items={6} />
    </div>
  )
}
