import { prisma } from "@/lib/prisma"

export async function getCategoryBreakdown(merchantId: string) {
  const redemptions = await prisma.redemption.findMany({
    where: {
      merchantId,
      confirmedAt: { not: null },
    },
    include: {
      voucher: {
        select: {
          type: true,
        },
      },
    },
  })

  // Group by voucher type
  const categoryMap = new Map<string, number>()

  redemptions.forEach((redemption) => {
    const type = redemption.voucher?.type || "other"
    categoryMap.set(type, (categoryMap.get(type) || 0) + 1)
  })

  // Convert to chart format
  return Array.from(categoryMap.entries())
    .map(([type, count]) => ({
      name: type.charAt(0).toUpperCase() + type.slice(1),
      value: count,
    }))
    .sort((a, b) => b.value - a.value)
}
