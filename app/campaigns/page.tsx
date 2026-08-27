import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { getPreferredLocale } from "@/lib/request-locale"
import HubShell from "@/components/layout/hub-shell"
import { toQueryString, type SearchParams } from "@/lib/search-params"
import { routing } from "@/routing"
import { getTenantContext } from "@/lib/tenant-context"
import TenantShell from "@/components/layout/tenant-shell"
import { prisma } from "@/lib/prisma"
import { formatCurrency } from "@/lib/utils"
import { WarmCard } from "@/components/warm-card"
import { WarmButton } from "@/components/warm-button"
import Link from "next/link"

import CampaignsPage, {
  generateMetadata as generateLocaleMetadata,
} from "@/app/[locale]/campaigns/page"

export async function generateMetadata(): Promise<Metadata> {
  // The locale page now follows Next 15's PageProps contract (params and
  // searchParams are Promises), so this alias hands it resolved promises.
  return generateLocaleMetadata({
    params: Promise.resolve({ locale: routing.defaultLocale }),
  })
}

function normalizeCampaignSearchParams(searchParams?: SearchParams): {
  category?: string
  q?: string
} {
  const category = searchParams?.category
  const q = searchParams?.q

  return {
    category: typeof category === "string" ? category : undefined,
    q: typeof q === "string" ? q : undefined,
  }
}

export default async function CampaignsAliasPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>
}) {
  const sp = await searchParams
  const context = await getTenantContext()
  if (context.mode === "tenant" && context.tenant) {
    const tenant = context.tenant
    const now = new Date()
    const vouchers = await prisma.voucher.findMany({
      where: {
        merchantId: context.tenant.id,
        status: "published",
        validFrom: { lte: now },
        validTo: { gte: now },
      },
      orderBy: { createdAt: "desc" },
    })

    return (
      <TenantShell merchant={tenant}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-[#2D2721]">Vouchers</h1>
            <p className="text-sm text-[#6B5744]">Active offers from {tenant.name}.</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {vouchers.length === 0 ? (
              <WarmCard padding="lg" className="bg-white col-span-full text-center">
                <p className="text-[#6B5744]">No vouchers available yet.</p>
              </WarmCard>
            ) : (
              vouchers.map((voucher) => (
                <WarmCard key={voucher.id} padding="lg" className="bg-white">
                  <p className="font-semibold text-[#2D2721]">Voucher</p>
                  <p className="text-sm text-[#6B5744] mt-2">
                    {formatCurrency(voucher.value, voucher.currency || tenant.defaultCurrency)}
                  </p>
                  <WarmButton asChild className="mt-3">
                    <Link href={`/v/${voucher.id}`}>View voucher</Link>
                  </WarmButton>
                </WarmCard>
              ))
            )}
          </div>
        </div>
      </TenantShell>
    )
  }

  const locale = await getPreferredLocale()

  if (locale !== routing.defaultLocale) {
    redirect(`/${locale}/campaigns${toQueryString(sp)}`)
  }

  return (
    <HubShell>
      <CampaignsPage
        params={Promise.resolve({ locale: routing.defaultLocale })}
        searchParams={Promise.resolve(normalizeCampaignSearchParams(sp))}
      />
    </HubShell>
  )
}
