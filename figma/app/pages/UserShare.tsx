import { useState } from 'react';
import { WarmCard } from '@app/components/WarmCard';
import { WarmButton } from '@app/components/WarmButton';
import { useBonusTracking } from '@app/contexts/BonusTracking';
import { copyToClipboard } from '@app/utils/clipboard';
import {
  Share2,
  Copy,
  MessageCircle,
  Facebook,
  Twitter,
  Instagram,
  Gift,
  Check,
  Star,
  TrendingUp,
  Award,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';

type Campaign = {
  id: string;
  merchantId: string;
  merchantName: string;
  name: string;
  description: string;
  bonusAmount: number;
  image: string;
  url: string;
};

export function UserShare() {
  const { addShareActivity } = useBonusTracking();
  const [copied, setCopied] = useState<string | null>(null);

  // Mock user data (in real app, this would come from auth context)
  const currentUser = {
    id: 'user-123',
    name: 'Maria Silva',
    email: 'maria.silva@email.com',
    phone: '+372 5555 1234',
  };

  const availableCampaigns: Campaign[] = [
    {
      id: 'summer-sale',
      merchantId: 'merchant-fashion',
      merchantName: 'Fashion Store',
      name: 'Summer Sale 25% Off',
      description: 'Share this amazing summer sale and earn 5€ gift card!',
      bonusAmount: 5,
      image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400',
      url: 'https://vouchers.app/c/summer-sale',
    },
    {
      id: 'beauty-week',
      merchantId: 'merchant-beauty',
      merchantName: 'Beauty Paradise',
      name: 'Beauty Week Special',
      description: 'Tell your friends about our beauty week! Get 10€ bonus.',
      bonusAmount: 10,
      image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=400',
      url: 'https://vouchers.app/c/beauty-week',
    },
    {
      id: 'fitness-promo',
      merchantId: 'merchant-fitness',
      merchantName: 'FitLife Gym',
      name: 'New Member Promotion',
      description: 'Share our gym and get 15€ for every signup!',
      bonusAmount: 15,
      image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400',
      url: 'https://vouchers.app/c/fitness-promo',
    },
  ];

  const handleShare = async (campaign: Campaign, platform: string) => {
    // Track the share activity
    addShareActivity({
      userId: currentUser.id,
      userName: currentUser.name,
      userEmail: currentUser.email,
      userPhone: currentUser.phone,
      merchantId: campaign.merchantId,
      merchantName: campaign.merchantName,
      campaignId: campaign.id,
      campaignName: campaign.name,
      platform: platform,
      bonusAmount: campaign.bonusAmount,
    });

    // Perform the actual share
    const text = `${campaign.name} - ${campaign.description}`;
    let url = '';

    switch (platform) {
      case 'Facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(campaign.url)}`;
        break;
      case 'Twitter':
        url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(campaign.url)}`;
        break;
      case 'WhatsApp':
        url = `https://wa.me/?text=${encodeURIComponent(text + ' ' + campaign.url)}`;
        break;
      case 'Instagram':
        const instagramSuccess = await copyToClipboard(campaign.url);
        if (instagramSuccess) {
          toast.success('Link copied! Share it on Instagram Story', {
            description: `You'll earn ${campaign.bonusAmount}€ when merchant approves!`,
          });
        }
        return;
      case 'Copy Link':
        const copySuccess = await copyToClipboard(campaign.url);
        if (copySuccess) {
          setCopied(campaign.id);
          setTimeout(() => setCopied(null), 2000);
          toast.success('Link copied to clipboard!', {
            description: `Share it to earn ${campaign.bonusAmount}€ gift card!`,
          });
        }
        return;
    }

    if (url) {
      window.open(url, '_blank', 'width=600,height=400');
    }

    toast.success(`🎉 Share tracked! Earn ${campaign.bonusAmount}€ bonus`, {
      description: `Merchant will verify and send you a gift card soon!`,
    });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#2D2721]">Share & Earn</h1>
          <p className="text-[#6B5744] mt-1">Share campaigns and get gift cards as rewards!</p>
        </div>
        <div className="text-right">
          <div className="text-sm text-[#8B7355]">Your earnings</div>
          <div className="text-3xl font-bold text-[#FFC857]">47€</div>
          <div className="text-xs text-[#8B7355]">Total bonuses</div>
        </div>
      </div>

      {/* How it Works */}
      <WarmCard padding="lg" className="bg-gradient-to-br from-[#FFF9ED] to-[#FFE5B4]">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#FFC857] to-[#FFB627] flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <h2 className="text-lg font-semibold text-[#2D2721]">How It Works</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#9DB5A5] to-[#7FA090] flex items-center justify-center text-white font-bold flex-shrink-0">
              1
            </div>
            <div>
              <div className="font-semibold text-[#2D2721] mb-1">Share Campaign</div>
              <div className="text-sm text-[#6B5744]">Pick a campaign and share it on social media</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#9DB5A5] to-[#7FA090] flex items-center justify-center text-white font-bold flex-shrink-0">
              2
            </div>
            <div>
              <div className="font-semibold text-[#2D2721] mb-1">Merchant Verifies</div>
              <div className="text-sm text-[#6B5744]">Merchant reviews and approves your share</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#9DB5A5] to-[#7FA090] flex items-center justify-center text-white font-bold flex-shrink-0">
              3
            </div>
            <div>
              <div className="font-semibold text-[#2D2721] mb-1">Get Gift Card</div>
              <div className="text-sm text-[#6B5744]">Receive your bonus gift card via email!</div>
            </div>
          </div>
        </div>
      </WarmCard>

      {/* Available Campaigns */}
      <div>
        <h2 className="text-xl font-semibold text-[#2D2721] mb-4">
          <Award className="h-5 w-5 inline mr-2 text-[#FFC857]" />
          Available Campaigns
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {availableCampaigns.map((campaign) => (
            <WarmCard key={campaign.id} padding="none" hover className="overflow-hidden">
              {/* Image */}
              <div className="relative h-40 bg-gradient-to-br from-[#FFC857] to-[#FFB627]">
                <img
                  src={campaign.image}
                  alt={campaign.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 right-3 px-3 py-1.5 bg-gradient-to-br from-[#9DB5A5] to-[#7FA090] rounded-full shadow-warm">
                  <div className="flex items-center gap-1 text-white font-bold text-sm">
                    <Gift className="h-4 w-4" />
                    {campaign.bonusAmount}€
                  </div>
                </div>
              </div>

              <div className="p-4">
                {/* Merchant */}
                <div className="text-xs text-[#8B7355] mb-1">{campaign.merchantName}</div>

                {/* Title */}
                <h3 className="font-semibold text-[#2D2721] mb-2">{campaign.name}</h3>

                {/* Description */}
                <p className="text-sm text-[#6B5744] mb-4">{campaign.description}</p>

                {/* Share Buttons */}
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <WarmButton
                    size="sm"
                    variant="outline"
                    onClick={() => handleShare(campaign, 'Facebook')}
                    className="text-xs"
                  >
                    <Facebook className="h-4 w-4 mr-1" />
                    Facebook
                  </WarmButton>
                  <WarmButton
                    size="sm"
                    variant="outline"
                    onClick={() => handleShare(campaign, 'WhatsApp')}
                    className="text-xs"
                  >
                    <MessageCircle className="h-4 w-4 mr-1" />
                    WhatsApp
                  </WarmButton>
                  <WarmButton
                    size="sm"
                    variant="outline"
                    onClick={() => handleShare(campaign, 'Twitter')}
                    className="text-xs"
                  >
                    <Twitter className="h-4 w-4 mr-1" />
                    Twitter
                  </WarmButton>
                  <WarmButton
                    size="sm"
                    variant="outline"
                    onClick={() => handleShare(campaign, 'Instagram')}
                    className="text-xs"
                  >
                    <Instagram className="h-4 w-4 mr-1" />
                    Instagram
                  </WarmButton>
                </div>

                {/* Copy Link */}
                <WarmButton
                  size="sm"
                  fullWidth
                  onClick={() => handleShare(campaign, 'Copy Link')}
                >
                  {copied === campaign.id ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Link & Earn {campaign.bonusAmount}€
                    </>
                  )}
                </WarmButton>
              </div>
            </WarmCard>
          ))}
        </div>
      </div>

      {/* Your Share History */}
      <WarmCard padding="lg">
        <h2 className="text-lg font-semibold text-[#2D2721] mb-4">
          <TrendingUp className="h-5 w-5 inline mr-2 text-[#9DB5A5]" />
          Your Recent Shares
        </h2>
        <div className="space-y-3">
          {[
            { campaign: 'Summer Sale 25% Off', platform: 'Facebook', status: 'approved', bonus: 5, date: '2 days ago' },
            { campaign: 'Beauty Week Special', platform: 'WhatsApp', status: 'pending', bonus: 10, date: '1 hour ago' },
            { campaign: 'New Member Promotion', platform: 'Instagram', status: 'approved', bonus: 15, date: '5 days ago' },
          ].map((share, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-[#FFF9ED] rounded-[12px] border border-[rgba(139,115,85,0.1)]"
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  share.status === 'approved' 
                    ? 'bg-gradient-to-br from-[#9DB5A5] to-[#7FA090]' 
                    : 'bg-gradient-to-br from-[#FFC857] to-[#FFB627]'
                }`}>
                  {share.status === 'approved' ? (
                    <Check className="h-5 w-5 text-white" />
                  ) : (
                    <TrendingUp className="h-5 w-5 text-white" />
                  )}
                </div>
                <div>
                  <div className="font-semibold text-[#2D2721]">{share.campaign}</div>
                  <div className="text-xs text-[#8B7355]">
                    {share.platform} • {share.date}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-[#FFC857]">{share.bonus}€</div>
                <div className={`text-xs ${
                  share.status === 'approved' ? 'text-[#9DB5A5]' : 'text-[#FFC857]'
                }`}>
                  {share.status === 'approved' ? '✓ Approved' : '⏳ Pending'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </WarmCard>
    </div>
  );
}