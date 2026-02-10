import { useState, useMemo } from 'react';
import { useNavigate } from '@/lib/router-shim';
import { WarmCard } from '@app/components/WarmCard';
import { WarmButton } from '@app/components/WarmButton';
import { 
  ClipboardList, 
  CheckCircle2, 
  Clock, 
  Truck, 
  Package,
  AlertCircle,
  Calendar,
  User,
  Search,
  ArrowRight,
  Filter,
  MoreVertical,
  Phone,
  Mail,
  Printer,
  X,
  CreditCard,
  Euro,
  ShoppingBag,
  Camera,
  FileText
} from 'lucide-react';

// --- Types & Mock Data ---

type OrderStatus = 'new' | 'processing' | 'ready' | 'completed';
type OrderType = 'rental' | 'sale' | 'b2b' | 'service';

interface OrderItem {
  name: string;
  qty: number;
  price: number;
}

interface Order {
  id: string;
  customer: string;
  email: string;
  phone: string;
  items: OrderItem[];
  total: number;
  date: string;
  status: OrderStatus;
  type: OrderType;
  paymentStatus: 'paid' | 'pending' | 'failed';
  note?: string;
}

const INITIAL_ORDERS: Order[] = [
  { 
    id: 'ORD-3921', 
    customer: 'Mari Tamm', 
    email: 'mari.tamm@example.com',
    phone: '+372 5555 1234',
    items: [{ name: 'Sony A7 III', qty: 1, price: 45 }, { name: '24-70mm Lens', qty: 1, price: 20 }], 
    total: 85.00, 
    date: '10:30', 
    status: 'new', 
    type: 'rental',
    paymentStatus: 'paid'
  },
  { 
    id: 'ORD-3920', 
    customer: 'Peeter Oja', 
    email: 'peeter@eesti.ee',
    phone: '+372 5123 4567',
    items: [{ name: 'DJI Ronin S', qty: 1, price: 45 }], 
    total: 45.00, 
    date: '09:15', 
    status: 'new', 
    type: 'rental',
    paymentStatus: 'pending'
  },
  { 
    id: 'ORD-3919', 
    customer: 'Kanal 2', 
    email: 'produktsioon@kanal2.ee',
    phone: '+372 6666 0000',
    items: [{ name: 'Blackmagic 6K Pro', qty: 2, price: 150 }, { name: 'V-Mount Battery Kit', qty: 4, price: 20 }], 
    total: 380.00, 
    date: 'Eile', 
    status: 'processing', 
    type: 'b2b',
    paymentStatus: 'paid',
    note: 'Vaja arvet e-arvekeskusesse'
  },
  { 
    id: 'ORD-3918', 
    customer: 'Jaan Kask', 
    email: 'jaan@gmail.com',
    phone: '+372 5999 8888',
    items: [{ name: 'SD Card 128GB', qty: 1, price: 24.90 }], 
    total: 24.90, 
    date: 'Eile', 
    status: 'ready', 
    type: 'sale',
    paymentStatus: 'paid'
  },
  { 
    id: 'ORD-3915', 
    customer: 'Eesti Energia', 
    email: 'info@energia.ee',
    phone: '+372 777 1111',
    items: [{ name: 'Droonimissioon (Teenus)', qty: 1, price: 450 }], 
    total: 450.00, 
    date: '23.01', 
    status: 'completed', 
    type: 'service',
    paymentStatus: 'paid'
  },
];

const COLUMNS = [
  { id: 'new', title: 'Uued', subtitle: 'Vajavad tÃ¤helepanu', icon: AlertCircle, color: 'text-[#E17B5C]', bg: 'bg-[#E17B5C]/10', border: 'border-[#E17B5C]' },
  { id: 'processing', title: 'TÃ¶Ã¶s', subtitle: 'Komplekteerimisel', icon: Clock, color: 'text-[#FFC857]', bg: 'bg-[#FFF9ED]', border: 'border-[#FFC857]' },
  { id: 'ready', title: 'Valmis', subtitle: 'Ootab klienti', icon: Package, color: 'text-[#8B7355]', bg: 'bg-[#FAF7F2]', border: 'border-[#8B7355]' },
  { id: 'completed', title: 'Tehtud', subtitle: 'Arhiveeritud', icon: CheckCircle2, color: 'text-[#00D098]', bg: 'bg-[#E6F4EA]', border: 'border-[#00D098]' },
];

