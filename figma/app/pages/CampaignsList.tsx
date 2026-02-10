import { useState } from 'react';
import { useNavigate } from '@/lib/router-shim';
import { WarmCard } from '@app/components/WarmCard';
import { WarmButton } from '@app/components/WarmButton';
import { 
  Megaphone, 
  TrendingUp, 
  Users, 
  MousePointer2, 
  Calendar,
  Plus,
  MoreHorizontal,
  BarChart3,
  Mail,
  Tag,
  Search,
  Filter,
  ArrowUpRight,
  Pencil,
  Trash2,
  PauseCircle,
  PlayCircle
} from 'lucide-react';
import { Input } from '@app/components/ui/input';
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { toast } from 'sonner';

const CAMPAIGNS_DATA = [
  { id: 1, name: 'Kevadine Allahindlus', type: 'discount', status: 'active', reach: 12500, clicks: 450, sales: 2400, progress: 65, budget: 1000, spent: 650 },
  { id: 2, name: 'Uudiskiri: Uus Sony Kaamera', type: 'email', status: 'completed', reach: 5400, clicks: 890, sales: 12500, progress: 100, budget: 500, spent: 500 },
  { id: 3, name: 'SÃµbrapÃ¤eva Pakkumine', type: 'social', status: 'scheduled', reach: 0, clicks: 0, sales: 0, progress: 0, budget: 2000, spent: 0 },
  { id: 4, name: 'PÃ¼sikliendi Kampaania', type: 'email', status: 'active', reach: 3200, clicks: 120, sales: 980, progress: 30, budget: 300, spent: 90 },
];

const CHART_DATA = [
  { day: 'E', value: 400, prev: 300 },
  { day: 'T', value: 300, prev: 400 },
  { day: 'K', value: 550, prev: 350 },
  { day: 'N', value: 800, prev: 500 },
  { day: 'R', value: 600, prev: 550 },
  { day: 'L', value: 900, prev: 700 },
  { day: 'P', value: 1100, prev: 800 },
];

