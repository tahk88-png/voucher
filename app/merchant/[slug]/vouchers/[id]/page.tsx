import { notFound, redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { requireMerchantRole } from '@/lib/rbac';
import EditVoucherForm from './edit-voucher-form';
import Breadcrumbs from '@/components/navigation/breadcrumbs';
import { getTranslations } from 'next-intl/server';

export default async function EditVoucherPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id: voucherId } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }

  const merchant = await prisma.merchant.findUnique({
    where: { slug },
  });

  if (!merchant) {
    notFound();
  }

  await requireMerchantRole(session.user.id, merchant.id, 'merchant_admin');

  const t = await getTranslations('nav');
  const tVoucher = await getTranslations('voucher');

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
            <span className="text-white font-bold text-lg">E</span>
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-[var(--text)]">{tVoucher('edit')}</h1>
            <p className="text-sm text-[var(--text-muted)]">Update voucher details and availability.</p>
          </div>
        </div>

        <EditVoucherForm voucher={voucher} merchantSlug={slug} />
      </div>
    </div>
  );
}
