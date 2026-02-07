import { useState } from 'react';
import { WarmButton } from '@/figma/app/components/WarmButton';
import { WarmCard } from '@/figma/app/components/WarmCard';
import { ImageWithFallback } from '@/figma/app/components/figma/ImageWithFallback';
import { SEOHead } from '@/figma/app/components/SEOHead';
import { Tag, Clock, ArrowRight, Sparkles, Gift, Globe, Languages, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const MOCK_OFFERS = [
  {
    id: '1',
    title: 'Kevadine Spa Pakett',
    merchant: 'Grand Rose Spa',
    price: 45.00,
    originalPrice: 65.00,
    discount: '-30%',
    image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&q=80',
    expiresIn: '2 päeva',
    type: 'voucher'
  },
  {
    id: '2',
    title: '3-Käiguline Õhtusöök Kahele',
    merchant: 'Restoran Mantel ja Korsten',
    price: 89.00,
    originalPrice: 110.00,
    discount: '-20%',
    image: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80',
    expiresIn: '5 päeva',
    type: 'voucher'
  },
  {
    id: '3',
    title: 'Kinkekaart 50€ väärtuses',
    merchant: 'Kaubamaja',
    price: 50.00,
    image: 'https://images.unsplash.com/photo-1512909006721-3d6018887383?w=800&q=80',
    type: 'giftcard'
  },
  {
    id: '4',
    title: 'Surfi Algkoolitus',
    merchant: 'Surfy',
    price: 35.00,
    originalPrice: 50.00,
    discount: '-30%',
    image: 'https://images.unsplash.com/photo-1502680390469-be75c86b636f?w=800&q=80',
    expiresIn: '12 tundi',
    type: 'voucher'
  }
];

const LANGUAGES = [
  { code: 'et', name: 'Eesti' },
  { code: 'en', name: 'English' },
  { code: 'fi', name: 'Suomi' },
  { code: 'sv', name: 'Svenska' },
  { code: 'ru', name: 'Русский' },
  { code: 'lv', name: 'Latviešu' },
  { code: 'lt', name: 'Lietuvių' },
  { code: 'de', name: 'Deutsch' },
  { code: 'fr', name: 'Français' },
  { code: 'es', name: 'Español' },
  { code: 'it', name: 'Italiano' },
  { code: 'no', name: 'Norsk' },
  { code: 'da', name: 'Dansk' },
  { code: 'pl', name: 'Polski' },
  { code: 'uk', name: 'Українська' }
];

const MARKETS = [
  { code: 'EE', name: 'Eesti' },
  { code: 'FI', name: 'Finland' },
  { code: 'SE', name: 'Sweden' },
  { code: 'LV', name: 'Latvia' },
  { code: 'LT', name: 'Lithuania' },
  { code: 'NO', name: 'Norway' },
  { code: 'DK', name: 'Denmark' },
  { code: 'DE', name: 'Germany' },
  { code: 'PL', name: 'Poland' },
  { code: 'FR', name: 'France' },
  { code: 'IT', name: 'Italy' },
  { code: 'ES', name: 'Spain' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'US', name: 'United States' },
  { code: 'CA', name: 'Canada' }
];

export function VoucherOffers() {
  const navigate = useNavigate();
  const [selectedLang, setSelectedLang] = useState(LANGUAGES[0]);
  const [selectedMarket, setSelectedMarket] = useState(MARKETS[0]);
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [isMarketOpen, setIsMarketOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#FAF7F2] pb-12">
      <SEOHead title="Pakkumised ja Vautšerid | GiftHub" />

      {/* Hero */}
      <div className="bg-[#2D2721] text-[#E7DCC7] py-12 px-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#E17B5C]/10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
        <div className="max-w-7xl mx-auto relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E17B5C]/20 text-[#E17B5C] text-xs font-bold uppercase tracking-wider mb-4 border border-[#E17B5C]/30">
             <Sparkles className="w-3 h-3" /> Eksklusiivsed pakkumised
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-6">Avasta Parimad Elamused</h1>
          <p className="max-w-2xl mx-auto text-lg opacity-80 mb-8">
            Leia suurepäraseid pakkumisi spaadest restoranideni. Säästa kuni 50% või kingi elamusi oma lähedastele.
          </p>
          
          {/* Market & Language Selection */}
          <div className="flex flex-wrap justify-center gap-4 mt-6">
             {/* Market Selector */}
             <div className="relative">
                <button 
                   onClick={() => setIsMarketOpen(!isMarketOpen)}
                   className="flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur border border-white/10 rounded-full px-4 py-2 text-sm font-bold text-white transition-all min-w-[140px] justify-between"
                >
                   <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-[#E17B5C]" />
                      <span>{selectedMarket.name}</span>
                   </div>
                   <ChevronDown className="w-4 h-4 opacity-50" />
                </button>
                
                {isMarketOpen && (
                   <>
                      <div className="fixed inset-0 z-20" onClick={() => setIsMarketOpen(false)}></div>
                      <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-64 max-h-80 overflow-y-auto bg-white rounded-xl shadow-xl border border-[#E7DCC7] p-2 z-30 text-left custom-scrollbar">
                         <div className="text-xs font-bold text-[#8B7355] px-3 py-2 uppercase tracking-wider">Vali riik</div>
                         {MARKETS.map((market) => (
                            <button
                               key={market.code}
                               onClick={() => {
                                  setSelectedMarket(market);
                                  setIsMarketOpen(false);
                               }}
                               className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-between ${
                                  selectedMarket.code === market.code 
                                     ? 'bg-[#FFF9ED] text-[#E17B5C]' 
                                     : 'text-[#6B5744] hover:bg-[#FAF7F2]'
                               }`}
                            >
                               {market.name}
                               {selectedMarket.code === market.code && <div className="w-2 h-2 rounded-full bg-[#E17B5C]"></div>}
                            </button>
                         ))}
                      </div>
                   </>
                )}
             </div>

             {/* Language Selector */}
             <div className="relative">
                <button 
                   onClick={() => setIsLangOpen(!isLangOpen)}
                   className="flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur border border-white/10 rounded-full px-4 py-2 text-sm font-bold text-white transition-all min-w-[140px] justify-between"
                >
                   <div className="flex items-center gap-2">
                      <Languages className="w-4 h-4 text-[#FFC857]" />
                      <span>{selectedLang.name}</span>
                   </div>
                   <ChevronDown className="w-4 h-4 opacity-50" />
                </button>
                
                {isLangOpen && (
                   <>
                      <div className="fixed inset-0 z-20" onClick={() => setIsLangOpen(false)}></div>
                      <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-64 max-h-80 overflow-y-auto bg-white rounded-xl shadow-xl border border-[#E7DCC7] p-2 z-30 text-left custom-scrollbar">
                         <div className="text-xs font-bold text-[#8B7355] px-3 py-2 uppercase tracking-wider">Vali keel</div>
                         {LANGUAGES.map((lang) => (
                            <button
                               key={lang.code}
                               onClick={() => {
                                  setSelectedLang(lang);
                                  setIsLangOpen(false);
                               }}
                               className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-between ${
                                  selectedLang.code === lang.code 
                                     ? 'bg-[#FFF9ED] text-[#FFC857]' 
                                     : 'text-[#6B5744] hover:bg-[#FAF7F2]'
                               }`}
                            >
                               {lang.name}
                               {selectedLang.code === lang.code && <div className="w-2 h-2 rounded-full bg-[#FFC857]"></div>}
                            </button>
                         ))}
                      </div>
                   </>
                )}
             </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-12">
        
        {/* Filters (Mock) */}
        <div className="flex gap-2 overflow-x-auto pb-6 mb-6 custom-scrollbar">
           {['Kõik', 'Spa & Ilu', 'Restoranid', 'Meelelahutus', 'Kinkekaardid'].map((cat, i) => (
             <button 
               key={i} 
               className={`px-5 py-2 rounded-full whitespace-nowrap text-sm font-bold transition-all ${
                 i === 0 ? 'bg-[#2D2721] text-white' : 'bg-white border border-[#E7DCC7] text-[#6B5744] hover:bg-[#E7DCC7]'
               }`}
             >
               {cat}
             </button>
           ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {MOCK_OFFERS.map((offer) => (
            <div key={offer.id} onClick={() => navigate(`/voucher/${offer.id}`)} className="group cursor-pointer">
              <WarmCard padding="none" className="h-full hover:border-[#E17B5C] transition-all overflow-hidden flex flex-col">
                <div className="aspect-[4/3] relative overflow-hidden bg-[#2D2721]">
                   <ImageWithFallback 
                     src={offer.image} 
                     alt={offer.title} 
                     className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-90 group-hover:opacity-100" 
                   />
                   {offer.discount && (
                     <div className="absolute top-3 left-3 bg-[#E17B5C] text-white font-bold px-2 py-1 rounded-md text-sm shadow-sm">
                       {offer.discount}
                     </div>
                   )}
                   {offer.expiresIn && (
                     <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur text-white text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1">
                       <Clock className="w-3 h-3" /> {offer.expiresIn}
                     </div>
                   )}
                </div>
                
                <div className="p-5 flex-1 flex flex-col">
                  <div className="text-xs text-[#8B7355] font-bold mb-1 uppercase tracking-wide flex items-center gap-1">
                     {offer.type === 'giftcard' ? <Gift className="w-3 h-3" /> : <Tag className="w-3 h-3" />}
                     {offer.merchant}
                  </div>
                  <h3 className="font-bold text-[#2D2721] text-lg mb-2 leading-tight group-hover:text-[#E17B5C] transition-colors">
                    {offer.title}
                  </h3>
                  
                  <div className="mt-auto pt-4 flex items-center justify-between border-t border-[#FAF7F2]">
                    <div className="flex items-baseline gap-2">
                       <span className="text-xl font-bold text-[#2D2721]">{offer.price.toFixed(2)}€</span>
                       {offer.originalPrice && (
                         <span className="text-sm text-[#8B7355] line-through decoration-[#E17B5C]/50">{offer.originalPrice.toFixed(2)}€</span>
                       )}
                    </div>
                    <div className="w-8 h-8 rounded-full bg-[#FAF7F2] flex items-center justify-center text-[#2D2721] group-hover:bg-[#E17B5C] group-hover:text-white transition-colors">
                       <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </WarmCard>
            </div>
          ))}
        </div>

      </main>
    </div>
  );
}