export function OrderManager() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<OrderType | 'all'>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // --- Actions ---

  const moveOrder = (e: React.MouseEvent, orderId: string, newStatus: OrderStatus) => {
    e.stopPropagation(); // Prevent opening details when clicking action button
    setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
  };

  const updatePaymentStatus = (status: 'paid' | 'pending') => {
    if (!selectedOrder) return;
    const updated = { ...selectedOrder, paymentStatus: status };
    setOrders(orders.map(o => o.id === selectedOrder.id ? updated : o));
    setSelectedOrder(updated);
  };

  // --- Derived State ---

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const matchesSearch = 
        order.customer.toLowerCase().includes(searchTerm.toLowerCase()) || 
        order.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === 'all' || order.type === filterType;
      return matchesSearch && matchesType;
    });
  }, [orders, searchTerm, filterType]);

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'new').length,
    revenue: orders.filter(o => o.date.includes('10:') || o.date.includes('09:')).reduce((acc, curr) => acc + curr.total, 0), // Mock logic for "today"
    avgValue: orders.reduce((acc, curr) => acc + curr.total, 0) / orders.length || 0
  };

  return (
    <div className="h-full flex flex-col space-y-6 animate-in fade-in duration-500 relative">
      
      {/* Header & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
         <div className="md:col-span-2">
            <h2 className="text-2xl font-bold text-[#2D2721]">Tellimuste haldus</h2>
            <p className="text-[#6B5744]">Halda kÃµiki tellimusi ja rendisoove Ã¼hest kohast.</p>
         </div>
         
         <WarmCard padding="sm" className="bg-white flex items-center justify-between border border-[#E7DCC7]">
            <div>
               <div className="text-xs text-[#8B7355] font-bold uppercase">Ootel tellimusi</div>
               <div className="text-2xl font-bold text-[#E17B5C]">{stats.pending}</div>
            </div>
            <div className="p-2 bg-[#FFF9ED] rounded-lg text-[#E17B5C]"><AlertCircle className="w-5 h-5" /></div>
         </WarmCard>

         <WarmCard padding="sm" className="bg-white flex items-center justify-between border border-[#E7DCC7]">
            <div>
               <div className="text-xs text-[#8B7355] font-bold uppercase">TÃ¤nane kÃ¤ive</div>
               <div className="text-2xl font-bold text-[#2D2721]">{stats.revenue.toFixed(2)}â‚¬</div>
            </div>
            <div className="p-2 bg-[#E6F4EA] rounded-lg text-[#00D098]"><Euro className="w-5 h-5" /></div>
         </WarmCard>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-4 rounded-xl border border-[#E7DCC7] shadow-sm">
         <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8B7355]" />
               <input 
                 placeholder="Otsi nime vÃµi ID jÃ¤rgi..."
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
                 className="w-full pl-10 pr-4 py-2 bg-[#FAF7F2] border border-[#E7DCC7] rounded-lg focus:border-[#FFC857] outline-none text-sm font-medium"
               />
            </div>
            <div className="h-8 w-px bg-[#E7DCC7] hidden sm:block"></div>
            <div className="flex gap-1 bg-[#FAF7F2] p-1 rounded-lg">
               {(['all', 'rental', 'sale'] as const).map(type => (
                  <button
                    key={type}
                    onClick={() => setFilterType(type)}
                    className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${filterType === type ? 'bg-white text-[#2D2721] shadow-sm' : 'text-[#8B7355] hover:text-[#2D2721]'}`}
                  >
                     {type === 'all' ? 'KÃµik' : type === 'rental' ? 'Rent' : 'MÃ¼Ã¼k'}
                  </button>
               ))}
            </div>
         </div>

         <div className="flex gap-2 w-full sm:w-auto">
            <WarmButton variant="outline" className="flex-1 sm:flex-none gap-2" onClick={() => navigate('/orders/create')}>
               <ArrowRight className="w-4 h-4" /> <span className="hidden sm:inline">Manuaalne</span>
            </WarmButton>
            <WarmButton className="flex-1 sm:flex-none gap-2 bg-[#2D2721] text-white">
               <ClipboardList className="w-4 h-4" /> <span className="hidden sm:inline">Ekspordi</span>
            </WarmButton>
         </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto pb-4 custom-scrollbar">
        <div className="flex gap-6 min-w-[1200px] h-full">
          
          {COLUMNS.map((col) => {
            const ColumnIcon = col.icon;
            const colOrders = filteredOrders.filter(o => o.status === col.id);
            const nextStatus = COLUMNS[COLUMNS.findIndex(c => c.id === col.id) + 1]?.id as OrderStatus;
            
            return (
              <div key={col.id} className="flex-1 flex flex-col min-w-[300px]">
                {/* Column Header */}
                <div className={`flex items-center justify-between p-4 rounded-t-xl border-t-4 ${col.border} bg-white shadow-sm mb-3 group`}>
                   <div>
                      <div className="flex items-center gap-2 font-bold text-[#2D2721] text-lg">
                         {col.title}
                         <span className="text-xs bg-[#FAF7F2] text-[#8B7355] px-2 py-0.5 rounded-full border border-[#E7DCC7]">
                           {colOrders.length}
                         </span>
                      </div>
                      <div className="text-xs text-[#8B7355] font-medium mt-0.5">{col.subtitle}</div>
                   </div>
                   <div className={`p-2 rounded-xl ${col.bg}`}>
                     <ColumnIcon className={`w-5 h-5 ${col.color}`} />
                   </div>
                </div>

                {/* Drop Zone */}
                <div className="flex-1 bg-[#FAF7F2]/50 rounded-xl p-2 space-y-3 border border-[#E7DCC7]/30 h-full overflow-y-auto custom-scrollbar">
                   {colOrders.map((order) => (
                      <WarmCard 
                        key={order.id} 
                        padding="sm" 
                        onClick={() => setSelectedOrder(order)}
                        className={`bg-white hover:shadow-warm-lg cursor-pointer group transition-all border hover:border-[#FFC857] ${order.status === 'new' ? 'border-[#E17B5C]/30' : 'border-[#E7DCC7]'}`}
                      >
                         <div className="flex justify-between items-start mb-3">
                            <div className="flex gap-2 items-center">
                               {order.type === 'rental' && <div className="p-1.5 bg-[#3E352F] rounded text-[#E17B5C]"><Camera className="w-3 h-3" /></div>}
                               {order.type === 'sale' && <div className="p-1.5 bg-[#FFF9ED] rounded text-[#FFC857]"><ShoppingBag className="w-3 h-3" /></div>}
                               {order.type === 'b2b' && <div className="p-1.5 bg-[#F3E8FF] rounded text-[#7C3AED]"><FileText className="w-3 h-3" /></div>}
                               
                               <span className="font-mono text-xs font-bold text-[#8B7355] opacity-70">#{order.id.split('-')[1]}</span>
                            </div>
                            {order.paymentStatus === 'paid' ? (
                               <div className="text-[10px] font-bold text-[#00D098] bg-[#E6F4EA] px-2 py-0.5 rounded-full flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> TASUTUD</div>
                            ) : (
                               <div className="text-[10px] font-bold text-[#E17B5C] bg-[#FFF9ED] px-2 py-0.5 rounded-full flex items-center gap-1"><AlertCircle className="w-3 h-3" /> OOTEL</div>
                            )}
                         </div>
                         
                         <h4 className="font-bold text-[#2D2721] text-base mb-1 truncate">{order.customer}</h4>
                         <div className="text-xs text-[#6B5744] mb-4 truncate">{order.items.length} toodet: {order.items.map(i => i.name).join(', ')}</div>

                         <div className="flex items-center justify-between pt-3 border-t border-[#FAF7F2] mt-auto">
                            <span className="font-bold text-[#2D2721] text-lg">{order.total.toFixed(2)}â‚¬</span>
                            
                            <div className="flex items-center gap-2">
                               <div className="text-xs text-[#8B7355] flex items-center gap-1 bg-[#FAF7F2] px-2 py-1 rounded">
                                  <Clock className="w-3 h-3" /> {order.date}
                               </div>
                               {nextStatus && (
                                  <button 
                                    onClick={(e) => moveOrder(e, order.id, nextStatus)}
                                    className="p-1.5 hover:bg-[#E6F4EA] text-[#00D098] rounded-md transition-colors"
                                    title="Liiguta edasi"
                                  >
                                    <ArrowRight className="w-4 h-4" />
                                  </button>
                               )}
                            </div>
                         </div>
                      </WarmCard>
                   ))}
                   
                   {colOrders.length === 0 && (
                      <div className="h-32 border-2 border-dashed border-[#E7DCC7] rounded-xl flex flex-col gap-2 items-center justify-center text-[#8B7355] opacity-50">
                         <div className="p-2 bg-[#FAF7F2] rounded-full"><Package className="w-6 h-6" /></div>
                         <span className="text-xs font-bold">Tellimused puuduvad</span>
                      </div>
                   )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Order Details Slide-over */}
      {selectedOrder && (
        <>
          <div className="fixed inset-0 bg-[#2D2721]/20 backdrop-blur-sm z-40 transition-opacity" onClick={() => setSelectedOrder(null)} />
          <div className="fixed top-0 right-0 h-full w-full sm:w-[450px] bg-white shadow-2xl z-50 animate-in slide-in-from-right duration-300 flex flex-col border-l border-[#E7DCC7]">
             
             {/* Header */}
             <div className="h-20 flex items-center justify-between px-6 border-b border-[#E7DCC7] bg-[#FAF7F2]/50">
                <div>
                   <div className="flex items-center gap-2">
                      <h2 className="text-xl font-bold text-[#2D2721]">{selectedOrder.id}</h2>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-bold uppercase ${selectedOrder.type === 'rental' ? 'bg-[#3E352F] text-[#E17B5C]' : 'bg-[#FFF9ED] text-[#FFC857]'}`}>
                         {selectedOrder.type}
                      </span>
                   </div>
                   <div className="text-xs text-[#8B7355] mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Tellitud: {selectedOrder.date}
                   </div>
                </div>
                <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-[#E7DCC7] rounded-full text-[#6B5744]">
                   <X className="w-5 h-5" />
                </button>
             </div>

             {/* Content */}
             <div className="flex-1 overflow-y-auto p-6 space-y-8">
                
                {/* Status & Actions */}
                <div className="grid grid-cols-2 gap-3">
                   <WarmButton 
                      variant="outline" 
                      onClick={() => updatePaymentStatus(selectedOrder.paymentStatus === 'paid' ? 'pending' : 'paid')}
                      className={`justify-center w-full ${selectedOrder.paymentStatus === 'paid' ? 'text-[#00D098] border-[#00D098]/30 bg-[#E6F4EA]/50' : 'text-[#E17B5C] border-[#E17B5C]/30'}`}
                   >
                      <CreditCard className="w-4 h-4 mr-2" />
                      {selectedOrder.paymentStatus === 'paid' ? 'Tasutud' : 'MÃ¤rgi tasutuks'}
                   </WarmButton>
                   <WarmButton variant="outline" className="justify-center w-full">
                      <Printer className="w-4 h-4 mr-2" /> Saateleht
                   </WarmButton>
                </div>

                {/* Customer Info */}
                <div>
                   <h3 className="text-sm font-bold text-[#8B7355] uppercase tracking-wider mb-4 flex items-center gap-2">
                      <User className="w-4 h-4" /> Klient
                   </h3>
                   <div className="bg-[#FAF7F2] rounded-xl p-4 space-y-3 border border-[#E7DCC7]/50">
                      <div className="flex justify-between items-center">
                         <span className="font-bold text-[#2D2721] text-lg">{selectedOrder.customer}</span>
                         <span className="text-xs bg-white px-2 py-1 rounded border border-[#E7DCC7]">Eraklient</span>
                      </div>
                      <div className="space-y-2 pt-2 border-t border-[#E7DCC7]/50">
                         <div className="flex items-center gap-3 text-sm text-[#6B5744]">
                            <Mail className="w-4 h-4 text-[#8B7355]" /> {selectedOrder.email}
                         </div>
                         <div className="flex items-center gap-3 text-sm text-[#6B5744]">
                            <Phone className="w-4 h-4 text-[#8B7355]" /> {selectedOrder.phone}
                         </div>
                      </div>
                      <div className="pt-2 flex gap-2">
                         <button className="flex-1 py-1.5 text-xs font-bold text-[#2D2721] bg-white border border-[#E7DCC7] rounded hover:bg-[#FFC857] hover:border-[#FFC857] transition-colors">Saada e-mail</button>
                         <button className="flex-1 py-1.5 text-xs font-bold text-[#2D2721] bg-white border border-[#E7DCC7] rounded hover:bg-[#E17B5C] hover:text-white hover:border-[#E17B5C] transition-colors">Helista</button>
                      </div>
                   </div>
                </div>

                {/* Items */}
                <div>
                   <h3 className="text-sm font-bold text-[#8B7355] uppercase tracking-wider mb-4 flex items-center gap-2">
                      <Package className="w-4 h-4" /> Tooted
                   </h3>
                   <div className="space-y-3">
                      {selectedOrder.items.map((item, i) => (
                         <div key={i} className="flex justify-between items-center p-3 bg-white border border-[#E7DCC7] rounded-xl">
                            <div className="flex items-center gap-3">
                               <div className="w-10 h-10 bg-[#FAF7F2] rounded-lg flex items-center justify-center text-[#8B7355] font-bold">
                                  {item.qty}x
                               </div>
                               <div>
                                  <div className="font-bold text-[#2D2721]">{item.name}</div>
                                  <div className="text-xs text-[#8B7355]">{item.price.toFixed(2)}â‚¬ / tk</div>
                               </div>
                            </div>
                            <div className="font-bold text-[#2D2721]">{(item.qty * item.price).toFixed(2)}â‚¬</div>
                         </div>
                      ))}
                      <div className="flex justify-between items-center p-4 bg-[#2D2721] text-white rounded-xl shadow-lg mt-4">
                         <span className="font-bold">Kokku</span>
                         <span className="text-xl font-bold text-[#FFC857]">{selectedOrder.total.toFixed(2)}â‚¬</span>
                      </div>
                   </div>
                </div>

                {/* Notes */}
                {selectedOrder.note && (
                   <div>
                      <h3 className="text-sm font-bold text-[#8B7355] uppercase tracking-wider mb-2">MÃ¤rkmed</h3>
                      <div className="bg-[#FFF9ED] text-[#6B5744] p-4 rounded-xl text-sm italic border border-[#FFC857]/30">
                         "{selectedOrder.note}"
                      </div>
                   </div>
                )}
             </div>

             {/* Footer Actions */}
             <div className="p-6 border-t border-[#E7DCC7] bg-[#FAF7F2]/50">
                <WarmButton className="w-full justify-center bg-[#2D2721] text-white hover:bg-[#E17B5C]">
                   Salvesta muudatused
                </WarmButton>
             </div>
          </div>
        </>
      )}
    </div>
  );
}
