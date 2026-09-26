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
import { MerchantLogoWall } from "@/components/landing/merchant-logo-wall"
import { BeforeAfterSlider } from "@/components/landing/before-after-slider"
import { PricingCalculator } from "@/components/landing/pricing-calculator"
import { formatWholeCurrency } from "@/components/landing/format-price"
import { campaignCategories } from "@/lib/campaign-categories"
import { PLAN_CATALOG, PLATFORM_FEE_PERCENT, TRIAL_DAYS } from "@/lib/access-control/monetization"
import {
  ArrowRight,
  Baby,
  Check,
  ChevronDown,
  Coffee,
  Dumbbell,
  Gift,
  Mountain,
  Palette,
  Plane,
  PartyPopper,
  QrCode,
  Sparkles,
  Ticket,
  TrendingUp,
  Users,
  type LucideIcon,
} from "lucide-react"

/** Number of UI languages (one messages/<locale>.json per language). */
const SUPPORTED_LANGUAGE_COUNT = 25

const eur = (cents: number) => formatWholeCurrency(cents, "EUR")
const starterMonthly = eur(PLAN_CATALOG.starter.monthlyPriceCents)
const scaleMonthly = eur(PLAN_CATALOG.scale.monthlyPriceCents)

// Browse tiles: the same categories (ids + labels) the /campaigns filter uses.
const CATEGORY_TILE_STYLE: Record<string, { icon: LucideIcon; color: string; iconClass: string }> = {
  cafe: { icon: Coffee, color: "from-[var(--primary)] to-[var(--primary-hover)]", iconClass: "text-white" },
  beauty: { icon: Sparkles, color: "from-[#F5C98E] to-[#E5B97E]", iconClass: "text-[var(--text)]" },
  fitness: { icon: Dumbbell, color: "from-[var(--success)] to-[#2f5f3a]", iconClass: "text-white" },
  events: { icon: PartyPopper, color: "from-[var(--danger)] to-[#a33b29]", iconClass: "text-white" },
  workshops: { icon: Palette, color: "from-[#F5C98E] to-[#E5B97E]", iconClass: "text-[var(--text)]" },
  family: { icon: Baby, color: "from-[var(--primary)] to-[var(--primary-hover)]", iconClass: "text-white" },
  travel: { icon: Plane, color: "from-[var(--success)] to-[#2f5f3a]", iconClass: "text-white" },
  outdoor: { icon: Mountain, color: "from-[var(--danger)] to-[#a33b29]", iconClass: "text-white" },
}

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
  /** False when the campaign has no published voucher, so nothing can be bought yet. */
  onSale?: boolean
}

type LandingStats = {
  merchantCount: number
  activeCampaignCount: number
  /** Total value of paid voucher purchases, in minor units. */
  processedCents: number
}

type MarketingLandingProps = {
  featuredOffers?: LandingFeaturedOffer[]
  /** Real platform figures; null when the database is unreachable. */
  stats?: LandingStats | null
  /** Names of real active merchants for the "trusted by" row. */
  trustedMerchants?: string[]
}

