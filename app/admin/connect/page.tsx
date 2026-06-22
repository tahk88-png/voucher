import { requireAdminPermission } from '@/lib/admin/guards';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { WarmCard } from '@/components/warm-card';
import { CheckCircle2, AlertCircle, Clock, Minus } from 'lucide-react';
import { pageMetadata } from '@/lib/seo/page-metadata';

export const metadata = pageMetadata({ title: 'Stripe Connect Oversight', noIndex: true });

/**
 * Platform-admin view: which merchants have Stripe Connect onboarded,
 * which are stuck in onboarding, and which never started.
 *
 * Reuses `admin.billing.read` (Connect status is adjacent to billing)
 * to avoid a new permission. The list is intentionally flat — no
 * filters, no pagination — because the expected cardinality is low
 * (tens to low hundreds of merchants) and sorting merchants by their
 * onboarding state is the only interesting cut.
 */
export default async function AdminConnectPage() {
  await requireAdminPermission('admin.billing.read');

  const merchants = await prisma.merchant.findMany({
    where: { deletedAt: null },
    orderBy: [{ payoutsEnabled: 'desc' }, { updatedAt: 'desc' }],
    select: {
      id: true,
      name: true,
      slug: true,
      country: true,
      stripeAccountId: true,
      stripeAccountStatus: true,
      payoutsEnabled: true,
      updatedAt: true,
    },
  });

  const connected = merchants.filter((m) => m.stripeAccountId && m.payoutsEnabled);
  const inProgress = merchants.filter(
    (m) => m.stripeAccountId && !m.payoutsEnabled,
  );
  const notStarted = merchants.filter((m) => !m.stripeAccountId);

  const sections = [
    {
      label: 'Enabled',
      icon: CheckCircle2,
      iconClass: 'text-green-600',
      items: connected,
      empty: 'No merchants have completed Stripe onboarding yet.',
    },
    {
      label: 'In progress / restricted',
      icon: AlertCircle,
      iconClass: 'text-amber-600',
      items: inProgress,
      empty: 'No merchants are mid-onboarding.',
    },
    {
      label: 'Not started',
      icon: Clock,
      iconClass: 'text-gray-500',
      items: notStarted,
      empty: 'All merchants have at least started Connect onboarding.',
    },
  ];

  return (
    <div className="p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-semibold text-[var(--text)] mb-2">
          Stripe Connect oversight
        </h1>
        <p className="text-sm text-[var(--text-muted)] mb-6">
          Per-merchant onboarding state. The figures on this page come from
          cached columns on the Merchant model; Stripe is authoritative and
          updates flow through the <code className="font-mono">account.updated</code>{' '}
          webhook.
        </p>

        <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <WarmCard padding="md" className="bg-[var(--surface)]">
            <p className="text-sm text-[var(--text-muted)]">Enabled</p>
            <p className="text-2xl font-semibold text-green-700">{connected.length}</p>
          </WarmCard>
          <WarmCard padding="md" className="bg-[var(--surface)]">
            <p className="text-sm text-[var(--text-muted)]">In progress</p>
            <p className="text-2xl font-semibold text-amber-700">{inProgress.length}</p>
          </WarmCard>
          <WarmCard padding="md" className="bg-[var(--surface)]">
            <p className="text-sm text-[var(--text-muted)]">Not started</p>
            <p className="text-2xl font-semibold text-gray-700">{notStarted.length}</p>
          </WarmCard>
        </div>

        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <section key={section.label} className="mb-6">
              <div className="mb-2 flex items-center gap-2">
                <Icon className={`h-4 w-4 ${section.iconClass}`} />
                <h2 className="text-base font-semibold text-[var(--text)]">{section.label}</h2>
                <span className="text-xs text-[var(--text-muted)]">({section.items.length})</span>
              </div>
              {section.items.length === 0 ? (
                <p className="text-sm text-[var(--text-muted)] italic">{section.empty}</p>
              ) : (
                <WarmCard padding="none" className="overflow-hidden bg-[var(--surface)]">
                  <div className="divide-y divide-[var(--border)]">
                    {section.items.map((m) => (
                      <div
                        key={m.id}
                        className="flex items-center justify-between gap-4 p-3 hover:bg-[var(--bg)]"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-[var(--text)]">
                            {m.name}
                          </p>
                          <p className="text-xs text-[var(--text-muted)]">
                            /{m.slug} · {m.country}
                          </p>
                        </div>
                        <div className="hidden flex-1 truncate sm:block">
                          {m.stripeAccountId ? (
                            <code className="text-xs text-[var(--text-muted)]">
                              {m.stripeAccountId}
                            </code>
                          ) : (
                            <span className="text-xs text-[var(--text-faint)] italic flex items-center gap-1">
                              <Minus className="h-3 w-3" /> no account
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-[var(--text-muted)] capitalize">
                            {m.stripeAccountStatus ?? 'pending'}
                          </span>
                          <Link
                            href={`/merchant/${m.slug}/settings/payouts`}
                            className="text-xs font-medium text-[var(--text)] underline underline-offset-2"
                            prefetch={false}
                          >
                            Open
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </WarmCard>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
