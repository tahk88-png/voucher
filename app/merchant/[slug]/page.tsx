import { redirect } from 'next/navigation';

export default async function MerchantRootPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  redirect(`/merchant/${slug}/dashboard`);
}
