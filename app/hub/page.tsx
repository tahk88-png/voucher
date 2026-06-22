import { pageMetadata } from '@/lib/seo/page-metadata';
export const metadata = pageMetadata({ title: 'Hub', description: 'Explore merchants and offers', path: '/hub' });

import HubShell from "@/components/layout/hub-shell"
import SitePageRenderer from "@/components/site/site-page-renderer"
import { getSitePage } from "@/lib/site-pages"

export default async function HubPage() {
  const page = await getSitePage({ scope: "hub", slug: "/" })
  const blocks = Array.isArray(page?.blocksJson)
    ? (page?.blocksJson as string[])
    : ["hero", "featured_tenants", "featured_products", "featured_rentals", "featured_vouchers"]

  return (
    <HubShell>
      <div className="py-10">
        <SitePageRenderer blocks={blocks} scope="hub" />
      </div>
    </HubShell>
  )
}
