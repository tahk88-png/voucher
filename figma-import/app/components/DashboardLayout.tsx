import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { WarmButton } from '@/app/components/WarmButton';
import { CountrySelector } from '@/app/components/CountrySelector';
import { LanguageSelector } from '@/app/components/LanguageSelector';
import { ChatWidget } from '@/app/components/widgets/ChatWidget';
import { FeedbackWidget } from '@/app/components/widgets/FeedbackWidget';
import { useCountry } from '@/app/contexts/CountryContext';
import { useBonusTracking } from '@/app/contexts/BonusTracking';
import {
  LayoutDashboard,
  Megaphone,
  Ticket,
  Settings as SettingsIcon,
  Menu,
  X,
  LogOut,
  Gift,
  CreditCard,
  BarChart3,
  Wallet as WalletIcon,
  Bell,
  Calendar,
  TrendingUp,
  Share2,
  Users,
  Shield,
  Award,
  Sparkles,
  DollarSign,
  Mail,
  ChevronLeft,
  ChevronRight,
  Tag
} from 'lucide-react';

export function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { selectedCountry } = useCountry();
  const { getPendingForMerchant } = useBonusTracking();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Auto-collapse sidebar on content creation pages
  useEffect(() => {
    const contentCreationPaths = ['/create', '/edit', '/email-composer', '/store-builder', '/analytics'];
    const shouldCollapse = contentCreationPaths.some(path => location.pathname.includes(path));
    
    if (shouldCollapse) {
      setIsCollapsed(true);
    }
  }, [location.pathname]);

  // Role-based navigation
  const merchantNav = [
    { name: 'Merchant Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Analytics', href: '/analytics', icon: BarChart3 },
    { name: 'Campaigns', href: '/campaigns-list', icon: Megaphone },
    { name: 'Vouchers', href: '/vouchers', icon: Ticket },
    { name: 'Discount Codes', href: '/discounts', icon: Tag },
    { name: 'Gift Cards', href: '/gift-cards', icon: CreditCard },
    { name: 'Events', href: '/events', icon: Calendar },
    { name: 'Email Composer', href: '/email-composer', icon: Mail },
    { name: 'Bonus Accounting', href: '/bonus-accounting', icon: DollarSign },
    { name: 'Promotions', href: '/promotions', icon: TrendingUp },
    { name: 'Share', href: '/share', icon: Share2 },
    { name: 'Wallet & Payouts', href: '/merchant-wallet', icon: WalletIcon },
    { name: 'Settings & Integrations', href: '/integrations', icon: SettingsIcon },
  ];

  const userNav = [
    { name: 'My Rewards', href: '/user-dashboard', icon: Award },
    { name: 'Referrals', href: '/referrals', icon: Users },
    { name: 'Wallet', href: '/wallet', icon: WalletIcon },
    { name: 'Notifications', href: '/notifications', icon: Bell },
    { name: 'Settings', href: '/settings', icon: SettingsIcon },
  ];

  const adminNav = [
    { name: 'Admin Control', href: '/admin-dashboard', icon: Shield },
    { name: 'User Dashboard', href: '/user-dashboard', icon: Award },
    { name: 'Merchant Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Analytics', href: '/analytics', icon: BarChart3 },
    { name: 'All Campaigns', href: '/campaigns-list', icon: Megaphone },
    { name: 'Settings', href: '/settings', icon: SettingsIcon },
  ];

  // Quick role switcher (for demo purposes)
  const [currentRole, setCurrentRole] = useState<'user' | 'merchant' | 'admin'>('merchant');

  // Get pending bonus count for merchant
  const pendingBonusCount = currentRole === 'merchant' 
    ? getPendingForMerchant('merchant-fashion').length 
    : 0;

  const navigation = 
    currentRole === 'admin' ? adminNav :
    currentRole === 'user' ? userNav :
    merchantNav;

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <div className="min-h-screen bg-[#FFFBF5]">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-[rgba(139,115,85,0.1)] shadow-warm-sm">
        <div className="flex items-center justify-between px-4 h-16">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-[12px] bg-gradient-to-br from-[#FFC857] to-[#FFB627] flex items-center justify-center shadow-warm">
              <Gift className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold text-[#2D2721]">GiftHub</span>
          </div>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="w-10 h-10 rounded-[12px] flex items-center justify-center hover:bg-[#F8F6F1] transition-colors"
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6 text-[#2D2721]" />
            ) : (
              <Menu className="h-6 w-6 text-[#2D2721]" />
            )}
          </button>
        </div>

        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
              onClick={() => setMobileMenuOpen(false)}
            />
            {/* Menu Panel */}
            <div className="fixed top-16 left-0 right-0 bottom-0 bg-white z-50 overflow-y-auto">
              <div className="p-4 space-y-2">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.name}
                      onClick={() => {
                        navigate(item.href);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-[12px] font-medium transition-all ${
                        isActive(item.href)
                          ? 'bg-gradient-to-br from-[#FFC857] to-[#FFB627] text-[#2D2721] shadow-warm'
                          : 'text-[#6B5744] hover:bg-[#F8F6F1]'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      {item.name}
                    </button>
                  );
                })}
                <button
                  onClick={() => navigate('/')}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-[12px] font-medium text-[#E17B5C] hover:bg-[#FEE2E2] transition-all"
                >
                  <LogOut className="h-5 w-5" />
                  Sign Out
                </button>
              </div>
            </div>
          </>
        )}
      </header>

      {/* Mobile spacing for fixed header */}
      <div className="lg:hidden h-16" />

      {/* Desktop Sidebar */}
      <aside className={`hidden lg:fixed lg:inset-y-0 lg:flex lg:flex-col bg-white border-r border-[rgba(139,115,85,0.1)] shadow-warm-sm transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-72'}`}>
        <div className="flex flex-col flex-1 min-h-0">
          {/* Logo */}
          <div className="relative flex items-center gap-3 px-6 py-6 border-b border-[rgba(139,115,85,0.1)]">
            <div className="w-12 h-12 rounded-[14px] bg-gradient-to-br from-[#FFC857] to-[#FFB627] flex items-center justify-center shadow-warm flex-shrink-0">
              <Gift className="h-7 w-7 text-white" />
            </div>
            <span className={`text-2xl font-bold text-[#2D2721] transition-opacity duration-300 ${isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'}`}>GiftHub</span>
            
            <button 
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="absolute -right-3 top-9 bg-white border border-[#E7DCC7] rounded-full p-1 text-[#6B5744] hover:text-[#E17B5C] shadow-sm hover:shadow-md transition-transform"
            >
              {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto overflow-x-hidden">
            {navigation.map((item) => {
              const Icon = item.icon;
              const showBadge = item.href === '/dashboard' && pendingBonusCount > 0;
              return (
                <button
                  key={item.name}
                  onClick={() => navigate(item.href)}
                  title={isCollapsed ? item.name : ''}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-[14px] font-medium transition-all relative group ${
                    isActive(item.href)
                      ? 'bg-gradient-to-br from-[#FFC857] to-[#FFB627] text-[#2D2721] shadow-warm'
                      : 'text-[#6B5744] hover:bg-[#F8F6F1]'
                  } ${isCollapsed ? 'justify-center' : ''}`}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  <span className={`transition-all duration-300 whitespace-nowrap ${isCollapsed ? 'w-0 opacity-0 overflow-hidden' : 'w-auto opacity-100'}`}>
                    {item.name}
                  </span>
                  
                  {isCollapsed && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-[#2D2721] text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 shadow-lg">
                      {item.name}
                    </div>
                  )}

                  {showBadge && (
                    <div className={`${isCollapsed ? 'absolute top-2 right-2 w-2 h-2 p-0' : 'ml-auto w-6 h-6'} bg-gradient-to-br from-[#E17B5C] to-[#D16B4C] rounded-full flex items-center justify-center transition-all duration-300`}>
                      {!isCollapsed && <span className="text-xs font-bold text-white">{pendingBonusCount}</span>}
                    </div>
                  )}
                </button>
              );
            })}
          </nav>

          {/* User Section */}
          <div className="p-4 border-t border-[rgba(139,115,85,0.1)]">
            {/* Role Switcher */}
            {!isCollapsed && (
            <div className="mb-4 p-3 bg-[#FFF9ED] rounded-[12px]">
              <div className="text-xs font-semibold text-[#8B7355] mb-2">Switch Role (Demo)</div>
              <div className="grid grid-cols-3 gap-1">
                <button
                  onClick={() => setCurrentRole('user')}
                  className={`text-xs py-2 px-2 rounded-lg font-medium transition-all ${
                    currentRole === 'user'
                      ? 'bg-gradient-to-br from-[#FFC857] to-[#FFB627] text-[#2D2721]'
                      : 'bg-white text-[#6B5744] hover:bg-[#FFE5B4]'
                  }`}
                >
                  👤 User
                </button>
                <button
                  onClick={() => setCurrentRole('merchant')}
                  className={`text-xs py-2 px-2 rounded-lg font-medium transition-all ${
                    currentRole === 'merchant'
                      ? 'bg-gradient-to-br from-[#FFC857] to-[#FFB627] text-[#2D2721]'
                      : 'bg-white text-[#6B5744] hover:bg-[#FFE5B4]'
                  }`}
                >
                  🏪 Merchant
                </button>
                <button
                  onClick={() => {
                    setCurrentRole('admin');
                    navigate('/admin-dashboard');
                  }}
                  className={`text-xs py-2 px-2 rounded-lg font-medium transition-all ${
                    currentRole === 'admin'
                      ? 'bg-gradient-to-br from-[#FFC857] to-[#FFB627] text-[#2D2721]'
                      : 'bg-white text-[#6B5744] hover:bg-[#FFE5B4]'
                  }`}
                >
                  👑 Admin
                </button>
              </div>
            </div>
            )}

            <div className={`bg-gradient-to-br from-[#FFF9ED] to-[#FFE5B4] rounded-[14px] p-4 mb-3 transition-all ${isCollapsed ? 'bg-none p-0 mb-4 bg-transparent' : ''}`}>
              <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : 'mb-3'}`}>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FFC857] to-[#FFB627] flex items-center justify-center font-semibold text-[#2D2721] flex-shrink-0">
                  {currentRole === 'admin' ? <Shield className="h-5 w-5" /> : 
                   currentRole === 'user' ? <Award className="h-5 w-5" /> : 
                   'FS'}
                </div>
                {!isCollapsed && (
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-[#2D2721] text-sm truncate">
                    {currentRole === 'admin' ? 'Super Admin' : 
                     currentRole === 'user' ? 'Maria Silva' : 
                     'Fashion Store'}
                  </div>
                  <div className="text-xs text-[#8B7355] capitalize">{currentRole} Account</div>
                </div>
                )}
              </div>
            </div>
            <WarmButton
              variant="outline"
              size="sm"
              fullWidth
              onClick={() => navigate('/')}
              className={isCollapsed ? 'px-0 justify-center' : ''}
              title={isCollapsed ? 'Sign Out' : ''}
            >
              <LogOut className={`h-4 w-4 ${isCollapsed ? '' : 'mr-2'}`} />
              {!isCollapsed && "Sign Out"}
            </WarmButton>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`transition-all duration-300 ${isCollapsed ? 'lg:pl-20' : 'lg:pl-72'}`}>
        {/* Sticky Country Selector Bar */}
        <div className="sticky top-0 z-30 bg-white border-b border-[rgba(139,115,85,0.1)] shadow-sm">
          <div className="px-4 py-3 sm:px-6 lg:px-8 max-w-7xl mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{selectedCountry.flag}</span>
              <div>
                <div className="font-semibold text-[#2D2721] text-sm">{selectedCountry.name}</div>
                <div className="text-xs text-[#8B7355]">Market Data</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <LanguageSelector variant="compact" />
              <CountrySelector variant="compact" />
            </div>
          </div>
          
          {/* Country Quick Stats Bar */}
          <div className="px-4 py-3 sm:px-6 lg:px-8 max-w-7xl mx-auto bg-gradient-to-r from-[#FFF9ED] to-[#FFE5B4]/30">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#9DB5A5] to-[#7FA090] flex items-center justify-center">
                  <Users className="h-4 w-4 text-white" />
                </div>
                <div>
                  <div className="text-xs text-[#8B7355]">Active Users</div>
                  <div className="font-semibold text-[#2D2721]">
                    {(Math.floor(Math.random() * 5000) + 1000).toLocaleString()}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#FFC857] to-[#FFB627] flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-white" />
                </div>
                <div>
                  <div className="text-xs text-[#8B7355]">Campaigns</div>
                  <div className="font-semibold text-[#2D2721]">
                    {Math.floor(Math.random() * 50) + 10}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#E8A87C] to-[#D4936A] flex items-center justify-center">
                  <Gift className="h-4 w-4 text-white" />
                </div>
                <div>
                  <div className="text-xs text-[#8B7355]">Vouchers</div>
                  <div className="font-semibold text-[#2D2721]">
                    {(Math.floor(Math.random() * 200) + 50).toLocaleString()}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#C8A882] to-[#B5956F] flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <div>
                  <div className="text-xs text-[#8B7355]">Engagement</div>
                  <div className="font-semibold text-[#2D2721]">
                    {Math.floor(Math.random() * 30) + 60}%
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 py-6 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Nav (Alternative) */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 bg-white border-t border-[rgba(139,115,85,0.1)] shadow-warm-lg z-40">
        <div className="grid grid-cols-5 gap-1 px-2 py-2">
          {navigation.slice(0, 5).map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.name}
                onClick={() => navigate(item.href)}
                className={`flex flex-col items-center gap-1 py-2 px-1 rounded-[12px] transition-all ${
                  isActive(item.href)
                    ? 'bg-gradient-to-br from-[#FFC857] to-[#FFB627] text-[#2D2721]'
                    : 'text-[#8B7355] hover:bg-[#F8F6F1]'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-[10px] font-medium">{item.name}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Bottom padding for mobile nav */}
      <div className="lg:hidden h-20" />

      {/* Widgets - only show when admin enables them */}
      <ChatWidget />
      <FeedbackWidget />
    </div>
  );
}