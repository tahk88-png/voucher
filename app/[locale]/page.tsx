import { redirect } from "next/navigation"
import { toQueryString, type SearchParams } from "@/lib/search-params"

export default async function LocaleHomePage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>
}) {
  const sp = await searchParams
  redirect(`/${toQueryString(sp)}`)
}
