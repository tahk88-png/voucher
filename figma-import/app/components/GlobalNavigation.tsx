import { Link, useLocation, useNavigate } from 'react-router';
import { Logo } from '@/app/components/Logo';
import { Button } from '@/app/components/ui/button';
import { ShoppingBag, Search, Menu, X, ArrowLeft, Globe } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { LiveClock } from '@/app/components/LiveClock';

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
    { name: 'Pakkumised', path: '/voucher' },
    { name: 'Rent', path: '/rentals' },
    { name: 'Pood', path: '/shop' },
  ];

  const toggleLang = () => {
    setLang(prev => prev === 'EST' ? 'ENG' : 'EST');
  };

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-[#E7DCC7]">
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

          <div className="flex items-center gap-8">
            <Logo className="flex-shrink-0" />
            
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "px-4 py-2 rounded-full text-sm font-bold transition-all",
                    isActive(item.path)
                      ? "bg-[#2D2721] text-white"
                      : "text-[#6B5744] hover:bg-[#FAF7F2] hover:text-[#2D2721]"
                  )}
                >
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

          <Button variant="ghost" size="icon" className="hidden sm:flex text-[#6B5744]">
            <Search className="w-5 h-5" />
          </Button>
          
          <Link to="/cart">
            <Button variant="ghost" size="icon" className="text-[#6B5744] relative">
              <ShoppingBag className="w-5 h-5" />
            </Button>
          </Link>

          <Link to="/login" className="hidden sm:block">
            <Button variant="ghost" className="font-semibold text-[#6B5744] hover:bg-[#FAF7F2]">
              Logi sisse
            </Button>
          </Link>

          <Link to="/b2b-solutions" className="hidden sm:block">
            <Button className="bg-[#E17B5C] hover:bg-[#D16B4C] text-white rounded-full px-6 shadow-warm-sm">
              Partnerile
            </Button>
          </Link>

          {/* Mobile Menu Toggle */}
          <button 
            className="md:hidden p-2 text-[#2D2721]"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden absolute top-16 left-0 right-0 bg-white border-b border-[#E7DCC7] p-4 animate-in slide-in-from-top-2 shadow-xl h-[calc(100vh-64px)] overflow-y-auto">
          <nav className="flex flex-col gap-2">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMenuOpen(false)}
                className={cn(
                  "px-4 py-3 rounded-xl text-lg font-bold transition-colors",
                  isActive(item.path)
                    ? "bg-[#FAF7F2] text-[#2D2721]"
                    : "text-[#6B5744]"
                )}
              >
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
              Partnerile
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}