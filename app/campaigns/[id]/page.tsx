import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { getPreferredLocale } from "@/lib/request-locale"
import { toQueryString, type SearchParams } from "@/lib/search-params"
import { routing } from "@/routing"

import CampaignDetailPage, {
  generateMetadata as generateLocaleMetadata,
} from "@/app/[locale]/campaigns/[id]/page"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  return generateLocaleMetadata({
    params: Promise.resolve({ locale: routing.defaultLocale, id }),
  })
}

export default async function CampaignAliasPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams?: Promise<SearchParams>
}) {
  const { id } = await params
  const sp = await searchParams
  const locale = await getPreferredLocale()

  if (locale !== routing.defaultLocale) {
    redirect(`/${locale}/campaigns/${id}${toQueryString(sp)}`)
  }

  return <CampaignDetailPage params={Promise.resolve({ locale: routing.defaultLocale, id })} />
}