export default function MarketingLanding({
  featuredOffers = [],
  stats = null,
  trustedMerchants = [],
}: MarketingLandingProps) {
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "annual">("monthly")

  const valueCards = [
    {
      icon: Users,
      title: "Referral Engine",
      description: "Your customers share deals and bring new customers automatically",
      color: "from-[var(--primary)] to-[var(--primary-hover)]",
      iconClass: "text-white",
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

  // Browse tiles only. They used to carry invented per-category counts
  // ("234 campaigns") and sample deal names that were rendered as if live;
  // nothing here may claim a number the database did not produce.
  const categories = campaignCategories.map((category) => ({
    id: category.id,
    name: category.label,
    ...(CATEGORY_TILE_STYLE[category.id] ?? CATEGORY_TILE_STYLE.cafe),
  }))
  const visibleOffers = featuredOffers.slice(0, 12)

  const onSaleCount = visibleOffers.filter((offer) => offer.onSale !== false).length

  const benefits = [
    "Built-in referral engine on every campaign",
    "Real-time analytics: cost per acquisition, ROI",
    "QR redemption — no POS hardware needed",
    `Available in ${SUPPORTED_LANGUAGE_COUNT} languages`,
    "Flat monthly plan — not a revenue share like Groupon",
    "You own your customer data",
    `${PLATFORM_FEE_PERCENT}% transaction fee on voucher sales, no hidden costs`,
  ]

  // Real figures from the database. Previously these were invented marketing
  // numbers ("2,500+ European merchants", "EUR 12M+ processed") that matched
  // nothing in the system — the row is now hidden entirely until there is
  // something true to report, rather than shipping fabricated traction.
  const processedEur = stats ? Math.floor(stats.processedCents / 100) : 0
  // A zero ("Processed value €0") is not a trust signal; only non-zero figures show.
  const heroStats = (stats
    ? [
        {
          label: "Active campaigns",
          icon: Sparkles,
          countTarget: stats.activeCampaignCount,
          prefix: "",
          suffix: "",
        },
        {
          label: "Merchants",
          icon: Users,
          countTarget: stats.merchantCount,
          prefix: "",
          suffix: "",
        },
        {
          label: "Processed value",
          icon: TrendingUp,
          countTarget: processedEur,
          prefix: "€",
          suffix: "",
        },
      ]
    : []
  ).filter((item) => item.countTarget > 0)

  const faqs = [
    {
      question: "How is this different from Groupon?",
      answer:
        `Groupon-style deal sites typically keep a large share of each sale and own the customer relationship. We charge a flat monthly fee (from ${starterMonthly}/mo) plus ${PLATFORM_FEE_PERCENT}% on voucher sales. You keep your customers, your data, and your margins.`,
    },
    {
      question: "How does the referral system work?",
      answer:
        "Every customer who buys a voucher gets a unique referral link. When they share it and a friend purchases, both earn credit. Each referral chain is tracked so you see exactly how new customers find you.",
    },
    {
      question: `What happens after the ${TRIAL_DAYS}-day trial?`,
      answer:
        "You choose a plan (Starter, Pro, or Scale). If you don\u2019t subscribe, your existing published vouchers stay active for customers, but you can\u2019t create new campaigns until you subscribe.",
    },
    {
      question: "Do I need special hardware for QR redemption?",
      answer:
        "No. Your staff opens the mobile scanner on any phone browser, scans the customer\u2019s QR code, and it\u2019s done. No app download, no POS integration required.",
    },
    {
      question: `What is the ${PLATFORM_FEE_PERCENT}% transaction fee?`,
      answer:
        `When a customer purchases a voucher through the platform, we deduct ${PLATFORM_FEE_PERCENT}% from the payout. There are no other platform fees on top of your plan.`,
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
              <span className="text-sm font-medium text-[var(--text-muted)]">Vouchers &amp; referrals for local businesses</span>
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
                <Link href="/register">
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

            <div className="mt-10 flex items-center justify-center gap-x-8 gap-y-2 text-sm text-[var(--text-muted)] flex-wrap">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-[var(--success)]" />
                No credit card required
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-[var(--success)]" />
                {TRIAL_DAYS}-day free trial
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-[var(--success)]" />
                Cancel anytime
              </div>
            </div>

            <div
              className={`mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-3xl mx-auto${heroStats.length === 0 ? ' hidden' : ''}`}
              data-testid="hero-stats"
            >
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

      {/* Merchant Logo Wall — real merchants only. Hidden until there are
          enough of them to read as a trust signal rather than a placeholder. */}
      {trustedMerchants.length >= 3 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ScrollReveal>
            <p className="text-center text-sm font-semibold text-[var(--text-muted)] mb-2 uppercase tracking-wider">
              Merchants on the platform
            </p>
            <MerchantLogoWall merchants={trustedMerchants} />
          </ScrollReveal>
        </section>
      )}

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
                className="text-center rounded-[18px] border border-[var(--border)] bg-white/92"
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
                    <Icon className="h-5 w-5 text-[var(--primary)] stroke-[2.25]" aria-hidden="true" />
                  </span>
                  <h3 className="text-xl font-semibold text-[var(--text)] mb-2">{step.title}</h3>
                  <p className="text-sm text-[var(--text-muted)]">{step.description}</p>
                </WarmCard>
                {idx < howItWorks.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 -translate-y-1/2">
                    <ArrowRight className="h-5 w-5 text-[var(--primary)]" aria-hidden="true" />
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
            <p className="text-sm text-[var(--text-muted)] mt-2">
              Showing {visibleOffers.length} active {visibleOffers.length === 1 ? "campaign" : "campaigns"}
              {onSaleCount < visibleOffers.length ? ` \u2014 ${onSaleCount} on sale now` : ""}.
            </p>
          )}
        </div>
        </ScrollReveal>

        <ul className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 mb-8">
          {categories.map((category) => (
            <li key={category.id}>
              <Link
                href={`/campaigns?category=${category.id}`}
                className="block h-full rounded-[14px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
              >
                <WarmCard
                  hover
                  padding="sm"
                  className="h-full text-center rounded-[14px] border border-[var(--border)] bg-white/92"
                >
                  <div
                    className={`w-10 h-10 rounded-full bg-gradient-to-br ${category.color} flex items-center justify-center mx-auto mb-2 ring-1 ring-white/35`}
                  >
                    <category.icon className={`h-[18px] w-[18px] stroke-[2.25] ${category.iconClass}`} aria-hidden="true" />
                  </div>
                  <p className="text-xs font-semibold text-[var(--text)]">{category.name}</p>
                </WarmCard>
              </Link>
            </li>
          ))}
        </ul>

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
                  {offer.discountLabel && offer.priceLabel !== "FREE" && (
                    <span className="absolute top-3 right-3 rounded-full bg-[var(--text)] px-2.5 py-1 text-[10px] font-bold text-white">
                      {offer.discountLabel}
                    </span>
                  )}
                </div>

                <div className="p-4 flex flex-col min-h-[200px]">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--primary)]">{offer.merchantName}</p>
                  <h3 className="text-base font-bold text-[var(--text)] mt-1 line-clamp-2">{offer.name}</h3>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="inline-flex rounded-full bg-[#EEF6F1] border border-[#D2E5DB] px-2.5 py-1 text-[10px] font-semibold text-[#47695B]">
                      Marketplace: {offer.marketLabel}
                    </span>
                  </div>

                  <div className="mt-auto pt-3 border-t border-[var(--border)] flex items-center justify-between gap-3">
                    <div>
                      <div className="text-base font-bold text-[var(--text)]">{offer.priceLabel}</div>
                      {offer.onSale === false ? (
                        <div className="text-[11px] text-[var(--text-muted)]">Not on sale yet</div>
                      ) : offer.purchases > 0 ? (
                        <div className="text-[11px] text-[var(--text-muted)]">
                          {offer.purchases} {offer.purchases === 1 ? "purchase" : "purchases"}
                        </div>
                      ) : null}
                    </div>
                    <WarmButton asChild size="sm" className="rounded-full px-4">
                      <Link href={`/campaigns/${offer.id}`} aria-label={`Open ${offer.name}`}>
                        Open
                        <ArrowRight className="h-4 w-4 ml-1.5" aria-hidden="true" />
                      </Link>
                    </WarmButton>
                  </div>
                </div>
              </WarmCard>
              </TiltCard>
            ))}
          </div>
        ) : (
          // No live offers: a fresh deployment, or the database is unreachable.
          // This used to fill the space with eight invented deals and "N active"
          // counts, which contradicted the real stats above.
          <WarmCard padding="lg" className="rounded-[16px] bg-white/92 text-center max-w-xl mx-auto">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[var(--primary)] to-[#F5C98E] flex items-center justify-center mx-auto mb-3 ring-1 ring-white/35">
              <Ticket className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-lg font-bold text-[var(--text)] mb-1">No live campaigns right now</h3>
            <p className="text-sm text-[var(--text-muted)]">
              Offers appear here as soon as merchants publish them.
            </p>
          </WarmCard>
        )}

        <div className="text-center mt-8">
          <WarmButton size="md" asChild>
            <Link href="/campaigns">
              View All Campaigns
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
            Choose the plan that fits your business. Annual billing costs 10 months&rsquo; worth.
          </p>
        </div>
        </ScrollReveal>

        <div className="text-center mb-8">
          <div
            role="group"
            aria-label="Billing period"
            className="inline-flex items-center gap-2 p-1 bg-[var(--surface)] rounded-[12px] shadow-warm border border-[var(--border)]"
          >
            <button
              type="button"
              aria-pressed={billingPeriod === "monthly"}
              onClick={() => setBillingPeriod("monthly")}
              className={`px-6 py-2 rounded-[10px] text-sm font-semibold transition-all ${
                billingPeriod === "monthly"
                  ? "gradient-brand text-white shadow-warm"
                  : "text-[var(--text-muted)] hover:text-[var(--text)]"
              }`}
            >
              Monthly
            </button>
            <button
              type="button"
              aria-pressed={billingPeriod === "annual"}
              onClick={() => setBillingPeriod("annual")}
              className={`inline-flex items-center gap-2 px-4 sm:px-6 py-2 rounded-[10px] text-sm font-semibold transition-all ${
                billingPeriod === "annual"
                  ? "gradient-brand text-white shadow-warm"
                  : "text-[var(--text-muted)] hover:text-[var(--text)]"
              }`}
            >
              Annual
              {/* Inline, not absolutely positioned: it used to overlap the label. */}
              <span className="px-1.5 py-0.5 text-[10px] leading-none rounded-full bg-[var(--success)] text-white font-bold">
                Save 17%
              </span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto items-start">
          {[
            {
              plan: PLAN_CATALOG.starter,
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
              plan: PLAN_CATALOG.pro,
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
              plan: PLAN_CATALOG.scale,
              features: [
                "Unlimited vouchers",
                "Unlimited campaigns",
                "Unlimited team members",
                "Everything in Pro",
              ],
              highlight: false,
            },
          ].map(({ plan, features, highlight }) => (
            <WarmCard
              key={plan.id}
              hover
              padding="xl"
              className={`relative h-full flex flex-col ${highlight ? "border-2 border-[var(--primary)] shadow-warm-lg" : ""}`}
            >
              {highlight && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                  <span className="px-4 py-1 gradient-brand text-white text-sm font-bold rounded-full shadow-warm">
                    Most Popular
                  </span>
                </div>
              )}
              <div className="mb-6 text-center pt-2">
                <h3 className="text-2xl font-bold text-[var(--text)] mb-2">{plan.label}</h3>
                <div className="flex flex-wrap items-baseline gap-x-2 mb-4 justify-center">
                  <span className="text-4xl sm:text-5xl font-bold text-[var(--text)]">
                    {billingPeriod === "monthly"
                      ? eur(plan.monthlyPriceCents)
                      : eur(Math.round(plan.yearlyPriceCents / 12))}
                  </span>
                  <span className="text-[var(--text-muted)]">/month</span>
                </div>
                {billingPeriod === "annual" && (
                  <div className="text-sm text-[var(--success)] font-semibold mb-4">
                    {eur(plan.yearlyPriceCents)}/year (2 months free)
                  </div>
                )}
              </div>
              <ul className="space-y-3 mb-8 flex-grow">
                {features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <Check aria-hidden="true" className={`h-5 w-5 flex-shrink-0 mt-0.5 ${highlight ? "text-[var(--primary)]" : "text-[var(--success)]"}`} />
                    <span className="text-[var(--text)]">{feature}</span>
                  </li>
                ))}
              </ul>
              <WarmButton className="w-full mt-auto" asChild>
                <Link href="/register">Start free trial</Link>
              </WarmButton>
            </WarmCard>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-[var(--text-muted)]">
            All plans include a {TRIAL_DAYS}-day free trial · {PLATFORM_FEE_PERCENT}% transaction fee on voucher sales · Cancel anytime
          </p>
        </div>

        {/* Interactive ROI Calculator */}
        <ScrollReveal delay={0.1}>
          <div className="mt-16 max-w-5xl mx-auto">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-[var(--text)] mb-2">Calculate Your ROI</h3>
              <p className="text-[var(--text-muted)]">Drag the sliders to see how much you could earn with GiftHub</p>
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
                Grow your customer base and increase revenue — while keeping your margins and owning your
                customer relationships.
              </p>
              {/* Real figures only. This block previously showed invented
                  traction (2,500+ merchants, EUR 12M+ processed, 98%
                  satisfaction — a metric the product does not even collect). */}
              {heroStats.length > 0 && (
                <dl className="grid grid-cols-1 min-[400px]:grid-cols-3 gap-6 mb-8">
                  {heroStats.map((item) => (
                    <div key={item.label} className="min-w-0 flex flex-col">
                      <dt className="text-white/90 text-sm">{item.label}</dt>
                      <dd className="order-first text-3xl sm:text-4xl font-bold text-white mb-1 break-words">
                        <CountUp target={item.countTarget} prefix={item.prefix} duration={2.5} />
                      </dd>
                    </div>
                  ))}
                </dl>
              )}
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

      {/* Testimonials — intentionally not rendered.
          The carousel shipped invented quotes attributed to named businesses
          ("Owner, Tallinn Spa & Wellness") that are not customers. Publishing
          fabricated testimonials is deceptive and, in the EU/UK, unlawful
          advertising. Restore this section only with real, attributable
          quotes the merchants have consented to. */}

      {/* Before / After */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <ScrollReveal>
          <div className="text-center mb-8">
            <h2 className="text-3xl sm:text-4xl font-bold text-[var(--text)] mb-4">Groupon vs GiftHub</h2>
            <p className="text-lg text-[var(--text-muted)] hidden sm:block">Drag to compare</p>
          </div>
        </ScrollReveal>
        <ScrollReveal delay={0.15}>
          <BeforeAfterSlider
            beforeTitle="With Groupon"
            afterTitle="With GiftHub"
            beforeItems={[
              "Large revenue share taken by the platform",
              "Platform owns customer relationship",
              "No access to customer data",
              "Race to the bottom pricing",
              "Lost brand identity",
            ]}
            afterItems={[
              `Flat ${starterMonthly}\u2013${scaleMonthly}/mo + ${PLATFORM_FEE_PERCENT}% fee`,
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
                Create your first campaign in minutes. Your customers do the rest. {TRIAL_DAYS}-day free trial.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <WarmButton size="lg" asChild>
                  <Link href="/register">
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

      {/* Live activity toasts — intentionally not rendered.
          They cycled through invented purchases ("Maria K. from Tallinn
          purchased Spa Weekend Pass, 2 min ago") presented as live activity,
          which is fake social proof and unlawful advertising in the EU/UK.
          Restore only if fed from real, anonymised purchase events. */}
    </div>
  )
}
