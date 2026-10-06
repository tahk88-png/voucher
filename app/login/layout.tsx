import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("authPages.meta")
  return {
    title: t("signIn"),
    robots: {
      index: false,
      follow: false,
    },
  }
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children
}
