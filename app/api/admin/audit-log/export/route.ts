import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withErrorHandler } from '@/lib/error-handler';
import { requireAdminPermission } from '@/lib/admin/guards';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  return withErrorHandler(async () => {
    await requireAdminPermission('admin.audit.export');

    const searchParams = req.nextUrl.searchParams;
    const action = searchParams.get('action') || undefined;
    const merchantId = searchParams.get('merchantId') || undefined;
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    const where: Record<string, unknown> = {};
    if (action) where.action = action;
    if (merchantId) where.merchantId = merchantId;
    if (from || to) {
      where.createdAt = {};
      if (from) (where.createdAt as Record<string, unknown>).gte = new Date(from);
      if (to) (where.createdAt as Record<string, unknown>).lte = new Date(to);
    }

    const logs = await prisma.auditLog.findMany({
      where,
      include: {
        actor: { select: { id: true, email: true, name: true } },
        merchant: { select: { id: true, name: true, slug: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 10000,
    });

    const bom = '\uFEFF';
    const header = 'Date,Action,Actor Email,Actor Name,Merchant,Merchant Slug,Payload\n';
    const rows = logs.map(log => {
      const date = log.createdAt.toISOString();
      const logAction = log.action.replace(/,/g, ';');
      const actorEmail = log.actor?.email ?? '';
      const actorName = (log.actor?.name ?? '').replace(/,/g, ';');
      const merchantName = (log.merchant?.name ?? '').replace(/,/g, ';');
      const merchantSlug = log.merchant?.slug ?? '';
      const payload = log.payloadJson ? JSON.stringify(log.payloadJson).replace(/"/g, "'") : '';
      return `${date},${logAction},${actorEmail},${actorName},${merchantName},${merchantSlug},"${payload}"`;
    }).join('\n');

    const csv = bom + header + rows;

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="audit-log-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  });
}
