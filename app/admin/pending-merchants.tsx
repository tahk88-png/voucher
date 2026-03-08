'use client';

import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { WarmButton } from '@/components/warm-button';
import { showError, showSuccess } from '@/lib/toast-helpers';

interface PendingMerchant {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
}

export default function PendingMerchants({ merchants: initial }: { merchants: PendingMerchant[] }) {
  const [merchants, setMerchants] = useState(initial);
  const [loading, setLoading] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PendingMerchant | null>(null);

  const handleApprove = async (id: string) => {
    setLoading(id);
    try {
      const res = await fetch(`/api/admin/merchants/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: true }),
      });
      if (!res.ok) throw new Error('Failed to approve');
      setMerchants((prev) => prev.filter((m) => m.id !== id));
      showSuccess('Merchant approved');
    } catch {
      showError('Failed to approve merchant');
    } finally {
      setLoading(null);
    }
  };

  const handleDeleteConfirmed = async () => {
    if (!deleteTarget) return;
    const { id } = deleteTarget;
    setDeleteTarget(null);
    setLoading(id);
    try {
      const res = await fetch(`/api/admin/merchants/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      setMerchants((prev) => prev.filter((m) => m.id !== id));
      showSuccess('Merchant deleted');
    } catch {
      showError('Failed to delete merchant');
    } finally {
      setLoading(null);
    }
  };

  if (merchants.length === 0) {
    return <p className="text-sm text-[var(--text-muted)]">No pending merchants</p>;
  }

  return (
    <>
      <div className="space-y-3">
        {merchants.map((m) => (
          <div key={m.id} className="flex items-center justify-between p-3 bg-[var(--surface-dim)] rounded-xl">
            <div>
              <div className="font-medium text-[var(--text)] text-sm">{m.name}</div>
              <div className="text-xs text-[var(--text-faint)]">{m.slug} &middot; {new Date(m.createdAt).toLocaleDateString()}</div>
            </div>
            <div className="flex gap-2">
              <WarmButton size="sm" onClick={() => handleApprove(m.id)} disabled={loading === m.id}>
                Approve
              </WarmButton>
              <WarmButton
                size="sm"
                variant="outline"
                onClick={() => setDeleteTarget(m)}
                disabled={loading === m.id}
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                Delete
              </WarmButton>
            </div>
          </div>
        ))}
      </div>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete merchant?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deleteTarget?.name}</strong> ({deleteTarget?.slug})?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirmed}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
