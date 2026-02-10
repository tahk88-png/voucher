import { createNavigation } from "next-intl/navigation"
import { defineRouting } from "next-intl/routing"
import { defaultLocale, supportedLocales } from "@/lib/locale-config"

export const routing = defineRouting({
  locales: [...supportedLocales],
  defaultLocale,
  localePrefix: "as-needed",
})

export const { Link, redirect, usePathname, useRouter } = createNavigation(routing)
