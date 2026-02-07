export type PageBuilderType = "store" | "rental"

export interface PageBuilderConfig {
  id?: string
  type: PageBuilderType
  title: string
  subtitle?: string
  status: "draft" | "published"
  sections: string[]
  addons: string[]
  theme?: {
    primary?: string
    secondary?: string
    background?: string
    style?: "warm" | "clean" | "bold"
  }
}

export const PAGE_SECTION_CATALOG: Array<{
  id: string
  label: string
  description: string
  types: PageBuilderType[]
}> = [
  {
    id: "hero",
    label: "Hero + CTA",
    description: "Above-the-fold headline with primary action.",
    types: ["store", "rental"],
  },
  {
    id: "value_props",
    label: "Value props",
    description: "Quick benefits and guarantees.",
    types: ["store", "rental"],
  },
  {
    id: "featured_products",
    label: "Featured products",
    description: "Top products with pricing and tags.",
    types: ["store"],
  },
  {
    id: "featured_vouchers",
    label: "Featured vouchers",
    description: "Active voucher cards for promotions.",
    types: ["store", "rental"],
  },
  {
    id: "rental_packages",
    label: "Rental packages",
    description: "Rental bundles and day-based pricing.",
    types: ["rental"],
  },
  {
    id: "categories",
    label: "Categories grid",
    description: "Browse by type, use, or audience.",
    types: ["store", "rental"],
  },
  {
    id: "availability",
    label: "Availability calendar",
    description: "Live availability and booking slots.",
    types: ["rental"],
  },
  {
    id: "testimonials",
    label: "Testimonials",
    description: "Customer quotes and star ratings.",
    types: ["store", "rental"],
  },
  {
    id: "gallery",
    label: "Gallery",
    description: "Lifestyle imagery or use cases.",
    types: ["store", "rental"],
  },
  {
    id: "pricing",
    label: "Pricing table",
    description: "Transparent pricing tiers.",
    types: ["store", "rental"],
  },
  {
    id: "rental_terms",
    label: "Rental terms",
    description: "Deposit, insurance, and return policy.",
    types: ["rental"],
  },
  {
    id: "faq",
    label: "FAQ",
    description: "Answer common objections.",
    types: ["store", "rental"],
  },
  {
    id: "newsletter",
    label: "Newsletter opt-in",
    description: "Collect emails for campaigns.",
    types: ["store", "rental"],
  },
  {
    id: "contact",
    label: "Contact block",
    description: "Chat, email, or phone support.",
    types: ["store", "rental"],
  },
  {
    id: "map",
    label: "Location map",
    description: "Pickup point or store location.",
    types: ["store", "rental"],
  },
]

export const PAGE_ADDON_CATALOG: Array<{
  id: string
  label: string
  description: string
}> = [
  {
    id: "promo_bar",
    label: "Promo bar",
    description: "Sticky top bar for offers and alerts.",
  },
  {
    id: "sticky_cta",
    label: "Sticky CTA",
    description: "Persistent action button on scroll.",
  },
  {
    id: "chat_widget",
    label: "Chat widget",
    description: "Live chat or WhatsApp integration.",
  },
  {
    id: "trust_badges",
    label: "Trust badges",
    description: "Payment, safety, or quality badges.",
  },
  {
    id: "social_proof",
    label: "Social proof popup",
    description: "Recent activity and purchases.",
  },
  {
    id: "countdown",
    label: "Countdown timer",
    description: "Urgency for limited offers.",
  },
  {
    id: "reviews_widget",
    label: "Reviews widget",
    description: "Embed Google or Trustpilot.",
  },
  {
    id: "language_switch",
    label: "Language switcher",
    description: "Quick locale toggle on page.",
  },
  {
    id: "analytics",
    label: "Analytics snippets",
    description: "Pixel slots for tracking.",
  },
  {
    id: "cookie_banner",
    label: "Cookie banner",
    description: "GDPR consent banner.",
  },
]

export function getDefaultBuilderConfig(type: PageBuilderType): PageBuilderConfig {
  if (type === "rental") {
    return {
      type,
      status: "draft",
      title: "Rental collection",
      subtitle: "Flexible rentals with clear pricing and availability.",
      sections: [
        "hero",
        "value_props",
        "rental_packages",
        "featured_vouchers",
        "availability",
        "testimonials",
        "rental_terms",
        "faq",
        "contact",
      ],
      addons: ["promo_bar", "sticky_cta", "chat_widget", "trust_badges"],
      theme: { style: "warm" },
    }
  }

  return {
    type,
    status: "draft",
    title: "Storefront",
    subtitle: "Highlight your best products and campaigns.",
    sections: [
      "hero",
      "value_props",
      "featured_products",
      "featured_vouchers",
      "categories",
      "testimonials",
      "pricing",
      "faq",
      "newsletter",
    ],
    addons: ["promo_bar", "sticky_cta", "trust_badges", "social_proof"],
    theme: { style: "warm" },
  }
}