export function CampaignsList() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [campaigns, setCampaigns] = useState(CAMPAIGNS_DATA);

  const handleDelete = (id: number) => {
    toast.success('Kampaania edukalt kustutatud');
    setCampaigns(campaigns.filter(c => c.id !== id));
  };

  const handleStatusToggle = (id: number, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'paused' : 'active';
    setCampaigns(campaigns.map(c => c.id === id ? { ...c, status: newStatus } : c));
    toast.success(`Kampaania ${newStatus === 'active' ? 'jÃ¤tkatud' : 'peatatud'}`);
  };

  const filteredCampaigns = campaigns.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || c.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h2 className="text-3xl font-bold text-[#2D2721]">Turunduskampaaniad</h2>
           <p className="text-[#6B5744] mt-1">Halda reklaame, uudiskirju ja sooduspakkumisi Ã¼hest kohast</p>
        </div>
        <WarmButton className="gap-2 shadow-lg hover:scale-105 transition-transform" onClick={() => navigate('/campaigns/create')}>
           <Plus className="w-4 h-4" /> Loo uus kampaania
        </WarmButton>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
         <WarmCard padding="md" className="bg-[#2D2721] text-white col-span-1 md:col-span-1">
            <div className="flex items-center gap-2 mb-2 opacity-80 text-sm">
               <TrendingUp className="w-4 h-4" /> ROI (Tasuvus)
            </div>
            <div className="text-3xl font-bold mb-1">450%</div>
            <div className="text-xs text-[#00D098] bg-[#00D098]/10 px-2 py-1 rounded-full inline-block">+12% vs eelmine kuu</div>
         </WarmCard>
         
         <WarmCard padding="md" className="col-span-1">
            <div className="flex items-center gap-2 mb-2 text-[#8B7355] text-sm">
               <Users className="w-4 h-4" /> Koguulatus
            </div>
            <div className="text-2xl font-bold text-[#2D2721] mb-1">
               {campaigns.reduce((acc, c) => acc + c.reach, 0).toLocaleString()}
            </div>
         </WarmCard>

         <WarmCard padding="md" className="col-span-1">
            <div className="flex items-center gap-2 mb-2 text-[#8B7355] text-sm">
               <MousePointer2 className="w-4 h-4" /> Klikid
            </div>
            <div className="text-2xl font-bold text-[#2D2721] mb-1">
               {campaigns.reduce((acc, c) => acc + c.clicks, 0).toLocaleString()}
            </div>
         </WarmCard>

         <WarmCard padding="md" className="col-span-1">
            <div className="flex items-center gap-2 mb-2 text-[#8B7355] text-sm">
               <Tag className="w-4 h-4" /> MÃ¼Ã¼k
            </div>
            <div className="text-2xl font-bold text-[#2D2721] mb-1">
               {campaigns.reduce((acc, c) => acc + c.sales, 0).toLocaleString()}â‚¬
            </div>
         </WarmCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         
         {/* Campaigns List */}
         <div className="lg:col-span-2 space-y-6">
            
            {/* Filters */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
               <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8B7355]" />
                  <Input 
                     placeholder="Otsi kampaaniat..." 
                     className="pl-9 bg-white border-[#E7DCC7]"
                     value={searchQuery}
                     onChange={(e) => setSearchQuery(e.target.value)}
                  />
               </div>
               <div className="flex gap-2">
                  {['all', 'active', 'scheduled', 'completed'].map(status => (
                     <button
                        key={status}
                        onClick={() => setFilterStatus(status)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-colors ${
                           filterStatus === status 
                              ? 'bg-[#2D2721] text-white' 
                              : 'bg-[#FFF9ED] text-[#8B7355] hover:bg-[#E7DCC7]'
                        }`}
                     >
                        {status === 'all' ? 'KÃµik' : status === 'active' ? 'Aktiivsed' : status === 'scheduled' ? 'Ootel' : 'LÃµppenud'}
                     </button>
                  ))}
               </div>
            </div>

            <div className="space-y-4">
               {filteredCampaigns.map((c) => (
                  <WarmCard key={c.id} padding="none" className="bg-white group hover:shadow-lg transition-all border border-[#E7DCC7] overflow-hidden">
                     <div className="p-5">
                        <div className="flex justify-between items-start mb-4">
                           <div className="flex items-center gap-4">
                              <div className={`p-3 rounded-xl flex items-center justify-center shadow-sm
                                 ${c.type === 'discount' ? 'bg-[#FFF9ED] text-[#FFC857]' : 
                                   c.type === 'email' ? 'bg-[#FAF7F2] text-[#8B7355]' : 
                                   'bg-[#E6F4EA] text-[#00D098]'}`}>
                                 {c.type === 'discount' && <Tag className="w-6 h-6" />}
                                 {c.type === 'email' && <Mail className="w-6 h-6" />}
                                 {c.type === 'social' && <Megaphone className="w-6 h-6" />}
                              </div>
                              <div>
                                 <h4 className="font-bold text-[#2D2721] text-lg flex items-center gap-2">
                                    {c.name}
                                    <ArrowUpRight className="w-4 h-4 text-[#8B7355] opacity-0 group-hover:opacity-100 transition-opacity" />
                                 </h4>
                                 <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider mt-1">
                                    {c.status === 'active' && <span className="text-[#00D098] flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#00D098] animate-pulse"></span>Aktiivne</span>}
                                    {c.status === 'paused' && <span className="text-[#E17B5C]">Peatatud</span>}
                                    {c.status === 'completed' && <span className="text-[#8B7355]">LÃµppenud</span>}
                                    {c.status === 'scheduled' && <span className="text-[#E17B5C]">Ootel</span>}
                                    <span className="text-[#E7DCC7]">â€¢</span>
                                    <span className="text-[#6B5744] capitalize">{c.type}</span>
                                 </div>
                              </div>
                           </div>
                           
                           <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                              {c.status === 'active' || c.status === 'paused' ? (
                                 <button 
                                    onClick={() => handleStatusToggle(c.id, c.status)}
                                    className="p-2 hover:bg-[#FAF7F2] rounded-lg text-[#8B7355] hover:text-[#2D2721]" 
                                    title={c.status === 'active' ? 'Peata' : 'JÃ¤tka'}
                                 >
                                    {c.status === 'active' ? <PauseCircle className="w-5 h-5" /> : <PlayCircle className="w-5 h-5" />}
                                 </button>
                              ) : null}
                              <button className="p-2 hover:bg-[#FAF7F2] rounded-lg text-[#8B7355] hover:text-[#2D2721]" title="Muuda">
                                 <Pencil className="w-5 h-5" />
                              </button>
                              <button 
                                 onClick={() => handleDelete(c.id)}
                                 className="p-2 hover:bg-[#FEE2E2] rounded-lg text-[#E17B5C] hover:text-red-600" 
                                 title="Kustuta"
                              >
                                 <Trash2 className="w-5 h-5" />
                              </button>
                           </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 border-t border-[#FAF7F2]">
                           <div>
                              <div className="text-xs text-[#8B7355] mb-1">Ulatus</div>
                              <div className="font-bold text-[#2D2721] text-lg">{c.reach.toLocaleString()}</div>
                           </div>
                           <div>
                              <div className="text-xs text-[#8B7355] mb-1">Klikid</div>
                              <div className="font-bold text-[#2D2721] text-lg">{c.clicks}</div>
                           </div>
                           <div>
                              <div className="text-xs text-[#8B7355] mb-1">MÃ¼Ã¼k</div>
                              <div className="font-bold text-[#2D2721] text-lg">{c.sales}â‚¬</div>
                           </div>
                           <div>
                              <div className="text-xs text-[#8B7355] mb-1">Konversioon</div>
                              <div className="font-bold text-[#00D098] text-lg">
                                 {c.clicks > 0 ? ((c.sales / c.clicks) / 10).toFixed(1) : 0}%
                              </div>
                           </div>
                        </div>
                     </div>
                     
                     {/* Footer / Progress */}
                     {c.status === 'active' && (
                        <div className="bg-[#FAF7F2] px-5 py-3 flex items-center justify-between text-xs">
                           <span className="font-bold text-[#8B7355]">Eelarve kasutus ({c.spent}â‚¬ / {c.budget}â‚¬)</span>
                           <div className="flex items-center gap-3 w-1/2">
                              <div className="h-1.5 w-full bg-[#E7DCC7] rounded-full overflow-hidden">
                                 <div className="h-full bg-[#FFC857] rounded-full" style={{ width: `${(c.spent / c.budget) * 100}%` }}></div>
                              </div>
                              <span className="font-bold text-[#2D2721]">{Math.round((c.spent / c.budget) * 100)}%</span>
                           </div>
                        </div>
                     )}
                  </WarmCard>
               ))}

               {filteredCampaigns.length === 0 && (
                  <div className="text-center py-12">
                     <p className="text-[#6B5744]">Otsingule vastavaid kampaaniaid ei leitud.</p>
                     <WarmButton variant="outline" className="mt-4" onClick={() => {setSearchQuery(''); setFilterStatus('all');}}>
                        TÃ¼hista filtrid
                     </WarmButton>
                  </div>
               )}
            </div>
         </div>

         {/* Insight Chart */}
         <div className="space-y-6">
             <WarmCard padding="lg" className="bg-white h-[400px] flex flex-col shadow-lg border border-[#E7DCC7]">
                <h3 className="font-bold text-[#2D2721] mb-6 flex items-center gap-2">
                   <BarChart3 className="w-4 h-4 text-[#FFC857]" /> NÃ¤dala tulemused
                </h3>
                <div className="flex-1 -ml-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={CHART_DATA}>
                      <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#00D098" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#00D098" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorPrev" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8B7355" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#8B7355" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                      <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#8B7355', fontSize: 12}} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: '#8B7355', fontSize: 12}} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                      />
                      <Area type="monotone" dataKey="value" name="KÃ¤esolev nÃ¤dal" stroke="#00D098" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                      <Area type="monotone" dataKey="prev" name="Eelmine nÃ¤dal" stroke="#8B7355" strokeWidth={2} strokeDasharray="5 5" fillOpacity={1} fill="url(#colorPrev)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
             </WarmCard>

             <div className="bg-gradient-to-br from-[#FFF9ED] to-[#FFE5B4] border border-[#FFC857] p-5 rounded-2xl shadow-sm relative overflow-hidden">
                <div className="absolute -right-4 -top-4 w-20 h-20 bg-[#FFC857] rounded-full opacity-20 blur-2xl"></div>
                
                <h4 className="font-bold text-[#2D2721] mb-2 flex items-center gap-2 relative z-10">
                   <Megaphone className="w-4 h-4 text-[#E17B5C]" /> AI Soovitus
                </h4>
                <p className="text-sm text-[#6B5744] leading-relaxed relative z-10 mb-4">
                   Sinu kampaania "Kevadine Allahindlus" toimib oodatust paremini (+15% klikke). 
                   Soovitame pikendada kampaaniat 3 pÃ¤eva vÃµrra.
                </p>
                <WarmButton size="sm" className="w-full relative z-10 bg-white text-[#2D2721] border border-[#E7DCC7] hover:bg-[#FFF]">
                   Rakenda soovitus
                </WarmButton>
             </div>
         </div>

      </div>
    </div>
  );
}
