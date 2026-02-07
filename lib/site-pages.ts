import { prisma } from "@/lib/prisma"

export type SiteScope = "tenant" | "hub"

export async function getSitePage({
  merchantId,
  scope,
  slug,
}: {
  merchantId?: string | null
  scope: SiteScope
  slug: string
}) {
  return prisma.sitePage.findFirst({
    where: {
      scope,
      slug,
      merchantId: merchantId ?? null,
      status: "published",
    },
  })
}
