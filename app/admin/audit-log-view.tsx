'use client';

import { useState, useEffect } from 'react';
import { WarmCard } from '@/components/warm-card';
import { WarmButton } from '@/components/warm-button';
import { showError } from '@/lib/toast-helpers';
import { captureException } from '@/lib/error-tracking';
import { AuditLogPayload } from '@/types';
import { describeAuditResource, formatAuditAction } from '@/lib/audit-labels';

type AuditLog = {
  id: string;
  action: string;
  resourceType?: string | null;
  resourceId?: string | null;
  createdAt: string;
  payloadJson: AuditLogPayload | null;
  actor: {
    email: string;
    name: string | null;
  } | null;
  merchant: {
    name: string;
    slug: string;
  } | null;
};

export default function AuditLogView({
  initialLogs,
  limit = 20,
  bare = false,
}: {
  initialLogs: AuditLog[];
  /** How many recent entries to load. */
  limit?: number;
  /** Render without the card chrome (when the parent already provides one). */
  bare?: boolean;
}) {
  const [logs, setLogs] = useState<AuditLog[]>(initialLogs);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleExportCsv = async () => {
    setIsExporting(true);
    try {
      const res = await fetch('/api/admin/audit-log/export');
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-log-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      showError('CSV export failed');
    } finally {
      setIsExporting(false);
    }
  };

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/audit-log?limit=${limit}`);
      if (!res.ok) throw new Error('Failed to fetch audit log');
      const data = await res.json();
      setLogs(data.logs);
    } catch (error) {
      showError('Failed to load audit log');
      if (error instanceof Error) {
        captureException(error, { context: 'admin_audit_log_fetch_client' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [limit]);

  const formatAction = formatAuditAction;

  const formatPayload = (payload: AuditLogPayload | null) => {
    if (!payload) return null;
    try {
      const parsed = typeof payload === 'string' ? JSON.parse(payload) : payload;
      return JSON.stringify(parsed, null, 2);
    } catch {
      return String(payload);
    }
  };

  return (
    <WarmCard padding={bare ? 'none' : 'lg'} className={bare ? 'bg-transparent border-0 shadow-none' : 'bg-white border border-[rgba(139,115,85,0.15)]'}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold text-[#2D2721]">Audit log</h2>
          <p className="text-sm text-[#6B5744]">Recent platform actions.</p>
        </div>
        <WarmButton
          variant="outline"
          size="sm"
          onClick={handleExportCsv}
          disabled={isExporting}
        >
          {isExporting ? 'Exporting...' : '⬇ CSV'}
        </WarmButton>
      </div>
      <div className="space-y-3 max-h-[600px] overflow-y-auto mt-4">
        {isLoading ? (
          <p className="text-[#6B5744] text-center py-4">Loading...</p>
        ) : logs.length === 0 ? (
          <p className="text-[#6B5744] text-center py-4">No audit logs found.</p>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="border border-[rgba(139,115,85,0.15)] rounded-lg p-3 text-sm">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-medium text-[#2D2721]">{formatAction(log.action)}</p>
                  <p className="text-xs text-[#8B7355]">
                    {log.actor?.name || log.actor?.email || 'System'}
                    {log.merchant && ` - ${log.merchant.name}`}
                  </p>
                  {(() => {
                    const resource = describeAuditResource(log);
                    return resource ? (
                      <p className="text-xs text-[#8B7355]">
                        {resource.label}
                        {resource.name ? ` “${resource.name}”` : ''}
                        {resource.id ? ` #${resource.id.slice(0, 8)}` : ''}
                      </p>
                    ) : null;
                  })()}
                </div>
                <p className="text-xs text-[#8B7355] whitespace-nowrap">
                  {new Date(log.createdAt).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}
                </p>
              </div>
              {log.payloadJson && (
                <details className="mt-2">
                  <summary className="text-xs text-[#6B5744] cursor-pointer">Details</summary>
                  <pre className="text-xs mt-2 p-2 bg-[#FFF9ED] rounded overflow-x-auto text-[#2D2721]">
                    {formatPayload(log.payloadJson)}
                  </pre>
                </details>
              )}
            </div>
          ))
        )}
      </div>
      <WarmButton
        variant="outline"
        size="sm"
        className="w-full mt-4"
        onClick={fetchLogs}
        disabled={isLoading}
      >
        {isLoading ? 'Loading...' : 'Refresh'}
      </WarmButton>
    </WarmCard>
  );
}
