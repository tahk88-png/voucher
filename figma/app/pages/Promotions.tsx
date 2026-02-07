import { useState } from 'react';
import { WarmCard } from '@app/components/WarmCard';
import { WarmButton } from '@app/components/WarmButton';
import { 
  TrendingUp, 
  Star, 
  Zap,
  Eye,
  Target,
  Calendar,
  DollarSign,
  BarChart3,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { CurrencyDisplay } from '@app/components/CurrencyDisplay';
import { toast } from 'sonner';

type PromotionStatus = 'active' | 'scheduled' | 'completed';

type Campaign = {
  id: string;
  name: string;
  type: 'voucher' | 'gift-card' | 'event';
  promoted: boolean;
  promotedUntil?: string;
  views: number;
  conversions: number;
};

type PromotionPackage = {
  id: string;
  name: string;
  duration: number; // days
  price: number;
  features: string[];
  boost: number; // visibility multiplier
  recommended?: boolean;
};

export function Promotions() {
  const [campaigns] = useState<Campaign[]>([
    {
      id: 'camp-1',
      name: 'Summer Sale 25% Off',
      type: 'voucher',
      promoted: true,
      promotedUntil: '2024-02-10',
      views: 8543,
      conversions: 234,
    },
    {
      id: 'camp-2',
      name: 'Holiday Gift Card €50',
      type: 'gift-card',
      promoted: false,
      views: 1234,
      conversions: 45,
    },
    {
      id: 'camp-3',
      name: 'VIP Fashion Show',
      type: 'event',
      promoted: false,
      views: 892,
      conversions: 23,
    },
  ]);

  const packages: PromotionPackage[] = [
    {
      id: 'basic',
      name: 'Starter Boost',
      duration: 7,
      price: 29,
      boost: 3,
      features: [
        '3x visibility boost',
        'Featured in category',
        '7 days promotion',
        'Basic analytics',
      ],
    },
    {
      id: 'pro',
      name: 'Pro Boost',
      duration: 14,
      price: 79,
      boost: 5,
      features: [
        '5x visibility boost',
        'Homepage featured',
        '14 days promotion',
        'Priority placement',
        'Advanced analytics',
        'Social media feature',
      ],
      recommended: true,
    },
    {
      id: 'premium',
      name: 'Premium Boost',
      duration: 30,
      price: 149,
      boost: 10,
      features: [
        '10x visibility boost',
        'Top of all listings',
        '30 days promotion',
        'Guaranteed homepage spot',
        'Full analytics suite',
        'Social media package',
        'Email newsletter feature',
      ],
    },
  ];

  const promotionStats = {
    activePromotions: campaigns.filter(c => c.promoted).length,
    totalViews: campaigns.filter(c => c.promoted).reduce((sum, c) => sum + c.views, 0),
    totalConversions: campaigns.filter(c => c.promoted).reduce((sum, c) => sum + c.conversions, 0),
    averageROI: 3.5,
  };

  const handlePromote = (campaignId: string, packageId: string) => {
    toast.success('Campaign promoted successfully!');
  };

  const handleStopPromotion = (campaignId: string) => {
    toast.success('Promotion stopped');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-[#2D2721]">Promotions & Boost</h1>
        <p className="text-[#6B5744] mt-1">Increase visibility and reach more customers</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <WarmCard padding="lg" hover>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-[#8B7355] mb-1">Active Promotions</p>
              <p className="text-2xl font-bold text-[#2D2721]">{promotionStats.activePromotions}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#FFC857] to-[#FFB627] flex items-center justify-center shadow-warm">
              <Star className="h-6 w-6 text-white" />
            </div>
          </div>
        </WarmCard>

        <WarmCard padding="lg" hover>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-[#8B7355] mb-1">Total Views</p>
              <p className="text-2xl font-bold text-[#2D2721]">{promotionStats.totalViews.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#9DB5A5] to-[#7FA090] flex items-center justify-center shadow-warm">
              <Eye className="h-6 w-6 text-white" />
            </div>
          </div>
        </WarmCard>

        <WarmCard padding="lg" hover>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-[#8B7355] mb-1">Conversions</p>
              <p className="text-2xl font-bold text-[#2D2721]">{promotionStats.totalConversions}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#E17B5C] to-[#D16B4C] flex items-center justify-center shadow-warm">
              <Target className="h-6 w-6 text-white" />
            </div>
          </div>
        </WarmCard>

        <WarmCard padding="lg" hover>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-[#8B7355] mb-1">Average ROI</p>
              <p className="text-2xl font-bold text-[#2D2721]">{promotionStats.averageROI}x</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#F5C98E] to-[#E5B97E] flex items-center justify-center shadow-warm">
              <BarChart3 className="h-6 w-6 text-white" />
            </div>
          </div>
        </WarmCard>
      </div>

      {/* Promotion Packages */}
      <div>
        <h2 className="text-2xl font-bold text-[#2D2721] mb-4">Promotion Packages</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {packages.map((pkg) => (
            <WarmCard
              key={pkg.id}
              padding="lg"
              className={pkg.recommended ? 'border-2 border-[#FFC857]' : ''}
            >
              {pkg.recommended && (
                <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-br from-[#FFC857] to-[#FFB627] text-white text-xs font-semibold mb-4">
                  <Zap className="h-3 w-3" />
                  Most Popular
                </div>
              )}
              
              <div className="mb-6">
                <h3 className="text-xl font-bold text-[#2D2721] mb-2">{pkg.name}</h3>
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-4xl font-bold text-[#2D2721]">
                    <CurrencyDisplay amount={pkg.price} currency="EUR" />
                  </span>
                </div>
                <div className="flex items-center gap-2 p-3 bg-[#FFF9ED] rounded-lg mb-4">
                  <TrendingUp className="h-5 w-5 text-[#FFC857]" />
                  <div>
                    <div className="text-sm font-semibold text-[#2D2721]">{pkg.boost}x Visibility Boost</div>
                    <div className="text-xs text-[#8B7355]">{pkg.duration} days</div>
                  </div>
                </div>
              </div>

              <ul className="space-y-3 mb-6">
                {pkg.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-[#9DB5A5] flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-[#6B5744]">{feature}</span>
                  </li>
                ))}
              </ul>

              <WarmButton className="w-full">
                Get Started
              </WarmButton>
            </WarmCard>
          ))}
        </div>
      </div>

      {/* Your Campaigns */}
      <div>
        <h2 className="text-2xl font-bold text-[#2D2721] mb-4">Your Campaigns</h2>
        <div className="space-y-4">
          {campaigns.map((campaign) => (
            <WarmCard key={campaign.id} padding="lg" hover>
              <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-[#2D2721]">{campaign.name}</h3>
                    {campaign.promoted && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gradient-to-br from-[#FFC857] to-[#FFB627] text-white text-xs font-semibold">
                        <Star className="h-3 w-3 fill-current" />
                        Featured
                      </span>
                    )}
                    <span className="px-2 py-1 rounded-full bg-[#F2EDE3] text-[#6B5744] text-xs font-medium capitalize">
                      {campaign.type}
                    </span>
                  </div>
                  
                  {campaign.promoted && campaign.promotedUntil && (
                    <div className="flex items-center gap-2 text-sm text-[#8B7355] mb-3">
                      <Clock className="h-4 w-4" />
                      <span>Promoted until {campaign.promotedUntil}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-[#8B7355] mb-1">Views</div>
                      <div className="text-lg font-bold text-[#2D2721]">
                        {campaign.views.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-[#8B7355] mb-1">Conversions</div>
                      <div className="text-lg font-bold text-[#2D2721]">
                        {campaign.conversions}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  {campaign.promoted ? (
                    <>
                      <WarmButton
                        size="sm"
                        variant="outline"
                        onClick={() => handleStopPromotion(campaign.id)}
                      >
                        Stop Promotion
                      </WarmButton>
                      <WarmButton size="sm">
                        <BarChart3 className="h-4 w-4 mr-2" />
                        View Stats
                      </WarmButton>
                    </>
                  ) : (
                    <WarmButton
                      onClick={() => handlePromote(campaign.id, 'pro')}
                    >
                      <Zap className="h-5 w-5 mr-2" />
                      Promote
                    </WarmButton>
                  )}
                </div>
              </div>
            </WarmCard>
          ))}
        </div>
      </div>

      {/* Info Card */}
      <WarmCard padding="lg" className="bg-gradient-to-br from-[#FFF9ED] to-[#FFE5B4]">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#9DB5A5] to-[#7FA090] flex items-center justify-center flex-shrink-0">
            <TrendingUp className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-[#2D2721] mb-2">
              Why promote your campaigns?
            </h3>
            <ul className="space-y-2 text-sm text-[#6B5744]">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-[#9DB5A5] flex-shrink-0 mt-0.5" />
                <span>Reach up to 10x more customers with premium placement</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-[#9DB5A5] flex-shrink-0 mt-0.5" />
                <span>Featured on homepage and category pages</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-[#9DB5A5] flex-shrink-0 mt-0.5" />
                <span>Average ROI of 3.5x on promoted campaigns</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-[#9DB5A5] flex-shrink-0 mt-0.5" />
                <span>Detailed analytics to track performance</span>
              </li>
            </ul>
          </div>
        </div>
      </WarmCard>
    </div>
  );
}
