import { useState } from 'react';
import { WarmCard } from '@app/components/WarmCard';
import { WarmButton } from '@app/components/WarmButton';
import { Input } from '@app/components/ui/input';
import { Label } from '@app/components/ui/label';
import { 
  Truck, 
  MapPin, 
  Package, 
  Box,
  Globe,
  Check,
  Plus,
  Store,
  Building2,
  Trash2
} from 'lucide-react';

// Mock data for locations
const INITIAL_LOCATIONS = [
  { id: 'loc1', name: 'Tallinna Pealadu', address: 'Pärnu mnt 123, Tallinn', type: 'warehouse', default: true },
  { id: 'loc2', name: 'Tartu Esindus', address: 'Riia 10, Tartu', type: 'store', default: false },
  { id: 'loc3', name: 'Suveladu Pärnus', address: 'Ranna pst 1, Pärnu', type: 'seasonal', default: false },
];

export function LogisticsManager() {
  const [activeMethod, setActiveMethod] = useState<string | null>('pickup');
  const [locations, setLocations] = useState(INITIAL_LOCATIONS);

  const handleRemoveLocation = (id: string) => {
    setLocations(locations.filter(l => l.id !== id));
  };

  return (
    <div className="h-full flex flex-col space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-[#2D2721] mb-2">Tarne ja Asukohad</h2>
          <p className="text-[#6B5744]">Halda ladusid, poode ja tarneviise.</p>
        </div>
        <WarmButton variant="outline" className="gap-2 self-start md:self-auto">
           <Globe className="w-4 h-4" /> Tarne tsoonid
        </WarmButton>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left Column: Delivery Methods List */}
        <div className="space-y-4">
          <h3 className="font-bold text-[#2D2721] mb-4 px-1">Seadistatavad moodulid</h3>
          
          <div 
            onClick={() => setActiveMethod('pickup')}
            className={`group p-5 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
              activeMethod === 'pickup' 
                ? 'bg-[#FFF9ED] border-[#FFC857] shadow-md' 
                : 'bg-white border-[#E7DCC7] hover:border-[#FFC857] hover:shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
               <div className="flex items-center gap-4">
                 <div className={`p-2.5 rounded-lg transition-colors ${activeMethod === 'pickup' ? 'bg-[#FFC857] text-[#2D2721]' : 'bg-[#FAF7F2] text-[#2D2721] group-hover:bg-[#FFF9ED]'}`}>
                   <Store className="w-5 h-5" />
                 </div>
                 <span className="font-bold text-[#2D2721] text-lg">Asukohad & Laod</span>
               </div>
               {activeMethod === 'pickup' && <div className="w-2 h-2 rounded-full bg-[#00D098]"></div>}
            </div>
            <p className="text-sm text-[#6B5744] pl-[54px] leading-relaxed">
              Halda füüsilisi poode ja ladusid, kus kaup asub või väljastatakse.
            </p>
          </div>

          <div 
            onClick={() => setActiveMethod('parcel')}
            className={`group p-5 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
              activeMethod === 'parcel' 
                ? 'bg-[#FFF9ED] border-[#FFC857] shadow-md' 
                : 'bg-white border-[#E7DCC7] hover:border-[#FFC857] hover:shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
               <div className="flex items-center gap-4">
                 <div className={`p-2.5 rounded-lg transition-colors ${activeMethod === 'parcel' ? 'bg-[#FFC857] text-[#2D2721]' : 'bg-[#FAF7F2] text-[#2D2721] group-hover:bg-[#FFF9ED]'}`}>
                   <Box className="w-5 h-5" />
                 </div>
                 <span className="font-bold text-[#2D2721] text-lg">Pakiautomaadid</span>
               </div>
               {activeMethod === 'parcel' && <div className="w-2 h-2 rounded-full bg-[#00D098]"></div>}
            </div>
            <p className="text-sm text-[#6B5744] pl-[54px] leading-relaxed">
              Omniva, Smartpost, DPD liidestused.
            </p>
          </div>

          <div 
            onClick={() => setActiveMethod('courier')}
            className={`group p-5 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
              activeMethod === 'courier' 
                ? 'bg-[#FFF9ED] border-[#FFC857] shadow-md' 
                : 'bg-white border-[#E7DCC7] hover:border-[#FFC857] hover:shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
               <div className="flex items-center gap-4">
                 <div className={`p-2.5 rounded-lg transition-colors ${activeMethod === 'courier' ? 'bg-[#FFC857] text-[#2D2721]' : 'bg-[#FAF7F2] text-[#2D2721] group-hover:bg-[#FFF9ED]'}`}>
                   <Truck className="w-5 h-5" />
                 </div>
                 <span className="font-bold text-[#2D2721] text-lg">Kuller</span>
               </div>
               <div className="w-2 h-2 rounded-full bg-gray-300"></div>
            </div>
            <p className="text-sm text-[#6B5744] pl-[54px] leading-relaxed">
              Cargobus, Venipak. Suuregabariidilised kaubad.
            </p>
          </div>

        </div>

        {/* Right Column: Settings Area */}
        <div className="lg:col-span-2">
          <WarmCard padding="lg" className="bg-white min-h-[600px] shadow-sm border-[#E7DCC7]">
            
            {activeMethod === 'pickup' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                 <div className="flex items-center gap-6 mb-8 border-b border-[#FAF7F2] pb-8">
                     <div className="w-16 h-16 bg-[#FFF9ED] rounded-2xl flex items-center justify-center text-[#FFC857] shadow-sm border border-[#FFC857]/20">
                       <MapPin className="w-8 h-8" />
                     </div>
                     <div>
                       <h3 className="font-bold text-2xl text-[#2D2721] mb-1">Aktiivsed asukohad</h3>
                       <p className="text-[#6B5744]">Need punktid on nähtavad e-poes ja laohalduses</p>
                     </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {locations.map((loc) => (
                      <div key={loc.id} className={`border-2 rounded-2xl p-6 relative shadow-sm group transition-all ${loc.default ? 'border-[#FFC857] bg-[#FFF9ED]' : 'border-[#E7DCC7] bg-white hover:border-[#8B7355]'}`}>
                         {loc.default && (
                           <div className="absolute top-4 right-4 flex items-center gap-2">
                             <span className="text-xs font-bold text-[#00D098] bg-[#E6F4EA] px-2 py-1 rounded-full flex items-center gap-1">
                               <Check className="w-3 h-3" /> Põhiladu
                             </span>
                           </div>
                         )}
                         
                         <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mb-4 shadow-sm text-[#2D2721] border border-[#E7DCC7]/30">
                            {loc.type === 'warehouse' ? <Building2 className="w-6 h-6" /> : <Store className="w-6 h-6" />}
                         </div>

                         <h4 className="font-bold text-xl text-[#2D2721] mb-2">{loc.name}</h4>
                         <div className="space-y-1 text-[#6B5744] mb-6 text-sm">
                           <p className="flex items-center gap-2"><MapPin className="w-4 h-4 opacity-50" /> {loc.address}</p>
                           <p className="flex items-center gap-2 pl-6 opacity-70">
                             {loc.type === 'warehouse' ? 'Ainult ladu / väljastus' : 'Kauplus ja ladu'}
                           </p>
                         </div>
                         
                         <div className="flex gap-3">
                           <WarmButton size="sm" className="w-full">Muuda</WarmButton>
                           {!loc.default && (
                             <WarmButton size="sm" variant="outline" className="w-full hover:bg-red-50 hover:text-red-500 hover:border-red-200" onClick={() => handleRemoveLocation(loc.id)}>
                               <Trash2 className="w-4 h-4" />
                             </WarmButton>
                           )}
                         </div>
                      </div>
                    ))}

                    {/* Add New Button */}
                    <div className="border-2 border-dashed border-[#E7DCC7] rounded-2xl p-6 flex flex-col items-center justify-center text-center hover:border-[#8B7355] hover:bg-[#FAF7F2] transition-all cursor-pointer group min-h-[250px]">
                       <div className="w-16 h-16 bg-[#FAF7F2] rounded-full flex items-center justify-center text-[#8B7355] mb-4 group-hover:bg-white group-hover:shadow-md transition-all">
                          <Plus className="w-8 h-8" />
                       </div>
                       <h4 className="font-bold text-[#2D2721] mb-1">Lisa uus asukoht</h4>
                       <p className="text-sm text-[#6B5744] max-w-[200px]">
                         Laienda tegevust uue poe või laoga.
                       </p>
                    </div>
                 </div>
              </div>
            )}

            {activeMethod === 'parcel' && (
               <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-70">
                  <Box className="w-16 h-16 text-[#E7DCC7]" />
                  <p>Pakiautomaatide seaded on siin...</p>
               </div>
            )}
            
            {activeMethod === 'courier' && (
               <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-70">
                  <Truck className="w-16 h-16 text-[#E7DCC7]" />
                  <p>Kullerteenuste seaded on siin...</p>
               </div>
            )}

          </WarmCard>
        </div>
      </div>
    </div>
  );
}