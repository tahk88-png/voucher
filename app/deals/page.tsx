import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { getTranslations } from "next-intl/server"
import { pageMetadata } from "@/lib/seo/page-metadata"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("offers.deals")
  return pageMetadata({ title: t("metaTitle"), description: t("metaDescription"), path: "/deals" })
}

export default function DealsAliasPage() {
  redirect("/campaigns")
}
