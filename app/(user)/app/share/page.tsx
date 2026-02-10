import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getTranslations } from "next-intl/server"
import ShareClient from "./share-client"

export default async function SharePage() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/login")
  }
  const tShare = await getTranslations("share")

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  const inviteLink = `${baseUrl}/app/share`

  const referrals = await prisma.referral.findMany({
    where: { referrerUserId: session.user.id },
    include: { merchant: true, voucher: true },
    orderBy: { createdAt: "desc" },
    take: 10,
  })

  const shares = referrals.map((referral) => ({
    id: referral.id,
    friendLabel: referral.friendHash
      ? `${tShare("friendLabel")} ${referral.friendHash.slice(0, 6)}`
      : tShare("friendLabel"),
    voucherTitle:
      (referral.voucher?.designJson as { headline?: string } | null)?.headline ||
      referral.voucher?.type ||
      tShare("voucherLabel"),
    createdAt: referral.createdAt.toISOString(),
    status: referral.status,
  }))

  return <ShareClient inviteLink={inviteLink} shares={shares} />
}
