import Link from 'next/link';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { WarmButton } from '@/components/warm-button';
import { getTranslations } from 'next-intl/server';
import MerchantMobileNav from './merchant-mobile-nav';

interface MerchantHeaderProps {
  slug: string;
}

export default async function MerchantHeader({ slug }: MerchantHeaderProps) {
  const session = await auth();
  const merchant = await prisma.merchant.findUnique({
    where: { slug },
    select: { name: true },
  });

  const t = await getTranslations('nav');

  if (!merchant) return null;

  return (
    <header className="sticky top-0 z-10 bg-[var(--surface)]/80 backdrop-blur-md border-b border-[var(--border)]">
      <div className="flex h-16 items-center justify-between px-4 lg:px-6">
        <div className="flex items-center gap-4">
          <Link
            href={`/merchant/${slug}/dashboard`}
            className="flex items-center gap-2 group"
          >
            <div className="w-10 h-10 rounded-xl gradient-brand flex items-center justify-center shadow-warm group-hover:shadow-warm-lg transition-shadow">
              <span className="text-lg font-bold text-white">
                {merchant.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <span className="font-bold text-[var(--text)] group-hover:text-[var(--text-muted)] transition-colors">
              {merchant.name}
            </span>
          </Link>
          <MerchantMobileNav slug={slug} />
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-[var(--surface-muted)] rounded-lg text-xs text-[var(--text-muted)] font-medium">
            <div className="w-1.5 h-1.5 rounded-full bg-[var(--success)]"></div>
            <span className="truncate max-w-[150px]">
              {session?.user?.email ?? session?.user?.name ?? t('user')}
            </span>
          </div>
          <Link
            href="/api/auth/signout?callbackUrl=/"
            className="px-4 py-2 text-[var(--text-muted)] font-medium text-sm hover:bg-[var(--surface-dim)] hover:text-[var(--text)] rounded-[12px] transition-all"
          >
            {t('logout')}
          </Link>
        </div>
      </div>
    </header>
  );
}
