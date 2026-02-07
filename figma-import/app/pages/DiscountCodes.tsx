import { useState } from 'react';
import { WarmCard } from '@/app/components/WarmCard';
import { WarmButton } from '@/app/components/WarmButton';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Switch } from '@/app/components/ui/switch';
import { 
  Ticket, 
  Percent, 
  Copy, 
  Trash2, 
  Plus, 
  Search, 
  Calendar, 
  CheckCircle2,
  XCircle,
  MoreHorizontal,
  RefreshCw,
  ShoppingBag
} from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/app/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';

type DiscountCode = {
  id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  status: 'active' | 'expired' | 'scheduled';
  usageCount: number;
  usageLimit: number | null; // null means unlimited
  minOrderAmount: number;
  startDate: string;
  endDate: string | null;
};

const MOCK_CODES: DiscountCode[] = [
  {
    id: '1',
    code: 'KEVAD20',
    type: 'percentage',
    value: 20,
    status: 'active',
    usageCount: 45,
    usageLimit: 100,
    minOrderAmount: 0,
    startDate: '2024-03-01',
    endDate: '2024-05-31'
  },
  {
    id: '2',
    code: 'TERE10',
    type: 'percentage',
    value: 10,
    status: 'active',
    usageCount: 1250,
    usageLimit: null,
    minOrderAmount: 0,
    startDate: '2023-01-01',
    endDate: null
  },
  {
    id: '3',
    code: 'MINUS5',
    type: 'fixed',
    value: 5,
    status: 'expired',
    usageCount: 200,
    usageLimit: 200,
    minOrderAmount: 20,
    startDate: '2023-12-01',
    endDate: '2023-12-31'
  }
];

