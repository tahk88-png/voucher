"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { WarmCard } from "@/components/warm-card"
import { WarmButton } from "@/components/warm-button"
import { ScrollReveal } from "@/components/animations/scroll-reveal"
import { StaggerChildren, StaggerItem } from "@/components/animations/stagger-children"
import { CountUp } from "@/components/animations/count-up"
import { TiltCard } from "@/components/animations/tilt-card"
import { GradientText } from "@/components/animations/gradient-text"
import { ParallaxSection } from "@/components/animations/parallax-section"
import { LiveActivityFeed } from "@/components/landing/live-activity-feed"
import { MerchantLogoWall } from "@/components/landing/merchant-logo-wall"
import { TestimonialsCarousel } from "@/components/landing/testimonials-carousel"
import { BeforeAfterSlider } from "@/components/landing/before-after-slider"
import { PricingCalculator } from "@/components/landing/pricing-calculator"
import {
  ArrowRight,
  Check,
  ChevronDown,
  CreditCard,
  Gift,
  Heart,
  Home,
  Laptop,
  Leaf,
  Paintbrush,
  Plane,
  PartyPopper,
  QrCode,
  Shield,
  Shirt,
  Sparkles,
  Ticket,
  TrendingUp,
  UtensilsCrossed,
  Users,
  Zap
} from "lucide-react"

type LandingFeaturedOffer = {
  id: string
  name: string
  merchantName: string
  merchantLogoUrl: string | null
  categoryLabel: string
  marketLabel: string
  priceLabel: string
  purchases: number
  discountLabel: string | null
}

type MarketingLandingProps = {
  featuredOffers?: LandingFeaturedOffer[]
}

