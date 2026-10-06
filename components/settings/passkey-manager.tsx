'use client';

import { useCallback, useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Fingerprint, Trash2, Plus, ShieldCheck } from 'lucide-react';
import { WarmCard } from '@/components/warm-card';
import { WarmButton } from '@/components/warm-button';
import { usePasskey } from '@/hooks/use-passkey';
import { apiErrorText } from '@/components/settings/api-error-text';

type Passkey = {
  id: string;
  deviceType: string | null;
  backedUp: boolean;
  friendlyName: string | null;
  lastUsedAt: string | null;
  createdAt: string;
};

/**
 * Passkey (WebAuthn) management. The full ceremony lives in the usePasskey
 * hook + /api/auth/passkey/* routes; this component is the missing UI to
 * register, list, and remove passkeys from the security settings page.
 */
export function PasskeyManager() {
  const t = useTranslations('accountSecurity');
  const locale = useLocale();
  const { startRegistration, isLoading: registering, error: registerError } = usePasskey();
  const [passkeys, setPasskeys] = useState<Passkey[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [supported, setSupported] = useState(true);
  const [showNameForm, setShowNameForm] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/passkey/list');
      if (!res.ok) throw new Error(`Loading passkeys failed (HTTP ${res.status})`);
      const data = await res.json();
      setPasskeys(data.passkeys ?? []);
    } catch (err) {
      console.error('Loading passkeys failed', err);
      setLocalError(t('passkeys.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    setSupported(typeof window !== 'undefined' && !!window.PublicKeyCredential);
    load();
  }, [load]);

  const handleNameSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setShowNameForm(false);
    const ok = await startRegistration(nameInput.trim() || undefined);
    setNameInput('');
    if (ok) await load();
  }, [startRegistration, load, nameInput]);

  const handleDelete = useCallback(async (id: string) => {
    setConfirmDeleteId(null);
    setDeletingId(id);
    setLocalError(null);
    try {
      const res = await fetch(`/api/auth/passkey/list?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`Removing the passkey failed (HTTP ${res.status})`);
      setPasskeys((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error('Removing passkey failed', err);
      setLocalError(t('passkeys.removeFailed'));
    } finally {
      setDeletingId(null);
    }
  }, [t]);

  const error = localError || (registerError ? apiErrorText(t, registerError, registerError) : null);
  const formatDate = (iso: string) => new Date(iso).toLocaleDateString(locale);

  return (
    <WarmCard padding="lg" className="bg-white border border-[rgba(139,115,85,0.15)]">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-[var(--surface)]">
            <Fingerprint className="h-5 w-5 text-[#8B7355]" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[#2D2721]">{t('passkeys.title')}</h2>
            <p className="text-sm text-[#6B5744] mt-0.5">
              {t('passkeys.description')}
            </p>
          </div>
        </div>
        {supported && !showNameForm && (
          <WarmButton onClick={() => setShowNameForm(true)} disabled={registering} className="shrink-0">
            <Plus className="h-4 w-4 mr-1" />
            {t('passkeys.add')}
          </WarmButton>
        )}
      </div>

      {showNameForm && (
        <form onSubmit={handleNameSubmit} className="mt-4 flex gap-2 items-center">
          <input
            autoFocus
            type="text"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            placeholder={t('passkeys.namePlaceholder')}
            className="flex-1 rounded-lg border border-[rgba(139,115,85,0.3)] px-3 py-2 text-sm text-[#2D2721] bg-white focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30"
          />
          <WarmButton type="submit" size="sm" disabled={registering}>
            {registering ? t('passkeys.adding') : t('passkeys.addSubmit')}
          </WarmButton>
          <WarmButton type="button" size="sm" variant="ghost" onClick={() => { setShowNameForm(false); setNameInput(''); }}>
            {t('common.cancel')}
          </WarmButton>
        </form>
      )}

      {!supported && (
        <p className="mt-4 text-sm text-[#6B5744]">
          {t('passkeys.unsupported')}
        </p>
      )}

      {error && (
        <p className="mt-4 text-sm text-[var(--danger)]">{error}</p>
      )}

      <div className="mt-5 space-y-2">
        {loading ? (
          <div className="animate-pulse space-y-2">
            <div className="h-12 bg-gray-100 rounded-lg" />
            <div className="h-12 bg-gray-100 rounded-lg" />
          </div>
        ) : passkeys.length === 0 ? (
          <div className="text-center py-6 text-sm text-[#6B5744]">
            {t('passkeys.empty')}
          </div>
        ) : (
          passkeys.map((pk) => (
            <div
              key={pk.id}
              className="flex items-center justify-between gap-3 p-3 rounded-lg border border-[rgba(139,115,85,0.12)]"
            >
              <div className="flex items-center gap-3 min-w-0">
                <ShieldCheck className="h-4 w-4 text-[#9DB5A5] shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[#2D2721] truncate">
                    {pk.friendlyName || (pk.deviceType === 'singleDevice' ? t('passkeys.devicePasskey') : t('passkeys.passkey'))}
                  </p>
                  <p className="text-xs text-[#6B5744]">
                    {[
                      t('passkeys.added', { date: formatDate(pk.createdAt) }),
                      pk.lastUsedAt ? t('passkeys.lastUsed', { date: formatDate(pk.lastUsedAt) }) : null,
                      pk.backedUp ? t('passkeys.synced') : null,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                </div>
              </div>
              {confirmDeleteId === pk.id ? (
                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-xs text-[#6B5744] mr-1">{t('passkeys.removeConfirm')}</span>
                  <WarmButton
                    size="sm"
                    variant="ghost"
                    className="text-[var(--danger)] hover:bg-[var(--danger)]/10 text-xs px-2 py-1"
                    onClick={() => handleDelete(pk.id)}
                    disabled={deletingId === pk.id}
                  >
                    {deletingId === pk.id ? '…' : t('passkeys.remove')}
                  </WarmButton>
                  <WarmButton
                    size="sm"
                    variant="ghost"
                    className="text-xs px-2 py-1"
                    onClick={() => setConfirmDeleteId(null)}
                  >
                    {t('common.cancel')}
                  </WarmButton>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDeleteId(pk.id)}
                  disabled={deletingId === pk.id}
                  aria-label={t('passkeys.removeLabel')}
                  className="p-2 rounded-lg text-[var(--danger)] hover:bg-[var(--danger)]/10 transition-colors disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </WarmCard>
  );
}
