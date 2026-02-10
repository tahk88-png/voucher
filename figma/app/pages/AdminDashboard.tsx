import { useMemo } from 'react';
import { useNavigate } from '@/lib/router-shim';
import { WarmCard } from '@app/components/WarmCard';
import { WarmButton } from '@app/components/WarmButton';
import { useCountry } from '@app/contexts/CountryContext';
import { useLanguage } from '@app/contexts/LanguageContext';
import { useAdminSettings } from '@app/contexts/AdminSettings';
import {
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Bell,
  CheckCircle2,
  Globe2,
  LineChart as LineChartIcon,
  MessageCircle,
  MessageSquare,
  Shield,
  Sparkles,
  Store,
  Users,
  Wallet,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

type AdminCopy = {
  heading: string;
  summary: string;
  badge: string;
  riskTitle: string;
  watchlistTitle: string;
  controlTitle: string;
};

const adminCopy: Record<'et' | 'en', AdminCopy> = {
  et: {
    heading: 'Admin juhtkeskus',
    summary: 'Halda platvormi tervist, kaupmehi ja kvaliteedisignaale uhest vaates.',
    badge: '2026 Governance Layer',
    riskTitle: 'Riski ja kvaliteedi signaalid',
    watchlistTitle: 'Merchant watchlist',
    controlTitle: 'Widget kontroll',
  },
  en: {
    heading: 'Admin command center',
    summary: 'Manage platform health, merchant quality and operations from one modern control layer.',
    badge: '2026 Governance Layer',
    riskTitle: 'Risk and quality signals',
    watchlistTitle: 'Merchant watchlist',
    controlTitle: 'Widget control',
  },
};

const growthTrend = [
  { month: 'Jan', users: 39200, merchants: 980, mrr: 1820000 },
  { month: 'Feb', users: 40750, merchants: 1040, mrr: 1960000 },
  { month: 'Mar', users: 42310, merchants: 1112, mrr: 2110000 },
  { month: 'Apr', users: 43620, merchants: 1179, mrr: 2250000 },
  { month: 'May', users: 44680, merchants: 1228, mrr: 2360000 },
  { month: 'Jun', users: 45920, merchants: 1264, mrr: 2480000 },
];

const regionalRevenue = [
  { market: 'EE', revenue: 480000 },
  { market: 'LV', revenue: 365000 },
  { market: 'LT', revenue: 402000 },
  { market: 'FI', revenue: 522000 },
  { market: 'SE', revenue: 298000 },
  { market: 'NO', revenue: 355000 },
];

const riskSignals = [
  {
    id: 1,
    title: '7 merchants have delayed subscription payments.',
    severity: 'high',
    href: '/billing',
  },
  {
    id: 2,
    title: 'Email delivery dropped to 94.8% in one segment.',
    severity: 'medium',
    href: '/admin/email-templates',
  },
  {
    id: 3,
    title: '2 campaigns have policy conflicts in ad copy.',
    severity: 'low',
    href: '/campaigns-list',
  },
];

const merchantWatchlist = [
  { id: 1, name: 'Nordic Fashion Hub', market: 'FI', status: 'healthy', score: 96 },
  { id: 2, name: 'Tallinn Events', market: 'EE', status: 'warning', score: 72 },
  { id: 3, name: 'City Deals Riga', market: 'LV', status: 'warning', score: 69 },
  { id: 4, name: 'Wellness District', market: 'LT', status: 'critical', score: 45 },
];

const controlActions = [
  { id: 1, title: 'Review pending merchant approvals', href: '/admin-dashboard' },
  { id: 2, title: 'Audit payout anomalies by market', href: '/billing' },
  { id: 3, title: 'Publish compliance update to all merchants', href: '/admin/email-templates' },
];

export function AdminDashboard() {
  const navigate = useNavigate();
  const { selectedCountry } = useCountry();
  const { language } = useLanguage();
  const { chatEnabled, feedbackEnabled, setChatEnabled, setFeedbackEnabled } = useAdminSettings();

  const copy = useMemo(() => adminCopy[language], [language]);

  const kpis = [
    {
      id: 'users',
      label: 'Total Users',
      value: '45.9k',
      trend: '+6.2%',
      icon: Users,
      tone: 'from-[#FFF0CC] to-[#FFE1A1]',
    },
    {
      id: 'merchants',
      label: 'Active Merchants',
      value: '1,264',
      trend: '+3.4%',
      icon: Store,
      tone: 'from-[#E8F5EC] to-[#D9EEDC]',
    },
    {
      id: 'mrr',
      label: 'Platform MRR',
      value: 'EUR 2.48M',
      trend: '+5.1%',
      icon: Wallet,
      tone: 'from-[#FFE8DB] to-[#FFD8C7]',
    },
    {
      id: 'uptime',
      label: 'System Uptime',
      value: '99.97%',
      trend: 'healthy',
      icon: Shield,
      tone: 'from-[#EAF1FF] to-[#DDE9FF]',
    },
  ];

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 pb-8 animate-fade-up">
      <WarmCard
        padding="lg"
        className="relative overflow-hidden border border-[rgba(139,115,85,0.16)] bg-[linear-gradient(135deg,rgba(255,250,238,0.95),rgba(255,236,199,0.84))] shadow-warm-lg"
      >
        <div className="pointer-events-none absolute -right-14 -top-20 h-56 w-56 rounded-full bg-[#FFDCA3]/70 blur-3xl" />
        <div className="pointer-events-none absolute bottom-[-66px] left-[30%] h-44 w-44 rounded-full bg-[#FFE8D8]/72 blur-3xl" />

        <div className="relative grid gap-6 lg:grid-cols-[1.35fr_0.95fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#E7D4B0] bg-white/78 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8B7355]">
              <Sparkles className="h-3.5 w-3.5" />
              {copy.badge}
            </div>
            <h1 className="mt-3 text-[26px] font-bold leading-[1.08] text-[#2D2721] sm:text-[30px]">{copy.heading}</h1>
            <p className="mt-3 max-w-2xl text-sm text-[#5F4D3C] sm:text-base">{copy.summary}</p>

            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <button
                onClick={() => navigate('/analytics')}
                className="inline-flex w-full items-center justify-center gap-2 rounded-[12px] border border-[#E2C987] bg-white/80 px-4 py-2 text-sm font-semibold text-[#2D2721] transition-all hover:shadow-warm sm:w-auto"
              >
                Open Analytics
                <ArrowRight className="h-4 w-4" />
              </button>
              <button
                onClick={() => navigate('/admin/email-templates')}
                className="inline-flex w-full items-center justify-center gap-2 rounded-[12px] border border-[rgba(139,115,85,0.2)] bg-white/72 px-4 py-2 text-sm font-semibold text-[#2D2721] transition-all hover:bg-white sm:w-auto"
              >
                Broadcast Center
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <div className="rounded-[14px] border border-[rgba(139,115,85,0.14)] bg-white/75 px-4 py-3">
              <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8B7355]">Focus market</div>
              <div className="mt-1 flex items-center gap-2 text-base font-bold text-[#2D2721]">
                <span className="inline-flex h-6 min-w-[2rem] items-center justify-center rounded-md border border-[#D9CBB4] bg-[#FAF7F2] px-2 text-[11px] font-bold">
                  {selectedCountry.flag}
                </span>
                {selectedCountry.code}
              </div>
            </div>
            <div className="rounded-[14px] border border-[rgba(139,115,85,0.14)] bg-white/75 px-4 py-3">
              <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8B7355]">Policy alerts</div>
              <div className="mt-1 text-2xl font-bold text-[#2D2721]">4</div>
            </div>
            <div className="rounded-[14px] border border-[rgba(139,115,85,0.14)] bg-white/75 px-4 py-3">
              <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8B7355]">Critical incidents</div>
              <div className="mt-1 text-2xl font-bold text-[#2D2721]">1</div>
            </div>
          </div>
        </div>
      </WarmCard>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;

          return (
            <WarmCard key={kpi.id} padding="md" className={`border border-[rgba(139,115,85,0.14)] bg-gradient-to-br ${kpi.tone}`}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6E5B47]">{kpi.label}</div>
                  <div className="mt-2 text-2xl font-bold leading-none text-[#2D2721] sm:text-[28px]">{kpi.value}</div>
                  <div className="mt-2 text-xs font-semibold text-[#4E6A56]">{kpi.trend}</div>
                </div>
                <span className="grid h-10 w-10 place-items-center rounded-[12px] border border-[rgba(139,115,85,0.16)] bg-white/80">
                  <Icon className="h-5 w-5 text-[#2D2721]" />
                </span>
              </div>
            </WarmCard>
          );
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr]">
        <WarmCard padding="lg" className="border border-[rgba(139,115,85,0.14)] bg-white/86">
          <div className="mb-4 flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
            <div>
              <h3 className="text-xl font-bold text-[#2D2721]">Platform growth pulse</h3>
              <p className="text-sm text-[#7A6652]">Users, merchants and recurring revenue trend.</p>
            </div>
            <span className="inline-flex w-full items-center justify-center gap-1 rounded-[10px] border border-[rgba(139,115,85,0.2)] bg-[#FFFBF5] px-3 py-1.5 text-xs font-semibold text-[#2D2721] sm:w-auto">
              <LineChartIcon className="h-3.5 w-3.5" />
              Last 6 months
            </span>
          </div>

          <div className="h-[260px] sm:h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={growthTrend} margin={{ left: -18, right: 12, top: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="adminUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FFC857" stopOpacity={0.55} />
                    <stop offset="100%" stopColor="#FFC857" stopOpacity={0.06} />
                  </linearGradient>
                  <linearGradient id="adminRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#9DB5A5" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#9DB5A5" stopOpacity={0.06} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" stroke="#ECDCBF" vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: '#8B7355', fontSize: 12 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: '#8B7355', fontSize: 12 }} />
                <Tooltip
                  cursor={{ stroke: '#F0D48E', strokeWidth: 1.5 }}
                  contentStyle={{
                    borderRadius: '14px',
                    border: '1px solid rgba(139,115,85,0.2)',
                    boxShadow: '0 12px 28px rgba(45,39,33,0.08)',
                  }}
                />
                <Area type="monotone" dataKey="users" stroke="#FFC857" strokeWidth={2} fill="url(#adminUsers)" />
                <Area type="monotone" dataKey="mrr" stroke="#7FA090" strokeWidth={2} fill="url(#adminRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </WarmCard>

        <WarmCard padding="lg" className="border border-[rgba(139,115,85,0.14)] bg-white/86">
          <div className="mb-4 flex items-center justify-between gap-2">
            <div>
              <h3 className="text-xl font-bold text-[#2D2721]">Market revenue mix</h3>
              <p className="text-sm text-[#7A6652]">Revenue by country code.</p>
            </div>
            <Globe2 className="h-5 w-5 text-[#6B5744]" />
          </div>

          <div className="h-[260px] sm:h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={regionalRevenue}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EBDDC2" />
                <XAxis dataKey="market" tickLine={false} axisLine={false} tick={{ fill: '#8B7355', fontSize: 12 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: '#8B7355', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    borderRadius: '14px',
                    border: '1px solid rgba(139,115,85,0.2)',
                    boxShadow: '0 10px 24px rgba(45,39,33,0.08)',
                  }}
                />
                <Bar dataKey="revenue" radius={[8, 8, 0, 0]} fill="#E17B5C" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </WarmCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
        <div className="space-y-6">
          <WarmCard padding="lg" className="border border-[rgba(139,115,85,0.14)] bg-white/88">
            <h3 className="mb-4 text-base font-bold text-[#2D2721]">{copy.riskTitle}</h3>
            <div className="space-y-3">
              {riskSignals.map((signal) => (
                <button
                  key={signal.id}
                  onClick={() => navigate(signal.href)}
                  className="group flex w-full items-center justify-between rounded-[12px] border border-[rgba(139,115,85,0.15)] bg-[#FFFBF5] px-3 py-3 text-left transition-colors hover:bg-[#FFF9ED]"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${
                        signal.severity === 'high'
                          ? 'bg-[#E17B5C]'
                          : signal.severity === 'medium'
                            ? 'bg-[#FFC857]'
                            : 'bg-[#7FA090]'
                      }`}
                    />
                    <span className="text-sm font-medium text-[#2D2721]">{signal.title}</span>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-[#B79F83] group-hover:text-[#2D2721]" />
                </button>
              ))}
            </div>
          </WarmCard>

          <WarmCard padding="lg" className="border border-[rgba(139,115,85,0.14)] bg-white/88">
            <h3 className="mb-4 text-base font-bold text-[#2D2721]">{copy.watchlistTitle}</h3>
            <div className="space-y-2">
              {merchantWatchlist.map((merchant) => (
                <div
                  key={merchant.id}
                  className="grid grid-cols-[1fr_auto] items-center gap-3 rounded-[12px] border border-[rgba(139,115,85,0.14)] bg-[#FFFBF5] px-3 py-2.5 sm:grid-cols-[1fr_auto_auto]"
                >
                  <div>
                    <div className="text-sm font-semibold text-[#2D2721]">{merchant.name}</div>
                    <div className="text-xs text-[#7C6752]">{merchant.market} market</div>
                  </div>
                  <span
                    className={`rounded-full px-2 py-1 text-[11px] font-semibold ${
                      merchant.status === 'healthy'
                        ? 'bg-[#E5F4EB] text-[#2F8254]'
                        : merchant.status === 'warning'
                          ? 'bg-[#FFF3D8] text-[#A57420]'
                          : 'bg-[#FCE7E1] text-[#C14A2C]'
                    }`}
                  >
                    {merchant.status}
                  </span>
                  <div className="hidden text-sm font-bold text-[#2D2721] sm:block">{merchant.score}</div>
                </div>
              ))}
            </div>
          </WarmCard>
        </div>

        <div className="space-y-6">
          <WarmCard padding="lg" className="border border-[rgba(139,115,85,0.14)] bg-white/88">
            <h3 className="mb-4 text-base font-bold text-[#2D2721]">{copy.controlTitle}</h3>

            <div className="space-y-3">
              <div className="rounded-[12px] border border-[rgba(139,115,85,0.14)] bg-[#FFFBF5] p-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-[#2D2721]">
                    <MessageCircle className="h-4 w-4 text-[#7FA090]" />
                    Live chat widget
                  </div>
                  <button
                    onClick={() => setChatEnabled(!chatEnabled)}
                    className={`inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                      chatEnabled ? 'bg-[#7FA090]' : 'bg-[#D9D1C4]'
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                        chatEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                <div className="text-xs text-[#7C6752]">
                  {chatEnabled ? 'Enabled for all users' : 'Hidden from all users'}
                </div>
              </div>

              <div className="rounded-[12px] border border-[rgba(139,115,85,0.14)] bg-[#FFFBF5] p-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-[#2D2721]">
                    <MessageSquare className="h-4 w-4 text-[#FFC857]" />
                    Feedback widget
                  </div>
                  <button
                    onClick={() => setFeedbackEnabled(!feedbackEnabled)}
                    className={`inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                      feedbackEnabled ? 'bg-[#FFC857]' : 'bg-[#D9D1C4]'
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                        feedbackEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                <div className="text-xs text-[#7C6752]">
                  {feedbackEnabled ? 'Enabled for all users' : 'Hidden from all users'}
                </div>
              </div>
            </div>
          </WarmCard>

          <WarmCard padding="lg" className="border border-[rgba(139,115,85,0.14)] bg-white/88">
            <h3 className="mb-4 text-base font-bold text-[#2D2721]">Action queue</h3>
            <div className="space-y-2">
              {controlActions.map((action) => (
                <button
                  key={action.id}
                  onClick={() => navigate(action.href)}
                  className="group flex w-full items-center justify-between rounded-[12px] border border-[rgba(139,115,85,0.14)] bg-[#FFFBF5] px-3 py-2.5 text-left transition-colors hover:bg-[#FFF9ED]"
                >
                  <span className="text-sm font-medium text-[#2D2721]">{action.title}</span>
                  <ArrowUpRight className="h-4 w-4 text-[#B79F83] group-hover:text-[#2D2721]" />
                </button>
              ))}
            </div>
          </WarmCard>

          <WarmCard padding="lg" className="border border-[#E8C8BC] bg-[#FFF3EE]">
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-[12px] bg-[#F7D1C4] text-[#C24E2F]">
                <AlertTriangle className="h-5 w-5" />
              </span>
              <div>
                <div className="text-sm font-semibold text-[#2D2721]">Attention needed</div>
                <p className="mt-1 text-sm text-[#6A5442]">
                  Merchant payment failures increased compared to last week. Review billing workflows today.
                </p>
                <WarmButton size="sm" variant="outline" className="mt-3" onClick={() => navigate('/billing')}>
                  <Bell className="mr-2 h-4 w-4" />
                  Open billing alerts
                </WarmButton>
              </div>
            </div>
          </WarmCard>
        </div>
      </div>

      <div className="rounded-[14px] border border-[rgba(139,115,85,0.16)] bg-white/80 px-4 py-3 text-xs text-[#6B5744]">
        <span className="inline-flex items-center gap-1 font-semibold text-[#2D2721]">
          <CheckCircle2 className="h-4 w-4 text-[#2F8254]" />
          Status:
        </span>{' '}
        Core governance systems are healthy. Last policy sync completed 7 minutes ago.
      </div>
    </div>
  );
}
