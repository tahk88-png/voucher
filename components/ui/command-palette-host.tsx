'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  LayoutDashboard,
  Ticket,
  Wallet,
  Gift,
  Megaphone,
  Store,
  Settings,
  Shield,
  Search,
  Home,
} from 'lucide-react';
import { CommandPalette, useCommandPalette } from '@/components/ui/command-palette';

/**
 * Global Cmd/Ctrl+K host. The palette component existed but was never
 * mounted anywhere, so the shortcut was dead. Items are plain navigations to
 * routes that exist; access control stays where it belongs — the middleware
 * and layouts redirect unauthenticated users, so no permission logic is
 * duplicated here.
 */
export function CommandPaletteHost() {
  const t = useTranslations('ui.commandPalette');
  const router = useRouter();
  const { open, setOpen } = useCommandPalette();

  const go = (path: string) => () => router.push(path);

  const items = [
    { id: 'home', label: t('items.home.label'), description: t('items.home.description'), icon: <Home className="h-4 w-4" />, onSelect: go('/'), category: t('categories.navigate') },
    { id: 'app', label: t('items.app.label'), description: t('items.app.description'), icon: <LayoutDashboard className="h-4 w-4" />, onSelect: go('/app'), category: t('categories.navigate') },
    { id: 'vouchers', label: t('items.vouchers.label'), icon: <Ticket className="h-4 w-4" />, onSelect: go('/app/vouchers'), category: t('categories.navigate') },
    { id: 'wallet', label: t('items.wallet.label'), description: t('items.wallet.description'), icon: <Wallet className="h-4 w-4" />, onSelect: go('/app/wallet'), category: t('categories.navigate') },
    { id: 'gifts', label: t('items.gifts.label'), description: t('items.gifts.description'), icon: <Gift className="h-4 w-4" />, onSelect: go('/gifts'), category: t('categories.discover') },
    { id: 'campaigns', label: t('items.campaigns.label'), description: t('items.campaigns.description'), icon: <Megaphone className="h-4 w-4" />, onSelect: go('/campaigns'), category: t('categories.discover') },
    { id: 'hub', label: t('items.hub.label'), description: t('items.hub.description'), icon: <Store className="h-4 w-4" />, onSelect: go('/hub'), category: t('categories.discover') },
    { id: 'deals', label: t('items.deals.label'), icon: <Search className="h-4 w-4" />, onSelect: go('/deals'), category: t('categories.discover') },
    { id: 'settings', label: t('items.settings.label'), description: t('items.settings.description'), icon: <Settings className="h-4 w-4" />, onSelect: go('/app/settings'), category: t('categories.account') },
    { id: 'admin', label: t('items.admin.label'), description: t('items.admin.description'), icon: <Shield className="h-4 w-4" />, onSelect: go('/admin'), category: t('categories.account') },
  ];

  return (
    <CommandPalette
      items={items}
      open={open}
      onOpenChange={setOpen}
      placeholder={t('hostPlaceholder')}
    />
  );
}
