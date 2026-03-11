import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { AccessControlError, requirePlatformAdminProfile } from '@/lib/access-control';
import { WarmCard } from '@/components/warm-card';
import { WarmButton } from '@/components/warm-button';
import Link from 'next/link';
import {
  Shield, Users, FileText, Flag, CreditCard, AlertTriangle,
  Activity, BarChart3, Database, Lock, Eye, Settings, Gift,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Super Admin Control Panel',
  robots: { index: false, follow: false },
};

const sections = [
  {
    title: 'User Management',
    icon: Users,
    color: 'bg-blue-100 text-blue-700',
    links: [
      { label: 'All Users', href: '/admin/users', desc: 'Search, view, edit user accounts' },
      { label: 'User Search (Global)', href: '/admin/users?tab=search', desc: 'Search by email, ID, IP, payment' },
    ],
  },
  {
    title: 'Audit & Compliance',
    icon: FileText,
    color: 'bg-amber-100 text-amber-700',
    links: [
      { label: 'Audit Log', href: '/admin', desc: 'Platform audit trail' },
      { label: 'Hash-Chain Audit', api: '/api/admin/audit', desc: 'Tamper-proof admin action log' },
      { label: 'Verify Chain Integrity', api: '/api/admin/audit/verify', desc: 'Validate audit hash chain' },
      { label: 'Export Audit CSV', api: '/api/admin/audit/export', desc: 'Download full audit trail' },
    ],
  },
  {
    title: 'Content Moderation',
    icon: AlertTriangle,
    color: 'bg-red-100 text-red-700',
    links: [
      { label: 'Report Queue', href: '/admin/moderation', desc: 'Review user reports' },
      { label: 'Moderation Actions', api: '/api/admin/moderation/actions', desc: 'Bans, warnings, strikes (API)' },
      { label: 'Appeals', href: '/admin/appeals', desc: 'Review and resolve user appeals' },
    ],
  },
  {
    title: 'Billing & Payments',
    icon: CreditCard,
    color: 'bg-green-100 text-green-700',
    links: [
      { label: 'Billing Dashboard', href: '/admin/billing', desc: 'Subscriptions, refunds, payout holds' },
      { label: 'Subscriptions API', api: '/api/admin/billing/subscriptions', desc: 'Active subscription overview' },
      { label: 'Failed Payments API', api: '/api/admin/billing/failed-payments', desc: 'Payment retry queue' },
    ],
  },
  {
    title: 'Feature Flags',
    icon: Flag,
    color: 'bg-purple-100 text-purple-700',
    links: [
      { label: 'Feature Flags UI', href: '/admin/flags', desc: 'Manage feature rollouts visually' },
      { label: 'Evaluate Flag (API)', api: '/api/flags/evaluate', desc: 'Test flag evaluation' },
    ],
  },
  {
    title: 'System Operations',
    icon: Activity,
    color: 'bg-teal-100 text-teal-700',
    links: [
      { label: 'Ops Dashboard', href: '/admin/ops', desc: 'Health, jobs, migrations, metrics' },
      { label: 'Prometheus Metrics', api: '/api/admin/ops/metrics/prometheus', desc: 'Raw Prometheus metrics' },
      { label: 'DNS Health', api: '/api/admin/ops/dns-health', desc: 'DNS health check' },
    ],
  },
  {
    title: 'Analytics',
    icon: BarChart3,
    color: 'bg-indigo-100 text-indigo-700',
    links: [
      { label: 'Analytics Dashboard', href: '/admin/analytics', desc: 'KPIs, revenue, cohorts' },
      { label: 'Export CSV', api: '/api/admin/analytics/export', desc: 'Download analytics CSV' },
    ],
  },
  {
    title: 'Security',
    icon: Lock,
    color: 'bg-rose-100 text-rose-700',
    links: [
      { label: 'Legal Holds', api: '/api/admin/legal-holds', desc: 'GDPR legal holds preventing deletion' },
      { label: 'Step-Up Auth', api: '/api/admin/auth/step-up', desc: 'Re-authenticate for sensitive ops' },
      { label: 'Admin Profile', api: '/api/admin/auth/me', desc: 'View current admin permissions' },
    ],
  },
  {
    title: 'Support',
    icon: Eye,
    color: 'bg-cyan-100 text-cyan-700',
    links: [
      { label: 'Support Cases', href: '/admin/support', desc: 'Customer support queue with notes' },
    ],
  },
  {
    title: 'Gift Hub',
    icon: Gift,
    color: 'bg-orange-100 text-orange-700',
    links: [
      { label: 'Gift Dashboard', href: '/admin/gifts', desc: 'Gift products, modules, analytics' },
      { label: 'Categories', api: '/api/admin/gifts/categories', desc: 'Gift categories management' },
      { label: 'Occasions', api: '/api/admin/gifts/occasions', desc: 'Gift occasions management' },
      { label: 'Personas', api: '/api/admin/gifts/personas', desc: 'Recipient persona management' },
      { label: 'Feed Modules', api: '/api/admin/gifts/modules', desc: 'Curated feed modules' },
      { label: 'Sponsorships', api: '/api/admin/gifts/sponsors', desc: 'Sponsored gift placements' },
      { label: 'Analytics', api: '/api/admin/gifts/analytics', desc: 'Gift feed performance metrics' },
    ],
  },
];

export default async function ControlPanelPage() {
  try {
    await requirePlatformAdminProfile();
  } catch (error) {
    if (error instanceof AccessControlError && error.status === 401) {
      redirect('/login');
    }
    redirect('/app');
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] p-4">
      <div className="container mx-auto max-w-6xl">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-[14px] bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shadow-warm">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-[#2D2721]">Super Admin Control Panel</h1>
            <p className="text-[#6B5744]">Full platform control — RBAC, audit, moderation, billing, flags, ops, analytics.</p>
          </div>
          <div className="flex gap-2">
            <WarmButton asChild variant="outline" size="sm">
              <Link href="/admin">
                <Settings className="h-4 w-4 mr-1" />
                Admin Dashboard
              </Link>
            </WarmButton>
            <WarmButton asChild variant="outline" size="sm">
              <Link href="/admin/users">
                <Users className="h-4 w-4 mr-1" />
                Users
              </Link>
            </WarmButton>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <WarmCard key={section.title} padding="lg" className="bg-white">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${section.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <h2 className="text-lg font-semibold text-[#2D2721]">{section.title}</h2>
                </div>
                <div className="space-y-2">
                  {section.links.map((link) => {
                    const href = link.href || link.api || '#';
                    const isApi = !!link.api;
                    return (
                      <a
                        key={link.label}
                        href={href}
                        target={isApi ? '_blank' : undefined}
                        rel={isApi ? 'noopener noreferrer' : undefined}
                        className="block px-3 py-2 rounded-lg hover:bg-[#FAF7F2] transition-colors group"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-[#2D2721] group-hover:text-[var(--primary)]">
                            {link.label}
                          </span>
                          {isApi && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 font-mono">
                              API
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#8B7355] mt-0.5">{link.desc}</p>
                      </a>
                    );
                  })}
                </div>
              </WarmCard>
            );
          })}
        </div>

        <div className="mt-8 p-4 rounded-xl border border-amber-200 bg-amber-50/60">
          <div className="flex items-start gap-3">
            <Database className="h-5 w-5 text-amber-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-amber-900">API-First Architecture</h3>
              <p className="text-sm text-amber-800 mt-1">
                All admin subsystems are accessible via REST API endpoints. Links marked &quot;API&quot; open
                the JSON endpoint directly. Use these for integration testing, automation,
                or building custom admin UIs.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
