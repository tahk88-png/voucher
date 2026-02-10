import { useMemo, useState } from 'react';
import { useNavigate } from '@/lib/router-shim';
import { WarmCard } from '@app/components/WarmCard';
import { WarmButton } from '@app/components/WarmButton';
import { useLanguage } from '@app/contexts/LanguageContext';
import {
  ArrowRight,
  ArrowUpRight,
  Award,
  Calendar,
  Check,
  Copy,
  Gift,
  Megaphone,
  Sparkles,
  Star,
  Target,
  Ticket,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

type UserCopy = {
  heading: string;
  summary: string;
  badge: string;
  missionTitle: string;
  activityTitle: string;
  rewardTitle: string;
};

const userCopy: Record<'et' | 'en', UserCopy> = {
  et: {
    heading: 'Sinu preemiate keskvaade',
    summary: 'Jalgi punkte, soovitusi ja pakkumisi uhest modernsest tootspinnast.',
    badge: '2026 Rewards Mode',
    missionTitle: 'Tana missioonid',
    activityTitle: 'Viimased tegevused',
    rewardTitle: 'Lunastatavad preemiad',
  },
  en: {
    heading: 'Your rewards command view',
    summary: 'Track points, referrals and offers from one modern rewards workspace.',
    badge: '2026 Rewards Mode',
    missionTitle: 'Today missions',
    activityTitle: 'Recent activity',
    rewardTitle: 'Redeemable rewards',
  },
};

const pointsTrend = [
  { day: 'Mon', points: 1820 },
  { day: 'Tue', points: 1940 },
  { day: 'Wed', points: 2120 },
  { day: 'Thu', points: 2240 },
  { day: 'Fri', points: 2360 },
  { day: 'Sat', points: 2450 },
  { day: 'Sun', points: 2510 },
];

const missions = [
  { id: 1, label: 'Share one campaign in social channels', progress: 100, reward: '+50 pts' },
  { id: 2, label: 'Invite two new friends', progress: 50, reward: '+200 pts' },
  { id: 3, label: 'Redeem one voucher this week', progress: 20, reward: '+80 pts' },
];

const activeOffers = [
  { id: 1, merchant: 'Fashion Store', title: '30% off summer collection', bonus: '+5 EUR', href: '/voucher' },
  { id: 2, merchant: 'Coffee House', title: 'Buy 2 get 1 free', bonus: '+3 EUR', href: '/voucher' },
  { id: 3, merchant: 'Tech Store', title: '100 EUR off laptops', bonus: '+8 EUR', href: '/voucher' },
];

const rewardItems = [
  { id: 1, name: '10 EUR Voucher', points: 1000, ready: true },
  { id: 2, name: '25 EUR Voucher', points: 2500, ready: false },
  { id: 3, name: 'Premium Month', points: 3000, ready: false },
];

const recentActivity = [
  { id: 1, title: 'Referral signup completed', meta: '+200 points', tone: 'success' },
  { id: 2, title: 'Campaign share published', meta: '+50 points', tone: 'info' },
  { id: 3, title: 'Voucher redeemed at Fashion Store', meta: '-1000 points', tone: 'neutral' },
];

export function UserDashboard() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [copied, setCopied] = useState(false);

  const copy = useMemo(() => userCopy[language], [language]);
  const referralLink = 'https://gifthub.app/ref/USR12345';

  const userStats = {
    points: 2450,
    nextRewardAt: 3000,
    level: 12,
    referrals: 18,
    earned: 'EUR 245',
    shares: 127,
  };

  const progress = Math.round((userStats.points / userStats.nextRewardAt) * 100);

  const kpis = [
    {
      id: 'points',
      label: 'Points Balance',
      value: userStats.points.toLocaleString(),
      trend: `${progress}% to next reward`,
      icon: Award,
      tone: 'from-[#FFF0CC] to-[#FFE1A1]',
    },
    {
      id: 'referrals',
      label: 'Successful Referrals',
      value: `${userStats.referrals}`,
      trend: '+4 this month',
      icon: Users,
      tone: 'from-[#E8F5EC] to-[#D9EEDC]',
    },
    {
      id: 'earned',
      label: 'Total Earned',
      value: userStats.earned,
      trend: '+16%',
      icon: Wallet,
      tone: 'from-[#FFE8DB] to-[#FFD8C7]',
    },
    {
      id: 'shares',
      label: 'Total Shares',
      value: `${userStats.shares}`,
      trend: '+12 this week',
      icon: Megaphone,
      tone: 'from-[#EAF1FF] to-[#DDE9FF]',
    },
  ];

  const handleCopyReferral = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toast.success('Referral link copied');
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Could not copy referral link');
    }
  };

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 pb-8 animate-fade-up">
      <WarmCard
        padding="lg"
        className="relative overflow-hidden border border-[rgba(139,115,85,0.16)] bg-[linear-gradient(135deg,rgba(255,250,238,0.95),rgba(255,236,199,0.84))] shadow-warm-lg"
      >
        <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-[#FFDCA3]/70 blur-3xl" />
        <div className="pointer-events-none absolute bottom-[-64px] left-[30%] h-44 w-44 rounded-full bg-[#FFE8D8]/72 blur-3xl" />

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
                onClick={() => navigate('/voucher')}
                className="inline-flex w-full items-center justify-center gap-2 rounded-[12px] border border-[#E2C987] bg-white/80 px-4 py-2 text-sm font-semibold text-[#2D2721] transition-all hover:shadow-warm sm:w-auto"
              >
                Browse Offers
                <ArrowRight className="h-4 w-4" />
              </button>
              <button
                onClick={() => navigate('/referrals')}
                className="inline-flex w-full items-center justify-center gap-2 rounded-[12px] border border-[rgba(139,115,85,0.2)] bg-white/72 px-4 py-2 text-sm font-semibold text-[#2D2721] transition-all hover:bg-white sm:w-auto"
              >
                Open Referrals
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <div className="rounded-[14px] border border-[rgba(139,115,85,0.14)] bg-white/75 px-4 py-3">
              <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8B7355]">Member tier</div>
              <div className="mt-1 text-base font-bold text-[#2D2721]">Gold</div>
            </div>
            <div className="rounded-[14px] border border-[rgba(139,115,85,0.14)] bg-white/75 px-4 py-3">
              <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8B7355]">Current level</div>
              <div className="mt-1 text-2xl font-bold text-[#2D2721]">{userStats.level}</div>
            </div>
            <div className="rounded-[14px] border border-[rgba(139,115,85,0.14)] bg-white/75 px-4 py-3">
              <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8B7355]">Weekly growth</div>
              <div className="mt-1 flex items-center gap-2 text-2xl font-bold text-[#2D2721]">
                +8%
                <TrendingUp className="h-4 w-4 text-[#3EA870]" />
              </div>
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

      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.95fr]">
        <div className="space-y-6">
          <WarmCard padding="lg" className="border border-[rgba(139,115,85,0.14)] bg-white/86">
            <div className="mb-4 flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
              <div>
                <h3 className="text-xl font-bold text-[#2D2721]">Points trajectory</h3>
                <p className="text-sm text-[#7A6652]">Daily points accumulation and momentum.</p>
              </div>
              <span className="inline-flex w-full items-center justify-center gap-1 rounded-[10px] border border-[rgba(139,115,85,0.2)] bg-[#FFFBF5] px-3 py-1.5 text-xs font-semibold text-[#2D2721] sm:w-auto">
                <Calendar className="h-3.5 w-3.5" />
                Last 7 days
              </span>
            </div>

            <div className="h-[260px] sm:h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={pointsTrend} margin={{ left: -18, right: 12, top: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="userPoints" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#FFC857" stopOpacity={0.55} />
                      <stop offset="100%" stopColor="#FFC857" stopOpacity={0.06} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" stroke="#ECDCBF" vertical={false} />
                  <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fill: '#8B7355', fontSize: 12 }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fill: '#8B7355', fontSize: 12 }} />
                  <Tooltip
                    cursor={{ stroke: '#F0D48E', strokeWidth: 1.5 }}
                    contentStyle={{
                      borderRadius: '14px',
                      border: '1px solid rgba(139,115,85,0.2)',
                      boxShadow: '0 12px 28px rgba(45,39,33,0.08)',
                    }}
                  />
                  <Area type="monotone" dataKey="points" stroke="#FFC857" strokeWidth={2} fill="url(#userPoints)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </WarmCard>

          <WarmCard padding="lg" className="border border-[rgba(139,115,85,0.14)] bg-white/88">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="text-base font-bold text-[#2D2721]">Referral link</h3>
              <button
                onClick={handleCopyReferral}
                className="inline-flex items-center gap-2 rounded-[10px] border border-[rgba(139,115,85,0.2)] bg-[#FFFBF5] px-3 py-1.5 text-xs font-semibold text-[#2D2721]"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <input
              value={referralLink}
              readOnly
              className="h-12 w-full rounded-[12px] border border-[rgba(139,115,85,0.2)] bg-[#FFFBF5] px-3 text-sm font-medium text-[#2D2721] outline-none"
            />
            <div className="mt-4">
              <div className="mb-1 flex items-center justify-between text-xs text-[#7C6752]">
                <span>Progress to next reward</span>
                <span className="font-semibold text-[#2D2721]">{progress}%</span>
              </div>
              <div className="h-2 rounded-full bg-[#EFE5D4]">
                <div className="h-2 rounded-full bg-gradient-to-r from-[#FFC857] to-[#E17B5C]" style={{ width: `${progress}%` }} />
              </div>
            </div>
          </WarmCard>
        </div>

        <div className="space-y-6">
          <WarmCard padding="lg" className="border border-[rgba(139,115,85,0.14)] bg-white/88">
            <h3 className="mb-4 text-base font-bold text-[#2D2721]">{copy.missionTitle}</h3>
            <div className="space-y-3">
              {missions.map((mission) => (
                <div key={mission.id} className="rounded-[12px] border border-[rgba(139,115,85,0.14)] bg-[#FFFBF5] p-3">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <div className="text-sm font-medium text-[#2D2721]">{mission.label}</div>
                    <span className="text-xs font-semibold text-[#2F8254]">{mission.reward}</span>
                  </div>
                  <div className="h-2 rounded-full bg-[#EFE5D4]">
                    <div className="h-2 rounded-full bg-gradient-to-r from-[#FFC857] to-[#9DB5A5]" style={{ width: `${mission.progress}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </WarmCard>

          <WarmCard padding="lg" className="border border-[rgba(139,115,85,0.14)] bg-white/88">
            <h3 className="mb-4 text-base font-bold text-[#2D2721]">{copy.activityTitle}</h3>
            <div className="space-y-2">
              {recentActivity.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between gap-2 rounded-[12px] border border-[rgba(139,115,85,0.14)] bg-[#FFFBF5] px-3 py-2.5"
                >
                  <div className="text-sm text-[#2D2721]">{entry.title}</div>
                  <span
                    className={`rounded-full px-2 py-1 text-[11px] font-semibold ${
                      entry.tone === 'success'
                        ? 'bg-[#E5F4EB] text-[#2F8254]'
                        : entry.tone === 'info'
                          ? 'bg-[#E8F0FF] text-[#3E6CB9]'
                          : 'bg-[#EFE7DA] text-[#7C6752]'
                    }`}
                  >
                    {entry.meta}
                  </span>
                </div>
              ))}
            </div>
          </WarmCard>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.25fr_1fr]">
        <WarmCard padding="lg" className="border border-[rgba(139,115,85,0.14)] bg-white/88">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h3 className="text-base font-bold text-[#2D2721]">Active offers to share</h3>
            <WarmButton size="sm" variant="outline" onClick={() => navigate('/voucher')}>
              View all
            </WarmButton>
          </div>
          <div className="space-y-2">
            {activeOffers.map((offer) => (
              <button
                key={offer.id}
                onClick={() => navigate(offer.href)}
                className="group flex w-full items-center justify-between rounded-[12px] border border-[rgba(139,115,85,0.14)] bg-[#FFFBF5] px-3 py-3 text-left transition-colors hover:bg-[#FFF9ED]"
              >
                <div>
                  <div className="text-sm font-semibold text-[#2D2721]">{offer.title}</div>
                  <div className="text-xs text-[#7C6752]">{offer.merchant}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-semibold text-[#2F8254]">{offer.bonus}</div>
                  <ArrowUpRight className="ml-auto mt-1 h-4 w-4 text-[#B79F83] group-hover:text-[#2D2721]" />
                </div>
              </button>
            ))}
          </div>
        </WarmCard>

        <WarmCard padding="lg" className="border border-[rgba(139,115,85,0.14)] bg-white/88">
          <h3 className="mb-4 text-base font-bold text-[#2D2721]">{copy.rewardTitle}</h3>
          <div className="space-y-2">
            {rewardItems.map((reward) => (
              <div
                key={reward.id}
                className="flex items-center justify-between gap-2 rounded-[12px] border border-[rgba(139,115,85,0.14)] bg-[#FFFBF5] px-3 py-2.5"
              >
                <div className="flex items-center gap-2">
                  <span className="grid h-8 w-8 place-items-center rounded-[10px] bg-[#FFF1D4] text-[#2D2721]">
                    {reward.ready ? <Gift className="h-4 w-4" /> : <Ticket className="h-4 w-4" />}
                  </span>
                  <div>
                    <div className="text-sm font-medium text-[#2D2721]">{reward.name}</div>
                    <div className="text-xs text-[#7C6752]">{reward.points.toLocaleString()} points</div>
                  </div>
                </div>
                <span
                  className={`rounded-full px-2 py-1 text-[11px] font-semibold ${
                    reward.ready ? 'bg-[#E5F4EB] text-[#2F8254]' : 'bg-[#EFE7DA] text-[#7C6752]'
                  }`}
                >
                  {reward.ready ? 'Ready' : 'Locked'}
                </span>
              </div>
            ))}
          </div>
        </WarmCard>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <button
          onClick={() => navigate('/voucher')}
          className="flex items-center justify-between rounded-[12px] border border-[rgba(139,115,85,0.16)] bg-white/86 px-4 py-3 text-left transition-colors hover:bg-[#FFF9ED]"
        >
          <span className="text-sm font-semibold text-[#2D2721]">Browse vouchers</span>
          <Ticket className="h-4 w-4 text-[#6B5744]" />
        </button>
        <button
          onClick={() => navigate('/wallet')}
          className="flex items-center justify-between rounded-[12px] border border-[rgba(139,115,85,0.16)] bg-white/86 px-4 py-3 text-left transition-colors hover:bg-[#FFF9ED]"
        >
          <span className="text-sm font-semibold text-[#2D2721]">Open wallet</span>
          <Wallet className="h-4 w-4 text-[#6B5744]" />
        </button>
        <button
          onClick={() => navigate('/events')}
          className="flex items-center justify-between rounded-[12px] border border-[rgba(139,115,85,0.16)] bg-white/86 px-4 py-3 text-left transition-colors hover:bg-[#FFF9ED]"
        >
          <span className="text-sm font-semibold text-[#2D2721]">Book events</span>
          <Calendar className="h-4 w-4 text-[#6B5744]" />
        </button>
        <button
          onClick={() => navigate('/referrals')}
          className="flex items-center justify-between rounded-[12px] border border-[rgba(139,115,85,0.16)] bg-white/86 px-4 py-3 text-left transition-colors hover:bg-[#FFF9ED]"
        >
          <span className="text-sm font-semibold text-[#2D2721]">Referral hub</span>
          <Target className="h-4 w-4 text-[#6B5744]" />
        </button>
      </div>

      <div className="rounded-[14px] border border-[rgba(139,115,85,0.16)] bg-white/80 px-4 py-3 text-xs text-[#6B5744]">
        <span className="inline-flex items-center gap-1 font-semibold text-[#2D2721]">
          <Star className="h-4 w-4 text-[#FFC857]" />
          Tip:
        </span>{' '}
        Complete all daily missions to unlock your next reward faster.
      </div>
    </div>
  );
}
