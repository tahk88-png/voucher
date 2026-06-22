'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { WarmCard } from '@/components/warm-card';
import { WarmButton } from '@/components/warm-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { showError, showSuccess } from '@/lib/toast-helpers';
import {
  Package,
  AlertTriangle,
  XCircle,
  CheckCircle,
  RefreshCw,
} from 'lucide-react';

interface InventoryItem {
  id: string;
  type: string;
  value: number;
  currency: string;
  status: string;
  stockQuantity: number | null;
  lowStockThreshold: number | null;
  campaignName: string | null;
  validFrom: string;
  validTo: string;
  totalPurchases: number;
  totalRedemptions: number;
  isLowStock: boolean;
  isOutOfStock: boolean;
}

interface LowStockAlert {
  voucherId: string;
  voucherType: string;
  voucherValue: number;
  currency: string;
  stockQuantity: number;
  lowStockThreshold: number;
  campaignName: string | null;
}

interface InventoryData {
  inventory: InventoryItem[];
  lowStockAlerts: LowStockAlert[];
  totalItems: number;
  outOfStockCount: number;
  lowStockCount: number;
}

function getStockColor(item: InventoryItem): string {
  if (item.stockQuantity === null) return 'text-blue-600 bg-blue-50 border-blue-200';
  if (item.isOutOfStock) return 'text-red-600 bg-red-50 border-red-200';
  if (item.isLowStock) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
  return 'text-green-600 bg-green-50 border-green-200';
}

function getStockLabel(item: InventoryItem): string {
  if (item.stockQuantity === null) return 'Unlimited';
  if (item.isOutOfStock) return 'Out of stock';
  if (item.isLowStock) return 'Low stock';
  return 'In stock';
}

function getStockIcon(item: InventoryItem) {
  if (item.stockQuantity === null) return <Package className="h-4 w-4" />;
  if (item.isOutOfStock) return <XCircle className="h-4 w-4" />;
  if (item.isLowStock) return <AlertTriangle className="h-4 w-4" />;
  return <CheckCircle className="h-4 w-4" />;
}

