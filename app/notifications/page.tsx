import { pageMetadata } from '@/lib/seo/page-metadata';
export const metadata = pageMetadata({ title: 'Notifications', noIndex: true });

import { redirect } from "next/navigation"

export default function NotificationsAliasPage() {
  redirect("/app/notifications")
}

