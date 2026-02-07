import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { WarmCard } from '@app/components/WarmCard';
import { WarmButton } from '@app/components/WarmButton';
import { ImageWithFallback } from '@app/components/figma/ImageWithFallback';
import { Input } from '@app/components/ui/input';
import { Search, MapPin, Star, ArrowRight } from 'lucide-react';
import { GlobalNavigation } from '@app/components/GlobalNavigation';
import { UnifiedData, Rental } from '@services/unifiedData';

const CATEGORIES = ['Kõik', 'Foto & Video', 'Droonid', 'Valgustus', 'Heli', 'Arvutid', 'Mängukonsoolid', 'Tööriistad', 'Matkavarustus'];

export function RentalHub() {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState('Kõik');
  const [searchQuery, setSearchQuery] = useState('');
  const [items, setItems] = useState<Rental[]>([]);

  // Load from unified service
  useEffect(() => {
    setItems(UnifiedData.getAllRentals());
  }, []);

  const filteredItems = items.filter(item => {
    const matchesCategory = activeCategory === 'Kõik' || item.category === activeCategory;
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.location.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#FAF7F2]">
      <GlobalNavigation />
      
      {/* Hero Section */}
      <div className="bg-[#2D2721] text-white py-16 px-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <ImageWithFallback 
            src="https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?ixlib=rb-4.1.0&auto=format&fit=crop&w=2000&q=80" 
            alt="Background" 
            className="w-full h-full object-cover"
          />
        </div>
        <div className="max-w-7xl mx-auto relative z-10 text-center">
          <h1 className="text-4xl md:text-5xl font-display font-bold mb-6">Rendi tipptasemel tehnikat</h1>
          <p className="text-xl text-white/80 max-w-2xl mx-auto mb-10">
            Leia oma projektiks sobiv varustus. Paindlikud rendiperioodid ja kindlustatud seadmed.
          </p>
          
          <div className="max-w-2xl mx-auto bg-white rounded-2xl p-2 flex items-center shadow-xl">
            <Search className="h-5 w-5 text-[#8B7355] ml-4 flex-shrink-0" />
            <Input 
              placeholder="Otsi kaamerat, objektiivi või muud..." 
              className="border-0 focus-visible:ring-0 text-[#2D2721] placeholder:text-[#8B7355]/60 text-lg h-12"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <WarmButton className="rounded-xl px-8" onClick={() => {}}>
              Otsi
            </WarmButton>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Categories */}
        <div className="flex overflow-x-auto gap-4 mb-10 pb-2 scrollbar-hide">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`whitespace-nowrap px-6 py-2.5 rounded-full text-sm font-bold transition-all ${
                activeCategory === cat 
                  ? 'bg-[#E17B5C] text-white shadow-warm' 
                  : 'bg-white text-[#6B5744] hover:bg-[#FFF9ED] border border-[#E7DCC7]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Results */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredItems.map((item) => (
            <div key={item.id} className="group cursor-pointer" onClick={() => navigate(`/rentals/${item.id}`)}>
              <WarmCard hover padding="none" className="h-full bg-white overflow-hidden flex flex-col">
                <div className="relative aspect-[4/3] overflow-hidden">
                  <ImageWithFallback 
                    src={item.image} 
                    alt={item.title} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur px-2 py-1 rounded-md text-xs font-bold flex items-center gap-1 shadow-sm">
                    <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                    {item.rating || 5.0}
                  </div>
                </div>
                
                <div className="p-5 flex flex-col flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-bold text-[#E17B5C] uppercase tracking-wider">{item.category}</span>
                  </div>
                  <h3 className="text-lg font-bold text-[#2D2721] mb-2 group-hover:text-[#E17B5C] transition-colors line-clamp-2">
                    {item.title}
                  </h3>
                  
                  <div className="flex items-center gap-1 text-sm text-[#8B7355] mb-4">
                    <MapPin className="w-4 h-4" />
                    {item.location}
                  </div>
                  
                  <div className="mt-auto pt-4 border-t border-[#E7DCC7]/50 flex items-center justify-between">
                    <div>
                      <span className="text-xl font-bold text-[#2D2721]">{item.pricePerDay}€</span>
                      <span className="text-sm text-[#8B7355]"> / päev</span>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-[#FAF7F2] flex items-center justify-center group-hover:bg-[#E17B5C] group-hover:text-white transition-colors">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </WarmCard>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}