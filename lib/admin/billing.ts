import { prisma } from "@/lib/prisma"
import { logger } from "@/lib/logger"
import Stripe from "stripe"

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error("STRIPE_SECRET_KEY not configured")
  return new Stripe(key, { apiVersion: "2023-10-16" })
}

// ---------------------------------------------------------------------------
// Subscription Overview
// ---------------------------------------------------------------------------

export async function getSubscriptionOverview(filters: {
  status?: string
  merchantId?: string
  page?: number
  limit?: number
}): Promise<{ subscriptions: any[]; total: number }> {
  const page = filters.page ?? 1
  const limit = filters.limit ?? 20
  const skip = (page - 1) * limit

  const where: any = {}
  if (filters.status) where.status = filters.status
  if (filters.merchantId) where.merchantId = filters.merchantId

  const [subscriptions, total] = await Promise.all([
    prisma.merchantSubscription.findMany({
      where,
      include: {
        merchant: {
          select: { id: true, name: true, slug: true, isActive: true },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.merchantSubscription.count({ where }),
  ])

  return { subscriptions, total }
}

// ---------------------------------------------------------------------------
// Failed Payments
// ---------------------------------------------------------------------------

export async function getFailedPayments(filters: {
  merchantId?: string
  from?: Date
  to?: Date
  page?: number
  limit?: number
}): Promise<{ payments: any[]; total: number }> {
  const page = filters.page ?? 1
  const limit = filters.limit ?? 20
  const skip = (page - 1) * limit

  const voucherWhere: any = { status: "failed" }
  const ticketWhere: any = { status: "failed" }

  if (filters.merchantId) {
    voucherWhere.merchantId = filters.merchantId
    ticketWhere.merchantId = filters.merchantId
  }
  if (filters.from || filters.to) {
    const dateFilter: any = {}
    if (filters.from) dateFilter.gte = filters.from
    if (filters.to) dateFilter.lte = filters.to
    voucherWhere.createdAt = dateFilter
    ticketWhere.createdAt = { ...dateFilter }
  }

  const [voucherPayments, voucherTotal, ticketPayments, ticketTotal] =
    await Promise.all([
      prisma.voucherPurchase.findMany({
        where: voucherWhere,
        include: {
          user: { select: { id: true, email: true, name: true } },
          merchant: { select: { id: true, name: true, slug: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.voucherPurchase.count({ where: voucherWhere }),
      prisma.ticketPurchase.findMany({
        where: ticketWhere,
        include: {
          user: { select: { id: true, email: true, name: true } },
          merchant: { select: { id: true, name: true, slug: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.ticketPurchase.count({ where: ticketWhere }),
    ])

  const merged = [
    ...voucherPayments.map((p: any) => ({ ...p, type: "voucher_purchase" })),
    ...ticketPayments.map((p: any) => ({ ...p, type: "ticket_purchase" })),
  ].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  const total = voucherTotal + ticketTotal
  const paginated = merged.slice(skip, skip + limit)

  return { payments: paginated, total }
}

// ---------------------------------------------------------------------------
// Refund
// ---------------------------------------------------------------------------

export async function issueRefund(input: {
  purchaseId: string
  purchaseType: "voucher_purchase" | "ticket_purchase"
  actorUserId: string
  amount?: number
  reason: string
  idempotencyKey?: string
}): Promise<any> {
  // Idempotency check
  if (input.idempotencyKey) {
    const existing = await prisma.refundRecord.findFirst({
      where: { idempotencyKey: input.idempotencyKey },
    })
    if (existing) {
      logger.info("Returning existing refund record for idempotency key", {
        idempotencyKey: input.idempotencyKey,
      })
      return existing
    }
  }

  // Fetch the purchase
  let purchase: any
  if (input.purchaseType === "voucher_purchase") {
    purchase = await prisma.voucherPurchase.findUniqueOrThrow({
      where: { id: input.purchaseId },
    })
  } else {
    purchase = await prisma.ticketPurchase.findUniqueOrThrow({
      where: { id: input.purchaseId },
    })
  }

  const stripeSessionId = purchase.stripeSessionId
  let stripeRefundId: string | null = null
  let refundStatus: "refund_pending" | "processing" | "refund_succeeded" | "refund_failed" | "refund_cancelled" = "refund_succeeded"

  // Attempt Stripe refund if session exists and Stripe is configured
  if (stripeSessionId && process.env.STRIPE_SECRET_KEY) {
    try {
      const stripe = getStripe()

      const session = await stripe.checkout.sessions.retrieve(stripeSessionId)
      const paymentIntentId = session.payment_intent as string

      if (!paymentIntentId) {
        throw new Error("No payment intent found on checkout session")
      }

      const refundParams: Stripe.RefundCreateParams = {
        payment_intent: paymentIntentId,
        reason: "requested_by_customer",
      }
      if (input.amount != null) {
        refundParams.amount = input.amount
      }

      const stripeRefund = await stripe.refunds.create(refundParams)
      stripeRefundId = stripeRefund.id

      logger.info("Stripe refund created", {
        refundId: stripeRefund.id,
        purchaseId: input.purchaseId,
      })
    } catch (err) {
      logger.error("Stripe refund failed, creating local-only refund", {
        error: err,
        purchaseId: input.purchaseId,
      })
      refundStatus = "refund_failed"
    }
  } else {
    logger.info("No Stripe session or key — creating local-only refund", {
      purchaseId: input.purchaseId,
    })
  }

  // Create refund record
  const refundRecord = await prisma.refundRecord.create({
    data: {
      purchaseId: input.purchaseId,
      purchaseType: input.purchaseType,
      amountRefunded: input.amount ?? purchase.amount ?? purchase.totalAmount ?? 0,
      currency: purchase.currency ?? "EUR",
      reason: input.reason,
      status: refundStatus,
      stripeRefundId,
      actorUserId: input.actorUserId,
      isPartial: input.amount != null && input.amount < (purchase.amount ?? purchase.totalAmount ?? 0),
      idempotencyKey: input.idempotencyKey ?? null,
    },
  })

  // Update purchase status
  if (input.purchaseType === "voucher_purchase") {
    await prisma.voucherPurchase.update({
      where: { id: input.purchaseId },
      data: { status: "refunded" },
    })
  } else {
    await prisma.ticketPurchase.update({
      where: { id: input.purchaseId },
      data: { status: "refunded" },
    })
  }

  return refundRecord
}

// ---------------------------------------------------------------------------
// Payout Holds
// ---------------------------------------------------------------------------

export type PayoutHoldReason =
  | "fraud_review"
  | "chargeback"
  | "compliance"
  | "manual"

export async function createPayoutHold(input: {
  merchantId: string
  reason: PayoutHoldReason
  notes: string
  actorUserId: string
}): Promise<any> {
  const hold = await prisma.payoutHold.create({
    data: {
      merchantId: input.merchantId,
      reason: input.reason,
      notes: input.notes,
      isActive: true,
      actorUserId: input.actorUserId,
    },
  })

  logger.info("Payout hold created", {
    holdId: hold.id,
    merchantId: input.merchantId,
    reason: input.reason,
  })

  return hold
}

export async function releasePayoutHold(
  holdId: string,
  actorUserId: string,
  reason: string
): Promise<void> {
  await prisma.payoutHold.update({
    where: { id: holdId },
    data: {
      isActive: false,
      releasedAt: new Date(),
      releasedBy: actorUserId,
    },
  })

  logger.info("Payout hold released", {
    holdId,
    releasedBy: actorUserId,
    reason,
  })
}
