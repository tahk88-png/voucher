import { useState } from 'react';
import { WarmCard } from '@app/components/WarmCard';
import { WarmButton } from '@app/components/WarmButton';
import { useNavigate } from 'react-router-dom';
import { 
  Check, 
  Zap, 
  Crown, 
  Rocket,
  CreditCard,
  Shield,
  Star,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { toast } from 'sonner';

export function SubscriptionPlans() {
  const navigate = useNavigate();
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly');
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const plans = [
    {
      id: 'starter',
      name: 'Starter',
      icon: Zap,
      color: 'from-[#9DB5A5] to-[#7FA090]',
      priceMonthly: 19,
      priceAnnual: 190, // 10 months
      description: 'Perfect for small businesses getting started',
      popular: false,
      features: [
        'Up to 1,000 vouchers/month',
        '5 active campaigns',
        'Basic analytics',
        'QR code generation',
        'Email support',
        'Mobile app access',
        '1 user account',
      ],
      limits: {
        vouchers: 1000,
        campaigns: 5,
        users: 1,
      }
    },
    {
      id: 'professional',
      name: 'Professional',
      icon: Crown,
      color: 'from-[#FFC857] to-[#FFB627]',
      priceMonthly: 29,
      priceAnnual: 290, // 10 months
      description: 'For growing businesses that need more',
      popular: true,
      features: [
        'Up to 10,000 vouchers/month',
        'Unlimited campaigns',
        'Advanced analytics & reports',
        'Custom branding',
        'API access',
        'Priority support',
        '3 user accounts',
        'Social media integration',
        'Email marketing tools',
      ],
      limits: {
        vouchers: 10000,
        campaigns: -1, // unlimited
        users: 3,
      }
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      icon: Rocket,
      color: 'from-[#E17B5C] to-[#D16B4C]',
      priceMonthly: 39,
      priceAnnual: 390, // 10 months
      description: 'For large organizations with complex needs',
      popular: false,
      features: [
        'Unlimited vouchers',
        'Unlimited campaigns',
        'White-label solution',
        'Multi-location support',
        'Dedicated account manager',
        '24/7 phone support',
        'Custom integrations',
        'Unlimited user accounts',
        'Advanced security features',
        'Priority feature requests',
      ],
      limits: {
        vouchers: -1, // unlimited
        campaigns: -1, // unlimited
        users: -1, // unlimited
      }
    },
  ];

  const handleSelectPlan = async (planId: string) => {
    setSelectedPlan(planId);
    setIsProcessing(true);

    // Simulate Stripe checkout redirect
    await new Promise(resolve => setTimeout(resolve, 1500));

    const plan = plans.find(p => p.id === planId);
    const price = billingPeriod === 'monthly' ? plan?.priceMonthly : plan?.priceAnnual;
    
    toast.success(`Redirecting to Stripe checkout for ${plan?.name} plan (€${price})...`);

    // In real app, this would redirect to Stripe Checkout
    // For demo, just navigate to success page
    setTimeout(() => {
      navigate('/subscription-success');
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFFBF5] via-[#FFF9ED] to-[#FFE5B4] py-12">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm border border-[rgba(139,115,85,0.1)] mb-4">
            <CreditCard className="h-5 w-5 text-[#FFC857]" />
            <span className="font-semibold text-[#2D2721]">Choose Your Plan</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-[#2D2721] mb-4">
            Select Your Subscription
          </h1>
          <p className="text-xl text-[#6B5744] max-w-2xl mx-auto mb-8">
            Choose the perfect plan for your business. All plans include 2 months free trial.
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

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const price = billingPeriod === 'monthly' ? plan.priceMonthly : Math.round(plan.priceAnnual / 12);
            const totalAnnual = billingPeriod === 'annual' ? plan.priceAnnual : plan.priceMonthly * 12;

            return (
              <WarmCard 
                key={plan.id} 
                hover 
                padding="xl" 
                className={`relative ${plan.popular ? 'border-2 border-[#FFC857] shadow-warm-lg' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="px-4 py-1 bg-gradient-to-br from-[#FFC857] to-[#FFB627] text-white text-sm font-bold rounded-full shadow-warm flex items-center gap-1">
                      <Star className="h-3 w-3" />
                      Most Popular
                    </span>
                  </div>
                )}

                {/* Plan Header */}
                <div className="text-center mb-6">
                  <div className={`w-16 h-16 rounded-[18px] bg-gradient-to-br ${plan.color} flex items-center justify-center mx-auto mb-4 shadow-warm-lg`}>
                    <Icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-[#2D2721] mb-2">{plan.name}</h3>
                  <p className="text-sm text-[#8B7355] mb-4">{plan.description}</p>
                </div>

                {/* Pricing */}
                <div className="text-center mb-6">
                  <div className="flex items-baseline justify-center gap-2 mb-2">
                    <span className="text-5xl font-bold text-[#2D2721]">€{price}</span>
                    <span className="text-[#8B7355]">/month</span>
                  </div>
                  {billingPeriod === 'annual' && (
                    <div className="text-sm text-[#9DB5A5] font-semibold">
                      €{totalAnnual}/year • Save €{(plan.priceMonthly * 12) - plan.priceAnnual}
                    </div>
                  )}
                  <div className="text-xs text-[#A89985] mt-1">
                    + 2 months free trial
                  </div>
                </div>

                {/* Features */}
                <div className="space-y-3 mb-6">
                  {plan.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <Check className={`h-5 w-5 flex-shrink-0 mt-0.5 ${
                        plan.popular ? 'text-[#FFC857]' : 'text-[#9DB5A5]'
                      }`} />
                      <span className="text-sm text-[#2D2721]">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* CTA Button */}
                <WarmButton
                  className="w-full"
                  variant={plan.popular ? 'default' : 'outline'}
                  onClick={() => handleSelectPlan(plan.id)}
                  disabled={isProcessing && selectedPlan !== plan.id}
                >
                  {isProcessing && selectedPlan === plan.id ? (
                    <>
                      <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Select {plan.name}
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </WarmButton>

                {billingPeriod === 'monthly' && (
                  <p className="text-xs text-center text-[#A89985] mt-3">
                    Cancel anytime • No commitment
                  </p>
                )}
              </WarmCard>
            );
          })}
        </div>

        {/* Trust Badges */}
        <WarmCard padding="lg" className="max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-center gap-8 text-center md:text-left">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-[#9DB5A5]" />
              <div>
                <div className="font-semibold text-[#2D2721]">Secure Payment</div>
                <div className="text-sm text-[#8B7355]">Powered by Stripe</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <CreditCard className="h-8 w-8 text-[#FFC857]" />
              <div>
                <div className="font-semibold text-[#2D2721]">No Setup Fees</div>
                <div className="text-sm text-[#8B7355]">Pay as you grow</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Sparkles className="h-8 w-8 text-[#E17B5C]" />
              <div>
                <div className="font-semibold text-[#2D2721]">2 Months Free</div>
                <div className="text-sm text-[#8B7355]">Try before you buy</div>
              </div>
            </div>
          </div>
        </WarmCard>

        {/* FAQ Section */}
        <div className="mt-12 text-center">
          <p className="text-[#8B7355] mb-4">
            Have questions? Contact our sales team for custom enterprise solutions.
          </p>
          <WarmButton variant="outline" onClick={() => navigate('/contact')}>
            Contact Sales
          </WarmButton>
        </div>
      </div>
    </div>
  );
}
