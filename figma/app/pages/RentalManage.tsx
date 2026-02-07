import { useState } from 'react';
import { WarmCard } from '@app/components/WarmCard';
import { WarmButton } from '@app/components/WarmButton';
import { Input } from '@app/components/ui/input';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar as CalendarIcon, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Filter,
  MoreVertical,
  Plus,
  List as ListIcon,
  Clock,
  AlertCircle,
  CheckCircle2,
  Camera,
  User,
  ArrowRight
} from 'lucide-react';

// --- Mock Data ---

const DAYS = ['E 26.01', 'T 27.01', 'K 28.01', 'N 29.01', 'R 30.01', 'L 31.01', 'P 01.02'];
const ASSETS = [
  { 
    id: 1, 
    name: 'Sony A7 III (Kere)', 
    serial: 'SN-001', 
    category: 'Kaamerad',
    status: 'rented',
    returnDate: '27.01 14:00',
    client: 'Mari Tamm',
    bookings: [
      { start: 0, days: 2, client: 'Mari Tamm', status: 'active' }, 
      { start: 4, days: 3, client: 'Jaan Kask', status: 'future' }
    ] 
  },
  { 
    id: 2, 
    name: 'Sony A7 III (Kere)', 
    serial: 'SN-002', 
    category: 'Kaamerad',
    status: 'rented',
    returnDate: '28.01 10:00',
    client: 'Peeter Oja',
    bookings: [
      { start: 2, days: 1, client: 'Peeter Oja', status: 'active' }
    ] 
  },
  { 
    id: 3, 
    name: 'Canon 24-70mm f/2.8', 
    serial: 'LN-552', 
    category: 'Objektiivid',
    status: 'available',
    returnDate: '-',
    client: '-',
    bookings: [] 
  },
  { 
    id: 4, 
    name: 'DJI Ronin S', 
    serial: 'DJI-99', 
    category: 'Stabilisaatorid',
    status: 'overdue',
    returnDate: '25.01 12:00',
    client: 'Filmimehed OÜ',
    bookings: [
      { start: 0, days: 5, client: 'Filmimehed OÜ', status: 'overdue' }
    ] 
  },
];

// --- Sub Components ---

