import { prisma } from "@/lib/prisma"

export async function getTenantProducts(merchantId: string) {
  return prisma.product.findMany({
    where: { merchantId, status: "active" },
    orderBy: { createdAt: "desc" },
    take: 8,
  })
}

export async function getTenantRentals(merchantId: string) {
  return prisma.rentalItem.findMany({
    where: { merchantId, status: "active" },
    orderBy: { createdAt: "desc" },
    take: 8,
  })
}

export async function getTenantVouchers(merchantId: string) {
  const now = new Date()
  return prisma.voucher.findMany({
    where: {
      merchantId,
      status: "published",
      validFrom: { lte: now },
      validTo: { gte: now },
    },
    orderBy: { createdAt: "desc" },
    take: 6,
  })
}

export async function getTenantStats(merchantId: string) {
  const [campaigns, vouchers, rentals, products] = await Promise.all([
    prisma.campaign.count({ where: { merchantId, status: "active" } }),
    prisma.voucher.count({ where: { merchantId, status: "published" } }),
    prisma.rentalItem.count({ where: { merchantId, status: "active" } }),
    prisma.product.count({ where: { merchantId, status: "active" } }),
  ])

  return { campaigns, vouchers, rentals, products }
}
