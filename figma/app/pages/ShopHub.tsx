import { useState, useEffect } from 'react';
import { useNavigate } from '@/lib/router-shim';
import { WarmButton } from '@app/components/WarmButton';
import { ImageWithFallback } from '@app/components/figma/ImageWithFallback';
import { Filter, Heart, Star } from 'lucide-react';
import { CurrencyDisplay } from '@app/components/CurrencyDisplay';
import { UnifiedData, Product } from '@services/unifiedData';

const CATEGORIES = ['KÃµik', 'Riided', 'Kodu', 'Aksessuaarid', 'Ehted', 'Kingitused', 'Elektroonika', 'Ilu & Tervis', 'Sport'];

export function ShopHub() {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState('KÃµik');
  const [products, setProducts] = useState<Product[]>([]);

  // Load from unified service
  useEffect(() => {
    setProducts(UnifiedData.getAllProducts());
  }, []);

  const filteredProducts = products.filter(p => 
    activeCategory === 'KÃµik' || p.category === activeCategory
  );

  return (
    <div className="min-h-screen bg-[#FAF7F2]">
      {/* Promo Bar */}
      <div className="bg-[#2D2721] text-white text-xs text-center py-2 px-4">
        Tasuta tarne tellimustele Ã¼le 50â‚¬ â€¢ 14-pÃ¤evane tagastusÃµigus
      </div>


      {/* Hero */}
      <div className="relative h-[400px] mb-12">
        <ImageWithFallback 
          src="https://images.unsplash.com/photo-1483985988355-763728e1935b?ixlib=rb-4.1.0&auto=format&fit=crop&w=2000&q=80" 
          alt="Collection"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center p-4">
          <span className="text-sm font-bold tracking-[0.2em] uppercase mb-4">Uus Kollektsioon</span>
          <h2 className="text-4xl md:text-5xl font-display font-bold mb-6">Kevadine VÃ¤rskus</h2>
          <WarmButton className="bg-white text-[#2D2721] hover:bg-[#FFF9ED] border-none">
            Vaata tooteid
          </WarmButton>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
          <div className="flex overflow-x-auto gap-2 pb-2 w-full sm:w-auto scrollbar-hide">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  activeCategory === cat 
                    ? 'bg-[#2D2721] text-white' 
                    : 'bg-white text-[#6B5744] hover:bg-[#FFF9ED] border border-[#E7DCC7]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          
          <button className="flex items-center gap-2 text-sm font-medium text-[#6B5744]">
            <Filter className="w-4 h-4" />
            Filtreeri & Sorteeri
          </button>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8">
          {filteredProducts.map((product) => (
            <div key={product.id} className="group cursor-pointer" onClick={() => navigate(`/shop/${product.id}`)}>
              <div className="relative aspect-[3/4] mb-3 overflow-hidden rounded-xl bg-white">
                <ImageWithFallback 
                  src={product.image} 
                  alt={product.name} 
                  className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-105`}
                />
                
                {/* Hover Actions */}
                <div className="absolute bottom-4 left-4 right-4 translate-y-full opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                  <WarmButton fullWidth size="sm" className="shadow-lg">
                    Vaata lÃ¤hemalt
                  </WarmButton>
                </div>

                <button className="absolute top-3 right-3 p-1.5 rounded-full bg-white/80 backdrop-blur text-[#2D2721] opacity-0 group-hover:opacity-100 transition-opacity hover:text-[#E17B5C]">
                  <Heart className="w-4 h-4" />
                </button>
              </div>

              <div>
                <h3 className="text-sm md:text-base font-medium text-[#2D2721] mb-1 group-hover:underline decoration-[#E7DCC7] underline-offset-4">
                  {product.name}
                </h3>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-bold text-[#2D2721]">
                      <CurrencyDisplay amount={product.price} />
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-[#8B7355]">
                    <Star className="w-3 h-3 fill-current" />
                    4.8
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}


