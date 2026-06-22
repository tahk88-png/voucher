import { pageMetadata } from '@/lib/seo/page-metadata';
export const metadata = pageMetadata({ title: 'Deals', description: 'Discover the best voucher deals', path: '/deals' });

import { redirect } from "next/navigation"

export default function DealsAliasPage() {
  redirect("/")
}

