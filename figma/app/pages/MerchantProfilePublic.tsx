import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { WarmCard } from '@app/components/WarmCard';
import { WarmButton } from '@app/components/WarmButton';
import { ImageWithFallback } from '@app/components/figma/ImageWithFallback';
import { UnifiedData, Product, Rental, Campaign } from '@services/unifiedData';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@app/components/ui/tabs';
import { MapPin, Globe, Mail, Phone, Star, ArrowRight, ShoppingBag, Camera, Ticket } from 'lucide-react';
import { CurrencyDisplay } from '@app/components/CurrencyDisplay';

export function MerchantProfilePublic() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('products');
  
  const [products, setProducts] = useState<Product[]>([]);
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [merchantName, setMerchantName] = useState('Ettevõte');

  useEffect(() => {
    if (id) {
      const p = UnifiedData.getProductsByMerchant(id);
      const r = UnifiedData.getRentalsByMerchant(id);
      const c = UnifiedData.getCampaignsByMerchant(id);
      
      setProducts(p);
      setRentals(r);
      setCampaigns(c);

      // Try to find merchant name from any item
      const name = p[0]?.merchantName || r[0]?.merchantName || c[0]?.merchant || 'Tundmatu Ettevõte';
      setMerchantName(name);
    }
  }, [id]);

  if (!id) return <div>Merchant not found</div>;

  return (
    <div className="min-h-screen bg-[#FAF7F2]">

      {/* Hero / Header */}
      <div className="bg-white border-b border-[#E7DCC7]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            {/* Logo / Avatar */}
            <div className="w-32 h-32 rounded-2xl bg-[#FFF9ED] border-2 border-[#E7DCC7] flex items-center justify-center text-4xl font-bold text-[#FFC857] shadow-warm">
              {merchantName.charAt(0)}
            </div>

            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-display font-bold text-[#2D2721] mb-2">
                {merchantName}
              </h1>
              <div className="flex flex-wrap gap-4 text-sm text-[#6B5744] mb-6">
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  Tallinn, Eesti
                </div>
                <div className="flex items-center gap-1">
                  <Globe className="w-4 h-4" />
                  veebileht.ee
                </div>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-500 fill-current" />
                  4.9 (128 hinnangut)
                </div>
              </div>
              <p className="text-[#6B5744] max-w-2xl leading-relaxed">
                Pakume kvaliteetseid tooteid ja teenuseid. Meie eesmärk on pakkuda parimat kliendikogemust ja usaldusväärset partnerlust.
              </p>
            </div>

            <div className="flex gap-3">
              <WarmButton variant="outline">
                <Mail className="w-4 h-4 mr-2" />
                Saada kiri
              </WarmButton>
              <WarmButton>
                <Phone className="w-4 h-4 mr-2" />
                Helista
              </WarmButton>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="bg-white p-1 border border-[#E7DCC7] inline-flex rounded-xl h-auto">
            <TabsTrigger 
              value="products" 
              className="px-6 py-2.5 rounded-lg data-[state=active]:bg-[#FFC857] data-[state=active]:text-[#2D2721] flex items-center gap-2"
            >
              <ShoppingBag className="w-4 h-4" />
              E-pood ({products.length})
            </TabsTrigger>
            <TabsTrigger 
              value="rentals"
              className="px-6 py-2.5 rounded-lg data-[state=active]:bg-[#FFC857] data-[state=active]:text-[#2D2721] flex items-center gap-2"
            >
              <Camera className="w-4 h-4" />
              Rent ({rentals.length})
            </TabsTrigger>
            <TabsTrigger 
              value="campaigns"
              className="px-6 py-2.5 rounded-lg data-[state=active]:bg-[#FFC857] data-[state=active]:text-[#2D2721] flex items-center gap-2"
            >
              <Ticket className="w-4 h-4" />
              Voucherid ({campaigns.length})
            </TabsTrigger>
          </TabsList>

          {/* PRODUCTS CONTENT */}
          <TabsContent value="products" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {products.length === 0 ? (
              <div className="text-center py-12 text-[#8B7355]">Tooted puuduvad</div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {products.map((product) => (
                  <div key={product.id} className="group cursor-pointer" onClick={() => navigate(`/shop/${product.id}`)}>
                    <div className="relative aspect-[3/4] mb-3 overflow-hidden rounded-xl bg-white border border-[#E7DCC7]/30">
                      <ImageWithFallback 
                        src={product.image} 
                        alt={product.name} 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <div className="absolute bottom-4 left-4 right-4 translate-y-full opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                        <WarmButton fullWidth size="sm" className="shadow-lg">
                          Vaata
                        </WarmButton>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-medium text-[#2D2721] mb-1 group-hover:text-[#E17B5C] transition-colors truncate">
                        {product.name}
                      </h3>
                      <div className="font-bold text-[#2D2721]">
                        <CurrencyDisplay amount={product.price} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* RENTALS CONTENT */}
          <TabsContent value="rentals" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {rentals.length === 0 ? (
              <div className="text-center py-12 text-[#8B7355]">Renditooted puuduvad</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {rentals.map((item) => (
                  <div key={item.id} className="group cursor-pointer" onClick={() => navigate(`/rentals/${item.id}`)}>
                    <WarmCard hover padding="none" className="h-full bg-white overflow-hidden flex flex-col">
                      <div className="relative aspect-video overflow-hidden">
                        <ImageWithFallback 
                          src={item.image} 
                          alt={item.title} 
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      </div>
                      <div className="p-5 flex flex-col flex-1">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-xs font-bold text-[#E17B5C] uppercase tracking-wider">{item.category}</span>
                        </div>
                        <h3 className="text-lg font-bold text-[#2D2721] mb-2 group-hover:text-[#E17B5C] transition-colors">
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
            )}
          </TabsContent>

          {/* CAMPAIGNS CONTENT */}
          <TabsContent value="campaigns" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
             {campaigns.length === 0 ? (
              <div className="text-center py-12 text-[#8B7355]">Aktiivsed kampaaniad puuduvad</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {campaigns.map((campaign) => (
                  <div key={campaign.id} className="group cursor-pointer" onClick={() => navigate(`/campaigns/${campaign.id}`)}>
                    <WarmCard hover padding="none" className="h-full bg-white overflow-hidden flex flex-col">
                      <div className="relative aspect-[16/9] overflow-hidden">
                        <ImageWithFallback 
                          src={campaign.image_url || ''} 
                          alt={campaign.title} 
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                        {campaign.original_price && (
                          <div className="absolute top-3 right-3 bg-[#E17B5C] text-white px-2 py-1 rounded-md text-sm font-bold shadow-sm">
                            -{Math.round(((campaign.original_price - campaign.price) / campaign.original_price) * 100)}%
                          </div>
                        )}
                      </div>
                      <div className="p-5 flex flex-col flex-1">
                        <span className="text-xs font-bold text-[#8B7355] mb-2 uppercase tracking-wider block">
                          {campaign.category_name}
                        </span>
                        <h3 className="text-lg font-bold text-[#2D2721] mb-2 group-hover:text-[#E17B5C] transition-colors">
                          {campaign.title}
                        </h3>
                        <div className="mt-auto pt-4 flex items-center justify-between">
                          <div>
                            <span className="text-xl font-bold text-[#2D2721]">{campaign.price}€</span>
                            {campaign.original_price && (
                              <span className="text-sm text-[#8B7355] line-through ml-2">{campaign.original_price}€</span>
                            )}
                          </div>
                          <WarmButton size="sm" variant="outline">Vaata</WarmButton>
                        </div>
                      </div>
                    </WarmCard>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
