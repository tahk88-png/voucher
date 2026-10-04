import Image from "next/image"
import Link from "next/link"
import { ArrowRight, MapPin } from "lucide-react"
import { getCategoryVisual, type CampaignCardData } from "@/lib/campaign-presentation"
import { cn } from "@/lib/utils"

/** Cover artwork for a campaign: the merchant's image, or its category's gradient and icon. */
export function CampaignCover({
  categoryId,
  imageUrl,
  alt,
  className,
  iconClassName = "h-12 w-12",
  sizes = "(max-width: 768px) 100vw, 400px",
  children,
}: {
  categoryId: string
  imageUrl: string | null
  alt: string
  className?: string
  iconClassName?: string
  sizes?: string
  children?: React.ReactNode
}) {
  const visual = getCategoryVisual(categoryId)
  const Icon = visual.icon
  return (
    <div className={cn("relative overflow-hidden", className)} style={imageUrl ? undefined : { background: visual.gradient }}>
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt={alt}
          fill
          sizes={sizes}
          className="object-cover transition-transform duration-700 group-hover:scale-105"
          unoptimized
        />
      ) : (
        <>
          {/* Soft light and a large faint icon give each category its own look. */}
          <div
            aria-hidden="true"
            className="absolute inset-0 opacity-60"
            style={{ background: "radial-gradient(circle at 20% 15%, rgba(255,255,255,0.35), transparent 55%)" }}
          />
          <Icon
            aria-hidden="true"
            className="absolute -right-6 -bottom-8 h-40 w-40 rotate-[-12deg] text-white/15 stroke-[1.25]"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="grid place-items-center rounded-2xl bg-white/20 p-4 ring-1 ring-white/30 backdrop-blur-sm transition-transform duration-500 group-hover:scale-110">
              <Icon aria-hidden="true" className={cn("text-white stroke-[1.75]", iconClassName)} />
            </span>
          </div>
        </>
      )}
      {children}
    </div>
  )
}

export function DemoBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full bg-[var(--text)] px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white",
        className
      )}
      title="Sample content to show how the platform works. Not a real offer."
    >
      Demo
    </span>
  )
}

/** Status line under the price: honest about whether the offer can be bought. */
function statusLine(campaign: CampaignCardData): { text: string; tone: "muted" | "success" } | null {
  if (campaign.isDemo) return { text: "Sample offer · not for sale", tone: "muted" }
  if (!campaign.onSale) return { text: "Not on sale yet", tone: "muted" }
  if (campaign.purchases > 0) {
    return {
      text: `${campaign.purchases} ${campaign.purchases === 1 ? "purchase" : "purchases"}`,
      tone: "success",
    }
  }
  return { text: campaign.isFree ? "Free to claim" : "On sale now", tone: "success" }
}

export function CampaignCard({
  campaign,
  headingLevel = "h3",
  className,
}: {
  campaign: CampaignCardData
  headingLevel?: "h2" | "h3"
  className?: string
}) {
  const Heading = headingLevel
  const status = statusLine(campaign)
  return (
    <article
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-[18px] border border-[var(--border)] bg-[var(--surface)] shadow-warm-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-warm focus-within:ring-2 focus-within:ring-[var(--ring)]",
        className
      )}
    >
      <CampaignCover
        categoryId={campaign.categoryId}
        imageUrl={campaign.imageUrl}
        alt={campaign.merchantName}
        className="h-36 sm:h-40"
      >
        <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-bold text-[#2d2721] shadow-sm backdrop-blur">
          {campaign.categoryLabel}
        </span>
        {campaign.discountLabel && (
          <span className="absolute right-3 top-3 rounded-full bg-[#2d2721] px-3 py-1 text-sm font-bold text-white shadow-md">
            {campaign.discountLabel}
          </span>
        )}
        {campaign.isDemo && <DemoBadge className="absolute bottom-3 left-3 shadow-sm" />}
      </CampaignCover>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <p className="flex min-w-0 items-center gap-1.5 text-xs font-semibold text-[var(--text-muted)]">
          <span className="truncate font-bold uppercase tracking-wide text-[var(--primary)]">{campaign.merchantName}</span>
          {campaign.merchantCity && (
            <span className="inline-flex shrink-0 items-center gap-0.5">
              <MapPin className="h-3 w-3" aria-hidden="true" />
              {campaign.merchantCity}
            </span>
          )}
        </p>
        <Heading className="mt-1.5 text-lg font-bold leading-snug text-[var(--text)] line-clamp-2 transition-colors group-hover:text-[var(--primary)]">
          {/* The whole card is the link (stretched ::after); its accessible name is the title. */}
          <Link href={campaign.href} className="focus:outline-none after:absolute after:inset-0 after:content-['']">
            {campaign.title}
          </Link>
        </Heading>

        <div className="mt-auto pt-4">
        <div className="flex items-end justify-between gap-3 border-t border-[var(--border)] pt-4">
          <div className="min-w-0">
            <div className="text-xl font-bold text-[var(--text)]">{campaign.priceLabel}</div>
            {status && (
              <div
                className={cn(
                  "text-xs font-semibold",
                  status.tone === "success" ? "text-[var(--success)]" : "text-[var(--text-muted)]"
                )}
              >
                {status.text}
              </div>
            )}
          </div>
          <span
            aria-hidden="true"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] shadow-md transition-transform duration-300 group-hover:translate-x-0.5"
          >
            <ArrowRight className="h-4 w-4" />
          </span>
        </div>
        </div>
      </div>
    </article>
  )
}
