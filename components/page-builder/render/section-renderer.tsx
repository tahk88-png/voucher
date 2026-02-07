import Link from "next/link"
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
  switch (id) {
    case "hero":
      return (
        <section className="py-16">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl sm:text-5xl font-bold text-[#2D2721]">
              {merchant.name}
            </h1>
            <p className="mt-4 text-lg text-[#6B5744]">
              Curated offers, rentals, and vouchers from {merchant.name}.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <WarmButton asChild>
                <Link href="/shop">Shop products</Link>
              </WarmButton>
              <WarmButton asChild variant="outline">
                <Link href="/rent">Browse rentals</Link>
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
              { icon: Gift, title: "Rewards", text: "Voucher incentives built-in." },
              { icon: Package, title: "Reliable stock", text: "Updated pricing and availability." },
              { icon: Calendar, title: "Flexible dates", text: "Plan rentals with ease." },
            ].map((item) => (
              <WarmCard key={item.title} padding="lg" className="bg-white">
                <item.icon className="h-6 w-6 text-[#E17B5C]" />
                <h3 className="mt-3 font-semibold text-[#2D2721]">{item.title}</h3>
                <p className="text-sm text-[#6B5744] mt-2">{item.text}</p>
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
              <h2 className="text-2xl font-bold text-[#2D2721]">Featured products</h2>
              <WarmButton asChild variant="ghost">
                <Link href="/shop">View all</Link>
              </WarmButton>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {products.length === 0 ? (
                <WarmCard padding="lg" className="col-span-full text-center">
                  <p className="text-[#6B5744]">No products yet.</p>
                </WarmCard>
              ) : (
                products.map((product) => (
                  <WarmCard key={product.id} padding="lg" className="bg-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-[#2D2721]">{product.name}</p>
                        <p className="text-sm text-[#6B5744] line-clamp-2">
                          {product.description || "Product highlight"}
                        </p>
                      </div>
                      <p className="text-lg font-bold text-[#2D2721]">
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
              <h2 className="text-2xl font-bold text-[#2D2721]">Rental packages</h2>
              <WarmButton asChild variant="ghost">
                <Link href="/rent">View all</Link>
              </WarmButton>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {rentals.length === 0 ? (
                <WarmCard padding="lg" className="col-span-full text-center">
                  <p className="text-[#6B5744]">No rentals yet.</p>
                </WarmCard>
              ) : (
                rentals.map((item) => (
                  <WarmCard key={item.id} padding="lg" className="bg-white">
                    <p className="font-semibold text-[#2D2721]">{item.name}</p>
                    <p className="text-sm text-[#6B5744] line-clamp-2">
                      {item.description || "Rental highlight"}
                    </p>
                    <p className="mt-3 text-[#2D2721] font-bold">
                      {formatCurrency(item.dailyRate, item.currency)} / day
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
            <h2 className="text-2xl font-bold text-[#2D2721] mb-6">Browse categories</h2>
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              {["Popular", "Business", "Events", "Seasonal", "Corporate", "Custom"].map((label) => (
                <WarmCard key={label} padding="lg" className="bg-white text-center">
                  <p className="font-semibold text-[#2D2721]">{label}</p>
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
            <WarmCard padding="lg" className="bg-white">
              <Calendar className="h-6 w-6 text-[#E17B5C] mx-auto" />
              <h3 className="mt-3 font-semibold text-[#2D2721]">Live availability</h3>
              <p className="text-sm text-[#6B5744] mt-2">
                Check availability and request a quote in minutes.
              </p>
              <WarmButton asChild className="mt-4">
                <Link href="/rent">See calendar</Link>
              </WarmButton>
            </WarmCard>
          </div>
        </section>
      )
    case "testimonials":
      return (
        <section className="py-12 bg-white/60">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-2xl font-bold text-[#2D2721] mb-6">What customers say</h2>
            <div className="grid gap-6 md:grid-cols-3">
              {["Smooth process", "Loved the voucher", "Great support"].map((quote) => (
                <WarmCard key={quote} padding="lg" className="bg-white">
                  <Star className="h-5 w-5 text-[#FFC857]" />
                  <p className="text-sm text-[#6B5744] mt-2">“{quote}”</p>
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
            <h2 className="text-2xl font-bold text-[#2D2721] mb-6">Gallery</h2>
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
            <h2 className="text-2xl font-bold text-[#2D2721] mb-6">Pricing</h2>
            <div className="grid gap-6 md:grid-cols-3">
              {["Starter", "Growth", "Enterprise"].map((tier) => (
                <WarmCard key={tier} padding="lg" className="bg-white">
                  <p className="font-semibold text-[#2D2721]">{tier}</p>
                  <p className="text-sm text-[#6B5744] mt-2">Custom pricing &amp; support</p>
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
            <WarmCard padding="lg" className="bg-white">
              <h3 className="text-lg font-semibold text-[#2D2721]">Rental terms</h3>
              <p className="text-sm text-[#6B5744] mt-2">
                Clear deposits, pickup rules, and return policy shared upfront.
              </p>
            </WarmCard>
          </div>
        </section>
      )
    case "faq":
      return (
        <section className="py-12 bg-white/60">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-[#2D2721] mb-6">FAQ</h2>
            <div className="space-y-3">
              {["How do I redeem?", "Can I reschedule?", "Do you offer support?"].map((q) => (
                <WarmCard key={q} padding="lg" className="bg-white">
                  <p className="font-semibold text-[#2D2721]">{q}</p>
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
            <WarmCard padding="lg" className="bg-white text-center">
              <h3 className="text-lg font-semibold text-[#2D2721]">Stay updated</h3>
              <p className="text-sm text-[#6B5744] mt-2">
                Get new offers and rental releases in your inbox.
              </p>
              <div className="mt-4 flex flex-col sm:flex-row gap-2">
                <label htmlFor="newsletter-email" className="sr-only">
                  Email address
                </label>
                <Input id="newsletter-email" type="email" placeholder="you@example.com" />
                <WarmButton>Subscribe</WarmButton>
              </div>
            </WarmCard>
          </div>
        </section>
      )
    case "contact":
      return (
        <section className="py-12">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <WarmCard padding="lg" className="bg-white">
              <h3 className="text-lg font-semibold text-[#2D2721]">Contact</h3>
              <p className="text-sm text-[#6B5744] mt-2">
                Email us at {merchant.supportEmail || "support@" + merchant.slug + ".com"}
              </p>
              {merchant.website ? (
                <p className="text-sm text-[#6B5744] mt-2">
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
            <WarmCard padding="lg" className="bg-white text-center">
              <MapPin className="h-6 w-6 text-[#E17B5C] mx-auto" />
              <p className="text-sm text-[#6B5744] mt-2">Pickup location shared after booking.</p>
            </WarmCard>
          </div>
        </section>
      )
    case "featured_vouchers":
      return (
        <section className="py-12">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-[#2D2721]">Active vouchers</h2>
              <WarmButton asChild variant="ghost">
                <Link href="/campaigns">See all</Link>
              </WarmButton>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {vouchers.length === 0 ? (
                <WarmCard padding="lg" className="col-span-full text-center">
                  <p className="text-[#6B5744]">No vouchers available.</p>
                </WarmCard>
              ) : (
                vouchers.map((voucher) => (
                  <WarmCard key={voucher.id} padding="lg" className="bg-white">
                    <p className="font-semibold text-[#2D2721]">Voucher</p>
                    <p className="text-sm text-[#6B5744] mt-2">
                      {formatCurrency(voucher.value, voucher.currency)}
                    </p>
                    <WarmButton asChild className="mt-3">
                      <Link href={`/v/${voucher.id}`}>View voucher</Link>
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
