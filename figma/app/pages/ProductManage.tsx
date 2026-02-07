import { useState } from 'react';
import { WarmCard } from '@app/components/WarmCard';
import { WarmButton } from '@app/components/WarmButton';
import { Input } from '@app/components/ui/input';
import { Label } from '@app/components/ui/label';
import { Textarea } from '@app/components/ui/textarea';
import { Switch } from '@app/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@app/components/ui/tabs';
import { ImageWithFallback } from '@app/components/figma/ImageWithFallback';
import { 
  Package, 
  Euro, 
  Layers, 
  Search, 
  Image as ImageIcon, 
  Plus, 
  Trash2, 
  Globe,
  Tag,
  BarChart,
  Save,
  ArrowLeft,
  LayoutGrid,
  List as ListIcon,
  AlertCircle,
  Box,
  MapPin,
  Building2
} from 'lucide-react';
import { PRODUCTS } from '@services/unifiedData';
import { toast } from 'sonner';

export function ProductManage() {
  const [activeProduct, setActiveProduct] = useState<string | null>(null);
  const [products, setProducts] = useState(PRODUCTS);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list'); 
  const [loading, setLoading] = useState(false);

  // Mock data enhancement
  const enrichedProducts = products.map(p => ({
    ...p,
    stock: Math.floor(Math.random() * 50),
    variants: ['S', 'M', 'L'],
    sku: `PROD-${p.id.substring(0, 4).toUpperCase()}`
  }));

  const handleSave = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success('Toote andmed salvestatud!');
      setActiveProduct(null);
    }, 1000);
  };

  // --- EDIT VIEW ---
  if (activeProduct) {
    return (
      <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
        <div className="flex items-center justify-between">
           <button onClick={() => setActiveProduct(null)} className="flex items-center text-[#6B5744] hover:text-[#2D2721]">
             <ArrowLeft className="w-4 h-4 mr-2" /> Tagasi nimekirja
           </button>
           <div className="flex gap-2">
             <WarmButton variant="secondary">Eelvaade</WarmButton>
             <WarmButton onClick={handleSave} disabled={loading}>
               {loading ? 'Salvestamine...' : 'Salvesta muudatused'}
             </WarmButton>
           </div>
        </div>

        <Tabs defaultValue="inventory" className="w-full">
          <TabsList className="w-full justify-start bg-white p-1 border border-[#E7DCC7] rounded-xl overflow-x-auto">
            <TabsTrigger value="general" className="gap-2"><Package className="w-4 h-4" /> Üldine</TabsTrigger>
            <TabsTrigger value="pricing" className="gap-2"><Euro className="w-4 h-4" /> Hinnad</TabsTrigger>
            <TabsTrigger value="inventory" className="gap-2"><Box className="w-4 h-4" /> Ladu & Asukohad</TabsTrigger>
            <TabsTrigger value="seo" className="gap-2"><Search className="w-4 h-4" /> SEO</TabsTrigger>
          </TabsList>

          {/* GENERAL TAB */}
          <TabsContent value="general" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <WarmCard padding="lg" className="bg-white">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Toote nimi</Label>
                      <Input defaultValue="Sony A7 III Kaamera" className="text-lg font-bold" />
                    </div>
                    <div className="space-y-2">
                      <Label>Kirjeldus</Label>
                      <Textarea className="min-h-[150px]" placeholder="Kirjelda toodet põhjalikult..." />
                    </div>
                  </div>
                </WarmCard>
              </div>
              <div className="space-y-6">
                <WarmCard padding="md" className="bg-white">
                   <Label className="mb-4 block">Meedia</Label>
                   <div className="aspect-square bg-gray-100 rounded-lg border-2 border-[#00D098] relative flex items-center justify-center text-[#00D098]">
                      <ImageIcon className="w-8 h-8" />
                   </div>
                </WarmCard>
              </div>
            </div>
          </TabsContent>

          {/* PRICING TAB */}
          <TabsContent value="pricing" className="space-y-6 mt-6">
             <WarmCard padding="lg" className="bg-white">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-2">
                   <Label>Müügihind (€)</Label>
                   <Input type="number" defaultValue="1999.00" className="text-lg" />
                 </div>
               </div>
             </WarmCard>
          </TabsContent>

          {/* INVENTORY & LOCATIONS TAB - ENHANCED */}
          <TabsContent value="inventory" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
               {/* Left: Global SKU Settings */}
               <div className="lg:col-span-2 space-y-6">
                  <WarmCard padding="lg" className="bg-white">
                     <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold text-[#2D2721] flex items-center gap-2">
                           <Box className="w-5 h-5" /> Laoseis asukohtade lõikes
                        </h3>
                        <div className="text-sm font-bold text-[#00D098] bg-[#E6F4EA] px-3 py-1 rounded-full">
                           KOKKU: 28 tk
                        </div>
                     </div>

                     <div className="space-y-4">
                        {/* Location 1 */}
                        <div className="flex items-center gap-4 p-4 border border-[#E7DCC7] rounded-xl bg-[#FAF7F2]">
                           <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-[#2D2721] border border-[#E7DCC7]">
                              <Building2 className="w-5 h-5" />
                           </div>
                           <div className="flex-1">
                              <div className="font-bold text-[#2D2721]">Tallinna Pealadu</div>
                              <div className="text-xs text-[#6B5744]">Pärnu mnt 123</div>
                           </div>
                           <div className="text-right">
                              <Label className="text-xs mb-1 block text-[#8B7355]">Kogus</Label>
                              <Input type="number" className="w-20 bg-white text-center font-bold" defaultValue="15" />
                           </div>
                        </div>

                        {/* Location 2 */}
                        <div className="flex items-center gap-4 p-4 border border-[#E7DCC7] rounded-xl bg-white">
                           <div className="w-10 h-10 bg-[#FFF9ED] rounded-lg flex items-center justify-center text-[#FFC857] border border-[#FFC857]/20">
                              <Store className="w-5 h-5" />
                           </div>
                           <div className="flex-1">
                              <div className="font-bold text-[#2D2721]">Tartu Esindus</div>
                              <div className="text-xs text-[#6B5744]">Riia 10</div>
                           </div>
                           <div className="text-right">
                              <Label className="text-xs mb-1 block text-[#8B7355]">Kogus</Label>
                              <Input type="number" className="w-20 bg-white text-center font-bold" defaultValue="8" />
                           </div>
                        </div>

                         {/* Location 3 */}
                         <div className="flex items-center gap-4 p-4 border border-[#E7DCC7] rounded-xl bg-white opacity-60">
                           <div className="w-10 h-10 bg-[#F2EDE3] rounded-lg flex items-center justify-center text-[#8B7355]">
                              <Store className="w-5 h-5" />
                           </div>
                           <div className="flex-1">
                              <div className="font-bold text-[#2D2721]">Pärnu Suveladu</div>
                              <div className="text-xs text-[#6B5744]">Suletud hooajaväliselt</div>
                           </div>
                           <div className="text-right">
                              <Label className="text-xs mb-1 block text-[#8B7355]">Kogus</Label>
                              <Input type="number" className="w-20 bg-white text-center font-bold" defaultValue="5" disabled />
                           </div>
                        </div>
                     </div>
                  </WarmCard>
               </div>

               {/* Right: Variants info */}
               <div className="space-y-6">
                  <WarmCard padding="md" className="bg-white">
                     <h4 className="font-bold mb-4 text-sm">Variatsioonid</h4>
                     <p className="text-xs text-[#6B5744] mb-4">
                        Kui kasutad variatsioone (nt suurused), jaotatakse laoseis automaatselt variantide vahel asukohapõhiselt.
                     </p>
                     <WarmButton variant="outline" className="w-full text-xs">
                        Halda variante täpsemalt
                     </WarmButton>
                  </WarmCard>
               </div>
            </div>
          </TabsContent>

        </Tabs>
      </div>
    );
  }

  // --- LIST / GRID VIEW ---
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#2D2721]">Tooted</h2>
          <p className="text-[#6B5744]">Halda hindu, laoseisu ja tootevalikut</p>
        </div>
        <div className="flex gap-3">
          <div className="bg-white p-1 rounded-lg border border-[#E7DCC7] flex items-center">
             <button 
               onClick={() => setViewMode('list')}
               className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-[#FAF7F2] text-[#2D2721] shadow-sm' : 'text-[#8B7355] hover:text-[#2D2721]'}`}
             >
               <ListIcon className="w-4 h-4" />
             </button>
             <button 
               onClick={() => setViewMode('grid')}
               className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-[#FAF7F2] text-[#2D2721] shadow-sm' : 'text-[#8B7355] hover:text-[#2D2721]'}`}
             >
               <LayoutGrid className="w-4 h-4" />
             </button>
          </div>
          <WarmButton onClick={() => setActiveProduct('new')}>
            <Plus className="w-4 h-4 mr-2" /> Lisa uus
          </WarmButton>
        </div>
      </div>

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {enrichedProducts.map((product) => (
            <WarmCard key={product.id} padding="none" className="group bg-white hover:shadow-warm-lg transition-all cursor-pointer overflow-hidden">
              <div className="relative aspect-video bg-[#FAF7F2] overflow-hidden">
                <ImageWithFallback src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute top-2 right-2 bg-white/90 backdrop-blur px-2 py-1 rounded text-xs font-bold text-[#2D2721]">
                  {product.price}€
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-bold text-[#2D2721] truncate mb-1">{product.name}</h3>
                <div className="flex items-center gap-2 text-xs text-[#6B5744] mb-3">
                   <span className="bg-[#FAF7F2] px-2 py-0.5 rounded border border-[#E7DCC7]">{product.sku}</span>
                   <span>Laos: {product.stock}</span>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-[#E7DCC7]/50">
                   <div className="flex gap-1">
                     {product.variants.map(v => (
                       <span key={v} className="w-6 h-6 flex items-center justify-center bg-[#FAF7F2] rounded-full text-[10px] text-[#8B7355] border border-[#E7DCC7]">{v}</span>
                     ))}
                   </div>
                   <WarmButton size="sm" variant="outline" onClick={() => setActiveProduct(product.id)}>Muuda</WarmButton>
                </div>
              </div>
            </WarmCard>
          ))}
        </div>
      ) : (
        <WarmCard padding="none" className="bg-white overflow-hidden">
           <table className="w-full text-sm text-left">
              <thead className="bg-[#FAF7F2] text-[#8B7355] font-bold uppercase text-xs">
                 <tr>
                    <th className="p-4">Toode</th>
                    <th className="p-4">Hind</th>
                    <th className="p-4">Ladu</th>
                    <th className="p-4">Suurused</th>
                    <th className="p-4">Staatus</th>
                    <th className="p-4 text-right">Tegevused</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-[#E7DCC7]/50">
                 {enrichedProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-[#FFF9ED] transition-colors group">
                       <td className="p-4">
                          <div className="flex items-center gap-3">
                             <div className="w-10 h-10 rounded-lg bg-[#FAF7F2] overflow-hidden">
                                <ImageWithFallback src={product.image} alt={product.name} className="w-full h-full object-cover" />
                             </div>
                             <div>
                                <div className="font-bold text-[#2D2721]">{product.name}</div>
                                <div className="text-xs text-[#8B7355]">{product.sku}</div>
                             </div>
                          </div>
                       </td>
                       <td className="p-4 font-mono font-bold text-[#2D2721]">
                          {product.price}€
                       </td>
                       <td className="p-4">
                          <div className={`inline-flex items-center gap-2 px-2 py-1 rounded-md ${product.stock < 10 ? 'bg-[#FEF2F2] text-[#EF4444]' : 'bg-[#E6F4EA] text-[#00D098]'}`}>
                             <Box className="w-3 h-3" />
                             <span className="font-bold">{product.stock} tk</span>
                          </div>
                       </td>
                       <td className="p-4">
                          <div className="flex gap-1">
                             {product.variants.map(v => (
                               <span key={v} className="px-2 py-0.5 bg-white border border-[#E7DCC7] rounded text-xs text-[#6B5744]">{v}</span>
                             ))}
                          </div>
                       </td>
                       <td className="p-4">
                          <span className="px-2 py-1 bg-[#E6F4EA] text-[#00D098] rounded-full text-xs font-bold uppercase">Aktiivne</span>
                       </td>
                       <td className="p-4 text-right">
                          <WarmButton size="sm" variant="outline" onClick={() => setActiveProduct(product.id)}>
                             Muuda
                          </WarmButton>
                       </td>
                    </tr>
                 ))}
              </tbody>
           </table>
        </WarmCard>
      )}
    </div>
  );
}
// Import Store from lucide-react just in case
import { Store } from 'lucide-react';