'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { WarmButton } from '@/components/warm-button';
import { WarmCard } from '@/components/warm-card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { showError, showSuccess } from '@/lib/toast-helpers';
import { Plus, Trash2, Shield, UserCog, Eye, Users } from 'lucide-react';

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
  { value: 'merchant_admin', label: 'Admin', description: 'Full access — manage vouchers, campaigns, members, and settings' },
  { value: 'merchant_staff', label: 'Staff', description: 'Operational access — confirm redemptions and view data' },
];

const ROLE_COLORS: Record<string, string> = {
  merchant_admin: 'bg-amber-100 text-amber-800 border-amber-200',
  merchant_staff: 'bg-blue-100 text-blue-800 border-blue-200',
};

const ROLE_ICONS: Record<string, React.ReactNode> = {
  merchant_admin: <Shield className="h-3 w-3" />,
  merchant_staff: <UserCog className="h-3 w-3" />,
};

function getRoleLabel(role: string): string {
  return ROLE_OPTIONS.find((r) => r.value === role)?.label ?? role;
}

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

  const fetchMembers = useCallback(() => {
    fetch(`/api/merchant/${slug}/members`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setMembers(data);
      })
      .catch(() => showError('Failed to load team members'))
      .finally(() => setLoading(false));
  }, [slug]);

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
        throw new Error(data?.error || 'Failed to invite member');
      }
      const member = await res.json();
      setMembers((prev) => [...prev, member]);
      setInviteEmail('');
      setInviteRole('merchant_staff');
      setShowInvite(false);
      showSuccess('Member invited successfully');
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to invite member');
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
        throw new Error(data?.error || 'Failed to update role');
      }
      const updated = await res.json();
      setMembers((prev) => prev.map((m) => (m.id === memberId ? updated : m)));
      setEditingId(null);
      showSuccess('Role updated');
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to update role');
    }
  };

  const handleRemove = async (memberId: string, memberName: string) => {
    if (!confirm(`Remove ${memberName} from the team?`)) return;
    try {
      const res = await fetch(`/api/merchant/${slug}/members/${memberId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || 'Failed to remove member');
      }
      setMembers((prev) => prev.filter((m) => m.id !== memberId));
      showSuccess('Member removed');
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to remove member');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text)]">Team Members</h1>
          <p className="text-sm text-[var(--text-muted)]">
            Manage your team and their access levels
          </p>
        </div>
        <WarmButton size="sm" onClick={() => setShowInvite(!showInvite)}>
          <Plus className="h-4 w-4 mr-1" /> Invite Member
        </WarmButton>
      </div>

      {showInvite && (
        <WarmCard padding="lg" className="bg-white">
          <h2 className="text-lg font-semibold text-[var(--text)] mb-4">Invite Team Member</h2>
          <form onSubmit={handleInvite} className="space-y-4">
            <div>
              <Label htmlFor="invite-email">Email Address</Label>
              <Input
                id="invite-email"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="colleague@company.com"
                required
                className="border-[var(--border)]"
              />
              <p className="text-xs text-[var(--text-muted)] mt-1">
                The user must have an existing account.
              </p>
            </div>
            <div>
              <Label htmlFor="invite-role">Role</Label>
              <select
                id="invite-role"
                className="w-full h-10 rounded-md border border-[var(--border)] bg-white px-3 py-2 mt-1 text-sm"
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
              >
                {ROLE_OPTIONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label} — {r.description}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <WarmButton type="submit" disabled={inviting}>
                {inviting ? 'Inviting...' : 'Send Invitation'}
              </WarmButton>
              <WarmButton type="button" variant="outline" onClick={() => setShowInvite(false)}>
                Cancel
              </WarmButton>
            </div>
          </form>
        </WarmCard>
      )}

      {loading ? (
        <p className="text-sm text-[var(--text-muted)]">Loading team members...</p>
      ) : members.length === 0 ? (
        <WarmCard padding="lg" className="bg-white text-center">
          <Users className="h-12 w-12 mx-auto text-[var(--text-muted)] mb-3" />
          <p className="text-[var(--text-muted)]">No team members yet. Invite your first member above.</p>
        </WarmCard>
      ) : (
        <WarmCard padding="none" className="bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--surface)]">
                  <th className="text-left px-4 py-3 font-medium text-[var(--text-muted)]">Member</th>
                  <th className="text-left px-4 py-3 font-medium text-[var(--text-muted)]">Role</th>
                  <th className="text-left px-4 py-3 font-medium text-[var(--text-muted)]">Joined</th>
                  <th className="text-right px-4 py-3 font-medium text-[var(--text-muted)]">Actions</th>
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
                            {member.user.name || 'Unnamed'}
                          </p>
                          <p className="text-xs text-[var(--text-muted)]">{member.user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {editingId === member.id ? (
                        <div className="flex items-center gap-2">
                          <select
                            className="h-8 rounded-md border border-[var(--border)] bg-white px-2 text-sm"
                            value={editRole}
                            onChange={(e) => setEditRole(e.target.value)}
                          >
                            {ROLE_OPTIONS.map((r) => (
                              <option key={r.value} value={r.value}>{r.label}</option>
                            ))}
                          </select>
                          <WarmButton size="sm" onClick={() => handleChangeRole(member.id)}>
                            Save
                          </WarmButton>
                          <WarmButton size="sm" variant="outline" onClick={() => setEditingId(null)}>
                            Cancel
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
                      {new Date(member.createdAt).toLocaleDateString()}
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
                          title="Change role"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </WarmButton>
                        <WarmButton
                          size="sm"
                          variant="outline"
                          onClick={() => handleRemove(member.id, member.user.name || member.user.email)}
                          title="Remove member"
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
