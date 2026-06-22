import { Skeleton } from "@/components/ui/skeleton"

export default function EntryLoading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Skeleton className="h-8 w-8 rounded-full" />
    </div>
  )
}
