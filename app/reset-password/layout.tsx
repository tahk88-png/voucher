import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("authPages.meta")
  return {
    title: t("resetPassword"),
    robots: {
      index: false,
      follow: false,
    },
  }
}

export default function ResetPasswordLayout({ children }: { children: React.ReactNode }) {
  return children
}
