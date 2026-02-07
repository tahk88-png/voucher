import { useState } from 'react';
import { WarmCard } from '@/app/components/WarmCard';
import { WarmButton } from '@/app/components/WarmButton';
import { useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Camera, 
  Truck, 
  Megaphone, 
  Settings, 
  LogOut, 
  Bell, 
  Search,
  ChevronDown,
  Store,
  Package,
  ClipboardList,
  CreditCard,
  Users,
  Target,
  Euro,
  Globe,
  Tag,
  Mail,
  FileText,
  Plus,
  ArrowUpRight,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Ticket,
  Calendar,
  QrCode,
  ArrowRight,
  Box,
  AlertCircle
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend
} from 'recharts';

// Sub-pages
import { ProductManage } from '@/app/pages/ProductManage';
import { RentalManage } from '@/app/pages/RentalManage';
import { CampaignsList } from '@/app/pages/CampaignsList';
import { WarehousePage } from '@/app/pages/WarehousePage';
import { DomainSettings } from '@/app/pages/DomainSettings';
import { StorefrontEditor } from '@/app/pages/StorefrontEditor';
import { B2BSolutions } from '@/app/pages/B2BSolutions';
import { OrderManager } from '@/app/pages/OrderManager';
import { LogisticsManager } from '@/app/pages/LogisticsManager';
import { FinanceManager } from '@/app/pages/FinanceManager';
import { CommunicationHub } from '@/app/pages/CommunicationHub';

// --- Local Components ---

