import { redirect } from "next/navigation"
import { toQueryString, type SearchParams } from "@/lib/search-params"

export default function LocaleLoginRedirect({
  searchParams,
}: {
  searchParams?: SearchParams
}) {
  redirect(`/login${toQueryString(searchParams)}`)
}

