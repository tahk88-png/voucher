import {
  Baby,
  Coffee,
  Dumbbell,
  Gift,
  Mountain,
  Palette,
  PartyPopper,
  Plane,
  Sparkles,
  type LucideIcon,
} from "lucide-react"
import { getCampaignCategoryId } from "@/lib/campaign-categories"
import { isDemoMerchantSlug } from "@/lib/demo-content"
import { formatCurrency, formatPercentage, safeParseJson } from "@/lib/utils"

/**
 * How a campaign is shown on cards and detail pages: one place for the
 * category artwork, demo labelling and price/discount wording, shared by the
 * landing page, /campaigns and merchant pages.
 */

export type CategoryVisual = {
  icon: LucideIcon
  /** CSS gradient for cover areas without a merchant image. */
  gradient: string
}

const CATEGORY_VISUALS: Record<string, CategoryVisual> = {
  cafe: { icon: Coffee, gradient: "linear-gradient(135deg, #7a4a2e 0%, #c98b55 55%, #ecc58f 100%)" },
  beauty: { icon: Sparkles, gradient: "linear-gradient(135deg, #9c4f5d 0%, #d88e8f 55%, #f3c7b4 100%)" },
  fitness: { icon: Dumbbell, gradient: "linear-gradient(135deg, #2f5f4b 0%, #5f9479 55%, #b3d3b0 100%)" },
  events: { icon: PartyPopper, gradient: "linear-gradient(135deg, #4b3d7a 0%, #8a71b8 55%, #d2bde8 100%)" },
  workshops: { icon: Palette, gradient: "linear-gradient(135deg, #7a5a1f 0%, #c39a3f 55%, #ecd28a 100%)" },
  family: { icon: Baby, gradient: "linear-gradient(135deg, #a4492b 0%, #dd8a52 55%, #f6cf96 100%)" },
  travel: { icon: Plane, gradient: "linear-gradient(135deg, #24566e 0%, #4f8fac 55%, #a9d3e3 100%)" },
  outdoor: { icon: Mountain, gradient: "linear-gradient(135deg, #3d5a2a 0%, #7c9a4a 55%, #c8d995 100%)" },
}

const FALLBACK_VISUAL: CategoryVisual = {
  icon: Gift,
  gradient: "linear-gradient(135deg, #8f4a32 0%, #c27a55 55%, #f2c99a 100%)",
}

export function getCategoryVisual(categoryId: string): CategoryVisual {
  return CATEGORY_VISUALS[categoryId] ?? FALLBACK_VISUAL
}

// Demo records carry their label in the data ("NÄIDIS · …", "… (näidis)") so
// it shows wherever they appear. Where the UI renders a visible "Demo" badge
// instead, the text label is dropped to keep titles readable.
const DEMO_TITLE_PREFIX = /^NÄIDIS\s*[·:-]\s*/i
const DEMO_NAME_SUFFIX = /\s*\(näidis\)\s*$/i

/** Title/name without its demo marker. Only strips when the merchant is a demo merchant. */
export function stripDemoMarker(text: string, isDemo: boolean): string {
  if (!isDemo) return text
  return text.replace(DEMO_TITLE_PREFIX, "").replace(DEMO_NAME_SUFFIX, "").trim() || text
}

export type CampaignCardData = {
  id: string
  href: string
  title: string
  merchantName: string
  merchantSlug: string
  merchantCity: string | null
  imageUrl: string | null
  isDemo: boolean
  categoryId: string
  /**
   * Cover badge for paid offers, e.g. "−20%"; null when there is no discount
   * or the offer is free (its value is then the price line itself).
   */
  discountLabel: string | null
  /** "20%" or "€5.00"; null without a discount rule. */
  discountValue: string | null
  /** Formatted price; null for free offers. Turn into text with campaignPriceText(). */
  price: string | null
  isFree: boolean
  onSale: boolean
  purchases: number
}

export type CampaignCardSource = {
  id: string
  name: string
  description: string | null
  price: number | null
  discountRules: unknown
  merchant: {
    name: string
    slug: string
    city?: string | null
    defaultCurrency: string
    brandLogoUrl: string | null
  }
  _count: { purchases: number; vouchers: number }
}

/** "20%" or "€5.00"; null when the campaign has no usable discount rule. */
export function formatDiscountValue(discountRules: unknown, currency: string): string | null {
  const rules = safeParseJson<{ type?: string; value?: number; currency?: string }>(discountRules)
  if (!rules || typeof rules.value !== "number" || rules.value <= 0) return null
  if (rules.type === "percentage") return formatPercentage(rules.value)
  return formatCurrency(rules.value, rules.currency || currency)
}

export function toCampaignCardData(campaign: CampaignCardSource): CampaignCardData {
  const isDemo = isDemoMerchantSlug(campaign.merchant.slug)
  const categoryId = getCampaignCategoryId({ name: campaign.name, description: campaign.description })
  const isFree = !campaign.price || campaign.price <= 0
  const discount = formatDiscountValue(campaign.discountRules, campaign.merchant.defaultCurrency)
  return {
    id: campaign.id,
    href: `/campaigns/${campaign.id}`,
    title: stripDemoMarker(campaign.name, isDemo),
    merchantName: stripDemoMarker(campaign.merchant.name, isDemo),
    merchantSlug: campaign.merchant.slug,
    merchantCity: campaign.merchant.city ?? null,
    imageUrl: campaign.merchant.brandLogoUrl,
    isDemo,
    categoryId,
    // "Free" next to a "−50%" badge reads as a contradiction, so a free
    // offer's discount becomes its price line instead (campaignPriceText).
    discountLabel: !isFree && discount ? `−${discount}` : null,
    discountValue: discount,
    price: isFree ? null : formatCurrency(campaign.price!, campaign.merchant.defaultCurrency),
    isFree,
    onSale: campaign._count.vouchers > 0,
    purchases: campaign._count.purchases,
  }
}

/** Translator for the "labels" namespace, from useTranslations or getTranslations. */
type LabelsT = (key: "free" | "valueOff", values?: Record<string, string>) => string

/** Price line: the price, or for a free offer its discount ("20% off") or "Free". */
export function campaignPriceText(card: Pick<CampaignCardData, "price" | "discountValue">, t: LabelsT): string {
  if (card.price) return card.price
  return card.discountValue ? t("valueOff", { value: card.discountValue }) : t("free")
}
