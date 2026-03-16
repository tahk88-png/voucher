'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  ShoppingCart,
  Activity,
  ArrowRight,
} from 'lucide-react';
import {
  ChartCard,
  MetricCard,
  AnalyticsGrid,
  ActivityFeed,
  DashboardHeader,
  DataTable,
} from '@/components/dashboard';
import {
  AnimatedAreaChart,
  AnimatedLineChart,
  GeoMap,
} from '@/components/charts';
import { useLiveMetric } from '@/hooks/use-live-metric';

type OverviewData = {
  metrics: {
    totalRevenue: number;
    revenueChange: number;
    activeUsers: number;
    usersChange: number;
    conversions: number;
    conversionsChange: number;
    avgOrderValue: number;
    aovChange: number;
  };
  revenueTrend: { date: string; value: number }[];
  userGrowth: { date: string; value: number }[];
  topMerchants: {
    id: string;
    name: string;
    slug: string;
    revenue: number;
    transactions: number;
  }[];
  activityFeed: {
    id: string;
    action: string;
    actorName: string;
    merchantName: string | null;
    createdAt: string;
  }[];
  geoData: { country: string; count: number }[];
};

const navLinks = [
  { href: '/admin/analytics', label: 'Overview', active: true },
  { href: '/admin/analytics/users', label: 'Users' },
  { href: '/admin/analytics/revenue', label: 'Revenue' },
  { href: '/admin/analytics/growth', label: 'Growth' },
  { href: '/admin/analytics/activity', label: 'Activity' },
];

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatChange(value: number): { text: string; positive: boolean } {
  const positive = value >= 0;
  return {
    text: `${positive ? '+' : ''}${value.toFixed(1)}%`,
    positive,
  };
}

export default function AnalyticsOverviewClient({ data }: { data: OverviewData }) {
  const [dateRange, setDateRange] = useState('30d');
  const activeUsersNow = useLiveMetric('active-users', 0);
  const salesPerMin = useLiveMetric('sales-per-minute', 0);

  const { metrics, revenueTrend, userGrowth, topMerchants, activityFeed, geoData } = data;

  const merchantColumns = [
    { key: 'name', label: 'Merchant', render: (row: (typeof topMerchants)[0]) => (
      <Link href={`/merchant/${row.slug}`} className="text-[var(--primary)] hover:underline font-medium">
        {row.name}
      </Link>
    )},
    { key: 'revenue', label: 'Revenue', render: (row: (typeof topMerchants)[0]) => formatCurrency(row.revenue) },
    { key: 'transactions', label: 'Transactions' },
  ];

  return (
    <div className="min-h-screen bg-[var(--bg,#FAF7F2)]">
      {/* Live Metrics Bar */}
      <div className="bg-[var(--text-primary,#2D2721)] text-white px-4 py-2">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-sm">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
              </span>
              <span className="text-gray-300">Active users now:</span>
              <span className="font-semibold">{activeUsersNow}</span>
            </div>
            <div className="flex items-center gap-2">
              <Activity className="h-3.5 w-3.5 text-yellow-400" />
              <span className="text-gray-300">Sales/min:</span>
              <span className="font-semibold">{salesPerMin}</span>
            </div>
          </div>
          <span className="text-gray-400 text-xs">Live</span>
        </div>
      </div>

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
          title="Analytics Overview"
          subtitle="Platform performance at a glance"
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          backHref="/admin"
          backLabel="Admin"
        />

        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Total Revenue"
            value={formatCurrency(metrics.totalRevenue)}
            change={formatChange(metrics.revenueChange)}
            icon={<DollarSign className="h-5 w-5" />}
            color="emerald"
          />
          <MetricCard
            title="Active Users"
            value={metrics.activeUsers.toLocaleString()}
            change={formatChange(metrics.usersChange)}
            icon={<Users className="h-5 w-5" />}
            color="blue"
          />
          <MetricCard
            title="Conversions"
            value={metrics.conversions.toLocaleString()}
            change={formatChange(metrics.conversionsChange)}
            icon={<ShoppingCart className="h-5 w-5" />}
            color="purple"
          />
          <MetricCard
            title="Avg Order Value"
            value={formatCurrency(metrics.avgOrderValue)}
            change={formatChange(metrics.aovChange)}
            icon={<BarChart3 className="h-5 w-5" />}
            color="orange"
          />
        </div>

        <AnalyticsGrid columns={2}>
          {/* Revenue Trend */}
          <ChartCard title="Revenue Trend" subtitle="Last 30 days">
            <AnimatedAreaChart
              data={revenueTrend}
              xKey="date"
              yKey="value"
              color="var(--primary, #8B5A2B)"
              gradient
              height={280}
              formatY={(v: number) => formatCurrency(v)}
            />
          </ChartCard>

          {/* User Growth */}
          <ChartCard title="User Growth" subtitle="New users per day">
            <AnimatedLineChart
              data={userGrowth}
              xKey="date"
              yKey="value"
              color="#3B82F6"
              height={280}
              showDots
            />
          </ChartCard>
        </AnalyticsGrid>

        <AnalyticsGrid columns={2}>
          {/* Activity Feed */}
          <ChartCard
            title="Recent Activity"
            subtitle="Last 20 events"
            action={
              <Link
                href="/admin/analytics/activity"
                className="text-sm text-[var(--primary,#8B5A2B)] hover:underline flex items-center gap-1"
              >
                View all <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            }
          >
            <ActivityFeed
              events={activityFeed.map((e) => ({
                id: e.id,
                title: e.action.replace(/_/g, ' '),
                description: e.merchantName
                  ? `${e.actorName} — ${e.merchantName}`
                  : e.actorName,
                timestamp: e.createdAt,
              }))}
              maxItems={10}
            />
          </ChartCard>

          {/* Top Merchants */}
          <ChartCard
            title="Top Merchants"
            subtitle="By revenue (30 days)"
          >
            <DataTable
              data={topMerchants}
              columns={merchantColumns}
              pageSize={5}
            />
          </ChartCard>
        </AnalyticsGrid>

        {/* Geographic Distribution */}
        <ChartCard title="Geographic Distribution" subtitle="Users by country">
          <GeoMap
            data={geoData}
            valueKey="count"
            labelKey="country"
            height={350}
          />
        </ChartCard>
      </div>
    </div>
  );
}
