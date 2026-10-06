import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { safeParseJson } from '@/lib/utils';
import { requireAdminPermission } from '@/lib/admin/guards';
import { AccessControlError } from '@/lib/access-control';
import { AuditLogPayload } from '@/types';
import AuditLogView from '../audit-log-view';

export const metadata: Metadata = {
  title: 'Audit log',
  robots: { index: false, follow: false },
};

const PAGE_LIMIT = 100;

export default async function AdminAuditLogPage() {
  try {
    await requireAdminPermission('admin.audit.read');
  } catch (error) {
    if (error instanceof AccessControlError && error.status === 401) redirect('/login');
    redirect('/admin');
  }

  const logs = await prisma.auditLog.findMany({
    take: PAGE_LIMIT,
    include: {
      actor: { select: { email: true, name: true } },
      merchant: { select: { name: true, slug: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  const serialized = logs.map((log) => ({
    id: log.id,
    action: log.action,
    resourceType: log.resourceType,
    resourceId: log.resourceId,
    createdAt: log.createdAt.toISOString(),
    payloadJson: safeParseJson<AuditLogPayload>(log.payloadJson),
    actor: log.actor,
    merchant: log.merchant,
  }));

  return (
    <div className="min-h-screen bg-[#FAF7F2] p-4">
      <div className="container mx-auto max-w-4xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-[#2D2721]">Audit log</h1>
          <p className="text-[#6B5744]">The latest {PAGE_LIMIT} actions across the platform. Export CSV for the full history.</p>
        </div>
        <AuditLogView initialLogs={serialized} limit={PAGE_LIMIT} />
      </div>
    </div>
  );
}
