import { safeParseJson } from "@/lib/utils"
import { pageMetadata } from '@/lib/seo/page-metadata';
import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getTranslations } from "next-intl/server"
import { getAppUrl } from "@/lib/app-url"
import ReferralsClient from "./referrals-client"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("account")
  return pageMetadata({ title: t("referrals.metaTitle"), noIndex: true })
}

const VOUCHER_TYPES = ["percentage", "fixed_amount", "credit_amount"]

export default async function ReferralsPage() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/login")
  }
  const tReferral = await getTranslations("referral")
  const tLabels = await getTranslations("labels")
  const voucherTypeLabel = (type: string) =>
    VOUCHER_TYPES.includes(type.toLowerCase()) ? tLabels(`voucherType.${type.toLowerCase()}`) : type

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
          safeParseJson<{ headline?: string }>(referral.voucher?.designJson)?.headline ||
          (referral.voucher?.type ? voucherTypeLabel(referral.voucher.type) : "") ||
          tReferral("voucherLabel"),
        status: referral.status,
        createdAt: referral.createdAt.toISOString(),
        link: `${appUrl}/r/${referral.id}`,
      }))}
    />
  )
}