function DashboardHome({ setActivePage }: { setActivePage: (page: string) => void }) {
  const navigate = useNavigate();

  // Mock Data
  const revenueData = [
    { name: 'E', sale: 400, rent: 240 },
    { name: 'T', sale: 300, rent: 139 },
    { name: 'K', sale: 200, rent: 980 },
    { name: 'N', sale: 278, rent: 390 },
    { name: 'R', sale: 189, rent: 480 },
    { name: 'L', sale: 239, rent: 380 },
    { name: 'P', sale: 349, rent: 430 },
  ];

  const todayLogistics = {
    goingOut: [
      { id: 1, item: 'Sony A7 III Kit', client: 'Mari Tamm', time: '14:00' },
      { id: 2, item: 'DJI Ronin S', client: 'Peeter Oja', time: '15:30' },
    ],
    returning: [
      { id: 3, item: 'Canon R5', client: 'Studio X', time: '12:00', status: 'late' },
      { id: 4, item: 'Boom Mic', client: 'Kanal 2', time: '16:00', status: 'ontime' },
    ]
  };

  const tasks = [
    { id: 1, text: '3 uut tellimust vajavad pakkimist', type: 'urgent', action: 'orders' },
    { id: 2, text: 'Madal laoseis: Sony akud (2tk)', type: 'warning', action: 'warehouse' },
    { id: 3, text: '2 e-kirja ootavad vastust', type: 'info', action: 'communications' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-[1600px] mx-auto pb-10">
      
      {/* Welcome & Focus Section */}
      <div className="flex flex-col md:flex-row gap-8 items-start justify-between">
        <div className="space-y-2">
           <h1 className="text-3xl font-bold text-[#2D2721] tracking-tight">Tere hommikust, Kaupmees! ☕</h1>
           <p className="text-[#6B5744] text-lg font-medium">Sul on täna <span className="text-[#E17B5C] font-bold">3 kriitilist tegevust</span> ja 4 logistilist liikumist.</p>
        </div>
        
        {/* Quick Actions Widget */}
        <div className="flex gap-3 bg-white p-2 rounded-2xl shadow-sm border border-[#E7DCC7]">
           <button onClick={() => navigate('/orders/create')} className="flex flex-col items-center justify-center w-20 h-20 rounded-xl hover:bg-[#FFF9ED] hover:text-[#FFC857] transition-all group gap-1">
              <div className="w-10 h-10 bg-[#FAF7F2] rounded-full flex items-center justify-center group-hover:bg-[#FFC857] group-hover:text-white transition-colors">
                 <Plus className="w-5 h-5 text-[#8B7355] group-hover:text-white" />
              </div>
              <span className="text-[10px] font-bold text-[#6B5744] group-hover:text-[#E17B5C]">Uus tellimus</span>
           </button>
           <button onClick={() => navigate('/products/create')} className="flex flex-col items-center justify-center w-20 h-20 rounded-xl hover:bg-[#FFF9ED] hover:text-[#FFC857] transition-all group gap-1">
              <div className="w-10 h-10 bg-[#FAF7F2] rounded-full flex items-center justify-center group-hover:bg-[#FFC857] group-hover:text-white transition-colors">
                 <Package className="w-5 h-5 text-[#8B7355] group-hover:text-white" />
              </div>
              <span className="text-[10px] font-bold text-[#6B5744] group-hover:text-[#E17B5C]">Lisa toode</span>
           </button>
           <button onClick={() => navigate('/mobile-scanner')} className="flex flex-col items-center justify-center w-20 h-20 rounded-xl hover:bg-[#FFF9ED] hover:text-[#FFC857] transition-all group gap-1">
              <div className="w-10 h-10 bg-[#FAF7F2] rounded-full flex items-center justify-center group-hover:bg-[#FFC857] group-hover:text-white transition-colors">
                 <QrCode className="w-5 h-5 text-[#8B7355] group-hover:text-white" />
              </div>
              <span className="text-[10px] font-bold text-[#6B5744] group-hover:text-[#E17B5C]">Skänner</span>
           </button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <WarmCard padding="lg" className="bg-white border-b-4 border-b-[#FFC857] shadow-sm hover:-translate-y-1 transition-transform cursor-pointer">
          <div className="flex justify-between items-start mb-2">
             <div className="text-sm font-bold text-[#8B7355] uppercase tracking-wide">Müügitulu (Kuu)</div>
             <ArrowUpRight className="w-4 h-4 text-[#00D098]" />
          </div>
          <div className="text-3xl font-bold text-[#2D2721] mb-1">€12,450</div>
          <div className="text-xs font-medium text-[#00D098] bg-[#E6F4EA] inline-block px-2 py-0.5 rounded-full">+15.3% vs eelmine</div>
        </WarmCard>

        <WarmCard padding="lg" className="bg-[#2D2721] text-[#FAF7F2] border-b-4 border-b-[#E17B5C] shadow-md hover:-translate-y-1 transition-transform cursor-pointer" onClick={() => setActivePage('orders')}>
          <div className="flex justify-between items-start mb-2">
             <div className="text-sm font-bold text-[#E7DCC7]/70 uppercase tracking-wide">Aktiivsed Rendid</div>
             <Camera className="w-4 h-4 text-[#E17B5C]" />
          </div>
          <div className="text-3xl font-bold text-white mb-1">8</div>
          <div className="text-xs font-medium text-[#E17B5C] bg-[#3E352F] inline-block px-2 py-0.5 rounded-full">2 hilinenud</div>
        </WarmCard>

        <WarmCard padding="lg" className="bg-white border-b-4 border-b-[#00D098] shadow-sm hover:-translate-y-1 transition-transform cursor-pointer" onClick={() => setActivePage('orders')}>
          <div className="flex justify-between items-start mb-2">
             <div className="text-sm font-bold text-[#8B7355] uppercase tracking-wide">Ootel Tellimused</div>
             <ShoppingBag className="w-4 h-4 text-[#00D098]" />
          </div>
          <div className="text-3xl font-bold text-[#2D2721] mb-1">3</div>
          <div className="text-xs font-medium text-[#8B7355]">Vajavad tähelepanu</div>
        </WarmCard>

        <WarmCard padding="lg" className="bg-white border-b-4 border-b-[#E17B5C] shadow-sm hover:-translate-y-1 transition-transform cursor-pointer" onClick={() => setActivePage('warehouse')}>
          <div className="flex justify-between items-start mb-2">
             <div className="text-sm font-bold text-[#8B7355] uppercase tracking-wide">Laoseisu Hoiatus</div>
             <AlertTriangle className="w-4 h-4 text-[#E17B5C]" />
          </div>
          <div className="text-3xl font-bold text-[#2D2721] mb-1">5</div>
          <div className="text-xs font-medium text-[#E17B5C]">Toodet otsakorral</div>
        </WarmCard>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start h-full">
        
        {/* Left Column: Focus & Analytics */}
        <div className="lg:col-span-2 space-y-8">
           
           {/* Today's Focus - Action Center */}
           <WarmCard padding="none" className="bg-white border border-[#E7DCC7] overflow-hidden">
              <div className="p-4 border-b border-[#E7DCC7] bg-[#FFF9ED] flex justify-between items-center">
                 <h3 className="font-bold text-[#2D2721] flex items-center gap-2">
                    <Target className="w-5 h-5 text-[#E17B5C]" /> Tänane Fookus
                 </h3>
                 <span className="text-xs font-bold bg-[#E17B5C] text-white px-2 py-1 rounded-full">3 tegevust</span>
              </div>
              <div className="divide-y divide-[#E7DCC7]">
                 {tasks.map((task) => (
                    <div key={task.id} className="p-4 flex items-center justify-between hover:bg-[#FAF7F2] transition-colors group cursor-pointer" onClick={() => setActivePage(task.action)}>
                       <div className="flex items-center gap-4">
                          <div className={`w-2 h-2 rounded-full ${task.type === 'urgent' ? 'bg-[#E17B5C]' : task.type === 'warning' ? 'bg-[#FFC857]' : 'bg-[#00D098]'}`}></div>
                          <span className={`font-medium text-[#2D2721] ${task.type === 'urgent' ? 'font-bold' : ''}`}>{task.text}</span>
                       </div>
                       <ArrowRight className="w-4 h-4 text-[#E7DCC7] group-hover:text-[#E17B5C] transition-colors" />
                    </div>
                 ))}
              </div>
           </WarmCard>

           {/* Revenue Chart */}
           <WarmCard padding="lg" className="bg-white border border-[#E7DCC7] h-[400px]">
             <div className="flex items-center justify-between mb-6">
               <div>
                 <h3 className="text-xl font-bold text-[#2D2721]">Nädala müük ja rent</h3>
                 <p className="text-sm text-[#8B7355]">Käive viimase 7 päeva jooksul</p>
               </div>
               <select className="bg-[#FAF7F2] border border-[#E7DCC7] rounded-lg text-sm font-bold p-2 outline-none">
                  <option>Viimased 7 päeva</option>
                  <option>See kuu</option>
               </select>
             </div>
             
             <ResponsiveContainer width="100%" height="80%">
                <BarChart data={revenueData} barSize={20}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E7DCC7" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#8B7355'}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#8B7355'}} />
                  <Tooltip 
                     cursor={{fill: '#FAF7F2'}}
                     contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.1)' }} 
                  />
                  <Legend iconType="circle" />
                  <Bar name="Müük" dataKey="sale" stackId="a" fill="#FFC857" radius={[0, 0, 4, 4]} />
                  <Bar name="Rent" dataKey="rent" stackId="a" fill="#2D2721" radius={[4, 4, 0, 0]} />
                </BarChart>
             </ResponsiveContainer>
           </WarmCard>
        </div>

        {/* Right Column: Logistics & Activity */}
        <div className="space-y-8">
           
           {/* Logistics Widget */}
           <WarmCard padding="lg" className="bg-white border border-[#E7DCC7]">
              <h3 className="font-bold text-[#2D2721] mb-6 flex items-center gap-2">
                 <Truck className="w-5 h-5 text-[#8B7355]" /> Rendi Logistika
              </h3>
              
              <div className="space-y-6">
                 {/* Going Out */}
                 <div>
                    <h4 className="text-xs font-bold text-[#8B7355] uppercase mb-3 flex justify-between">
                       Väljastamisel <span className="text-[#2D2721]">{todayLogistics.goingOut.length}</span>
                    </h4>
                    <div className="space-y-3">
                       {todayLogistics.goingOut.map(item => (
                          <div key={item.id} className="flex items-start gap-3 p-3 bg-[#FAF7F2] rounded-xl border border-[#E7DCC7]/50">
                             <div className="bg-white p-2 rounded-lg text-[#FFC857] shadow-sm"><Box className="w-4 h-4" /></div>
                             <div>
                                <div className="font-bold text-[#2D2721] text-sm">{item.item}</div>
                                <div className="text-xs text-[#6B5744] flex items-center gap-1 mt-0.5">
                                   <Clock className="w-3 h-3" /> {item.time} • {item.client}
                                </div>
                             </div>
                          </div>
                       ))}
                    </div>
                 </div>

                 <div className="h-px bg-[#E7DCC7]"></div>

                 {/* Returning */}
                 <div>
                    <h4 className="text-xs font-bold text-[#8B7355] uppercase mb-3 flex justify-between">
                       Tagastamisel <span className="text-[#2D2721]">{todayLogistics.returning.length}</span>
                    </h4>
                    <div className="space-y-3">
                       {todayLogistics.returning.map(item => (
                          <div key={item.id} className={`flex items-start gap-3 p-3 rounded-xl border ${item.status === 'late' ? 'bg-[#FFF9ED] border-[#E17B5C]/30' : 'bg-[#FAF7F2] border-[#E7DCC7]/50'}`}>
                             <div className={`bg-white p-2 rounded-lg shadow-sm ${item.status === 'late' ? 'text-[#E17B5C]' : 'text-[#00D098]'}`}>
                                {item.status === 'late' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                             </div>
                             <div>
                                <div className="font-bold text-[#2D2721] text-sm">{item.item}</div>
                                <div className="text-xs text-[#6B5744] flex items-center gap-1 mt-0.5">
                                   <Clock className="w-3 h-3" /> {item.time} • {item.client}
                                </div>
                                {item.status === 'late' && <div className="text-[10px] font-bold text-[#E17B5C] mt-1">HILINENUD</div>}
                             </div>
                          </div>
                       ))}
                    </div>
                 </div>
              </div>
           </WarmCard>

           {/* Quick Stats List */}
           <WarmCard padding="lg" className="bg-[#2D2721] text-[#E7DCC7]">
              <h3 className="font-bold text-white mb-4">Populaarsed tooted</h3>
              <div className="space-y-4">
                 <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Sony A7 III</span>
                    <span className="text-xs font-bold text-[#FFC857]">12 renti</span>
                 </div>
                 <div className="w-full bg-[#3E352F] h-1.5 rounded-full overflow-hidden">
                    <div className="bg-[#FFC857] h-full rounded-full w-[80%]"></div>
                 </div>

                 <div className="flex items-center justify-between pt-2">
                    <span className="text-sm font-medium">DJI Ronin S</span>
                    <span className="text-xs font-bold text-[#E17B5C]">8 renti</span>
                 </div>
                 <div className="w-full bg-[#3E352F] h-1.5 rounded-full overflow-hidden">
                    <div className="bg-[#E17B5C] h-full rounded-full w-[60%]"></div>
                 </div>
              </div>
           </WarmCard>

        </div>
      </div>
    </div>
  );
}

// --- Main Page Component ---

export function MerchantDashboard() {
  const navigate = useNavigate();
  const [activePage, setActivePage] = useState('overview');

  // Navigation Items
  const navItems = [
    { id: 'overview', label: 'Töölaud', icon: LayoutDashboard },
    { id: 'orders', label: 'Tellimused', icon: ClipboardList, badge: 3 },
    { type: 'divider', label: 'Müük & Rent' },
    { id: 'products', label: 'E-pood', icon: ShoppingBag },
    { id: 'rentals', label: 'Rent', icon: Camera },
    { type: 'divider', label: 'Logistika' },
    { id: 'warehouse', label: 'Ladu', icon: Package },
    { id: 'logistics', label: 'Tarne', icon: Truck },
    { type: 'divider', label: 'Finants & Info' },
    { id: 'finances', label: 'Arved & Raha', icon: FileText },
    { id: 'communications', label: 'E-kirjad', icon: Mail },
    { type: 'divider', label: 'Turundus' },
    { id: 'campaigns', label: 'Kampaaniad', icon: Ticket },
    { id: 'marketing', label: 'Sooduskoodid', icon: Megaphone },
    { type: 'divider', label: 'Seaded' },
    { id: 'design', label: 'Poe Disain', icon: Store },
    { id: 'domain', label: 'Domeen & B2B', icon: Globe },
  ];

  const renderContent = () => {
    switch (activePage) {
      case 'overview': return <DashboardHome setActivePage={setActivePage} />;
      case 'orders': return <OrderManager />;
      case 'products': return <ProductManage />;
      case 'rentals': return <RentalManage />;
      case 'warehouse': return <WarehousePage />;
      case 'logistics': return <LogisticsManager />;
      case 'finances': return <FinanceManager />;
      case 'communications': return <CommunicationHub />;
      case 'campaigns': return <CampaignsList />;
      case 'marketing': return (
        <div className="bg-white p-8 rounded-xl border border-[#E7DCC7]">
           <h2 className="text-2xl font-bold mb-4">Sooduskoodid</h2>
           <p>Siia tuleb sooduskoodide haldus.</p>
        </div>
      );
      case 'design': return <StorefrontEditor />;
      case 'domain': return (
        <div className="space-y-8 animate-in fade-in duration-500">
           <B2BSolutions />
           <div className="bg-white p-6 rounded-xl border border-[#E7DCC7]">
             <h3 className="text-xl font-bold mb-4 text-[#2D2721]">Domeeni seadistus</h3>
             <DomainSettings />
           </div>
        </div>
      );
      default: return <div>Lehte ei leitud</div>;
    }
  };

  return (
    <div className="flex h-screen bg-[#FAF7F2] overflow-hidden font-sans">
      
      {/* SIDEBAR - Dark & Premium */}
      <aside className="w-[280px] bg-[#1E1A17] text-[#E7DCC7] flex flex-col flex-shrink-0 shadow-2xl z-20 transition-all duration-300">
        {/* Brand Area */}
        <div className="h-24 flex items-center px-6 border-b border-[#3E352F]/50">
           <div className="font-bold text-white text-xl flex items-center gap-4 w-full">
             <div className="w-12 h-12 bg-gradient-to-br from-[#FFC857] to-[#E17B5C] rounded-xl flex items-center justify-center text-[#2D2721] shadow-lg shadow-[#FFC857]/20 flex-shrink-0">
               <Store className="w-7 h-7" />
             </div>
             <div className="flex-1 min-w-0">
               <div className="leading-tight truncate text-lg tracking-tight">Minu Pood</div>
               <div className="text-[10px] text-[#8B7355] font-semibold mt-1 uppercase tracking-widest truncate">Kaupmehe Portaal</div>
             </div>
           </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1.5 custom-scrollbar">
           {navItems.map((item: any, idx) => {
             if (item.type === 'divider') {
               return (
                 <div key={idx} className="px-3 py-3 mt-6 mb-1 text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#6B5744]/60 select-none">
                   {item.label}
                 </div>
               );
             }
             
             const Icon = item.icon;
             const isActive = activePage === item.id;
             
             return (
               <button
                 key={item.id}
                 onClick={() => setActivePage(item.id)}
                 className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-medium transition-all duration-300 group relative overflow-hidden ${
                   isActive 
                     ? 'bg-[#FFC857] text-[#2D2721] font-bold shadow-[0_4px_20px_rgba(255,200,87,0.25)] scale-[1.02]' 
                     : 'text-[#9DB5A5] hover:bg-[#3E352F]/50 hover:text-white hover:pl-5'
                 }`}
               >
                 {isActive && <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>}
                 
                 <div className="flex items-center gap-3.5 relative z-10">
                   <Icon className={`w-5 h-5 transition-colors ${isActive ? 'text-[#2D2721]' : 'text-[#6B5744] group-hover:text-white'}`} />
                   {item.label}
                 </div>
                 {item.badge && (
                   <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold shadow-sm relative z-10 ${isActive ? 'bg-[#2D2721] text-[#FFC857]' : 'bg-[#E17B5C] text-white'}`}>
                     {item.badge}
                   </span>
                 )}
               </button>
             );
           })}
        </div>

        {/* User Profile Footer */}
        <div className="p-4 border-t border-[#3E352F]/50 bg-[#161311]">
           <div className="flex items-center gap-3 mb-4 p-3 rounded-xl bg-[#25201B] border border-[#3E352F] hover:border-[#6B5744]/50 cursor-pointer transition-all group">
              <div className="w-10 h-10 rounded-full bg-[#3E352F] border border-[#6B5744] flex items-center justify-center font-bold text-white text-xs group-hover:scale-105 transition-transform">
                MP
              </div>
              <div className="overflow-hidden">
                <div className="text-white text-sm font-bold truncate group-hover:text-[#FFC857] transition-colors">Minu Pood OÜ</div>
                <div className="text-xs text-[#8B7355] group-hover:text-[#9DB5A5] transition-colors">Pro Pakett</div>
              </div>
           </div>
           <button onClick={() => navigate('/')} className="w-full flex items-center justify-center gap-2 text-xs font-bold text-[#8B7355] hover:text-[#E17B5C] hover:bg-[#3E352F]/30 transition-all py-2.5 rounded-lg uppercase tracking-wide">
             <LogOut className="w-3 h-3" /> Logi välja
           </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#FAF7F2] relative">
        
        {/* Header - Glassmorphism */}
        <header className="h-20 flex items-center justify-between px-8 z-10 sticky top-0 bg-[#FAF7F2]/80 backdrop-blur-xl border-b border-[#E7DCC7]/30 shadow-sm">
           <div className="flex items-center gap-4">
             <div className="flex flex-col justify-center">
               <h2 className="font-extrabold text-2xl text-[#2D2721] tracking-tight leading-none mb-0.5">
                 {navItems.find((n: any) => n.id === activePage)?.label || 'Töölaud'}
               </h2>
               <div className="text-xs font-semibold text-[#8B7355] uppercase tracking-wide opacity-80">
                  {new Date().toLocaleDateString('et-EE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
               </div>
             </div>
           </div>

           <div className="flex items-center gap-4">
              <div className="relative hidden xl:block group">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8B7355] group-focus-within:text-[#E17B5C] transition-colors" />
                <input 
                  className="pl-10 pr-4 py-2.5 rounded-xl bg-white border border-[#E7DCC7] text-sm font-medium focus:ring-2 focus:ring-[#FFC857]/50 focus:border-[#FFC857] outline-none w-80 shadow-sm transition-all placeholder-[#8B7355]/50 hover:border-[#FFC857]/50"
                  placeholder="Otsi tellimusi, kliente või tooteid..."
                />
              </div>
              
              <button className="relative p-2.5 bg-white border border-[#E7DCC7] rounded-xl text-[#6B5744] hover:text-[#2D2721] hover:border-[#FFC857] hover:shadow-md transition-all group">
                <Bell className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-[#E17B5C] rounded-full border border-white animate-pulse"></span>
              </button>

              <div className="h-8 w-px bg-[#E7DCC7]"></div>

              <WarmButton size="sm" variant="outline" className="hidden sm:flex bg-white hover:bg-[#FFF9ED] border-[#E7DCC7] hover:border-[#FFC857] shadow-sm font-bold text-[#6B5744]" onClick={() => navigate('/shop')}>
                <Globe className="w-4 h-4 mr-2 text-[#E17B5C]" /> Vaata poodi
              </WarmButton>
           </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto px-8 pb-12 pt-6 scroll-smooth custom-scrollbar">
           {renderContent()}
        </main>
      </div>
    </div>
  );
}