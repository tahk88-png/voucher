import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useMemo, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  ArrowUpRight,
  BarChart3,
  Bell,
  Boxes,
  Calendar,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Globe2,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Menu,
  Rocket,
  Search,
  Settings2,
  Share2,
  Shield,
  Sparkles,
  Store,
  Tag,
  Ticket,
  UserCircle2,
  Users,
  Wallet,
  Wand2,
  X,
} from 'lucide-react';
import { WarmButton } from '@app/components/WarmButton';
import { CountrySelector } from '@app/components/CountrySelector';
import { LanguageSelector } from '@app/components/LanguageSelector';
import { useCountry } from '@app/contexts/CountryContext';
import { useLanguage } from '@app/contexts/LanguageContext';
import { useBonusTracking } from '@app/contexts/BonusTracking';
import { useAuth, type AuthenticatedRole } from '@app/contexts/AuthContext';

interface NavigationItem {
  name: string;
  href: string;
  icon: LucideIcon;
  description: string;
  badge?: number;
}

interface NavigationSection {
  label: string;
  items: NavigationItem[];
}

const roleHomes: Record<AuthenticatedRole, string> = {
  user: '/user-dashboard',
  merchant: '/dashboard',
  admin: '/admin-dashboard',
};

const routeMeta: Record<string, { title: string; subtitle: string }> = {
  '/dashboard': {
    title: 'Merchant Command Center',
    subtitle: 'Sales, operations and campaigns in one workflow.',
  },
  '/admin-dashboard': {
    title: 'Admin Control Layer',
    subtitle: 'Platform health, merchant quality and governance.',
  },
  '/user-dashboard': {
    title: 'Rewards Workspace',
    subtitle: 'Track wallet activity, referrals and upcoming perks.',
  },
  '/analytics': {
    title: 'Performance Analytics',
    subtitle: 'Measure growth with market-level signal clarity.',
  },
  '/campaigns-list': {
    title: 'Campaign Pipeline',
    subtitle: 'Design, launch and optimize high-performing campaigns.',
  },
  '/settings': {
    title: 'Workspace Settings',
    subtitle: 'Team controls, automations and account preferences.',
  },
};

function buildNavigation(role: AuthenticatedRole, pendingBonusCount: number): NavigationSection[] {
  const sharedStart: NavigationSection = {
    label: 'Main',
    items: [
      {
        name: 'B2B',
        href: '/b2b-solutions',
        icon: Rocket,
        description: 'Platform roadmap and enterprise features.',
      },
    ],
  };

  if (role === 'user') {
    return [
      sharedStart,
      {
        label: 'Rewards',
        items: [
          {
            name: 'Dashboard',
            href: '/user-dashboard',
            icon: LayoutDashboard,
            description: 'Reward progress and personalized recommendations.',
          },
          {
            name: 'Referrals',
            href: '/referrals',
            icon: Users,
            description: 'Track referral invites and conversion impact.',
          },
          {
            name: 'Wallet',
            href: '/wallet',
            icon: Wallet,
            description: 'Balance, transactions and withdrawal status.',
          },
          {
            name: 'Notifications',
            href: '/notifications',
            icon: Bell,
            description: 'Campaign updates and expiring deal alerts.',
          },
        ],
      },
      {
        label: 'Profile',
        items: [
          {
            name: 'Settings',
            href: '/settings',
            icon: Settings2,
            description: 'Account preferences, privacy and security.',
          },
        ],
      },
    ];
  }

  if (role === 'admin') {
    return [
      sharedStart,
      {
        label: 'Control',
        items: [
          {
            name: 'Admin Dashboard',
            href: '/admin-dashboard',
            icon: Shield,
            description: 'System-wide control and operational oversight.',
          },
          {
            name: 'Merchant View',
            href: '/dashboard',
            icon: Store,
            description: 'View merchant-side journey and diagnostics.',
          },
          {
            name: 'User View',
            href: '/user-dashboard',
            icon: UserCircle2,
            description: 'Inspect customer journey and wallet funnels.',
          },
          {
            name: 'Analytics',
            href: '/analytics',
            icon: BarChart3,
            description: 'Platform-level growth and quality metrics.',
          },
        ],
      },
      {
        label: 'Operations',
        items: [
          {
            name: 'Campaigns',
            href: '/campaigns-list',
            icon: Megaphone,
            description: 'Govern active campaigns and compliance rules.',
          },
          {
            name: 'Email Templates',
            href: '/admin/email-templates',
            icon: Wand2,
            description: 'Manage platform email templates and tone.',
          },
          {
            name: 'Settings',
            href: '/settings',
            icon: Settings2,
            description: 'Admin settings and policy defaults.',
          },
        ],
      },
    ];
  }

  return [
    sharedStart,
    {
      label: 'Growth',
      items: [
        {
          name: 'Dashboard',
          href: '/dashboard',
          icon: LayoutDashboard,
          description: 'Live performance, KPIs and operational alerts.',
          badge: pendingBonusCount > 0 ? pendingBonusCount : undefined,
        },
        {
          name: 'Analytics',
          href: '/analytics',
          icon: BarChart3,
          description: 'Revenue and audience trends by market.',
        },
        {
          name: 'Campaigns',
          href: '/campaigns-list',
          icon: Megaphone,
          description: 'Plan and publish your next campaign.',
        },
        {
          name: 'Share',
          href: '/share',
          icon: Share2,
          description: 'Promotion links, posts and partner assets.',
        },
      ],
    },
    {
      label: 'Commerce',
      items: [
        {
          name: 'Vouchers',
          href: '/vouchers',
          icon: Ticket,
          description: 'Voucher inventory, states and usage.',
        },
        {
          name: 'Discount Codes',
          href: '/discounts',
          icon: Tag,
          description: 'Code sets, expirations and redemption rules.',
        },
        {
          name: 'Events',
          href: '/events',
          icon: Calendar,
          description: 'Upcoming activations and attendance health.',
        },
      ],
    },
    {
      label: 'Operations',
      items: [
        {
          name: 'Wallet & Payouts',
          href: '/merchant-wallet',
          icon: Wallet,
          description: 'Cashflow, settlement and payout insights.',
        },
        {
          name: 'Bonus Accounting',
          href: '/bonus-accounting',
          icon: CircleDollarSign,
          description: 'Approve and monitor referral bonus payouts.',
        },
        {
          name: 'Notifications',
          href: '/notifications',
          icon: Bell,
          description: 'Delivery health and message priorities.',
        },
        {
          name: 'Store Builder',
          href: '/store-builder',
          icon: Boxes,
          description: 'Build storefront modules and public profile.',
        },
        {
          name: 'Integrations',
          href: '/integrations',
          icon: Sparkles,
          description: 'Connect apps, data feeds and automation hooks.',
        },
        {
          name: 'Settings',
          href: '/settings',
          icon: Settings2,
          description: 'Team members, permissions and environment setup.',
        },
      ],
    },
  ];
}

