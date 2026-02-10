'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Gift,
  CreditCard,
  Megaphone,
  Calendar,
  CheckCircle,
  Settings,
  LayoutTemplate,
} from 'lucide-react';

interface MerchantSidebarProps {
  slug: string;
}

const navItems = [
  {
    href: (slug: string) => `/merchant/${slug}/dashboard`,
    labelKey: 'dashboard',
    icon: LayoutDashboard,
  },
  {
    href: (slug: string) => `/merchant/${slug}/vouchers`,
    labelKey: 'vouchers',
    icon: Gift,
  },
  {
    href: (slug: string) => `/merchant/${slug}/gift-cards`,
    labelKey: 'giftCards',
    icon: CreditCard,
  },
  {
    href: (slug: string) => `/merchant/${slug}/campaigns`,
    labelKey: 'campaigns',
    icon: Megaphone,
  },
  {
    href: (slug: string) => `/merchant/${slug}/events`,
    labelKey: 'events',
    icon: Calendar,
  },
  {
    href: (slug: string) => `/merchant/${slug}/redemptions`,
    labelKey: 'redemptions',
    icon: CheckCircle,
  },
  {
    href: (slug: string) => `/merchant/${slug}/page-builder`,
    labelKey: 'pageBuilder',
    icon: LayoutTemplate,
  },
  {
    href: (slug: string) => `/merchant/${slug}/settings`,
    labelKey: 'settings',
    icon: Settings,
  },
];

export default function MerchantSidebar({ slug }: MerchantSidebarProps) {
  const pathname = usePathname();
  const t = useTranslations('nav');

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:border-r border-[var(--border)] lg:bg-[var(--surface-muted)]/30">
      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const href = item.href(slug);
          const isActive = pathname === href || pathname.startsWith(`${href}/`);

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-[12px] px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'gradient-brand text-[var(--text)] shadow-warm'
                  : 'text-[var(--text-muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--text)]'
              )}
            >
              <span className="flex items-center gap-3">
                <Icon className="h-5 w-5" />
                <span>{t(item.labelKey)}</span>
              </span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
