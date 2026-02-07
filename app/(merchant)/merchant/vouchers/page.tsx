import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { WarmCard } from "@/components/warm-card"
import { WarmButton } from "@/components/warm-button"
import Link from "next/link"
import { Gift, Plus } from "lucide-react"

export default async function MerchantVouchersAliasPage() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/login")
  }

  const member = await prisma.merchantMember.findFirst({
    where: { userId: session.user.id },
    include: { merchant: true },
    orderBy: { createdAt: "asc" },
  })

  if (!member?.merchant) {
    return (
      <WarmCard padding="lg" className="bg-white text-center border border-[#E7DCC7]">
        <Gift className="h-12 w-12 mx-auto text-[#8B7355] mb-4" />
        <h3 className="text-lg font-semibold text-[#2D2721] mb-2">No merchant access</h3>
        <p className="text-sm text-[#6B5744] mb-4">
          Connect to a merchant account to manage vouchers.
        </p>
        <WarmButton asChild>
          <Link href="/campaigns">
            <span className="inline-flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Explore campaigns
            </span>
          </Link>
        </WarmButton>
      </WarmCard>
    )
  }

  redirect(`/merchant/${member.merchant.slug}/vouchers`)
}
