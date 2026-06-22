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
import type { Column } from '@/components/dashboard/data-table';
import type { DateRangeOption } from '@/components/dashboard';
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
  { href: '/admin/analytics', header: 'Overview', active: true },
  { href: '/admin/analytics/users', header: 'Users' },
  { href: '/admin/analytics/revenue', header: 'Revenue' },
  { href: '/admin/analytics/growth', header: 'Growth' },
  { href: '/admin/analytics/activity', header: 'Activity' },
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
  const [dateRange, setDateRange] = useState<DateRangeOption>('30d');
  const activeUsersLive = useLiveMetric('active-users', 0);
  const salesPerMinLive = useLiveMetric('sales-per-minute', 0);

  const { metrics, revenueTrend, userGrowth, topMerchants, activityFeed, geoData } = data;

  const merchantColumns: Column<Record<string, unknown>>[] = [
    { key: 'name', header: 'Merchant', render: (row) => (
      <Link href={`/merchant/${row.slug}`} className="text-[var(--primary)] hover:underline font-medium">
        {String(row.name)}
      </Link>
    )},
    { key: 'revenue', header: 'Revenue', render: (row) => formatCurrency(row.revenue as number) },
    { key: 'transactions', header: 'Transactions' },
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
              <span className="font-semibold">{activeUsersLive.value}</span>
            </div>
            <div className="flex items-center gap-2">
              <Activity className="h-3.5 w-3.5 text-yellow-400" />
              <span className="text-gray-300">Sales/min:</span>
              <span className="font-semibold">{salesPerMinLive.value}</span>
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
              {link.header}
            </Link>
          ))}
        </nav>

        <DashboardHeader
          title="Analytics Overview"
          subtitle="Platform performance at a glance"
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          
          
        />

        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Total Revenue"
            value={formatCurrency(metrics.totalRevenue)}
            change={metrics.revenueChange}
            trend={metrics.revenueChange >= 0 ? 'up' : 'down'}
            icon={<DollarSign className="h-5 w-5" />}
          />
          <MetricCard
            title="Active Users"
            value={metrics.activeUsers.toLocaleString()}
            change={metrics.usersChange}
            trend={metrics.usersChange >= 0 ? 'up' : 'down'}
            icon={<Users className="h-5 w-5" />}
          />
          <MetricCard
            title="Conversions"
            value={metrics.conversions.toLocaleString()}
            change={metrics.conversionsChange}
            trend={metrics.conversionsChange >= 0 ? 'up' : 'down'}
            icon={<ShoppingCart className="h-5 w-5" />}
          />
          <MetricCard
            title="Avg Order Value"
            value={formatCurrency(metrics.avgOrderValue)}
            change={metrics.aovChange}
            trend={metrics.aovChange >= 0 ? 'up' : 'down'}
            icon={<BarChart3 className="h-5 w-5" />}
          />
        </div>

        <AnalyticsGrid columns={2}>
          {/* Revenue Trend */}
          <ChartCard title="Revenue Trend" subtitle="Last 30 days">
            <AnimatedAreaChart
              data={revenueTrend}
              xAxisKey="date"
              dataKeys={["value"]}
              colors={["var(--primary, #8B5A2B)"]}
              gradient
              height={280}
            />
          </ChartCard>

          {/* User Growth */}
          <ChartCard title="User Growth" subtitle="New users per day">
            <AnimatedLineChart
              data={userGrowth}
              xAxisKey="date"
              dataKeys={["value"]}
              colors={["#3B82F6"]}
              height={280}
            />
          </ChartCard>
        </AnalyticsGrid>

        <AnalyticsGrid columns={2}>
          {/* Activity Feed */}
          <ChartCard
            title="Recent Activity"
            subtitle="Last 20 events"
          >
            <ActivityFeed
              events={activityFeed.map((e) => ({
                id: e.id,
                type: 'purchase' as const,
                user: e.actorName,
                action: e.merchantName
                  ? `${e.action.replace(/_/g, ' ')} — ${e.merchantName}`
                  : e.action.replace(/_/g, ' '),
                timestamp: e.createdAt,
              }))}
              maxHeight={400}
            />
          </ChartCard>

          {/* Top Merchants */}
          <ChartCard
            title="Top Merchants"
            subtitle="By revenue (30 days)"
          >
            <DataTable
              data={topMerchants as unknown as Record<string, unknown>[]}
              columns={merchantColumns}
              pageSize={5}
            />
          </ChartCard>
        </AnalyticsGrid>

        {/* Geographic Distribution */}
        <ChartCard title="Geographic Distribution" subtitle="Users by country">
          <GeoMap
            data={geoData.map((g) => ({ country: g.country, value: g.count }))}
            height={350}
          />
        </ChartCard>
      </div>
    </div>
  );
}
