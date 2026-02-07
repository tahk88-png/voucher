import { useState } from 'react';
import { WarmCard } from '@/figma/app/components/WarmCard';
import { WarmButton } from '@/figma/app/components/WarmButton';
import { Input } from '@/figma/app/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/figma/app/components/ui/tabs';
import { 
  Box, 
  ClipboardList, 
  Search, 
  AlertTriangle, 
  CheckCircle2, 
  Package, 
  Truck, 
  RotateCcw,
  QrCode,
  CalendarDays,
  Wrench,
  ArrowRight,
  MoreHorizontal,
  MapPin,
  Filter,
  Plus,
  Minus,
  History,
  PackageCheck,
  Download,
  Printer
} from 'lucide-react';
import { InventoryService, StockStatus, RentalStatus, OrderStatus } from '@/figma/services/inventoryService';
import { toast } from 'sonner';

// MOCK locations
const LOCATIONS = [
  { id: 'all', name: 'Kõik asukohad' },
  { id: 'loc1', name: 'Tallinna Pealadu' },
  { id: 'loc2', name: 'Tartu Esindus' },
  { id: 'loc3', name: 'Suveladu Pärnus' },
];

export function WarehousePage() {
  const [shopItems, setShopItems] = useState(InventoryService.getShopInventory());
  const [rentalItems, setRentalItems] = useState(InventoryService.getRentalInventory());
  // Mock orders for logistics tab
  const [orders, setOrders] = useState([
    { id: 'ORD-3921', customer: 'Mari Tamm', items: 2, status: 'new', destination: 'Pärnu mnt 10, Tallinn', type: 'delivery' },
    { id: 'ORD-3920', customer: 'Peeter Oja', items: 1, status: 'processing', destination: 'Tartu Esindus', type: 'pickup' },
    { id: 'ORD-3919', customer: 'Kanal 2', items: 6, status: 'new', destination: 'Järvevana tee 9', type: 'delivery' }
  ]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('all');

  // Helpers
  const getRentalStatusBadge = (status: RentalStatus) => {
    switch(status) {
      case 'available': return <span className="px-2 py-1 bg-[#E6F4EA] text-[#00D098] rounded-md text-xs font-bold uppercase inline-flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Saadaval</span>;
      case 'rented': return <span className="px-2 py-1 bg-[#FFF9ED] text-[#E17B5C] rounded-md text-xs font-bold uppercase inline-flex items-center gap-1"><Truck className="w-3 h-3" /> Väljas</span>;
      case 'maintenance': return <span className="px-2 py-1 bg-[#F2EDE3] text-[#8B7355] rounded-md text-xs font-bold uppercase inline-flex items-center gap-1"><Wrench className="w-3 h-3" /> Hoolduses</span>;
      default: return null;
    }
  };

  // Actions
  const handleStockUpdate = (id: string, delta: number) => {
    const updated = InventoryService.updateStock(id, delta);
    setShopItems([...updated]);
    const item = shopItems.find(i => i.id === id);
    if (item) {
       const newQty = item.quantity + delta;
       toast.success(`${item.name}: Uus kogus ${newQty}tk`);
    }
  };

  const fulfillOrder = (id: string) => {
     setOrders(orders.map(o => o.id === id ? { ...o, status: 'ready' } : o));
     toast.success('Tellimus pakitud ja valmis!');
  };

  const getStockForLocation = (item: any, locationId: string) => {
    if (locationId === 'all') return item.quantity;
    if (locationId === 'loc1') return Math.floor(item.quantity * 0.6);
    if (locationId === 'loc2') return Math.floor(item.quantity * 0.3);
    return Math.floor(item.quantity * 0.1);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#2D2721]">Ladu & Logistika</h2>
          <p className="text-[#6B5744]">Halda laoseise, rendivara ja tellimuste täitmist</p>
        </div>
        
        {/* Quick Scan Bar & Location Selector */}
        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          
          <div className="relative">
             <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8B7355]" />
             <select 
               className="h-10 pl-9 pr-8 bg-white border border-[#E7DCC7] rounded-lg text-sm font-bold text-[#2D2721] focus:ring-2 focus:ring-[#FFC857] outline-none appearance-none cursor-pointer min-w-[180px] shadow-sm"
               value={selectedLocation}
               onChange={(e) => {
                 setSelectedLocation(e.target.value);
                 toast.info(`Filtreeritud: ${LOCATIONS.find(l => l.id === e.target.value)?.name}`);
               }}
             >
               {LOCATIONS.map(loc => (
                 <option key={loc.id} value={loc.id}>{loc.name}</option>
               ))}
             </select>
             <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
               <svg className="w-4 h-4 text-[#8B7355]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
             </div>
          </div>

          <div className="relative flex-1 lg:w-64">
            <QrCode className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8B7355]" />
            <Input 
              placeholder="Skaneeri toode..." 
              className="pl-9 bg-white border-[#E7DCC7] shadow-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <WarmButton className="shadow-lg shadow-[#FFC857]/20">
             <Plus className="w-4 h-4 mr-2" /> Võta arvele
          </WarmButton>
        </div>
      </div>

      <Tabs defaultValue="shop" className="space-y-6">
        <TabsList className="bg-white p-1 border border-[#E7DCC7] inline-flex rounded-xl h-auto w-full lg:w-auto overflow-x-auto shadow-sm">
          <TabsTrigger value="shop" className="px-6 py-2.5 rounded-lg data-[state=active]:bg-[#FFC857] data-[state=active]:text-[#2D2721] data-[state=active]:font-bold transition-all flex gap-2">
            <Box className="w-4 h-4" /> E-poe Ladu
          </TabsTrigger>
          <TabsTrigger value="rental" className="px-6 py-2.5 rounded-lg data-[state=active]:bg-[#FFC857] data-[state=active]:text-[#2D2721] data-[state=active]:font-bold transition-all flex gap-2">
            <CalendarDays className="w-4 h-4" /> Rendivara
          </TabsTrigger>
          <TabsTrigger value="logistics" className="px-6 py-2.5 rounded-lg data-[state=active]:bg-[#FFC857] data-[state=active]:text-[#2D2721] data-[state=active]:font-bold transition-all flex gap-2">
             <div className="relative">
                <ClipboardList className="w-4 h-4" />
                {orders.filter(o => o.status === 'new').length > 0 && <span className="absolute -top-1 -right-1 w-2 h-2 bg-[#E17B5C] rounded-full animate-pulse"></span>}
             </div>
             Logistika & Pakkimine
          </TabsTrigger>
        </TabsList>

        {/* --- SHOP INVENTORY TAB --- */}
        <TabsContent value="shop" className="space-y-4 animate-in slide-in-from-bottom-2">
          <WarmCard padding="none" className="bg-white overflow-hidden border border-[#E7DCC7]">
            <table className="w-full">
              <thead>
                <tr className="bg-[#FAF7F2] border-b border-[#E7DCC7]">
                  <th className="text-left p-4 text-xs font-bold text-[#8B7355] uppercase">Toode</th>
                  <th className="text-left p-4 text-xs font-bold text-[#8B7355] uppercase">SKU / Asukoht</th>
                  <th className="text-center p-4 text-xs font-bold text-[#8B7355] uppercase">
                    {selectedLocation === 'all' ? 'Kogus kokku' : 'Kogus laos'}
                  </th>
                  <th className="text-right p-4 text-xs font-bold text-[#8B7355] uppercase">Kiirmuutmine</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E7DCC7]/30">
                {shopItems.filter(i => i.name.toLowerCase().includes(searchQuery.toLowerCase())).map((item) => {
                  const currentStock = getStockForLocation(item, selectedLocation);
                  return (
                    <tr key={item.id} className="hover:bg-[#FFF9ED] transition-colors group">
                      <td className="p-4">
                        <div className="font-bold text-[#2D2721] text-base">{item.name}</div>
                        {currentStock <= 5 && (
                          <div className="flex items-center gap-1 text-xs text-[#E17B5C] font-bold mt-1 animate-pulse">
                            <AlertTriangle className="w-3 h-3" /> Madal seis {selectedLocation !== 'all' ? 'siin laos' : ''}
                          </div>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="font-mono text-sm text-[#2D2721] bg-[#FAF7F2] inline-block px-1.5 rounded">{item.sku}</div>
                        <div className="text-xs text-[#8B7355] flex items-center gap-1 mt-1">
                           <MapPin className="w-3 h-3" />
                           {selectedLocation === 'all' ? '3 asukohta' : LOCATIONS.find(l => l.id === selectedLocation)?.name}
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <div className={`inline-flex items-center px-3 py-1 rounded-full text-base font-bold ${currentStock <= 5 ? 'bg-[#FFF9ED] text-[#E17B5C] border border-[#E17B5C]' : 'bg-[#FAF7F2] text-[#2D2721]'}`}>
                          {currentStock} tk
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => handleStockUpdate(item.id, -1)}
                            className="p-1.5 bg-[#FAF7F2] hover:bg-[#E17B5C] hover:text-white rounded-lg transition-colors"
                            title="Vähenda"
                          >
                             <Minus className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleStockUpdate(item.id, 1)}
                            className="p-1.5 bg-[#FAF7F2] hover:bg-[#00D098] hover:text-white rounded-lg transition-colors"
                            title="Suurenda"
                          >
                             <Plus className="w-4 h-4" />
                          </button>
                          <div className="w-px h-6 bg-[#E7DCC7] mx-1"></div>
                          <button className="p-1.5 hover:bg-[#FAF7F2] rounded-lg text-[#6B5744]" title="Ajalugu">
                             <History className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </WarmCard>
        </TabsContent>

        {/* --- RENTAL ASSETS TAB --- */}
        <TabsContent value="rental" className="space-y-6 animate-in slide-in-from-bottom-2">
           {/* If specific location selected, show only items there */}
           {selectedLocation !== 'all' && (
             <div className="bg-[#FFF9ED] border border-[#FFC857] p-3 rounded-xl flex items-center gap-2 text-sm text-[#6B5744] mb-4">
                <MapPin className="w-4 h-4 text-[#FFC857]" />
                Näitan rendivara asukohas: <strong>{LOCATIONS.find(l => l.id === selectedLocation)?.name}</strong>
             </div>
           )}

           <div className="grid grid-cols-1 gap-6">
            {rentalItems.map((item) => (
              <WarmCard key={item.id} padding="md" className="bg-white border border-[#E7DCC7]">
                <div className="flex items-start justify-between mb-4 pb-4 border-b border-[#E7DCC7]/50">
                  <div className="flex gap-4 items-center">
                    <div className="w-12 h-12 bg-[#3E352F] rounded-lg flex items-center justify-center text-[#E17B5C]">
                       <CalendarDays className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-[#2D2721]">{item.title}</h3>
                      <p className="text-sm text-[#6B5744]">{item.category}</p>
                    </div>
                  </div>
                  <div className="text-xs font-mono bg-[#FAF7F2] px-2 py-1 rounded border border-[#E7DCC7]">
                     {selectedLocation === 'all' ? 'TALLINN / TARTU' : LOCATIONS.find(l => l.id === selectedLocation)?.name.toUpperCase().split(' ')[0]}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="grid grid-cols-12 gap-4 px-2 py-1 text-xs font-bold text-[#8B7355] uppercase tracking-wide">
                    <div className="col-span-3">Seerianumber</div>
                    <div className="col-span-3">Staatus</div>
                    <div className="col-span-3">Asukoht</div>
                    <div className="col-span-3 text-right">Tegevus</div>
                  </div>
                  
                  {item.assets.map((asset) => (
                    <div key={asset.id} className="grid grid-cols-12 gap-4 items-center p-3 rounded-xl hover:bg-[#FAF7F2] transition-colors border border-transparent hover:border-[#E7DCC7] group">
                      <div className="col-span-3 font-mono text-sm font-bold text-[#2D2721]">{asset.serialNumber}</div>
                      <div className="col-span-3">
                        {getRentalStatusBadge(asset.status)}
                      </div>
                      <div className="col-span-3 text-sm text-[#6B5744] flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-[#8B7355]" />
                        {selectedLocation === 'loc2' ? 'Tartu' : 'Tallinn'} 
                      </div>
                      <div className="col-span-3 text-right flex justify-end gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                         {asset.status === 'available' && (
                            <button className="text-xs bg-[#2D2721] text-white px-2 py-1 rounded hover:bg-[#E17B5C] transition-colors">
                               Hooldusesse
                            </button>
                         )}
                         {asset.status === 'maintenance' && (
                            <button className="text-xs bg-[#00D098] text-white px-2 py-1 rounded hover:bg-[#00B080] transition-colors">
                               Valmis
                            </button>
                         )}
                         <button className="p-1 hover:bg-[#E7DCC7] rounded text-[#6B5744]" title="Ajalugu">
                            <History className="w-4 h-4" />
                         </button>
                      </div>
                    </div>
                  ))}
                </div>
              </WarmCard>
            ))}
          </div>
        </TabsContent>

        {/* --- LOGISTICS TAB --- */}
        <TabsContent value="logistics" className="space-y-4 animate-in slide-in-from-bottom-2">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Ready to Pack */}
              <div className="md:col-span-2 space-y-4">
                 <h3 className="text-lg font-bold text-[#2D2721] flex items-center gap-2">
                    <Package className="w-5 h-5 text-[#E17B5C]" /> Pakkimist vajavad ({orders.filter(o => o.status === 'new').length})
                 </h3>
                 
                 {orders.filter(o => o.status === 'new').length === 0 ? (
                    <div className="p-8 border-2 border-dashed border-[#E7DCC7] rounded-xl text-center text-[#8B7355]">
                       Kõik tellimused on pakitud! 🎉
                    </div>
                 ) : (
                    <div className="space-y-3">
                       {orders.filter(o => o.status === 'new').map(order => (
                          <WarmCard key={order.id} padding="md" className="bg-white border border-[#E7DCC7] hover:border-[#FFC857] transition-all">
                             <div className="flex justify-between items-start">
                                <div>
                                   <div className="flex items-center gap-2 mb-1">
                                      <span className="font-bold text-[#2D2721] text-lg">{order.customer}</span>
                                      <span className="bg-[#FFF9ED] text-[#E17B5C] text-xs px-2 py-0.5 rounded font-bold border border-[#E17B5C]/20">{order.id}</span>
                                   </div>
                                   <div className="text-sm text-[#6B5744] flex items-center gap-1">
                                      {order.type === 'delivery' ? <Truck className="w-3 h-3" /> : <MapPin className="w-3 h-3" />}
                                      {order.destination}
                                   </div>
                                   <div className="mt-3 flex gap-2">
                                      <span className="text-xs bg-[#FAF7F2] px-2 py-1 rounded text-[#8B7355] border border-[#E7DCC7]">
                                         {order.items} toodet
                                      </span>
                                   </div>
                                </div>
                                <div className="flex flex-col gap-2">
                                   <WarmButton size="sm" onClick={() => fulfillOrder(order.id)} className="gap-1 shadow-md shadow-[#00D098]/20 bg-[#00D098] hover:bg-[#00B080] border-none text-white">
                                      <PackageCheck className="w-4 h-4" /> Märgi pakituks
                                   </WarmButton>
                                   <WarmButton size="sm" variant="outline" className="gap-1">
                                      <Printer className="w-4 h-4" /> Silt
                                   </WarmButton>
                                </div>
                             </div>
                          </WarmCard>
                       ))}
                    </div>
                 )}
              </div>

              {/* Summary Stats */}
              <div className="space-y-4">
                 <WarmCard padding="lg" className="bg-[#2D2721] text-[#E7DCC7]">
                    <h3 className="font-bold text-white mb-4">Logistika ülevaade</h3>
                    <div className="space-y-4">
                       <div className="flex justify-between items-center">
                          <span className="text-sm">Täna pakitud</span>
                          <span className="font-bold text-[#00D098] text-xl">12</span>
                       </div>
                       <div className="w-full bg-[#3E352F] h-px"></div>
                       <div className="flex justify-between items-center">
                          <span className="text-sm">Ootel kullerid</span>
                          <span className="font-bold text-[#FFC857] text-xl">2</span>
                       </div>
                       <div className="w-full bg-[#3E352F] h-px"></div>
                       <div className="flex justify-between items-center">
                          <span className="text-sm">Probleemsed</span>
                          <span className="font-bold text-[#E17B5C] text-xl">0</span>
                       </div>
                    </div>
                    <div className="mt-6 pt-6 border-t border-[#3E352F]">
                       <button className="w-full py-2 bg-[#3E352F] rounded-lg text-sm font-bold hover:bg-[#E17B5C] transition-colors flex items-center justify-center gap-2">
                          <Download className="w-4 h-4" /> Lae raport
                       </button>
                    </div>
                 </WarmCard>
              </div>

           </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}