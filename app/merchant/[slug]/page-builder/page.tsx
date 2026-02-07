import { redirect, notFound } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { requireMerchantRole } from "@/lib/rbac"
import { getDefaultBuilderConfig, type PageBuilderConfig } from "@/lib/page-builder"
import PageBuilderClient from "@/components/page-builder/page-builder-client"

export default async function PageBuilderPage({ params }: { params: { slug: string } }) {
  const session = await auth()
  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=${encodeURIComponent(`/merchant/${params.slug}/page-builder`)}`)
  }

  const merchant = await prisma.merchant.findUnique({
    where: { slug: params.slug },
  })
  if (!merchant) {
    notFound()
  }

  await requireMerchantRole(session.user.id, merchant.id, "merchant_staff")

  const pages = await prisma.pageBuilderPage.findMany({
    where: { merchantId: merchant.id },
  })

  const storeConfig = getDefaultBuilderConfig("store")
  const rentalConfig = getDefaultBuilderConfig("rental")

  const merged: PageBuilderConfig[] = [storeConfig, rentalConfig].map((fallback) => {
    const page = pages.find((item) => item.type === fallback.type)
    if (!page) return fallback
    return {
      id: page.id,
      type: page.type as PageBuilderConfig["type"],
      title: page.title,
      subtitle: page.subtitle ?? fallback.subtitle,
      status: (page.status as PageBuilderConfig["status"]) ?? fallback.status,
      sections: (page.sectionsJson as string[] | null) ?? fallback.sections,
      addons: (page.addonsJson as string[] | null) ?? fallback.addons,
      theme: (page.themeJson as PageBuilderConfig["theme"] | null) ?? fallback.theme,
    }
  })

  return (
    <div className="p-4 sm:p-6">
      <PageBuilderClient
        merchantSlug={merchant.slug}
        merchantName={merchant.name}
        initialPages={merged}
      />
    </div>
  )
}
