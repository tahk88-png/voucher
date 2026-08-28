'use client';

import { useRouter } from 'next/navigation';
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
  const router = useRouter();
  const { open, setOpen } = useCommandPalette();

  const go = (path: string) => () => router.push(path);

  const items = [
    { id: 'home', label: 'Home', description: 'Landing page', icon: <Home className="h-4 w-4" />, onSelect: go('/'), category: 'Navigate' },
    { id: 'app', label: 'My dashboard', description: 'Your vouchers, wallet and activity', icon: <LayoutDashboard className="h-4 w-4" />, onSelect: go('/app'), category: 'Navigate' },
    { id: 'vouchers', label: 'My vouchers', icon: <Ticket className="h-4 w-4" />, onSelect: go('/app/vouchers'), category: 'Navigate' },
    { id: 'wallet', label: 'Wallet', description: 'Credit balances', icon: <Wallet className="h-4 w-4" />, onSelect: go('/app/wallet'), category: 'Navigate' },
    { id: 'gifts', label: 'Gift Hub', description: 'Browse and send gifts', icon: <Gift className="h-4 w-4" />, onSelect: go('/gifts'), category: 'Discover' },
    { id: 'campaigns', label: 'Campaigns', description: 'Active voucher campaigns', icon: <Megaphone className="h-4 w-4" />, onSelect: go('/campaigns'), category: 'Discover' },
    { id: 'hub', label: 'Merchant hub', description: 'Browse merchants', icon: <Store className="h-4 w-4" />, onSelect: go('/hub'), category: 'Discover' },
    { id: 'deals', label: 'Deals', icon: <Search className="h-4 w-4" />, onSelect: go('/deals'), category: 'Discover' },
    { id: 'settings', label: 'Settings', description: 'Account and preferences', icon: <Settings className="h-4 w-4" />, onSelect: go('/app/settings'), category: 'Account' },
    { id: 'admin', label: 'Admin', description: 'Platform administration', icon: <Shield className="h-4 w-4" />, onSelect: go('/admin'), category: 'Account' },
  ];

  return (
    <CommandPalette
      items={items}
      open={open}
      onOpenChange={setOpen}
      placeholder="Where do you want to go?"
    />
  );
}
