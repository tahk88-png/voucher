import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { WarmButton } from "@/components/warm-button"
import { WarmCard } from "@/components/warm-card"
import Link from "next/link"
import RedeemClient from "./redeem-client"

export default async function RedeemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/login")
  }

  const voucher = await prisma.voucher.findUnique({
    where: { id },
    include: { merchant: true },
  })

  if (!voucher) {
    return (
      <div className="p-4 sm:p-6">
        <WarmCard padding="lg" className="max-w-lg bg-white">
          <p className="text-sm text-[#6B5744]">Voucher not found.</p>
          <WarmButton asChild variant="outline" className="mt-4">
            <Link href="/app">Back to wallet</Link>
          </WarmButton>
        </WarmCard>
      </div>
    )
  }

  const code = `${voucher.codePrefix || "V"}-${voucher.id.slice(0, 8).toUpperCase()}`

  return <RedeemClient voucherId={voucher.id} code={code} expiryDate={voucher.validTo.toISOString()} />
}
