import { pageMetadata } from '@/lib/seo/page-metadata';
export const metadata = pageMetadata({ title: 'Referrals', description: 'Share deals and earn rewards', path: '/referrals' });

import { redirect } from "next/navigation"

export default function ReferralsAliasPage() {
  redirect("/app/referrals")
}

