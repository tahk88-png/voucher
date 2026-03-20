'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  Clock,
  ShoppingBag,
  Zap,
} from 'lucide-react';
import {
  ChartCard,
  AnalyticsGrid,
  ActivityFeed,
  DashboardHeader,
  DataTable,
} from '@/components/dashboard';
import {
  AnimatedBarChart,
  LiveActivityChart,
  HeatmapChart,
} from '@/components/charts';
import { useRealtime } from '@/hooks/use-realtime';

type ActivityData = {
  activityFeed: {
    id: string;
    action: string;
    actorName: string;
    merchantName: string | null;
    createdAt: string;
  }[];
  eventsPerHour: { hour: string; value: number }[];
  topVouchers: { id: string; title: string; purchases: number; revenue: number }[];
  purchaseTimeline: {
    id: string;
    buyerName: string;
    voucherTitle: string;
    merchantName: string;
    amount: number;
    createdAt: string;
  }[];
  peakHours: { day: number; hour: number; value: number }[];
};

const navLinks = [
  { href: '/admin/analytics', header: 'Overview' },
  { href: '/admin/analytics/users', header: 'Users' },
  { href: '/admin/analytics/revenue', header: 'Revenue' },
  { href: '/admin/analytics/growth', header: 'Growth' },
  { href: '/admin/analytics/activity', header: 'Activity', active: true },
];

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function ActivityDashboardClient({ data }: { data: ActivityData }) {
  const [dateRange, setDateRange] = useState('24h');
  const { activityFeed: initialFeed, eventsPerHour, topVouchers, purchaseTimeline, peakHours } = data;

  // Live feed via SSE
  const liveEvents = useRealtime('admin-activity', {
    initialData: initialFeed,
  });

  const feedEvents = (liveEvents ?? initialFeed).map((e: (typeof initialFeed)[0]) => ({
    id: e.id,
    title: e.action.replace(/_/g, ' '),
    description: e.merchantName
      ? `${e.actorName} — ${e.merchantName}`
      : e.actorName,
    timestamp: e.createdAt,
  }));

  const voucherColumns = [
    { key: 'title', header: 'Voucher' },
    { key: 'purchases', header: 'Purchases' },
    {
      key: 'revenue',
      header: 'Revenue',
      render: (row: (typeof topVouchers)[0]) => formatCurrency(row.revenue),
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
          title="Activity Dashboard"
          subtitle="Real-time platform activity and event monitoring"
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          
          
        />

        {/* Live Activity Status */}
        <div className="bg-white rounded-xl border border-[var(--border,#E8E0D4)] p-4 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500" />
            </span>
            <span className="text-sm font-medium text-[var(--text-primary,#2D2721)]">
              Live Activity Monitor
            </span>
          </div>
          <span className="text-xs text-[var(--text-secondary,#6B5744)]">
            Streaming events in real-time
          </span>
        </div>

        <AnalyticsGrid columns={2}>
          {/* Live Activity Feed */}
          <ChartCard
            title="Live Activity Feed"
            subtitle="Real-time platform events"
            action={
              <div className="flex items-center gap-1 text-xs text-green-600">
                <Zap className="h-3 w-3" />
                Live
              </div>
            }
          >
            <div className="max-h-[400px] overflow-y-auto">
              <ActivityFeed events={feedEvents} maxHeight={400} />
            </div>
          </ChartCard>

          {/* Live Activity Graph */}
          <ChartCard title="Live Activity" subtitle="Events streaming">
            <LiveActivityChart
              channel="admin-activity"
              height={400}
              colors={["#10B981"]}
            />
          </ChartCard>
        </AnalyticsGrid>

        {/* Events Per Hour */}
        <ChartCard title="Events Per Hour" subtitle="Last 24 hours">
          <AnimatedBarChart
            data={eventsPerHour}
            xAxisKey="hour"
            dataKeys={["value"
            colors={["#6366F1"]}
            height={280}
          />
        </ChartCard>

        <AnalyticsGrid columns={2}>
          {/* Most Popular Vouchers */}
          <ChartCard title="Most Popular Vouchers" subtitle="Top sellers (7 days)">
            <DataTable
              data={topVouchers}
              columns={voucherColumns}
              pageSize={8}
              searchable
            />
          </ChartCard>

          {/* Peak Hours Heatmap */}
          <ChartCard title="Peak Hours" subtitle="Activity by day & hour (7 days)">
            <HeatmapChart
              data={peakHours.map((d) => ({
                x: `${d.hour.toString().padStart(2, '0')}:00`,
                y: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.day],
                value: d.value,
              }))}
              xAxisKey="x"
              dataKeys={["y"
              
              height={250}
              
            />
          </ChartCard>
        </AnalyticsGrid>

        {/* Recent Purchases Timeline */}
        <ChartCard title="Recent Purchases" subtitle="Latest transactions">
          <div className="space-y-0">
            {purchaseTimeline.map((purchase, index) => (
              <div
                key={purchase.id}
                className={`flex items-center gap-4 py-3 px-2 ${
                  index !== purchaseTimeline.length - 1
                    ? 'border-b border-[var(--border,#E8E0D4)]'
                    : ''
                }`}
              >
                {/* Timeline dot */}
                <div className="flex flex-col items-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-[var(--primary,#8B5A2B)]" />
                  {index !== purchaseTimeline.length - 1 && (
                    <div className="w-px h-full bg-[var(--border,#E8E0D4)] mt-1" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-[var(--text-primary,#2D2721)] truncate">
                      {purchase.buyerName}
                    </p>
                    <span className="text-sm font-semibold text-emerald-600 whitespace-nowrap ml-2">
                      {formatCurrency(purchase.amount)}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-secondary,#6B5744)] truncate">
                    {purchase.voucherTitle} — {purchase.merchantName}
                  </p>
                </div>

                {/* Time */}
                <div className="flex items-center gap-1 text-xs text-[var(--text-secondary,#6B5744)] whitespace-nowrap">
                  <Clock className="h-3 w-3" />
                  {timeAgo(purchase.createdAt)}
                </div>
              </div>
            ))}
            {purchaseTimeline.length === 0 && (
              <div className="py-8 text-center text-[var(--text-secondary,#6B5744)]">
                No recent purchases
              </div>
            )}
          </div>
        </ChartCard>
      </div>
    </div>
  );
}
