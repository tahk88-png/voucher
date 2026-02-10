import { cookies } from "next/headers"
import { notFound } from "next/navigation"
import { getRequestConfig } from "next-intl/server"
import type { AbstractIntlMessages } from "use-intl"
import {
  defaultLocale,
  isSupportedLocale,
  languageCookieName,
  localeCookieName,
  supportedLocales,
  type SupportedLocale,
} from "./lib/locale-config"

export const locales = supportedLocales
export type Locale = (typeof locales)[number]

function isObjectLike(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function deepMerge(base: Record<string, unknown>, override: Record<string, unknown>): Record<string, unknown> {
  const merged: Record<string, unknown> = { ...base }

  for (const [key, value] of Object.entries(override)) {
    const baseValue = merged[key]
    if (isObjectLike(baseValue) && isObjectLike(value)) {
      merged[key] = deepMerge(baseValue, value)
      continue
    }
    merged[key] = value
  }

  return merged
}

function getLocaleFromCookies(cookieStore: Awaited<ReturnType<typeof cookies>>): SupportedLocale | null {
  const cookieLocale =
    cookieStore.get(localeCookieName)?.value?.toLowerCase() ?? cookieStore.get(languageCookieName)?.value?.toLowerCase()

  if (!cookieLocale || !isSupportedLocale(cookieLocale)) {
    return null
  }

  return cookieLocale
}

export default getRequestConfig(async ({ requestLocale }) => {
  try {
    const requestedLocale = await requestLocale

    if (requestedLocale && !isSupportedLocale(requestedLocale)) {
      notFound()
    }

    const cookieStore = await cookies()
    const fallbackLocale = getLocaleFromCookies(cookieStore) ?? defaultLocale
    const locale: SupportedLocale =
      requestedLocale && isSupportedLocale(requestedLocale) ? requestedLocale : fallbackLocale

    const base = (await import("./messages/en.json")).default as Record<string, unknown>
    const localized =
      locale === "en"
        ? base
        : ((await import(`./messages/${locale}.json`)).default as Record<string, unknown>)

    return {
      locale,
      messages: deepMerge(base, localized) as AbstractIntlMessages,
      timeZone: "UTC",
    }
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      // eslint-disable-next-line no-console
      console.error("[i18n getRequestConfig]", err)
    }
    throw err
  }
})
