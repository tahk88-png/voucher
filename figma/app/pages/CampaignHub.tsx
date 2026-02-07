import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { WarmCard } from '@/figma/app/components/WarmCard';
import { WarmButton } from '@/figma/app/components/WarmButton';
import { CurrencyDisplay } from '@/figma/app/components/CurrencyDisplay';
import { Input } from '@/figma/app/components/ui/input';
import {
  Search,
  Sparkles,
  Gift,
  ShoppingBag,
  Heart,
  Star,
  PartyPopper,
  Share2,
  Ticket,
  Eye,
  Filter,
  Utensils,
  Plane,
} from 'lucide-react';
import { UnifiedData, Campaign } from '@/figma/services/unifiedData';

export function CampaignHub() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string>('Kõik');
  const [searchQuery, setSearchQuery] = useState('');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);

  useEffect(() => {
    setCampaigns(UnifiedData.getAllCampaigns());
  }, []);

  const categories = [
    { id: 'Kõik', label: 'Kõik', icon: Sparkles },
    { id: 'Restoranid', label: 'Restoranid', icon: Utensils },
    { id: 'Ilu & Tervis', label: 'Ilu & Tervis', icon: Heart },
    { id: 'Meelelahutus', label: 'Meelelahutus', icon: PartyPopper },
    { id: 'Reisimine', label: 'Reisimine', icon: Plane },
    { id: 'Teenused', label: 'Teenused', icon: Gift },
  ];

  const filteredCampaigns = campaigns.filter((campaign) => {
    const matchesCategory = selectedCategory === 'Kõik' || campaign.category_name === selectedCategory;
    const matchesSearch = campaign.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (campaign.merchant && campaign.merchant.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#FAF7F2]">

      {/* Hero / Header Section */}
      <div className="bg-[#2D2721] text-white py-12 px-4 mb-8">
        <div className="max-w-7xl mx-auto text-center">
            <h1 className="text-3xl md:text-4xl font-display font-bold mb-4">Avasta parimad pakkumised</h1>
            <p className="text-[#FFF9ED]/80 max-w-xl mx-auto mb-8">
                Leia eksklusiivseid elamusi, restorane ja teenuseid parimate hindadega.
            </p>
            
            <div className="max-w-2xl mx-auto bg-white rounded-xl p-2 flex items-center shadow-xl">
                <Search className="h-5 w-5 text-[#8B7355] ml-4 flex-shrink-0" />
                <Input
                    type="text"
                    placeholder="Otsi pakkumisi, restorane või teenuseid..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="border-0 focus-visible:ring-0 text-[#2D2721] placeholder:text-[#8B7355]/60 h-10 text-base"
                />
            </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Category Filters */}
        <div className="flex overflow-x-auto gap-3 mb-10 pb-2 scrollbar-hide justify-start md:justify-center">
            {categories.map((category) => {
            const Icon = category.icon;
            const isActive = selectedCategory === category.id;
            return (
                <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex items-center gap-2 rounded-full px-5 py-2.5 font-bold text-sm whitespace-nowrap transition-all ${
                    isActive
                    ? 'bg-[#E17B5C] text-white shadow-warm'
                    : 'bg-white text-[#6B5744] hover:bg-[#FFF9ED] border border-[#E7DCC7]'
                }`}
                >
                <Icon className="h-4 w-4" />
                {category.label}
                </button>
            );
            })}
        </div>

        {/* Campaigns Grid */}
        {filteredCampaigns.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCampaigns.map((campaign) => (
              <WarmCard
                key={campaign.id}
                hover
                padding="none"
                className="overflow-hidden group cursor-pointer h-full flex flex-col"
                onClick={() => navigate(`/campaign/${campaign.id}`)}
              >
                {/* Image */}
                <div className="relative h-48 overflow-hidden bg-[#FAF7F2]">
                  {campaign.image_url ? (
                      <img src={campaign.image_url} alt={campaign.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-[#8B7355]">
                        <Sparkles className="h-12 w-12 opacity-50" />
                    </div>
                  )}
                  
                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur px-2 py-1 rounded-md text-xs font-bold text-[#2D2721] shadow-sm">
                     {campaign.category_name}
                  </div>
                </div>

                <div className="p-5 flex flex-col flex-1">
                  {/* Header */}
                  <div className="mb-3">
                    <p className="text-xs font-bold text-[#E17B5C] uppercase tracking-wider mb-1">{campaign.merchant}</p>
                    <h3 className="text-lg font-bold text-[#2D2721] line-clamp-2 group-hover:text-[#E17B5C] transition-colors">
                      {campaign.title}
                    </h3>
                  </div>

                  {/* Price */}
                  <div className="mt-auto pt-4 border-t border-[#E7DCC7]/50 flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-xl font-bold text-[#2D2721]">
                                <CurrencyDisplay amount={campaign.price} />
                            </span>
                            {campaign.original_price && (
                                <span className="text-sm text-[#8B7355] line-through decoration-[#E17B5C]">
                                    <CurrencyDisplay amount={campaign.original_price} />
                                </span>
                            )}
                        </div>
                        {campaign.original_price && (
                             <span className="text-xs font-bold text-[#9DB5A5]">
                                Säästad {Math.round((1 - campaign.price / campaign.original_price) * 100)}%
                             </span>
                        )}
                    </div>
                    
                    <WarmButton size="sm" className="rounded-full w-10 h-10 p-0 flex items-center justify-center">
                        <ShoppingBag className="w-4 h-4" />
                    </WarmButton>
                  </div>
                  
                  {/* Footer stats */}
                  {campaign.stats && (
                      <div className="mt-3 flex items-center gap-2 text-xs text-[#8B7355]">
                          <Ticket className="w-3 h-3" />
                          <span>{campaign.stats.purchases} ostetud</span>
                      </div>
                  )}
                </div>
              </WarmCard>
            ))}
          </div>
        ) : (
          // Empty State
          <WarmCard padding="lg" className="text-center py-16 bg-white">
            <div className="w-16 h-16 rounded-full bg-[#FAF7F2] flex items-center justify-center mx-auto mb-4">
              <Filter className="h-8 w-8 text-[#8B7355]" />
            </div>
            <h3 className="text-xl font-bold text-[#2D2721] mb-2">Pakkumisi ei leitud</h3>
            <p className="text-[#6B5744] mb-6">
              Proovi muuta otsingusõna või vali teine kategooria.
            </p>
            <WarmButton variant="outline" onClick={() => {
              setSelectedCategory('Kõik');
              setSearchQuery('');
            }}>
              Tühista filtrid
            </WarmButton>
          </WarmCard>
        )}
      </div>
    </div>
  );
}
