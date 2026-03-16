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
  demographics: { label: string; value: number }[];
};

const navLinks = [
  { href: '/admin/analytics', label: 'Overview' },
  { href: '/admin/analytics/users', label: 'Users', active: true },
  { href: '/admin/analytics/revenue', label: 'Revenue' },
  { href: '/admin/analytics/growth', label: 'Growth' },
  { href: '/admin/analytics/activity', label: 'Activity' },
];

export default function UserAnalyticsClient({ data }: { data: UserAnalyticsData }) {
  const [dateRange, setDateRange] = useState('30d');
  const { dauWauMau, newUsersOverTime, signupFunnel, cohorts, activityHeatmap, topUsers, demographics } = data;

  const dauWauRatio = dauWauMau.wau > 0 ? (dauWauMau.dau / dauWauMau.wau * 100).toFixed(1) : '0';
  const dauMauRatio = dauWauMau.mau > 0 ? (dauWauMau.dau / dauWauMau.mau * 100).toFixed(1) : '0';

  const userColumns = [
    { key: 'name', label: 'User' },
    { key: 'purchases', label: 'Purchases' },
    {
      key: 'totalSpent',
      label: 'Total Spent',
      render: (row: (typeof topUsers)[0]) =>
        new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EUR' }).format(row.totalSpent),
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
              {link.label}
            </Link>
          ))}
        </nav>

        <DashboardHeader
          title="User Analytics"
          subtitle="User behavior, retention, and demographics"
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          backHref="/admin/analytics"
          backLabel="Overview"
        />

        {/* DAU/WAU/MAU Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <MetricCard
            title="DAU"
            value={dauWauMau.dau.toLocaleString()}
            icon={<Users className="h-5 w-5" />}
            color="blue"
          />
          <MetricCard
            title="WAU"
            value={dauWauMau.wau.toLocaleString()}
            icon={<UserPlus className="h-5 w-5" />}
            color="indigo"
          />
          <MetricCard
            title="MAU"
            value={dauWauMau.mau.toLocaleString()}
            icon={<UserCheck className="h-5 w-5" />}
            color="purple"
          />
          <MetricCard
            title="DAU/WAU"
            value={`${dauWauRatio}%`}
            icon={<Activity className="h-5 w-5" />}
            color="emerald"
          />
          <MetricCard
            title="DAU/MAU"
            value={`${dauMauRatio}%`}
            icon={<Activity className="h-5 w-5" />}
            color="orange"
          />
        </div>

        <AnalyticsGrid columns={2}>
          {/* New Users Over Time */}
          <ChartCard title="New Users" subtitle="Daily registrations (30 days)">
            <AnimatedBarChart
              data={newUsersOverTime}
              xKey="date"
              yKey="value"
              color="#3B82F6"
              height={280}
            />
          </ChartCard>

          {/* Signup Funnel */}
          <ChartCard title="Signup Funnel" subtitle="Visitor to first purchase">
            <FunnelChart
              data={signupFunnel}
              stageKey="stage"
              valueKey="value"
              height={280}
              colors={['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B']}
            />
          </ChartCard>
        </AnalyticsGrid>

        {/* Retention Cohort Heatmap */}
        <ChartCard title="User Retention Cohort" subtitle="Monthly retention by signup cohort">
          <HeatmapChart
            data={cohorts.flatMap((c) =>
              c.retention.map((r, i) => ({
                x: `M${i}`,
                y: c.cohort,
                value: Math.round(r * 100),
              }))
            )}
            xKey="x"
            yKey="y"
            valueKey="value"
            height={300}
            colorScale={['#FEF3C7', '#F59E0B', '#D97706', '#92400E']}
            formatValue={(v: number) => `${v}%`}
          />
        </ChartCard>

        <AnalyticsGrid columns={2}>
          {/* Active Users Heatmap */}
          <ChartCard title="Activity Heatmap" subtitle="Active users by day & hour">
            <HeatmapChart
              data={activityHeatmap.map((d) => ({
                x: `${d.hour}:00`,
                y: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.day],
                value: d.value,
              }))}
              xKey="x"
              yKey="y"
              valueKey="value"
              height={250}
              colorScale={['#EFF6FF', '#3B82F6', '#1D4ED8', '#1E3A5F']}
            />
          </ChartCard>

          {/* User Demographics */}
          <ChartCard title="User Demographics" subtitle="By country">
            <PieDonutChart
              data={demographics}
              labelKey="label"
              valueKey="value"
              height={250}
              donut
            />
          </ChartCard>
        </AnalyticsGrid>

        {/* Top Users Table */}
        <ChartCard title="Top Users by Activity" subtitle="Most active purchasers (30 days)">
          <DataTable
            data={topUsers}
            columns={userColumns}
            pageSize={10}
            searchable
          />
        </ChartCard>
      </div>
    </div>
  );
}
