"use client"

import { useState } from "react"
import Link from "next/link"
import { WarmCard } from "@/components/warm-card"
import { WarmButton } from "@/components/warm-button"
import {
  ArrowRight,
  Check,
  ChevronDown,
  CreditCard,
  Flame,
  Gift,
  Heart,
  PartyPopper,
  QrCode,
  Shield,
  Sparkles,
  Star,
  Ticket,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react"

export default function MarketingLanding() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "annual">("monthly")

  const valueCards = [
    {
      icon: Ticket,
      title: "Digital Vouchers",
      description: "Create discount vouchers with flexible rules and QR codes",
      color: "from-[#FFC857] to-[#FFB627]",
    },
    {
      icon: QrCode,
      title: "QR Redemption",
      description: "Fast scanning and validation for in-store or online use",
      color: "from-[#9DB5A5] to-[#7FA090]",
    },
    {
      icon: CreditCard,
      title: "Gift Cards",
      description: "Reloadable gift cards with balance tracking",
      color: "from-[#E17B5C] to-[#D16B4C]",
    },
    {
      icon: Users,
      title: "Referral Credits",
      description: "Reward customers who bring new business",
      color: "from-[#F5C98E] to-[#E5B97E]",
    },
  ]

  const howItWorks = [
    {
      step: 1,
      title: "Create Campaign",
      description: "Set up your voucher campaign with custom rules, discounts, and branding",
      icon: Sparkles,
    },
    {
      step: 2,
      title: "Share & Promote",
      description: "Share via link, QR code, or social media to reach your audience",
      icon: TrendingUp,
    },
    {
      step: 3,
      title: "Track & Redeem",
      description: "Monitor performance and process redemptions in real-time",
      icon: Check,
    },
  ]

  const categories = [
    { name: "Food & Drink", icon: "🍽️", count: 234, color: "from-[#FFC857] to-[#FFB627]" },
    { name: "Fashion", icon: "👗", count: 189, color: "from-[#E17B5C] to-[#D16B4C]" },
    { name: "Beauty", icon: "💄", count: 156, color: "from-[#F5C98E] to-[#E5B97E]" },
    { name: "Tech", icon: "💻", count: 142, color: "from-[#9DB5A5] to-[#7FA090]" },
    { name: "Travel", icon: "✈️", count: 198, color: "from-[#FFC857] to-[#FFB627]" },
    { name: "Wellness", icon: "🧘", count: 123, color: "from-[#9DB5A5] to-[#7FA090]" },
    { name: "Events", icon: "🎉", count: 167, color: "from-[#E17B5C] to-[#D16B4C]" },
    { name: "Home", icon: "🏠", count: 134, color: "from-[#F5C98E] to-[#E5B97E]" },
  ]

  const benefits = [
    "Unlimited campaigns and vouchers",
    "Real-time analytics dashboard",
    "Fraud protection and security",
    "Multi-currency support",
    "Custom branding options",
    "API access for integrations",
    "Dedicated support team",
    "No hidden fees",
  ]

  const faqs = [
    {
      question: "How does the platform work?",
      answer:
        "Create campaigns with vouchers or gift cards, share them with customers via links or QR codes, and track redemptions in real-time through your dashboard.",
    },
    {
      question: "What types of vouchers can I create?",
      answer:
        "You can create percentage discounts, fixed amount discounts, buy-one-get-one offers, gift cards with balances, and event tickets.",
    },
    {
      question: "Is there a setup fee?",
      answer: "No setup fees. Start for free and only pay when you scale with our flexible pricing plans.",
    },
    {
      question: "Can I customize the look of my vouchers?",
      answer:
        "Yes! Add your logo, brand colors, custom images, and personalized messaging to match your brand identity.",
    },
    {
      question: "How do customers redeem vouchers?",
      answer:
        "Customers can redeem via QR code scanning at your location, by entering a unique code online, or through staff validation.",
    },
  ]

  return (
    <div className="bg-gradient-to-br from-[#FFFBF5] via-[#FFF9ED] to-[#FFE5B4]">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 left-10 w-72 h-72 bg-[#FFC857] rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#9DB5A5] rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
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
              Create, manage, and track digital vouchers, gift cards, and referral campaigns. All in one beautiful,
              easy-to-use platform built for European merchants.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <WarmButton size="lg" asChild>
                <Link href="/login">
                  <Gift className="h-5 w-5 mr-2" />
                  Start as Merchant
                </Link>
              </WarmButton>
              <WarmButton size="lg" variant="outline" asChild>
                <Link href="/campaigns">
                  Explore Campaigns
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Link>
              </WarmButton>
            </div>

            <div className="mt-12 flex items-center justify-center gap-8 text-sm text-[#8B7355] flex-wrap">
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

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 mb-16">
        <WarmCard padding="none" className="overflow-hidden relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-[#FFC857] via-[#FFD700] to-[#FFB627] opacity-95" />
          <div className="absolute inset-0 opacity-30 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMC41IiBvcGFjaXR5PSIwLjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')]" />

          <div className="relative z-10 p-8 lg:p-12">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
              <div className="flex-1 text-center lg:text-left">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/90 rounded-full mb-6 shadow-warm">
                  <Flame className="h-5 w-5 text-[#E17B5C]" />
                  <span className="text-sm font-bold bg-gradient-to-r from-[#E17B5C] to-[#FFC857] bg-clip-text text-transparent">
                    HOT DEALS INSIDE
                  </span>
                  <Star className="h-5 w-5 text-[#FFC857]" />
                </div>

                <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4 leading-tight drop-shadow-lg">
                  🎯 Discover Amazing Campaigns!
                </h2>

                <p className="text-xl sm:text-2xl text-white/95 mb-8 leading-relaxed max-w-2xl mx-auto lg:mx-0 drop-shadow">
                  Browse <strong>1,343+ active campaigns</strong> across Europe • Vouchers, Gift Cards, Events & More
                </p>

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

                <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                  <Link
                    href="/campaigns"
                    className="group px-8 py-4 bg-white text-[#2D2721] rounded-full font-bold text-lg shadow-warm-lg hover:shadow-2xl hover:scale-105 transition-all duration-300 flex items-center gap-3"
                  >
                    <Sparkles className="h-6 w-6 text-[#FFC857] group-hover:rotate-12 transition-transform" />
                    Explore All Campaigns
                    <ArrowRight className="h-6 w-6 group-hover:translate-x-2 transition-transform" />
                  </Link>
                  <div className="flex items-center gap-2 text-white/90 text-sm">
                    <Check className="h-4 w-4" />
                    <span>Free to browse</span>
                  </div>
                </div>
              </div>
              <div className="hidden lg:block">
                <div className="grid grid-cols-2 gap-4">
                  {categories.slice(0, 4).map((category) => (
                    <div
                      key={category.name}
                      className="w-40 h-40 bg-white/95 backdrop-blur rounded-[20px] p-4 shadow-warm-lg"
                    >
                      <div
                        className={`w-12 h-12 rounded-xl bg-gradient-to-br ${category.color} flex items-center justify-center text-2xl mb-2 shadow-warm`}
                      >
                        {category.icon}
                      </div>
                      <div className="text-xs font-bold text-[#2D2721] mb-1">{category.name}</div>
                      <div className="text-xs text-[#6B5744]">{category.count} deals</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </WarmCard>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {valueCards.map((card) => {
            const Icon = card.icon
            return (
              <WarmCard key={card.title} hover padding="lg" className="cursor-pointer">
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center mb-4 shadow-warm`}
                >
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-[#2D2721] mb-2">{card.title}</h3>
                <p className="text-sm text-[#6B5744]">{card.description}</p>
              </WarmCard>
            )
          })}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <WarmCard padding="none" className="overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-3">
            <div className="lg:col-span-1 bg-gradient-to-br from-[#9DB5A5] to-[#7FA090] text-white p-8 lg:p-12">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full mb-6">
                <Users className="h-5 w-5" />
                <span className="text-sm font-bold">For Users</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">🎁 Share & Earn FREE Vouchers!</h2>
              <p className="text-white/90 text-lg mb-8 leading-relaxed">
                As a regular user, you pay nothing. Share campaigns with friends and get rewarded with free vouchers.
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 mt-1">
                    <Check className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-bold text-lg mb-1">100% Free Forever</div>
                    <div className="text-white/80">No subscriptions, no hidden fees, ever.</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 mt-1">
                    <Gift className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-bold text-lg mb-1">Get Rewarded</div>
                    <div className="text-white/80">Earn vouchers & gift cards from top brands.</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="lg:col-span-2 bg-white p-8 lg:p-12">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#FFC857] to-[#FFB627] flex items-center justify-center shadow-warm">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-[#2D2721]">How It Works</h3>
                  <p className="text-sm text-[#8B7355]">Simple steps to launch campaigns</p>
                </div>
              </div>
              <div className="grid gap-6 md:grid-cols-3">
                {howItWorks.map((step) => {
                  const Icon = step.icon
                  return (
                    <div key={step.step} className="space-y-3">
                      <div className="w-12 h-12 rounded-xl bg-[#FFF9ED] flex items-center justify-center">
                        <Icon className="h-6 w-6 text-[#E17B5C]" />
                      </div>
                      <div className="text-sm font-bold text-[#8B7355]">Step {step.step}</div>
                      <h4 className="text-lg font-bold text-[#2D2721]">{step.title}</h4>
                      <p className="text-sm text-[#6B5744]">{step.description}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </WarmCard>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-[#FFC857] to-[#FFB627] text-white rounded-full mb-6 shadow-warm">
            <TrendingUp className="h-5 w-5" />
            <span className="text-sm font-bold">Merchant Pricing Plans</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-[#2D2721] mb-4">Simple, Transparent Pricing</h2>
          <p className="text-lg text-[#6B5744] max-w-2xl mx-auto mb-2">
            Choose the plan that fits your business. Save 2 months with annual billing.
          </p>
          <p className="text-sm text-[#9DB5A5] font-semibold max-w-2xl mx-auto mb-8">
            💡 Remember: Regular users pay nothing! These plans are for merchants only.
          </p>

          <div className="inline-flex items-center gap-3 p-1 bg-white rounded-[14px] shadow-warm border border-[rgba(139,115,85,0.1)]">
            <button
              onClick={() => setBillingPeriod("monthly")}
              className={`px-6 py-3 rounded-[12px] font-semibold transition-all ${
                billingPeriod === "monthly"
                  ? "bg-gradient-to-br from-[#FFC857] to-[#FFB627] text-white shadow-warm"
                  : "text-[#8B7355] hover:text-[#2D2721]"
              }`}
              aria-pressed={billingPeriod === "monthly"}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingPeriod("annual")}
              className={`px-6 py-3 rounded-[12px] font-semibold transition-all relative ${
                billingPeriod === "annual"
                  ? "bg-gradient-to-br from-[#FFC857] to-[#FFB627] text-white shadow-warm"
                  : "text-[#8B7355] hover:text-[#2D2721]"
              }`}
              aria-pressed={billingPeriod === "annual"}
            >
              Annual
              <span className="absolute -top-2 -right-2 px-2 py-0.5 bg-[#9DB5A5] text-white text-xs rounded-full font-bold">
                Save 17%
              </span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto items-start">
          {[
            {
              name: "Starter",
              monthly: "19",
              annual: "16",
              features: [
                "Up to 1,000 vouchers/month",
                "5 active campaigns",
                "Basic analytics",
                "QR code generation",
                "Email support",
              ],
              highlight: false,
            },
            {
              name: "Professional",
              monthly: "29",
              annual: "24",
              features: [
                "Up to 10,000 vouchers/month",
                "Unlimited campaigns",
                "Advanced analytics & reports",
                "Custom branding",
                "API access",
                "Priority support",
              ],
              highlight: true,
            },
            {
              name: "Enterprise",
              monthly: "39",
              annual: "33",
              features: [
                "Unlimited vouchers",
                "Unlimited campaigns",
                "White-label solution",
                "Multi-location support",
                "Dedicated account manager",
                "24/7 phone support",
                "Custom integrations",
              ],
              highlight: false,
            },
          ].map((plan) => (
            <WarmCard
              key={plan.name}
              hover
              padding="xl"
              className={`relative h-full flex flex-col ${plan.highlight ? "border-2 border-[#FFC857] shadow-warm-lg" : ""}`}
            >
              {plan.highlight && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                  <span className="px-4 py-1 bg-gradient-to-br from-[#FFC857] to-[#FFB627] text-white text-sm font-bold rounded-full shadow-warm">
                    Most Popular
                  </span>
                </div>
              )}
              <div className="mb-6 text-center pt-2">
                <h3 className="text-2xl font-bold text-[#2D2721] mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-2 mb-4 justify-center">
                  <span className="text-5xl font-bold text-[#2D2721]">
                    €{billingPeriod === "monthly" ? plan.monthly : plan.annual}
                  </span>
                  <span className="text-[#8B7355]">/month</span>
                </div>
                {billingPeriod === "annual" && (
                  <div className="text-sm text-[#9DB5A5] font-semibold mb-4">
                    €{Number(plan.monthly) * 10}/year (save 2 months)
                  </div>
                )}
              </div>
              <ul className="space-y-3 mb-8 flex-grow">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <Check className={`h-5 w-5 flex-shrink-0 mt-0.5 ${plan.highlight ? "text-[#FFC857]" : "text-[#9DB5A5]"}`} />
                    <span className="text-[#2D2721]">{feature}</span>
                  </li>
                ))}
              </ul>
              <WarmButton className="w-full mt-auto" asChild>
                <Link href="/login">Get Started</Link>
              </WarmButton>
            </WarmCard>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-[#8B7355] mb-4">
            All plans include 2 months free trial • No credit card required • Cancel anytime
          </p>
          <div className="flex items-center justify-center gap-6 text-sm text-[#6B5744] flex-wrap">
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

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <WarmCard padding="none" className="overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2">
            <div className="p-8 lg:p-12 bg-gradient-to-br from-[#FFC857] to-[#FFB627]">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">Why Merchants Love GiftHub</h2>
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
                {benefits.map((benefit) => (
                  <div key={benefit} className="flex items-center gap-3">
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

      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-[#2D2721] mb-4">Frequently Asked Questions</h2>
          <p className="text-lg text-[#6B5744]">Everything you need to know about GiftHub</p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <WarmCard key={faq.question} padding="lg" hover>
              <button
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full flex items-start justify-between gap-4 text-left"
                aria-expanded={openFaq === idx}
                aria-controls={`faq-panel-${idx}`}
              >
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-[#2D2721] mb-2">{faq.question}</h3>
                  {openFaq === idx && (
                    <p id={`faq-panel-${idx}`} className="text-[#6B5744] leading-relaxed">
                      {faq.answer}
                    </p>
                  )}
                </div>
                <ChevronDown
                  className={`h-5 w-5 text-[#8B7355] transition-transform flex-shrink-0 ${
                    openFaq === idx ? "rotate-180" : ""
                  }`}
                />
              </button>
            </WarmCard>
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <WarmCard padding="none" className="overflow-hidden">
          <div className="relative bg-gradient-to-br from-[#2D2721] to-[#4D3F31] p-12 text-center">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-10 left-10 w-40 h-40 bg-[#FFC857] rounded-full blur-3xl" />
              <div className="absolute bottom-10 right-10 w-60 h-60 bg-[#9DB5A5] rounded-full blur-3xl" />
            </div>

            <div className="relative z-10">
              <PartyPopper className="h-16 w-16 text-[#FFC857] mx-auto mb-6" />
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Ready to Boost Your Sales?</h2>
              <p className="text-white/80 text-lg mb-8 max-w-2xl mx-auto">
                Start creating campaigns today and see the difference. No credit card required.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <WarmButton size="lg" asChild>
                  <Link href="/login">
                    Get Started Free
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </Link>
                </WarmButton>
                <WarmButton size="lg" variant="outline" className="bg-white/10 border-white/30 text-white hover:bg-white/20" asChild>
                  <Link href="/campaigns">Browse Campaigns</Link>
                </WarmButton>
              </div>
            </div>
          </div>
        </WarmCard>
      </section>
    </div>
  )
}
