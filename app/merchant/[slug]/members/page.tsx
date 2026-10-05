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
import { Plus, Trash2, Shield, UserCog, Eye, Users } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';

interface Member {
  id: string;
  userId: string;
  role: string;
  createdAt: string;
  user: {
    id: string;
    email: string;
    name: string | null;
    image: string | null;
  };
}

const ROLE_OPTIONS = [
  { value: 'merchant_admin', labelKey: 'admin', descriptionKey: 'adminDescription' },
  { value: 'merchant_staff', labelKey: 'staff', descriptionKey: 'staffDescription' },
] as const;

const ROLE_COLORS: Record<string, string> = {
  merchant_admin: 'bg-amber-100 text-amber-800 border-amber-200',
  merchant_staff: 'bg-blue-100 text-blue-800 border-blue-200',
};

const ROLE_ICONS: Record<string, React.ReactNode> = {
  merchant_admin: <Shield className="h-3 w-3" />,
  merchant_staff: <UserCog className="h-3 w-3" />,
};

export default function MembersPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('merchant_staff');
  const [inviting, setInviting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRole, setEditRole] = useState('');
  const t = useTranslations('merchantTeam.members');
  const tRoles = useTranslations('merchantTeam.roles');
  const locale = useLocale();
  const dateLocale = locale === 'en' ? 'en-GB' : locale;

  const getRoleLabel = (role: string): string => {
    const option = ROLE_OPTIONS.find((r) => r.value === role);
    return option ? tRoles(option.labelKey) : role;
  };

  const fetchMembers = useCallback(() => {
    fetch(`/api/merchant/${slug}/members`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setMembers(data);
      })
      .catch(() => showError(t('loadFailed')))
      .finally(() => setLoading(false));
  }, [slug, t]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;
    setInviting(true);
    try {
      const res = await fetch(`/api/merchant/${slug}/members/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || t('inviteFailed'));
      }
      const member = await res.json();
      setMembers((prev) => [...prev, member]);
      setInviteEmail('');
      setInviteRole('merchant_staff');
      setShowInvite(false);
      showSuccess(t('invited'));
    } catch (err) {
      showError(err instanceof Error ? err.message : t('inviteFailed'));
    } finally {
      setInviting(false);
    }
  };

  const handleChangeRole = async (memberId: string) => {
    try {
      const res = await fetch(`/api/merchant/${slug}/members/${memberId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: editRole }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || t('updateRoleFailed'));
      }
      const updated = await res.json();
      setMembers((prev) => prev.map((m) => (m.id === memberId ? updated : m)));
      setEditingId(null);
      showSuccess(t('roleUpdated'));
    } catch (err) {
      showError(err instanceof Error ? err.message : t('updateRoleFailed'));
    }
  };

  const handleRemove = async (memberId: string, memberName: string) => {
    showConfirm(t('removeConfirm', { name: memberName }), async () => {
      try {
        const res = await fetch(`/api/merchant/${slug}/members/${memberId}`, {
          method: 'DELETE',
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data?.error || t('removeFailed'));
        }
        setMembers((prev) => prev.filter((m) => m.id !== memberId));
        showSuccess(t('removed'));
      } catch (err) {
        showError(err instanceof Error ? err.message : t('removeFailed'));
      }
    }, { confirmLabel: t('remove'), variant: 'destructive' });
    return;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text)]">{t('title')}</h1>
          <p className="text-sm text-[var(--text-muted)]">
            {t('subtitle')}
          </p>
        </div>
        <WarmButton size="sm" onClick={() => setShowInvite(!showInvite)}>
          <Plus className="h-4 w-4 mr-1" /> {t('inviteMember')}
        </WarmButton>
      </div>

      {showInvite && (
        <WarmCard padding="lg" className="bg-[var(--surface)]">
          <h2 className="text-lg font-semibold text-[var(--text)] mb-4">{t('inviteTitle')}</h2>
          <form onSubmit={handleInvite} className="space-y-4">
            <div>
              <Label htmlFor="invite-email">{t('emailAddress')}</Label>
              <Input
                id="invite-email"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder={t('emailPlaceholder')}
                required
                className="border-[var(--border)]"
              />
              <p className="text-xs text-[var(--text-muted)] mt-1">
                {t('emailHint')}
              </p>
            </div>
            <div>
              <Label htmlFor="invite-role">{t('role')}</Label>
              <select
                id="invite-role"
                className="w-full h-10 rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 mt-1 text-sm"
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
              >
                {ROLE_OPTIONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {tRoles('optionWithDescription', { label: tRoles(r.labelKey), description: tRoles(r.descriptionKey) })}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <WarmButton type="submit" disabled={inviting}>
                {inviting ? t('inviting') : t('sendInvitation')}
              </WarmButton>
              <WarmButton type="button" variant="outline" onClick={() => setShowInvite(false)}>
                {t('cancel')}
              </WarmButton>
            </div>
          </form>
        </WarmCard>
      )}

      {loading ? (
        <p className="text-sm text-[var(--text-muted)]">{t('loading')}</p>
      ) : members.length === 0 ? (
        <WarmCard padding="lg" className="bg-[var(--surface)] text-center">
          <Users className="h-12 w-12 mx-auto text-[var(--text-muted)] mb-3" />
          <p className="text-[var(--text-muted)]">{t('empty')}</p>
        </WarmCard>
      ) : (
        <WarmCard padding="none" className="bg-[var(--surface)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--surface)]">
                  <th className="text-left px-4 py-3 font-medium text-[var(--text-muted)]">{t('columns.member')}</th>
                  <th className="text-left px-4 py-3 font-medium text-[var(--text-muted)]">{t('columns.role')}</th>
                  <th className="text-left px-4 py-3 font-medium text-[var(--text-muted)]">{t('columns.joined')}</th>
                  <th className="text-right px-4 py-3 font-medium text-[var(--text-muted)]">{t('columns.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {members.map((member) => (
                  <tr key={member.id} className="border-b border-[var(--border)] last:border-0">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[var(--surface)] flex items-center justify-center text-xs font-medium text-[var(--text-muted)]">
                          {(member.user.name || member.user.email).charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-[var(--text)]">
                            {member.user.name || t('unnamed')}
                          </p>
                          <p className="text-xs text-[var(--text-muted)]">{member.user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {editingId === member.id ? (
                        <div className="flex items-center gap-2">
                          <select
                            className="h-8 rounded-md border border-[var(--border)] bg-[var(--surface)] px-2 text-sm"
                            value={editRole}
                            onChange={(e) => setEditRole(e.target.value)}
                            aria-label={t('memberRole')}
                          >
                            {ROLE_OPTIONS.map((r) => (
                              <option key={r.value} value={r.value}>{tRoles(r.labelKey)}</option>
                            ))}
                          </select>
                          <WarmButton size="sm" onClick={() => handleChangeRole(member.id)}>
                            {t('save')}
                          </WarmButton>
                          <WarmButton size="sm" variant="outline" onClick={() => setEditingId(null)}>
                            {t('cancel')}
                          </WarmButton>
                        </div>
                      ) : (
                        <Badge
                          variant="outline"
                          className={`${ROLE_COLORS[member.role] || 'bg-gray-100 text-gray-800'} inline-flex items-center gap-1`}
                        >
                          {ROLE_ICONS[member.role]}
                          {getRoleLabel(member.role)}
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[var(--text-muted)]">
                      {new Date(member.createdAt).toLocaleDateString(dateLocale)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <WarmButton
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingId(member.id);
                            setEditRole(member.role);
                          }}
                          title={t('changeRole')}
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </WarmButton>
                        <WarmButton
                          size="sm"
                          variant="outline"
                          onClick={() => handleRemove(member.id, member.user.name || member.user.email)}
                          title={t('removeMember')}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </WarmButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </WarmCard>
      )}
    </div>
  );
}
