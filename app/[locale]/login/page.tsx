import { redirect } from "next/navigation"
import { toQueryString, type SearchParams } from "@/lib/search-params"

export default async function LocaleLoginRedirect({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>
}) {
  const sp = await searchParams
  redirect(`/login${toQueryString(sp)}`)
}

