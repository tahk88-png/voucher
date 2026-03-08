import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

export type TimelineEvent = {
  type: string; // "purchase" | "redemption" | "report" | "moderation" | "support" | "audit" | "credit" | "referral"
  id: string;
  timestamp: Date;
  summary: string;
  metadata: Record<string, unknown>;
};

export async function getUserTimeline(
  userId: string,
  opts?: {
    from?: Date;
    to?: Date;
    types?: string[];
    page?: number;
    limit?: number;
  }
): Promise<{ events: TimelineEvent[]; total: number }> {
  const page = opts?.page ?? 1;
  const limit = opts?.limit ?? 50;
  const from = opts?.from;
  const to = opts?.to;
  const types = opts?.types;

  const dateFilter = {
    ...(from ? { gte: from } : {}),
    ...(to ? { lte: to } : {}),
  };
  const hasDateFilter = from || to;
  const createdAtWhere = hasDateFilter ? { createdAt: dateFilter } : {};

  const shouldFetch = (type: string) => !types || types.includes(type);

  logger.info("Fetching user timeline", { userId, opts });

  const [
    voucherPurchases,
    ticketPurchases,
    redemptions,
    creditLedger,
    referrals,
    reports,
    moderationActions,
    supportCases,
  ] = await Promise.all([
    shouldFetch("purchase")
      ? prisma.voucherPurchase.findMany({
          where: { userId, ...createdAtWhere },
          select: {
            id: true,
            createdAt: true,
            amount: true,
            currency: true,
            merchantId: true,
            status: true,
            stripeSessionId: true,
          },
        })
      : Promise.resolve([]),

    shouldFetch("purchase")
      ? prisma.ticketPurchase.findMany({
          where: { userId, ...createdAtWhere },
          select: {
            id: true,
            createdAt: true,
            amount: true,
            currency: true,
            eventId: true,
            merchantId: true,
            status: true,
          },
        })
      : Promise.resolve([]),

    shouldFetch("redemption")
      ? prisma.redemption.findMany({
          where: { redeemedByUserId: userId, ...createdAtWhere },
          select: {
            id: true,
            createdAt: true,
            discountApplied: true,
            currency: true,
            voucherId: true,
            merchantId: true,
            method: true,
          },
        })
      : Promise.resolve([]),

    shouldFetch("credit")
      ? prisma.creditLedger.findMany({
          where: { userId, ...createdAtWhere },
          select: {
            id: true,
            createdAt: true,
            amount: true,
            currency: true,
            status: true,
            source: true,
            merchantId: true,
          },
        })
      : Promise.resolve([]),

    shouldFetch("referral")
      ? prisma.referral.findMany({
          where: { referrerUserId: userId, ...createdAtWhere },
          select: {
            id: true,
            createdAt: true,
            status: true,
            voucherId: true,
            merchantId: true,
          },
        })
      : Promise.resolve([]),

    shouldFetch("report")
      ? prisma.userReport.findMany({
          where: { reportedUserId: userId, ...createdAtWhere },
          select: {
            id: true,
            createdAt: true,
            category: true,
            status: true,
            reportedByUserId: true,
          },
        })
      : Promise.resolve([]),

    shouldFetch("moderation")
      ? prisma.moderationAction.findMany({
          where: { targetUserId: userId, ...createdAtWhere },
          select: {
            id: true,
            createdAt: true,
            actionType: true,
            moderatorUserId: true,
            reason: true,
            strikeNumber: true,
          },
        })
      : Promise.resolve([]),

    shouldFetch("support")
      ? prisma.supportCase.findMany({
          where: { userId, ...createdAtWhere },
          select: {
            id: true,
            createdAt: true,
            subject: true,
            status: true,
            priority: true,
            caseNumber: true,
          },
        })
      : Promise.resolve([]),
  ]);

  const events: TimelineEvent[] = [];

  for (const p of voucherPurchases) {
    events.push({
      type: "purchase",
      id: p.id,
      timestamp: p.createdAt,
      summary: `Voucher purchase: ${p.amount} ${p.currency}`,
      metadata: {
        merchantId: p.merchantId,
        status: p.status,
        stripeSessionId: p.stripeSessionId,
      },
    });
  }

  for (const p of ticketPurchases) {
    events.push({
      type: "purchase",
      id: p.id,
      timestamp: p.createdAt,
      summary: `Ticket purchase: ${p.amount} ${p.currency}`,
      metadata: {
        eventId: p.eventId,
        merchantId: p.merchantId,
        status: p.status,
      },
    });
  }

  for (const r of redemptions) {
    events.push({
      type: "redemption",
      id: r.id,
      timestamp: r.createdAt,
      summary: `Redemption: ${r.discountApplied} ${r.currency}`,
      metadata: {
        voucherId: r.voucherId,
        merchantId: r.merchantId,
        method: r.method,
      },
    });
  }

  for (const c of creditLedger) {
    events.push({
      type: "credit",
      id: c.id,
      timestamp: c.createdAt,
      summary: `Credit ${c.status}: ${c.amount} ${c.currency}`,
      metadata: {
        source: c.source,
        merchantId: c.merchantId,
      },
    });
  }

  for (const r of referrals) {
    events.push({
      type: "referral",
      id: r.id,
      timestamp: r.createdAt,
      summary: `Referral ${r.status}`,
      metadata: {
        voucherId: r.voucherId,
        merchantId: r.merchantId,
      },
    });
  }

  for (const r of reports) {
    events.push({
      type: "report",
      id: r.id,
      timestamp: r.createdAt,
      summary: `Report received: ${r.category}`,
      metadata: {
        status: r.status,
        reportedByUserId: r.reportedByUserId,
      },
    });
  }

  for (const m of moderationActions) {
    events.push({
      type: "moderation",
      id: m.id,
      timestamp: m.createdAt,
      summary: `Moderation: ${m.actionType}`,
      metadata: {
        moderatorUserId: m.moderatorUserId,
        reason: m.reason,
        strikeNumber: m.strikeNumber,
      },
    });
  }

  for (const s of supportCases) {
    events.push({
      type: "support",
      id: s.id,
      timestamp: s.createdAt,
      summary: `Support case: ${s.subject}`,
      metadata: {
        status: s.status,
        priority: s.priority,
        caseNumber: s.caseNumber,
      },
    });
  }

  // Sort by timestamp descending
  events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  const total = events.length;
  const offset = (page - 1) * limit;
  const paginatedEvents = events.slice(offset, offset + limit);

  logger.info("User timeline fetched successfully", {
    userId,
    total,
    page,
    limit,
  });

  return { events: paginatedEvents, total };
}
