import { pageMetadata } from '@/lib/seo/page-metadata';
export const metadata = pageMetadata({ title: 'Settings', noIndex: true });

import { redirect } from "next/navigation"

export default function SettingsAliasPage() {
  redirect("/app/settings")
}

