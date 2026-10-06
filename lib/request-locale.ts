import { cookies, headers } from "next/headers"
import { routing } from "@/routing"
import { localeFromAcceptLanguage } from "@/lib/locale-config"

const LOCALE_COOKIE_NAME = "NEXT_LOCALE"

export async function getPreferredLocale(): Promise<string> {
  const cookieStore = await cookies()
  const cookieLocale = cookieStore.get(LOCALE_COOKIE_NAME)?.value
  if (cookieLocale && routing.locales.includes(cookieLocale as (typeof routing.locales)[number])) {
    return cookieLocale
  }

  const headerStore = await headers()
  const fromBrowser = localeFromAcceptLanguage(headerStore.get("accept-language"))
  if (fromBrowser) return fromBrowser

  return routing.defaultLocale
}