function buildTitle(pathname: string) {
  if (routeMeta[pathname]) {
    return routeMeta[pathname];
  }

  if (pathname.startsWith('/campaigns')) {
    return {
      title: 'Campaign Pipeline',
      subtitle: 'Coordinate launch timing, channels and creative performance.',
    };
  }

  if (pathname.startsWith('/vouchers')) {
    return {
      title: 'Voucher Operations',
      subtitle: 'Manage voucher lifecycle from issue to redemption.',
    };
  }

  if (pathname.startsWith('/events')) {
    return {
      title: 'Event Management',
      subtitle: 'Keep events on time with clear attendance visibility.',
    };
  }

  if (pathname.startsWith('/wallet')) {
    return {
      title: 'Wallet Insights',
      subtitle: 'Monitor balance movement, payout speed and trust signals.',
    };
  }

  return {
    title: 'GiftHub Workspace',
    subtitle: 'Modern control layer for market-first commerce.',
  };
}

function filterSections(sections: NavigationSection[], query: string) {
  const cleaned = query.trim().toLowerCase();
  if (!cleaned) {
    return sections;
  }

  return sections
    .map((section) => ({
      ...section,
      items: section.items.filter(
        (item) =>
          item.name.toLowerCase().includes(cleaned) ||
          item.description.toLowerCase().includes(cleaned)
      ),
    }))
    .filter((section) => section.items.length > 0);
}

