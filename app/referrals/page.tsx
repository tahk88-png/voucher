import { redirect } from "next/navigation"
import { getTranslations } from "next-intl/server"
import { pageMetadata } from '@/lib/seo/page-metadata';

export async function generateMetadata() {
  const tNav = await getTranslations('nav');
  const t = await getTranslations('purchase');
  return pageMetadata({ title: tNav('referrals'), description: t('meta.referralsDescription'), path: '/referrals' });
}

export default function ReferralsAliasPage() {
  redirect("/app/referrals")
}
