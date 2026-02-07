import { useState } from 'react';
import { WarmCard } from '@/figma/app/components/WarmCard';
import { WarmButton } from '@/figma/app/components/WarmButton';
import { Input } from '@/figma/app/components/ui/input';
import { Badge } from '@/figma/app/components/ui/badge';
import { 
  FileText, 
  Download, 
  Filter, 
  Search, 
  CheckCircle2, 
  AlertCircle,
  MoreHorizontal,
  PieChart,
  ArrowUpRight,
  Landmark
} from 'lucide-react';

const INVOICES = [
  { id: 'ARVE-2026-001', date: '25.01.2026', client: 'Mari Tamm', amount: '85.00€', status: 'paid', due: '25.01.2026' },
  { id: 'ARVE-2026-002', date: '24.01.2026', client: 'Filmimehed OÜ', amount: '240.00€', status: 'paid', due: '07.02.2026' },
  { id: 'ARVE-2026-003', date: '24.01.2026', client: 'Jaan Kask', amount: '45.00€', status: 'pending', due: '24.01.2026' },
  { id: 'ARVE-2026-004', date: '22.01.2026', client: 'Event Center', amount: '150.00€', status: 'overdue', due: '22.01.2026' },
  { id: 'ARVE-2026-005', date: '20.01.2026', client: 'Peeter Oja', amount: '12.50€', status: 'paid', due: '20.01.2026' },
];

export function FinanceManager() {
  const [filter, setFilter] = useState('all');

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Header & Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-2">
           <h2 className="text-3xl font-bold text-[#2D2721]">Finantsid ja Arved</h2>
           <p className="text-[#6B5744]">Halda arveid, laekumisi ja raamatupidamise väljavõtteid.</p>
        </div>
        
        <div className="bg-[#2D2721] text-[#E7DCC7] p-4 rounded-xl flex flex-col justify-between shadow-lg">
           <div className="text-xs font-bold uppercase tracking-wider opacity-70">Jaanuar 2026</div>
           <div>
             <div className="text-3xl font-bold text-white">€12,450</div>
             <div className="text-sm text-[#00D098] flex items-center gap-1">
               <ArrowUpRight className="w-3 h-3" /> +15% vs eelmine kuu
             </div>
           </div>
        </div>
      </div>

      {/* Integration Banner */}
      <div className="bg-white border border-[#E7DCC7] rounded-xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
         <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#FFF9ED] rounded-lg flex items-center justify-center text-[#FFC857]">
               <Landmark className="w-6 h-6" />
            </div>
            <div>
               <h3 className="font-bold text-[#2D2721]">Raamatupidamise liidestus</h3>
               <p className="text-sm text-[#6B5744]">Saada arved automaatselt Merit Aktiva või e-arveldaja süsteemi.</p>
            </div>
         </div>
         <div className="flex gap-3">
            <WarmButton variant="outline" size="sm">Seadista eksport</WarmButton>
            <WarmButton size="sm">Ühenda Merit Aktiva</WarmButton>
         </div>
      </div>

      {/* Invoices List */}
      <WarmCard padding="none" className="bg-white overflow-hidden min-h-[500px]">
         {/* Toolbar */}
         <div className="p-4 border-b border-[#FAF7F2] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
               <div className="relative">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8B7355]" />
                 <Input className="pl-9 w-64 bg-[#FAF7F2] border-transparent focus:bg-white focus:border-[#FFC857]" placeholder="Otsi arve numbrit või klienti..." />
               </div>
               <WarmButton variant="outline" size="icon"><Filter className="w-4 h-4" /></WarmButton>
            </div>
            <div className="flex gap-2">
               <WarmButton variant="outline" className="gap-2">
                 <Download className="w-4 h-4" /> CSV
               </WarmButton>
               <WarmButton variant="outline" className="gap-2">
                 <Download className="w-4 h-4" /> PDF
               </WarmButton>
            </div>
         </div>

         {/* Table Header */}
         <div className="grid grid-cols-6 gap-4 p-4 bg-[#FAF7F2] text-xs font-bold text-[#8B7355] uppercase tracking-wider border-b border-[#E7DCC7]">
            <div className="col-span-2">Arve / Klient</div>
            <div>Kuupäev</div>
            <div>Tähtaeg</div>
            <div className="text-right">Summa</div>
            <div className="text-center">Staatus</div>
         </div>

         {/* Rows */}
         <div className="divide-y divide-[#FAF7F2]">
            {INVOICES.map((inv) => (
               <div key={inv.id} className="grid grid-cols-6 gap-4 p-4 items-center hover:bg-[#FFF9ED] transition-colors group cursor-pointer">
                  <div className="col-span-2">
                     <div className="font-bold text-[#2D2721] flex items-center gap-2">
                        <FileText className="w-4 h-4 text-[#8B7355]" />
                        {inv.id}
                     </div>
                     <div className="text-sm text-[#6B5744] pl-6">{inv.client}</div>
                  </div>
                  <div className="text-sm text-[#6B5744]">{inv.date}</div>
                  <div className="text-sm text-[#6B5744]">{inv.due}</div>
                  <div className="text-right font-bold text-[#2D2721]">{inv.amount}</div>
                  <div className="flex justify-center">
                     {inv.status === 'paid' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#E6F4EA] text-[#00D098]">
                           <CheckCircle2 className="w-3 h-3 mr-1" /> Makstud
                        </span>
                     )}
                     {inv.status === 'pending' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#FAF7F2] text-[#8B7355]">
                           Ootel
                        </span>
                     )}
                     {inv.status === 'overdue' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#FEF2F2] text-[#EF4444]">
                           <AlertCircle className="w-3 h-3 mr-1" /> Võlas
                        </span>
                     )}
                  </div>
               </div>
            ))}
         </div>
      </WarmCard>
    </div>
  );
}