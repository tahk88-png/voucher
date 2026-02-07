import { redirect } from "next/navigation"
import { toQueryString, type SearchParams } from "@/lib/search-params"

export default function LocaleHomePage({
  searchParams,
}: {
  searchParams?: SearchParams
}) {
  redirect(`/${toQueryString(searchParams)}`)
}