export default function InventoryPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [data, setData] = useState<InventoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editStock, setEditStock] = useState<string>('');
  const [editThreshold, setEditThreshold] = useState<string>('');
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/merchant/${slug}/inventory`);
      if (!res.ok) throw new Error();
      setData(await res.json());
    } catch {
      showError('Failed to load inventory');
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleEdit = (item: InventoryItem) => {
    setEditingId(item.id);
    setEditStock(item.stockQuantity === null ? '' : String(item.stockQuantity));
    setEditThreshold(
      item.lowStockThreshold === null ? '' : String(item.lowStockThreshold)
    );
  };

  const handleSave = async (voucherId: string) => {
    setSaving(true);
    try {
      const body: Record<string, unknown> = {};
      body.stockQuantity = editStock === '' ? null : parseInt(editStock, 10);
      body.lowStockThreshold = editThreshold === '' ? null : parseInt(editThreshold, 10);

      const res = await fetch(`/api/merchant/${slug}/inventory/${voucherId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed');
      }
      showSuccess('Stock updated');
      setEditingId(null);
      fetchData();
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to update stock');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text)]">Inventory</h1>
          <p className="text-sm text-[var(--text-muted)]">
            Track stock levels and manage voucher availability
          </p>
        </div>
        <WarmButton size="sm" variant="outline" onClick={fetchData} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </WarmButton>
      </div>

      {/* Summary cards */}
      {data && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <WarmCard padding="md" className="bg-[var(--surface)]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                <Package className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[var(--text)]">{data.totalItems}</p>
                <p className="text-xs text-[var(--text-muted)]">Total items</p>
              </div>
            </div>
          </WarmCard>
          <WarmCard padding="md" className="bg-[var(--surface)]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-yellow-50 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-yellow-600">{data.lowStockCount}</p>
                <p className="text-xs text-[var(--text-muted)]">Low stock</p>
              </div>
            </div>
          </WarmCard>
          <WarmCard padding="md" className="bg-[var(--surface)]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">{data.outOfStockCount}</p>
                <p className="text-xs text-[var(--text-muted)]">Out of stock</p>
              </div>
            </div>
          </WarmCard>
        </div>
      )}

      {/* Low stock alerts */}
      {data && data.lowStockAlerts.length > 0 && (
        <WarmCard padding="lg" className="bg-yellow-50 border-yellow-200">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            <h2 className="text-base font-semibold text-yellow-800">
              Low Stock Alerts ({data.lowStockAlerts.length})
            </h2>
          </div>
          <div className="space-y-2">
            {data.lowStockAlerts.map((alert) => (
              <div
                key={alert.voucherId}
                className="flex items-center justify-between bg-[var(--surface)] rounded-lg px-3 py-2 border border-yellow-200"
              >
                <div>
                  <span className="text-sm font-medium text-[var(--text)]">
                    {alert.campaignName || alert.voucherType}
                  </span>
                  <span className="text-xs text-[var(--text-muted)] ml-2">
                    ({alert.voucherValue / 100} {alert.currency})
                  </span>
                </div>
                <Badge variant="secondary" className="text-yellow-700 bg-yellow-100">
                  {alert.stockQuantity} / {alert.lowStockThreshold} threshold
                </Badge>
              </div>
            ))}
          </div>
        </WarmCard>
      )}

      {/* Inventory table */}
      {loading ? (
        <p className="text-sm text-[var(--text-muted)]">Loading inventory...</p>
      ) : !data || data.inventory.length === 0 ? (
        <WarmCard padding="lg" className="bg-[var(--surface)] text-center">
          <p className="text-[var(--text-muted)]">No vouchers found</p>
        </WarmCard>
      ) : (
        <div className="space-y-3">
          {data.inventory.map((item) => (
            <WarmCard key={item.id} padding="md" className="bg-[var(--surface)]">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-[var(--text)]">
                      {item.campaignName || `${item.type} voucher`}
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      {item.value / 100} {item.currency}
                    </Badge>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${getStockColor(item)}`}
                    >
                      {getStockIcon(item)}
                      {getStockLabel(item)}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-xs text-[var(--text-muted)]">
                    <span>
                      Stock: {item.stockQuantity === null ? 'Unlimited' : item.stockQuantity}
                    </span>
                    <span>Purchased: {item.totalPurchases}</span>
                    <span>Redeemed: {item.totalRedemptions}</span>
                    <span>
                      Valid until {new Date(item.validTo).toLocaleDateString()}
                    </span>
                  </div>

                  {editingId === item.id && (
                    <div className="mt-3 flex items-end gap-3 flex-wrap">
                      <div>
                        <Label className="text-xs">Stock quantity</Label>
                        <Input
                          type="number"
                          min="0"
                          value={editStock}
                          onChange={(e) => setEditStock(e.target.value)}
                          placeholder="Unlimited"
                          className="w-28 border-[var(--border)]"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Low stock threshold</Label>
                        <Input
                          type="number"
                          min="0"
                          value={editThreshold}
                          onChange={(e) => setEditThreshold(e.target.value)}
                          placeholder="10"
                          className="w-28 border-[var(--border)]"
                        />
                      </div>
                      <WarmButton
                        size="sm"
                        onClick={() => handleSave(item.id)}
                        disabled={saving}
                      >
                        {saving ? 'Saving...' : 'Save'}
                      </WarmButton>
                      <WarmButton
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingId(null)}
                      >
                        Cancel
                      </WarmButton>
                    </div>
                  )}
                </div>
                <div>
                  {editingId !== item.id && (
                    <WarmButton
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(item)}
                    >
                      Edit Stock
                    </WarmButton>
                  )}
                </div>
              </div>
            </WarmCard>
          ))}
        </div>
      )}
    </div>
  );
}
