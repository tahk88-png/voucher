import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

export type UserSearchResult = {
  id: string;
  email: string;
  name: string | null;
  status: string;
  adminRole: string | null;
  createdAt: Date;
  _count: { merchantMemberships: number; purchases: number };
};

export async function globalUserSearch(query: {
  email?: string;
  userId?: string;
  name?: string;
  ip?: string;
  paymentId?: string;
  page?: number;
  limit?: number;
}): Promise<{ users: UserSearchResult[]; total: number }> {
  const page = query.page ?? 1;
  const limit = query.limit ?? 50;
  const offset = (page - 1) * limit;

  logger.info("Global user search", { query });

  let userIds: string[] | undefined;

  // If ip provided, search audit logs for matching IPs and extract user IDs
  if (query.ip) {
    const auditEntries = await prisma.adminAuditLog.findMany({
      where: { actorIp: query.ip },
      select: { actorUserId: true },
      distinct: ["actorUserId"],
    });
    userIds = auditEntries.map((e) => e.actorUserId);
    if (userIds.length === 0) {
      return { users: [], total: 0 };
    }
  }

  // If paymentId provided, search voucher purchases by stripeSessionId
  if (query.paymentId) {
    const purchases = await prisma.voucherPurchase.findMany({
      where: { stripeSessionId: query.paymentId },
      select: { userId: true },
      distinct: ["userId"],
    });
    const paymentUserIds = purchases.map((p) => p.userId);
    if (paymentUserIds.length === 0) {
      return { users: [], total: 0 };
    }
    // Intersect with existing userIds if both ip and paymentId are specified
    if (userIds) {
      userIds = userIds.filter((id) => paymentUserIds.includes(id));
      if (userIds.length === 0) {
        return { users: [], total: 0 };
      }
    } else {
      userIds = paymentUserIds;
    }
  }

  // Build the where clause
  const where: Record<string, unknown> = {};

  if (query.userId) {
    where.id = query.userId;
  } else if (userIds) {
    where.id = { in: userIds };
  }

  if (query.email) {
    where.email = { contains: query.email, mode: "insensitive" };
  }

  if (query.name) {
    where.name = { contains: query.name, mode: "insensitive" };
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        status: true,
        adminRole: true,
        createdAt: true,
        _count: {
          select: {
            merchantMembers: true,
            voucherPurchases: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: offset,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);

  const results: UserSearchResult[] = users.map((u) => ({
    id: u.id,
    email: u.email,
    name: u.name,
    status: u.status,
    adminRole: u.adminRole,
    createdAt: u.createdAt,
    _count: {
      merchantMemberships: u._count.merchantMembers,
      purchases: u._count.voucherPurchases,
    },
  }));

  logger.info("User search completed", { total, page, limit });

  return { users: results, total };
}
