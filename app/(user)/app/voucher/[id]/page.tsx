import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import VoucherDetailClient from "./voucher-detail-client"

export default async function VoucherDetailPage({ params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/login")
  }

  const voucher = await prisma.voucher.findUnique({
    where: { id: params.id },
    include: { merchant: true },
  })

  if (!voucher) {
    redirect("/app")
  }

  const now = new Date()
  const isExpired = voucher.validTo < now || voucher.status === "ended"
  const status: "active" | "redeemed" | "expired" = isExpired ? "expired" : "active"

  const code = `${voucher.codePrefix || "V"}-${voucher.id.slice(0, 8).toUpperCase()}`

  return (
    <VoucherDetailClient
      voucher={{
        id: voucher.id,
        title:
          (voucher.designJson as { headline?: string } | null)?.headline ||
          voucher.type ||
          "Voucher",
        description: (voucher.designJson as { description?: string } | null)?.description || null,
        expiryDate: voucher.validTo.toISOString(),
        status,
        code,
        merchantName: voucher.merchant?.name || null,
        merchantLogoUrl: voucher.merchant?.brandLogoUrl || null,
      }}
    />
  )
}
