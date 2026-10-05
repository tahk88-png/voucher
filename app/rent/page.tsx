import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { pageMetadata } from '@/lib/seo/page-metadata';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("shop.rentPage")
  return pageMetadata({ title: t("metaTitle"), description: t("metaDescription"), path: '/rent' })
}

import { redirect } from "next/navigation"
import TenantShell from "@/components/layout/tenant-shell"
import RentClient from "@/components/rent/rent-client"
import { prisma } from "@/lib/prisma"
import { getTenantContext } from "@/lib/tenant-context"

export default async function RentPage() {
  const context = await getTenantContext()
  if (context.mode !== "tenant" || !context.tenant) {
    redirect("/hub")
  }

  const t = await getTranslations("shop.rentPage")
  const rentals = await prisma.rentalItem.findMany({
    where: { merchantId: context.tenant.id, status: "active" },
    orderBy: { createdAt: "desc" },
  })

  return (
    <TenantShell merchant={context.tenant}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-[#2D2721]">{t("title")}</h1>
          <p className="text-sm text-[#6B5744]">{t("subtitle")}</p>
        </div>
        <RentClient
          merchantId={context.tenant.id}
          currency={context.tenant.defaultCurrency}
          rentals={rentals}
        />
      </div>
    </TenantShell>
  )
}
