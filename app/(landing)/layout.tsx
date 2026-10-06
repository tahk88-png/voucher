import * as React from "react"
import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { buildLocaleAlternates, DEFAULT_OG_IMAGE, SITE_NAME } from "@/lib/seo"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("home.meta")
  const description = t("description")

  return {
    // Absolute: the home page is titled just "GiftHub", not "GiftHub | GiftHub".
    title: { absolute: SITE_NAME },
    description,
    alternates: {
      canonical: "/",
      languages: buildLocaleAlternates("/"),
    },
    openGraph: {
      type: "website",
      title: SITE_NAME,
      description,
      url: "/",
      images: [DEFAULT_OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title: SITE_NAME,
      description,
      images: [DEFAULT_OG_IMAGE],
    },
  }
}

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <div className="min-h-screen">{children}</div>
}
