"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { VoucherCard } from "@/components/ui/voucher-card"
import { WarmButton } from "@/components/warm-button"
import { WarmCard } from "@/components/warm-card"
import { ArrowLeft } from "lucide-react"

interface VoucherDetailProps {
  voucher: {
    id: string
    title: string
    description?: string | null
    expiryDate: string
    status: "active" | "redeemed" | "expired"
    code: string
    merchantName?: string | null
    merchantLogoUrl?: string | null
  }
}

export default function VoucherDetailClient({ voucher }: VoucherDetailProps) {
  const router = useRouter()
  const t = useTranslations("account")

  return (
    <div className="min-h-screen bg-[#FAF7F2]">
      <div className="max-w-4xl mx-auto py-8 px-4">
        <WarmButton asChild variant="ghost" size="sm" className="mb-6">
          <Link href="/app">
            <span className="inline-flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              {t("voucherDetail.back")}
            </span>
          </Link>
        </WarmButton>

        <div className="space-y-6">
          <VoucherCard
            merchantName={voucher.merchantName || t("voucherDetail.merchantFallback")}
            merchantLogoUrl={voucher.merchantLogoUrl || undefined}
            title={voucher.title}
            description={voucher.description || undefined}
            expiryDate={voucher.expiryDate}
            status={voucher.status}
            code={voucher.code}
            onPrimaryAction={() => {
              router.push(`/app/redeem/${voucher.id}`)
            }}
          />

          <WarmCard padding="lg" className="bg-white">
            <h2 className="text-lg font-semibold text-[#2D2721] mb-3">{t("voucherDetail.termsTitle")}</h2>
            <div className="space-y-3 text-sm text-[#6B5744]">
              <p>{t("voucherDetail.terms1")}</p>
              <p>{t("voucherDetail.terms2")}</p>
              <p>{t("voucherDetail.terms3")}</p>
              <p>{t("voucherDetail.terms4")}</p>
            </div>
          </WarmCard>
        </div>
      </div>
    </div>
  )
}
