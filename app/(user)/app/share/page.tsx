import { safeParseJson } from "@/lib/utils"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getTranslations } from "next-intl/server"
import { getAppUrl } from "@/lib/app-url"
import ShareClient from "./share-client"

export default async function SharePage() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/login")
  }
  const tShare = await getTranslations("share")

  // Rewards are tracked per shared voucher (/r/<referralId>). The general link
  // only points friends at the public offers and is labelled as untracked.
  const appUrl = getAppUrl()
  const offersLink = `${appUrl}/campaigns`

  const referrals = await prisma.referral.findMany({
    where: { referrerUserId: session.user.id },
    include: { merchant: { select: { name: true } }, voucher: true },
    orderBy: { createdAt: "desc" },
    take: 10,
  })

  const shares = referrals.map((referral) => ({
    id: referral.id,
    merchantName: referral.merchant.name,
    voucherTitle:
      safeParseJson<{ headline?: string }>(referral.voucher?.designJson)?.headline ||
      referral.voucher?.type ||
      tShare("voucherLabel"),
    createdAt: referral.createdAt.toISOString(),
    status: referral.status,
    link: `${appUrl}/r/${referral.id}`,
  }))

  return <ShareClient offersLink={offersLink} shares={shares} />
}
