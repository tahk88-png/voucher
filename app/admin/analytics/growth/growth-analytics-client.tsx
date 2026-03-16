'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  TrendingDown,
  Users,
  Building2,
  DollarSign,
  Share2,
  UserMinus,
} from 'lucide-react';
import {
  ChartCard,
  MetricCard,
  AnalyticsGrid,
  DashboardHeader,
  StatComparison,
} from '@/components/dashboard';
import {
  FunnelChart,
  ConversionChart,
  AnimatedBarChart,
  AnimatedLineChart,
} from '@/components/charts';

type GrowthAnalyticsData = {
  metrics: {
    userGrowthRate: number;
    revenueGrowthRate: number;
    merchantGrowthRate: number;
    newUsers: number;
    newMerchants: number;
    kFactor: number;
    churnRate: number;
  };
  conversionFunnel: { stage: string; value: number }[];
  periodComparison: {
    current: { label: string; views: number; purchases: number; conversions: number; revenue: number };
    previous: { label: string; views: number; purchases: number; conversions: number; revenue: number };
  };
  channelAcquisition: { channel: string; value: number }[];
  churnTrend: { date: string; value: number }[];
};

const navLinks = [
  { href: '/admin/analytics', label: 'Overview' },
  { href: '/admin/analytics/users', label: 'Users' },
  { href: '/admin/analytics/revenue', label: 'Revenue' },
  { href: '/admin/analytics/growth', label: 'Growth', active: true },
  { href: '/admin/analytics/activity', label: 'Activity' },
];

function formatPct(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
}

export default function GrowthAnalyticsClient({ data }: { data: GrowthAnalyticsData }) {
  const [dateRange, setDateRange] = useState('30d');
  const { metrics, conversionFunnel, periodComparison, channelAcquisition, churnTrend } = data;

  return (
    <div className="min-h-screen bg-[var(--bg,#FAF7F2)]">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Navigation */}
        <nav className="flex gap-1 border-b border-[var(--border,#E8E0D4)]">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                link.active
                  ? 'border-[var(--primary,#8B5A2B)] text-[var(--primary,#8B5A2B)]'
                  : 'border-transparent text-[var(--text-secondary,#6B5744)] hover:text-[var(--text-primary,#2D2721)]'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <DashboardHeader
          title="Growth Analytics"
          subtitle="Growth rates, funnels, and acquisition channels"
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          backHref="/admin/analytics"
          backLabel="Overview"
        />

        {/* Growth Rate Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="User Growth"
            value={formatPct(metrics.userGrowthRate)}
            change={{
              text: `${metrics.newUsers} new users`,
              positive: metrics.userGrowthRate >= 0,
            }}
            icon={<Users className="h-5 w-5" />}
            color={metrics.userGrowthRate >= 0 ? 'emerald' : 'red'}
          />
          <MetricCard
            title="Revenue Growth"
            value={formatPct(metrics.revenueGrowthRate)}
            icon={<DollarSign className="h-5 w-5" />}
            color={metrics.revenueGrowthRate >= 0 ? 'emerald' : 'red'}
          />
          <MetricCard
            title="Merchant Growth"
            value={formatPct(metrics.merchantGrowthRate)}
            change={{
              text: `${metrics.newMerchants} new merchants`,
              positive: metrics.merchantGrowthRate >= 0,
            }}
            icon={<Building2 className="h-5 w-5" />}
            color={metrics.merchantGrowthRate >= 0 ? 'blue' : 'red'}
          />
          <MetricCard
            title="Churn Rate"
            value={`${metrics.churnRate.toFixed(1)}%`}
            icon={<UserMinus className="h-5 w-5" />}
            color={metrics.churnRate <= 5 ? 'emerald' : 'red'}
          />
        </div>

        {/* Viral Coefficient */}
        <div className="bg-white rounded-xl border border-[var(--border,#E8E0D4)] p-5 flex items-center gap-6">
          <Share2 className="h-10 w-10 text-purple-500" />
          <div>
            <p className="text-sm text-[var(--text-secondary,#6B5744)] font-medium">
              Viral Coefficient (K-Factor)
            </p>
            <p className="text-3xl font-bold text-[var(--text-primary,#2D2721)]">
              {metrics.kFactor.toFixed(3)}
            </p>
            <p className="text-xs text-[var(--text-secondary,#6B5744)] mt-1">
              {metrics.kFactor >= 1
                ? 'Viral growth! Each user brings more than one new user.'
                : `Each user refers ${metrics.kFactor.toFixed(2)} new users on average. Target: >1.0 for viral growth.`}
            </p>
          </div>
        </div>

        <AnalyticsGrid columns={2}>
          {/* Conversion Funnel */}
          <ChartCard title="Conversion Funnel" subtitle="View to redemption (30 days)">
            <FunnelChart
              data={conversionFunnel}
              stageKey="stage"
              valueKey="value"
              height={320}
              colors={['#3B82F6', '#6366F1', '#8B5CF6', '#10B981', '#F59E0B']}
            />
          </ChartCard>

          {/* Period Comparison */}
          <ChartCard title="Period Comparison" subtitle="This month vs last month">
            <ConversionChart
              current={periodComparison.current}
              previous={periodComparison.previous}
              metrics={['views', 'purchases', 'conversions', 'revenue']}
              height={320}
            />
          </ChartCard>
        </AnalyticsGrid>

        <AnalyticsGrid columns={2}>
          {/* Channel Acquisition */}
          <ChartCard title="Acquisition Channels" subtitle="User signups by channel">
            <AnimatedBarChart
              data={channelAcquisition}
              xKey="channel"
              yKey="value"
              color="#8B5CF6"
              height={280}
              horizontal
            />
          </ChartCard>

          {/* Churn Analysis */}
          <ChartCard title="Churn Analysis" subtitle="Weekly churn rate (%)">
            <AnimatedLineChart
              data={churnTrend}
              xKey="date"
              yKey="value"
              color="#EF4444"
              height={280}
              formatY={(v: number) => `${v.toFixed(1)}%`}
              showDots
            />
          </ChartCard>
        </AnalyticsGrid>

        {/* Period Stat Comparison */}
        <ChartCard title="Detailed Comparison" subtitle="Key metrics — this period vs previous">
          <StatComparison
            stats={[
              {
                label: 'Views',
                current: periodComparison.current.views,
                previous: periodComparison.previous.views,
              },
              {
                label: 'Purchases',
                current: periodComparison.current.purchases,
                previous: periodComparison.previous.purchases,
              },
              {
                label: 'Conversions',
                current: periodComparison.current.conversions,
                previous: periodComparison.previous.conversions,
              },
              {
                label: 'Revenue',
                current: periodComparison.current.revenue,
                previous: periodComparison.previous.revenue,
                format: (v: number) =>
                  new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'EUR',
                    minimumFractionDigits: 0,
                  }).format(v),
              },
            ]}
          />
        </ChartCard>
      </div>
    </div>
  );
}