export function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { selectedCountry } = useCountry();
  const { language } = useLanguage();
  const { getPendingForMerchant } = useBonusTracking();
  const { role, profile, loginAs, logout } = useAuth();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const activeRole: AuthenticatedRole = role === 'guest' ? 'merchant' : role;
  const pendingBonusCount = activeRole === 'merchant' ? getPendingForMerchant('merchant-fashion').length : 0;
  const navigation = useMemo(
    () => buildNavigation(activeRole, pendingBonusCount),
    [activeRole, pendingBonusCount]
  );
  const filteredNavigation = useMemo(() => filterSections(navigation, searchQuery), [navigation, searchQuery]);
  const titleMeta = useMemo(() => buildTitle(location.pathname), [location.pathname]);

  const isActivePath = (href: string) => {
    if (location.pathname === href) {
      return true;
    }

    if (href === '/campaigns-list') {
      return location.pathname.startsWith('/campaigns');
    }

    if (href === '/vouchers') {
      return location.pathname.startsWith('/vouchers');
    }

    if (href === '/events') {
      return location.pathname.startsWith('/events');
    }

    return location.pathname.startsWith(`${href}/`);
  };

  const navigateAndClose = (href: string) => {
    navigate(href);
    setMobileMenuOpen(false);
  };

  const roleSwitch = (nextRole: AuthenticatedRole) => {
    loginAs(nextRole);
    navigate(roleHomes[nextRole]);
    setMobileMenuOpen(false);
  };

  const roleLabel =
    activeRole === 'admin' ? 'Admin' : activeRole === 'user' ? 'Customer' : 'Merchant';

  const renderNavBody = (collapsed: boolean) => (
    <>
      {!collapsed && (
        <div className="px-4 pb-4">
          <label htmlFor="dashboard-nav-search" className="sr-only">
            Search navigation
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8B7355]" />
            <input
              id="dashboard-nav-search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search tools"
              className="h-11 w-full rounded-[12px] border border-[rgba(139,115,85,0.2)] bg-white/80 pl-9 pr-3 text-sm text-[#2D2721] outline-none transition-all placeholder:text-[#9D8A72] focus:border-[#FFC857] focus:shadow-warm"
            />
          </div>
        </div>
      )}

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 pb-4">
        {filteredNavigation.map((section) => (
          <div key={section.label}>
            {!collapsed && (
              <div className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8B7355]">
                {section.label}
              </div>
            )}
            <div className="space-y-1.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = isActivePath(item.href);

                return (
                  <button
                    key={item.href}
                    onClick={() => navigateAndClose(item.href)}
                    title={collapsed ? item.name : undefined}
                    className={`group relative flex w-full items-center gap-3 rounded-[14px] border px-3 py-2.5 text-left transition-all ${
                      active
                        ? 'border-[#F1CE86] bg-gradient-to-r from-[#FFF4D7] to-[#FFEAB9] text-[#2D2721] shadow-warm'
                        : 'border-transparent text-[#5A4838] hover:border-[#E7DCC7] hover:bg-white/75'
                    } ${collapsed ? 'justify-center px-2.5' : ''}`}
                  >
                    <span
                      className={`grid h-9 w-9 shrink-0 place-items-center rounded-[11px] border ${
                        active
                          ? 'border-[#F2CF89] bg-white/90 text-[#2D2721]'
                          : 'border-[#E7DCC7] bg-white/70 text-[#6B5744]'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </span>

                    {!collapsed && (
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold">{item.name}</span>
                        <span className="block truncate text-xs text-[#8B7355]">{item.description}</span>
                      </span>
                    )}

                    {!collapsed && item.badge && (
                      <span className="rounded-full bg-[#E17B5C] px-2 py-0.5 text-[11px] font-semibold text-white">
                        {item.badge}
                      </span>
                    )}

                    {collapsed && item.badge && (
                      <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full bg-[#E17B5C]" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </>
  );

  return (
    <div className="icon-motion-scope relative min-h-screen overflow-x-hidden bg-[#FFFBF5] text-[#2D2721]">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -left-24 top-[-220px] h-[460px] w-[460px] rounded-full bg-[#FFE2A3]/70 blur-3xl" />
        <div className="absolute right-[-120px] top-[80px] h-[380px] w-[380px] rounded-full bg-[#FFD8C7]/55 blur-3xl" />
        <div className="absolute bottom-[-200px] left-[26%] h-[420px] w-[420px] rounded-full bg-[#DBEBDD]/60 blur-3xl" />
      </div>

      <header className="sticky top-0 z-30 border-b border-[rgba(139,115,85,0.14)] bg-[rgba(255,251,245,0.82)] backdrop-blur-xl lg:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => setMobileMenuOpen((value) => !value)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-[12px] border border-[rgba(139,115,85,0.2)] bg-white/90 text-[#2D2721]"
            aria-label="Open navigation"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-[14px] bg-gradient-to-br from-[#FFC857] to-[#FFB627] shadow-warm">
              <Sparkles className="h-5 w-5 text-[#2D2721]" />
            </div>
            <div>
              <div className="text-sm font-semibold leading-tight text-[#2D2721]">GiftHub</div>
              <div className="text-[11px] uppercase tracking-[0.16em] text-[#8B7355]">Workspace</div>
            </div>
          </div>

          <span className="hidden rounded-full border border-[rgba(139,115,85,0.2)] bg-white/90 px-3 py-1 text-xs font-semibold text-[#6B5744] sm:inline-flex">
            {roleLabel}
          </span>
        </div>
      </header>

      {mobileMenuOpen && (
        <>
          <button
            className="fixed inset-0 z-40 bg-[#1F1810]/35 backdrop-blur-sm lg:hidden"
            aria-label="Close navigation overlay"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 z-50 flex w-[320px] max-w-[90vw] flex-col border-r border-[rgba(139,115,85,0.16)] bg-[#FFF9ED]/95 py-4 backdrop-blur-xl lg:hidden">
            <div className="mb-4 flex items-center justify-between px-4">
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-[14px] bg-gradient-to-br from-[#FFC857] to-[#FFB627] shadow-warm">
                  <Sparkles className="h-5 w-5 text-[#2D2721]" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-[#2D2721]">GiftHub</div>
                  <div className="text-[11px] uppercase tracking-[0.16em] text-[#8B7355]">Mobile menu</div>
                </div>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-[11px] border border-[rgba(139,115,85,0.2)] bg-white/90"
                aria-label="Close menu"
              >
                <X className="h-4 w-4 text-[#2D2721]" />
              </button>
            </div>

            {renderNavBody(false)}

            <div className="border-t border-[rgba(139,115,85,0.12)] px-4 py-3">
              <div className="grid gap-2">
                <div className="rounded-[12px] border border-[rgba(139,115,85,0.14)] bg-white/85 p-2.5">
                  <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8B7355]">
                    Interface language
                  </div>
                  <LanguageSelector variant="compact" />
                </div>
                <div className="rounded-[12px] border border-[rgba(139,115,85,0.14)] bg-white/85 p-2.5">
                  <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8B7355]">
                    Marketplace context
                  </div>
                  <CountrySelector variant="compact" />
                </div>
              </div>
            </div>

            <div className="mt-auto border-t border-[rgba(139,115,85,0.12)] px-4 pt-4">
              <div className="rounded-[14px] border border-[rgba(139,115,85,0.14)] bg-white/85 p-3">
                <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[#8B7355]">Role switch</div>
                <div className="mt-2 grid grid-cols-3 gap-1.5">
                  {(['user', 'merchant', 'admin'] as const).map((itemRole) => (
                    <button
                      key={itemRole}
                      onClick={() => roleSwitch(itemRole)}
                      className={`rounded-[10px] px-2 py-1.5 text-xs font-semibold transition-all ${
                        activeRole === itemRole
                          ? 'bg-gradient-to-r from-[#FFC857] to-[#FFB627] text-[#2D2721]'
                          : 'border border-[rgba(139,115,85,0.2)] bg-white text-[#6B5744]'
                      }`}
                    >
                      {itemRole === 'user' ? 'User' : itemRole === 'admin' ? 'Admin' : 'Merchant'}
                    </button>
                  ))}
                </div>
              </div>
              <WarmButton
                variant="outline"
                size="sm"
                fullWidth
                className="mt-3"
                onClick={() => {
                  logout();
                  navigate('/');
                  setMobileMenuOpen(false);
                }}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </WarmButton>
            </div>
          </aside>
        </>
      )}

      <aside
        className={`fixed inset-y-0 left-0 hidden border-r border-[rgba(139,115,85,0.14)] bg-[rgba(255,249,237,0.82)] backdrop-blur-xl lg:flex lg:flex-col ${
          isCollapsed ? 'w-[92px]' : 'w-[320px]'
        }`}
      >
        <div className="relative flex items-center gap-3 px-4 pb-5 pt-6">
          <div className="grid h-12 w-12 place-items-center rounded-[16px] bg-gradient-to-br from-[#FFC857] to-[#FFB627] shadow-warm">
            <Sparkles className="h-5 w-5 text-[#2D2721]" />
          </div>
          {!isCollapsed && (
            <div>
              <div className="text-lg font-semibold text-[#2D2721]">GiftHub</div>
              <div className="text-xs text-[#8B7355]">Market-first ops platform</div>
            </div>
          )}
          <button
            onClick={() => setIsCollapsed((value) => !value)}
            className="absolute -right-3 top-8 inline-flex h-7 w-7 items-center justify-center rounded-full border border-[rgba(139,115,85,0.2)] bg-white text-[#6B5744] shadow-sm"
            aria-label="Toggle sidebar"
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {renderNavBody(isCollapsed)}

        <div className="border-t border-[rgba(139,115,85,0.12)] px-3 py-4">
          {!isCollapsed && (
            <div className="mb-3 rounded-[14px] border border-[rgba(139,115,85,0.16)] bg-white/80 p-3">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-[12px] bg-gradient-to-br from-[#F9D88E] to-[#FFC857] text-[#2D2721]">
                  {activeRole === 'admin' ? (
                    <Shield className="h-5 w-5" />
                  ) : activeRole === 'user' ? (
                    <UserCircle2 className="h-5 w-5" />
                  ) : (
                    <Store className="h-5 w-5" />
                  )}
                </span>
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-[#2D2721]">{profile?.name ?? 'Preview Account'}</div>
                  <div className="truncate text-xs text-[#8B7355]">{profile?.accountLabel ?? 'Guest preview'}</div>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-1.5">
                {(['user', 'merchant', 'admin'] as const).map((itemRole) => (
                  <button
                    key={itemRole}
                    onClick={() => roleSwitch(itemRole)}
                    className={`rounded-[10px] px-2 py-1.5 text-xs font-semibold transition-all ${
                      activeRole === itemRole
                        ? 'bg-gradient-to-r from-[#FFC857] to-[#FFB627] text-[#2D2721]'
                        : 'border border-[rgba(139,115,85,0.2)] bg-white text-[#6B5744]'
                    }`}
                  >
                    {itemRole === 'user' ? 'User' : itemRole === 'admin' ? 'Admin' : 'Merchant'}
                  </button>
                ))}
              </div>
            </div>
          )}

          <WarmButton
            variant="outline"
            size="sm"
            fullWidth
            className={isCollapsed ? 'px-0' : ''}
            title={isCollapsed ? 'Sign out' : undefined}
            onClick={() => {
              logout();
              navigate('/');
            }}
          >
            <LogOut className={`h-4 w-4 ${isCollapsed ? '' : 'mr-2'}`} />
            {!isCollapsed && 'Sign out'}
          </WarmButton>
        </div>
      </aside>

      <div className={`min-h-screen transition-all duration-300 ${isCollapsed ? 'lg:pl-[92px]' : 'lg:pl-[320px]'}`}>
        <header className="sticky top-0 z-20 hidden border-b border-[rgba(139,115,85,0.14)] bg-[rgba(255,251,245,0.86)] backdrop-blur-xl lg:block">
          <div className="mx-auto flex max-w-[1700px] items-center justify-between gap-6 px-6 py-4 xl:px-10">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(139,115,85,0.2)] bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8B7355]">
                <ArrowUpRight className="h-3.5 w-3.5" />
                2026 workspace model
              </div>
              <h1 className="mt-2 text-[28px] font-bold leading-tight text-[#2D2721]">{titleMeta.title}</h1>
              <p className="mt-1 text-sm text-[#6B5744]">{titleMeta.subtitle}</p>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-[14px] border border-[rgba(139,115,85,0.16)] bg-white/80 p-3">
                <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#8B7355]">
                  <Globe2 className="h-4 w-4" />
                  Interface language
                </div>
                <LanguageSelector variant="compact" />
              </div>
              <div className="rounded-[14px] border border-[rgba(139,115,85,0.16)] bg-white/80 p-3">
                <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#8B7355]">
                  <Sparkles className="h-4 w-4" />
                  Marketplace context
                </div>
                <CountrySelector variant="compact" />
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-[1700px] px-3 pb-10 pt-4 sm:px-6 sm:pt-5 lg:px-8 xl:px-10">
          <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-[14px] border border-[rgba(139,115,85,0.16)] bg-white/78 px-4 py-3 backdrop-blur-sm">
              <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8B7355]">Marketplace</div>
              <div className="mt-1 flex items-center gap-2">
                <span className="inline-flex h-7 min-w-[2.2rem] items-center justify-center rounded-md border border-[#D9CBB4] bg-[#FAF7F2] px-2 text-xs font-bold text-[#2D2721]">
                  {selectedCountry.flag}
                </span>
                <span className="text-sm font-semibold text-[#2D2721]">
                  {selectedCountry.name} ({selectedCountry.currency})
                </span>
              </div>
            </div>
            <div className="rounded-[14px] border border-[rgba(139,115,85,0.16)] bg-white/78 px-4 py-3 backdrop-blur-sm">
              <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8B7355]">Language</div>
              <div className="mt-1 text-sm font-semibold text-[#2D2721]">
                {language === 'et' ? 'Estonian (UI)' : 'English (UI)'}
              </div>
            </div>
            <div className="rounded-[14px] border border-[rgba(139,115,85,0.16)] bg-white/78 px-4 py-3 backdrop-blur-sm sm:col-span-2 lg:col-span-1">
              <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8B7355]">Operating role</div>
              <div className="mt-1 text-sm font-semibold text-[#2D2721]">{roleLabel} workspace</div>
            </div>
          </div>

          <Outlet />
        </main>
      </div>
    </div>
  );
}
