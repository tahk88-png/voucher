import Link from "next/link"
import { useTranslations } from "next-intl"
import { WarmButton } from "@/components/warm-button"
import { WarmCard } from "@/components/warm-card"
import { Input } from "@/components/ui/input"
import { Gift, Package, Calendar, Star, MapPin } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import type { Product, RentalItem, Voucher } from "@prisma/client"

interface SectionRendererProps {
  id: string
  merchant: {
    name: string
    slug: string
    defaultCurrency: string
    website: string | null
    supportEmail: string | null
  }
  products?: Product[]
  rentals?: RentalItem[]
  vouchers?: Voucher[]
}

export default function SectionRenderer({
  id,
  merchant,
  products = [],
  rentals = [],
  vouchers = [],
}: SectionRendererProps) {
  // Only fixed UI chrome and default placeholder copy is translated here;
  // merchant-entered content (names, descriptions) is rendered as-is.
  const t = useTranslations("pageBuilder.renderer")
  switch (id) {
    case "hero":
      return (
        <section className="py-16">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl sm:text-5xl font-bold text-[var(--text)]">
              {merchant.name}
            </h1>
            <p className="mt-4 text-lg text-[var(--text-muted)]">
              {t("hero.subtitle", { name: merchant.name })}
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <WarmButton asChild>
                <Link href="/shop">{t("hero.shopProducts")}</Link>
              </WarmButton>
              <WarmButton asChild variant="outline">
                <Link href="/rent">{t("hero.browseRentals")}</Link>
              </WarmButton>
            </div>
          </div>
        </section>
      )
    case "value_props":
      return (
        <section className="py-12 bg-white/60">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid gap-6 md:grid-cols-3">
            {[
              { key: "rewards", icon: Gift, title: t("valueProps.rewardsTitle"), text: t("valueProps.rewardsText") },
              { key: "stock", icon: Package, title: t("valueProps.stockTitle"), text: t("valueProps.stockText") },
              { key: "dates", icon: Calendar, title: t("valueProps.datesTitle"), text: t("valueProps.datesText") },
            ].map((item) => (
              <WarmCard key={item.key} padding="lg" className="bg-[var(--surface)]">
                <item.icon className="h-6 w-6 text-[var(--danger)]" />
                <h3 className="mt-3 font-semibold text-[var(--text)]">{item.title}</h3>
                <p className="text-sm text-[var(--text-muted)] mt-2">{item.text}</p>
              </WarmCard>
            ))}
          </div>
        </section>
      )
    case "featured_products":
      return (
        <section className="py-12">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-[var(--text)]">{t("products.title")}</h2>
              <WarmButton asChild variant="ghost">
                <Link href="/shop">{t("viewAll")}</Link>
              </WarmButton>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {products.length === 0 ? (
                <WarmCard padding="lg" className="col-span-full text-center">
                  <p className="text-[var(--text-muted)]">{t("products.empty")}</p>
                </WarmCard>
              ) : (
                products.map((product) => (
                  <WarmCard key={product.id} padding="lg" className="bg-[var(--surface)]">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-[var(--text)]">{product.name}</p>
                        <p className="text-sm text-[var(--text-muted)] line-clamp-2">
                          {product.description || t("products.fallbackDescription")}
                        </p>
                      </div>
                      <p className="text-lg font-bold text-[var(--text)]">
                        {formatCurrency(product.price, product.currency || merchant.defaultCurrency)}
                      </p>
                    </div>
                  </WarmCard>
                ))
              )}
            </div>
          </div>
        </section>
      )
    case "rental_packages":
      return (
        <section className="py-12">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-[var(--text)]">{t("rentals.title")}</h2>
              <WarmButton asChild variant="ghost">
                <Link href="/rent">{t("viewAll")}</Link>
              </WarmButton>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {rentals.length === 0 ? (
                <WarmCard padding="lg" className="col-span-full text-center">
                  <p className="text-[var(--text-muted)]">{t("rentals.empty")}</p>
                </WarmCard>
              ) : (
                rentals.map((item) => (
                  <WarmCard key={item.id} padding="lg" className="bg-[var(--surface)]">
                    <p className="font-semibold text-[var(--text)]">{item.name}</p>
                    <p className="text-sm text-[var(--text-muted)] line-clamp-2">
                      {item.description || t("rentals.fallbackDescription")}
                    </p>
                    <p className="mt-3 text-[var(--text)] font-bold">
                      {t("rentals.perDay", { price: formatCurrency(item.dailyRate, item.currency) })}
                    </p>
                  </WarmCard>
                ))
              )}
            </div>
          </div>
        </section>
      )
    case "categories":
      return (
        <section className="py-12 bg-white/60">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-[var(--text)] mb-6">{t("categories.title")}</h2>
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              {(["popular", "business", "events", "seasonal", "corporate", "custom"] as const).map((key) => (
                <WarmCard key={key} padding="lg" className="bg-[var(--surface)] text-center">
                  <p className="font-semibold text-[var(--text)]">{t(`categories.${key}`)}</p>
                </WarmCard>
              ))}
            </div>
          </div>
        </section>
      )
    case "availability":
      return (
        <section className="py-12">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <WarmCard padding="lg" className="bg-[var(--surface)]">
              <Calendar className="h-6 w-6 text-[var(--danger)] mx-auto" />
              <h3 className="mt-3 font-semibold text-[var(--text)]">{t("availability.title")}</h3>
              <p className="text-sm text-[var(--text-muted)] mt-2">
                {t("availability.text")}
              </p>
              <WarmButton asChild className="mt-4">
                <Link href="/rent">{t("availability.seeCalendar")}</Link>
              </WarmButton>
            </WarmCard>
          </div>
        </section>
      )
    case "testimonials":
      return (
        <section className="py-12 bg-white/60">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-2xl font-bold text-[var(--text)] mb-6">{t("testimonials.title")}</h2>
            <div className="grid gap-6 md:grid-cols-3">
              {(["smooth", "lovedVoucher", "support"] as const).map((key) => (
                <WarmCard key={key} padding="lg" className="bg-[var(--surface)]">
                  <Star className="h-5 w-5 text-[var(--primary)]" />
                  <p className="text-sm text-[var(--text-muted)] mt-2">&ldquo;{t(`testimonials.${key}`)}&rdquo;</p>
                </WarmCard>
              ))}
            </div>
          </div>
        </section>
      )
    case "gallery":
      return (
        <section className="py-12">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-[var(--text)] mb-6">{t("gallery.title")}</h2>
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="h-36 rounded-2xl bg-[#FFE5B4]/60" />
              ))}
            </div>
          </div>
        </section>
      )
    case "pricing":
      return (
        <section className="py-12 bg-white/60">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-2xl font-bold text-[var(--text)] mb-6">{t("pricing.title")}</h2>
            <div className="grid gap-6 md:grid-cols-3">
              {(["starter", "growth", "enterprise"] as const).map((tier) => (
                <WarmCard key={tier} padding="lg" className="bg-[var(--surface)]">
                  <p className="font-semibold text-[var(--text)]">{t(`pricing.${tier}`)}</p>
                  <p className="text-sm text-[var(--text-muted)] mt-2">{t("pricing.tierText")}</p>
                </WarmCard>
              ))}
            </div>
          </div>
        </section>
      )
    case "rental_terms":
      return (
        <section className="py-12">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <WarmCard padding="lg" className="bg-[var(--surface)]">
              <h3 className="text-lg font-semibold text-[var(--text)]">{t("rentalTerms.title")}</h3>
              <p className="text-sm text-[var(--text-muted)] mt-2">
                {t("rentalTerms.text")}
              </p>
            </WarmCard>
          </div>
        </section>
      )
    case "faq":
      return (
        <section className="py-12 bg-white/60">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-[var(--text)] mb-6">{t("faq.title")}</h2>
            <div className="space-y-3">
              {(["redeem", "reschedule", "support"] as const).map((q) => (
                <WarmCard key={q} padding="lg" className="bg-[var(--surface)]">
                  <p className="font-semibold text-[var(--text)]">{t(`faq.${q}`)}</p>
                </WarmCard>
              ))}
            </div>
          </div>
        </section>
      )
    case "newsletter":
      return (
        <section className="py-12">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <WarmCard padding="lg" className="bg-[var(--surface)] text-center">
              <h3 className="text-lg font-semibold text-[var(--text)]">{t("newsletter.title")}</h3>
              <p className="text-sm text-[var(--text-muted)] mt-2">
                {t("newsletter.text")}
              </p>
              <div className="mt-4 flex flex-col sm:flex-row gap-2">
                <label htmlFor="newsletter-email" className="sr-only">
                  {t("newsletter.emailLabel")}
                </label>
                <Input id="newsletter-email" type="email" placeholder="you@example.com" />
                <WarmButton>{t("newsletter.subscribe")}</WarmButton>
              </div>
            </WarmCard>
          </div>
        </section>
      )
    case "contact":
      return (
        <section className="py-12">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <WarmCard padding="lg" className="bg-[var(--surface)]">
              <h3 className="text-lg font-semibold text-[var(--text)]">{t("contact.title")}</h3>
              <p className="text-sm text-[var(--text-muted)] mt-2">
                {t("contact.emailUs", {
                  email: merchant.supportEmail || "support@" + merchant.slug + ".com",
                })}
              </p>
              {merchant.website ? (
                <p className="text-sm text-[var(--text-muted)] mt-2">
                  <MapPin className="inline h-4 w-4" /> {merchant.website}
                </p>
              ) : null}
            </WarmCard>
          </div>
        </section>
      )
    case "map":
      return (
        <section className="py-12 bg-white/60">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <WarmCard padding="lg" className="bg-[var(--surface)] text-center">
              <MapPin className="h-6 w-6 text-[var(--danger)] mx-auto" />
              <p className="text-sm text-[var(--text-muted)] mt-2">{t("map.text")}</p>
            </WarmCard>
          </div>
        </section>
      )
    case "featured_vouchers":
      return (
        <section className="py-12">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-[var(--text)]">{t("vouchers.title")}</h2>
              <WarmButton asChild variant="ghost">
                <Link href="/campaigns">{t("seeAll")}</Link>
              </WarmButton>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {vouchers.length === 0 ? (
                <WarmCard padding="lg" className="col-span-full text-center">
                  <p className="text-[var(--text-muted)]">{t("vouchers.empty")}</p>
                </WarmCard>
              ) : (
                vouchers.map((voucher) => (
                  <WarmCard key={voucher.id} padding="lg" className="bg-[var(--surface)]">
                    <p className="font-semibold text-[var(--text)]">{t("vouchers.voucher")}</p>
                    <p className="text-sm text-[var(--text-muted)] mt-2">
                      {formatCurrency(voucher.value, voucher.currency)}
                    </p>
                    <WarmButton asChild className="mt-3">
                      <Link href={`/v/${voucher.id}`}>{t("vouchers.view")}</Link>
                    </WarmButton>
                  </WarmCard>
                ))
              )}
            </div>
          </div>
        </section>
      )
    default:
      return null
  }
}
