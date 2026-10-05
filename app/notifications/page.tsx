import { redirect } from "next/navigation"
import { getTranslations } from "next-intl/server"
import { pageMetadata } from '@/lib/seo/page-metadata';

export async function generateMetadata() {
  const t = await getTranslations('nav');
  return pageMetadata({ title: t('notifications'), noIndex: true });
}

export default function NotificationsAliasPage() {
  redirect("/app/notifications")
}
