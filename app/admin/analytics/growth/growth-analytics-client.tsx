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
import type { DateRangeOption } from '@/components/dashboard';
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
    current: { header: string; views: number; purchases: number; conversions: number; revenue: number };
    previous: { header: string; views: number; purchases: number; conversions: number; revenue: number };
  };
  channelAcquisition: { channel: string; value: number }[];
  churnTrend: { date: string; value: number }[];
};

const navLinks = [
  { href: '/admin/analytics', header: 'Overview' },
  { href: '/admin/analytics/users', header: 'Users' },
  { href: '/admin/analytics/revenue', header: 'Revenue' },
  { href: '/admin/analytics/growth', header: 'Growth', active: true },
  { href: '/admin/analytics/activity', header: 'Activity' },
];

function formatPct(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
}

export default function GrowthAnalyticsClient({ data }: { data: GrowthAnalyticsData }) {
  const [dateRange, setDateRange] = useState<DateRangeOption>('30d');
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
              {link.header}
            </Link>
          ))}
        </nav>

        <DashboardHeader
          title="Growth Analytics"
          subtitle="Growth rates, funnels, and acquisition channels"
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          
          
        />

        {/* Growth Rate Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="User Growth"
            value={formatPct(metrics.userGrowthRate)}
            change={metrics.userGrowthRate}
            trend={metrics.userGrowthRate >= 0 ? 'up' : 'down'}
            icon={<Users className="h-5 w-5" />}
          />
          <MetricCard
            title="Revenue Growth"
            value={formatPct(metrics.revenueGrowthRate)}
            change={metrics.revenueGrowthRate}
            trend={metrics.revenueGrowthRate >= 0 ? 'up' : 'down'}
            icon={<DollarSign className="h-5 w-5" />}
          />
          <MetricCard
            title="Merchant Growth"
            value={formatPct(metrics.merchantGrowthRate)}
            change={metrics.merchantGrowthRate}
            trend={metrics.merchantGrowthRate >= 0 ? 'up' : 'down'}
            icon={<Building2 className="h-5 w-5" />}
          />
          <MetricCard
            title="Churn Rate"
            value={`${metrics.churnRate.toFixed(1)}%`}
            change={metrics.churnRate}
            trend={metrics.churnRate <= 5 ? 'down' : 'up'}
            icon={<UserMinus className="h-5 w-5" />}
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
              data={conversionFunnel.map((f) => ({ name: f.stage, value: f.value }))}
              height={320}
            />
          </ChartCard>

          {/* Period Comparison */}
          <ChartCard title="Period Comparison" subtitle="This month vs last month">
            <ConversionChart
              data={[
                { name: 'Views', value: periodComparison.current.views, previousValue: periodComparison.previous.views },
                { name: 'Purchases', value: periodComparison.current.purchases, previousValue: periodComparison.previous.purchases },
                { name: 'Conversions', value: periodComparison.current.conversions, previousValue: periodComparison.previous.conversions },
                { name: 'Revenue', value: periodComparison.current.revenue, previousValue: periodComparison.previous.revenue },
              ]}
              height={320}
            />
          </ChartCard>
        </AnalyticsGrid>

        <AnalyticsGrid columns={2}>
          {/* Channel Acquisition */}
          <ChartCard title="Acquisition Channels" subtitle="User signups by channel">
            <AnimatedBarChart
              data={channelAcquisition}
              xAxisKey="channel"
              dataKeys={["value"]}
              colors={["#8B5CF6"]}
              height={280}
              horizontal
            />
          </ChartCard>

          {/* Churn Analysis */}
          <ChartCard title="Churn Analysis" subtitle="Weekly churn rate (%)">
            <AnimatedLineChart
              data={churnTrend}
              xAxisKey="date"
              dataKeys={["value"]}
              colors={["#EF4444"]}
              height={280}
            />
          </ChartCard>
        </AnalyticsGrid>

        {/* Period Stat Comparisons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatComparison
            label="Views"
            current={periodComparison.current.views}
            previous={periodComparison.previous.views}
          />
          <StatComparison
            label="Purchases"
            current={periodComparison.current.purchases}
            previous={periodComparison.previous.purchases}
          />
          <StatComparison
            label="Conversions"
            current={periodComparison.current.conversions}
            previous={periodComparison.previous.conversions}
          />
          <StatComparison
            label="Revenue"
            current={periodComparison.current.revenue}
            previous={periodComparison.previous.revenue}
            format="currency"
          />
        </div>
      </div>
    </div>
  );
}
