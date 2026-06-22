'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Users, UserPlus, UserCheck, Activity } from 'lucide-react';
import {
  ChartCard,
  MetricCard,
  AnalyticsGrid,
  DashboardHeader,
  DataTable,
} from '@/components/dashboard';
import type { Column } from '@/components/dashboard/data-table';
import type { DateRangeOption } from '@/components/dashboard';
import {
  AnimatedBarChart,
  HeatmapChart,
  FunnelChart,
  PieDonutChart,
} from '@/components/charts';

type UserAnalyticsData = {
  dauWauMau: { dau: number; wau: number; mau: number };
  newUsersOverTime: { date: string; value: number }[];
  signupFunnel: { stage: string; value: number }[];
  cohorts: { cohort: string; size: number; retention: number[] }[];
  activityHeatmap: { day: number; hour: number; value: number }[];
  topUsers: { id: string; name: string; purchases: number; totalSpent: number }[];
  demographics: { header: string; value: number }[];
};

const navLinks = [
  { href: '/admin/analytics', header: 'Overview' },
  { href: '/admin/analytics/users', header: 'Users', active: true },
  { href: '/admin/analytics/revenue', header: 'Revenue' },
  { href: '/admin/analytics/growth', header: 'Growth' },
  { href: '/admin/analytics/activity', header: 'Activity' },
];

export default function UserAnalyticsClient({ data }: { data: UserAnalyticsData }) {
  const [dateRange, setDateRange] = useState<DateRangeOption>('30d');
  const { dauWauMau, newUsersOverTime, signupFunnel, cohorts, activityHeatmap, topUsers, demographics } = data;

  const dauWauRatio = dauWauMau.wau > 0 ? (dauWauMau.dau / dauWauMau.wau * 100).toFixed(1) : '0';
  const dauMauRatio = dauWauMau.mau > 0 ? (dauWauMau.dau / dauWauMau.mau * 100).toFixed(1) : '0';

  const userColumns: Column<Record<string, unknown>>[] = [
    { key: 'name', header: 'User' },
    { key: 'purchases', header: 'Purchases' },
    {
      key: 'totalSpent',
      header: 'Total Spent',
      render: (row) =>
        new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EUR' }).format(row.totalSpent as number),
    },
  ];

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
          title="User Analytics"
          subtitle="User behavior, retention, and demographics"
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          
          
        />

        {/* DAU/WAU/MAU Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <MetricCard
            title="DAU"
            value={dauWauMau.dau.toLocaleString()}
            icon={<Users className="h-5 w-5" />}
          />
          <MetricCard
            title="WAU"
            value={dauWauMau.wau.toLocaleString()}
            icon={<UserPlus className="h-5 w-5" />}
          />
          <MetricCard
            title="MAU"
            value={dauWauMau.mau.toLocaleString()}
            icon={<UserCheck className="h-5 w-5" />}
          />
          <MetricCard
            title="DAU/WAU"
            value={`${dauWauRatio}%`}
            icon={<Activity className="h-5 w-5" />}
          />
          <MetricCard
            title="DAU/MAU"
            value={`${dauMauRatio}%`}
            icon={<Activity className="h-5 w-5" />}
          />
        </div>

        <AnalyticsGrid columns={2}>
          {/* New Users Over Time */}
          <ChartCard title="New Users" subtitle="Daily registrations (30 days)">
            <AnimatedBarChart
              data={newUsersOverTime}
              xAxisKey="date"
              dataKeys={["value"]}
              colors={["#3B82F6"]}
              height={280}
            />
          </ChartCard>

          {/* Signup Funnel */}
          <ChartCard title="Signup Funnel" subtitle="Visitor to first purchase">
            <FunnelChart
              data={signupFunnel.map((f) => ({ name: f.stage, value: f.value }))}
              height={280}
            />
          </ChartCard>
        </AnalyticsGrid>

        {/* Retention Cohort Heatmap */}
        <ChartCard title="User Retention Cohort" subtitle="Monthly retention by signup cohort">
          <HeatmapChart
            data={cohorts.map((c) =>
              c.retention.map((r) => Math.round(r * 100))
            )}
            xLabels={cohorts.length > 0
              ? Array.from({ length: Math.max(...cohorts.map((c) => c.retention.length)) }, (_, i) => `M${i}`)
              : []
            }
            yLabels={cohorts.map((c) => c.cohort)}
            height={300}
          />
        </ChartCard>

        <AnalyticsGrid columns={2}>
          {/* Active Users Heatmap */}
          <ChartCard title="Activity Heatmap" subtitle="Active users by day & hour">
            <HeatmapChart
              data={(() => {
                const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                const grid: number[][] = [];
                for (let d = 0; d < days.length; d++) {
                  const row: number[] = [];
                  for (let h = 0; h < 24; h++) {
                    const entry = activityHeatmap.find((p) => p.day === d && p.hour === h);
                    row.push(entry?.value ?? 0);
                  }
                  grid.push(row);
                }
                return grid;
              })()}
              xLabels={Array.from({ length: 24 }, (_, i) => `${i}:00`)}
              yLabels={['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']}
              height={250}
            />
          </ChartCard>

          {/* User Demographics */}
          <ChartCard title="User Demographics" subtitle="By language">
            <PieDonutChart
              data={demographics.map((d) => ({ name: d.header, value: d.value }))}
              height={250}
              donut
            />
          </ChartCard>
        </AnalyticsGrid>

        {/* Top Users Table */}
        <ChartCard title="Top Users by Activity" subtitle="Most active purchasers (30 days)">
          <DataTable
            data={topUsers as unknown as Record<string, unknown>[]}
            columns={userColumns}
            pageSize={10}
          />
        </ChartCard>
      </div>
    </div>
  );
}
