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

  const tNav = await getTranslations("nav")

  // Organisations are invite-only; the B2B entry is shown only to members.
  const orgs = await prisma.orgMembership.findMany({
    where: { userId: profile.userId },
    include: { org: { select: { id: true, name: true } } },
    take: 10,
  })
  const orgMemberships = orgs.map((o) => ({ orgId: o.org.id, orgName: o.org.name, role: o.role }))

  return (
    <UserShell
      userLabel={user?.name || user?.email || tNav("user")}
      roles={profile.roles}
      merchantMemberships={profile.merchantMemberships.map((m) => ({
        merchantId: m.merchantId,
        merchantSlug: m.merchantSlug,
        merchantName: m.merchantName,
        role: m.role,
      }))}
      orgMemberships={orgMemberships}
      hasOrgs={orgMemberships.length > 0}
      adminRole={profile.adminRole}
    >
      {children}
    </UserShell>
  )
}
