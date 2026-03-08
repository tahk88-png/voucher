import { redirect } from 'next/navigation';

export default function MerchantRootPage({ params }: { params: { slug: string } }) {
  redirect(`/merchant/${params.slug}/dashboard`);
}
