import { Suspense } from "react"
import { prisma } from "@/lib/prisma"
import { WarmCard } from "@/components/warm-card"
import { formatDistanceToNow } from "date-fns"
import { Activity } from "lucide-react"

async function RecentActivityContent({ merchantId }: { merchantId: string }) {
  const recentRedemptions = await prisma.redemption.findMany({
    where: { merchantId },
    orderBy: { createdAt: "desc" },
    take: 10,
    include: {
      voucher: {
        select: {
          designJson: true,
        },
      },
      redeemedBy: {
        select: {
          name: true,
          email: true,
        },
      },
      redeemedByStaff: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  })

  if (recentRedemptions.length === 0) {
    return (
      <WarmCard padding="lg">
        <div className="flex items-center gap-3 mb-4">
          <Activity className="h-5 w-5 text-[var(--text-faint)]" />
          <h3 className="text-lg font-semibold text-[var(--text)]">
            Recent Activity
          </h3>
        </div>
        <div className="text-center py-8 text-[var(--text-faint)]">
          No recent activity
        </div>
      </WarmCard>
    )
  }

  return (
    <WarmCard padding="lg">
      <div className="flex items-center gap-3 mb-4">
        <Activity className="h-5 w-5 text-[var(--text-faint)]" />
        <h3 className="text-lg font-semibold text-[var(--text)]">
          Recent Activity
        </h3>
      </div>
      <div className="space-y-3">
        {recentRedemptions.map((redemption) => (
          <div
            key={redemption.id}
            className="flex items-center justify-between p-3 rounded-[12px] bg-[#FFFBF5] hover:bg-[#FAF7F2] transition-colors"
          >
            <div>
              <p className="text-sm font-medium text-[var(--text)]">
                {redemption.redeemedBy?.name ||
                  redemption.redeemedBy?.email ||
                  redemption.redeemedByStaff?.name ||
                  redemption.redeemedByStaff?.email ||
                  "Unknown user"}
              </p>
              <p className="text-xs text-[var(--text-muted)]">
                Redeemed voucher -{" "}
                {formatDistanceToNow(new Date(redemption.createdAt), {
                  addSuffix: true,
                })}
              </p>
            </div>
            <div
              className={`px-2 py-1 rounded-[8px] text-xs font-medium ${
                redemption.confirmedAt
                  ? "bg-[#4e8a5b]/20 text-[#4e8a5b]"
                  : "bg-[#be8a2e]/20 text-[var(--text-faint)]"
              }`}
            >
              {redemption.confirmedAt ? "Confirmed" : "Pending"}
            </div>
          </div>
        ))}
      </div>
    </WarmCard>
  )
}

function RecentActivitySkeleton() {
  return (
    <WarmCard padding="lg">
      <div className="flex items-center gap-3 mb-4">
        <div className="h-5 w-5 animate-pulse rounded bg-[#F8F6F1]" />
        <div className="h-5 w-32 animate-pulse rounded-[8px] bg-[#F8F6F1]" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-16 animate-pulse rounded-[12px] bg-[#F8F6F1]"
          />
        ))}
      </div>
    </WarmCard>
  )
}

export function RecentActivity({ merchantId }: { merchantId: string }) {
  return (
    <Suspense fallback={<RecentActivitySkeleton />}>
      <RecentActivityContent merchantId={merchantId} />
    </Suspense>
  )
}
