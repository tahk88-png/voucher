import { prisma } from "@/lib/prisma"
import { hashToken } from "@/lib/b2b/crypto"
import { recordAuditEvent } from "@/lib/b2b/audit"
import { Prisma } from "@prisma/client"

export type VoucherValidationResult = {
  valid: boolean
  reason?: string
  voucherId?: string
  valuePreview?: {
    type: "fixed" | "percent"
    amount: number
    currency: string
    remaining?: number | null
  }
  restrictions?: {
    minPurchaseAmount?: number | null
    partnerRestricted?: boolean
  }
}

export async function validateVoucherCode(params: {
  codeOrQr: string
  partnerOrgId: string
  cartTotal?: number | null
}) : Promise<VoucherValidationResult> {
  const codeHash = hashToken(params.codeOrQr)
  const voucher = await prisma.voucherInstance.findFirst({
    where: {
      OR: [{ code: params.codeOrQr }, { codeHash }],
    },
    include: {
      campaign: {
        include: { allowedPartners: true, allowedLocations: true, allowedProducts: true },
      },
    },
  })

  if (!voucher) {
    return { valid: false, reason: "not_found" }
  }

  if (voucher.status !== "active") {
    return { valid: false, reason: "inactive" }
  }

  const now = new Date()
  if (voucher.expiresAt && voucher.expiresAt < now) {
    return { valid: false, reason: "expired" }
  }

  if (voucher.campaign.validFrom && voucher.campaign.validFrom > now) {
    return { valid: false, reason: "not_active" }
  }
  if (voucher.campaign.validTo && voucher.campaign.validTo < now) {
    return { valid: false, reason: "expired" }
  }

  const partnerRestricted = voucher.campaign.allowedPartners.length > 0
  if (partnerRestricted) {
    const allowed = voucher.campaign.allowedPartners.some(
      (p) => p.partnerOrgId === params.partnerOrgId
    )
    if (!allowed) {
      return { valid: false, reason: "partner_not_allowed" }
    }
  }

  const locationRestricted = voucher.campaign.allowedLocations.length > 0
  if (locationRestricted && params.cartTotal == null) {
    // no-op: validate doesn't know location unless passed via payload
  }

  if (
    voucher.campaign.minPurchaseAmount &&
    params.cartTotal != null &&
    params.cartTotal < voucher.campaign.minPurchaseAmount
  ) {
    return { valid: false, reason: "min_purchase_not_met" }
  }

  return {
    valid: true,
    voucherId: voucher.id,
    valuePreview: {
      type: voucher.campaign.valueType === "percent" ? "percent" : "fixed",
      amount: voucher.initialValueAmount,
      currency: voucher.campaign.currency,
      remaining: voucher.remainingValueAmount ?? null,
    },
    restrictions: {
      minPurchaseAmount: voucher.campaign.minPurchaseAmount ?? null,
      partnerRestricted,
    },
  }
}

