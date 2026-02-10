'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { Menu, X } from 'lucide-react';
import { WarmButton } from '@/components/warm-button';
import {
  LayoutDashboard,
  Gift,
  Megaphone,
  Calendar,
  CheckCircle,
  Settings,
  LayoutTemplate,
} from 'lucide-react';

interface MerchantMobileNavProps {
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

export default function MerchantMobileNav({ slug }: MerchantMobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const t = useTranslations('nav');

  return (
    <>
      <button
        className="lg:hidden p-2 text-[var(--text)]"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle menu"
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>
      {isOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-40 lg:hidden animate-in fade-in duration-200"
            onClick={() => setIsOpen(false)}
          />
          <nav className="fixed top-16 left-0 right-0 bottom-0 bg-[var(--surface)] border-t border-[var(--border)] z-50 lg:hidden overflow-y-auto animate-in slide-in-from-top-2 shadow-xl">
            <div className="p-4 space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const href = item.href(slug);
                const isActive = pathname === href || pathname.startsWith(`${href}/`);

                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 text-lg font-bold transition-colors rounded-xl',
                      isActive
                        ? 'bg-[var(--surface-muted)] text-[var(--text)]'
                        : 'text-[var(--text-muted)] hover:bg-[var(--surface-muted)]'
                    )}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    <span>{t(item.labelKey)}</span>
                  </Link>
                );
              })}
            </div>
          </nav>
        </>
      )}
    </>
  );
}
