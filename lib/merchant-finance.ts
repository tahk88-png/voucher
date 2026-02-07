import { prisma } from "@/lib/prisma"

export async function getMerchantRevenueSummary(merchantId: string) {
  const [voucherPaid, ticketPaid, voucherPending, ticketPending] = await Promise.all([
    prisma.voucherPurchase.aggregate({
      where: { merchantId, status: "paid" },
      _sum: { amount: true },
    }),
    prisma.ticketPurchase.aggregate({
      where: { merchantId, status: "paid" },
      _sum: { amount: true },
    }),
    prisma.voucherPurchase.aggregate({
      where: { merchantId, status: "pending" },
      _sum: { amount: true },
    }),
    prisma.ticketPurchase.aggregate({
      where: { merchantId, status: "pending" },
      _sum: { amount: true },
    }),
  ])

  const paidTotal = (voucherPaid._sum.amount ?? 0) + (ticketPaid._sum.amount ?? 0)
  const pendingTotal = (voucherPending._sum.amount ?? 0) + (ticketPending._sum.amount ?? 0)

  return { paidTotal, pendingTotal }
}
