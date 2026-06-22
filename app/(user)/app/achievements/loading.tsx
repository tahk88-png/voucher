import { ListSkeleton } from "@/components/ui/loading-skeletons"

export default function AchievementsLoading() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <ListSkeleton items={6} />
    </div>
  )
}
