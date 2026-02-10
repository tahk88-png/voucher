import { useState } from 'react';
import { WarmCard } from '@app/components/WarmCard';
import { WarmButton } from '@app/components/WarmButton';
import { useLanguage } from '@app/contexts/LanguageContext';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@app/components/ui/select';

type TimeRange = '7d' | '30d' | '90d' | '1y';

export function Analytics() {
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const { language } = useLanguage();
  const tr = (en: string, et: string) => (language === 'et' ? et : en);

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
    { name: tr('Vouchers', 'Vautserid'), value: 45, color: '#FFC857' },
    { name: tr('Gift Cards', 'Kinkekaardid'), value: 30, color: '#9DB5A5' },
    { name: tr('Referrals', 'Soovitused'), value: 15, color: '#E17B5C' },
    { name: tr('Events', 'Sündmused'), value: 10, color: '#F5C98E' },
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
    { key: 'female', label: tr('Female', 'Naised'), value: 1547, percentage: 48.9, color: '#E17B5C' },
    { key: 'male', label: tr('Male', 'Mehed'), value: 1623, percentage: 51.1, color: '#FFC857' },
  ];

  const totalUsers = genderDistribution.reduce((sum, item) => sum + item.value, 0);

  const topCampaigns = [
    {
      id: 1,
      name: 'Summer Electronics Sale',
      type: 'voucher',
      revenue: 12450,
      redemptions: 247,
      conversionRate: 73.5,
      trend: 'up',
      change: 12.3,
    },
    {
      id: 2,
      name: 'Holiday Gift Card',
      type: 'giftCard',
      revenue: 8920,
      redemptions: 189,
      conversionRate: 68.2,
      trend: 'up',
      change: 8.7,
    },
    {
      id: 3,
      name: 'Welcome Bonus',
      type: 'voucher',
      revenue: 6780,
      redemptions: 423,
      conversionRate: 82.1,
      trend: 'up',
      change: 15.4,
    },
    {
      id: 4,
      name: 'Referral Program',
      type: 'referral',
      revenue: 4560,
      redemptions: 156,
      conversionRate: 65.8,
      trend: 'down',
      change: -3.2,
    },
  ];

  const kpis = [
    {
      label: tr('Total Revenue', 'Kogutulu'),
      value: '€42,850',
      change: '+12.3%',
      trend: 'up',
      icon: Euro,
      color: 'from-[#FFC857] to-[#FFB627]',
    },
    {
      label: tr('Active Campaigns', 'Aktiivsed kampaaniad'),
      value: '28',
      change: '+4',
      trend: 'up',
      icon: Gift,
      color: 'from-[#9DB5A5] to-[#7FA090]',
    },
    {
      label: tr('Total Redemptions', 'Lunastamisi kokku'),
      value: '1,247',
      change: '+18.5%',
      trend: 'up',
      icon: Users,
      color: 'from-[#E17B5C] to-[#D16B4C]',
    },
    {
      label: tr('Avg Conversion', 'Keskmine konversioon'),
      value: '72.3%',
      change: '-2.1%',
      trend: 'down',
      icon: TrendingUp,
      color: 'from-[#F5C98E] to-[#E5B97E]',
    },
  ];

  const getCampaignTypeLabel = (type: string) => {
    switch (type) {
      case 'voucher':
        return tr('Voucher', 'Vautser');
      case 'giftCard':
        return tr('Gift Card', 'Kinkekaart');
      case 'referral':
        return tr('Referral', 'Soovitus');
      default:
        return type;
    }
  };

  const getTimeRangeLabel = (range: TimeRange) => {
    switch (range) {
      case '7d': return tr('Last 7 Days', 'Viimased 7 päeva');
      case '30d': return tr('Last 30 Days', 'Viimased 30 päeva');
      case '90d': return tr('Last 90 Days', 'Viimased 90 päeva');
      case '1y': return tr('Last Year', 'Viimane aasta');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#2D2721]">{tr('Analytics', 'Analüütika')}</h1>
          <p className="text-[#6B5744] mt-1">{tr('Track your performance and insights', 'Jälgi oma tulemusi ja teadmisi')}</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={timeRange} onValueChange={(value) => setTimeRange(value as TimeRange)}>
            <SelectTrigger className="w-[160px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">{tr('Last 7 Days', 'Viimased 7 päeva')}</SelectItem>
              <SelectItem value="30d">{tr('Last 30 Days', 'Viimased 30 päeva')}</SelectItem>
              <SelectItem value="90d">{tr('Last 90 Days', 'Viimased 90 päeva')}</SelectItem>
              <SelectItem value="1y">{tr('Last Year', 'Viimane aasta')}</SelectItem>
            </SelectContent>
          </Select>
          <WarmButton variant="outline">
            <Download className="h-4 w-4 mr-2" />
            {tr('Export', 'Ekspordi')}
          </WarmButton>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, index) => {
          const Icon = kpi.icon;
          const isPositive = kpi.trend === 'up';
          return (
            <WarmCard key={index} hover padding="lg">
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
      <WarmCard padding="lg">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-[#2D2721] mb-1">{tr('Revenue Trend', 'Tulu trend')}</h2>
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
              name={tr('Revenue (€)', 'Tulu (€)')}
            />
            <Line 
              type="monotone" 
              dataKey="redemptions" 
              stroke="#9DB5A5" 
              strokeWidth={3}
              dot={{ fill: '#9DB5A5', r: 4 }}
              activeDot={{ r: 6 }}
              name={tr('Redemptions', 'Lunastamised')}
            />
          </LineChart>
        </ResponsiveContainer>
      </WarmCard>

      {/* Campaign Performance & Category Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Campaign Performance */}
        <WarmCard padding="lg">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-[#2D2721] mb-1">{tr('Campaign Performance', 'Kampaaniate tulemuslikkus')}</h2>
            <p className="text-sm text-[#6B5744]">{tr('Top 5 campaigns by revenue', 'Top 5 kampaaniat tulu järgi')}</p>
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
              <Bar dataKey="value" fill="#FFC857" radius={[0, 8, 8, 0]} name={tr('Revenue (€)', 'Tulu (€)')} />
            </BarChart>
          </ResponsiveContainer>
        </WarmCard>

        {/* Category Distribution */}
        <WarmCard padding="lg">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-[#2D2721] mb-1">{tr('Category Distribution', 'Kategooriate jaotus')}</h2>
            <p className="text-sm text-[#6B5744]">{tr('Breakdown by campaign type', 'Jaotus kampaania tüübi järgi')}</p>
          </div>
          <div className="flex items-center justify-center">
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
          <h2 className="text-2xl font-bold text-[#2D2721] mb-2">{tr('User Demographics', 'Kasutajate demograafia')}</h2>
          <p className="text-[#6B5744]">{tr('Customer insights from social media login data (Facebook, Google, LinkedIn, etc.)', 'Kliendiülevaade sotsiaalmeedia sisselogimise andmetest (Facebook, Google, LinkedIn jne)')}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Age Groups by Gender */}
          <WarmCard padding="lg">
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-[#2D2721] mb-1">{tr('Age Groups by Gender', 'Vanuserühmad soo järgi')}</h3>
              <p className="text-sm text-[#6B5744]">{tr('Distribution of users across age groups', 'Kasutajate jaotus vanuserühmade lõikes')}</p>
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
                <Bar dataKey="female" fill="#E17B5C" radius={[8, 8, 0, 0]} name={tr('Female', 'Naised')} />
                <Bar dataKey="male" fill="#FFC857" radius={[8, 8, 0, 0]} name={tr('Male', 'Mehed')} />
              </BarChart>
            </ResponsiveContainer>
          </WarmCard>

          {/* Gender Distribution */}
          <WarmCard padding="lg">
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-[#2D2721] mb-1">{tr('Gender Distribution', 'Sooline jaotus')}</h3>
              <p className="text-sm text-[#6B5744]">{tr('Overall gender breakdown', 'Üldine sooline jaotus')}</p>
            </div>
            
            {/* Pie Chart */}
            <div className="flex items-center justify-center mb-6">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={genderDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ payload, percentage }) => `${payload.label} ${percentage}%`}
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
                  key={item.key}
                  className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-br from-[#FFF9ED] to-white"
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-12 h-12 rounded-full flex items-center justify-center shadow-warm"
                      style={{ backgroundColor: item.color }}
                    >
                      {item.key === 'female' ? (
                        <User className="h-6 w-6 text-white" />
                      ) : (
                        <UserCircle className="h-6 w-6 text-white" />
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-[#6B5744]">{item.label}</div>
                      <div className="text-2xl font-bold text-[#2D2721]">{item.value.toLocaleString()}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-[#2D2721]">{item.percentage}%</div>
                    <div className="text-xs text-[#8B7355]">{tr('of total', 'koguarvust')}</div>
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
                    <div className="text-sm font-medium opacity-90">{tr('Total Users', 'Kasutajaid kokku')}</div>
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
            <h3 className="text-xl font-semibold text-[#2D2721] mb-1">{tr('Detailed Age Group Breakdown', 'Vanuserühmade detailne jaotus')}</h3>
            <p className="text-sm text-[#6B5744]">{tr('User distribution by age and gender', 'Kasutajate jaotus vanuse ja soo järgi')}</p>
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[rgba(139,115,85,0.1)]">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B5744]">{tr('Age Group', 'Vanuserühm')}</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-[#6B5744]">{tr('Female', 'Naised')}</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-[#6B5744]">{tr('Male', 'Mehed')}</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-[#6B5744]">{tr('Total', 'Kokku')}</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-[#6B5744]">{tr('% of Users', '% kasutajatest')}</th>
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
                  <td className="py-4 px-4 font-bold text-[#2D2721]">{tr('Total', 'Kokku')}</td>
                  <td className="py-4 px-4 text-right font-bold text-[#E17B5C]">
                    {genderDistribution.find(g => g.key === 'female')?.value}
                  </td>
                  <td className="py-4 px-4 text-right font-bold text-[#FFC857]">
                    {genderDistribution.find(g => g.key === 'male')?.value}
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
                      <div className="text-xs text-[#8B7355] mb-1">{tr('Female', 'Naised')}</div>
                      <div className="text-xl font-bold text-[#E17B5C]">{group.female}</div>
                    </div>
                    <div className="p-3 bg-white rounded-lg">
                      <div className="text-xs text-[#8B7355] mb-1">{tr('Male', 'Mehed')}</div>
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
          <h2 className="text-xl font-semibold text-[#2D2721] mb-1">{tr('Top Campaigns', 'Parimad kampaaniad')}</h2>
          <p className="text-sm text-[#6B5744]">{tr('Best performing campaigns this period', 'Selle perioodi parima tulemusega kampaaniad')}</p>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[rgba(139,115,85,0.1)]">
                <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B5744]">{tr('Campaign', 'Kampaania')}</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B5744]">{tr('Type', 'Tüüp')}</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-[#6B5744]">{tr('Revenue', 'Tulu')}</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-[#6B5744]">{tr('Redemptions', 'Lunastamised')}</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-[#6B5744]">{tr('Conversion', 'Konversioon')}</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-[#6B5744]">{tr('Trend', 'Trend')}</th>
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
                      {getCampaignTypeLabel(campaign.type)}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-right font-semibold text-[#2D2721]">
                    €{campaign.revenue.toLocaleString()}
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
                    {getCampaignTypeLabel(campaign.type)}
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
                  <div className="text-xs text-[#8B7355] mb-1">{tr('Revenue', 'Tulu')}</div>
                  <div className="font-semibold text-[#2D2721]">€{campaign.revenue.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-xs text-[#8B7355] mb-1">{tr('Redemptions', 'Lunastamised')}</div>
                  <div className="font-semibold text-[#2D2721]">{campaign.redemptions}</div>
                </div>
                <div>
                  <div className="text-xs text-[#8B7355] mb-1">{tr('Conversion', 'Konversioon')}</div>
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
            <h3 className="text-lg font-semibold text-[#2D2721] mb-2">{tr('Key Insight', 'Peamine tähelepanek')}</h3>
            <p className="text-[#6B5744] mb-3">
              {tr(
                'Your conversion rate increased by 8.5% this month. The "Summer Electronics Sale" campaign is performing exceptionally well with a 73.5% conversion rate, significantly above your average.',
                'Sinu konversioonimäär kasvas sel kuul 8.5%. Kampaania "Summer Electronics Sale" toimib erakordselt hästi 73.5% konversiooniga, mis on märgatavalt üle sinu keskmise.',
              )}
            </p>
            <WarmButton variant="outline" size="sm">
              {tr('View Recommendations', 'Vaata soovitusi')}
            </WarmButton>
          </div>
        </div>
      </WarmCard>
    </div>
  );
}
