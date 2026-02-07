import { Link, useLocation, useNavigate } from 'react-router';
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
  Megaphone,
  Ticket,
  Calendar,
  CalendarDays,
  Gift,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { cn } from '@/figma/lib/utils';
import { LiveClock } from '@/figma/app/components/LiveClock';

export function GlobalNavigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [lang, setLang] = useState<'EST' | 'ENG'>('EST');

  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  const navItems = [
    { name: 'Avaleht', path: '/', icon: Home },
    { name: 'Kampaaniad', path: '/campaigns', icon: Megaphone },
    { name: 'Pakkumised', path: '/voucher', icon: Ticket },
    { name: 'Kinkekaardid', path: '/gift-cards', icon: Gift },
    { name: 'Sündmused', path: '/events', icon: CalendarDays },
    { name: 'Rent', path: '/rentals', icon: Calendar },
    { name: 'Pood', path: '/shop', icon: ShoppingBag },
  ];

  const toggleLang = () => {
    setLang(prev => prev === 'EST' ? 'ENG' : 'EST');
  };

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  return (
    <header className="sticky top-0 z-50 bg-white/75 backdrop-blur-md border-b border-[#E7DCC7] shadow-sm transition-shadow">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        
        {/* Left: Back & Logo */}
        <div className="flex items-center gap-4">
          {location.pathname !== '/' && (
            <button 
              onClick={() => navigate(-1)} 
              className="p-2 rounded-full hover:bg-[#FAF7F2] text-[#6B5744] transition-colors"
              title="Tagasi"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}

          <div className="flex items-center gap-6">
            <Logo className="flex-shrink-0" />
            
            <nav className="hidden md:flex items-center gap-1 bg-white/70 border border-[#E7DCC7]/70 rounded-full px-2 py-1 shadow-sm">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  aria-current={isActive(item.path) ? "page" : undefined}
                  className={cn(
                    "group px-3.5 py-2 rounded-full text-sm font-bold transition-all inline-flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFC857] focus-visible:ring-offset-2",
                    isActive(item.path)
                      ? "bg-[#2D2721] text-white shadow-warm-sm"
                      : "text-[#6B5744] hover:bg-[#FAF7F2] hover:text-[#2D2721]"
                  )}
                >
                  <span
                    className={cn(
                      "w-6 h-6 rounded-full grid place-items-center border text-[10px]",
                      isActive(item.path)
                        ? "border-white/20 bg-white/10 text-white"
                        : "border-[#E7DCC7] bg-white text-[#8B7355] group-hover:border-[#D9CBB4]"
                    )}
                  >
                    <item.icon className="w-3.5 h-3.5" />
                  </span>
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          <div className="hidden lg:block">
            <LiveClock />
          </div>

          <button 
             onClick={toggleLang}
             className="hidden sm:flex items-center gap-1 text-xs font-bold text-[#6B5744] px-2 py-1 rounded hover:bg-[#FAF7F2] transition-colors"
          >
             <Globe className="w-3 h-3" />
             {lang}
          </button>

          <Button
            variant="ghost"
            size="icon"
            className="hidden sm:flex text-[#6B5744] border border-transparent hover:border-[#E7DCC7] hover:bg-[#FAF7F2]"
          >
            <Search className="w-5 h-5" />
          </Button>
          
          <Link to="/cart">
            <Button
              variant="ghost"
              size="icon"
              className="text-[#6B5744] relative border border-transparent hover:border-[#E7DCC7] hover:bg-[#FAF7F2]"
            >
              <ShoppingBag className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-[#E17B5C] rounded-full border-2 border-white" />
            </Button>
          </Link>

          <Link to="/login" className="hidden sm:block">
            <Button variant="ghost" className="font-semibold text-[#6B5744] hover:bg-[#FAF7F2]">
              Logi sisse
            </Button>
          </Link>

          <Link to="/b2b-solutions" className="hidden sm:block">
            <Button className="bg-[#E17B5C] hover:bg-[#D16B4C] text-white rounded-full px-6 shadow-warm-sm hover:shadow-warm">
              Hakka partneriks
            </Button>
          </Link>

          {/* Mobile Menu Toggle */}
          <button 
            className="md:hidden p-2 text-[#2D2721]"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label={isMenuOpen ? "Sulge menüü" : "Ava menüü"}
            aria-expanded={isMenuOpen}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      <div className="h-px w-full bg-gradient-to-r from-transparent via-[#E7DCC7] to-transparent" />

      {/* Mobile Menu */}
      {isMenuOpen && (
        <>
          <div
            className="md:hidden fixed inset-x-0 top-16 bottom-0 bg-black/20 backdrop-blur-sm animate-fade-in"
            onClick={() => setIsMenuOpen(false)}
          />
          <div className="md:hidden absolute top-16 left-0 right-0 bg-white border-b border-[#E7DCC7] p-4 animate-fade-up shadow-xl h-[calc(100vh-64px)] overflow-y-auto">
            <nav className="flex flex-col gap-2">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMenuOpen(false)}
                  aria-current={isActive(item.path) ? "page" : undefined}
                  className={cn(
                    "px-4 py-3 rounded-xl text-lg font-bold transition-colors inline-flex items-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFC857] focus-visible:ring-offset-2",
                    isActive(item.path)
                      ? "bg-[#FAF7F2] text-[#2D2721]"
                      : "text-[#6B5744]"
                  )}
                >
                  <span className="w-8 h-8 rounded-full bg-[#FFF9ED] border border-[#E7DCC7] grid place-items-center text-[#8B7355]">
                    <item.icon className="w-4 h-4" />
                  </span>
                  {item.name}
                </Link>
              ))}
              
              <div className="h-px bg-[#E7DCC7] my-2" />
              
              <div className="flex items-center justify-between px-4 py-3">
                 <span className="text-[#6B5744] font-bold">Keel</span>
                 <div className="flex bg-[#FAF7F2] rounded-lg p-1 border border-[#E7DCC7]">
                    <button onClick={() => setLang('EST')} className={`px-3 py-1 rounded text-xs font-bold ${lang === 'EST' ? 'bg-white shadow-sm text-[#2D2721]' : 'text-[#8B7355]'}`}>EST</button>
                    <button onClick={() => setLang('ENG')} className={`px-3 py-1 rounded text-xs font-bold ${lang === 'ENG' ? 'bg-white shadow-sm text-[#2D2721]' : 'text-[#8B7355]'}`}>ENG</button>
                 </div>
              </div>

              <Link 
                to="/login"
                onClick={() => setIsMenuOpen(false)}
                className="px-4 py-3 text-[#6B5744] font-bold block hover:bg-[#FAF7F2] rounded-xl"
              >
                Logi sisse
              </Link>

              <Link 
                to="/b2b-solutions"
                onClick={() => setIsMenuOpen(false)}
                className="px-4 py-3 text-[#E17B5C] font-bold mt-2"
              >
                Hakka partneriks
              </Link>
            </nav>
          </div>
        </>
      )}
    </header>
  );
}
