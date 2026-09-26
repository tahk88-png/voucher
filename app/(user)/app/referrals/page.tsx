import { pageMetadata } from '@/lib/seo/page-metadata';
export const metadata = pageMetadata({ title: 'My Referrals', noIndex: true });

import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getTranslations } from "next-intl/server"
import { getAppUrl } from "@/lib/app-url"
import ReferralsClient from "./referrals-client"

export default async function ReferralsPage() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/login")
  }
  const tReferral = await getTranslations("referral")

  // Referrals are per voucher: sharing a voucher creates a Referral whose public
  // page (/r/<id>) attributes the friend's redemption. There is no account-wide
  // invite code, so each tracked link is listed with its referral.
  const appUrl = getAppUrl()

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
      currency={currency}
      stats={{
        totalEarned,
        pendingRewards,
        activeReferrals: totalReferrals - redeemedReferrals,
        completedReferrals: redeemedReferrals,
      }}
      referrals={referrals.map((referral) => ({
        id: referral.id,
        merchantName: referral.merchant?.name || tReferral("merchantLabel"),
        voucherTitle:
          (referral.voucher?.designJson as { headline?: string } | null)?.headline ||
          referral.voucher?.type ||
          tReferral("voucherLabel"),
        status: referral.status,
        createdAt: referral.createdAt.toISOString(),
        link: `${appUrl}/r/${referral.id}`,
      }))}
    />
  )
}
