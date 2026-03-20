import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withErrorHandler } from '@/lib/error-handler';
import { requireAdminPermission } from '@/lib/admin/guards';
import { recordAdminAudit } from '@/lib/admin/audit';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/rate-limits — rate limit stats, top offenders, endpoint utilization
 */
export async function GET(req: NextRequest) {
  return withErrorHandler(async () => {
    await requireAdminPermission('admin.ops.read');

    const { searchParams } = new URL(req.url);
    const hours = Math.min(parseInt(searchParams.get('hours') ?? '24', 10), 168); // max 7 days
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    // Query admin audit logs for rate limit events
    const rateLimitEvents = await prisma.adminAuditLog.findMany({
      where: {
        action: { startsWith: 'rate_limit' },
        createdAt: { gte: since },
      },
      select: {
        action: true,
        metadata: true,
        createdAt: true,
        targetId: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 5000,
    });

    // Build offender map from metadata
    const offenderMap = new Map<string, { ip: string; hits: number; blocked: number; lastSeen: string; userId?: string }>();

    for (const event of rateLimitEvents) {
      const meta = event.metadata as Record<string, unknown> | null;
      const ip = (meta?.ip as string) ?? (event.targetId ?? 'unknown');
      const existing = offenderMap.get(ip) ?? { ip, hits: 0, blocked: 0, lastSeen: '', userId: undefined };
      existing.hits++;
      if (meta?.blocked) existing.blocked++;
      if (!existing.lastSeen || event.createdAt.toISOString() > existing.lastSeen) {
        existing.lastSeen = event.createdAt.toISOString();
      }
      if (meta?.userId) existing.userId = meta.userId as string;
      offenderMap.set(ip, existing);
    }

    const topOffenders = [...offenderMap.values()]
      .sort((a, b) => b.hits - a.hits)
      .slice(0, 20);

    // Endpoint utilization
    const endpointMap = new Map<string, { endpoint: string; total: number; blocked: number }>();
    for (const event of rateLimitEvents) {
      const meta = event.metadata as Record<string, unknown> | null;
      const endpoint = (meta?.endpoint as string) ?? event.action;
      const existing = endpointMap.get(endpoint) ?? { endpoint, total: 0, blocked: 0 };
      existing.total++;
      if (meta?.blocked) existing.blocked++;
      endpointMap.set(endpoint, existing);
    }

    const endpointUtilization = [...endpointMap.values()]
      .sort((a, b) => b.total - a.total)
      .slice(0, 20)
      .map((e) => ({
        ...e,
        utilization: e.total > 0 ? Math.round((e.blocked / e.total) * 100) : 0,
      }));

    // IP blocklist from system settings
    let blocklist: string[] = [];
    try {
      const setting = await prisma.systemSetting.findUnique({
        where: { key: 'ip_blocklist' },
      });
      if (setting?.value) {
        blocklist = JSON.parse(setting.value as string);
      }
    } catch {
      // Table may not exist
    }

    const totalBlocked = rateLimitEvents.filter((e) => {
      const meta = e.metadata as Record<string, unknown> | null;
      return meta?.blocked;
    }).length;

    return NextResponse.json({
      period: { hours, since: since.toISOString() },
      totalEvents: rateLimitEvents.length,
      totalBlocked,
      topOffenders,
      endpointUtilization,
      blocklist,
    });
  });
}

/**
 * POST /api/admin/rate-limits — manage IP blocklist (add/remove)
 */
export async function POST(req: NextRequest) {
  return withErrorHandler(async () => {
    const admin = await requireAdminPermission('admin.system.manage');

    const body = await req.json();
    const { action, ip } = body as { action: 'add' | 'remove'; ip: string };

    if (!action || !ip) {
      return NextResponse.json(
        { error: 'Provide action (add/remove) and ip' },
        { status: 400 }
      );
    }

    if (!['add', 'remove'].includes(action)) {
      return NextResponse.json(
        { error: 'Action must be add or remove' },
        { status: 400 }
      );
    }

    // IP format validation
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    const ipv6Regex = /^[0-9a-fA-F:]+$/;
    if (!ipRegex.test(ip) && !ipv6Regex.test(ip)) {
      return NextResponse.json(
        { error: 'Invalid IP address format' },
        { status: 400 }
      );
    }

    let blocklist: string[] = [];
    try {
      const setting = await prisma.systemSetting.findUnique({
        where: { key: 'ip_blocklist' },
      });
      if (setting?.value) {
        blocklist = JSON.parse(setting.value as string);
      }
    } catch {
      // Table may not exist
    }

    if (action === 'add') {
      if (!blocklist.includes(ip)) {
        blocklist.push(ip);
      }
    } else {
      blocklist = blocklist.filter((item) => item !== ip);
    }

    try {
      await prisma.systemSetting.upsert({
        where: { key: 'ip_blocklist' },
        update: { value: JSON.stringify(blocklist) },
        create: { key: 'ip_blocklist', value: JSON.stringify(blocklist) },
      });
    } catch {
      // If table doesn't exist, just return success with in-memory update
    }

    await recordAdminAudit({
      actorUserId: admin.userId,
      action: `rate_limit.blocklist.${action}`,
      targetType: 'ip',
      targetId: ip,
      metadata: { blocklistSize: blocklist.length },
    });

    return NextResponse.json({ success: true, blocklist });
  });
}
