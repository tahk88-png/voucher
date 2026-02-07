import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import ReferralsClient from "./referrals-client"

export default async function ReferralsPage() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/login")
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  const referralLink = `${baseUrl}/app/share`
  const referralCode = `GH-${session.user.id.slice(0, 6).toUpperCase()}`

  const [referrals, totalReferrals, redeemedReferrals, creditTotals, pendingCredits, latestCredit] =
    await Promise.all([
      prisma.referral.findMany({
        where: { referrerUserId: session.user.id },
        include: { merchant: true, voucher: true },
        orderBy: { createdAt: "desc" },
        take: 25,
      }),
      prisma.referral.count({ where: { referrerUserId: session.user.id } }),
      prisma.referral.count({
        where: { referrerUserId: session.user.id, status: "redeemed" },
      }),
      prisma.creditLedger.aggregate({
        where: { userId: session.user.id, source: "referral_redemption" },
        _sum: { amount: true },
      }),
      prisma.creditLedger.aggregate({
        where: { userId: session.user.id, source: "referral_redemption", status: "locked" },
        _sum: { amount: true },
      }),
      prisma.creditLedger.findFirst({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
        select: { currency: true },
      }),
    ])

  const currency = latestCredit?.currency || "EUR"
  const totalEarned = creditTotals._sum.amount ?? 0
  const pendingRewards = pendingCredits._sum.amount ?? 0

  return (
    <ReferralsClient
      referralLink={referralLink}
      referralCode={referralCode}
      currency={currency}
      stats={{
        totalEarned,
        pendingRewards,
        activeReferrals: totalReferrals - redeemedReferrals,
        completedReferrals: redeemedReferrals,
      }}
      referrals={referrals.map((referral) => ({
        id: referral.id,
        merchantName: referral.merchant?.name || "Merchant",
        voucherTitle:
          (referral.voucher?.designJson as { headline?: string } | null)?.headline ||
          referral.voucher?.type ||
          "Voucher",
        status: referral.status,
        createdAt: referral.createdAt.toISOString(),
      }))}
    />
  )
}
