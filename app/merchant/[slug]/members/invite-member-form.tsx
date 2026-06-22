'use client';

import { useState } from 'react';
import { WarmButton } from '@/components/warm-button';
import { WarmCard } from '@/components/warm-card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { showError, showSuccess } from '@/lib/toast-helpers';
import { useRouter } from 'next/navigation';

export default function InviteMemberForm({ merchantSlug }: { merchantSlug: string }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'merchant_admin' | 'merchant_staff'>('merchant_staff');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch(`/api/merchant/${merchantSlug}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const message = data?.error || 'Failed to invite member';
        const upgradePath = data?.details?.upgradePath as string | undefined;
        if (res.status === 402 && upgradePath) {
          showError(`${message} Redirecting to billing...`);
          router.push(upgradePath);
          return;
        }
        throw new Error(message);
      }

      showSuccess('Member invited successfully');
      setEmail('');
      setRole('merchant_staff');
      window.location.reload();
    } catch (e) {
      showError(e instanceof Error ? e.message : 'Failed to invite member');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <WarmCard padding="lg" className="bg-[var(--surface)] border border-[var(--border)]">
      <div>
        <h2 className="text-base font-semibold text-[var(--text)]">Invite team member</h2>
        <p className="text-sm text-[var(--text-muted)]">Add a team member by their email address.</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4 mt-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="member@example.com"
            required
            className="mt-1 border-[var(--border)]"
          />
          <p className="text-sm text-[var(--text-muted)] mt-1">
            User must have an account. If they do not have one, they need to sign up first.
          </p>
        </div>
        <div>
          <Label htmlFor="role">Role</Label>
          <select
            id="role"
            className="w-full h-10 rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 mt-1 text-sm"
            value={role}
            onChange={(e) => setRole(e.target.value as 'merchant_admin' | 'merchant_staff')}
          >
            <option value="merchant_staff">Staff</option>
            <option value="merchant_admin">Admin</option>
          </select>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            Admins can manage vouchers, campaigns, and team members. Staff can confirm redemptions.
          </p>
        </div>
        <WarmButton type="submit" disabled={isLoading} className="w-full">
          {isLoading ? 'Inviting...' : 'Invite member'}
        </WarmButton>
      </form>
    </WarmCard>
  );
}
