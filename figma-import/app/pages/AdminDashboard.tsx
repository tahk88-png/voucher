import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { WarmCard } from '@/app/components/WarmCard';
import { WarmButton } from '@/app/components/WarmButton';
import { MassMessaging } from '@/app/components/MassMessaging';
import { useCountry } from '@/app/contexts/CountryContext';
import { useAdminSettings } from '@/app/contexts/AdminSettings';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { 
  Newspaper,
  LayoutTemplate,
  Sparkles,
  Send,
  Users,
  Mail,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Database,
  Shield,
  Activity,
  Calendar,
  Download,
  Eye,
  Zap,
  Target,
  Upload,
  FileSpreadsheet,
  Settings,
  BarChart3,
  MessageSquare,
  Bell,
  Smartphone,
  Store,
  DollarSign,
  Award,
  Ban,
  CheckCircle,
  XCircle,
  Clock,
  Gift,
  Globe,
  UserPlus,
  UserCheck,
  UserX,
  Percent,
  TrendingDown,
  Star,
  Heart,
  Share2,
  MousePointer,
  ShoppingBag,
  MessageCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/app/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/app/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Progress } from '@/app/components/ui/progress';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area
} from 'recharts';

// Country flag helper
const getCountryFlag = (countryName: string): string => {
  const flagMap: { [key: string]: string } = {
    'Estonia': '🇪🇪',
    'Latvia': '🇱🇻',
    'Lithuania': '🇱🇹',
    'Finland': '🇫🇮',
    'Sweden': '🇸🇪',
    'Norway': '🇳🇴',
    'Denmark': '🇩🇰',
    'Poland': '🇵🇱',
    'Germany': '🇩🇪',
    'France': '🇫🇷',
    'Spain': '🇪🇸',
    'Italy': '🇮🇹',
    'Netherlands': '🇳🇱',
    'Belgium': '🇧🇪',
  };
  return flagMap[countryName] || '🌍';
};

