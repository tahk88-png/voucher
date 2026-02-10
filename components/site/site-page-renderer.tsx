import Link from "next/link"
import { WarmButton } from "@/components/warm-button"
import { WarmCard } from "@/components/warm-card"
import { getTenantProducts, getTenantRentals, getTenantVouchers, getTenantStats } from "@/lib/commerce-data"
import { prisma } from "@/lib/prisma"
import { getTenantBaseUrlWithMapping } from "@/lib/tenant-url"
import { formatCurrency } from "@/lib/utils"

interface SitePageRendererProps {
  blocks: string[]
  scope: "tenant" | "hub"
  merchant?: {
    id: string
    name: string
    slug: string
    defaultCurrency: string
  }
}

export default async function SitePageRenderer({ blocks, scope, merchant }: SitePageRendererProps) {
  const tenantId = merchant?.id
  const now = new Date()
  const [products, rentals, vouchers, stats, tenants] = await Promise.all([
    tenantId
      ? getTenantProducts(tenantId)
      : scope === "hub"
        ? prisma.product.findMany({
            where: { status: "active", merchant: { isActive: true } },
            orderBy: { createdAt: "desc" },
            take: 6,
            include: { merchant: { include: { domainMappings: true } } },
          })
        : Promise.resolve([]),
    tenantId
      ? getTenantRentals(tenantId)
      : scope === "hub"
        ? prisma.rentalItem.findMany({
            where: { status: "active", merchant: { isActive: true } },
            orderBy: { createdAt: "desc" },
            take: 6,
            include: { merchant: { include: { domainMappings: true } } },
          })
        : Promise.resolve([]),
    tenantId
      ? getTenantVouchers(tenantId)
      : scope === "hub"
        ? prisma.voucher.findMany({
            where: {
              status: "published",
              validFrom: { lte: now },
              validTo: { gte: now },
              merchant: { isActive: true },
            },
            orderBy: { createdAt: "desc" },
            take: 6,
            include: { merchant: { include: { domainMappings: true } } },
          })
        : Promise.resolve([]),
    tenantId ? getTenantStats(tenantId) : Promise.resolve(null),
    scope === "hub"
      ? prisma.merchant.findMany({
          where: { isActive: true },
          take: 6,
          include: { domainMappings: true },
        })
      : Promise.resolve([]),
  ])

  const tenantLinks =
    scope === "hub"
      ? await Promise.all(
          tenants.map(async (tenant) => ({
            tenant,
            url: await getTenantBaseUrlWithMapping(tenant),
          }))
        )
      : []

  const merchantUrlMap = new Map<string, string>()
  if (scope === "hub") {
    const hubMerchants = new Map<string, { id: string; slug: string; domainMappings?: any[] }>()
    for (const item of [...products, ...rentals, ...vouchers]) {
      const merchant = (item as any).merchant
      if (merchant && !hubMerchants.has(merchant.id)) {
        hubMerchants.set(merchant.id, merchant)
      }
    }
    await Promise.all(
      Array.from(hubMerchants.values()).map(async (merchant) => {
        merchantUrlMap.set(merchant.id, await getTenantBaseUrlWithMapping(merchant))
      })
    )
  }

  return (
    <div className="space-y-12">
      {blocks.map((block) => {
        switch (block) {
          case "hero":
            return (
              <section key={block} className="text-center py-12">
                <h1 className="text-4xl font-bold text-[var(--text)]">
                  {scope === "hub" ? "Discover local merchants" : merchant?.name}
                </h1>
                <p className="mt-3 text-[var(--text-muted)]">
                  {scope === "hub"
                    ? "Browse vouchers, rentals, and storefronts from verified partners."
                    : "Explore products, rentals, and vouchers in one place."}
                </p>
                <div className="mt-6 flex justify-center gap-3">
                  <WarmButton asChild>
                    <Link href={scope === "hub" ? "/hub#tenants" : "/shop"}>Get started</Link>
                  </WarmButton>
                </div>
              </section>
            )
          case "featured_tenants":
            return (
              <section key={block} id="tenants">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                  <h2 className="text-2xl font-bold text-[var(--text)] mb-6">Featured tenants</h2>
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {tenants.length === 0 ? (
                      <WarmCard padding="lg" className="col-span-full text-center bg-[var(--surface)]">
                        <p className="text-[var(--text-muted)]">No tenants found.</p>
                      </WarmCard>
                    ) : (
                      tenantLinks.map(({ tenant, url }) => (
                        <WarmCard key={tenant.id} padding="lg" className="bg-[var(--surface)]">
                          <p className="font-semibold text-[var(--text)]">{tenant.name}</p>
                          <p className="text-sm text-[var(--text-muted)] mt-1">{tenant.country}</p>
                          <WarmButton asChild className="mt-3">
                            <Link href={url}>Visit tenant</Link>
                          </WarmButton>
                        </WarmCard>
                      ))
                    )}
                  </div>
                </div>
              </section>
            )
          case "featured_products":
            return (
              <section key={block}>
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                  <h2 className="text-2xl font-bold text-[var(--text)] mb-6">Featured products</h2>
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {products.length === 0 ? (
                      <WarmCard padding="lg" className="col-span-full text-center bg-[var(--surface)]">
                        <p className="text-[var(--text-muted)]">No products available.</p>
                      </WarmCard>
                    ) : (
                      products.map((product: any) => {
                        const merchantUrl =
                          scope === "hub" && product.merchant
                            ? merchantUrlMap.get(product.merchantId)
                            : null
                        const href = merchantUrl ? `${merchantUrl}/shop` : "/shop"
                        return (
                          <WarmCard key={product.id} padding="lg" className="bg-[var(--surface)]">
                            <Link href={href} className="block">
                              <p className="font-semibold text-[var(--text)]">{product.name}</p>
                              {scope === "hub" && product.merchant ? (
                                <p className="text-xs text-[var(--text-faint)] mt-1">{product.merchant.name}</p>
                              ) : null}
                              <p className="text-sm text-[var(--text-muted)] mt-1">
                                {formatCurrency(product.price, product.currency)}
                              </p>
                            </Link>
                          </WarmCard>
                        )
                      })
                    )}
                  </div>
                </div>
              </section>
            )
          case "featured_rentals":
            return (
              <section key={block}>
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                  <h2 className="text-2xl font-bold text-[var(--text)] mb-6">Rental highlights</h2>
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {rentals.length === 0 ? (
                      <WarmCard padding="lg" className="col-span-full text-center bg-[var(--surface)]">
                        <p className="text-[var(--text-muted)]">No rentals available.</p>
                      </WarmCard>
                    ) : (
                      rentals.map((item: any) => {
                        const merchantUrl =
                          scope === "hub" && item.merchant ? merchantUrlMap.get(item.merchantId) : null
                        const href = merchantUrl ? `${merchantUrl}/rent` : "/rent"
                        return (
                          <WarmCard key={item.id} padding="lg" className="bg-[var(--surface)]">
                            <Link href={href} className="block">
                              <p className="font-semibold text-[var(--text)]">{item.name}</p>
                              {scope === "hub" && item.merchant ? (
                                <p className="text-xs text-[var(--text-faint)] mt-1">{item.merchant.name}</p>
                              ) : null}
                              <p className="text-sm text-[var(--text-muted)] mt-1">
                                {formatCurrency(item.dailyRate, item.currency)} / day
                              </p>
                            </Link>
                          </WarmCard>
                        )
                      })
                    )}
                  </div>
                </div>
              </section>
            )
          case "featured_vouchers":
            return (
              <section key={block}>
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                  <h2 className="text-2xl font-bold text-[var(--text)] mb-6">Active vouchers</h2>
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {vouchers.length === 0 ? (
                      <WarmCard padding="lg" className="col-span-full text-center bg-[var(--surface)]">
                        <p className="text-[var(--text-muted)]">No vouchers available.</p>
                      </WarmCard>
                    ) : (
                      vouchers.map((voucher: any) => {
                        const merchantUrl =
                          scope === "hub" && voucher.merchant
                            ? merchantUrlMap.get(voucher.merchantId)
                            : null
                        const href = merchantUrl ? `${merchantUrl}/v/${voucher.id}` : `/v/${voucher.id}`
                        return (
                          <WarmCard key={voucher.id} padding="lg" className="bg-[var(--surface)]">
                            <p className="font-semibold text-[var(--text)]">Voucher</p>
                            {scope === "hub" && voucher.merchant ? (
                              <p className="text-xs text-[var(--text-faint)] mt-1">{voucher.merchant.name}</p>
                            ) : null}
                            <p className="text-sm text-[var(--text-muted)] mt-1">
                              {formatCurrency(voucher.value, voucher.currency)}
                            </p>
                            <WarmButton asChild className="mt-3">
                              <Link href={href}>View voucher</Link>
                            </WarmButton>
                          </WarmCard>
                        )
                      })
                    )}
                  </div>
                </div>
              </section>
            )
          case "tenant_stats":
            return (
              <section key={block} className="bg-white/60 py-12">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                  {stats ? (
                    [
                      { label: "Campaigns", value: stats.campaigns },
                      { label: "Vouchers", value: stats.vouchers },
                      { label: "Products", value: stats.products },
                      { label: "Rentals", value: stats.rentals },
                    ].map((item) => (
                      <WarmCard key={item.label} padding="lg" className="bg-[var(--surface)] text-center">
                        <p className="text-2xl font-bold text-[var(--text)]">{item.value}</p>
                        <p className="text-sm text-[var(--text-muted)]">{item.label}</p>
                      </WarmCard>
                    ))
                  ) : (
                    <WarmCard padding="lg" className="bg-[var(--surface)] text-center col-span-full">
                      <p className="text-[var(--text-muted)]">Stats unavailable.</p>
                    </WarmCard>
                  )}
                </div>
              </section>
            )
          default:
            return null
        }
      })}
    </div>
  )
}
