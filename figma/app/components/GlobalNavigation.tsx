import { Link, useLocation, useNavigate } from '@/lib/router-shim';
import { Logo } from '@/figma/app/components/Logo';
import { Button } from '@/figma/app/components/ui/button';
import {
  ShoppingBag,
  Search,
  Menu,
  X,
  ArrowLeft,
  Globe,
  Home,
  Ticket,
  CalendarDays,
  Gift,
  LayoutDashboard,
  LogOut,
  ShieldCheck,
  Store,
  User,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { cn } from '@/figma/lib/utils';
import { LiveClock } from '@/figma/app/components/LiveClock';
import { useLanguage } from '@/figma/app/contexts/LanguageContext';
import { useAuth } from '@/figma/app/contexts/AuthContext';

export function GlobalNavigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const { language, setLanguage } = useLanguage();
  const { role, isAuthenticated, logout, getHomeRoute } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  const navItems = [
    { name: 'Avaleht', path: '/', icon: Home },
    { name: 'Kampaaniad', path: '/campaigns', icon: Ticket },
    { name: 'Vautšerid', path: '/voucher', icon: Gift },
  ];

  const toggleLang = () => {
    setLanguage(language === 'et' ? 'en' : 'et');
  };

  const dashboardLabel =
    role === 'admin' ? 'Super Admin' : role === 'merchant' ? 'Ettevõtja juhtpaneel' : 'Minu konto';

  const DashboardIcon = role === 'admin' ? ShieldCheck : role === 'merchant' ? Store : User;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  return (
    <header className="sticky top-0 z-50 bg-white/85 backdrop-blur-md border-b border-[var(--border)] shadow-sm transition-shadow">
      <div className="max-w-[1400px] mx-auto px-3 sm:px-4 lg:px-6">
        <div className="h-[72px] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {location.pathname !== '/' && (
              <button
                onClick={() => navigate(-1)}
                className="p-2 rounded-full hover:bg-[var(--surface-muted)] text-[var(--text-muted)] transition-colors"
                title="Tagasi"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <Logo className="flex-shrink-0" />
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            <div className="hidden 2xl:block">
              <LiveClock />
            </div>

            {isAuthenticated && (
              <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full border border-[var(--border-strong)] bg-[var(--surface-muted)] text-xs font-bold text-[var(--text)] shadow-sm">
                <span className="w-5 h-5 rounded-full bg-[var(--surface)] border border-[var(--border)] grid place-items-center">
                  <DashboardIcon className="w-[18px] h-[18px] text-[var(--text)]" />
                </span>
                {dashboardLabel}
              </div>
            )}

            <button
              onClick={toggleLang}
              className="hidden lg:flex items-center gap-1.5 text-xs font-bold text-[var(--text)] px-3 py-1.5 rounded-lg border border-transparent hover:border-[var(--border)] hover:bg-[var(--surface-muted)] transition-colors"
            >
              <Globe className="w-4 h-4" />
              {language.toUpperCase()}
            </button>

            <Button
              variant="ghost"
              size="icon"
              className="hidden xl:flex text-[var(--text)] border border-[var(--border)] bg-[var(--surface-muted)] hover:bg-[var(--bg-2)]"
            >
              <Search className="w-5 h-5" />
            </Button>

            <Link to="/cart">
              <Button
                variant="ghost"
                size="icon"
                className="text-[var(--text)] relative border border-[var(--border)] bg-[var(--surface-muted)] hover:bg-[var(--bg-2)]"
              >
                <ShoppingBag className="w-5 h-5" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-[var(--danger)] rounded-full border-2 border-white" />
              </Button>
            </Link>

            {isAuthenticated ? (
              <>
                <button
                  type="button"
                  onClick={() => navigate(getHomeRoute())}
                  className="hidden xl:flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-[var(--text)] border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-muted)]"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="hidden xl:flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-muted)]"
                >
                  <LogOut className="w-4 h-4" />
                  Logi välja
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="hidden xl:block">
                  <Button variant="ghost" className="font-semibold text-[var(--text-muted)] hover:bg-[var(--surface-muted)]">
                    Logi sisse
                  </Button>
                </Link>
                <Link to="/b2b-solutions" className="hidden xl:block">
                  <Button className="bg-[var(--danger)] hover:opacity-90 text-white rounded-full px-6 shadow-warm-sm hover:shadow-warm">
                    Partnerile
                  </Button>
                </Link>
              </>
            )}

            <button
              className="md:hidden p-2 text-[var(--text)]"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label={isMenuOpen ? 'Sulge menüü' : 'Ava menüü'}
              aria-expanded={isMenuOpen}
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        <div className="hidden md:flex pb-3">
          <nav className="w-full flex items-center gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden bg-white/80 border border-[var(--border)] rounded-[18px] p-1.5 shadow-sm">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                aria-current={isActive(item.path) ? 'page' : undefined}
                className={cn(
                  'group shrink-0 px-3 py-2 rounded-[14px] text-sm font-semibold transition-all inline-flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2',
                  isActive(item.path)
                    ? 'bg-[var(--text)] text-white shadow-warm-sm'
                    : 'text-[var(--text-muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--text)]'
                )}
              >
                <span
                  className={cn(
                    'w-7 h-7 rounded-full grid place-items-center border',
                    isActive(item.path)
                      ? 'border-white/20 bg-white/10 text-white'
                      : 'border-[var(--border-strong)] bg-[var(--surface)] text-[var(--text-muted)] group-hover:border-[var(--text-faint)]'
                  )}
                >
                  <item.icon className="w-[18px] h-[18px]" />
                </span>
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      <div className="h-px w-full bg-gradient-to-r from-transparent via-[var(--border)] to-transparent" />

      {isMenuOpen && (
        <>
          <div
            className="md:hidden fixed inset-x-0 top-[72px] bottom-0 bg-black/20 backdrop-blur-sm animate-fade-in"
            onClick={() => setIsMenuOpen(false)}
          />
          <div className="md:hidden absolute top-[72px] left-0 right-0 bg-[var(--surface)] border-b border-[var(--border)] p-4 animate-fade-up shadow-xl h-[calc(100vh-72px)] overflow-y-auto">
            <nav className="flex flex-col gap-2">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMenuOpen(false)}
                  aria-current={isActive(item.path) ? 'page' : undefined}
                  className={cn(
                    'px-4 py-3 rounded-xl text-lg font-bold transition-colors inline-flex items-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2',
                    isActive(item.path) ? 'bg-[var(--surface-muted)] text-[var(--text)]' : 'text-[var(--text-muted)]'
                  )}
                >
                  <span className="w-9 h-9 rounded-full bg-[var(--bg-2)] border border-[var(--border-strong)] grid place-items-center text-[var(--text)]">
                    <item.icon className="w-[18px] h-[18px]" />
                  </span>
                  {item.name}
                </Link>
              ))}

              <div className="h-px bg-[var(--border)] my-2" />

              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-[var(--text-muted)] font-bold">Keel</span>
                <div className="flex bg-[var(--surface-muted)] rounded-lg p-1 border border-[var(--border)]">
                  <button
                    onClick={() => setLanguage('et')}
                    className={`px-3 py-1 rounded text-xs font-bold ${language === 'et' ? 'bg-[var(--surface)] shadow-sm text-[var(--text)]' : 'text-[var(--text-faint)]'}`}
                  >
                    ET
                  </button>
                  <button
                    onClick={() => setLanguage('en')}
                    className={`px-3 py-1 rounded text-xs font-bold ${language === 'en' ? 'bg-[var(--surface)] shadow-sm text-[var(--text)]' : 'text-[var(--text-faint)]'}`}
                  >
                    EN
                  </button>
                </div>
              </div>

              {isAuthenticated ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      navigate(getHomeRoute());
                      setIsMenuOpen(false);
                    }}
                    className="px-4 py-3 text-[var(--text)] font-bold block hover:bg-[var(--surface-muted)] rounded-xl w-full text-left"
                  >
                    Dashboard
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleLogout();
                      setIsMenuOpen(false);
                    }}
                    className="px-4 py-3 text-[var(--danger)] font-bold block hover:bg-[var(--surface-muted)] rounded-xl w-full text-left"
                  >
                    Logi välja
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setIsMenuOpen(false)}
                    className="px-4 py-3 text-[var(--text-muted)] font-bold block hover:bg-[var(--surface-muted)] rounded-xl"
                  >
                    Logi sisse
                  </Link>
                  <Link
                    to="/b2b-solutions"
                    onClick={() => setIsMenuOpen(false)}
                    className="px-4 py-3 text-[var(--danger)] font-bold mt-2"
                  >
                    Partnerile
                  </Link>
                </>
              )}
            </nav>
          </div>
        </>
      )}
    </header>
  );
}
