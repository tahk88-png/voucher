import * as React from "react"
import { redirect } from "next/navigation"
import { getTranslations } from "next-intl/server"
import { prisma } from "@/lib/prisma"
import UserShell from "@/components/navigation/user-shell"
import { AccessControlError, requireAuthenticatedProfile } from "@/lib/access-control"

export default async function UserAppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  let profile
  try {
    profile = await requireAuthenticatedProfile()
  } catch (error) {
    if (error instanceof AccessControlError && error.status === 401) {
      redirect("/login")
    }
    redirect("/login")
  }

  const user = await prisma.user.findUnique({
    where: { id: profile.userId },
  })

  const now = new Date()
  const [activeUsers, campaigns, vouchers, redemptions] = await Promise.all([
    prisma.user.count(),
    prisma.campaign.count({ where: { status: "active", endDate: { gte: now } } }),
    prisma.voucher.count({ where: { status: "published", validFrom: { lte: now }, validTo: { gte: now } } }),
    prisma.redemption.count({ where: { confirmedAt: { not: null } } }),
  ])

  const engagement = activeUsers ? Math.min(99, Math.max(10, Math.round((redemptions / activeUsers) * 100))) : 75
  const tNav = await getTranslations("nav")
  const tAnalytics = await getTranslations("analytics")

  return (
    <UserShell
      userLabel={user?.name || user?.email || tNav("user")}
      stats={[
        { label: tAnalytics("activeUsers"), value: activeUsers.toString() },
        { label: tNav("campaigns"), value: campaigns.toString() },
        { label: tNav("vouchers"), value: vouchers.toString() },
        { label: tAnalytics("engagement"), value: `${engagement}%` },
      ]}
    >
      {children}
    </UserShell>
  )
}
