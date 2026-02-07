import { useState } from 'react';
import { WarmCard } from '@/app/components/WarmCard';
import { WarmButton } from '@/app/components/WarmButton';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/app/contexts/LanguageContext';
import { useCountry } from '@/app/contexts/CountryContext';
import { 
  Gift, 
  Ticket, 
  ShoppingBag, 
  Calendar, 
  Users, 
  Sparkles, 
  TrendingUp, 
  Check, 
  ArrowRight,
  Shield,
  Server,
  Database,
  Heart,
  ChevronDown,
  Globe,
  MapPin
} from 'lucide-react';

export function B2BSolutions() {
  const navigate = useNavigate();
  const { t, language, setLanguage, availableLanguages } = useLanguage();
  const { selectedCountry, setSelectedCountry, availableCountries } = useCountry();
  
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const [isCountryMenuOpen, setIsCountryMenuOpen] = useState(false);

  const valueCards = [
    {
      icon: Ticket,
      title: 'Digital Vouchers',
      description: language === 'et' ? 'Loo paindlike reeglitega soodusvautšereid ja kampaaniaid.' : 'Create discount vouchers and campaigns with flexible rules.',
      color: 'from-[#FFC857] to-[#FFB627]',
    },
    {
      icon: ShoppingBag,
      title: language === 'et' ? 'E-pood & Ladu' : 'E-commerce & Stock',
      description: language === 'et' ? 'Müü füüsilisi tooteid koos laohalduse ja tarnetega.' : 'Sell physical products with inventory management and shipping.',
      color: 'from-[#9DB5A5] to-[#7FA090]',
    },
    {
      icon: Calendar,
      title: language === 'et' ? 'Rendiplatvorm' : 'Rental Platform',
      description: language === 'et' ? 'Halda broneeringuid, kalendreid ja tagatisi ühes kohas.' : 'Manage bookings, calendars, and deposits in one place.',
      color: 'from-[#E17B5C] to-[#D16B4C]',
    },
    {
      icon: Users,
      title: language === 'et' ? 'Soovitussüsteem' : 'Referral System',
      description: language === 'et' ? 'Premeeri kliente, kes toovad sulle uusi oste.' : 'Reward customers who bring you new business.',
      color: 'from-[#F5C98E] to-[#E5B97E]',
    },
  ];

  const howItWorks = [
    {
      step: 1,
      title: language === 'et' ? 'Vali Pakett' : 'Choose Plan',
      description: language === 'et' ? 'Vali oma ärile sobiv lahendus - vautšerid, e-pood või rent.' : 'Select the right solution for your business - vouchers, shop, or rentals.',
      icon: Sparkles,
    },
    {
      step: 2,
      title: language === 'et' ? 'Seadista Pood' : 'Setup Shop',
      description: language === 'et' ? 'Lisa oma tooted, teenused ja bränding mõne minutiga.' : 'Add your products, services, and branding in minutes.',
      icon: TrendingUp,
    },
    {
      step: 3,
      title: language === 'et' ? 'Alusta Müüki' : 'Start Selling',
      description: language === 'et' ? 'Jaga linke, müü kohapeal QR-koodiga ja jälgi laekumisi.' : 'Share links, sell on-site with QR codes, and track revenue.',
      icon: Check,
    },
  ];

  const faqs = [
    {
      question: language === 'et' ? 'Kas ma pean sõlmima pikaajalise lepingu?' : 'Do I need to sign a long-term contract?',
      answer: language === 'et' ? 'Ei, kõik meie paketid on kuupõhised ja ilma siduva lepinguta. Võid teenuse kasutamise igal ajal lõpetada.' : 'No, all our plans are monthly with no binding contracts. You can cancel anytime.',
    },
    {
      question: language === 'et' ? 'Kas ma saan paketti hiljem muuta?' : 'Can I change my plan later?',
      answer: language === 'et' ? 'Jah, saad paketti igal ajal uuendada või vähendada otse oma halduspaneelist. Muudatused jõustuvad koheselt.' : 'Yes, you can upgrade or downgrade your plan anytime from your dashboard. Changes take effect immediately.',
    },
    {
      question: language === 'et' ? 'Kuidas toimub raha väljamakse?' : 'How do payouts work?',
      answer: language === 'et' ? 'Kasutame Stripe ja Maksekeskuse lahendusi. Raha laekub sinu kontole automaatselt vastavalt valitud graafikule.' : 'We use Stripe and local payment gateways. Funds are deposited automatically to your account according to your schedule.',
    },
    {
      question: language === 'et' ? 'Kas mul on vaja oma domeeni?' : 'Do I need my own domain?',
      answer: language === 'et' ? 'Ei ole kohustuslik. Saad alustada meie alamdomeeniga, kuid soovitame kasutada oma domeeni.' : 'Not mandatory. You can start with our subdomain, but we recommend using your own domain for trust.',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFFBF5] via-[#FFF9ED] to-[#FFE5B4]">
      
      {/* Header with Logo and Login */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/80 border-b border-[rgba(139,115,85,0.1)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
              <div className="w-10 h-10 rounded-[12px] bg-gradient-to-br from-[#FFC857] to-[#FFB627] flex items-center justify-center shadow-warm">
                <Gift className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold text-[#2D2721]">GiftHub</span>
              <span className="hidden sm:inline-block px-2 py-0.5 bg-[#FAF7F2] border border-[#E7DCC7] rounded text-xs font-medium text-[#8B7355] ml-2">
                {t('b2b.badge')}
              </span>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="hidden lg:flex items-center gap-4 mr-4 text-sm font-medium text-[#6B5744]">
                <button onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-[#2D2721] transition-colors">{t('b2b.nav.features')}</button>
                <button onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-[#2D2721] transition-colors">{t('b2b.nav.pricing')}</button>
                <button onClick={() => document.getElementById('faq')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-[#2D2721] transition-colors">{t('b2b.nav.faq')}</button>
              </div>

              {/* Country Selector */}
              <div className="relative hidden sm:block">
                <button 
                  onClick={() => { setIsCountryMenuOpen(!isCountryMenuOpen); setIsLangMenuOpen(false); }}
                  className="flex items-center gap-1 px-3 py-2 rounded-lg hover:bg-[#FAF7F2] text-sm font-medium text-[#6B5744] transition-colors border border-transparent hover:border-[#E7DCC7]"
                >
                  <span className="text-lg">{selectedCountry.flag}</span>
                  <span className="hidden xl:inline">{selectedCountry.name}</span>
                  <ChevronDown className="w-4 h-4 ml-1 opacity-50" />
                </button>
                {isCountryMenuOpen && (
                  <div className="absolute top-full right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-[#E7DCC7] py-2 max-h-80 overflow-y-auto z-50">
                    <div className="px-3 py-2 text-xs font-bold text-[#8B7355] uppercase tracking-wider">Select Country</div>
                    {availableCountries.map((c) => (
                      <button
                        key={c.code}
                        onClick={() => { setSelectedCountry(c); setIsCountryMenuOpen(false); }}
                        className={`w-full text-left px-4 py-2 text-sm flex items-center gap-3 hover:bg-[#FAF7F2] ${selectedCountry.code === c.code ? 'bg-[#FAF7F2] font-semibold text-[#2D2721]' : 'text-[#6B5744]'}`}
                      >
                        <span className="text-xl">{c.flag}</span>
                        <span>{c.name}</span>
                        {selectedCountry.code === c.code && <Check className="w-4 h-4 ml-auto text-[#FFC857]" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Language Selector */}
              <div className="relative hidden sm:block">
                <button 
                  onClick={() => { setIsLangMenuOpen(!isLangMenuOpen); setIsCountryMenuOpen(false); }}
                  className="flex items-center gap-1 px-3 py-2 rounded-lg hover:bg-[#FAF7F2] text-sm font-medium text-[#6B5744] transition-colors border border-transparent hover:border-[#E7DCC7]"
                >
                  <Globe className="w-4 h-4 mr-1" />
                  <span className="uppercase">{language}</span>
                  <ChevronDown className="w-4 h-4 ml-1 opacity-50" />
                </button>
                {isLangMenuOpen && (
                  <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-[#E7DCC7] py-2 max-h-80 overflow-y-auto z-50">
                    <div className="px-3 py-2 text-xs font-bold text-[#8B7355] uppercase tracking-wider">Select Language</div>
                    {availableLanguages.map((l) => (
                      <button
                        key={l.code}
                        onClick={() => { setLanguage(l.code); setIsLangMenuOpen(false); }}
                        className={`w-full text-left px-4 py-2 text-sm flex items-center gap-3 hover:bg-[#FAF7F2] ${language === l.code ? 'bg-[#FAF7F2] font-semibold text-[#2D2721]' : 'text-[#6B5744]'}`}
                      >
                        <span className="text-xl">{l.flag}</span>
                        <span>{l.nativeName}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="h-6 w-px bg-[#E7DCC7] hidden sm:block mx-1" />

              <WarmButton variant="ghost" className="hidden sm:flex" onClick={() => navigate('/login')}>
                {t('b2b.login') || 'Logi sisse'}
              </WarmButton>
              <WarmButton onClick={() => navigate('/login')}>
                {t('b2b.start_free') || 'Alusta tasuta'}
              </WarmButton>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 sm:pt-20 sm:pb-24">
        <div className="absolute inset-0 opacity-30 pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-[#FFC857] rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#9DB5A5] rounded-full blur-3xl" />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm border border-[rgba(139,115,85,0.1)] mb-6">
            <Sparkles className="h-4 w-4 text-[#FFC857]" />
            <span className="text-sm font-medium text-[#6B5744]">{t('b2b.hero.tag')}</span>
          </div>
          
          <h1 className="text-4xl sm:text-6xl font-bold text-[#2D2721] mb-6 leading-tight">
            {t('b2b.hero.title_start')} <span className="bg-gradient-to-r from-[#FFC857] to-[#FFB627] bg-clip-text text-transparent">{t('b2b.hero.title_end')}</span>
          </h1>
          
          <p className="text-xl text-[#6B5744] mb-10 leading-relaxed max-w-3xl mx-auto">
            {t('b2b.hero.desc')}
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <WarmButton size="lg" onClick={() => navigate('/login')}>
              <Gift className="h-5 w-5 mr-2" />
              {t('b2b.hero.cta_primary')}
            </WarmButton>
            <WarmButton size="lg" variant="outline" onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}>
              {t('b2b.hero.cta_secondary')}
              <ArrowRight className="h-5 w-5 ml-2" />
            </WarmButton>
          </div>

          {/* Stats Bar */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 border-t border-[rgba(139,115,85,0.1)] pt-8">
            <div>
              <div className="text-3xl font-bold text-[#2D2721]">1000+</div>
              <div className="text-sm text-[#8B7355]">{t('b2b.stats.merchants')}</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-[#2D2721]">{selectedCountry.currency}2.5M</div>
              <div className="text-sm text-[#8B7355]">{t('b2b.stats.revenue')}</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-[#2D2721]">99.9%</div>
              <div className="text-sm text-[#8B7355]">{t('b2b.stats.uptime')}</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-[#2D2721]">24/7</div>
              <div className="text-sm text-[#8B7355]">{t('b2b.stats.support')}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 bg-white/50 backdrop-blur-sm rounded-[32px] mb-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-[#2D2721] mb-4">{t('b2b.features.title')}</h2>
          <p className="text-[#6B5744]">{t('b2b.features.subtitle')}</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {valueCards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <WarmCard key={idx} hover padding="lg" className="text-center h-full bg-white">
                <div className={`w-16 h-16 rounded-[16px] bg-gradient-to-br ${card.color} flex items-center justify-center mx-auto mb-4 shadow-warm`}>
                  <Icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-[#2D2721] mb-2">{card.title}</h3>
                <p className="text-sm text-[#6B5744]">{card.description}</p>
              </WarmCard>
            );
          })}
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-[#2D2721] mb-4">{t('b2b.pricing.title')}</h2>
          <p className="text-lg text-[#6B5744]">{t('b2b.pricing.subtitle')}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Starter */}
          <WarmCard padding="lg" className="bg-white border-2 border-transparent hover:border-[#9DB5A5] transition-all relative overflow-hidden flex flex-col hover:shadow-warm-lg">
            <div className="absolute top-0 right-0 bg-[#FAF7F2] p-2 rounded-bl-xl border-b border-l border-[#E7DCC7]">
               <Gift className="w-5 h-5 text-[#9DB5A5]" />
            </div>
            <h3 className="text-2xl font-bold text-[#2D2721] mb-2">{t('b2b.pricing.starter')}</h3>
            <p className="text-[#6B5744] text-sm mb-6 h-10">{language === 'et' ? 'Ideaalne alustavale ettevõttele.' : 'Perfect for small businesses.'}</p>
            <div className="flex items-baseline gap-1 mb-6">
              <span className="text-4xl font-bold text-[#2D2721]">{selectedCountry.currency}19</span>
              <span className="text-[#6B5744]">/ {language === 'et' ? 'kuu' : 'mo'}</span>
            </div>
            <ul className="space-y-3 mb-8 flex-1">
              <li className="flex items-center gap-3 text-sm text-[#2D2721]"><Check className="w-4 h-4 text-[#9DB5A5]" /> 1000 vouchers</li>
              <li className="flex items-center gap-3 text-sm text-[#2D2721]"><Check className="w-4 h-4 text-[#9DB5A5]" /> 5 campaigns</li>
              <li className="flex items-center gap-3 text-sm text-[#2D2721]"><Check className="w-4 h-4 text-[#9DB5A5]" /> QR codes</li>
            </ul>
            <WarmButton variant="outline" className="w-full mt-auto" onClick={() => navigate('/login')}>{t('common.getStarted')}</WarmButton>
          </WarmCard>

          {/* E-pood */}
          <WarmCard padding="lg" className="bg-white border-2 border-[#FFC857] shadow-xl relative overflow-hidden flex flex-col transform md:-translate-y-4 z-10 hover:shadow-2xl transition-shadow">
            <div className="absolute top-0 right-0 bg-[#FFC857] text-[#2D2721] px-3 py-1 text-xs font-bold rounded-bl-lg">POPULAR</div>
            <div className="absolute top-0 left-0 p-2"><ShoppingBag className="w-5 h-5 text-[#FFC857]" /></div>
            <h3 className="text-2xl font-bold text-[#2D2721] mb-2 mt-4">{t('b2b.pricing.ecommerce')}</h3>
            <p className="text-[#6B5744] text-sm mb-6 h-10">{language === 'et' ? 'Täielik e-pood ja laohaldus.' : 'Full e-commerce and stock management.'}</p>
            <div className="flex items-baseline gap-1 mb-6">
              <span className="text-5xl font-bold text-[#2D2721]">{selectedCountry.currency}29</span>
              <span className="text-[#6B5744]">/ {language === 'et' ? 'kuu' : 'mo'}</span>
            </div>
            <ul className="space-y-3 mb-8 flex-1">
              <li className="flex items-center gap-3 text-sm text-[#2D2721]"><Check className="w-4 h-4 text-[#FFC857]" /> <strong>All Starter features</strong></li>
              <li className="flex items-center gap-3 text-sm text-[#2D2721]"><Check className="w-4 h-4 text-[#FFC857]" /> Unlimited products</li>
              <li className="flex items-center gap-3 text-sm text-[#2D2721]"><Check className="w-4 h-4 text-[#FFC857]" /> Inventory management</li>
            </ul>
            <WarmButton className="w-full mt-auto bg-gradient-to-r from-[#FFC857] to-[#FFB627] hover:shadow-md text-[#2D2721]" onClick={() => navigate('/login')}>{t('common.getStarted')}</WarmButton>
          </WarmCard>

          {/* Rent */}
          <WarmCard padding="lg" className="bg-[#2D2721] text-white border-2 border-[#E17B5C] shadow-xl relative overflow-hidden flex flex-col hover:shadow-2xl transition-shadow">
            <div className="absolute top-0 right-0 bg-[#E17B5C] text-white px-3 py-1 text-xs font-bold rounded-bl-lg">ALL FEATURES</div>
            <div className="absolute top-0 left-0 p-2"><Calendar className="w-5 h-5 text-[#E17B5C]" /></div>
            <h3 className="text-2xl font-bold mb-2 mt-4">{t('b2b.pricing.rental')}</h3>
            <p className="text-white/70 text-sm mb-6 h-10">{language === 'et' ? 'Rendiplatvorm ja broneeringud.' : 'Rental platform and bookings.'}</p>
            <div className="flex items-baseline gap-1 mb-6">
              <span className="text-4xl font-bold text-[#E17B5C]">{selectedCountry.currency}39</span>
              <span className="text-white/70">/ {language === 'et' ? 'kuu' : 'mo'}</span>
            </div>
            <ul className="space-y-3 mb-8 flex-1">
              <li className="flex items-center gap-3 text-sm"><Check className="w-4 h-4 text-[#E17B5C]" /> <strong>All E-commerce features</strong></li>
              <li className="flex items-center gap-3 text-sm"><Check className="w-4 h-4 text-[#E17B5C]" /> Calendar bookings</li>
              <li className="flex items-center gap-3 text-sm"><Check className="w-4 h-4 text-[#E17B5C]" /> ID Verification</li>
            </ul>
            <WarmButton variant="secondary" className="w-full bg-[#E17B5C] text-white hover:bg-[#D16B4C] mt-auto" onClick={() => navigate('/login')}>{t('common.getStarted')}</WarmButton>
          </WarmCard>
        </div>
      </section>

      {/* For Merchants Detail Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <WarmCard padding="none" className="overflow-hidden bg-gradient-to-br from-[#FFC857] to-[#FFB627] shadow-warm-lg">
          <div className="p-8 lg:p-16 text-white text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full mb-6">
              <TrendingUp className="h-5 w-5" />
              <span className="text-sm font-bold">{t('b2b.features.subtitle')}</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-bold mb-6">
              GiftHub {selectedCountry.name} Partner
            </h2>
            <p className="text-white/90 text-xl mb-12 max-w-3xl mx-auto leading-relaxed">
              {t('b2b.hero.desc')}
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 text-left">
              <div className="bg-white/10 backdrop-blur rounded-xl p-6 hover:bg-white/20 transition-colors">
                <Sparkles className="h-8 w-8 mb-4 opacity-90" />
                <h4 className="font-bold text-lg mb-2">Easy Start</h4>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-xl p-6 hover:bg-white/20 transition-colors">
                <Users className="h-8 w-8 mb-4 opacity-90" />
                <h4 className="font-bold text-lg mb-2">Customers</h4>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-xl p-6 hover:bg-white/20 transition-colors">
                <TrendingUp className="h-8 w-8 mb-4 opacity-90" />
                <h4 className="font-bold text-lg mb-2">Analytics</h4>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-xl p-6 hover:bg-white/20 transition-colors">
                <Heart className="h-8 w-8 mb-4 opacity-90" />
                <h4 className="font-bold text-lg mb-2">2 Months Free</h4>
              </div>
            </div>
          </div>
        </WarmCard>
      </section>

      {/* How It Works */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold text-[#2D2721] mb-12">{language === 'et' ? 'Kuidas see töötab?' : 'How it works?'}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {howItWorks.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div key={idx} className="relative group">
                <WarmCard padding="lg" className="text-center h-full group-hover:-translate-y-2 transition-transform duration-300">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#FFC857] to-[#FFB627] flex items-center justify-center mx-auto mb-6 text-2xl font-bold text-white shadow-warm-lg group-hover:scale-110 transition-transform">
                    {step.step}
                  </div>
                  <Icon className="h-10 w-10 text-[#FFC857] mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-[#2D2721] mb-3">{step.title}</h3>
                  <p className="text-[#6B5744]">{step.description}</p>
                </WarmCard>
                {idx < howItWorks.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10 text-[#E7DCC7]">
                    <ArrowRight className="h-8 w-8" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-[#2D2721] mb-4">{t('b2b.nav.faq')}</h2>
        </div>
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className="bg-white rounded-xl border border-[rgba(139,115,85,0.1)] overflow-hidden shadow-sm">
              <button
                className="w-full flex items-center justify-between p-6 text-left"
                onClick={() => setOpenFaq(openFaq === index ? null : index)}
              >
                <span className="font-semibold text-[#2D2721] text-lg">{faq.question}</span>
                <ChevronDown className={`w-5 h-5 text-[#8B7355] transition-transform ${openFaq === index ? 'rotate-180' : ''}`} />
              </button>
              {openFaq === index && (
                <div className="px-6 pb-6 text-[#6B5744]">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Footer CTA */}
      <section className="bg-[#2D2721] text-white py-16 text-center">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">{t('b2b.cta.ready')}</h2>
          <p className="text-xl text-white/80 mb-8">
            {t('b2b.cta.desc')}
          </p>
          <WarmButton size="lg" className="bg-[#FFC857] text-[#2D2721] hover:bg-[#FFB627]" onClick={() => navigate('/login')}>
            {t('b2b.cta.button')}
          </WarmButton>
        </div>
      </section>

    </div>
  );
}