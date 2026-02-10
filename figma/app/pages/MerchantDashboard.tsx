import { useMemo } from 'react';
import { useNavigate } from '@/lib/router-shim';
import { WarmCard } from '@app/components/WarmCard';
import { useLanguage } from '@app/contexts/LanguageContext';
import {
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  Bot,
  CalendarClock,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  Megaphone,
  PackageSearch,
  Sparkles,
  Ticket,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

type DashboardCopy = {
  greeting: string;
  summary: string;
  heroBadge: string;
  chartTitle: string;
  chartDescription: string;
  boardTitle: string;
  logisticsTitle: string;
  aiTitle: string;
};

const dashboardCopy: Record<'et' | 'en', DashboardCopy> = {
  et: {
    greeting: 'Tere tagasi, kaupmees',
    summary: 'Tana juhid korraga kampaaniaid, vautsereid ja operatsioone. Siin on koondvaade koigist kriitilistest signaalidest.',
    heroBadge: '2026 Smart Commerce Mode',
    chartTitle: 'Nadala kaivepulse',
    chartDescription: 'Muuk, rent ja B2B tellimused viimase 7 paeva jooksul.',
    boardTitle: 'Execution board',
    logisticsTitle: 'Tana logistikas',
    aiTitle: 'AI soovitused',
  },
  en: {
    greeting: 'Welcome back, merchant',
    summary: 'Run campaigns, vouchers and operations from one screen. This is your consolidated performance and risk view.',
    heroBadge: '2026 Smart Commerce Mode',
    chartTitle: 'Weekly revenue pulse',
    chartDescription: 'Sales, rentals and B2B orders over the last 7 days.',
    boardTitle: 'Execution board',
    logisticsTitle: 'Today in logistics',
    aiTitle: 'AI recommendations',
  },
};

const trendData = [
  { day: 'Mon', sales: 380, rentals: 140, b2b: 96 },
  { day: 'Tue', sales: 340, rentals: 170, b2b: 102 },
  { day: 'Wed', sales: 420, rentals: 154, b2b: 118 },
  { day: 'Thu', sales: 470, rentals: 186, b2b: 132 },
  { day: 'Fri', sales: 520, rentals: 210, b2b: 145 },
  { day: 'Sat', sales: 498, rentals: 220, b2b: 140 },
  { day: 'Sun', sales: 560, rentals: 205, b2b: 154 },
];

const logisticsFlow = [
  {
    id: 1,
    title: 'Sony A7 III kit',
    time: '12:15',
    status: 'scheduled',
    client: 'Studio Nord',
  },
  {
    id: 2,
    title: 'DJI Ronin S',
    time: '14:10',
    status: 'inbound',
    client: 'Mari Tamm',
  },
  {
    id: 3,
    title: 'Canon R5 body',
    time: '16:45',
    status: 'late',
    client: 'Agency One',
  },
];

const executionBoard = [
  {
    id: 1,
    label: '2 campaign drafts are ready for launch review.',
    href: '/campaigns/create',
    type: 'growth',
  },
  {
    id: 2,
    label: 'Voucher stock is low for Weekend Bundle package.',
    href: '/vouchers',
    type: 'risk',
  },
  {
    id: 3,
    label: 'New order flow can be accelerated with pre-built templates.',
    href: '/orders/create',
    type: 'info',
  },
];

const kpiCards = [
  {
    id: 'revenue',
    label: 'Monthly Revenue',
    value: 'EUR 24.8k',
    trend: '+18.2%',
    icon: CircleDollarSign,
    tone: 'from-[#FFF0CC] to-[#FFE2A5]',
  },
  {
    id: 'campaigns',
    label: 'Active Campaigns',
    value: '14',
    trend: '+3 this week',
    icon: Megaphone,
    tone: 'from-[#E8F5EC] to-[#D7EEDC]',
  },
  {
    id: 'voucher',
    label: 'Voucher Redemptions',
    value: '1,428',
    trend: '+11.6%',
    icon: Ticket,
    tone: 'from-[#FFE8DB] to-[#FFDACA]',
  },
  {
    id: 'wallet',
    label: 'Payout Readiness',
    value: '98%',
    trend: 'healthy',
    icon: Wallet,
    tone: 'from-[#EAF1FF] to-[#DCE8FF]',
  },
];

const aiActions = [
  'Increase voucher visibility in Friday 17:00-20:00 slot for +9% conversion.',
  'Duplicate top rental campaign to Latvia market and localize CTA.',
  'Move low performing ad budget into referral segment with higher LTV.',
];

export function MerchantDashboard() {
  const navigate = useNavigate();
  const { language } = useLanguage();

  const copy = useMemo(() => dashboardCopy[language], [language]);

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 pb-8 animate-fade-up">
      <WarmCard
        padding="lg"
        className="relative overflow-hidden border border-[rgba(139,115,85,0.16)] bg-[linear-gradient(135deg,rgba(255,250,238,0.95),rgba(255,236,199,0.85))] shadow-warm-lg"
      >
        <div className="pointer-events-none absolute -right-16 -top-20 h-60 w-60 rounded-full bg-[#FFDDA5]/65 blur-3xl" />
        <div className="pointer-events-none absolute bottom-[-72px] left-[28%] h-48 w-48 rounded-full bg-[#FFEAD8]/75 blur-3xl" />

        <div className="relative grid gap-6 lg:grid-cols-[1.4fr_0.9fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#E6D4AE] bg-white/75 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8B7355]">
              <Sparkles className="h-3.5 w-3.5" />
              {copy.heroBadge}
            </div>
            <h1 className="mt-3 text-[26px] font-bold leading-[1.08] text-[#2D2721] sm:text-[30px]">{copy.greeting}</h1>
            <p className="mt-3 max-w-2xl text-sm text-[#5E4D3C] sm:text-base">{copy.summary}</p>

            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <button
                onClick={() => navigate('/campaigns/create')}
                className="inline-flex w-full items-center justify-center gap-2 rounded-[12px] border border-[#E2C987] bg-white/80 px-4 py-2 text-sm font-semibold text-[#2D2721] transition-all hover:shadow-warm sm:w-auto"
              >
                Launch Campaign
                <ArrowRight className="h-4 w-4" />
              </button>
              <button
                onClick={() => navigate('/vouchers/create')}
                className="inline-flex w-full items-center justify-center gap-2 rounded-[12px] border border-[rgba(139,115,85,0.22)] bg-white/70 px-4 py-2 text-sm font-semibold text-[#2D2721] transition-all hover:bg-white sm:w-auto"
              >
                Create Voucher
                <ArrowRight className="h-4 w-4" />
              </button>
              <button
                onClick={() => navigate('/orders/create')}
                className="inline-flex w-full items-center justify-center gap-2 rounded-[12px] border border-[rgba(139,115,85,0.22)] bg-white/70 px-4 py-2 text-sm font-semibold text-[#2D2721] transition-all hover:bg-white sm:w-auto"
              >
                Add Order
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <div className="rounded-[14px] border border-[rgba(139,115,85,0.14)] bg-white/75 px-4 py-3">
              <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8B7355]">Critical tasks</div>
              <div className="mt-1 text-2xl font-bold text-[#2D2721]">3</div>
            </div>
            <div className="rounded-[14px] border border-[rgba(139,115,85,0.14)] bg-white/75 px-4 py-3">
              <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8B7355]">Market velocity</div>
              <div className="mt-1 flex items-center gap-2 text-2xl font-bold text-[#2D2721]">
                1.8x
                <TrendingUp className="h-4 w-4 text-[#3EA870]" />
              </div>
            </div>
            <div className="rounded-[14px] border border-[rgba(139,115,85,0.14)] bg-white/75 px-4 py-3">
              <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8B7355]">Automation score</div>
              <div className="mt-1 text-2xl font-bold text-[#2D2721]">92%</div>
            </div>
          </div>
        </div>
      </WarmCard>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpiCards.map((card, index) => {
          const Icon = card.icon;

          return (
            <WarmCard
              key={card.id}
              padding="md"
              className={`border border-[rgba(139,115,85,0.14)] bg-gradient-to-br ${card.tone} shadow-warm-sm transition-all hover:-translate-y-0.5 hover:shadow-warm`}
              style={{ animationDelay: `${index * 80}ms` }}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6E5B47]">{card.label}</div>
                  <div className="mt-2 text-2xl font-bold leading-none text-[#2D2721] sm:text-[28px]">{card.value}</div>
                  <div className="mt-2 text-xs font-semibold text-[#4E6A56]">{card.trend}</div>
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
        <div className="space-y-6">
          <WarmCard padding="lg" className="border border-[rgba(139,115,85,0.14)] bg-white/86">
            <div className="mb-4 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <h3 className="text-xl font-bold text-[#2D2721]">{copy.chartTitle}</h3>
                <p className="text-sm text-[#7A6652]">{copy.chartDescription}</p>
              </div>
              <button
                onClick={() => navigate('/analytics')}
                className="inline-flex w-full items-center justify-center gap-1 rounded-[10px] border border-[rgba(139,115,85,0.2)] bg-[#FFFBF5] px-3 py-1.5 text-xs font-semibold text-[#2D2721] sm:w-auto"
              >
                Open Analytics
                <ArrowUpRight className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="h-[260px] w-full sm:h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ left: -20, right: 10, top: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#FFC857" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="#FFC857" stopOpacity={0.05} />
                    </linearGradient>
                    <linearGradient id="rentalGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#E17B5C" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#E17B5C" stopOpacity={0.05} />
                    </linearGradient>
                    <linearGradient id="b2bGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#9DB5A5" stopOpacity={0.45} />
                      <stop offset="100%" stopColor="#9DB5A5" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" stroke="#EBDDC2" vertical={false} />
                  <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fill: '#8B7355', fontSize: 12 }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fill: '#8B7355', fontSize: 12 }} />
                  <Tooltip
                    cursor={{ stroke: '#F2D79C', strokeWidth: 1.5 }}
                    contentStyle={{
                      borderRadius: '14px',
                      border: '1px solid rgba(139,115,85,0.2)',
                      boxShadow: '0 12px 30px rgba(45,39,33,0.08)',
                    }}
                  />
                  <Area type="monotone" dataKey="sales" stroke="#FFC857" strokeWidth={2} fill="url(#salesGradient)" />
                  <Area type="monotone" dataKey="rentals" stroke="#E17B5C" strokeWidth={2} fill="url(#rentalGradient)" />
                  <Area type="monotone" dataKey="b2b" stroke="#7FA090" strokeWidth={2} fill="url(#b2bGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </WarmCard>

          <WarmCard padding="none" className="overflow-hidden border border-[rgba(139,115,85,0.14)] bg-white/86">
            <div className="flex items-center justify-between border-b border-[rgba(139,115,85,0.14)] bg-[#FFF9ED] px-5 py-4">
              <h3 className="text-base font-bold text-[#2D2721]">{copy.boardTitle}</h3>
              <span className="rounded-full border border-[#E5C989] bg-white px-2.5 py-1 text-xs font-semibold text-[#6B5744]">
                3 priorities
              </span>
            </div>

            <div className="divide-y divide-[rgba(139,115,85,0.12)]">
              {executionBoard.map((item) => (
                <button
                  key={item.id}
                  onClick={() => navigate(item.href)}
                  className="group flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-[#FFFBF5]"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${
                        item.type === 'risk' ? 'bg-[#E17B5C]' : item.type === 'growth' ? 'bg-[#3EA870]' : 'bg-[#5A8CE6]'
                      }`}
                    />
                    <span className="text-sm font-medium text-[#2D2721]">{item.label}</span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-[#B79F83] transition-colors group-hover:text-[#2D2721]" />
                </button>
              ))}
            </div>
          </WarmCard>
        </div>

        <div className="space-y-6">
          <WarmCard padding="lg" className="border border-[rgba(139,115,85,0.14)] bg-white/88">
            <h3 className="mb-4 flex items-center gap-2 text-base font-bold text-[#2D2721]">
              <CalendarClock className="h-5 w-5 text-[#6B5744]" />
              {copy.logisticsTitle}
            </h3>

            <div className="space-y-3">
              {logisticsFlow.map((item) => (
                <div
                  key={item.id}
                  className={`rounded-[12px] border px-3 py-3 ${
                    item.status === 'late'
                      ? 'border-[#E9B2A2] bg-[#FFF2EE]'
                      : item.status === 'inbound'
                        ? 'border-[#C7DCCE] bg-[#EEF6F1]'
                        : 'border-[rgba(139,115,85,0.16)] bg-[#FFFBF5]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-[#2D2721]">{item.title}</div>
                      <div className="mt-1 text-xs text-[#745F4B]">{item.client}</div>
                    </div>
                    <div className="inline-flex items-center gap-1 rounded-full bg-white/80 px-2 py-1 text-xs font-semibold text-[#6B5744]">
                      <Clock3 className="h-3.5 w-3.5" />
                      {item.time}
                    </div>
                  </div>
                  {item.status === 'late' && (
                    <div className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-[#D05B3A]">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      Return is delayed
                    </div>
                  )}
                  {item.status === 'inbound' && (
                    <div className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-[#2F8254]">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Back in warehouse flow
                    </div>
                  )}
                </div>
              ))}
            </div>
          </WarmCard>

          <WarmCard
            padding="lg"
            className="border border-[rgba(139,115,85,0.14)] bg-[linear-gradient(140deg,#2D2721,#3B322A)] text-[#F4EBDD]"
          >
            <h3 className="mb-4 flex items-center gap-2 text-base font-bold text-white">
              <Bot className="h-5 w-5 text-[#FFC857]" />
              {copy.aiTitle}
            </h3>
            <div className="space-y-3">
              {aiActions.map((item, index) => (
                <div key={item} className="rounded-[12px] border border-[#4B3F34] bg-[#342C25] px-3 py-3">
                  <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#D7BE94]">
                    Suggestion {index + 1}
                  </div>
                  <div className="text-sm text-[#F1E8DA]">{item}</div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center gap-2 rounded-[10px] border border-[#5B4A39] bg-[#302821] px-3 py-2 text-xs text-[#E4D2B5]">
              <PackageSearch className="h-4 w-4 text-[#FFC857]" />
              Based on your last 30 days behavior and market demand shifts.
            </div>
          </WarmCard>
        </div>
      </div>
    </div>
  );
}
