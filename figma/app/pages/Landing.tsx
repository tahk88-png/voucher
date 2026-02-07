import { useState } from 'react';
import { WarmCard } from '@app/components/WarmCard';
import { WarmButton } from '@app/components/WarmButton';
import { SEOHead } from '@app/components/SEOHead';
import { useNavigate } from 'react-router-dom';
import { 
  Gift, 
  Ticket, 
  QrCode, 
  CreditCard, 
  Users, 
  Sparkles, 
  TrendingUp, 
  Check, 
  ArrowRight,
  ChevronDown,
  Shield,
  Zap,
  Heart,
  PartyPopper,
  Star,
  Flame,
  Share2
} from 'lucide-react';

export function Landing() {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly');

  const valueCards = [
    {
      icon: Ticket,
      title: 'Digital Vouchers',
      description: 'Create discount vouchers with flexible rules and QR codes',
      color: 'from-[#FFC857] to-[#FFB627]',
    },
    {
      icon: QrCode,
      title: 'QR Redemption',
      description: 'Fast scanning and validation for in-store or online use',
      color: 'from-[#9DB5A5] to-[#7FA090]',
    },
    {
      icon: CreditCard,
      title: 'Gift Cards',
      description: 'Reloadable gift cards with balance tracking',
      color: 'from-[#E17B5C] to-[#D16B4C]',
    },
    {
      icon: Users,
      title: 'Referral Credits',
      description: 'Reward customers who bring new business',
      color: 'from-[#F5C98E] to-[#E5B97E]',
    },
  ];

  const howItWorks = [
    {
      step: 1,
      title: 'Create Campaign',
      description: 'Set up your voucher campaign with custom rules, discounts, and branding',
      icon: Sparkles,
    },
    {
      step: 2,
      title: 'Share & Promote',
      description: 'Share via link, QR code, or social media to reach your audience',
      icon: TrendingUp,
    },
    {
      step: 3,
      title: 'Track & Redeem',
      description: 'Monitor performance and process redemptions in real-time',
      icon: Check,
    },
  ];

  const categories = [
    { 
      name: 'Food & Drink', 
      icon: '🍽️',
      count: 234,
      color: 'from-[#FFC857] to-[#FFB627]',
      campaigns: ['20% off Pizza', 'Buy 1 Get 1 Coffee', 'Happy Hour Specials']
    },
    { 
      name: 'Fashion', 
      icon: '👗',
      count: 189,
      color: 'from-[#E17B5C] to-[#D16B4C]',
      campaigns: ['Summer Sale 50%', 'New Collection', 'Free Shipping']
    },
    { 
      name: 'Beauty', 
      icon: '💄',
      count: 156,
      color: 'from-[#F5C98E] to-[#E5B97E]',
      campaigns: ['Spa Day Deals', 'Hair Salon 30%', 'Makeup Masterclass']
    },
    { 
      name: 'Tehnika', 
      icon: '💻',
      count: 142,
      color: 'from-[#9DB5A5] to-[#7FA090]',
      campaigns: ['Tech Sale', 'Trade-in Bonus', 'Student Discount']
    },
    { 
      name: 'Travel', 
      icon: '✈️',
      count: 198,
      color: 'from-[#FFC857] to-[#FFB627]',
      campaigns: ['Weekend Getaway', 'Flight Deals', 'Hotel 40% Off']
    },
    { 
      name: 'Wellness', 
      icon: '🧘',
      count: 123,
      color: 'from-[#9DB5A5] to-[#7FA090]',
      campaigns: ['Yoga Classes', 'Gym Membership', 'Wellness Retreat']
    },
    { 
      name: 'Events', 
      icon: '🎉',
      count: 167,
      color: 'from-[#E17B5C] to-[#D16B4C]',
      campaigns: ['Concert Tickets', 'Festival Passes', 'VIP Access']
    },
    { 
      name: 'Home', 
      icon: '🏠',
      count: 134,
      color: 'from-[#F5C98E] to-[#E5B97E]',
      campaigns: ['Furniture Sale', 'Home Decor', 'Garden Tools']
    },
    { 
      name: 'Accommodation', 
      icon: '🏨',
      count: 87,
      color: 'from-[#9DB5A5] to-[#7FA090]',
      campaigns: ['Luxury Suite', 'Boutique Stay', 'Resort Deal']
    },
  ];

  const benefits = [
    'Unlimited campaigns and vouchers',
    'Real-time analytics dashboard',
    'Fraud protection and security',
    'Multi-currency support',
    'Custom branding options',
    'API access for integrations',
    'Dedicated support team',
    'No hidden fees',
  ];

  const faqs = [
    {
      question: 'How does the platform work?',
      answer: 'Create campaigns with vouchers or gift cards, share them with customers via links or QR codes, and track redemptions in real-time through your dashboard.',
    },
    {
      question: 'What types of vouchers can I create?',
      answer: 'You can create percentage discounts, fixed amount discounts, buy-one-get-one offers, gift cards with balances, and event tickets.',
    },
    {
      question: 'Is there a setup fee?',
      answer: 'No setup fees. Start for free and only pay when you scale with our flexible pricing plans.',
    },
    {
      question: 'Can I customize the look of my vouchers?',
      answer: 'Yes! Add your logo, brand colors, custom images, and personalized messaging to match your brand identity.',
    },
    {
      question: 'How do customers redeem vouchers?',
      answer: 'Customers can redeem via QR code scanning at your location, by entering a unique code online, or through staff validation.',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFFBF5] via-[#FFF9ED] to-[#FFE5B4]">
      <SEOHead
        title="GiftHub - Euroopa SaaS Vautšeri ja Soovituste Platvorm"
        description="Jaga, teeni ja lunasta kinkekaarte, vautšereid ja kampaaniaid üle Euroopa. Platvorm kaupmeestele ja kasutajatele. 1,343+ aktiivset kampaaniat."
        keywords={['vautšerid', 'kinkekaardid', 'kampaaniad', 'soovitused', 'boonused', 'allahindlused', 'Euroopa', 'SaaS', 'vouchers', 'gift cards', 'campaigns', 'referrals', 'ваучеры', 'подарочные карты']}
        type="website"
      />
      
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/80 border-b border-[rgba(139,115,85,0.1)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-[12px] bg-gradient-to-br from-[#FFC857] to-[#FFB627] flex items-center justify-center shadow-warm">
                <Gift className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold text-[#2D2721]">GiftHub</span>
            </div>
            <div className="flex items-center gap-3">
              <WarmButton variant="ghost" onClick={() => navigate('/campaigns')}>
                Explore Campaigns
              </WarmButton>
              <WarmButton onClick={() => navigate('/login')}>
                Login
              </WarmButton>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 left-10 w-72 h-72 bg-[#FFC857] rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#9DB5A5] rounded-full blur-3xl" />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-32">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm border border-[rgba(139,115,85,0.1)] mb-6">
              <Sparkles className="h-4 w-4 text-[#FFC857]" />
              <span className="text-sm font-medium text-[#6B5744]">European SaaS Voucher Platform</span>
            </div>
            
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold text-[#2D2721] mb-6 leading-tight">
              Turn Vouchers Into
              <span className="block bg-gradient-to-r from-[#FFC857] to-[#FFB627] bg-clip-text text-transparent">
                Revenue Growth
              </span>
            </h1>
            
            <p className="text-xl sm:text-2xl text-[#6B5744] mb-10 leading-relaxed max-w-3xl mx-auto">
              Create, manage, and track digital vouchers, gift cards, and referral campaigns. 
              All in one beautiful, easy-to-use platform built for European merchants.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <WarmButton size="lg" onClick={() => navigate('/login')}>
                <Gift className="h-5 w-5 mr-2" />
                Start as Merchant
              </WarmButton>
              <WarmButton size="lg" variant="outline" onClick={() => navigate('/campaigns')}>
                Explore Campaigns
                <ArrowRight className="h-5 w-5 ml-2" />
              </WarmButton>
            </div>

            <div className="mt-12 flex items-center justify-center gap-8 text-sm text-[#8B7355]">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-[#9DB5A5]" />
                No credit card required
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-[#9DB5A5]" />
                2 months free trial
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-[#9DB5A5]" />
                Cancel anytime
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 🔥 FEATURED: Explore Campaigns Banner - SUPER PROMINENT */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 mb-16">
        <WarmCard padding="none" className="overflow-hidden relative group cursor-pointer" onClick={() => navigate('/campaigns')}>
          <div className="absolute inset-0 bg-gradient-to-br from-[#FFC857] via-[#FFD700] to-[#FFB627] opacity-95" />
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMC41IiBvcGFjaXR5PSIwLjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30" />
          
          <div className="relative z-10 p-8 lg:p-12">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
              {/* Left side - Main content */}
              <div className="flex-1 text-center lg:text-left">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/90 rounded-full mb-6 shadow-warm">
                  <Flame className="h-5 w-5 text-[#E17B5C] animate-pulse" />
                  <span className="text-sm font-bold bg-gradient-to-r from-[#E17B5C] to-[#FFC857] bg-clip-text text-transparent">
                    HOT DEALS INSIDE
                  </span>
                  <Star className="h-5 w-5 text-[#FFC857] animate-pulse" />
                </div>
                
                <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4 leading-tight drop-shadow-lg">
                  🎯 Discover Amazing Campaigns!
                </h2>
                
                <p className="text-xl sm:text-2xl text-white/95 mb-8 leading-relaxed max-w-2xl mx-auto lg:mx-0 drop-shadow">
                  Browse <strong>1,343+ active campaigns</strong> across Europe • Vouchers, Gift Cards, Events & More
                </p>
                
                {/* Stats row */}
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 mb-8">
                  <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                    <Gift className="h-5 w-5 text-white" />
                    <div className="text-left">
                      <div className="text-2xl font-bold text-white">843</div>
                      <div className="text-xs text-white/80">Vouchers</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                    <CreditCard className="h-5 w-5 text-white" />
                    <div className="text-left">
                      <div className="text-2xl font-bold text-white">312</div>
                      <div className="text-xs text-white/80">Gift Cards</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                    <PartyPopper className="h-5 w-5 text-white" />
                    <div className="text-left">
                      <div className="text-2xl font-bold text-white">188</div>
                      <div className="text-xs text-white/80">Events</div>
                    </div>
                  </div>
                </div>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                  <button
                    onClick={() => navigate('/campaigns')}
                    className="group px-8 py-4 bg-white text-[#2D2721] rounded-full font-bold text-lg shadow-warm-lg hover:shadow-2xl hover:scale-105 transition-all duration-300 flex items-center gap-3"
                  >
                    <Sparkles className="h-6 w-6 text-[#FFC857] group-hover:rotate-12 transition-transform" />
                    Explore All Campaigns
                    <ArrowRight className="h-6 w-6 group-hover:translate-x-2 transition-transform" />
                  </button>
                  <div className="flex items-center gap-2 text-white/90 text-sm">
                    <Check className="h-4 w-4" />
                    <span>Free to browse</span>
                  </div>
                </div>
              </div>

              {/* Right side - Visual elements */}
              <div className="hidden lg:block">
                <div className="grid grid-cols-2 gap-4">
                  {/* Mini campaign cards preview */}
                  <div className="w-40 h-40 bg-white/95 backdrop-blur rounded-[20px] p-4 shadow-warm-lg hover:scale-105 transition-transform">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#E17B5C] to-[#D16B4C] flex items-center justify-center text-2xl mb-2 shadow-warm">
                      🍕
                    </div>
                    <div className="text-xs font-bold text-[#2D2721] mb-1">Food & Drink</div>
                    <div className="text-xs text-[#6B5744]">234 deals</div>
                  </div>
                  <div className="w-40 h-40 bg-white/95 backdrop-blur rounded-[20px] p-4 shadow-warm-lg hover:scale-105 transition-transform">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#9DB5A5] to-[#7FA090] flex items-center justify-center text-2xl mb-2 shadow-warm">
                      👗
                    </div>
                    <div className="text-xs font-bold text-[#2D2721] mb-1">Fashion</div>
                    <div className="text-xs text-[#6B5744]">189 deals</div>
                  </div>
                  <div className="w-40 h-40 bg-white/95 backdrop-blur rounded-[20px] p-4 shadow-warm-lg hover:scale-105 transition-transform">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#F5C98E] to-[#E5B97E] flex items-center justify-center text-2xl mb-2 shadow-warm">
                      ✈️
                    </div>
                    <div className="text-xs font-bold text-[#2D2721] mb-1">Travel</div>
                    <div className="text-xs text-[#6B5744]">198 deals</div>
                  </div>
                  <div className="w-40 h-40 bg-white/95 backdrop-blur rounded-[20px] p-4 shadow-warm-lg hover:scale-105 transition-transform">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#FFC857] to-[#FFB627] flex items-center justify-center text-2xl mb-2 shadow-warm">
                      🎉
                    </div>
                    <div className="text-xs font-bold text-[#2D2721] mb-1">Events</div>
                    <div className="text-xs text-[#6B5744]">167 deals</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Animated corner accent */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-bl-full" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-tr-full" />
        </WarmCard>
      </section>

      {/* Value Cards */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* For Users - FREE Section */}
        <div className="mb-16">
          <WarmCard padding="none" className="overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
              {/* Left - For Users */}
              <div className="p-8 lg:p-12 bg-gradient-to-br from-[#9DB5A5] to-[#7FA090] text-white">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full mb-6">
                  <Users className="h-5 w-5" />
                  <span className="text-sm font-bold">For Users</span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                  🎁 Share & Earn FREE Vouchers!
                </h2>
                <p className="text-white/90 text-lg mb-8 leading-relaxed">
                  As a regular user, you <strong>pay nothing!</strong> Share campaigns with friends and get rewarded with free vouchers and gift cards.
                </p>
                <div className="space-y-4 mb-8">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 mt-1">
                      <Check className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-bold text-lg mb-1">100% Free Forever</div>
                      <div className="text-white/80">No subscriptions, no hidden fees, ever!</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 mt-1">
                      <Share2 className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-bold text-lg mb-1">Share Campaigns</div>
                      <div className="text-white/80">Share deals on social media, WhatsApp, or email</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 mt-1">
                      <Gift className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-bold text-lg mb-1">Get Rewarded</div>
                      <div className="text-white/80">Earn vouchers & gift cards from merchants for every share</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 mt-1">
                      <Ticket className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-bold text-lg mb-1">Use Anywhere</div>
                      <div className="text-white/80">Redeem at participating merchants across Europe</div>
                    </div>
                  </div>
                </div>
                <WarmButton 
                  size="lg" 
                  className="bg-white text-[#2D2721] hover:bg-white/90 w-full sm:w-auto"
                  onClick={() => navigate('/campaigns')}
                >
                  <Sparkles className="h-5 w-5 mr-2" />
                  Start Earning Free Vouchers
                </WarmButton>
              </div>

              {/* Right - For Merchants */}
              <div className="p-8 lg:p-12 bg-gradient-to-br from-[#FFC857] to-[#FFB627] text-white">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full mb-6">
                  <TrendingUp className="h-5 w-5" />
                  <span className="text-sm font-bold">For Merchants</span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                  📈 Grow Your Business
                </h2>
                <p className="text-white/90 text-lg mb-8 leading-relaxed">
                  Create campaigns, reward customers who share, and watch your sales grow with our powerful platform.
                </p>
                <div className="space-y-4 mb-8">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 mt-1">
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-bold text-lg mb-1">Create Campaigns</div>
                      <div className="text-white/80">Unlimited vouchers, gift cards & events</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 mt-1">
                      <Users className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-bold text-lg mb-1">Track Customers</div>
                      <div className="text-white/80">See demographics, age, gender & sharing data</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 mt-1">
                      <TrendingUp className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-bold text-lg mb-1">Real-time Analytics</div>
                      <div className="text-white/80">Advanced insights & performance metrics</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 mt-1">
                      <Heart className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-bold text-lg mb-1">2 Months Free Trial</div>
                      <div className="text-white/80">No credit card required to start</div>
                    </div>
                  </div>
                </div>
                <WarmButton 
                  size="lg" 
                  className="bg-white text-[#2D2721] hover:bg-white/90 w-full sm:w-auto"
                  onClick={() => navigate('/login')}
                >
                  <Gift className="h-5 w-5 mr-2" />
                  Start Free Trial
                </WarmButton>
              </div>
            </div>
          </WarmCard>
        </div>

        {/* Features Grid */}
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-[#2D2721] mb-4">
            Platform Features
          </h2>
          <p className="text-lg text-[#6B5744]">
            Everything you need to create and manage successful campaigns
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {valueCards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <WarmCard key={idx} hover padding="lg" className="text-center">
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

      {/* How It Works */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-[#2D2721] mb-4">
            How It Works
          </h2>
          <p className="text-lg text-[#6B5744] max-w-2xl mx-auto">
            Get started in minutes with our simple three-step process
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {howItWorks.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div key={idx} className="relative">
                <WarmCard padding="lg" className="text-center h-full">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#FFC857] to-[#FFB627] flex items-center justify-center mx-auto mb-6 text-2xl font-bold text-white shadow-warm-lg">
                    {step.step}
                  </div>
                  <Icon className="h-10 w-10 text-[#FFC857] mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-[#2D2721] mb-3">{step.title}</h3>
                  <p className="text-[#6B5744]">{step.description}</p>
                </WarmCard>
                {idx < howItWorks.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                    <ArrowRight className="h-8 w-8 text-[#FFC857]" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-[#2D2721] mb-4">
            Explore Popular Campaigns
          </h2>
          <p className="text-lg text-[#6B5744]">
            Discover vouchers, deals, and experiences across Europe
          </p>
        </div>

        {/* Category Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3 mb-12">
          {categories.map((category, idx) => (
            <button
              key={idx}
              onClick={() => navigate('/campaigns')}
              className="group relative flex flex-col items-center gap-2 p-4 bg-white hover:bg-gradient-to-br hover:from-[#FFF9ED] hover:to-[#FFE5B4] rounded-[16px] border border-[rgba(139,115,85,0.1)] transition-all duration-300 hover:shadow-warm hover:-translate-y-1 hover:scale-105"
            >
              <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br ${category.color} flex items-center justify-center text-2xl sm:text-3xl shadow-warm transition-all duration-300 group-hover:scale-110`}>
                {category.icon}
              </div>
              <div className="text-center">
                <span className="text-xs sm:text-sm font-semibold text-[#2D2721] block mb-0.5">{category.name}</span>
                <span className="text-[10px] sm:text-xs text-[#8B7355] font-medium">{category.count} campaigns</span>
              </div>
            </button>
          ))}
        </div>

        {/* Featured Campaigns per Category */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.slice(0, 4).map((category, idx) => {
            const topCampaign = category.campaigns[0];
            return (
              <WarmCard 
                key={idx} 
                hover 
                padding="lg"
                className="cursor-pointer group"
                onClick={() => navigate('/campaigns')}
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${category.color} flex items-center justify-center text-2xl mb-4 shadow-warm group-hover:scale-110 transition-transform`}>
                  {category.icon}
                </div>
                <div className="mb-3">
                  <div className="text-xs text-[#8B7355] font-medium mb-1">{category.name}</div>
                  <h3 className="text-lg font-bold text-[#2D2721] mb-2">{topCampaign}</h3>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-[rgba(139,115,85,0.1)]">
                  <span className="text-xs text-[#6B5744]">{category.count} active</span>
                  <ArrowRight className="h-4 w-4 text-[#FFC857] group-hover:translate-x-1 transition-transform" />
                </div>
              </WarmCard>
            );
          })}
        </div>

        {/* View All Button */}
        <div className="text-center mt-10">
          <WarmButton size="lg" onClick={() => navigate('/campaigns')}>
            View All {categories.reduce((sum, cat) => sum + cat.count, 0)} Campaigns
            <ArrowRight className="h-5 w-5 ml-2" />
          </WarmButton>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-[#FFC857] to-[#FFB627] text-white rounded-full mb-6 shadow-warm">
            <TrendingUp className="h-5 w-5" />
            <span className="text-sm font-bold">Merchant Pricing Plans</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-[#2D2721] mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-lg text-[#6B5744] max-w-2xl mx-auto mb-2">
            Choose the plan that fits your business. Save 2 months with annual billing.
          </p>
          <p className="text-sm text-[#9DB5A5] font-semibold max-w-2xl mx-auto mb-8">
            💡 Remember: Regular users pay nothing! These plans are for merchants only.
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center gap-3 p-1 bg-white rounded-[14px] shadow-warm border border-[rgba(139,115,85,0.1)]">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`px-6 py-3 rounded-[12px] font-semibold transition-all ${
                billingPeriod === 'monthly'
                  ? 'bg-gradient-to-br from-[#FFC857] to-[#FFB627] text-white shadow-warm'
                  : 'text-[#8B7355] hover:text-[#2D2721]'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingPeriod('annual')}
              className={`px-6 py-3 rounded-[12px] font-semibold transition-all relative ${
                billingPeriod === 'annual'
                  ? 'bg-gradient-to-br from-[#FFC857] to-[#FFB627] text-white shadow-warm'
                  : 'text-[#8B7355] hover:text-[#2D2721]'
              }`}
            >
              Annual
              <span className="absolute -top-2 -right-2 px-2 py-0.5 bg-[#9DB5A5] text-white text-xs rounded-full font-bold">
                Save 17%
              </span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto items-start">
          {/* Starter Plan */}
          <div className="h-full">
            <WarmCard hover padding="xl" className="relative h-full flex flex-col">
              <div className="mb-6 text-center">
                <h3 className="text-2xl font-bold text-[#2D2721] mb-2">Starter</h3>
                <p className="text-[#8B7355] mb-6">Perfect for small businesses</p>
                <div className="flex items-baseline gap-2 mb-4 justify-center">
                  <span className="text-5xl font-bold text-[#2D2721]">
                    €{billingPeriod === 'monthly' ? '19' : '16'}
                  </span>
                  <span className="text-[#8B7355]">/month</span>
                </div>
                {billingPeriod === 'annual' && (
                  <div className="text-sm text-[#9DB5A5] font-semibold mb-4">
                    €190/year (save 2 months)
                  </div>
                )}
              </div>
              <ul className="space-y-3 mb-8 flex-grow">
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-[#9DB5A5] flex-shrink-0 mt-0.5" />
                  <span className="text-[#2D2721]">Up to 1,000 vouchers/month</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-[#9DB5A5] flex-shrink-0 mt-0.5" />
                  <span className="text-[#2D2721]">5 active campaigns</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-[#9DB5A5] flex-shrink-0 mt-0.5" />
                  <span className="text-[#2D2721]">Basic analytics</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-[#9DB5A5] flex-shrink-0 mt-0.5" />
                  <span className="text-[#2D2721]">QR code generation</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-[#9DB5A5] flex-shrink-0 mt-0.5" />
                  <span className="text-[#2D2721]">Email support</span>
                </li>
              </ul>
              <WarmButton className="w-full mt-auto" onClick={() => navigate('/login')}>
                Get Started
              </WarmButton>
            </WarmCard>
          </div>

          {/* Professional Plan - Popular */}
          <div className="md:-mt-4 h-full">
            <WarmCard hover padding="xl" className="relative h-full flex flex-col border-2 border-[#FFC857] shadow-warm-lg">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                <span className="px-4 py-1 bg-gradient-to-br from-[#FFC857] to-[#FFB627] text-white text-sm font-bold rounded-full shadow-warm">
                  Most Popular
                </span>
              </div>
              <div className="mb-6 text-center pt-2">
                <h3 className="text-2xl font-bold text-[#2D2721] mb-2">Professional</h3>
                <p className="text-[#8B7355] mb-6">For growing businesses</p>
                <div className="flex items-baseline gap-2 mb-4 justify-center">
                  <span className="text-5xl font-bold text-[#2D2721]">
                    €{billingPeriod === 'monthly' ? '29' : '24'}
                  </span>
                  <span className="text-[#8B7355]">/month</span>
                </div>
                {billingPeriod === 'annual' && (
                  <div className="text-sm text-[#9DB5A5] font-semibold mb-4">
                    €290/year (save 2 months)
                  </div>
                )}
              </div>
              <ul className="space-y-3 mb-8 flex-grow">
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-[#FFC857] flex-shrink-0 mt-0.5" />
                  <span className="text-[#2D2721]">Up to 10,000 vouchers/month</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-[#FFC857] flex-shrink-0 mt-0.5" />
                  <span className="text-[#2D2721]">Unlimited campaigns</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-[#FFC857] flex-shrink-0 mt-0.5" />
                  <span className="text-[#2D2721]">Advanced analytics & reports</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-[#FFC857] flex-shrink-0 mt-0.5" />
                  <span className="text-[#2D2721]">Custom branding</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-[#FFC857] flex-shrink-0 mt-0.5" />
                  <span className="text-[#2D2721]">API access</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-[#FFC857] flex-shrink-0 mt-0.5" />
                  <span className="text-[#2D2721]">Priority support</span>
                </li>
              </ul>
              <WarmButton className="w-full mt-auto" onClick={() => navigate('/login')}>
                Get Started
              </WarmButton>
            </WarmCard>
          </div>

          {/* Enterprise Plan */}
          <div className="h-full">
            <WarmCard hover padding="xl" className="relative h-full flex flex-col">
              <div className="mb-6 text-center">
                <h3 className="text-2xl font-bold text-[#2D2721] mb-2">Enterprise</h3>
                <p className="text-[#8B7355] mb-6">For large organizations</p>
                <div className="flex items-baseline gap-2 mb-4 justify-center">
                  <span className="text-5xl font-bold text-[#2D2721]">
                    €{billingPeriod === 'monthly' ? '39' : '33'}
                  </span>
                  <span className="text-[#8B7355]">/month</span>
                </div>
                {billingPeriod === 'annual' && (
                  <div className="text-sm text-[#9DB5A5] font-semibold mb-4">
                    €390/year (save 2 months)
                  </div>
                )}
              </div>
              <ul className="space-y-3 mb-8 flex-grow">
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-[#9DB5A5] flex-shrink-0 mt-0.5" />
                  <span className="text-[#2D2721]">Unlimited vouchers</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-[#9DB5A5] flex-shrink-0 mt-0.5" />
                  <span className="text-[#2D2721]">Unlimited campaigns</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-[#9DB5A5] flex-shrink-0 mt-0.5" />
                  <span className="text-[#2D2721]">White-label solution</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-[#9DB5A5] flex-shrink-0 mt-0.5" />
                  <span className="text-[#2D2721]">Multi-location support</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-[#9DB5A5] flex-shrink-0 mt-0.5" />
                  <span className="text-[#2D2721]">Dedicated account manager</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-[#9DB5A5] flex-shrink-0 mt-0.5" />
                  <span className="text-[#2D2721]">24/7 phone support</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-[#9DB5A5] flex-shrink-0 mt-0.5" />
                  <span className="text-[#2D2721]">Custom integrations</span>
                </li>
              </ul>
              <WarmButton className="w-full mt-auto" onClick={() => navigate('/login')}>
                Contact Sales
              </WarmButton>
            </WarmCard>
          </div>
        </div>

        {/* Pricing Footer */}
        <div className="mt-12 text-center">
          <p className="text-[#8B7355] mb-4">
            All plans include 2 months free trial • No credit card required • Cancel anytime
          </p>
          <div className="flex items-center justify-center gap-6 text-sm text-[#6B5744]">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-[#9DB5A5]" />
              <span>GDPR Compliant</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-[#FFC857]" />
              <span>Instant Setup</span>
            </div>
            <div className="flex items-center gap-2">
              <Heart className="h-4 w-4 text-[#E17B5C]" />
              <span>99.9% Uptime</span>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Benefits */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <WarmCard padding="none" className="overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2">
            <div className="p-8 lg:p-12 bg-gradient-to-br from-[#FFC857] to-[#FFB627]">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
                Why Merchants Love GiftHub
              </h2>
              <p className="text-white/90 text-lg mb-8">
                Join thousands of European businesses using our platform to grow their customer base and increase revenue.
              </p>
              <div className="flex items-center gap-8 mb-8">
                <div>
                  <div className="text-4xl font-bold text-white mb-1">2,500+</div>
                  <div className="text-white/80 text-sm">Active Merchants</div>
                </div>
                <div>
                  <div className="text-4xl font-bold text-white mb-1">€12M+</div>
                  <div className="text-white/80 text-sm">Processed</div>
                </div>
                <div>
                  <div className="text-4xl font-bold text-white mb-1">98%</div>
                  <div className="text-white/80 text-sm">Satisfaction</div>
                </div>
              </div>
            </div>
            <div className="p-8 lg:p-12 bg-white">
              <div className="space-y-4">
                {benefits.map((benefit, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#9DB5A5] to-[#7FA090] flex items-center justify-center flex-shrink-0">
                      <Check className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-[#2D2721] font-medium">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </WarmCard>
      </section>

      {/* FAQ */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-[#2D2721] mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-lg text-[#6B5744]">
            Everything you need to know about GiftHub
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <WarmCard key={idx} padding="lg" hover>
              <button
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full flex items-start justify-between gap-4 text-left"
              >
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-[#2D2721] mb-2">
                    {faq.question}
                  </h3>
                  {openFaq === idx && (
                    <p className="text-[#6B5744] leading-relaxed">
                      {faq.answer}
                    </p>
                  )}
                </div>
                <ChevronDown
                  className={`h-5 w-5 text-[#8B7355] transition-transform flex-shrink-0 ${
                    openFaq === idx ? 'rotate-180' : ''
                  }`}
                />
              </button>
            </WarmCard>
          ))}
        </div>
      </section>

      {/* Final CTA Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <WarmCard padding="none" className="overflow-hidden">
          <div className="relative bg-gradient-to-br from-[#2D2721] to-[#4D3F31] p-12 text-center">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-10 left-10 w-40 h-40 bg-[#FFC857] rounded-full blur-3xl" />
              <div className="absolute bottom-10 right-10 w-60 h-60 bg-[#9DB5A5] rounded-full blur-3xl" />
            </div>
            
            <div className="relative z-10">
              <PartyPopper className="h-16 w-16 text-[#FFC857] mx-auto mb-6" />
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Ready to Boost Your Sales?
              </h2>
              <p className="text-white/80 text-lg mb-8 max-w-2xl mx-auto">
                Start creating campaigns today and see the difference. No credit card required.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <WarmButton size="lg" onClick={() => navigate('/login')}>
                  Get Started Free
                  <ArrowRight className="h-5 w-5 ml-2" />
                </WarmButton>
                <WarmButton 
                  size="lg" 
                  variant="outline"
                  className="bg-white/10 border-white/30 text-white hover:bg-white/20"
                  onClick={() => navigate('/campaigns')}
                >
                  Browse Campaigns
                </WarmButton>
              </div>
            </div>
          </div>
        </WarmCard>
      </section>

      {/* Footer */}
      <footer className="bg-white/50 backdrop-blur-sm border-t border-[rgba(139,115,85,0.1)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#FFC857] to-[#FFB627] flex items-center justify-center">
                <Gift className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-[#2D2721]">GiftHub</span>
            </div>
            <p className="text-sm text-[#8B7355]">
              © 2026 GiftHub. Made with ❤️ in Europe.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}