export function AdminDashboard() {
  const navigate = useNavigate();
  const [generatingNewsletter, setGeneratingNewsletter] = useState(false);
  const [sendingProgress, setSendingProgress] = useState(0);
  const [isSending, setIsSending] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'merchants' | 'messaging' | 'analytics' | 'payments' | 'widgets'>('overview');
  const { selectedCountry } = useCountry();
  const { chatEnabled, feedbackEnabled, setChatEnabled, setFeedbackEnabled } = useAdminSettings();
  
  // License Management State
  const [licenseModalOpen, setLicenseModalOpen] = useState(false);
  const [selectedMerchantForLicense, setSelectedMerchantForLicense] = useState<any>(null);
  const [extensionType, setExtensionType] = useState<'fixed' | 'unlimited'>('fixed');
  const [extensionDuration, setExtensionDuration] = useState('12'); // months

  const [merchantsWithLicenses, setMerchantsWithLicenses] = useState([
    { id: 1, name: 'Baltic Restaurants Group', country: 'Estonia', plan: 'Enterprise', status: 'active', licenseExpires: '2024-12-31' },
    { id: 2, name: 'Nordic Fashion Hub', country: 'Finland', plan: 'Professional', status: 'active', licenseExpires: '2024-10-15' },
    { id: 3, name: 'Riga City Deals', country: 'Latvia', plan: 'Professional', status: 'active', licenseExpires: '2024-09-01' },
    { id: 4, name: 'Vilnius Wellness', country: 'Lithuania', plan: 'Starter', status: 'active', licenseExpires: '2024-08-20' },
    { id: 5, name: 'Stockholm Beauty', country: 'Sweden', plan: 'Starter', status: 'warning', licenseExpires: '2024-07-10' },
    { id: 6, name: 'Oslo Tech Store', country: 'Norway', plan: 'Enterprise', status: 'active', licenseExpires: 'Unlimited' },
    { id: 7, name: 'Tallinn Events', country: 'Estonia', plan: 'Starter', status: 'expired', licenseExpires: '2024-01-01' },
  ]);

  const openLicenseModal = (merchant: any) => {
    setSelectedMerchantForLicense(merchant);
    setExtensionType(merchant.licenseExpires === 'Unlimited' ? 'unlimited' : 'fixed');
    setLicenseModalOpen(true);
  };

  const saveLicenseExtension = () => {
    if (!selectedMerchantForLicense) return;

    let newExpiry = 'Unlimited';
    if (extensionType === 'fixed') {
      // Logic: if currently Unlimited, start from today. If fixed date, extend from that date or today if expired.
      const currentExpiryDateStr = selectedMerchantForLicense.licenseExpires;
      let startDate = new Date();
      
      if (currentExpiryDateStr !== 'Unlimited') {
        const d = new Date(currentExpiryDateStr);
        // If not expired yet, extend from expiry. If expired, extend from today.
        if (d > new Date()) {
          startDate = d;
        }
      }
      
      const futureDate = new Date(startDate);
      futureDate.setMonth(futureDate.getMonth() + parseInt(extensionDuration));
      newExpiry = futureDate.toISOString().split('T')[0];
    }

    setMerchantsWithLicenses(prev => prev.map(m => 
      m.id === selectedMerchantForLicense.id 
        ? { ...m, licenseExpires: newExpiry, status: 'active' } // Reactivate if it was expired
        : m
    ));

    toast.success(`License updated for ${selectedMerchantForLicense.name}`);
    setLicenseModalOpen(false);
  };

  const [newsletterForm, setNewsletterForm] = useState({
    topic: '',
    tone: 'professional',
    length: 'medium',
    includeStats: true,
    includeOffers: true,
  });

  const [generatedContent, setGeneratedContent] = useState({
    subject: '',
    preview: '',
    body: '',
  });

  // GLOBAL PLATFORM STATS (filtered by selected country)
  const globalStats = {
    totalUsers: 45280,
    totalMerchants: 1247,
    activeMerchants: 1108,
    pendingApprovals: 23,
    suspendedMerchants: 12,
    totalRevenue: '€2.4M',
    platformFees: '€360K',
    activeCampaigns: 3482,
    totalVouchers: 125847,
    redeemedVouchers: 89420,
    emailsSent: '1.2M',
    avgOpenRate: '42.8%',
    avgClickRate: '12.4%',
    systemHealth: 98.5,
    serverUptime: '99.97%',
  };

  // Real-time live metrics
  const liveMetrics = [
    { label: 'Today', value: '3,247', subLabel: 'Active Users', icon: Users, color: 'text-[#9DB5A5]' },
    { label: 'Last 7d', value: '21,480', subLabel: 'Total Visits', icon: Calendar, color: 'text-[#FFC857]' },
    { label: 'Last 30d', value: '89,240', subLabel: 'Monthly Active', icon: TrendingUp, color: 'text-[#E17B5C]' },
    { label: 'Right Now', value: '287', subLabel: 'Online', icon: Activity, color: 'text-[#9DB5A5]' },
  ];

  // Platform growth data (ALL merchants combined)
  const platformGrowthData = [
    { month: 'Jan', users: 38000, merchants: 980, revenue: 1800000, campaigns: 2800 },
    { month: 'Feb', users: 39500, merchants: 1050, revenue: 1950000, campaigns: 2950 },
    { month: 'Mar', users: 41200, merchants: 1120, revenue: 2100000, campaigns: 3100 },
    { month: 'Apr', users: 42800, merchants: 1180, revenue: 2200000, campaigns: 3280 },
    { month: 'May', users: 44100, merchants: 1220, revenue: 2300000, campaigns: 3400 },
    { month: 'Jun', users: 45280, merchants: 1247, revenue: 2400000, campaigns: 3482 },
  ];

  // Revenue breakdown by country
  const revenueByCountry = [
    { country: 'Estonia', revenue: 450000, merchants: 187, color: '#FFC857' },
    { country: 'Latvia', revenue: 380000, merchants: 152, color: '#9DB5A5' },
    { country: 'Lithuania', revenue: 420000, merchants: 168, color: '#E17B5C' },
    { country: 'Finland', revenue: 510000, merchants: 198, color: '#F5C98E' },
    { country: 'Sweden', revenue: 280000, merchants: 124, color: '#8B7355' },
    { country: 'Norway', revenue: 360000, merchants: 145, color: '#9DB5A5' },
  ];

  // Country-specific breakdown (Users + Merchants + Active/Inactive)
  const countryBreakdown = [
    { 
      country: 'Estonia', 
      flag: '🇪🇪',
      users: 8420, 
      activeUsers: 7156, 
      inactiveUsers: 1264,
      merchants: 187, 
      activeMerchants: 168,
      inactiveMerchants: 19,
      revenue: 450000,
      color: '#FFC857'
    },
    { 
      country: 'Latvia', 
      flag: '🇱🇻',
      users: 6850, 
      activeUsers: 5738, 
      inactiveUsers: 1112,
      merchants: 152, 
      activeMerchants: 138,
      inactiveMerchants: 14,
      revenue: 380000,
      color: '#9DB5A5'
    },
    { 
      country: 'Lithuania', 
      flag: '🇱🇹',
      users: 7240, 
      activeUsers: 6154, 
      inactiveUsers: 1086,
      merchants: 168, 
      activeMerchants: 151,
      inactiveMerchants: 17,
      revenue: 420000,
      color: '#E17B5C'
    },
    { 
      country: 'Finland', 
      flag: '🇫🇮',
      users: 9120, 
      activeUsers: 7752, 
      inactiveUsers: 1368,
      merchants: 198, 
      activeMerchants: 179,
      inactiveMerchants: 19,
      revenue: 510000,
      color: '#F5C98E'
    },
    { 
      country: 'Sweden', 
      flag: '🇸🇪',
      users: 5680, 
      activeUsers: 4670, 
      inactiveUsers: 1010,
      merchants: 124, 
      activeMerchants: 110,
      inactiveMerchants: 14,
      revenue: 280000,
      color: '#8B7355'
    },
    { 
      country: 'Norway', 
      flag: '🇳🇴',
      users: 5420, 
      activeUsers: 4607, 
      inactiveUsers: 813,
      merchants: 145, 
      activeMerchants: 132,
      inactiveMerchants: 13,
      revenue: 360000,
      color: '#9DB5A5'
    },
    { 
      country: 'Poland', 
      flag: '🇵🇱',
      users: 1280, 
      activeUsers: 960, 
      inactiveUsers: 320,
      merchants: 48, 
      activeMerchants: 42,
      inactiveMerchants: 6,
      revenue: 85000,
      color: '#E17B5C'
    },
    { 
      country: 'Germany', 
      flag: '🇩🇪',
      users: 890, 
      activeUsers: 623, 
      inactiveUsers: 267,
      merchants: 32, 
      activeMerchants: 28,
      inactiveMerchants: 4,
      revenue: 62000,
      color: '#FFC857'
    },
    { 
      country: 'France', 
      flag: '🇫🇷',
      users: 210, 
      activeUsers: 147, 
      inactiveUsers: 63,
      merchants: 12, 
      activeMerchants: 10,
      inactiveMerchants: 2,
      revenue: 28000,
      color: '#9DB5A5'
    },
    { 
      country: 'Spain', 
      flag: '🇪🇸',
      users: 120, 
      activeUsers: 84, 
      inactiveUsers: 36,
      merchants: 8, 
      activeMerchants: 7,
      inactiveMerchants: 1,
      revenue: 18000,
      color: '#E17B5C'
    },
    { 
      country: 'Italy', 
      flag: '🇮🇹',
      users: 35, 
      activeUsers: 24, 
      inactiveUsers: 11,
      merchants: 3, 
      activeMerchants: 3,
      inactiveMerchants: 0,
      revenue: 8500,
      color: '#F5C98E'
    },
    { 
      country: 'Netherlands', 
      flag: '🇳🇱',
      users: 15, 
      activeUsers: 11, 
      inactiveUsers: 4,
      merchants: 2, 
      activeMerchants: 2,
      inactiveMerchants: 0,
      revenue: 5200,
      color: '#8B7355'
    },
  ];

  // TOP MERCHANTS (Platform-wide leaderboard)
  const topMerchants = [
    { id: 1, name: 'Baltic Restaurants Group', country: 'Estonia', revenue: '€125,400', users: 2847, campaigns: 24, status: 'active', rating: 4.9 },
    { id: 2, name: 'Nordic Fashion Hub', country: 'Finland', revenue: '€98,250', users: 2340, campaigns: 18, status: 'active', rating: 4.8 },
    { id: 3, name: 'Riga City Deals', country: 'Latvia', revenue: '€87,100', users: 1985, campaigns: 22, status: 'active', rating: 4.7 },
    { id: 4, name: 'Vilnius Wellness', country: 'Lithuania', revenue: '€76,800', users: 1720, campaigns: 16, status: 'active', rating: 4.9 },
    { id: 5, name: 'Stockholm Beauty', country: 'Sweden', revenue: '€68,900', users: 1580, campaigns: 14, status: 'active', rating: 4.6 },
    { id: 6, name: 'Oslo Tech Store', country: 'Norway', revenue: '€62,400', users: 1420, campaigns: 19, status: 'active', rating: 4.8 },
    { id: 7, name: 'Tallinn Events', country: 'Estonia', revenue: '€54,700', users: 1240, campaigns: 12, status: 'active', rating: 4.5 },
    { id: 8, name: 'Helsinki Hotels', country: 'Finland', revenue: '€48,200', users: 1050, campaigns: 15, status: 'active', rating: 4.7 },
  ];

  // PENDING MERCHANT APPROVALS
  const pendingMerchants = [
    { id: 101, name: 'New Café Tartu', country: 'Estonia', category: 'Food & Drink', submitted: '2 days ago', documents: 'Complete' },
    { id: 102, name: 'Fashion Boutique', country: 'Latvia', category: 'Fashion', submitted: '1 day ago', documents: 'Pending' },
    { id: 103, name: 'Spa Center', country: 'Lithuania', category: 'Wellness', submitted: '5 hours ago', documents: 'Complete' },
  ];

  // MERCHANT ANALYTICS DATA
  const merchantStats = {
    totalMerchants: 1247,
    activeMerchants: 1108,
    inactiveMerchants: 139,
    newMerchantsThisMonth: 84,
    avgRevenuePerMerchant: '€1,928',
    totalCampaigns: 3482,
    avgCampaignsPerMerchant: 2.8,
  };

  // Merchant categories breakdown
  const merchantCategories = [
    { category: 'Food & Drink', count: 342, percentage: 27.4, revenue: 680000, color: '#FFC857' },
    { category: 'Fashion & Beauty', count: 287, percentage: 23.0, revenue: 540000, color: '#9DB5A5' },
    { category: 'Wellness & Fitness', count: 218, percentage: 17.5, revenue: 420000, color: '#E17B5C' },
    { category: 'Travel & Hotels', count: 156, percentage: 12.5, revenue: 380000, color: '#F5C98E' },
    { category: 'Entertainment', count: 124, percentage: 9.9, revenue: 240000, color: '#8B7355' },
    { category: 'Retail & Shopping', count: 98, percentage: 7.9, revenue: 180000, color: '#7FA090' },
    { category: 'Other', count: 22, percentage: 1.8, revenue: 42000, color: '#E5D5C5' },
  ];

  // Merchant lifecycle stages
  const merchantLifecycle = [
    { stage: 'Trial (0-60d)', count: 142, percentage: 11.4, color: '#FFC857' },
    { stage: 'Active Starter', count: 487, percentage: 39.1, color: '#9DB5A5' },
    { stage: 'Active Professional', count: 624, percentage: 50.0, color: '#E17B5C' },
    { stage: 'Active Enterprise', count: 136, percentage: 10.9, color: '#F5C98E' },
    { stage: 'Churned', count: 139, percentage: 11.1, color: '#8B7355' },
  ];

  // Merchant performance tiers
  const performanceTiers = [
    { tier: 'Top Performers', count: 124, percentage: 10.0, avgRevenue: '€8,240', color: '#FFC857' },
    { tier: 'High Performers', count: 374, percentage: 30.0, avgRevenue: '€3,120', color: '#9DB5A5' },
    { tier: 'Average Performers', count: 498, percentage: 40.0, avgRevenue: '€1,450', color: '#E17B5C' },
    { tier: 'Low Performers', count: 251, percentage: 20.0, avgRevenue: '€680', color: '#8B7355' },
  ];

  // USER ANALYTICS DATA
  const userStats = {
    totalUsers: 45280,
    activeUsers: 42326,
    inactiveUsers: 2954,
    newUsersThisMonth: 3847,
    avgSessionTime: '8m 42s',
    avgPointsPerUser: 1247,
    totalPointsIssued: 56482000,
    totalReferrals: 18420,
    avgReferralsPerUser: 2.4,
  };

  // User acquisition channels
  const acquisitionChannels = [
    { channel: 'Organic Search', users: 18420, percentage: 40.7, color: '#FFC857', growth: '+12.4%' },
    { channel: 'Social Media', users: 12680, percentage: 28.0, color: '#9DB5A5', growth: '+8.2%' },
    { channel: 'Referrals', users: 8140, percentage: 18.0, color: '#E17B5C', growth: '+24.1%' },
    { channel: 'Email Marketing', users: 3620, percentage: 8.0, color: '#F5C98E', growth: '+5.7%' },
    { channel: 'Direct', users: 1810, percentage: 4.0, color: '#8B7355', growth: '+2.1%' },
    { channel: 'Paid Ads', users: 610, percentage: 1.3, color: '#7FA090', growth: '-3.2%' },
  ];

  // User lifecycle stages
  const userLifecycle = [
    { stage: 'New (0-7d)', count: 2180, percentage: 4.8, color: '#FFC857' },
    { stage: 'Active (8-30d)', count: 8420, percentage: 18.6, color: '#9DB5A5' },
    { stage: 'Engaged (31-90d)', count: 21850, percentage: 48.3, color: '#E17B5C' },
    { stage: 'At Risk (91-180d)', count: 8240, percentage: 18.2, color: '#F5C98E' },
    { stage: 'Dormant (180d+)', count: 4590, percentage: 10.1, color: '#8B7355' },
  ];

  // Top performing users (by points/referrals)
  const topUsers = [
    { id: 1, name: 'Maria Silva', email: 'maria.s@email.com', country: 'Estonia', points: 28450, referrals: 142, earnings: '€2,845', joined: '2023-08-15', status: 'active' },
    { id: 2, name: 'Johan Andersson', email: 'johan.a@email.com', country: 'Sweden', points: 24820, referrals: 128, earnings: '€2,482', joined: '2023-09-22', status: 'active' },
    { id: 3, name: 'Laura Kowalski', email: 'laura.k@email.com', country: 'Poland', points: 21340, referrals: 115, earnings: '€2,134', joined: '2023-10-10', status: 'active' },
    { id: 4, name: 'Petri Virtanen', email: 'petri.v@email.com', country: 'Finland', points: 19870, referrals: 98, earnings: '€1,987', joined: '2023-07-03', status: 'active' },
    { id: 5, name: 'Anna Bērziņa', email: 'anna.b@email.com', country: 'Latvia', points: 18420, referrals: 92, earnings: '€1,842', joined: '2023-11-18', status: 'active' },
    { id: 6, name: 'Jonas Petrauskas', email: 'jonas.p@email.com', country: 'Lithuania', points: 17650, referrals: 87, earnings: '€1,765', joined: '2023-08-29', status: 'active' },
    { id: 7, name: 'Erik Hansen', email: 'erik.h@email.com', country: 'Norway', points: 16240, referrals: 81, earnings: '€1,624', joined: '2023-09-14', status: 'active' },
    { id: 8, name: 'Sophie Dubois', email: 'sophie.d@email.com', country: 'France', points: 15890, referrals: 76, earnings: '€1,589', joined: '2023-10-25', status: 'active' },
  ];

  // User activity trends (last 6 months)
  const userActivityTrend = [
    { month: 'Jan', newUsers: 3200, activeUsers: 36420, churnedUsers: 420 },
    { month: 'Feb', newUsers: 3450, activeUsers: 37850, churnedUsers: 380 },
    { month: 'Mar', newUsers: 3680, activeUsers: 39240, churnedUsers: 350 },
    { month: 'Apr', newUsers: 3820, activeUsers: 40680, churnedUsers: 320 },
    { month: 'May', newUsers: 3950, activeUsers: 41520, churnedUsers: 290 },
    { month: 'Jun', newUsers: 4180, activeUsers: 42326, churnedUsers: 264 },
  ];

  // User demographics by age
  const userDemographics = [
    { ageGroup: '18-24', count: 6792, percentage: 15.0, color: '#FFC857' },
    { ageGroup: '25-34', count: 15848, percentage: 35.0, color: '#9DB5A5' },
    { ageGroup: '35-44', count: 12678, percentage: 28.0, color: '#E17B5C' },
    { ageGroup: '45-54', count: 7240, percentage: 16.0, color: '#F5C98E' },
    { ageGroup: '55+', count: 2722, percentage: 6.0, color: '#8B7355' },
  ];

  // User engagement metrics
  const engagementMetrics = [
    { metric: 'Daily Active Users', value: '12,847', trend: '+5.2%', icon: Activity, color: 'text-[#9DB5A5]' },
    { metric: 'Weekly Active Users', value: '28,420', trend: '+3.8%', icon: Calendar, color: 'text-[#FFC857]' },
    { metric: 'Monthly Active Users', value: '42,326', trend: '+2.4%', icon: Users, color: 'text-[#E17B5C]' },
    { metric: 'Avg Session Duration', value: '8m 42s', trend: '+1.2m', icon: Clock, color: 'text-[#F5C98E]' },
  ];

  // User segments for messaging
  const userSegments = [
    { name: 'All Users', count: 45280, selected: true },
    { name: 'Active Users (30d)', count: 32150, selected: false },
    { name: 'All Merchants', count: 1247, selected: false },
    { name: 'Premium Users', count: 8420, selected: false },
    { name: 'New Users (7d)', count: 2180, selected: false },
  ];

  const [selectedSegments, setSelectedSegments] = useState<string[]>(['All Users']);

  // Newsletter templates
  const newsletterTemplates = [
    {
      id: 1,
      name: 'Monthly Update',
      topic: 'Platform highlights and new features',
      openRate: '45%',
      lastUsed: '2 weeks ago',
    },
    {
      id: 2,
      name: 'Special Offer',
      topic: 'Limited time promotions',
      openRate: '52%',
      lastUsed: '1 week ago',
    },
    {
      id: 3,
      name: 'Product Launch',
      topic: 'New feature announcements',
      openRate: '48%',
      lastUsed: '3 days ago',
    },
  ];

  // Recent newsletters
  const recentNewsletters = [
    { id: 1, subject: 'Summer Sale Alert! 🌞', sent: 45280, opened: 19425, clicked: 5614, date: '2024-06-15' },
    { id: 2, subject: 'New Features: QR Designer & More', sent: 43100, opened: 20688, clicked: 5346, date: '2024-06-08' },
    { id: 3, subject: 'Weekly Digest: Top Campaigns', sent: 42800, opened: 18276, clicked: 4908, date: '2024-06-01' },
  ];

  const generateNewsletter = async () => {
    if (!newsletterForm.topic) {
      toast.error('Please enter a topic for the newsletter');
      return;
    }

    setGeneratingNewsletter(true);
    
    // Simulate AI generation
    await new Promise(resolve => setTimeout(resolve, 2000));

    const generated = {
      subject: `${newsletterForm.topic} - ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`,
      preview: `Exciting updates about ${newsletterForm.topic.toLowerCase()}...`,
      body: `Dear Valued User,

We're excited to share some updates about ${newsletterForm.topic}!

${newsletterForm.includeStats ? `📊 Platform Highlights:
• ${globalStats.totalUsers.toLocaleString()} active users
• ${globalStats.activeCampaigns.toLocaleString()} campaigns running
• ${globalStats.avgOpenRate} average engagement rate

` : ''}${newsletterForm.includeOffers ? `🎁 Special Offers:
Take advantage of our latest promotions and exclusive deals designed just for you.

` : ''}What's New:
This month we've been working hard to bring you the best experience possible. Here's what's new on our platform.

Key Features:
✓ Enhanced analytics dashboard
✓ Advanced QR code designer
✓ Bulk email capabilities
✓ Real-time notifications

We're committed to making your experience exceptional. Thank you for being part of our community!

Best regards,
The Vouchers Platform Team

---
If you no longer wish to receive these emails, you can unsubscribe here.`,
    };

    setGeneratedContent(generated);
    setGeneratingNewsletter(false);
    toast.success('Newsletter generated successfully!');
  };

  const sendNewsletter = async () => {
    if (!generatedContent.subject) {
      toast.error('Please generate a newsletter first');
      return;
    }

    const totalRecipients = selectedSegments.reduce((sum, segmentName) => {
      const segment = userSegments.find(s => s.name === segmentName);
      return sum + (segment?.count || 0);
    }, 0);

    setIsSending(true);
    setSendingProgress(0);

    // Simulate sending in batches
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 300));
      setSendingProgress(i);
    }

    setIsSending(false);
    toast.success(`Newsletter sent to ${totalRecipients.toLocaleString()} recipients!`);
  };

  const toggleSegment = (segmentName: string) => {
    setSelectedSegments(prev => 
      prev.includes(segmentName)
        ? prev.filter(s => s !== segmentName)
        : [...prev, segmentName]
    );
  };

  const selectedRecipientsCount = selectedSegments.reduce((sum, segmentName) => {
    const segment = userSegments.find(s => s.name === segmentName);
    return sum + (segment?.count || 0);
  }, 0);

  const approveMerchant = (id: number) => {
    toast.success('Merchant approved successfully!');
  };

  const rejectMerchant = (id: number) => {
    toast.error('Merchant application rejected');
  };

  const COLORS = ['#FFC857', '#9DB5A5', '#E17B5C', '#F5C98E', '#8B7355', '#7FA090'];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-[#2D2721] mb-2">Platform Control Center</h1>
          <p className="text-lg text-[#6B5744]">Manage entire platform • {selectedCountry?.name || 'All Countries'}</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-br from-[#9DB5A5] to-[#7FA090] shadow-warm">
          <Shield className="h-5 w-5 text-white" />
          <span className="font-semibold text-white">Super Admin</span>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <WarmButton
          variant={activeTab === 'overview' ? 'default' : 'outline'}
          onClick={() => setActiveTab('overview')}
        >
          <Eye className="h-4 w-4 mr-2" />
          Overview
        </WarmButton>
        <WarmButton
          variant={activeTab === 'users' ? 'default' : 'outline'}
          onClick={() => setActiveTab('users')}
        >
          <Users className="h-4 w-4 mr-2" />
          Users ({globalStats.totalUsers.toLocaleString()})
        </WarmButton>
        <WarmButton
          variant={activeTab === 'merchants' ? 'default' : 'outline'}
          onClick={() => setActiveTab('merchants')}
        >
          <Store className="h-4 w-4 mr-2" />
          Merchants ({globalStats.totalMerchants})
        </WarmButton>
        <WarmButton
          variant={activeTab === 'messaging' ? 'default' : 'outline'}
          onClick={() => setActiveTab('messaging')}
        >
          <Mail className="h-4 w-4 mr-2" />
          Mass Messaging
        </WarmButton>
        <WarmButton
          variant="outline"
          onClick={() => navigate('/admin/email-templates')}
        >
          <LayoutTemplate className="h-4 w-4 mr-2" />
          Templates
        </WarmButton>
        <WarmButton
          variant={activeTab === 'analytics' ? 'default' : 'outline'}
          onClick={() => setActiveTab('analytics')}
        >
          <BarChart3 className="h-4 w-4 mr-2" />
          Analytics
        </WarmButton>
        <WarmButton
          variant={activeTab === 'payments' ? 'default' : 'outline'}
          onClick={() => setActiveTab('payments')}
        >
          <DollarSign className="h-4 w-4 mr-2" />
          Payments
        </WarmButton>
        <WarmButton
          variant={activeTab === 'widgets' ? 'default' : 'outline'}
          onClick={() => setActiveTab('widgets')}
        >
          <MessageSquare className="h-4 w-4 mr-2" />
          Widgets
        </WarmButton>
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <>
          {/* Global Platform Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <WarmCard hover padding="lg">
              <div className="flex items-start justify-between mb-3">
                <div className="w-12 h-12 rounded-[14px] bg-gradient-to-br from-[#9DB5A5] to-[#7FA090] flex items-center justify-center shadow-warm">
                  <Users className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="text-3xl font-bold text-[#2D2721] mb-1">{globalStats.totalUsers.toLocaleString()}</div>
              <div className="text-sm text-[#8B7355]">Total Users</div>
            </WarmCard>

            <WarmCard hover padding="lg">
              <div className="flex items-start justify-between mb-3">
                <div className="w-12 h-12 rounded-[14px] bg-gradient-to-br from-[#FFC857] to-[#FFB627] flex items-center justify-center shadow-warm">
                  <Store className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="text-3xl font-bold text-[#2D2721] mb-1">{globalStats.totalMerchants.toLocaleString()}</div>
              <div className="text-sm text-[#8B7355]">Total Merchants</div>
            </WarmCard>

            <WarmCard hover padding="lg">
              <div className="flex items-start justify-between mb-3">
                <div className="w-12 h-12 rounded-[14px] bg-gradient-to-br from-[#E17B5C] to-[#D16B4C] flex items-center justify-center shadow-warm">
                  <DollarSign className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="text-3xl font-bold text-[#2D2721] mb-1">{globalStats.totalRevenue}</div>
              <div className="text-sm text-[#8B7355]">Total Revenue</div>
            </WarmCard>

            <WarmCard hover padding="lg">
              <div className="flex items-start justify-between mb-3">
                <div className="w-12 h-12 rounded-[14px] bg-gradient-to-br from-[#F5C98E] to-[#E5B97E] flex items-center justify-center shadow-warm">
                  <Activity className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="text-3xl font-bold text-[#2D2721] mb-1">{globalStats.systemHealth}%</div>
              <div className="text-sm text-[#8B7355]">System Health</div>
            </WarmCard>
          </div>

          {/* Live Metrics */}
          <WarmCard padding="lg">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-2 h-2 rounded-full bg-[#9DB5A5] animate-pulse" />
              <h3 className="text-lg font-semibold text-[#2D2721]">Live Metrics</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {liveMetrics.map((metric) => (
                <div key={metric.label} className="flex items-center gap-4 p-4 bg-gradient-to-br from-[#FFF9ED] to-[#FFE5B4] rounded-[14px]">
                  <metric.icon className={`h-8 w-8 ${metric.color}`} />
                  <div>
                    <div className="text-2xl font-bold text-[#2D2721]">{metric.value}</div>
                    <div className="text-xs text-[#8B7355]">{metric.subLabel}</div>
                  </div>
                </div>
              ))}
            </div>
          </WarmCard>

          {/* Platform Growth Chart */}
          <WarmCard padding="lg">
            <h3 className="text-xl font-bold text-[#2D2721] mb-6">Platform Growth (6 Months)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={platformGrowthData}>
                <defs>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#9DB5A5" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#9DB5A5" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FFC857" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#FFC857" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(139,115,85,0.1)" />
                <XAxis dataKey="month" stroke="#8B7355" />
                <YAxis stroke="#8B7355" />
                <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid rgba(139,115,85,0.2)', borderRadius: '12px' }} />
                <Legend />
                <Area type="monotone" dataKey="users" stroke="#9DB5A5" fillOpacity={1} fill="url(#colorUsers)" name="Users" />
                <Area type="monotone" dataKey="revenue" stroke="#FFC857" fillOpacity={1} fill="url(#colorRevenue)" name="Revenue (€)" />
              </AreaChart>
            </ResponsiveContainer>
          </WarmCard>

          {/* Revenue by Country */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <WarmCard padding="lg">
              <h3 className="text-xl font-bold text-[#2D2721] mb-6">Revenue by Country</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={revenueByCountry}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ country, percent }) => `${country} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="revenue"
                  >
                    {revenueByCountry.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </WarmCard>

            <WarmCard padding="lg">
              <h3 className="text-xl font-bold text-[#2D2721] mb-6">Merchant Status</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gradient-to-br from-[#9DB5A5]/10 to-[#7FA090]/10 rounded-[12px]">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-6 w-6 text-[#9DB5A5]" />
                    <span className="font-semibold text-[#2D2721]">Active Merchants</span>
                  </div>
                  <span className="text-2xl font-bold text-[#2D2721]">{globalStats.activeMerchants}</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-gradient-to-br from-[#FFC857]/10 to-[#FFB627]/10 rounded-[12px]">
                  <div className="flex items-center gap-3">
                    <Clock className="h-6 w-6 text-[#FFC857]" />
                    <span className="font-semibold text-[#2D2721]">Pending Approvals</span>
                  </div>
                  <span className="text-2xl font-bold text-[#2D2721]">{globalStats.pendingApprovals}</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-gradient-to-br from-[#E17B5C]/10 to-[#D16B4C]/10 rounded-[12px]">
                  <div className="flex items-center gap-3">
                    <Ban className="h-6 w-6 text-[#E17B5C]" />
                    <span className="font-semibold text-[#2D2721]">Suspended</span>
                  </div>
                  <span className="text-2xl font-bold text-[#2D2721]">{globalStats.suspendedMerchants}</span>
                </div>
              </div>
            </WarmCard>
          </div>

          {/* Country Breakdown Table */}
          <WarmCard padding="lg">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-[#2D2721]">Country Breakdown</h3>
                <p className="text-sm text-[#8B7355] mt-1">Users & Merchants by Country (Active/Inactive)</p>
              </div>
              <WarmButton variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </WarmButton>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[rgba(139,115,85,0.1)]">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B5744]">Country</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B5744]">Total Users</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B5744]">Active Users</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B5744]">Inactive Users</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B5744]">Total Merchants</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B5744]">Active Merch.</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B5744]">Inactive Merch.</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B5744]">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {countryBreakdown.map((country) => {
                    const userActiveRate = ((country.activeUsers / country.users) * 100).toFixed(1);
                    const merchantActiveRate = ((country.activeMerchants / country.merchants) * 100).toFixed(1);
                    
                    return (
                      <tr key={country.country} className="border-b border-[rgba(139,115,85,0.05)] hover:bg-[#FFF9ED] transition-colors">
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">{country.flag}</span>
                            <span className="font-semibold text-[#2D2721]">{country.country}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4 font-bold text-[#2D2721]">{country.users.toLocaleString()}</td>
                        <td className="py-4 px-4">
                          <div className="flex flex-col">
                            <span className="font-semibold text-[#9DB5A5]">{country.activeUsers.toLocaleString()}</span>
                            <span className="text-xs text-[#8B7355]">{userActiveRate}%</span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex flex-col">
                            <span className="font-semibold text-[#E17B5C]">{country.inactiveUsers.toLocaleString()}</span>
                            <span className="text-xs text-[#8B7355]">{(100 - parseFloat(userActiveRate)).toFixed(1)}%</span>
                          </div>
                        </td>
                        <td className="py-4 px-4 font-bold text-[#2D2721]">{country.merchants.toLocaleString()}</td>
                        <td className="py-4 px-4">
                          <div className="flex flex-col">
                            <span className="font-semibold text-[#9DB5A5]">{country.activeMerchants.toLocaleString()}</span>
                            <span className="text-xs text-[#8B7355]">{merchantActiveRate}%</span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex flex-col">
                            <span className="font-semibold text-[#E17B5C]">{country.inactiveMerchants.toLocaleString()}</span>
                            <span className="text-xs text-[#8B7355]">{(100 - parseFloat(merchantActiveRate)).toFixed(1)}%</span>
                          </div>
                        </td>
                        <td className="py-4 px-4 font-bold text-[#FFC857]">€{(country.revenue / 1000).toFixed(1)}K</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-[rgba(139,115,85,0.2)] bg-gradient-to-br from-[#FFF9ED] to-[#FFE5B4]">
                    <td className="py-4 px-4 font-bold text-[#2D2721]">TOTAL</td>
                    <td className="py-4 px-4 font-bold text-[#2D2721]">{countryBreakdown.reduce((sum, c) => sum + c.users, 0).toLocaleString()}</td>
                    <td className="py-4 px-4 font-bold text-[#9DB5A5]">{countryBreakdown.reduce((sum, c) => sum + c.activeUsers, 0).toLocaleString()}</td>
                    <td className="py-4 px-4 font-bold text-[#E17B5C]">{countryBreakdown.reduce((sum, c) => sum + c.inactiveUsers, 0).toLocaleString()}</td>
                    <td className="py-4 px-4 font-bold text-[#2D2721]">{countryBreakdown.reduce((sum, c) => sum + c.merchants, 0).toLocaleString()}</td>
                    <td className="py-4 px-4 font-bold text-[#9DB5A5]">{countryBreakdown.reduce((sum, c) => sum + c.activeMerchants, 0).toLocaleString()}</td>
                    <td className="py-4 px-4 font-bold text-[#E17B5C]">{countryBreakdown.reduce((sum, c) => sum + c.inactiveMerchants, 0).toLocaleString()}</td>
                    <td className="py-4 px-4 font-bold text-[#FFC857]">€{(countryBreakdown.reduce((sum, c) => sum + c.revenue, 0) / 1000).toFixed(1)}K</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </WarmCard>
        </>
      )}

      {/* USERS TAB */}
      {activeTab === 'users' && (
        <>
          {/* User Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <WarmCard hover padding="lg">
              <div className="flex items-start justify-between mb-3">
                <div className="w-12 h-12 rounded-[14px] bg-gradient-to-br from-[#9DB5A5] to-[#7FA090] flex items-center justify-center shadow-warm">
                  <Users className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="text-3xl font-bold text-[#2D2721] mb-1">{userStats.totalUsers.toLocaleString()}</div>
              <div className="text-sm text-[#8B7355]">Total Users</div>
              <div className="mt-2 flex items-center gap-1 text-xs">
                <TrendingUp className="h-3 w-3 text-[#9DB5A5]" />
                <span className="text-[#9DB5A5] font-semibold">+{userStats.newUsersThisMonth.toLocaleString()} this month</span>
              </div>
            </WarmCard>

            <WarmCard hover padding="lg">
              <div className="flex items-start justify-between mb-3">
                <div className="w-12 h-12 rounded-[14px] bg-gradient-to-br from-[#FFC857] to-[#FFB627] flex items-center justify-center shadow-warm">
                  <UserCheck className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="text-3xl font-bold text-[#2D2721] mb-1">{userStats.activeUsers.toLocaleString()}</div>
              <div className="text-sm text-[#8B7355]">Active Users (30d)</div>
              <div className="mt-2">
                <Progress value={(userStats.activeUsers / userStats.totalUsers) * 100} className="h-2" />
              </div>
            </WarmCard>

            <WarmCard hover padding="lg">
              <div className="flex items-start justify-between mb-3">
                <div className="w-12 h-12 rounded-[14px] bg-gradient-to-br from-[#E17B5C] to-[#D16B4C] flex items-center justify-center shadow-warm">
                  <Share2 className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="text-3xl font-bold text-[#2D2721] mb-1">{userStats.totalReferrals.toLocaleString()}</div>
              <div className="text-sm text-[#8B7355]">Total Referrals</div>
              <div className="mt-2 text-xs text-[#6B5744]">
                Avg {userStats.avgReferralsPerUser} per user
              </div>
            </WarmCard>

            <WarmCard hover padding="lg">
              <div className="flex items-start justify-between mb-3">
                <div className="w-12 h-12 rounded-[14px] bg-gradient-to-br from-[#F5C98E] to-[#E5B97E] flex items-center justify-center shadow-warm">
                  <Award className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="text-3xl font-bold text-[#2D2721] mb-1">{(userStats.totalPointsIssued / 1000000).toFixed(1)}M</div>
              <div className="text-sm text-[#8B7355]">Points Issued</div>
              <div className="mt-2 text-xs text-[#6B5744]">
                Avg {userStats.avgPointsPerUser.toLocaleString()} per user
              </div>
            </WarmCard>
          </div>

          {/* Engagement Metrics */}
          <WarmCard padding="lg">
            <h3 className="text-xl font-bold text-[#2D2721] mb-6">User Engagement Metrics</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {engagementMetrics.map((metric) => (
                <div key={metric.metric} className="flex items-center gap-4 p-4 bg-gradient-to-br from-[#FFF9ED] to-[#FFE5B4] rounded-[14px]">
                  <metric.icon className={`h-8 w-8 ${metric.color}`} />
                  <div>
                    <div className="text-2xl font-bold text-[#2D2721]">{metric.value}</div>
                    <div className="text-xs text-[#8B7355]">{metric.metric}</div>
                    <div className="text-xs text-[#9DB5A5] font-semibold mt-1">{metric.trend}</div>
                  </div>
                </div>
              ))}
            </div>
          </WarmCard>

          {/* User Activity Trend & Acquisition Channels */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <WarmCard padding="lg">
              <h3 className="text-xl font-bold text-[#2D2721] mb-6">User Activity Trend (6 Months)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={userActivityTrend}>
                  <defs>
                    <linearGradient id="colorNewUsers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FFC857" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#FFC857" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorActiveUsers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#9DB5A5" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#9DB5A5" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(139,115,85,0.1)" />
                  <XAxis dataKey="month" stroke="#8B7355" />
                  <YAxis stroke="#8B7355" />
                  <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid rgba(139,115,85,0.2)', borderRadius: '12px' }} />
                  <Legend />
                  <Area type="monotone" dataKey="newUsers" stroke="#FFC857" fillOpacity={1} fill="url(#colorNewUsers)" name="New Users" />
                  <Area type="monotone" dataKey="activeUsers" stroke="#9DB5A5" fillOpacity={1} fill="url(#colorActiveUsers)" name="Active Users" />
                  <Area type="monotone" dataKey="churnedUsers" stroke="#E17B5C" fill="none" name="Churned Users" />
                </AreaChart>
              </ResponsiveContainer>
            </WarmCard>

            <WarmCard padding="lg">
              <h3 className="text-xl font-bold text-[#2D2721] mb-6">Acquisition Channels</h3>
              <div className="space-y-4">
                {acquisitionChannels.map((channel) => (
                  <div key={channel.channel}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: channel.color }} />
                        <span className="font-medium text-[#2D2721]">{channel.channel}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-[#6B5744]">{channel.users.toLocaleString()}</span>
                        <span className={`text-sm font-semibold ${channel.growth.startsWith('+') ? 'text-[#9DB5A5]' : 'text-[#E17B5C]'}`}>
                          {channel.growth}
                        </span>
                      </div>
                    </div>
                    <Progress value={channel.percentage} className="h-2" />
                  </div>
                ))}
              </div>
            </WarmCard>
          </div>

          {/* User Lifecycle & Demographics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <WarmCard padding="lg">
              <h3 className="text-xl font-bold text-[#2D2721] mb-6">User Lifecycle Stages</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={userLifecycle}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ stage, percentage }) => `${stage}: ${percentage.toFixed(1)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {userLifecycle.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </WarmCard>

            <WarmCard padding="lg">
              <h3 className="text-xl font-bold text-[#2D2721] mb-6">Demographics by Age</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={userDemographics}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(139,115,85,0.1)" />
                  <XAxis dataKey="ageGroup" stroke="#8B7355" />
                  <YAxis stroke="#8B7355" />
                  <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid rgba(139,115,85,0.2)', borderRadius: '12px' }} />
                  <Bar dataKey="count" fill="#FFC857" radius={[8, 8, 0, 0]}>
                    {userDemographics.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </WarmCard>
          </div>

          {/* Top Performing Users */}
          <WarmCard padding="lg">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-[#2D2721]">Top Performing Users</h3>
                <p className="text-sm text-[#8B7355] mt-1">Ranked by total points earned</p>
              </div>
              <WarmButton variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export List
              </WarmButton>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[rgba(139,115,85,0.1)]">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B5744]">Rank</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B5744]">User</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B5744]">Country</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B5744]">Points</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B5744]">Referrals</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B5744]">Earnings</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B5744]">Joined</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B5744]">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {topUsers.map((user, idx) => (
                    <tr key={user.id} className="border-b border-[rgba(139,115,85,0.05)] hover:bg-[#FFF9ED] transition-colors">
                      <td className="py-4 px-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                          idx === 0 ? 'bg-[#FFC857] text-white' :
                          idx === 1 ? 'bg-[#9DB5A5] text-white' :
                          idx === 2 ? 'bg-[#E17B5C] text-white' :
                          'bg-gray-200 text-[#6B5744]'
                        }`}>
                          {idx + 1}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-semibold text-[#2D2721]">{user.name}</div>
                        <div className="text-xs text-[#8B7355]">{user.email}</div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{getCountryFlag(user.country)}</span>
                          <span className="text-[#6B5744]">{user.country}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 font-bold text-[#FFC857]">{user.points.toLocaleString()}</td>
                      <td className="py-4 px-4 font-semibold text-[#9DB5A5]">{user.referrals}</td>
                      <td className="py-4 px-4 font-bold text-[#2D2721]">{user.earnings}</td>
                      <td className="py-4 px-4 text-[#6B5744]">{new Date(user.joined).toLocaleDateString()}</td>
                      <td className="py-4 px-4">
                        <span className="px-3 py-1 bg-[#9DB5A5] text-white text-xs rounded-full font-semibold">
                          {user.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </WarmCard>

          {/* User Insights & Alerts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <WarmCard padding="lg">
              <h3 className="text-xl font-bold text-[#2D2721] mb-6">User Insights</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 bg-gradient-to-br from-[#9DB5A5]/10 to-[#7FA090]/10 rounded-[12px]">
                  <TrendingUp className="h-6 w-6 text-[#9DB5A5] flex-shrink-0 mt-1" />
                  <div>
                    <div className="font-semibold text-[#2D2721] mb-1">Strong Referral Growth</div>
                    <div className="text-sm text-[#6B5744]">Referral signups increased by 24.1% this month, the highest channel growth.</div>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-gradient-to-br from-[#FFC857]/10 to-[#FFB627]/10 rounded-[12px]">
                  <Star className="h-6 w-6 text-[#FFC857] flex-shrink-0 mt-1" />
                  <div>
                    <div className="font-semibold text-[#2D2721] mb-1">High Engagement Rate</div>
                    <div className="text-sm text-[#6B5744]">93.5% of users are active in the last 30 days, exceeding industry benchmarks.</div>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-gradient-to-br from-[#E17B5C]/10 to-[#D16B4C]/10 rounded-[12px]">
                  <Heart className="h-6 w-6 text-[#E17B5C] flex-shrink-0 mt-1" />
                  <div>
                    <div className="font-semibold text-[#2D2721] mb-1">Top Markets: Nordics & Baltics</div>
                    <div className="text-sm text-[#6B5744]">Finland, Estonia, and Lithuania account for 54% of all active users.</div>
                  </div>
                </div>
              </div>
            </WarmCard>

            <WarmCard padding="lg">
              <h3 className="text-xl font-bold text-[#2D2721] mb-6">Action Items</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-4 bg-[#FFF3E0] border border-[#E17B5C] rounded-[12px]">
                  <AlertCircle className="h-5 w-5 text-[#E17B5C] flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-[#2D2721] text-sm mb-1">4,590 Dormant Users (180d+)</div>
                    <div className="text-xs text-[#6B5744] mb-2">Launch re-engagement campaign with special offers.</div>
                    <WarmButton size="sm" variant="outline">Create Campaign</WarmButton>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-[#E3F2FD] border border-[#9DB5A5] rounded-[12px]">
                  <UserPlus className="h-5 w-5 text-[#9DB5A5] flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-[#2D2721] text-sm mb-1">2,180 New Users This Week</div>
                    <div className="text-xs text-[#6B5744] mb-2">Send welcome series to improve activation rate.</div>
                    <WarmButton size="sm" variant="outline">Send Welcome</WarmButton>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-[#FFF9ED] border border-[#FFC857] rounded-[12px]">
                  <Target className="h-5 w-5 text-[#FFC857] flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-[#2D2721] text-sm mb-1">Low Activation in New Markets</div>
                    <div className="text-xs text-[#6B5744] mb-2">Germany, France, Spain at 70% activation vs 85% target.</div>
                    <WarmButton size="sm" variant="outline">View Details</WarmButton>
                  </div>
                </div>
              </div>
            </WarmCard>
          </div>
        </>
      )}

      {/* MERCHANTS TAB */}
      {activeTab === 'merchants' && (
        <>
          {/* Merchant Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <WarmCard hover padding="lg">
              <div className="flex items-start justify-between mb-3">
                <div className="w-12 h-12 rounded-[14px] bg-gradient-to-br from-[#FFC857] to-[#FFB627] flex items-center justify-center shadow-warm">
                  <Store className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="text-3xl font-bold text-[#2D2721] mb-1">{merchantStats.totalMerchants.toLocaleString()}</div>
              <div className="text-sm text-[#8B7355]">Total Merchants</div>
              <div className="mt-2 flex items-center gap-1 text-xs">
                <TrendingUp className="h-3 w-3 text-[#9DB5A5]" />
                <span className="text-[#9DB5A5] font-semibold">+{merchantStats.newMerchantsThisMonth} this month</span>
              </div>
            </WarmCard>

            <WarmCard hover padding="lg">
              <div className="flex items-start justify-between mb-3">
                <div className="w-12 h-12 rounded-[14px] bg-gradient-to-br from-[#9DB5A5] to-[#7FA090] flex items-center justify-center shadow-warm">
                  <CheckCircle className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="text-3xl font-bold text-[#2D2721] mb-1">{merchantStats.activeMerchants.toLocaleString()}</div>
              <div className="text-sm text-[#8B7355]">Active Merchants</div>
              <div className="mt-2">
                <Progress value={(merchantStats.activeMerchants / merchantStats.totalMerchants) * 100} className="h-2" />
              </div>
            </WarmCard>

            <WarmCard hover padding="lg">
              <div className="flex items-start justify-between mb-3">
                <div className="w-12 h-12 rounded-[14px] bg-gradient-to-br from-[#E17B5C] to-[#D16B4C] flex items-center justify-center shadow-warm">
                  <DollarSign className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="text-3xl font-bold text-[#2D2721] mb-1">{merchantStats.avgRevenuePerMerchant}</div>
              <div className="text-sm text-[#8B7355]">Avg Revenue / Merchant</div>
              <div className="mt-2 text-xs text-[#6B5744]">
                Platform MRR: €360K
              </div>
            </WarmCard>

            <WarmCard hover padding="lg">
              <div className="flex items-start justify-between mb-3">
                <div className="w-12 h-12 rounded-[14px] bg-gradient-to-br from-[#F5C98E] to-[#E5B97E] flex items-center justify-center shadow-warm">
                  <Gift className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="text-3xl font-bold text-[#2D2721] mb-1">{merchantStats.totalCampaigns.toLocaleString()}</div>
              <div className="text-sm text-[#8B7355]">Total Campaigns</div>
              <div className="mt-2 text-xs text-[#6B5744]">
                Avg {merchantStats.avgCampaignsPerMerchant} per merchant
              </div>
            </WarmCard>
          </div>

          {/* Merchant Categories & Performance Tiers */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <WarmCard padding="lg">
              <h3 className="text-xl font-bold text-[#2D2721] mb-6">Merchants by Category</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={merchantCategories}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ category, percentage }) => `${category}: ${percentage.toFixed(1)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {merchantCategories.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </WarmCard>

            <WarmCard padding="lg">
              <h3 className="text-xl font-bold text-[#2D2721] mb-6">Performance Tiers</h3>
              <div className="space-y-4">
                {performanceTiers.map((tier) => (
                  <div key={tier.tier}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: tier.color }} />
                        <span className="font-medium text-[#2D2721]">{tier.tier}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-[#6B5744]">{tier.count} merchants</span>
                        <span className="text-sm font-semibold text-[#FFC857]">{tier.avgRevenue}</span>
                      </div>
                    </div>
                    <Progress value={tier.percentage} className="h-2" />
                  </div>
                ))}
              </div>
            </WarmCard>
          </div>

          {/* Pending Approvals */}
          {pendingMerchants.length > 0 && (
            <WarmCard padding="lg">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-[#2D2721]">Pending Merchant Approvals ({pendingMerchants.length})</h3>
                <div className="px-3 py-1 bg-[#FFC857] rounded-full">
                  <span className="text-sm font-bold text-white">Action Required</span>
                </div>
              </div>
              <div className="space-y-3">
                {pendingMerchants.map((merchant) => (
                  <div key={merchant.id} className="flex items-center justify-between p-4 bg-gradient-to-br from-[#FFF9ED] to-[#FFE5B4] rounded-[14px] border border-[rgba(139,115,85,0.1)]">
                    <div className="flex-1">
                      <div className="font-semibold text-[#2D2721] mb-1">{merchant.name}</div>
                      <div className="flex items-center gap-4 text-sm text-[#8B7355]">
                        <span className="flex items-center gap-1">
                          <Globe className="h-3 w-3" />
                          {merchant.country}
                        </span>
                        <span>{merchant.category}</span>
                        <span>Submitted {merchant.submitted}</span>
                        <span className={merchant.documents === 'Complete' ? 'text-[#9DB5A5] font-semibold' : 'text-[#E17B5C] font-semibold'}>
                          {merchant.documents}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <WarmButton size="sm" variant="outline" onClick={() => rejectMerchant(merchant.id)}>
                        <XCircle className="h-4 w-4 mr-1" />
                        Reject
                      </WarmButton>
                      <WarmButton size="sm" onClick={() => approveMerchant(merchant.id)}>
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        Approve
                      </WarmButton>
                    </div>
                  </div>
                ))}
              </div>
            </WarmCard>
          )}

          {/* Client License Management */}
          <WarmCard padding="lg">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-[#2D2721]">Client License Management</h3>
                <p className="text-sm text-[#8B7355] mt-1">Monitor and extend merchant licenses</p>
              </div>
              <div className="flex gap-2">
                 <Input className="h-9 w-[200px] bg-white border-[rgba(139,115,85,0.2)]" placeholder="Search clients..." />
                 <WarmButton variant="outline" size="sm">
                   <Filter className="h-4 w-4 mr-2" />
                   Filter
                 </WarmButton>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[rgba(139,115,85,0.1)]">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B5744]">Client Name</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B5744]">Country</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B5744]">Current Plan</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B5744]">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B5744]">License Expires</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-[#6B5744]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {merchantsWithLicenses.map((merchant) => (
                    <tr key={merchant.id} className="border-b border-[rgba(139,115,85,0.05)] hover:bg-[#FFF9ED] transition-colors">
                      <td className="py-4 px-4 font-semibold text-[#2D2721]">{merchant.name}</td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{getCountryFlag(merchant.country)}</span>
                          <span className="text-[#6B5744]">{merchant.country}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          merchant.plan === 'Enterprise' ? 'bg-[#E17B5C]/10 text-[#E17B5C]' :
                          merchant.plan === 'Professional' ? 'bg-[#FFC857]/10 text-[#B58D3F]' :
                          'bg-[#9DB5A5]/10 text-[#2D5B46]'
                        }`}>
                          {merchant.plan}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1.5">
                          <div className={`w-2 h-2 rounded-full ${
                            merchant.status === 'active' ? 'bg-[#9DB5A5]' : 
                            merchant.status === 'expired' ? 'bg-[#E17B5C]' : 'bg-[#FFC857]'
                          }`} />
                          <span className="text-sm capitalize text-[#6B5744]">{merchant.status}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 font-mono text-sm text-[#2D2721]">
                        {merchant.licenseExpires === 'Unlimited' ? (
                          <span className="flex items-center gap-1 text-[#9DB5A5] font-bold">
                            <Sparkles className="h-3 w-3" />
                            Unlimited
                          </span>
                        ) : (
                          merchant.licenseExpires
                        )}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <WarmButton size="sm" variant="outline" onClick={() => openLicenseModal(merchant)}>
                          <Clock className="h-3 w-3 mr-1" />
                          Extend
                        </WarmButton>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </WarmCard>

          {/* Top Merchants Leaderboard */}
          <WarmCard padding="lg">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-[#2D2721]">Top Performing Merchants</h3>
              <WarmButton variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </WarmButton>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[rgba(139,115,85,0.1)]">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B5744]">Rank</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B5744]">Merchant</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B5744]">Country</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B5744]">Revenue</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B5744]">Users</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B5744]">Campaigns</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B5744]">Rating</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B5744]">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {topMerchants.map((merchant, idx) => (
                    <tr key={merchant.id} className="border-b border-[rgba(139,115,85,0.05)] hover:bg-[#FFF9ED] transition-colors">
                      <td className="py-4 px-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                          idx === 0 ? 'bg-[#FFC857] text-white' :
                          idx === 1 ? 'bg-[#9DB5A5] text-white' :
                          idx === 2 ? 'bg-[#E17B5C] text-white' :
                          'bg-gray-200 text-[#6B5744]'
                        }`}>
                          {idx + 1}
                        </div>
                      </td>
                      <td className="py-4 px-4 font-semibold text-[#2D2721]">{merchant.name}</td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{getCountryFlag(merchant.country)}</span>
                          <span className="text-[#6B5744]">{merchant.country}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 font-semibold text-[#2D2721]">{merchant.revenue}</td>
                      <td className="py-4 px-4 text-[#6B5744]">{merchant.users.toLocaleString()}</td>
                      <td className="py-4 px-4 text-[#6B5744]">{merchant.campaigns}</td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1">
                          <Award className="h-4 w-4 text-[#FFC857]" />
                          <span className="font-semibold text-[#2D2721]">{merchant.rating}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="px-3 py-1 bg-[#9DB5A5] text-white text-xs rounded-full font-semibold">
                          {merchant.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </WarmCard>
        </>
      )}

      {/* MESSAGING TAB */}
      {activeTab === 'messaging' && (
        <>
          <MassMessaging userSegments={userSegments} />

          {/* Newsletter Generator Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <WarmCard padding="lg">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-[12px] bg-gradient-to-br from-[#FFC857] to-[#FFB627] flex items-center justify-center">
                  <Newspaper className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-[#2D2721]">Newsletter Generator</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="topic">Newsletter Topic</Label>
                  <Input
                    id="topic"
                    placeholder="E.g., Summer promotions, New feature announcement..."
                    value={newsletterForm.topic}
                    onChange={(e) => setNewsletterForm({ ...newsletterForm, topic: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="tone">Tone</Label>
                    <select
                      id="tone"
                      className="w-full px-3 py-2 rounded-[12px] border border-[rgba(139,115,85,0.2)] bg-white text-[#2D2721]"
                      value={newsletterForm.tone}
                      onChange={(e) => setNewsletterForm({ ...newsletterForm, tone: e.target.value })}
                    >
                      <option value="professional">Professional</option>
                      <option value="friendly">Friendly</option>
                      <option value="exciting">Exciting</option>
                      <option value="formal">Formal</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="length">Length</Label>
                    <select
                      id="length"
                      className="w-full px-3 py-2 rounded-[12px] border border-[rgba(139,115,85,0.2)] bg-white text-[#2D2721]"
                      value={newsletterForm.length}
                      onChange={(e) => setNewsletterForm({ ...newsletterForm, length: e.target.value })}
                    >
                      <option value="short">Short</option>
                      <option value="medium">Medium</option>
                      <option value="long">Long</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={newsletterForm.includeStats}
                      onChange={(e) => setNewsletterForm({ ...newsletterForm, includeStats: e.target.checked })}
                      className="w-4 h-4 rounded border-[rgba(139,115,85,0.2)]"
                    />
                    <span className="text-sm text-[#2D2721]">Include platform statistics</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={newsletterForm.includeOffers}
                      onChange={(e) => setNewsletterForm({ ...newsletterForm, includeOffers: e.target.checked })}
                      className="w-4 h-4 rounded border-[rgba(139,115,85,0.2)]"
                    />
                    <span className="text-sm text-[#2D2721]">Include special offers section</span>
                  </label>
                </div>

                <WarmButton
                  className="w-full"
                  onClick={generateNewsletter}
                  disabled={generatingNewsletter}
                >
                  {generatingNewsletter ? (
                    <>
                      <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate Newsletter
                    </>
                  )}
                </WarmButton>
              </div>
            </WarmCard>

            <WarmCard padding="lg">
              <h3 className="text-xl font-bold text-[#2D2721] mb-6">Preview & Send</h3>
              {generatedContent.subject ? (
                <div className="space-y-4">
                  <div>
                    <Label>Subject Line</Label>
                    <div className="p-3 bg-[#FFF9ED] rounded-[12px] font-semibold text-[#2D2721]">
                      {generatedContent.subject}
                    </div>
                  </div>
                  <div>
                    <Label>Preview Text</Label>
                    <div className="p-3 bg-[#FFF9ED] rounded-[12px] text-[#6B5744] text-sm">
                      {generatedContent.preview}
                    </div>
                  </div>
                  <div>
                    <Label>Email Body</Label>
                    <div className="p-4 bg-white border border-[rgba(139,115,85,0.2)] rounded-[12px] text-[#2D2721] text-sm whitespace-pre-wrap max-h-[300px] overflow-y-auto">
                      {generatedContent.body}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-[rgba(139,115,85,0.1)]">
                    <Label className="mb-3 block">Select Recipients</Label>
                    <div className="space-y-2 mb-4">
                      {userSegments.map((segment) => (
                        <label key={segment.name} className="flex items-center justify-between p-3 bg-[#FFF9ED] rounded-[12px] cursor-pointer hover:bg-[#FFE5B4] transition-colors">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={selectedSegments.includes(segment.name)}
                              onChange={() => toggleSegment(segment.name)}
                              className="w-4 h-4 rounded border-[rgba(139,115,85,0.2)]"
                            />
                            <span className="text-sm font-medium text-[#2D2721]">{segment.name}</span>
                          </div>
                          <span className="text-sm text-[#8B7355]">{segment.count.toLocaleString()}</span>
                        </label>
                      ))}
                    </div>
                    <div className="flex items-center justify-between mb-4 p-3 bg-gradient-to-br from-[#9DB5A5] to-[#7FA090] rounded-[12px]">
                      <span className="text-white font-semibold">Total Recipients:</span>
                      <span className="text-white text-xl font-bold">{selectedRecipientsCount.toLocaleString()}</span>
                    </div>
                    {isSending && (
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-[#6B5744]">Sending progress...</span>
                          <span className="text-sm font-semibold text-[#2D2721]">{sendingProgress}%</span>
                        </div>
                        <Progress value={sendingProgress} />
                      </div>
                    )}
                    <WarmButton
                      className="w-full"
                      onClick={sendNewsletter}
                      disabled={isSending || selectedRecipientsCount === 0}
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Send to {selectedRecipientsCount.toLocaleString()} Recipients
                    </WarmButton>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Mail className="h-16 w-16 text-[#E5D5C5] mb-4" />
                  <p className="text-[#8B7355] mb-2">No newsletter generated yet</p>
                  <p className="text-sm text-[#A89985]">Fill in the form and click "Generate Newsletter"</p>
                </div>
              )}
            </WarmCard>
          </div>

          {/* Recent Newsletters */}
          <WarmCard padding="lg">
            <h3 className="text-xl font-bold text-[#2D2721] mb-6">Recent Newsletters</h3>
            <div className="space-y-3">
              {recentNewsletters.map((newsletter) => (
                <div key={newsletter.id} className="flex items-center justify-between p-4 bg-gradient-to-br from-[#FFF9ED] to-[#FFE5B4] rounded-[14px]">
                  <div className="flex-1">
                    <div className="font-semibold text-[#2D2721] mb-1">{newsletter.subject}</div>
                    <div className="flex items-center gap-4 text-sm text-[#8B7355]">
                      <span>Sent to {newsletter.sent.toLocaleString()}</span>
                      <span>Opened: {newsletter.opened.toLocaleString()} ({((newsletter.opened / newsletter.sent) * 100).toFixed(1)}%)</span>
                      <span>Clicked: {newsletter.clicked.toLocaleString()}</span>
                      <span>{newsletter.date}</span>
                    </div>
                  </div>
                  <WarmButton variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </WarmButton>
                </div>
              ))}
            </div>
          </WarmCard>
        </>
      )}

      {/* ANALYTICS TAB */}
      {activeTab === 'analytics' && (
        <>
          <WarmCard padding="lg">
            <h3 className="text-xl font-bold text-[#2D2721] mb-6">Platform Analytics</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="p-6 bg-gradient-to-br from-[#FFF9ED] to-[#FFE5B4] rounded-[14px]">
                <div className="text-sm text-[#8B7355] mb-1">Avg Open Rate</div>
                <div className="text-3xl font-bold text-[#2D2721]">{globalStats.avgOpenRate}</div>
              </div>
              <div className="p-6 bg-gradient-to-br from-[#FFF9ED] to-[#FFE5B4] rounded-[14px]">
                <div className="text-sm text-[#8B7355] mb-1">Avg Click Rate</div>
                <div className="text-3xl font-bold text-[#2D2721]">{globalStats.avgClickRate}</div>
              </div>
              <div className="p-6 bg-gradient-to-br from-[#FFF9ED] to-[#FFE5B4] rounded-[14px]">
                <div className="text-sm text-[#8B7355] mb-1">Server Uptime</div>
                <div className="text-3xl font-bold text-[#2D2721]">{globalStats.serverUptime}</div>
              </div>
            </div>

            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={platformGrowthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(139,115,85,0.1)" />
                <XAxis dataKey="month" stroke="#8B7355" />
                <YAxis stroke="#8B7355" />
                <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid rgba(139,115,85,0.2)', borderRadius: '12px' }} />
                <Legend />
                <Bar dataKey="campaigns" fill="#FFC857" name="Active Campaigns" />
                <Bar dataKey="merchants" fill="#9DB5A5" name="Merchants" />
              </BarChart>
            </ResponsiveContainer>
          </WarmCard>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <WarmCard padding="lg">
              <h3 className="text-xl font-bold text-[#2D2721] mb-6">System Resources</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-[#6B5744]">CPU Usage</span>
                    <span className="text-sm font-semibold text-[#2D2721]">42%</span>
                  </div>
                  <Progress value={42} />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-[#6B5744]">Memory Usage</span>
                    <span className="text-sm font-semibold text-[#2D2721]">68%</span>
                  </div>
                  <Progress value={68} />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-[#6B5744]">Database Load</span>
                    <span className="text-sm font-semibold text-[#2D2721]">35%</span>
                  </div>
                  <Progress value={35} />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-[#6B5744]">API Response Time</span>
                    <span className="text-sm font-semibold text-[#2D2721]">124ms</span>
                  </div>
                  <Progress value={12.4} />
                </div>
              </div>
            </WarmCard>

            <WarmCard padding="lg">
              <h3 className="text-xl font-bold text-[#2D2721] mb-6">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-3">
                <WarmButton variant="outline" className="h-auto py-4">
                  <div className="flex flex-col items-center gap-2">
                    <Download className="h-6 w-6" />
                    <span className="text-sm">Export Data</span>
                  </div>
                </WarmButton>
                <WarmButton variant="outline" className="h-auto py-4">
                  <div className="flex flex-col items-center gap-2">
                    <FileSpreadsheet className="h-6 w-6" />
                    <span className="text-sm">Reports</span>
                  </div>
                </WarmButton>
                <WarmButton variant="outline" className="h-auto py-4">
                  <div className="flex flex-col items-center gap-2">
                    <Settings className="h-6 w-6" />
                    <span className="text-sm">Settings</span>
                  </div>
                </WarmButton>
                <WarmButton variant="outline" className="h-auto py-4">
                  <div className="flex flex-col items-center gap-2">
                    <Users className="h-6 w-6" />
                    <span className="text-sm">User Mgmt</span>
                  </div>
                </WarmButton>
              </div>
            </WarmCard>
          </div>
        </>
      )}

      {/* PAYMENTS TAB */}
      {activeTab === 'payments' && (
        <>
          {/* Payment Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <WarmCard hover padding="lg">
              <div className="flex items-start justify-between mb-3">
                <div className="w-12 h-12 rounded-[14px] bg-gradient-to-br from-[#FFC857] to-[#FFB627] flex items-center justify-center shadow-warm">
                  <DollarSign className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="text-3xl font-bold text-[#2D2721] mb-1">€360K</div>
              <div className="text-sm text-[#8B7355]">Platform Fees (MRR)</div>
            </WarmCard>

            <WarmCard hover padding="lg">
              <div className="flex items-start justify-between mb-3">
                <div className="w-12 h-12 rounded-[14px] bg-gradient-to-br from-[#9DB5A5] to-[#7FA090] flex items-center justify-center shadow-warm">
                  <Users className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="text-3xl font-bold text-[#2D2721] mb-1">1,247</div>
              <div className="text-sm text-[#8B7355]">Active Subscriptions</div>
            </WarmCard>

            <WarmCard hover padding="lg">
              <div className="flex items-start justify-between mb-3">
                <div className="w-12 h-12 rounded-[14px] bg-gradient-to-br from-[#E17B5C] to-[#D16B4C] flex items-center justify-center shadow-warm">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="text-3xl font-bold text-[#2D2721] mb-1">€28.8</div>
              <div className="text-sm text-[#8B7355]">Avg Revenue Per User</div>
            </WarmCard>

            <WarmCard hover padding="lg">
              <div className="flex items-start justify-between mb-3">
                <div className="w-12 h-12 rounded-[14px] bg-gradient-to-br from-[#F5C98E] to-[#E5B97E] flex items-center justify-center shadow-warm">
                  <Activity className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="text-3xl font-bold text-[#2D2721] mb-1">2.8%</div>
              <div className="text-sm text-[#8B7355]">Churn Rate</div>
            </WarmCard>
          </div>

          {/* Subscription Breakdown */}
          <WarmCard padding="lg">
            <h3 className="text-xl font-bold text-[#2D2721] mb-6">Subscriptions by Plan</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 bg-gradient-to-br from-[#9DB5A5]/10 to-[#7FA090]/10 rounded-[16px] border border-[#9DB5A5]/30">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-[12px] bg-gradient-to-br from-[#9DB5A5] to-[#7FA090] flex items-center justify-center shadow-warm">
                    <Zap className="h-5 w-5 text-white" />
                  </div>
                  <h4 className="font-bold text-[#2D2721]">Starter</h4>
                </div>
                <div className="text-3xl font-bold text-[#2D2721] mb-1">487</div>
                <div className="text-sm text-[#8B7355] mb-3">merchants</div>
                <div className="text-lg font-semibold text-[#FFC857]">€9,253/mo</div>
              </div>

              <div className="p-6 bg-gradient-to-br from-[#FFC857]/10 to-[#FFB627]/10 rounded-[16px] border-2 border-[#FFC857]">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-[12px] bg-gradient-to-br from-[#FFC857] to-[#FFB627] flex items-center justify-center shadow-warm">
                    <Award className="h-5 w-5 text-white" />
                  </div>
                  <h4 className="font-bold text-[#2D2721]">Professional</h4>
                </div>
                <div className="text-3xl font-bold text-[#2D2721] mb-1">624</div>
                <div className="text-sm text-[#8B7355] mb-3">merchants</div>
                <div className="text-lg font-semibold text-[#FFC857]">€18,096/mo</div>
              </div>

              <div className="p-6 bg-gradient-to-br from-[#E17B5C]/10 to-[#D16B4C]/10 rounded-[16px] border border-[#E17B5C]/30">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-[12px] bg-gradient-to-br from-[#E17B5C] to-[#D16B4C] flex items-center justify-center shadow-warm">
                    <Target className="h-5 w-5 text-white" />
                  </div>
                  <h4 className="font-bold text-[#2D2721]">Enterprise</h4>
                </div>
                <div className="text-3xl font-bold text-[#2D2721] mb-1">136</div>
                <div className="text-sm text-[#8B7355] mb-3">merchants</div>
                <div className="text-lg font-semibold text-[#FFC857]">€5,304/mo</div>
              </div>
            </div>
          </WarmCard>

          {/* Recent Transactions */}
          <WarmCard padding="lg">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-[#2D2721]">Recent Transactions</h3>
              <WarmButton variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </WarmButton>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[rgba(139,115,85,0.1)]">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B5744]">Date</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B5744]">Merchant</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B5744]">Plan</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B5744]">Amount</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B5744]">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-[#6B5744]">Type</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { id: 1, date: '2024-12-15', merchant: 'Baltic Restaurants', plan: 'Professional', amount: 29, status: 'paid', type: 'recurring' },
                    { id: 2, date: '2024-12-15', merchant: 'Nordic Fashion Hub', plan: 'Enterprise', amount: 39, status: 'paid', type: 'recurring' },
                    { id: 3, date: '2024-12-14', merchant: 'Riga City Deals', plan: 'Professional', amount: 29, status: 'paid', type: 'recurring' },
                    { id: 4, date: '2024-12-14', merchant: 'Vilnius Wellness', plan: 'Starter', amount: 19, status: 'paid', type: 'recurring' },
                    { id: 5, date: '2024-12-14', merchant: 'Stockholm Beauty', plan: 'Professional', amount: 29, status: 'paid', type: 'recurring' },
                    { id: 6, date: '2024-12-13', merchant: 'Oslo Tech Store', plan: 'Enterprise', amount: 39, status: 'paid', type: 'recurring' },
                    { id: 7, date: '2024-12-13', merchant: 'Tallinn Events', plan: 'Starter', amount: 19, status: 'failed', type: 'recurring' },
                    { id: 8, date: '2024-12-12', merchant: 'Helsinki Hotels', plan: 'Professional', amount: 290, status: 'paid', type: 'annual' },
                  ].map((transaction) => (
                    <tr key={transaction.id} className="border-b border-[rgba(139,115,85,0.05)] hover:bg-[#FFF9ED] transition-colors">
                      <td className="py-4 px-4 text-[#6B5744]">{transaction.date}</td>
                      <td className="py-4 px-4 font-semibold text-[#2D2721]">{transaction.merchant}</td>
                      <td className="py-4 px-4 text-[#6B5744]">{transaction.plan}</td>
                      <td className="py-4 px-4 font-bold text-[#2D2721]">€{transaction.amount}</td>
                      <td className="py-4 px-4">
                        <span className={`px-2 py-1 text-xs rounded-full font-semibold ${
                          transaction.status === 'paid' ? 'bg-[#9DB5A5] text-white' : 'bg-[#E17B5C] text-white'
                        }`}>
                          {transaction.status}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="px-2 py-1 bg-[#E5D5C5] text-[#6B5744] text-xs rounded-full">
                          {transaction.type}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </WarmCard>

          {/* Revenue Chart */}
          <WarmCard padding="lg">
            <h3 className="text-xl font-bold text-[#2D2721] mb-6">Monthly Recurring Revenue</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={platformGrowthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(139,115,85,0.1)" />
                <XAxis dataKey="month" stroke="#8B7355" />
                <YAxis stroke="#8B7355" />
                <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid rgba(139,115,85,0.2)', borderRadius: '12px' }} />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="#FFC857" strokeWidth={3} name="MRR (€)" />
              </LineChart>
            </ResponsiveContainer>
          </WarmCard>

          {/* Failed Payments Alert */}
          <WarmCard padding="lg" className="bg-[#FFF3E0] border border-[#E17B5C]">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-[14px] bg-[#E17B5C]/10 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="h-6 w-6 text-[#E17B5C]" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-[#2D2721] mb-2">Failed Payments Requiring Attention</h3>
                <p className="text-sm text-[#6B5744] mb-4">
                  7 merchants have failed payments in the last 7 days. Follow up to prevent subscription cancellation.
                </p>
                <WarmButton variant="outline" size="sm">
                  View Failed Payments
                </WarmButton>
              </div>
            </div>
          </WarmCard>
        </>
      )}

      {/* WIDGETS TAB */}
      {activeTab === 'widgets' && (
        <>
          <WarmCard padding="xl">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-[16px] bg-gradient-to-br from-[#9DB5A5] to-[#7FA090] flex items-center justify-center shadow-warm">
                <MessageSquare className="h-7 w-7 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-[#2D2721]">Widget Management</h2>
                <p className="text-[#6B5744] mt-1">Control live chat and feedback widgets across the platform</p>
              </div>
            </div>

            <div className="space-y-6">
              {/* Live Chat Widget */}
              <div className="p-6 bg-[#FFF9ED] rounded-[16px] border border-[rgba(139,115,85,0.1)]">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-[14px] bg-gradient-to-br from-[#9DB5A5] to-[#7FA090] flex items-center justify-center">
                      <MessageCircle className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-[#2D2721] text-lg">Live Chat Widget</h3>
                      <p className="text-sm text-[#6B5744]">24/7 customer support chatbot</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setChatEnabled(!chatEnabled)}
                    className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                      chatEnabled ? 'bg-gradient-to-br from-[#9DB5A5] to-[#7FA090]' : 'bg-[#DDD5C8]'
                    }`}
                  >
                    <span
                      className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform shadow-warm ${
                        chatEnabled ? 'translate-x-7' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                <div className="text-sm text-[#6B5744] mb-3">
                  {chatEnabled ? (
                    <div className="flex items-center gap-2 text-[#9DB5A5]">
                      <CheckCircle2 className="h-4 w-4" />
                      <span className="font-medium">Active - Users can see the chat button in bottom left</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-[#8B7355]">
                      <XCircle className="h-4 w-4" />
                      <span>Disabled - Chat widget is hidden from all users</span>
                    </div>
                  )}
                </div>
                <div className="p-4 bg-white rounded-[12px] border border-[rgba(139,115,85,0.1)]">
                  <div className="text-xs font-semibold text-[#8B7355] mb-2">Features:</div>
                  <ul className="text-sm text-[#6B5744] space-y-1">
                    <li>• 💬 Real-time messaging support</li>
                    <li>• 🕐 Available 24/7 for customer inquiries</li>
                    <li>• 🚫 Auto-hides after user responds (privacy)</li>
                    <li>• 📍 Positioned: Bottom left corner</li>
                  </ul>
                </div>
              </div>

              {/* Feedback Widget */}
              <div className="p-6 bg-[#FFF9ED] rounded-[16px] border border-[rgba(139,115,85,0.1)]">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-[14px] bg-gradient-to-br from-[#FFC857] to-[#FFB627] flex items-center justify-center">
                      <MessageSquare className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-[#2D2721] text-lg">Feedback & Rating Widget</h3>
                      <p className="text-sm text-[#6B5744]">Collect user feedback and ratings</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setFeedbackEnabled(!feedbackEnabled)}
                    className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                      feedbackEnabled ? 'bg-gradient-to-br from-[#FFC857] to-[#FFB627]' : 'bg-[#DDD5C8]'
                    }`}
                  >
                    <span
                      className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform shadow-warm ${
                        feedbackEnabled ? 'translate-x-7' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                <div className="text-sm text-[#6B5744] mb-3">
                  {feedbackEnabled ? (
                    <div className="flex items-center gap-2 text-[#FFC857]">
                      <CheckCircle2 className="h-4 w-4" />
                      <span className="font-medium">Active - Users can submit feedback and ratings</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-[#8B7355]">
                      <XCircle className="h-4 w-4" />
                      <span>Disabled - Feedback widget is hidden</span>
                    </div>
                  )}
                </div>
                <div className="p-4 bg-white rounded-[12px] border border-[rgba(139,115,85,0.1)]">
                  <div className="text-xs font-semibold text-[#8B7355] mb-2">Features:</div>
                  <ul className="text-sm text-[#6B5744] space-y-1">
                    <li>• ⭐ 5-star rating system</li>
                    <li>• 📝 Optional text feedback</li>
                    <li>• 🚫 Auto-hides after submission (one-time survey)</li>
                    <li>• 📍 Positioned: Bottom left, above chat widget</li>
                  </ul>
                </div>
              </div>

              {/* Usage Guidelines */}
              <div className="p-6 bg-gradient-to-br from-[#E8F4F8] to-[#D5EDF5] rounded-[16px] border border-[rgba(139,115,85,0.1)]">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-[14px] bg-[#9DB5A5]/10 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="h-6 w-6 text-[#9DB5A5]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#2D2721] mb-2">Best Practices</h3>
                    <ul className="text-sm text-[#6B5744] space-y-2">
                      <li>💡 Enable chat during business hours for immediate support</li>
                      <li>📊 Enable feedback after major feature launches to gather insights</li>
                      <li>🔒 Both widgets respect user privacy - they disappear after interaction</li>
                      <li>🎯 Widgets only appear when enabled here - full admin control</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Preview */}
              <div className="p-6 bg-white rounded-[16px] border-2 border-dashed border-[rgba(139,115,85,0.2)]">
                <h3 className="font-semibold text-[#2D2721] mb-3">Widget Preview</h3>
                <div className="text-sm text-[#6B5744] mb-4">
                  {chatEnabled || feedbackEnabled ? (
                    <>Check the <strong>bottom left corner</strong> of your screen to see active widgets!</>
                  ) : (
                    <>Enable at least one widget above to see the preview</>
                  )}
                </div>
                <div className="flex gap-3">
                  {chatEnabled && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-br from-[#9DB5A5] to-[#7FA090] text-white rounded-full text-sm">
                      <MessageCircle className="h-4 w-4" />
                      Chat Active
                    </div>
                  )}
                  {feedbackEnabled && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-br from-[#FFC857] to-[#FFB627] text-white rounded-full text-sm">
                      <MessageSquare className="h-4 w-4" />
                      Feedback Active
                    </div>
                  )}
                </div>
              </div>
            </div>
          </WarmCard>
        </>
      )}
      {/* Client License Management Modal */}
      <Dialog open={licenseModalOpen} onOpenChange={setLicenseModalOpen}>
        <DialogContent className="sm:max-w-[425px] bg-[#FFF9ED] border-[#E5D5C5]">
          <DialogHeader>
            <DialogTitle className="text-[#2D2721] flex items-center gap-2">
              <Award className="h-5 w-5 text-[#FFC857]" />
              Extend License
            </DialogTitle>
            <DialogDescription className="text-[#6B5744]">
              Update license duration for <strong>{selectedMerchantForLicense?.name}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-4">
              <Label className="text-[#2D2721]">Extension Type</Label>
              <RadioGroup value={extensionType} onValueChange={(v: 'fixed' | 'unlimited') => setExtensionType(v)} className="grid grid-cols-2 gap-4">
                <div>
                  <RadioGroupItem value="fixed" id="fixed" className="peer sr-only" />
                  <Label
                    htmlFor="fixed"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-white p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-[#FFC857] peer-data-[state=checked]:bg-[#FFFBE6] cursor-pointer transition-all"
                  >
                    <Calendar className="mb-2 h-6 w-6 text-[#6B5744]" />
                    <span className="font-semibold text-[#2D2721]">Fixed Duration</span>
                  </Label>
                </div>
                <div>
                  <RadioGroupItem value="unlimited" id="unlimited" className="peer sr-only" />
                  <Label
                    htmlFor="unlimited"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-white p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-[#9DB5A5] peer-data-[state=checked]:bg-[#E8F5F1] cursor-pointer transition-all"
                  >
                    <Sparkles className="mb-2 h-6 w-6 text-[#9DB5A5]" />
                    <span className="font-semibold text-[#2D2721]">Unlimited</span>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {extensionType === 'fixed' && (
              <div className="space-y-2 animate-in fade-in zoom-in-95 duration-200">
                <Label htmlFor="duration" className="text-[#2D2721]">Duration (Months)</Label>
                <Select value={extensionDuration} onValueChange={setExtensionDuration}>
                  <SelectTrigger id="duration" className="bg-white border-[rgba(139,115,85,0.2)]">
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 Month</SelectItem>
                    <SelectItem value="3">3 Months</SelectItem>
                    <SelectItem value="6">6 Months</SelectItem>
                    <SelectItem value="12">1 Year</SelectItem>
                    <SelectItem value="24">2 Years</SelectItem>
                    <SelectItem value="36">3 Years</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-[#8B7355]">
                  License will be extended from the current expiration date.
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <WarmButton variant="outline" onClick={() => setLicenseModalOpen(false)}>Cancel</WarmButton>
            <WarmButton onClick={saveLicenseExtension} className="bg-[#2D2721] text-white hover:bg-[#3E362E]">Save Changes</WarmButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}