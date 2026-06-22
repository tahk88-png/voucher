import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"
import HubShell from "@/components/layout/hub-shell"
import TenantShell from "@/components/layout/tenant-shell"
import SitePageRenderer from "@/components/site/site-page-renderer"
import { getSitePage } from "@/lib/site-pages"
import { getTenantContext } from "@/lib/tenant-context"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const context = await getTenantContext()
  const page =
    context.mode === "tenant" && context.tenant
      ? await getSitePage({
          merchantId: context.tenant.id,
          scope: "tenant",
          slug,
        })
      : await getSitePage({ scope: "hub", slug })

  if (!page) {
    return {}
  }

  const seo = (page.seoJson as Record<string, string> | null) || {}
  return {
    title: seo.title || page.title,
    description: seo.description || page.description || undefined,
  }
}

export default async function SitePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const context = await getTenantContext()

  if (context.mode === "tenant" && context.tenant) {
    const page = await getSitePage({
      merchantId: context.tenant.id,
      scope: "tenant",
      slug,
    })

    if (!page) {
      notFound()
    }

    const blocks = Array.isArray(page.blocksJson) ? (page.blocksJson as string[]) : []
    return (
      <TenantShell merchant={context.tenant}>
        <div className="py-10">
          <SitePageRenderer blocks={blocks} scope="tenant" merchant={context.tenant} />
        </div>
      </TenantShell>
    )
  }

  if (context.mode === "hub") {
    const page = await getSitePage({ scope: "hub", slug })
    if (!page) {
      notFound()
    }
    const blocks = Array.isArray(page.blocksJson) ? (page.blocksJson as string[]) : []
    return (
      <HubShell>
        <div className="py-10">
          <SitePageRenderer blocks={blocks} scope="hub" />
        </div>
      </HubShell>
    )
  }

  redirect("/hub")
}
