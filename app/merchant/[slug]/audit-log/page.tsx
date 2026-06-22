'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { WarmButton } from '@/components/warm-button';
import { WarmCard } from '@/components/warm-card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { showError } from '@/lib/toast-helpers';
import { ChevronLeft, ChevronRight, Search, Filter, Clock } from 'lucide-react';

interface AuditLogEntry {
  id: string;
  action: string;
  resourceType: string | null;
  resourceId: string | null;
  payloadJson: unknown;
  changes: unknown;
  reason: string | null;
  ipAddress: string | null;
  createdAt: string;
  actor: {
    id: string;
    email: string;
    name: string | null;
  };
}

interface AuditLogResponse {
  items: AuditLogEntry[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  actions: string[];
}

const ACTION_COLORS: Record<string, string> = {
  'member.invited': 'bg-green-100 text-green-800',
  'member.removed': 'bg-red-100 text-red-800',
  'member.role_changed': 'bg-yellow-100 text-yellow-800',
  'voucher.created': 'bg-blue-100 text-blue-800',
  'voucher.updated': 'bg-indigo-100 text-indigo-800',
  'campaign.created': 'bg-purple-100 text-purple-800',
  'api_key.created': 'bg-teal-100 text-teal-800',
  'api_key.revoked': 'bg-orange-100 text-orange-800',
};

function getActionColor(action: string): string {
  return ACTION_COLORS[action] || 'bg-gray-100 text-gray-800';
}

function formatPayload(payload: unknown): string {
  if (!payload) return '';
  try {
    const parsed = typeof payload === 'string' ? JSON.parse(payload) : payload;
    return Object.entries(parsed)
      .filter(([key]) => !key.endsWith('Id') || key === 'email')
      .map(([key, val]) => `${key}: ${val}`)
      .join(', ');
  } catch {
    return String(payload);
  }
}

export default function AuditLogPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [data, setData] = useState<AuditLogResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const fetchLogs = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    if (actionFilter) params.set('action', actionFilter);
    if (dateFrom) params.set('dateFrom', dateFrom);
    if (dateTo) params.set('dateTo', dateTo);

    fetch(`/api/merchant/${slug}/audit-log?${params}`)
      .then((res) => res.json())
      .then(setData)
      .catch(() => showError('Failed to load audit log'))
      .finally(() => setLoading(false));
  }, [slug, page, actionFilter, dateFrom, dateTo]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleApplyFilters = () => {
    setPage(1);
  };

  const handleClearFilters = () => {
    setActionFilter('');
    setDateFrom('');
    setDateTo('');
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text)]">Audit Log</h1>
          <p className="text-sm text-[var(--text-muted)]">
            Track all actions performed on your merchant account
          </p>
        </div>
        <WarmButton
          size="sm"
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter className="h-4 w-4 mr-1" /> Filters
        </WarmButton>
      </div>

      {showFilters && (
        <WarmCard padding="lg" className="bg-[var(--surface)]">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="action-filter">Action</Label>
              <select
                id="action-filter"
                className="w-full h-10 rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 mt-1 text-sm"
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
              >
                <option value="">All actions</option>
                {data?.actions.map((action) => (
                  <option key={action} value={action}>
                    {action}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="date-from">From Date</Label>
              <Input
                id="date-from"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="border-[var(--border)] mt-1"
              />
            </div>
            <div>
              <Label htmlFor="date-to">To Date</Label>
              <Input
                id="date-to"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="border-[var(--border)] mt-1"
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <WarmButton size="sm" onClick={handleApplyFilters}>
              <Search className="h-4 w-4 mr-1" /> Apply
            </WarmButton>
            <WarmButton size="sm" variant="outline" onClick={handleClearFilters}>
              Clear
            </WarmButton>
          </div>
        </WarmCard>
      )}

      {loading ? (
        <p className="text-sm text-[var(--text-muted)]">Loading audit log...</p>
      ) : !data || data.items.length === 0 ? (
        <WarmCard padding="lg" className="bg-[var(--surface)] text-center">
          <Clock className="h-12 w-12 mx-auto text-[var(--text-muted)] mb-3" />
          <p className="text-[var(--text-muted)]">No audit log entries found.</p>
        </WarmCard>
      ) : (
        <>
          <WarmCard padding="none" className="bg-[var(--surface)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)] bg-[var(--surface)]">
                    <th className="text-left px-4 py-3 font-medium text-[var(--text-muted)]">Timestamp</th>
                    <th className="text-left px-4 py-3 font-medium text-[var(--text-muted)]">Actor</th>
                    <th className="text-left px-4 py-3 font-medium text-[var(--text-muted)]">Action</th>
                    <th className="text-left px-4 py-3 font-medium text-[var(--text-muted)]">Resource</th>
                    <th className="text-left px-4 py-3 font-medium text-[var(--text-muted)]">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((log) => (
                    <tr key={log.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface)]">
                      <td className="px-4 py-3 whitespace-nowrap text-[var(--text-muted)]">
                        <div className="text-xs">
                          {new Date(log.createdAt).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-[var(--text-muted)]">
                          {new Date(log.createdAt).toLocaleTimeString()}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-[var(--text)]">{log.actor.name || 'Unknown'}</p>
                        <p className="text-xs text-[var(--text-muted)]">{log.actor.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={`${getActionColor(log.action)} border-0`}>
                          {log.action}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-[var(--text-muted)]">
                        {log.resourceType && (
                          <span className="text-xs">
                            {log.resourceType}
                            {log.resourceId && (
                              <span className="text-[var(--text-muted)] ml-1">
                                #{log.resourceId.slice(0, 8)}
                              </span>
                            )}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-[var(--text-muted)] max-w-xs truncate">
                        {log.reason || formatPayload(log.payloadJson)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </WarmCard>

          {/* Pagination */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-[var(--text-muted)]">
              Showing {(data.page - 1) * data.pageSize + 1}–
              {Math.min(data.page * data.pageSize, data.total)} of {data.total}
            </p>
            <div className="flex items-center gap-2">
              <WarmButton
                size="sm"
                variant="outline"
                disabled={!data.hasPrevPage}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </WarmButton>
              <span className="text-sm text-[var(--text-muted)]">
                Page {data.page} of {data.totalPages}
              </span>
              <WarmButton
                size="sm"
                variant="outline"
                disabled={!data.hasNextPage}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </WarmButton>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
