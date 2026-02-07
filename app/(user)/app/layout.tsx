import * as React from "react"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import UserShell from "@/components/navigation/user-shell"

export default async function UserAppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/login")
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  })

  const now = new Date()
  const [activeUsers, campaigns, vouchers, redemptions] = await Promise.all([
    prisma.user.count(),
    prisma.campaign.count({ where: { status: "active", endDate: { gte: now } } }),
    prisma.voucher.count({ where: { status: "published", validFrom: { lte: now }, validTo: { gte: now } } }),
    prisma.redemption.count({ where: { confirmedAt: { not: null } } }),
  ])

  const engagement = activeUsers ? Math.min(99, Math.max(10, Math.round((redemptions / activeUsers) * 100))) : 75

  return (
    <UserShell
      userLabel={user?.name || user?.email || "User"}
      stats={[
        { label: "Active Users", value: activeUsers.toString() },
        { label: "Campaigns", value: campaigns.toString() },
        { label: "Vouchers", value: vouchers.toString() },
        { label: "Engagement", value: `${engagement}%` },
      ]}
    >
      {children}
    </UserShell>
  )
}
