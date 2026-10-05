import { safeParseJson } from "@/lib/utils"
import { redirect } from "next/navigation"
import { getTranslations } from "next-intl/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import VoucherDetailClient from "./voucher-detail-client"

const VOUCHER_TYPES = ["percentage", "fixed_amount", "credit_amount"]

export default async function VoucherDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/login")
  }

  const voucher = await prisma.voucher.findUnique({
    where: { id },
    include: { merchant: true },
  })

  if (!voucher) {
    redirect("/app")
  }

  const tVoucher = await getTranslations("voucher")
  const tLabels = await getTranslations("labels")
  const voucherTypeLabel = (type: string) =>
    VOUCHER_TYPES.includes(type.toLowerCase()) ? tLabels(`voucherType.${type.toLowerCase()}`) : type

  const now = new Date()
  const isExpired = voucher.validTo < now || voucher.status === "ended"
  const status: "active" | "redeemed" | "expired" = isExpired ? "expired" : "active"

  const code = `${voucher.codePrefix || "V"}-${voucher.id.slice(0, 8).toUpperCase()}`

  return (
    <VoucherDetailClient
      voucher={{
        id: voucher.id,
        title:
          safeParseJson<{ headline?: string }>(voucher.designJson)?.headline ||
          (voucher.type ? voucherTypeLabel(voucher.type) : "") ||
          tVoucher("title"),
        description: safeParseJson<{ description?: string }>(voucher.designJson)?.description || null,
        expiryDate: voucher.validTo.toISOString(),
        status,
        code,
        merchantName: voucher.merchant?.name || null,
        merchantLogoUrl: voucher.merchant?.brandLogoUrl || null,
      }}
    />
  )
}