export default function MarketingLanding({ featuredOffers = [] }: MarketingLandingProps) {
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "annual">("monthly")

  const valueCards = [
    {
      icon: Users,
      title: "Referral Engine",
      description: "Your customers share deals and bring new customers automatically",
      color: "from-[var(--primary)] to-[var(--primary-hover)]",
      iconClass: "text-[var(--text)]",
    },
    {
      icon: Ticket,
      title: "Digital Vouchers",
      description: "Create discount campaigns with flexible rules in minutes",
      color: "from-[var(--success)] to-[#7FA090]",
      iconClass: "text-white",
    },
    {
      icon: QrCode,
      title: "QR Redemption",
      description: "Scan and validate in-store with just a phone. No hardware needed",
      color: "from-[var(--danger)] to-[#D16B4C]",
      iconClass: "text-white",
    },
    {
      icon: TrendingUp,
      title: "Real-time Analytics",
      description: "See exactly what each campaign costs and returns. No guesswork",
      color: "from-[#F5C98E] to-[#E5B97E]",
      iconClass: "text-[var(--text)]",
    },
  ]

  const howItWorks = [
    {
      step: 1,
      title: "Create a Campaign",
      description: "Set up a voucher in 2 minutes: discount, date range, max uses. Done.",
      icon: Sparkles,
    },
    {
      step: 2,
      title: "Customers Share It",
      description: "Every buyer gets a referral link. They share it, earn credit, bring friends.",
      icon: Users,
    },
    {
      step: 3,
      title: "Watch It Grow",
      description: "Track every referral chain, see your cost per new customer, measure ROI.",
      icon: TrendingUp,
    },
  ]

  const categories = [
    {
      name: "Food & Drink",
      icon: UtensilsCrossed,
      count: 234,
      color: "from-[var(--primary)] to-[var(--primary-hover)]",
      iconClass: "text-[var(--text)]",
      campaigns: ["20% off Pizza", "Lunch deal", "Weekend brunch"],
    },
    {
      name: "Fashion",
      icon: Shirt,
      count: 189,
      color: "from-[var(--danger)] to-[#D16B4C]",
      iconClass: "text-white",
      campaigns: ["Summer Sale 50%", "New arrivals", "Outlet specials"],
    },
    {
      name: "Beauty",
      icon: Paintbrush,
      count: 156,
      color: "from-[#F5C98E] to-[#E5B97E]",
      iconClass: "text-[var(--text)]",
      campaigns: ["Spa day deals", "Skincare bundles", "Salon packages"],
    },
    {
      name: "Tech",
      icon: Laptop,
      count: 142,
      color: "from-[var(--success)] to-[#7FA090]",
      iconClass: "text-white",
      campaigns: ["Tech sale", "Laptop upgrades", "Accessories week"],
    },
    {
      name: "Travel",
      icon: Plane,
      count: 198,
      color: "from-[var(--primary)] to-[var(--primary-hover)]",
      iconClass: "text-[var(--text)]",
      campaigns: ["City break offers", "Flight credits", "Hotel packages"],
    },
    {
      name: "Wellness",
      icon: Leaf,
      count: 123,
      color: "from-[var(--success)] to-[#7FA090]",
      iconClass: "text-white",
      campaigns: ["Yoga retreat", "Detox weekend", "Massage special"],
    },
    {
      name: "Events",
      icon: PartyPopper,
      count: 167,
      color: "from-[var(--danger)] to-[#D16B4C]",
      iconClass: "text-white",
      campaigns: ["Concert tickets", "Festival pass", "Family events"],
    },
    {
      name: "Home",
      icon: Home,
      count: 134,
      color: "from-[#F5C98E] to-[#E5B97E]",
      iconClass: "text-[var(--text)]",
      campaigns: ["Home essentials", "Furniture weekend", "Decor bundle"],
    },
  ]
  const visibleOffers = featuredOffers.slice(0, 12)
  const totalCategoryCampaigns = categories.reduce((sum, category) => sum + category.count, 0)

  const benefits = [
    "Built-in referral engine on every campaign",
    "Real-time analytics: cost per acquisition, ROI",
    "QR redemption — no POS hardware needed",
    "GDPR compliant, EU-hosted",
    "Multi-language (15 languages)",
    "Flat SaaS fee — not 50% like Groupon",
    "You own your customer data",
    "5% transaction fee, no hidden costs",
  ]

  const heroStats = [
    { label: "Active campaigns", value: "1,343+", icon: Sparkles, countTarget: 1343, prefix: "", suffix: "+" },
    { label: "European merchants", value: "2,500+", icon: Users, countTarget: 2500, prefix: "", suffix: "+" },
    { label: "Processed value", value: "EUR 12M+", icon: TrendingUp, countTarget: 12, prefix: "EUR ", suffix: "M+" },
  ]

  const faqs = [
    {
      question: "How is this different from Groupon?",
      answer:
        "Groupon takes 40-50% of your revenue and owns the customer relationship. We charge a flat monthly fee (from \u20ac19/mo) plus 5% on transactions. You keep your customers, your data, and your margins.",
    },
    {
      question: "How does the referral system work?",
      answer:
        "Every customer who buys a voucher gets a unique referral link. When they share it and a friend purchases, both earn credit. Each referral chain is tracked so you see exactly how new customers find you.",
    },
    {
      question: "What happens after the 14-day trial?",
      answer:
        "You choose a plan (Starter, Pro, or Scale). If you don\u2019t subscribe, your existing published vouchers stay active for customers, but you can\u2019t create new campaigns until you subscribe.",
    },
    {
      question: "Do I need special hardware for QR redemption?",
      answer:
        "No. Your staff opens the mobile scanner on any phone browser, scans the customer\u2019s QR code, and it\u2019s done. No app download, no POS integration required.",
    },
    {
      question: "What is the 5% transaction fee?",
      answer:
        "When a customer purchases a voucher through the platform, we deduct 5% from the payout. This covers payment processing and platform costs. There are no other hidden fees.",
    },
  ]

  return (
    <div className="relative overflow-x-hidden bg-gradient-to-br from-[var(--bg)] via-[var(--bg-2)] to-[#ece0cc]">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 left-10 w-72 h-72 bg-[var(--primary)] rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-[var(--success)] rounded-full blur-3xl" />
        </div>
        <div className="absolute inset-0 opacity-[0.07] [background-image:linear-gradient(to_right,#2d2721_1px,transparent_1px),linear-gradient(to_bottom,#2d2721_1px,transparent_1px)] [background-size:28px_28px]" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 lg:py-32">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm border border-[var(--border)] mb-6">
              <Sparkles className="h-4 w-4 text-[var(--primary)]" />
              <span className="text-sm font-medium text-[var(--text-muted)]">Voucher Platform for Local Businesses</span>
            </div>

            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-[var(--text)] mb-6 leading-[1.03]">
              Your Customers Sell
              <GradientText className="block text-4xl sm:text-6xl lg:text-7xl font-bold leading-[1.03]">
                Your Next Customers
              </GradientText>
            </h1>

            <p className="text-xl sm:text-2xl text-[var(--text-muted)] mb-10 leading-relaxed max-w-3xl mx-auto">
              Create voucher campaigns. Your customers share them, earn credits, and bring friends.
              Track every referral. See your exact cost per new customer.
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

            <div className="mt-10 flex items-center justify-center gap-8 text-sm text-[var(--text-faint)] flex-wrap">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-[var(--success)]" />
                No credit card required
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-[var(--success)]" />
                14-day free trial
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-[var(--success)]" />
                Cancel anytime
              </div>
            </div>

            <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-3xl mx-auto">
              {heroStats.map((item) => {
                const Icon = item.icon
                return (
                  <div
                    key={item.label}
                    className="rounded-2xl border border-[var(--border)] bg-white/75 backdrop-blur-sm px-4 py-3 text-left shadow-warm-sm"
                  >
                    <div className="flex items-center gap-2 text-[var(--text-muted)] text-xs font-semibold">
                      <span className="w-6 h-6 rounded-full bg-[var(--surface)] border border-[var(--border)] grid place-items-center">
                        <Icon className="h-3.5 w-3.5 text-[var(--text)]" />
                      </span>
                      {item.label}
                    </div>
                    <div className="mt-1 text-2xl font-bold text-[var(--text)]">
                      <CountUp target={item.countTarget} prefix={item.prefix} suffix={item.suffix} duration={2.5} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Merchant Logo Wall */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ScrollReveal>
          <p className="text-center text-sm font-semibold text-[var(--text-faint)] mb-2 uppercase tracking-wider">Trusted by businesses across Europe</p>
          <MerchantLogoWall />
        </ScrollReveal>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-14">
        <StaggerChildren className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
          {valueCards.map((card) => {
            const Icon = card.icon
            return (
              <StaggerItem key={card.title}>
              <TiltCard maxTilt={6}>
              <WarmCard
                hover
                padding="lg"
                className="cursor-pointer text-center rounded-[18px] border border-[var(--border)] bg-white/92"
              >
                <div
                  className={`w-11 h-11 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center mb-4 mx-auto shadow-warm ring-1 ring-white/30`}
                >
                  <Icon className={`h-5 w-5 stroke-[2.25] ${card.iconClass}`} />
                </div>
                <h3 className="text-[17px] font-bold text-[var(--text)] mb-2">{card.title}</h3>
                <p className="text-[13px] leading-relaxed text-[var(--text-muted)]">{card.description}</p>
              </WarmCard>
              </TiltCard>
              </StaggerItem>
            )
          })}
        </StaggerChildren>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <ScrollReveal>
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-[var(--text)] mb-4">How It Works</h2>
          <p className="text-lg text-[var(--text-muted)] max-w-2xl mx-auto">Get started in minutes with our simple three-step process</p>
        </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {howItWorks.map((step, idx) => {
            const Icon = step.icon
            return (
              <div key={step.step} className="relative">
                <WarmCard padding="lg" className="text-center h-full rounded-[18px] bg-white/92">
                  <div className="w-10 h-10 rounded-full gradient-brand flex items-center justify-center mx-auto mb-4 text-base font-bold text-white">
                    {step.step}
                  </div>
                  <span className="w-11 h-11 rounded-xl border border-[var(--border)] bg-[var(--surface)] flex items-center justify-center mx-auto mb-3">
                    <Icon className="h-5 w-5 text-[var(--accent)] stroke-[2.25]" />
                  </span>
                  <h3 className="text-xl font-semibold text-[var(--text)] mb-2">{step.title}</h3>
                  <p className="text-sm text-[var(--text-muted)]">{step.description}</p>
                </WarmCard>
                {idx < howItWorks.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 -translate-y-1/2">
                    <ArrowRight className="h-5 w-5 text-[var(--accent)]" />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <ScrollReveal>
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl font-bold text-[var(--text)] mb-4">Explore Popular Campaigns</h2>
          <p className="text-lg text-[var(--text-muted)]">Discover vouchers, deals, and experiences across Europe</p>
          {visibleOffers.length > 0 && (
            <p className="text-sm text-[var(--text-faint)] mt-2">
              Showing {visibleOffers.length} live offers from the marketplace feed.
            </p>
          )}
        </div>
        </ScrollReveal>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 mb-8">
          {categories.map((category) => (
            <WarmCard
              key={category.name}
              padding="sm"
              hover
              className="text-center cursor-pointer rounded-[14px] border border-[var(--border)] bg-white/92"
            >
              <div
                className={`w-10 h-10 rounded-full bg-gradient-to-br ${category.color} flex items-center justify-center mx-auto mb-2 ring-1 ring-white/35`}
              >
                <category.icon className={`h-[18px] w-[18px] stroke-[2.25] ${category.iconClass}`} />
              </div>
              <p className="text-xs font-semibold text-[var(--text)]">{category.name}</p>
              <p className="text-[11px] text-[var(--text-faint)] mt-1">{category.count} campaigns</p>
            </WarmCard>
          ))}
        </div>

        {visibleOffers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {visibleOffers.map((offer) => (
              <TiltCard key={offer.id} maxTilt={5}>
              <WarmCard hover padding="none" className="rounded-[16px] bg-white/95 overflow-hidden">
                <div className="relative h-28 bg-[#F6F0E4]">
                  {offer.merchantLogoUrl ? (
                    <Image
                      src={offer.merchantLogoUrl}
                      alt={offer.merchantName}
                      fill
                      sizes="(max-width: 768px) 100vw, 25vw"
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[var(--primary)] to-[#F5C98E]">
                      <Ticket className="h-8 w-8 text-white/85" />
                    </div>
                  )}
                  <span className="absolute top-3 left-3 rounded-full bg-white/90 backdrop-blur px-2.5 py-1 text-[10px] font-bold text-[var(--text)]">
                    {offer.categoryLabel}
                  </span>
                  {offer.discountLabel && (
                    <span className="absolute top-3 right-3 rounded-full bg-[var(--text)] px-2.5 py-1 text-[10px] font-bold text-white">
                      {offer.discountLabel}
                    </span>
                  )}
                </div>

                <div className="p-4 flex flex-col min-h-[200px]">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--primary)]">{offer.merchantName}</p>
                  <h3 className="text-base font-bold text-[var(--text)] mt-1 line-clamp-2">{offer.name}</h3>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="inline-flex rounded-full bg-[#FFF8E8] border border-[#F1E1C3] px-2.5 py-1 text-[10px] font-semibold text-[var(--text-muted)]">
                      Category: {offer.categoryLabel}
                    </span>
                    <span className="inline-flex rounded-full bg-[#EEF6F1] border border-[#D2E5DB] px-2.5 py-1 text-[10px] font-semibold text-[#47695B]">
                      Marketplace: {offer.marketLabel}
                    </span>
                  </div>

                  <div className="mt-auto pt-3 border-t border-[var(--border)] flex items-center justify-between gap-3">
                    <div>
                      <div className="text-base font-bold text-[var(--text)]">{offer.priceLabel}</div>
                      <div className="text-[11px] text-[var(--text-faint)]">{offer.purchases} purchases</div>
                    </div>
                    <WarmButton asChild size="sm" className="rounded-full px-4">
                      <Link href={`/campaigns/${offer.id}`}>
                        Open
                        <ArrowRight className="h-4 w-4 ml-1.5" />
                      </Link>
                    </WarmButton>
                  </div>
                </div>
              </WarmCard>
              </TiltCard>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {categories.slice(0, 8).map((category) => {
              const topCampaign = category.campaigns[0]
              return (
                <WarmCard key={category.name} hover padding="lg" className="rounded-[16px] bg-white/92">
                  <div
                    className={`w-10 h-10 rounded-full bg-gradient-to-br ${category.color} flex items-center justify-center mb-3 ring-1 ring-white/35`}
                  >
                    <category.icon className={`h-[18px] w-[18px] stroke-[2.25] ${category.iconClass}`} />
                  </div>
                  <p className="text-xs text-[var(--text-faint)] mb-1">{category.name}</p>
                  <h3 className="text-lg font-bold text-[var(--text)] mb-3">{topCampaign}</h3>
                  <div className="pt-3 border-t border-[var(--border)] flex items-center justify-between text-xs text-[var(--text-faint)]">
                    <span>{category.count} active</span>
                    <ArrowRight className="h-4 w-4 text-[var(--accent)]" />
                  </div>
                </WarmCard>
              )
            })}
          </div>
        )}

        <div className="text-center mt-8">
          <WarmButton size="md" asChild>
            <Link href="/campaigns">
              {visibleOffers.length > 0 ? "View All Live Campaigns" : `View All ${totalCategoryCampaigns} Campaigns`}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </WarmButton>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <ScrollReveal>
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-[var(--text)] mb-4">Simple, Transparent Pricing</h2>
          <p className="text-lg text-[var(--text-muted)] max-w-2xl mx-auto">
            Choose the plan that fits your business. Save 2 months with annual billing.
          </p>
        </div>
        </ScrollReveal>

        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 p-1 bg-[var(--surface)] rounded-[12px] shadow-warm border border-[var(--border)]">
            <button
              onClick={() => setBillingPeriod("monthly")}
              className={`px-6 py-2 rounded-[10px] text-sm font-semibold transition-all ${
                billingPeriod === "monthly"
                  ? "gradient-brand text-white shadow-warm"
                  : "text-[var(--text-faint)] hover:text-[var(--text)]"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingPeriod("annual")}
              className={`px-6 py-2 rounded-[10px] text-sm font-semibold transition-all relative ${
                billingPeriod === "annual"
                  ? "gradient-brand text-white shadow-warm"
                  : "text-[var(--text-faint)] hover:text-[var(--text)]"
              }`}
            >
              Annual
              <span className="absolute -top-2 right-0 px-1.5 py-0.5 text-[10px] rounded-full bg-[var(--success)] text-white font-bold">
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
              cta: "Start Free Trial",
              features: [
                "500 vouchers/month",
                "3 active campaigns",
                "2 team members",
                "QR code redemption",
                "Basic analytics",
              ],
              highlight: false,
            },
            {
              name: "Pro",
              monthly: "39",
              annual: "33",
              cta: "Start Free Trial",
              features: [
                "5,000 vouchers/month",
                "25 active campaigns",
                "10 team members",
                "Advanced analytics",
                "Custom domain",
                "Promo boosts (email + push)",
              ],
              highlight: true,
            },
            {
              name: "Scale",
              monthly: "99",
              annual: "83",
              cta: "Start Free Trial",
              features: [
                "Unlimited vouchers",
                "Unlimited campaigns",
                "Unlimited team members",
                "Everything in Pro",
                "Priority support",
                "White-label ready",
              ],
              highlight: false,
            },
          ].map((plan) => (
            <WarmCard
              key={plan.name}
              hover
              padding="xl"
              className={`relative h-full flex flex-col ${plan.highlight ? "border-2 border-[var(--primary)] shadow-warm-lg" : ""}`}
            >
              {plan.highlight && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                  <span className="px-4 py-1 gradient-brand text-white text-sm font-bold rounded-full shadow-warm">
                    Most Popular
                  </span>
                </div>
              )}
              <div className="mb-6 text-center pt-2">
                <h3 className="text-2xl font-bold text-[var(--text)] mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-2 mb-4 justify-center">
                  <span className="text-5xl font-bold text-[var(--text)]">
                    EUR {billingPeriod === "monthly" ? plan.monthly : plan.annual}
                  </span>
                  <span className="text-[var(--text-faint)]">/month</span>
                </div>
                {billingPeriod === "annual" && (
                  <div className="text-sm text-[var(--success)] font-semibold mb-4">
                    EUR {Number(plan.monthly) * 10}/year (save 2 months)
                  </div>
                )}
              </div>
              <ul className="space-y-3 mb-8 flex-grow">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <Check className={`h-5 w-5 flex-shrink-0 mt-0.5 ${plan.highlight ? "text-[var(--primary)]" : "text-[var(--success)]"}`} />
                    <span className="text-[var(--text)]">{feature}</span>
                  </li>
                ))}
              </ul>
              <WarmButton className="w-full mt-auto" asChild>
                <Link href="/login">{plan.cta}</Link>
              </WarmButton>
            </WarmCard>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-[var(--text-faint)] mb-4">
            All plans include 14-day free trial | 5% transaction fee on sales | Cancel anytime
          </p>
          <div className="flex items-center justify-center gap-6 text-sm text-[var(--text-muted)] flex-wrap">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-[var(--success)]" />
              <span>GDPR Compliant</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-[var(--primary)]" />
              <span>Instant Setup</span>
            </div>
            <div className="flex items-center gap-2">
              <Heart className="h-4 w-4 text-[var(--danger)]" />
              <span>99.9% Uptime</span>
            </div>
          </div>
        </div>

        {/* Interactive ROI Calculator */}
        <ScrollReveal delay={0.1}>
          <div className="mt-16 max-w-5xl mx-auto">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-[var(--text)] mb-2">Calculate Your ROI</h3>
              <p className="text-[var(--text-muted)]">Drag the sliders to see how much you could earn with Vouchr</p>
            </div>
            <WarmCard padding="xl" className="rounded-[20px]">
              <PricingCalculator />
            </WarmCard>
          </div>
        </ScrollReveal>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <WarmCard padding="none" className="overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2">
            <div className="p-8 lg:p-12 gradient-brand">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">Why Merchants Love GiftHub</h2>
              <p className="text-white/90 text-lg mb-8">
                Join thousands of European businesses using our platform to grow their customer base and increase revenue.
              </p>
              <div className="flex items-center gap-8 mb-8">
                <div>
                  <div className="text-4xl font-bold text-white mb-1"><CountUp target={2500} suffix="+" duration={2.5} /></div>
                  <div className="text-white/80 text-sm">Active Merchants</div>
                </div>
                <div>
                  <div className="text-4xl font-bold text-white mb-1"><CountUp target={12} prefix="EUR " suffix="M+" duration={2.5} /></div>
                  <div className="text-white/80 text-sm">Processed</div>
                </div>
                <div>
                  <div className="text-4xl font-bold text-white mb-1"><CountUp target={98} suffix="%" duration={2.5} /></div>
                  <div className="text-white/80 text-sm">Satisfaction</div>
                </div>
              </div>
            </div>
            <div className="p-8 lg:p-12 bg-[var(--surface)]">
              <div className="space-y-4">
                {benefits.map((benefit) => (
                  <div key={benefit} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[var(--success)] to-[#7FA090] flex items-center justify-center flex-shrink-0">
                      <Check className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-[var(--text)] font-medium">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </WarmCard>
      </section>

      {/* Testimonials */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <ScrollReveal>
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-bold text-[var(--text)] mb-4">What Our Merchants Say</h2>
            <p className="text-lg text-[var(--text-muted)]">Real results from real businesses</p>
          </div>
        </ScrollReveal>
        <ScrollReveal delay={0.2}>
          <TestimonialsCarousel />
        </ScrollReveal>
      </section>

      {/* Before / After */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <ScrollReveal>
          <div className="text-center mb-8">
            <h2 className="text-3xl sm:text-4xl font-bold text-[var(--text)] mb-4">Groupon vs Vouchr</h2>
            <p className="text-lg text-[var(--text-muted)]">Drag to compare</p>
          </div>
        </ScrollReveal>
        <ScrollReveal delay={0.15}>
          <BeforeAfterSlider
            beforeTitle="With Groupon"
            afterTitle="With Vouchr"
            beforeItems={[
              "40-50% revenue taken by platform",
              "Platform owns customer relationship",
              "No access to customer data",
              "Race to the bottom pricing",
              "Lost brand identity",
            ]}
            afterItems={[
              "Flat EUR 19-99/mo + 5% fee",
              "You own all customer data",
              "Built-in referral engine",
              "Your brand, your rules",
              "Real-time ROI analytics",
            ]}
          />
        </ScrollReveal>
      </section>

      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <ScrollReveal>
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-[var(--text)] mb-4">Frequently Asked Questions</h2>
          <p className="text-lg text-[var(--text-muted)]">Everything you need to know about GiftHub</p>
        </div>
        </ScrollReveal>

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
                  <h3 className="text-lg font-semibold text-[var(--text)] mb-2">{faq.question}</h3>
                  {openFaq === idx && (
                    <p id={`faq-panel-${idx}`} className="text-[var(--text-muted)] leading-relaxed">
                      {faq.answer}
                    </p>
                  )}
                </div>
                <ChevronDown
                  className={`h-5 w-5 text-[var(--text-faint)] transition-transform flex-shrink-0 ${
                    openFaq === idx ? "rotate-180" : ""
                  }`}
                />
              </button>
            </WarmCard>
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-20">
        <WarmCard padding="none" className="overflow-hidden">
          <div className="relative bg-gradient-to-br from-[var(--text)] to-[#4D3F31] p-12 text-center">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-10 left-10 w-40 h-40 bg-[var(--primary)] rounded-full blur-3xl" />
              <div className="absolute bottom-10 right-10 w-60 h-60 bg-[var(--success)] rounded-full blur-3xl" />
            </div>

            <div className="relative z-10">
              <PartyPopper className="h-16 w-16 text-[var(--primary)] mx-auto mb-6" />
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Stop Renting Customers. Build Your Own Army.</h2>
              <p className="text-white/80 text-lg mb-8 max-w-2xl mx-auto">
                Create your first campaign in 2 minutes. Your customers do the rest. 14-day free trial.
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

      {/* Live Activity Feed — social proof toasts */}
      <LiveActivityFeed />
    </div>
  )
}