export function DiscountCodes() {
  const [codes, setCodes] = useState<DiscountCode[]>(MOCK_CODES);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // New Code Form State
  const [newCode, setNewCode] = useState({
    code: '',
    type: 'percentage',
    value: '',
    usageLimit: '',
    minOrderAmount: '',
    endDate: ''
  });

  const filteredCodes = codes.filter(c => 
    c.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreate = () => {
    if (!newCode.code || !newCode.value) {
      toast.error('Kood ja väärtus on kohustuslikud');
      return;
    }

    const created: DiscountCode = {
      id: Math.random().toString(36).substr(2, 9),
      code: newCode.code.toUpperCase(),
      type: newCode.type as 'percentage' | 'fixed',
      value: Number(newCode.value),
      status: 'active',
      usageCount: 0,
      usageLimit: newCode.usageLimit ? Number(newCode.usageLimit) : null,
      minOrderAmount: newCode.minOrderAmount ? Number(newCode.minOrderAmount) : 0,
      startDate: new Date().toISOString().split('T')[0],
      endDate: newCode.endDate || null
    };

    setCodes([created, ...codes]);
    setIsCreateOpen(false);
    setNewCode({ code: '', type: 'percentage', value: '', usageLimit: '', minOrderAmount: '', endDate: '' });
    toast.success(`Sooduskood ${created.code} loodud!`);
  };

  const handleDelete = (id: string) => {
    setCodes(codes.filter(c => c.id !== id));
    toast.success('Sooduskood kustutatud');
  };

  const generateRandomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewCode({ ...newCode, code: result });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Kood kopeeritud');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h1 className="text-3xl font-bold text-[#2D2721]">Sooduskoodid</h1>
           <p className="text-[#6B5744] mt-1">Halda kuponge ja soodustusi klientidele</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <WarmButton className="gap-2 shadow-lg hover:scale-105 transition-transform">
               <Plus className="w-4 h-4" /> Loo uus kood
            </WarmButton>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] bg-[#FAF7F2] border-[#E7DCC7]">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-[#2D2721]">Uus sooduskood</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="code" className="font-bold text-[#2D2721]">Kood *</Label>
                <div className="flex gap-2">
                  <Input
                    id="code"
                    value={newCode.code}
                    onChange={(e) => setNewCode({ ...newCode, code: e.target.value.toUpperCase() })}
                    placeholder="nt. SUVEMÜÜK2024"
                    className="font-mono uppercase tracking-widest text-lg border-[#E7DCC7] bg-white focus:border-[#FFC857]"
                  />
                  <WarmButton variant="outline" onClick={generateRandomCode} title="Genereeri suvaline">
                    <RefreshCw className="w-4 h-4" />
                  </WarmButton>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="type">Tüüp</Label>
                  <Select 
                    value={newCode.type} 
                    onValueChange={(v) => setNewCode({ ...newCode, type: v })}
                  >
                    <SelectTrigger className="bg-white border-[#E7DCC7]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Protsent (%)</SelectItem>
                      <SelectItem value="fixed">Kindel summa (€)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="value">Väärtus *</Label>
                  <Input
                    id="value"
                    type="number"
                    value={newCode.value}
                    onChange={(e) => setNewCode({ ...newCode, value: e.target.value })}
                    placeholder="nt. 20"
                    className="bg-white border-[#E7DCC7]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="limit">Kasutuslimiit</Label>
                  <Input
                    id="limit"
                    type="number"
                    value={newCode.usageLimit}
                    onChange={(e) => setNewCode({ ...newCode, usageLimit: e.target.value })}
                    placeholder="Lõpmatu"
                    className="bg-white border-[#E7DCC7]"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="minOrder">Min. tellimus (€)</Label>
                  <Input
                    id="minOrder"
                    type="number"
                    value={newCode.minOrderAmount}
                    onChange={(e) => setNewCode({ ...newCode, minOrderAmount: e.target.value })}
                    placeholder="0.00"
                    className="bg-white border-[#E7DCC7]"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <WarmButton onClick={handleCreate} className="w-full">Salvesta kood</WarmButton>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <WarmCard padding="md" className="bg-[#2D2721] text-white">
            <div className="flex items-center gap-2 mb-2 opacity-80 text-sm">
               <Ticket className="w-4 h-4" /> Aktiivsed koodid
            </div>
            <div className="text-3xl font-bold mb-1">{codes.filter(c => c.status === 'active').length}</div>
            <div className="text-xs text-[#00D098]">Kõik toimivad</div>
         </WarmCard>
         <WarmCard padding="md">
            <div className="flex items-center gap-2 mb-2 text-[#8B7355] text-sm">
               <CheckCircle2 className="w-4 h-4" /> Kokku kasutatud
            </div>
            <div className="text-3xl font-bold text-[#2D2721] mb-1">
               {codes.reduce((acc, c) => acc + c.usageCount, 0)}
            </div>
            <div className="text-xs text-[#6B5744]">korda</div>
         </WarmCard>
         <WarmCard padding="md">
            <div className="flex items-center gap-2 mb-2 text-[#8B7355] text-sm">
               <ShoppingBag className="w-4 h-4" /> Müügitulu koodidega
            </div>
            <div className="text-3xl font-bold text-[#2D2721] mb-1">~12,450€</div>
            <div className="text-xs text-[#6B5744]">Hinnanguline</div>
         </WarmCard>
      </div>

      {/* Filters & List */}
      <WarmCard padding="lg" className="min-h-[400px]">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
           <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8B7355]" />
              <Input 
                 placeholder="Otsi koodi..." 
                 className="pl-9 bg-white border-[#E7DCC7]"
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
              />
           </div>
           
           <div className="flex gap-2">
              <button className="text-sm font-medium text-[#8B7355] hover:text-[#2D2721] transition-colors">Kõik</button>
              <button className="text-sm font-medium text-[#2D2721] font-bold border-b-2 border-[#FFC857]">Aktiivsed</button>
              <button className="text-sm font-medium text-[#8B7355] hover:text-[#2D2721] transition-colors">Aegunud</button>
           </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E7DCC7]">
                <th className="py-3 px-4 text-xs font-bold text-[#8B7355] uppercase tracking-wider">Kood</th>
                <th className="py-3 px-4 text-xs font-bold text-[#8B7355] uppercase tracking-wider">Soodustus</th>
                <th className="py-3 px-4 text-xs font-bold text-[#8B7355] uppercase tracking-wider">Kasutatud</th>
                <th className="py-3 px-4 text-xs font-bold text-[#8B7355] uppercase tracking-wider">Kehtivus</th>
                <th className="py-3 px-4 text-xs font-bold text-[#8B7355] uppercase tracking-wider">Staatus</th>
                <th className="py-3 px-4 text-right text-xs font-bold text-[#8B7355] uppercase tracking-wider">Tegevused</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#FAF7F2]">
              {filteredCodes.length > 0 ? (
                filteredCodes.map((code) => (
                  <tr key={code.id} className="group hover:bg-[#FAF7F2] transition-colors">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <div className="font-mono font-bold text-lg text-[#2D2721] tracking-wide bg-[#FFF9ED] px-2 py-1 rounded border border-[#E7DCC7] border-dashed">
                          {code.code}
                        </div>
                        <button 
                          onClick={() => copyToClipboard(code.code)}
                          className="text-[#8B7355] hover:text-[#2D2721] opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="font-bold text-[#E17B5C]">
                        {code.type === 'percentage' ? `-${code.value}%` : `-${code.value}€`}
                      </span>
                      {code.minOrderAmount > 0 && (
                        <div className="text-xs text-[#8B7355]">Min. {code.minOrderAmount}€</div>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                         <div className="h-1.5 w-16 bg-[#E7DCC7] rounded-full overflow-hidden">
                            <div 
                               className="h-full bg-[#00D098] rounded-full" 
                               style={{ width: code.usageLimit ? `${Math.min((code.usageCount / code.usageLimit) * 100, 100)}%` : '50%' }}
                            ></div>
                         </div>
                         <span className="text-sm text-[#6B5744]">
                           {code.usageCount} {code.usageLimit ? `/ ${code.usageLimit}` : ''}
                         </span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-sm text-[#6B5744] flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-[#8B7355]" />
                        {code.endDate ? code.endDate : <span className="text-[#00D098]">Tähtajatu</span>}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${
                        code.status === 'active' 
                          ? 'bg-[#E6F4EA] text-[#00D098] border-[#00D098]/20' 
                          : 'bg-[#FFF5F5] text-[#E17B5C] border-[#E17B5C]/20'
                      }`}>
                        {code.status === 'active' ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        {code.status === 'active' ? 'Aktiivne' : 'Aegunud'}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                       <div className="flex items-center justify-end gap-2">
                          <button className="p-2 hover:bg-white rounded-lg text-[#8B7355] transition-colors">
                             <MoreHorizontal className="w-4 h-4" />
                          </button>
                          <button 
                             onClick={() => handleDelete(code.id)}
                             className="p-2 hover:bg-[#FEE2E2] rounded-lg text-[#E17B5C] hover:text-red-600 transition-colors"
                          >
                             <Trash2 className="w-4 h-4" />
                          </button>
                       </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#6B5744]">
                    <div className="flex flex-col items-center gap-2">
                       <div className="w-12 h-12 bg-[#FAF7F2] rounded-full flex items-center justify-center">
                          <Ticket className="w-6 h-6 text-[#E7DCC7]" />
                       </div>
                       <p>Sooduskoode ei leitud.</p>
                       <WarmButton variant="outline" size="sm" onClick={() => setIsCreateOpen(true)}>Loo esimene kood</WarmButton>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </WarmCard>
    </div>
  );
}