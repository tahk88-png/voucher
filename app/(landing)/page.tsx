import HubShell from "@/components/layout/hub-shell"
import TenantShell from "@/components/layout/tenant-shell"
import SitePageRenderer from "@/components/site/site-page-renderer"
import MarketingLanding from "@/components/landing/marketing-landing"
import { getSitePage } from "@/lib/site-pages"
import { getTenantContext } from "@/lib/tenant-context"

export default async function LandingPage() {
  const context = await getTenantContext()
  if (context.mode === "tenant" && context.tenant) {
    const page = await getSitePage({
      merchantId: context.tenant.id,
      scope: "tenant",
      slug: "/",
    })
    const blocks = Array.isArray(page?.blocksJson)
      ? (page?.blocksJson as string[])
      : ["hero", "featured_products", "featured_vouchers", "featured_rentals", "tenant_stats"]

    return (
      <TenantShell merchant={context.tenant}>
        <div className="py-10">
          <SitePageRenderer blocks={blocks} scope="tenant" merchant={context.tenant} />
        </div>
      </TenantShell>
    )
  }

  return (
    <HubShell>
      <MarketingLanding />
    </HubShell>
  )
}
