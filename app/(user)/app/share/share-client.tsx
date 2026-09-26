"use client"

import Link from "next/link"
import { useLocale, useTranslations } from "next-intl"
import { Gift, Share2 } from "lucide-react"
import { WarmCard } from "@/components/warm-card"
import { WarmButton } from "@/components/warm-button"
import { getCurrencyLocale } from "@/lib/i18n-utils"
import { CopyField } from "../_components/copy-field"

interface ShareRow {
  id: string
  merchantName: string
  voucherTitle: string
  createdAt: string
  status: string
  /** Public, tracked link for this referral (/r/<id>). */
  link: string
}

const KNOWN_STATUSES = ["created", "opened", "redeemed", "expired", "blocked"]
const SHAREABLE_STATUSES = new Set(["created", "opened"])

export default function ShareClient({ offersLink, shares }: { offersLink: string; shares: ShareRow[] }) {
  const locale = useLocale()
  const tShare = useTranslations("share")
  const tReferral = useTranslations("referral")
  const tDashboard = useTranslations("dashboard")

  const statusLabel = (status: string) =>
    KNOWN_STATUSES.includes(status) ? tDashboard(`referralStatus.${status}` as never) : status

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[#2D2721]">{tShare("shareAndEarnTitle")}</h1>
        <p className="text-sm text-[#6B5744]">{tShare("shareAndEarnDescription")}</p>
      </div>

      <WarmCard padding="lg" className="bg-white">
        <div className="flex items-center gap-2">
          <Gift className="h-5 w-5 text-[#E17B5C]" aria-hidden="true" />
          <h2 className="text-lg font-semibold text-[#2D2721]">{tShare("howRewardsWorkTitle")}</h2>
        </div>
        <div className="space-y-2 text-sm text-[#6B5744] mt-3">
          <p>{tShare("howRewardsWorkLine1")}</p>
          <p>{tShare("howRewardsWorkLine2")}</p>
        </div>
        <WarmButton asChild size="sm" className="mt-4">
          <Link href="/campaigns">{tReferral("findVoucher")}</Link>
        </WarmButton>
      </WarmCard>

      <div>
        <h2 className="text-lg font-semibold text-[#2D2721] mb-4">{tShare("recentSharesTitle")}</h2>
        <div className="space-y-3">
          {shares.length > 0 ? (
            shares.map((share) => (
              <WarmCard key={share.id} padding="lg" className="bg-white space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-[#2D2721]">{share.voucherTitle}</p>
                    <p className="text-sm text-[#6B5744] mt-1">{share.merchantName}</p>
                    <p className="text-xs text-[#8B7355] mt-2">
                      {new Date(share.createdAt).toLocaleDateString(getCurrencyLocale(locale), {
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                  <span
                    className={
                      share.status === "redeemed"
                        ? "shrink-0 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-[#9DB5A5]/20 text-[#2D2721]"
                        : "shrink-0 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-[#FFF9ED] text-[#8B7355]"
                    }
                  >
                    {statusLabel(share.status)}
                  </span>
                </div>
                {SHAREABLE_STATUSES.has(share.status) && (
                  <CopyField value={share.link} label={tReferral("linkForVoucher", { voucher: share.voucherTitle })} />
                )}
              </WarmCard>
            ))
          ) : (
            <WarmCard padding="lg" className="bg-white">
              <div className="py-10 text-center">
                <Share2 className="h-12 w-12 mx-auto text-[#8B7355] mb-4" aria-hidden="true" />
                <h3 className="text-lg font-semibold text-[#2D2721] mb-2">{tShare("noSharesTitle")}</h3>
                <p className="text-sm text-[#6B5744] mb-4">{tShare("noSharesDescription")}</p>
                <WarmButton asChild variant="outline">
                  <Link href="/campaigns">{tShare("viewVouchers")}</Link>
                </WarmButton>
              </div>
            </WarmCard>
          )}
        </div>
      </div>

      <WarmCard padding="lg" className="bg-white">
        <h2 className="text-lg font-semibold text-[#2D2721]">{tShare("offersLinkTitle")}</h2>
        <p className="text-sm text-[#6B5744] mt-1 mb-4">{tShare("offersLinkDescription")}</p>
        <CopyField value={offersLink} label={tShare("offersLinkTitle")} />
      </WarmCard>
    </div>
  )
}
