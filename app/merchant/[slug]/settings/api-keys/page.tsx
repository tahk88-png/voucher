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
import { useLocale, useTranslations } from 'next-intl';

const AVAILABLE_PERMISSIONS = [
  { value: 'voucher.read', labelKey: 'voucherRead', group: 'vouchers' },
  { value: 'voucher.create', labelKey: 'voucherCreate', group: 'vouchers' },
  { value: 'voucher.redeem', labelKey: 'voucherRedeem', group: 'vouchers' },
  { value: 'campaign.read', labelKey: 'campaignRead', group: 'campaigns' },
  { value: 'campaign.create', labelKey: 'campaignCreate', group: 'campaigns' },
  { value: 'gift_card.read', labelKey: 'giftCardRead', group: 'giftCards' },
  { value: 'gift_card.redeem', labelKey: 'giftCardRedeem', group: 'giftCards' },
  { value: 'customer.read', labelKey: 'customerRead', group: 'customers' },
  { value: 'analytics.read', labelKey: 'analyticsRead', group: 'analytics' },
  { value: 'event.read', labelKey: 'eventRead', group: 'events' },
  { value: 'event.checkin', labelKey: 'eventCheckin', group: 'events' },
] as const;

type PermissionGroup = (typeof AVAILABLE_PERMISSIONS)[number]['group'];

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
  const t = useTranslations('merchantTeam.apiKeys');
  const locale = useLocale();
  const dateLocale = locale === 'en' ? 'en-GB' : locale;

  const fetchKeys = useCallback(() => {
    fetch(`/api/merchant/${slug}/api-keys`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setKeys(data);
      })
      .catch(() => showError(t('loadFailed')))
      .finally(() => setLoading(false));
  }, [slug, t]);

  useEffect(() => {
    fetchKeys();
  }, [fetchKeys]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || newPermissions.length === 0) {
      showError(t('required'));
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
        throw new Error(data?.error || t('createFailed'));
      }
      const created = await res.json();
      setNewKeySecret(created.key);
      setKeys((prev) => [created, ...prev]);
      setNewName('');
      setNewPermissions([]);
      setShowCreate(false);
      showSuccess(t('created'));
    } catch (err) {
      showError(err instanceof Error ? err.message : t('createFailed'));
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = async (keyId: string, keyName: string) => {
    showConfirm(t('revokeConfirm', { name: keyName }), async () => {
      try {
        const res = await fetch(`/api/merchant/${slug}/api-keys/${keyId}`, {
          method: 'DELETE',
        });
        if (!res.ok) throw new Error();
        setKeys((prev) => prev.filter((k) => k.id !== keyId));
        showSuccess(t('revoked'));
      } catch {
        showError(t('revokeFailed'));
      }
    }, { confirmLabel: t('revoke'), variant: 'destructive' });
    return;
  };

  const togglePermission = (perm: string) => {
    setNewPermissions((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
    );
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showSuccess(t('copied'));
  };

  // Group permissions for display
  const permissionGroups = AVAILABLE_PERMISSIONS.reduce(
    (groups, perm) => {
      if (!groups[perm.group]) groups[perm.group] = [];
      groups[perm.group].push(perm);
      return groups;
    },
    {} as Record<PermissionGroup, Array<(typeof AVAILABLE_PERMISSIONS)[number]>>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text)]">{t('title')}</h1>
          <p className="text-sm text-[var(--text-muted)]">
            {t('subtitle')}
          </p>
        </div>
        <WarmButton
          size="sm"
          onClick={() => {
            setShowCreate(!showCreate);
            setNewKeySecret(null);
          }}
        >
          <Plus className="h-4 w-4 mr-1" /> {t('createKey')}
        </WarmButton>
      </div>

      {newKeySecret && (
        <WarmCard padding="lg" className="bg-green-50 border-green-200">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-green-700 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-green-800 mb-2">
                {t('createdNotice')}
              </p>
              <div className="flex items-center gap-2">
                <code className="text-xs bg-[var(--surface)] px-3 py-2 rounded border flex-1 break-all font-mono">
                  {newKeySecret}
                </code>
                <WarmButton
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(newKeySecret)}
                  aria-label={t('copyKey')}
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
          <h2 className="text-lg font-semibold text-[var(--text)] mb-4">{t('createTitle')}</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <Label htmlFor="key-name">{t('keyName')}</Label>
              <Input
                id="key-name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder={t('keyNamePlaceholder')}
                required
                className="border-[var(--border)]"
              />
            </div>
            <div>
              <Label>{t('permissions')}</Label>
              <div className="mt-2 space-y-4">
                {(Object.entries(permissionGroups) as Array<[PermissionGroup, Array<(typeof AVAILABLE_PERMISSIONS)[number]>]>).map(([group, perms]) => (
                  <div key={group}>
                    <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-2">
                      {t(`groups.${group}`)}
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
                          {t(`permissionLabels.${perm.labelKey}`)}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <WarmButton type="submit" disabled={creating || !newName || newPermissions.length === 0}>
                {creating ? t('creating') : t('submit')}
              </WarmButton>
              <WarmButton type="button" variant="outline" onClick={() => setShowCreate(false)}>
                {t('cancel')}
              </WarmButton>
            </div>
          </form>
        </WarmCard>
      )}

      {loading ? (
        <p className="text-sm text-[var(--text-muted)]">{t('loading')}</p>
      ) : keys.length === 0 ? (
        <WarmCard padding="lg" className="bg-[var(--surface)] text-center">
          <Key className="h-12 w-12 mx-auto text-[var(--text-muted)] mb-3" />
          <p className="text-[var(--text-muted)]">{t('empty')}</p>
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
                    <span>{t('createdOn', { date: new Date(apiKey.createdAt).toLocaleDateString(dateLocale) })}</span>
                    {apiKey.lastUsedAt && (
                      <span>{t('lastUsed', { date: new Date(apiKey.lastUsedAt).toLocaleDateString(dateLocale) })}</span>
                    )}
                    {apiKey.expiresAt && (
                      <span>
                        {t('expires', { date: new Date(apiKey.expiresAt).toLocaleDateString(dateLocale) })}
                      </span>
                    )}
                  </div>
                </div>
                <WarmButton
                  size="sm"
                  variant="outline"
                  onClick={() => handleRevoke(apiKey.id, apiKey.name)}
                  title={t('revokeKey')}
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
