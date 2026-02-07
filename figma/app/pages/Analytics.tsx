import { useState } from 'react';
import { WarmCard } from '@/figma/app/components/WarmCard';
import { WarmButton } from '@/figma/app/components/WarmButton';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Euro, 
  Gift, 
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  User,
  UserCircle
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/figma/app/components/ui/select';

type TimeRange = '7d' | '30d' | '90d' | '1y';

export function Analytics() {
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');

  // Mock data for charts
  const revenueData = [
    { date: 'Jan 1', revenue: 4200, redemptions: 45 },
    { date: 'Jan 8', revenue: 5100, redemptions: 52 },
    { date: 'Jan 15', revenue: 4800, redemptions: 48 },
    { date: 'Jan 22', revenue: 6200, redemptions: 63 },
    { date: 'Jan 29', revenue: 5900, redemptions: 58 },
    { date: 'Feb 5', revenue: 7100, redemptions: 72 },
    { date: 'Feb 12', revenue: 6800, redemptions: 68 },
  ];

  const campaignPerformance = [
    { name: 'Summer Sale', value: 4500, redemptions: 127, roi: 2.3 },
    { name: 'Holiday Gift', value: 3800, redemptions: 98, roi: 2.1 },
    { name: 'Welcome Bonus', value: 2200, redemptions: 145, roi: 1.8 },
    { name: 'Referral Reward', value: 1800, redemptions: 89, roi: 3.2 },
    { name: 'Birthday Special', value: 1200, redemptions: 56, roi: 1.9 },
  ];

  const categoryData = [
    { name: 'Vouchers', value: 45, color: '#FFC857' },
    { name: 'Gift Cards', value: 30, color: '#9DB5A5' },
    { name: 'Referrals', value: 15, color: '#E17B5C' },
    { name: 'Events', value: 10, color: '#F5C98E' },
  ];

  // Demographics data - from social media login providers (Facebook, Google, LinkedIn, etc.)
  const ageGenderData = [
    { ageGroup: '18-24', female: 245, male: 198, total: 443 },
    { ageGroup: '25-34', female: 412, male: 387, total: 799 },
    { ageGroup: '35-44', female: 356, male: 401, total: 757 },
    { ageGroup: '45-54', female: 289, male: 334, total: 623 },
    { ageGroup: '55-64', female: 167, male: 201, total: 368 },
    { ageGroup: '65+', female: 78, male: 102, total: 180 },
  ];

  const genderDistribution = [
    { name: 'Female', value: 1547, percentage: 48.9, color: '#E17B5C' },
    { name: 'Male', value: 1623, percentage: 51.1, color: '#FFC857' },
  ];

  const totalUsers = genderDistribution.reduce((sum, item) => sum + item.value, 0);

  const topCampaigns = [
    {
      id: 1,
      name: 'Summer Electronics Sale',
      type: 'Voucher',
      revenue: 12450,
      redemptions: 247,
      conversionRate: 73.5,
      trend: 'up',
      change: 12.3,
    },
    {
      id: 2,
      name: 'Holiday Gift Card',
      type: 'Gift Card',
      revenue: 8920,
      redemptions: 189,
      conversionRate: 68.2,
      trend: 'up',
      change: 8.7,
    },
    {
      id: 3,
      name: 'Welcome Bonus',
      type: 'Voucher',
      revenue: 6780,
      redemptions: 423,
      conversionRate: 82.1,
      trend: 'up',
      change: 15.4,
    },
    {
      id: 4,
      name: 'Referral Program',
      type: 'Referral',
      revenue: 4560,
      redemptions: 156,
      conversionRate: 65.8,
      trend: 'down',
      change: -3.2,
    },
  ];

  const kpis = [
    {
      label: 'Total Revenue',
      value: 'EUR 42,850',
      change: '+12.3%',
      trend: 'up',
      icon: Euro,
      color: 'from-[#FFC857] to-[#FFB627]',
    },
    {
      label: 'Active Campaigns',
      value: '28',
      change: '+4',
      trend: 'up',
      icon: Gift,
      color: 'from-[#9DB5A5] to-[#7FA090]',
    },
    {
      label: 'Total Redemptions',
      value: '1,247',
      change: '+18.5%',
      trend: 'up',
      icon: Users,
      color: 'from-[#E17B5C] to-[#D16B4C]',
    },
    {
      label: 'Avg Conversion',
      value: '72.3%',
      change: '-2.1%',
      trend: 'down',
      icon: TrendingUp,
      color: 'from-[#F5C98E] to-[#E5B97E]',
    },
  ];

  const getTimeRangeLabel = (range: TimeRange) => {
    switch (range) {
      case '7d': return 'Last 7 Days';
      case '30d': return 'Last 30 Days';
      case '90d': return 'Last 90 Days';
      case '1y': return 'Last Year';
    }
  };

  return (
    <div className="space-y-6 motion-safe:animate-fade-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 motion-safe:animate-fade-up" style={{ animationDelay: '40ms' }}>
        <div>
          <h1 className="text-3xl font-bold text-[#2D2721]">Analytics</h1>
          <p className="text-[#6B5744] mt-1">Track your performance and insights</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={timeRange} onValueChange={(value) => setTimeRange(value as TimeRange)}>
            <SelectTrigger className="w-[160px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="90d">Last 90 Days</SelectItem>
              <SelectItem value="1y">Last Year</SelectItem>
            </SelectContent>
          </Select>
          <WarmButton variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </WarmButton>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, index) => {
          const Icon = kpi.icon;
          const isPositive = kpi.trend === 'up';
          return (
            <WarmCard key={index} hover padding="lg" className="relative overflow-hidden" style={{ animationDelay: `${120 + index * 60}ms` }}>
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-[14px] bg-gradient-to-br ${kpi.color} flex items-center justify-center shadow-warm`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <div className={`flex items-center gap-1 text-sm font-medium ${
                  isPositive ? 'text-[#9DB5A5]' : 'text-[#E17B5C]'
                }`}>
                  {isPositive ? (
                    <ArrowUpRight className="h-4 w-4" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4" />
                  )}
                  {kpi.change}
                </div>
              </div>
              <div className="text-3xl font-bold text-[#2D2721] mb-1">{kpi.value}</div>
              <div className="text-sm text-[#8B7355]">{kpi.label}</div>
            </WarmCard>
          );
        })}
      </div>

      {/* Revenue Trend */}
      <WarmCard padding="lg" className="relative overflow-hidden" style={{ animationDelay: '360ms' }}>
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-[#2D2721] mb-1">Revenue Trend</h2>
          <p className="text-sm text-[#6B5744]">{getTimeRangeLabel(timeRange)}</p>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={revenueData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(139, 115, 85, 0.1)" />
            <XAxis 
              dataKey="date" 
              stroke="#8B7355"
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              stroke="#8B7355"
              style={{ fontSize: '12px' }}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: '#FFF9ED',
                border: '1px solid rgba(139, 115, 85, 0.15)',
                borderRadius: '12px',
                boxShadow: '0 4px 16px rgba(139, 115, 85, 0.12)',
              }}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="revenue" 
              stroke="#FFC857" 
              strokeWidth={3}
              dot={{ fill: '#FFC857', r: 4 }}
              activeDot={{ r: 6 }}
              name="Revenue (EUR)"
            />
            <Line 
              type="monotone" 
              dataKey="redemptions" 
              stroke="#9DB5A5" 
              strokeWidth={3}
              dot={{ fill: '#9DB5A5', r: 4 }}
              activeDot={{ r: 6 }}
              name="Redemptions"
            />
          </LineChart>
        </ResponsiveContainer>
      </WarmCard>

      {/* Campaign Performance & Category Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Campaign Performance */}
        <WarmCard padding="lg" className="relative overflow-hidden" style={{ animationDelay: '420ms' }}>
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-[#2D2721] mb-1">Campaign Performance</h2>
            <p className="text-sm text-[#6B5744]">Top 5 campaigns by revenue</p>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={campaignPerformance} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(139, 115, 85, 0.1)" horizontal={false} />
              <XAxis type="number" stroke="#8B7355" style={{ fontSize: '12px' }} />
              <YAxis 
                type="category" 
                dataKey="name" 
                stroke="#8B7355" 
                style={{ fontSize: '11px' }}
                width={100}
                tick={{ fill: '#6B5744' }}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#FFF9ED',
                  border: '1px solid rgba(139, 115, 85, 0.15)',
                  borderRadius: '12px',
                  boxShadow: '0 4px 16px rgba(139, 115, 85, 0.12)',
                }}
              />
              <Bar dataKey="value" fill="#FFC857" radius={[0, 8, 8, 0]} name="Revenue (EUR)" />
            </BarChart>
          </ResponsiveContainer>
        </WarmCard>

        {/* Category Distribution */}
        <WarmCard padding="lg" className="relative overflow-hidden" style={{ animationDelay: '480ms' }}>
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-[#2D2721] mb-1">Category Distribution</h2>
            <p className="text-sm text-[#6B5744]">Breakdown by campaign type</p>
          </div>
          <div className="flex items-center justify-center w-full">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#FFF9ED',
                    border: '1px solid rgba(139, 115, 85, 0.15)',
                    borderRadius: '12px',
                    boxShadow: '0 4px 16px rgba(139, 115, 85, 0.12)',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </WarmCard>
      </div>

      {/* User Demographics Section */}
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-[#2D2721] mb-2">User Demographics</h2>
          <p className="text-[#6B5744]">Customer insights from social media login data (Facebook, Google, LinkedIn, etc.)</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Age Groups by Gender */}
          <WarmCard padding="lg">
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-[#2D2721] mb-1">Age Groups by Gender</h3>
              <p className="text-sm text-[#6B5744]">Distribution of users across age groups</p>
            </div>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={ageGenderData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(139, 115, 85, 0.1)" />
                <XAxis 
                  dataKey="ageGroup" 
                  stroke="#8B7355"
                  style={{ fontSize: '12px' }}
                />
                <YAxis 
                  stroke="#8B7355"
                  style={{ fontSize: '12px' }}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#FFF9ED',
                    border: '1px solid rgba(139, 115, 85, 0.15)',
                    borderRadius: '12px',
                    boxShadow: '0 4px 16px rgba(139, 115, 85, 0.12)',
                  }}
                />
                <Legend />
                <Bar dataKey="female" fill="#E17B5C" radius={[8, 8, 0, 0]} name="Female" />
                <Bar dataKey="male" fill="#FFC857" radius={[8, 8, 0, 0]} name="Male" />
              </BarChart>
            </ResponsiveContainer>
          </WarmCard>

          {/* Gender Distribution */}
          <WarmCard padding="lg">
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-[#2D2721] mb-1">Gender Distribution</h3>
              <p className="text-sm text-[#6B5744]">Overall gender breakdown</p>
            </div>
            
            {/* Pie Chart */}
            <div className="flex items-center justify-center mb-6 w-full">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={genderDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percentage }) => `${name} ${percentage}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {genderDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#FFF9ED',
                      border: '1px solid rgba(139, 115, 85, 0.15)',
                      borderRadius: '12px',
                      boxShadow: '0 4px 16px rgba(139, 115, 85, 0.12)',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Stats Cards */}
            <div className="space-y-3">
              {genderDistribution.map((item) => (
                <div 
                  key={item.name}
                  className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-br from-[#FFF9ED] to-white"
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-12 h-12 rounded-full flex items-center justify-center shadow-warm"
                      style={{ backgroundColor: item.color }}
                    >
                      {item.name === 'Female' ? (
                        <User className="h-6 w-6 text-white" />
                      ) : (
                        <UserCircle className="h-6 w-6 text-white" />
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-[#6B5744]">{item.name}</div>
                      <div className="text-2xl font-bold text-[#2D2721]">{item.value.toLocaleString()}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-[#2D2721]">{item.percentage}%</div>
                    <div className="text-xs text-[#8B7355]">of total</div>
                  </div>
                </div>
              ))}
              
              {/* Total Users */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-br from-[#FFC857] to-[#FFB627] text-white shadow-warm">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <div className="text-sm font-medium opacity-90">Total Users</div>
                    <div className="text-2xl font-bold">{totalUsers.toLocaleString()}</div>
                  </div>
                </div>
              </div>
            </div>
          </WarmCard>
        </div>

        {/* Age Group Details Table */}
        <WarmCard padding="lg">
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-[#2D2721] mb-1">Detailed Age Group Breakdown</h3>
            <p className="text-sm text-[#6B5744]">User distribution by age and gender</p>
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[rgba(139,115,85,0.1)]">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B5744]">Age Group</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-[#6B5744]">Female</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-[#6B5744]">Male</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-[#6B5744]">Total</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-[#6B5744]">% of Users</th>
                </tr>
              </thead>
              <tbody>
                {ageGenderData.map((group) => {
                  const percentage = ((group.total / totalUsers) * 100).toFixed(1);
                  return (
                    <tr 
                      key={group.ageGroup}
                      className="border-b border-[rgba(139,115,85,0.05)] hover:bg-[#FFF9ED] transition-colors"
                    >
                      <td className="py-4 px-4">
                        <div className="font-semibold text-[#2D2721]">{group.ageGroup}</div>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <span className="inline-flex items-center gap-2">
                          <span className="font-medium text-[#E17B5C]">{group.female}</span>
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <span className="inline-flex items-center gap-2">
                          <span className="font-medium text-[#FFC857]">{group.male}</span>
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right font-bold text-[#2D2721]">
                        {group.total}
                      </td>
                      <td className="py-4 px-4 text-right text-[#6B5744]">
                        {percentage}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-[rgba(139,115,85,0.2)] bg-[#FFF9ED]">
                  <td className="py-4 px-4 font-bold text-[#2D2721]">Total</td>
                  <td className="py-4 px-4 text-right font-bold text-[#E17B5C]">
                    {genderDistribution.find(g => g.name === 'Female')?.value}
                  </td>
                  <td className="py-4 px-4 text-right font-bold text-[#FFC857]">
                    {genderDistribution.find(g => g.name === 'Male')?.value}
                  </td>
                  <td className="py-4 px-4 text-right font-bold text-[#2D2721]">
                    {totalUsers}
                  </td>
                  <td className="py-4 px-4 text-right font-bold text-[#6B5744]">
                    100%
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {ageGenderData.map((group) => {
              const percentage = ((group.total / totalUsers) * 100).toFixed(1);
              return (
                <div 
                  key={group.ageGroup}
                  className="p-4 bg-[#FFF9ED] rounded-xl space-y-3"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-[rgba(139,115,85,0.1)]">
                    <div className="font-bold text-[#2D2721] text-lg">{group.ageGroup}</div>
                    <div className="text-right">
                      <div className="font-bold text-[#2D2721]">{group.total}</div>
                      <div className="text-xs text-[#8B7355]">{percentage}%</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-white rounded-lg">
                      <div className="text-xs text-[#8B7355] mb-1">Female</div>
                      <div className="text-xl font-bold text-[#E17B5C]">{group.female}</div>
                    </div>
                    <div className="p-3 bg-white rounded-lg">
                      <div className="text-xs text-[#8B7355] mb-1">Male</div>
                      <div className="text-xl font-bold text-[#FFC857]">{group.male}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </WarmCard>
      </div>

      {/* Top Campaigns Table */}
      <WarmCard padding="lg">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-[#2D2721] mb-1">Top Campaigns</h2>
          <p className="text-sm text-[#6B5744]">Best performing campaigns this period</p>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[rgba(139,115,85,0.1)]">
                <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B5744]">Campaign</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B5744]">Type</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-[#6B5744]">Revenue</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-[#6B5744]">Redemptions</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-[#6B5744]">Conversion</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-[#6B5744]">Trend</th>
              </tr>
            </thead>
            <tbody>
              {topCampaigns.map((campaign) => (
                <tr 
                  key={campaign.id}
                  className="border-b border-[rgba(139,115,85,0.05)] hover:bg-[#FFF9ED] transition-colors"
                >
                  <td className="py-4 px-4">
                    <div className="font-medium text-[#2D2721]">{campaign.name}</div>
                  </td>
                  <td className="py-4 px-4">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-[#FFF9ED] text-[#6B5744]">
                      {campaign.type}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-right font-semibold text-[#2D2721]">
                    EUR {campaign.revenue.toLocaleString()}
                  </td>
                  <td className="py-4 px-4 text-right text-[#6B5744]">
                    {campaign.redemptions}
                  </td>
                  <td className="py-4 px-4 text-right text-[#6B5744]">
                    {campaign.conversionRate}%
                  </td>
                  <td className="py-4 px-4 text-right">
                    <div className={`inline-flex items-center gap-1 text-sm font-medium ${
                      campaign.trend === 'up' ? 'text-[#9DB5A5]' : 'text-[#E17B5C]'
                    }`}>
                      {campaign.trend === 'up' ? (
                        <TrendingUp className="h-4 w-4" />
                      ) : (
                        <TrendingDown className="h-4 w-4" />
                      )}
                      {Math.abs(campaign.change)}%
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden space-y-3">
          {topCampaigns.map((campaign) => (
            <div 
              key={campaign.id}
              className="p-4 bg-[#FFF9ED] rounded-xl space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-semibold text-[#2D2721] mb-1">{campaign.name}</div>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-white text-[#6B5744]">
                    {campaign.type}
                  </span>
                </div>
                <div className={`flex items-center gap-1 text-sm font-medium ${
                  campaign.trend === 'up' ? 'text-[#9DB5A5]' : 'text-[#E17B5C]'
                }`}>
                  {campaign.trend === 'up' ? (
                    <TrendingUp className="h-4 w-4" />
                  ) : (
                    <TrendingDown className="h-4 w-4" />
                  )}
                  {Math.abs(campaign.change)}%
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 pt-3 border-t border-[rgba(139,115,85,0.1)]">
                <div>
                  <div className="text-xs text-[#8B7355] mb-1">Revenue</div>
                  <div className="font-semibold text-[#2D2721]">EUR {campaign.revenue.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-xs text-[#8B7355] mb-1">Redemptions</div>
                  <div className="font-semibold text-[#2D2721]">{campaign.redemptions}</div>
                </div>
                <div>
                  <div className="text-xs text-[#8B7355] mb-1">Conversion</div>
                  <div className="font-semibold text-[#2D2721]">{campaign.conversionRate}%</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </WarmCard>

      {/* Insights */}
      <WarmCard padding="lg" className="bg-gradient-to-br from-[#FFF9ED] to-[#FFE5B4]">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#FFC857] to-[#FFB627] flex items-center justify-center flex-shrink-0 shadow-warm">
            <TrendingUp className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-[#2D2721] mb-2">Key Insight</h3>
            <p className="text-[#6B5744] mb-3">
              Your conversion rate increased by 8.5% this month. The "Summer Electronics Sale" campaign 
              is performing exceptionally well with a 73.5% conversion rate, significantly above your average.
            </p>
            <WarmButton variant="outline" size="sm">
              View Recommendations
            </WarmButton>
          </div>
        </div>
      </WarmCard>
    </div>
  );
}
