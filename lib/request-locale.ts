import { cookies, headers } from "next/headers"
import { routing } from "@/routing"

const LOCALE_COOKIE_NAME = "NEXT_LOCALE"

export async function getPreferredLocale(): Promise<string> {
  const cookieStore = await cookies()
  const cookieLocale = cookieStore.get(LOCALE_COOKIE_NAME)?.value
  if (cookieLocale && routing.locales.includes(cookieLocale as (typeof routing.locales)[number])) {
    return cookieLocale
  }

  const headerStore = await headers()
  const acceptLanguage = headerStore.get("accept-language") || ""
  for (const part of acceptLanguage.split(",")) {
    const tag = part.split(";")[0]?.trim().toLowerCase()
    if (!tag) continue

    const base = tag.split("-")[0]
    if (routing.locales.includes(base as (typeof routing.locales)[number])) {
      return base
    }
  }

  return routing.defaultLocale
}

