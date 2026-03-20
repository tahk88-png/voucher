'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  RotateCcw,
  Building2,
  Globe,
} from 'lucide-react';
import {
  ChartCard,
  MetricCard,
  AnalyticsGrid,
  DashboardHeader,
  DataTable,
} from '@/components/dashboard';
import {
  AnimatedAreaChart,
  AnimatedLineChart,
  PieDonutChart,
  Sparkline,
  GeoMap,
} from '@/components/charts';

type RevenueAnalyticsData = {
  metrics: {
    currentRevenue: number;
    revenueChange: number;
    mrr: number;
    arr: number;
    avgOrderValue: number;
    refundRate: number;
    refundTotal: number;
    refundSparkline: number[];
  };
  revenueOverTime: { date: string; value: number }[];
  aovTrend: { date: string; value: number }[];
  revenueByType: { header: string; value: number }[];
  topMerchants: {
    id: string;
    name: string;
    slug: string;
    revenue: number;
    fees: number;
    transactions: number;
  }[];
  geoRevenue: { country: string; count: number }[];
  paymentMethods: { header: string; value: number }[];
};

const navLinks = [
  { href: '/admin/analytics', header: 'Overview' },
  { href: '/admin/analytics/users', header: 'Users' },
  { href: '/admin/analytics/revenue', header: 'Revenue', active: true },
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

export default function RevenueAnalyticsClient({ data }: { data: RevenueAnalyticsData }) {
  const [dateRange, setDateRange] = useState('30d');
  const { metrics, revenueOverTime, aovTrend, revenueByType, topMerchants, geoRevenue, paymentMethods } = data;

  const revenueChange = {
    text: `${metrics.revenueChange >= 0 ? '+' : ''}${metrics.revenueChange.toFixed(1)}%`,
    positive: metrics.revenueChange >= 0,
  };

  const merchantColumns = [
    {
      key: 'name',
      header: 'Merchant',
      render: (row: (typeof topMerchants)[0]) => (
        <Link href={`/merchant/${row.slug}`} className="text-[var(--primary)] hover:underline font-medium">
          {row.name}
        </Link>
      ),
    },
    {
      key: 'revenue',
      header: 'Revenue',
      render: (row: (typeof topMerchants)[0]) => formatCurrency(row.revenue),
    },
    {
      key: 'fees',
      header: 'Platform Fees',
      render: (row: (typeof topMerchants)[0]) => formatCurrency(row.fees),
    },
    { key: 'transactions', header: 'Transactions' },
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
          title="Revenue Analytics"
          subtitle="Financial performance and revenue breakdown"
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          
          
        />

        {/* Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Revenue (30d)"
            value={formatCurrency(metrics.currentRevenue)}
            change={revenueChange}
            icon={<DollarSign className="h-5 w-5" />}
            colors={["emerald"]}
          />
          <MetricCard
            title="MRR"
            value={formatCurrency(metrics.mrr)}
            icon={<TrendingUp className="h-5 w-5" />}
            colors={["blue"]}
          />
          <MetricCard
            title="ARR"
            value={formatCurrency(metrics.arr)}
            icon={<Building2 className="h-5 w-5" />}
            colors={["purple"]}
          />
          <MetricCard
            title="Avg Order Value"
            value={formatCurrency(metrics.avgOrderValue)}
            icon={<CreditCard className="h-5 w-5" />}
            colors={["orange"]}
          />
        </div>

        {/* Refund Rate Card with Sparkline */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-[var(--border,#E8E0D4)] p-5 flex items-center justify-between">
            <div>
              <p className="text-sm text-[var(--text-secondary,#6B5744)] font-medium">Refund Rate</p>
              <p className="text-2xl font-bold text-[var(--text-primary,#2D2721)] mt-1">
                {metrics.refundRate.toFixed(2)}%
              </p>
              <p className="text-xs text-[var(--text-secondary,#6B5744)] mt-1">
                Total refunded: {formatCurrency(metrics.refundTotal)}
              </p>
            </div>
            <div className="w-24">
              <Sparkline data={metrics.refundSparkline} colors={["#EF4444"]} height={40} />
            </div>
          </div>
          <div className="bg-white rounded-xl border border-[var(--border,#E8E0D4)] p-5 flex items-center gap-4">
            <RotateCcw className="h-8 w-8 text-red-400" />
            <div>
              <p className="text-sm text-[var(--text-secondary,#6B5744)] font-medium">Refund Volume</p>
              <p className="text-2xl font-bold text-[var(--text-primary,#2D2721)]">
                {formatCurrency(metrics.refundTotal)}
              </p>
            </div>
          </div>
        </div>

        {/* Revenue Over Time */}
        <ChartCard title="Revenue Over Time" subtitle="Daily revenue (30 days)">
          <AnimatedAreaChart
            data={revenueOverTime}
            xAxisKey="date"
            dataKeys={["value"
            colors={["#10B981"]}
            gradient
            height={320}
            
          />
        </ChartCard>

        <AnalyticsGrid columns={2}>
          {/* Revenue by Product Type */}
          <ChartCard title="Revenue by Product Type" subtitle="Breakdown by category">
            <PieDonutChart
              data={revenueByType}
              
              
              height={280}
              donut
              
            />
          </ChartCard>

          {/* AOV Trend */}
          <ChartCard title="Average Order Value" subtitle="Daily trend (30 days)">
            <AnimatedLineChart
              data={aovTrend}
              xAxisKey="date"
              dataKeys={["value"
              colors={["#F59E0B"]}
              height={280}
              
            />
          </ChartCard>
        </AnalyticsGrid>

        <AnalyticsGrid columns={2}>
          {/* Revenue by Country */}
          <ChartCard title="Revenue by Country" subtitle="Geographic distribution">
            <GeoMap
              data={geoRevenue}
              
              
              height={300}
              
            />
          </ChartCard>

          {/* Payment Method Distribution */}
          <ChartCard title="Payment Methods" subtitle="Distribution by payment type">
            <PieDonutChart
              data={paymentMethods}
              
              
              height={300}
              donut
              
            />
          </ChartCard>
        </AnalyticsGrid>

        {/* Top Revenue Generators */}
        <ChartCard title="Top Revenue Generators" subtitle="Merchants by revenue (30 days)">
          <DataTable
            data={topMerchants}
            columns={merchantColumns}
            pageSize={10}
            searchable
          />
        </ChartCard>
      </div>
    </div>
  );
}
