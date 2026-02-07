import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { hashToken } from "@/lib/b2b/crypto"

export type OrgRole =
  | "owner"
  | "admin"
  | "finance"
  | "marketing"
  | "support"
  | "partner_cashier"
  | "auditor"

export async function requireSession() {
  const session = await auth()
  if (!session?.user?.id) {
    return null
  }
  return session
}

export async function requireOrgMembership(userId: string, orgId: string, roles?: OrgRole[]) {
  const membership = await prisma.orgMembership.findUnique({
    where: { orgId_userId: { orgId, userId } },
  })
  if (!membership) return null
  if (roles && roles.length > 0 && !roles.includes(membership.role as OrgRole)) return null
  return membership
}

export async function requirePartnerApiKey(rawKey: string | null) {
  if (!rawKey) return null
  const keyHash = hashToken(rawKey)
  const apiKey = await prisma.partnerApiKey.findUnique({
    where: { keyHash },
    include: { org: true },
  })
  if (!apiKey) return null
  await prisma.partnerApiKey.update({
    where: { keyHash },
    data: { lastUsedAt: new Date() },
  })
  return apiKey
}
