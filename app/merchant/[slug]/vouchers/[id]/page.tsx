import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { AccessControlError, requireMerchantProfileAccessBySlug } from '@/lib/access-control';
import EditVoucherForm from './edit-voucher-form';
import Breadcrumbs from '@/components/navigation/breadcrumbs';
import { getTranslations } from 'next-intl/server';

export default async function EditVoucherPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id: voucherId } = await params;
  let merchant: { id: string };
  try {
    ({ merchant } = await requireMerchantProfileAccessBySlug(slug, 'merchant_admin'));
  } catch (error) {
    if (error instanceof AccessControlError && error.status === 404) notFound();
    if (error instanceof AccessControlError && error.status === 401) redirect('/login');
    // Staff can't edit vouchers; send them back to the list instead of a 500.
    redirect(`/merchant/${slug}/vouchers`);
  }

  const t = await getTranslations('nav');
  const tVoucher = await getTranslations('voucher');
  const tPage = await getTranslations('merchantVouchers.edit');

  const voucher = await prisma.voucher.findUnique({
    where: { id: voucherId },
  });

  if (!voucher || voucher.merchantId !== merchant.id) {
    notFound();
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">
        <Breadcrumbs
          items={[
            { label: t('dashboard'), href: `/merchant/${slug}/dashboard` },
            { label: t('vouchers'), href: `/merchant/${slug}/vouchers` },
            { label: tVoucher('edit') },
          ]}
        />
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-[14px] bg-gradient-to-br from-[#cc785c] to-[#b5613f] flex items-center justify-center shadow-warm">
            <span className="text-white font-bold text-lg">{tPage('iconLetter')}</span>
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-[var(--text)]">{tVoucher('edit')}</h1>
            <p className="text-sm text-[var(--text-muted)]">{tPage('subtitle')}</p>
          </div>
        </div>

        <EditVoucherForm voucher={voucher} merchantSlug={slug} />
      </div>
    </div>
  );
}
