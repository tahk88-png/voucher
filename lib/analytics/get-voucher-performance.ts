import { prisma } from "@/lib/prisma"
import { safeParseJson } from "@/lib/utils"

export async function getVoucherPerformance(merchantId: string) {
  const vouchers = await prisma.voucher.findMany({
    where: { merchantId },
    include: {
      redemptions: {
        where: {
          confirmedAt: { not: null },
        },
        select: {
          discountApplied: true,
        },
      },
    },
    orderBy: {
      redemptions: {
        _count: "desc",
      },
    },
    take: 10,
  })

  return vouchers.map((voucher) => {
    const design = safeParseJson<{ headline?: string }>(voucher.designJson)
    const name = design?.headline || voucher.codePrefix || "Unnamed"
    const redemptions = voucher.redemptions.length
    const revenue = voucher.redemptions.reduce(
      (sum, r) => sum + (r.discountApplied || 0),
      0
    ) / 100

    return {
      name: name.length > 20 ? name.substring(0, 20) + "..." : name,
      redemptions,
      revenue: parseFloat(revenue.toFixed(2)),
    }
  })
}