function CalendarView({ assets }: { assets: typeof ASSETS }) {
  return (
    <WarmCard padding="none" className="bg-white overflow-hidden flex-1 border border-[#E7DCC7] h-full flex flex-col">
       {/* Days Header */}
       <div className="grid grid-cols-[250px_repeat(7,1fr)] border-b border-[#E7DCC7] bg-[#FAF7F2]">
          <div className="p-4 font-bold text-[#8B7355] text-xs uppercase tracking-wider border-r border-[#E7DCC7] flex items-center justify-between">
             <span>Seade</span>
             <Filter className="w-3 h-3 cursor-pointer hover:text-[#2D2721]" />
          </div>
          {DAYS.map((day, i) => (
             <div key={i} className={`p-3 text-center text-sm font-bold border-r border-[#E7DCC7]/50 last:border-r-0 flex flex-col justify-center ${i === 0 ? 'bg-[#FFF9ED] text-[#FFC857]' : 'text-[#2D2721]'}`}>
                {day}
             </div>
          ))}
       </div>

       {/* Rows */}
       <div className="divide-y divide-[#FAF7F2] overflow-y-auto custom-scrollbar flex-1">
          {assets.map((asset) => (
             <div key={asset.id} className="grid grid-cols-[250px_repeat(7,1fr)] hover:bg-[#FAF7F2]/30 transition-colors min-h-[64px]">
                
                {/* Asset Info */}
                <div className="p-3 border-r border-[#E7DCC7] flex flex-col justify-center relative group">
                   <div className="font-bold text-[#2D2721] text-sm truncate pr-6" title={asset.name}>{asset.name}</div>
                   <div className="text-xs text-[#8B7355] flex items-center gap-2 mt-0.5">
                      <span className="bg-[#FAF7F2] px-1.5 py-0.5 rounded border border-[#E7DCC7]">{asset.serial}</span>
                      <span className="opacity-60">{asset.category}</span>
                   </div>
                   <button className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1 hover:bg-[#E7DCC7] rounded text-[#6B5744] transition-all">
                      <MoreVertical className="w-4 h-4" />
                   </button>
                </div>

                {/* Grid */}
                <div className="col-span-7 relative h-full">
                    <div className="absolute inset-0 grid grid-cols-7 h-full w-full pointer-events-none">
                       {[...Array(7)].map((_, i) => (
                          <div key={i} className="border-r border-[#FAF7F2] h-full last:border-r-0"></div>
                       ))}
                    </div>

                    {asset.bookings.map((booking, i) => {
                       const widthPercent = (booking.days / 7) * 100;
                       const leftPercent = (booking.start / 7) * 100;
                       
                       let colorClass = 'bg-[#00D098] text-white border-none shadow-md shadow-[#00D098]/20';
                       if (booking.status === 'future') colorClass = 'bg-[#E7DCC7] text-[#2D2721] border border-[#d6cbb6]';
                       if (booking.status === 'overdue') colorClass = 'bg-[#E17B5C] text-white border-none shadow-md shadow-[#E17B5C]/20';

                       return (
                          <div 
                             key={i}
                             className={`absolute top-2 bottom-2 rounded-lg px-2.5 flex items-center text-xs font-bold overflow-hidden cursor-pointer hover:brightness-95 hover:scale-[1.02] transition-all z-10 ${colorClass}`}
                             style={{ 
                                left: `${leftPercent + 0.5}%`, 
                                width: `${widthPercent - 1}%` 
                             }}
                             title={`${booking.client} (${booking.status})`}
                          >
                             <div className="flex items-center gap-1.5 truncate">
                                {booking.status === 'overdue' && <AlertCircle className="w-3 h-3 flex-shrink-0" />}
                                {booking.status === 'active' && <Clock className="w-3 h-3 flex-shrink-0" />}
                                {booking.client}
                             </div>
                          </div>
                       );
                    })}
                </div>
             </div>
          ))}
       </div>
    </WarmCard>
  );
}

function ListView({ assets }: { assets: typeof ASSETS }) {
  return (
    <div className="bg-white rounded-xl border border-[#E7DCC7] overflow-hidden flex-1 flex flex-col">
       <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
             <thead className="bg-[#FAF7F2] text-[#8B7355] font-bold uppercase tracking-wider text-xs border-b border-[#E7DCC7]">
                <tr>
                   <th className="p-4 w-12">
                      <input type="checkbox" className="rounded border-[#E7DCC7] text-[#FFC857] focus:ring-[#FFC857]" />
                   </th>
                   <th className="p-4">Seade / Seerianumber</th>
                   <th className="p-4">Staatus</th>
                   <th className="p-4">Klient</th>
                   <th className="p-4">Tagastus</th>
                   <th className="p-4 text-right">Tegevused</th>
                </tr>
             </thead>
             <tbody className="divide-y divide-[#E7DCC7]/50">
                {assets.map((asset) => (
                   <tr key={asset.id} className="hover:bg-[#FAF7F2]/30 transition-colors group">
                      <td className="p-4">
                         <input type="checkbox" className="rounded border-[#E7DCC7] text-[#FFC857] focus:ring-[#FFC857]" />
                      </td>
                      <td className="p-4">
                         <div className="font-bold text-[#2D2721]">{asset.name}</div>
                         <div className="text-xs text-[#8B7355] font-mono mt-0.5">{asset.serial}</div>
                      </td>
                      <td className="p-4">
                         {asset.status === 'available' && <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-[#E6F4EA] text-[#00D098]"><CheckCircle2 className="w-3 h-3" /> Vaba</span>}
                         {asset.status === 'rented' && <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-[#FFF9ED] text-[#FFC857]"><Clock className="w-3 h-3" /> Väljas</span>}
                         {asset.status === 'overdue' && <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-[#FFEFEF] text-[#E17B5C]"><AlertCircle className="w-3 h-3" /> Hilinenud</span>}
                      </td>
                      <td className="p-4">
                         {asset.client !== '-' ? (
                            <div className="flex items-center gap-2">
                               <div className="w-6 h-6 rounded-full bg-[#E7DCC7] flex items-center justify-center text-[10px] font-bold text-[#6B5744]">
                                  {asset.client.substring(0,2).toUpperCase()}
                               </div>
                               <span className="font-medium text-[#2D2721]">{asset.client}</span>
                            </div>
                         ) : (
                            <span className="text-[#8B7355] italic">-</span>
                         )}
                      </td>
                      <td className="p-4 font-medium text-[#2D2721]">
                         {asset.returnDate}
                      </td>
                      <td className="p-4 text-right">
                         <button className="text-[#8B7355] hover:text-[#2D2721] p-2 hover:bg-[#FAF7F2] rounded transition-colors opacity-0 group-hover:opacity-100">
                            <MoreVertical className="w-4 h-4" />
                         </button>
                      </td>
                   </tr>
                ))}
             </tbody>
          </table>
       </div>
       {/* Pagination mock */}
       <div className="p-4 border-t border-[#E7DCC7] flex justify-between items-center bg-[#FAF7F2]/30 mt-auto">
          <div className="text-xs text-[#8B7355]">Näitan 1-4 kokku 142-st</div>
          <div className="flex gap-2">
             <button className="px-3 py-1 bg-white border border-[#E7DCC7] rounded text-xs font-bold text-[#2D2721] hover:bg-[#FAF7F2]">Eelmised</button>
             <button className="px-3 py-1 bg-white border border-[#E7DCC7] rounded text-xs font-bold text-[#2D2721] hover:bg-[#FAF7F2]">Järgmised</button>
          </div>
       </div>
    </div>
  );
}

// --- Main Component ---

export function RentalManage() {
  const navigate = useNavigate();
  const [view, setView] = useState<'calendar' | 'list'>('calendar');
  const [searchTerm, setSearchTerm] = useState('');

  // Filtering Logic
  const filteredAssets = ASSETS.filter(a => 
    a.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    a.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.serial.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col space-y-6 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
           <h2 className="text-2xl font-bold text-[#2D2721] flex items-center gap-2">
              <Camera className="w-6 h-6 text-[#E17B5C]" /> Rendikalender
           </h2>
           <p className="text-[#6B5744]">Halda broneeringuid ja seadmete saadavust</p>
        </div>
        <div className="flex gap-3">
           <div className="flex bg-white rounded-xl border border-[#E7DCC7] p-1 shadow-sm">
              <button 
                onClick={() => setView('calendar')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${view === 'calendar' ? 'bg-[#2D2721] text-white shadow-md' : 'text-[#8B7355] hover:bg-[#FAF7F2]'}`}
              >
                <CalendarIcon className="w-4 h-4" /> <span className="hidden sm:inline">Kalender</span>
              </button>
              <button 
                onClick={() => setView('list')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${view === 'list' ? 'bg-[#2D2721] text-white shadow-md' : 'text-[#8B7355] hover:bg-[#FAF7F2]'}`}
              >
                <ListIcon className="w-4 h-4" /> <span className="hidden sm:inline">Nimekiri</span>
              </button>
           </div>
           <WarmButton className="gap-2 shadow-lg shadow-[#FFC857]/20" onClick={() => navigate('/orders/create')}>
              <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Uus broneering</span>
           </WarmButton>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between bg-white p-4 rounded-xl border border-[#E7DCC7] shadow-sm gap-4">
         <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-start">
            <div className="flex items-center gap-2 bg-[#FAF7F2] rounded-lg p-1 border border-[#E7DCC7]">
               <button className="p-1.5 hover:bg-white rounded shadow-sm transition-all text-[#8B7355] hover:text-[#2D2721]"><ChevronLeft className="w-4 h-4" /></button>
               <span className="font-bold text-[#2D2721] w-32 text-center text-sm">Jaanuar 2026</span>
               <button className="p-1.5 hover:bg-white rounded shadow-sm transition-all text-[#8B7355] hover:text-[#2D2721]"><ChevronRight className="w-4 h-4" /></button>
            </div>
            <button className="text-sm font-bold text-[#E17B5C] hover:text-[#C56041] underline decoration-dotted underline-offset-4">Täna</button>
         </div>
         
         <div className="flex gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-none">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8B7355]" />
               <Input 
                 className="pl-9 w-full sm:w-64 h-10 bg-[#FAF7F2] border-[#E7DCC7] focus:border-[#FFC857]" 
                 placeholder="Otsi toodet, klienti..." 
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
               />
            </div>
            <WarmButton variant="outline" className="h-10 px-3 bg-white hover:bg-[#FFF9ED] border-[#E7DCC7] text-[#8B7355]">
               <Filter className="w-4 h-4" />
            </WarmButton>
         </div>
      </div>

      {/* Dynamic Content Area */}
      {view === 'calendar' ? <CalendarView assets={filteredAssets} /> : <ListView assets={filteredAssets} />}
      
    </div>
  );
}