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
  params: { id: string }
}): Promise<Metadata> {
  return generateLocaleMetadata({
    params: { locale: routing.defaultLocale, id: params.id },
  })
}

export default async function CampaignAliasPage({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams?: SearchParams
}) {
  const locale = getPreferredLocale()

  if (locale !== routing.defaultLocale) {
    redirect(`/${locale}/campaigns/${params.id}${toQueryString(searchParams)}`)
  }

  return <CampaignDetailPage params={{ locale: routing.defaultLocale, id: params.id }} />
}
