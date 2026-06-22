'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { WarmButton } from '@/components/warm-button';
import { WarmCard } from '@/components/warm-card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { showError, showSuccess } from '@/lib/toast-helpers';
import { showConfirm } from '@/lib/confirm-helpers';
import { Plus, Trash2, Copy, Key, AlertTriangle } from 'lucide-react';

const AVAILABLE_PERMISSIONS = [
  { value: 'voucher.read', label: 'Read Vouchers', group: 'Vouchers' },
  { value: 'voucher.create', label: 'Create Vouchers', group: 'Vouchers' },
  { value: 'voucher.redeem', label: 'Redeem Vouchers', group: 'Vouchers' },
  { value: 'campaign.read', label: 'Read Campaigns', group: 'Campaigns' },
  { value: 'campaign.create', label: 'Create Campaigns', group: 'Campaigns' },
  { value: 'gift_card.read', label: 'Read Gift Cards', group: 'Gift Cards' },
  { value: 'gift_card.redeem', label: 'Redeem Gift Cards', group: 'Gift Cards' },
  { value: 'customer.read', label: 'Read Customers', group: 'Customers' },
  { value: 'analytics.read', label: 'Read Analytics', group: 'Analytics' },
  { value: 'event.read', label: 'Read Events', group: 'Events' },
  { value: 'event.checkin', label: 'Check In Events', group: 'Events' },
];

interface ApiKeyItem {
  id: string;
  name: string;
  prefix: string;
  permissions: string[];
  lastUsedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  key?: string; // only on creation
}

export default function ApiKeysPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [keys, setKeys] = useState<ApiKeyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPermissions, setNewPermissions] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);
  const [newKeySecret, setNewKeySecret] = useState<string | null>(null);

  const fetchKeys = useCallback(() => {
    fetch(`/api/merchant/${slug}/api-keys`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setKeys(data);
      })
      .catch(() => showError('Failed to load API keys'))
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    fetchKeys();
  }, [fetchKeys]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || newPermissions.length === 0) {
      showError('Name and at least one permission are required');
      return;
    }
    setCreating(true);
    try {
      const res = await fetch(`/api/merchant/${slug}/api-keys`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName, permissions: newPermissions }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || 'Failed to create API key');
      }
      const created = await res.json();
      setNewKeySecret(created.key);
      setKeys((prev) => [created, ...prev]);
      setNewName('');
      setNewPermissions([]);
      setShowCreate(false);
      showSuccess('API key created');
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to create API key');
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = async (keyId: string, keyName: string) => {
    showConfirm(`Revoke API key "${keyName}"? This action cannot be undone.`, async () => {
      try {
        const res = await fetch(`/api/merchant/${slug}/api-keys/${keyId}`, {
          method: 'DELETE',
        });
        if (!res.ok) throw new Error();
        setKeys((prev) => prev.filter((k) => k.id !== keyId));
        showSuccess('API key revoked');
      } catch {
        showError('Failed to revoke API key');
      }
    }, { confirmLabel: 'Revoke', variant: 'destructive' });
    return;
  };

  const togglePermission = (perm: string) => {
    setNewPermissions((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
    );
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showSuccess('Copied to clipboard');
  };

  // Group permissions for display
  const permissionGroups = AVAILABLE_PERMISSIONS.reduce(
    (groups, perm) => {
      if (!groups[perm.group]) groups[perm.group] = [];
      groups[perm.group].push(perm);
      return groups;
    },
    {} as Record<string, typeof AVAILABLE_PERMISSIONS>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text)]">API Keys</h1>
          <p className="text-sm text-[var(--text-muted)]">
            Manage API keys for programmatic access to your merchant data
          </p>
        </div>
        <WarmButton
          size="sm"
          onClick={() => {
            setShowCreate(!showCreate);
            setNewKeySecret(null);
          }}
        >
          <Plus className="h-4 w-4 mr-1" /> Create Key
        </WarmButton>
      </div>

      {newKeySecret && (
        <WarmCard padding="lg" className="bg-green-50 border-green-200">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-green-700 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-green-800 mb-2">
                API key created! Copy it now — it will not be shown again.
              </p>
              <div className="flex items-center gap-2">
                <code className="text-xs bg-[var(--surface)] px-3 py-2 rounded border flex-1 break-all font-mono">
                  {newKeySecret}
                </code>
                <WarmButton
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(newKeySecret)}
                >
                  <Copy className="h-4 w-4" />
                </WarmButton>
              </div>
            </div>
          </div>
        </WarmCard>
      )}

      {showCreate && (
        <WarmCard padding="lg" className="bg-[var(--surface)]">
          <h2 className="text-lg font-semibold text-[var(--text)] mb-4">Create API Key</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <Label htmlFor="key-name">Key Name</Label>
              <Input
                id="key-name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g., Production POS Integration"
                required
                className="border-[var(--border)]"
              />
            </div>
            <div>
              <Label>Permissions</Label>
              <div className="mt-2 space-y-4">
                {Object.entries(permissionGroups).map(([group, perms]) => (
                  <div key={group}>
                    <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-2">
                      {group}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {perms.map((perm) => (
                        <button
                          key={perm.value}
                          type="button"
                          onClick={() => togglePermission(perm.value)}
                          className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                            newPermissions.includes(perm.value)
                              ? 'bg-[var(--primary)] text-white border-[var(--primary)]'
                              : 'bg-[var(--surface)] text-[var(--text-muted)] border-[var(--border)] hover:border-[var(--primary)]'
                          }`}
                        >
                          {perm.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <WarmButton type="submit" disabled={creating || !newName || newPermissions.length === 0}>
                {creating ? 'Creating...' : 'Create API Key'}
              </WarmButton>
              <WarmButton type="button" variant="outline" onClick={() => setShowCreate(false)}>
                Cancel
              </WarmButton>
            </div>
          </form>
        </WarmCard>
      )}

      {loading ? (
        <p className="text-sm text-[var(--text-muted)]">Loading API keys...</p>
      ) : keys.length === 0 ? (
        <WarmCard padding="lg" className="bg-[var(--surface)] text-center">
          <Key className="h-12 w-12 mx-auto text-[var(--text-muted)] mb-3" />
          <p className="text-[var(--text-muted)]">No API keys yet. Create one to get started.</p>
        </WarmCard>
      ) : (
        <div className="space-y-3">
          {keys.map((apiKey) => (
            <WarmCard key={apiKey.id} padding="md" className="bg-[var(--surface)]">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Key className="h-4 w-4 text-[var(--text-muted)]" />
                    <p className="font-medium text-[var(--text)]">{apiKey.name}</p>
                  </div>
                  <p className="text-xs text-[var(--text-muted)] font-mono mt-1">
                    {apiKey.prefix}
                  </p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {apiKey.permissions.map((perm) => (
                      <Badge key={perm} variant="secondary" className="text-xs">
                        {perm}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-xs text-[var(--text-muted)]">
                    <span>Created {new Date(apiKey.createdAt).toLocaleDateString()}</span>
                    {apiKey.lastUsedAt && (
                      <span>Last used {new Date(apiKey.lastUsedAt).toLocaleDateString()}</span>
                    )}
                    {apiKey.expiresAt && (
                      <span>
                        Expires {new Date(apiKey.expiresAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                <WarmButton
                  size="sm"
                  variant="outline"
                  onClick={() => handleRevoke(apiKey.id, apiKey.name)}
                  title="Revoke key"
                >
                  <Trash2 className="h-4 w-4" />
                </WarmButton>
              </div>
            </WarmCard>
          ))}
        </div>
      )}
    </div>
  );
}