export async function redeemVoucher(params: {
  codeOrQr: string
  partnerOrgId: string
  amount: number
  currency: string
  idempotencyKey: string
  locationId?: string | null
  metadata?: Record<string, unknown>
}) {
  const codeHash = hashToken(params.codeOrQr)

  return prisma.$transaction(async (tx) => {
    const existing = await tx.voucherRedemption.findUnique({
      where: {
        partnerOrgId_idempotencyKey: {
          partnerOrgId: params.partnerOrgId,
          idempotencyKey: params.idempotencyKey,
        },
      },
    })

    if (existing) {
      return { redemption: existing, reused: true }
    }

    const voucher = await tx.voucherInstance.findFirst({
      where: {
        OR: [{ code: params.codeOrQr }, { codeHash }],
      },
      include: {
        campaign: {
          include: { allowedPartners: true, allowedLocations: true, allowedProducts: true },
        },
      },
    })

    if (!voucher) {
      throw new Error("Voucher not found")
    }

    await tx.$executeRaw(
      Prisma.sql`SELECT id FROM "VoucherInstance" WHERE id = ${voucher.id} FOR UPDATE`
    )

    if (voucher.status !== "active" && voucher.status !== "issued") {
      throw new Error("Voucher not active")
    }

    const now = new Date()
    if (voucher.expiresAt && voucher.expiresAt < now) {
      await tx.voucherInstance.update({
        where: { id: voucher.id },
        data: { status: "expired" },
      })
      await recordAuditEvent({
        orgId: voucher.orgId,
        actorType: "system",
        entityType: "voucher",
        entityId: voucher.id,
        eventType: "expire",
      })
      throw new Error("Voucher expired")
    }

    if (voucher.campaign.validFrom && voucher.campaign.validFrom > now) {
      throw new Error("Voucher not active")
    }
    if (voucher.campaign.validTo && voucher.campaign.validTo < now) {
      await tx.voucherInstance.update({
        where: { id: voucher.id },
        data: { status: "expired" },
      })
      await recordAuditEvent({
        orgId: voucher.orgId,
        actorType: "system",
        entityType: "voucher",
        entityId: voucher.id,
        eventType: "expire",
      })
      throw new Error("Voucher expired")
    }

    if (voucher.campaign.allowedPartners.length > 0) {
      const allowed = voucher.campaign.allowedPartners.some(
        (p) => p.partnerOrgId === params.partnerOrgId
      )
      if (!allowed) {
        throw new Error("Partner not allowed")
      }
    }

    if (voucher.campaign.allowedLocations.length > 0 && params.locationId) {
      const allowed = voucher.campaign.allowedLocations.some(
        (l) => l.locationId === params.locationId
      )
      if (!allowed) {
        throw new Error("Location not allowed")
      }
    }

    if (voucher.campaign.allowedProducts.length > 0) {
      const productIds = Array.isArray(params.metadata?.product_ids)
        ? (params.metadata?.product_ids as string[])
        : []
      if (productIds.length > 0) {
        const allowed = voucher.campaign.allowedProducts.some(
          (p) => productIds.includes(p.productId)
        )
        if (!allowed) {
          throw new Error("Product not allowed")
        }
      }
    }

    if (voucher.campaign.currency && voucher.campaign.currency !== params.currency) {
      throw new Error("Currency mismatch")
    }

    if (params.amount < 0) {
      throw new Error("Invalid amount")
    }

    const remaining = voucher.remainingValueAmount ?? voucher.initialValueAmount
    let redeemAmount = params.amount
    let nextRemaining = remaining
    let finalStatus: "active" | "redeemed" = "active"

    if (voucher.campaign.valueType === "percent") {
      const cartTotal =
        typeof params.metadata?.cart_total === "number" ? params.metadata?.cart_total : null
      if (!cartTotal || cartTotal <= 0) {
        throw new Error("cart_total required for percent vouchers")
      }
      redeemAmount = Math.floor((cartTotal * voucher.campaign.valueAmount) / 10000)
      if (redeemAmount <= 0) {
        throw new Error("No discount to apply")
      }
      nextRemaining = 0
      finalStatus = "redeemed"
    } else {
      if (redeemAmount <= 0) {
        throw new Error("Amount required")
      }

      const maxRedemptions = voucher.campaign.maxRedemptionsPerVoucher
      if (maxRedemptions && voucher.redeemedCount + 1 > maxRedemptions) {
        throw new Error("Max redemptions exceeded")
      }

      const updateResult = await tx.$queryRaw<Array<typeof voucher>>(
        Prisma.sql`
          UPDATE "VoucherInstance"
          SET
            "remainingValueAmount" = "remainingValueAmount" - ${redeemAmount},
            "redeemedCount" = "redeemedCount" + 1,
            status = CASE
              WHEN ${voucher.campaign.usageType} = 'single' THEN 'redeemed'::"B2BVoucherStatus"
              WHEN ("remainingValueAmount" - ${redeemAmount}) = 0 THEN 'redeemed'::"B2BVoucherStatus"
              ELSE 'active'::"B2BVoucherStatus"
            END,
            "activatedAt" = COALESCE("activatedAt", now()),
            "updatedAt" = now()
          WHERE id = ${voucher.id}
            AND status IN ('active'::"B2BVoucherStatus",'issued'::"B2BVoucherStatus")
            AND "remainingValueAmount" >= ${redeemAmount}
          RETURNING *;
        `
      )

      if (!updateResult || updateResult.length === 0) {
        throw new Error("Insufficient remaining value")
      }

      const updatedRow = updateResult[0]
      nextRemaining = updatedRow.remainingValueAmount ?? 0
      finalStatus = updatedRow.status as "active" | "redeemed"
    }

    const updatedVoucher =
      voucher.campaign.valueType === "percent"
        ? await tx.voucherInstance.update({
            where: { id: voucher.id },
            data: {
              remainingValueAmount: nextRemaining,
              redeemedCount: { increment: 1 },
              status: finalStatus,
              activatedAt: voucher.activatedAt ?? new Date(),
            },
          })
        : await tx.voucherInstance.findUniqueOrThrow({ where: { id: voucher.id } })

    const redemption = await tx.voucherRedemption.create({
      data: {
        voucherId: voucher.id,
        partnerOrgId: params.partnerOrgId,
        amountRedeemed: redeemAmount,
        currency: params.currency,
        idempotencyKey: params.idempotencyKey,
        locationId: params.locationId ?? undefined,
        metadata: params.metadata ? (params.metadata as Prisma.InputJsonValue) : undefined,
        status: "approved",
      },
    })

    await recordAuditEvent({
      orgId: voucher.orgId,
      actorType: "partner_api",
      entityType: "redemption",
      entityId: redemption.id,
      eventType: "redeem",
      after: {
        voucherId: voucher.id,
        amount: redeemAmount,
        currency: params.currency,
      },
    })

    return { redemption, voucher: updatedVoucher, reused: false }
  }, { isolationLevel: "Serializable" })
}
