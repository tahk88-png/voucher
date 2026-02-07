import { useState } from 'react';
import { WarmCard } from '@/app/components/WarmCard';
import { WarmButton } from '@/app/components/WarmButton';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  ShoppingBag, 
  Camera, 
  Plus, 
  Trash2, 
  Save, 
  Image as ImageIcon,
  Check,
  Calendar,
  Package,
  Layers,
  Settings2,
  Video
} from 'lucide-react';

export function ProductCreate() {
  const navigate = useNavigate();
  const [productType, setProductType] = useState<'sale' | 'rental' | null>(null);
  
  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  
  // Rental Specific
  const [deposit, setDeposit] = useState('');
  const [minDuration, setMinDuration] = useState('1');
  const [timeUnit, setTimeUnit] = useState('day'); // hour, day, week
  
  // Inventory
  const [sku, setSku] = useState('');
  const [stock, setStock] = useState('1');

  // Variations State
  const [attributes, setAttributes] = useState<{name: string, options: string[]}[]>([
    { name: 'Suurus', options: ['S', 'M', 'L'] }
  ]);
  const [variants, setVariants] = useState<{name: string, price: string, stock: string}[]>([]);

  // Step handling
  // If productType is null, show selection screen.
  // Otherwise show form.

  const handleAddAttribute = () => {
    setAttributes([...attributes, { name: '', options: [] }]);
  };

  const handleUpdateAttribute = (idx: number, field: 'name' | 'options', value: any) => {
    const newAttrs = [...attributes];
    // @ts-ignore
    newAttrs[idx][field] = value;
    setAttributes(newAttrs);
  };

  const generateVariants = () => {
    // Simple generation logic for demo
    // In a real app, this would do a cartesian product of all options
    if (attributes.length === 0) return;
    
    // Demo: Just generating based on the first attribute for simplicity in this view
    const mainAttr = attributes[0];
    const newVariants = mainAttr.options.map(opt => ({
      name: `${title} - ${opt}`,
      price: price,
      stock: stock
    }));
    setVariants(newVariants);
  };

  if (!productType) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] p-8 flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-300">
        <WarmButton 
           variant="ghost" 
           className="absolute top-8 left-8" 
           onClick={() => navigate(-1)}
        >
          <ArrowLeft className="w-5 h-5 mr-2" /> Tagasi
        </WarmButton>

        <div className="text-center mb-12 max-w-2xl">
          <h1 className="text-4xl font-bold text-[#2D2721] mb-4">Mida soovid lisada?</h1>
          <p className="text-[#6B5744] text-lg">Vali toote tüüp, et näha vastavaid seadistusi. Seda valikut ei saa hiljem muuta.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl w-full">
          {/* Sale Option */}
          <button 
            onClick={() => setProductType('sale')}
            className="group relative bg-white p-8 rounded-3xl border-2 border-[#E7DCC7] hover:border-[#FFC857] hover:shadow-xl transition-all text-left overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <ShoppingBag className="w-32 h-32 text-[#FFC857]" />
            </div>
            <div className="w-16 h-16 rounded-2xl bg-[#FFF9ED] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <ShoppingBag className="w-8 h-8 text-[#FFC857]" />
            </div>
            <h3 className="text-2xl font-bold text-[#2D2721] mb-2">Müügitoode</h3>
            <p className="text-[#6B5744]">Füüsilised tooted, mida müüd e-poes. Sisaldab laohaldust, tarnevalikuid ja variatsioone.</p>
            <div className="mt-8 flex items-center text-[#FFC857] font-bold">
              Vali Müük <ArrowLeft className="w-5 h-5 ml-2 rotate-180" />
            </div>
          </button>

          {/* Rental Option */}
          <button 
            onClick={() => setProductType('rental')}
            className="group relative bg-[#2D2721] p-8 rounded-3xl border-2 border-[#3E352F] hover:border-[#E17B5C] hover:shadow-xl transition-all text-left overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Camera className="w-32 h-32 text-[#E17B5C]" />
            </div>
            <div className="w-16 h-16 rounded-2xl bg-[#3E352F] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Camera className="w-8 h-8 text-[#E17B5C]" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Renditoode</h3>
            <p className="text-white/70">Teenused või esemed, mida rendid välja. Sisaldab kalendrit, tagatisi ja ajapõhist hinnastamist.</p>
            <div className="mt-8 flex items-center text-[#E17B5C] font-bold">
              Vali Rent <ArrowLeft className="w-5 h-5 ml-2 rotate-180" />
            </div>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] pb-20">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-[#FAF7F2]/80 backdrop-blur-md border-b border-[#E7DCC7]">
        <div className="max-w-5xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => setProductType(null)} className="p-2 hover:bg-[#E7DCC7]/50 rounded-full transition-colors">
              <ArrowLeft className="w-6 h-6 text-[#6B5744]" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-[#2D2721]">
                {productType === 'sale' ? 'Uus müügitoode' : 'Uus renditoode'}
              </h1>
              <div className="flex items-center gap-2 text-xs font-medium text-[#8B7355]">
                {productType === 'sale' ? <ShoppingBag className="w-3 h-3" /> : <Camera className="w-3 h-3" />}
                {productType === 'sale' ? 'E-pood' : 'Rendiplatvorm'}
              </div>
            </div>
          </div>
          <div className="flex gap-3">
             <WarmButton variant="ghost" onClick={() => navigate(-1)}>Tühista</WarmButton>
             <WarmButton className="gap-2">
               <Save className="w-4 h-4" /> Salvesta toode
             </WarmButton>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Basic Info Card */}
          <WarmCard padding="lg" className="bg-white">
            <h3 className="text-lg font-bold text-[#2D2721] mb-6 flex items-center gap-2">
              <Package className="w-5 h-5 text-[#8B7355]" /> Põhiandmed
            </h3>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-[#6B5744] mb-2">Toote nimi</label>
                <input 
                  type="text" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-[#FAF7F2] border border-[#E7DCC7] focus:border-[#FFC857] outline-none font-medium"
                  placeholder="Nt. Sony A7 III Kaamera"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-[#6B5744] mb-2">Kirjeldus</label>
                <textarea 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl bg-[#FAF7F2] border border-[#E7DCC7] focus:border-[#FFC857] outline-none font-medium resize-none"
                  placeholder="Kirjelda toodet põhjalikult..."
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-[#6B5744] mb-2">Kategooria</label>
                  <select 
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-[#FAF7F2] border border-[#E7DCC7] focus:border-[#FFC857] outline-none font-medium appearance-none"
                  >
                    <option value="">Vali kategooria...</option>
                    <option value="electronics">Elektroonika</option>
                    <option value="clothing">Riided</option>
                    <option value="services">Teenused</option>
                  </select>
                </div>
                <div>
                   <label className="block text-sm font-bold text-[#6B5744] mb-2">SKU / Kood</label>
                   <input 
                    type="text" 
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-[#FAF7F2] border border-[#E7DCC7] focus:border-[#FFC857] outline-none font-medium"
                    placeholder="TOODE-001"
                  />
                </div>
              </div>
            </div>
          </WarmCard>

          {/* Variations Section - THE FULL PAGE REQUESTED */}
          <WarmCard padding="lg" className="bg-white border-2 border-[#E7DCC7]/30">
             <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-[#2D2721] flex items-center gap-2">
                  <Layers className="w-5 h-5 text-[#E17B5C]" /> Variatsioonid
                </h3>
                <WarmButton size="sm" variant="outline" onClick={handleAddAttribute} className="text-xs">
                  <Plus className="w-3 h-3 mr-1" /> Lisa atribuut
                </WarmButton>
             </div>

             <div className="bg-[#FAF7F2] rounded-xl p-6 mb-6">
                <div className="space-y-4">
                  {attributes.map((attr, idx) => (
                    <div key={idx} className="bg-white p-4 rounded-lg shadow-sm border border-[#E7DCC7]">
                       <div className="flex gap-4 items-start">
                          <div className="w-1/3">
                             <label className="text-xs font-bold text-[#8B7355] mb-1 block">Nimetus</label>
                             <input 
                               value={attr.name}
                               onChange={(e) => handleUpdateAttribute(idx, 'name', e.target.value)}
                               placeholder="Nt. Suurus, Värv"
                               className="w-full px-3 py-2 rounded-lg bg-[#FAF7F2] border border-[#E7DCC7] text-sm font-medium"
                             />
                          </div>
                          <div className="flex-1">
                             <label className="text-xs font-bold text-[#8B7355] mb-1 block">Valikud (eralda komaga)</label>
                             <input 
                               placeholder="S, M, L, XL"
                               className="w-full px-3 py-2 rounded-lg bg-[#FAF7F2] border border-[#E7DCC7] text-sm font-medium"
                               onBlur={(e) => {
                                 const opts = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                                 handleUpdateAttribute(idx, 'options', opts);
                               }}
                             />
                          </div>
                          <button 
                            onClick={() => {
                              const newAttrs = attributes.filter((_, i) => i !== idx);
                              setAttributes(newAttrs);
                            }}
                            className="mt-6 p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                       </div>
                       
                       {attr.options.length > 0 && (
                         <div className="mt-3 flex flex-wrap gap-2">
                            {attr.options.map((opt, i) => (
                              <span key={i} className="text-xs font-bold bg-[#FFF9ED] text-[#FFC857] px-2 py-1 rounded border border-[#FFC857]/20">
                                {opt}
                              </span>
                            ))}
                         </div>
                       )}
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 flex justify-end">
                   <WarmButton onClick={generateVariants} disabled={attributes.length === 0}>
                      Genereeri variatsioonid
                   </WarmButton>
                </div>
             </div>

             {/* Generated Variants Table */}
             {variants.length > 0 && (
               <div className="overflow-hidden rounded-xl border border-[#E7DCC7]">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-[#FAF7F2] text-[#8B7355] font-bold">
                      <tr>
                        <th className="p-3">Variant</th>
                        <th className="p-3">Hind</th>
                        <th className="p-3">Ladu</th>
                        <th className="p-3"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E7DCC7]">
                      {variants.map((variant, i) => (
                        <tr key={i} className="bg-white">
                          <td className="p-3 font-medium text-[#2D2721]">{variant.name}</td>
                          <td className="p-3">
                             <input 
                               defaultValue={variant.price}
                               className="w-20 px-2 py-1 rounded border border-[#E7DCC7]"
                             />
                          </td>
                          <td className="p-3">
                             <input 
                               defaultValue={variant.stock}
                               className="w-20 px-2 py-1 rounded border border-[#E7DCC7]"
                             />
                          </td>
                          <td className="p-3 text-right">
                             <button className="text-[#E17B5C] hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
               </div>
             )}
          </WarmCard>

        </div>

        {/* Sidebar - Pricing & Media */}
        <div className="space-y-8">
          
          {/* Pricing Card */}
          <WarmCard padding="lg" className="bg-white sticky top-24">
            <h3 className="text-lg font-bold text-[#2D2721] mb-6 flex items-center gap-2">
              <Settings2 className="w-5 h-5 text-[#8B7355]" /> Hinnastamine
            </h3>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-[#6B5744] mb-2">Hind (€)</label>
                <div className="relative">
                  <input 
                    type="number" 
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full pl-8 pr-4 py-3 rounded-xl bg-[#FAF7F2] border border-[#E7DCC7] focus:border-[#FFC857] outline-none font-bold text-lg text-[#2D2721]"
                    placeholder="0.00"
                  />
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8B7355] font-bold">€</span>
                </div>
              </div>

              {productType === 'sale' ? (
                <div>
                   <label className="block text-sm font-bold text-[#6B5744] mb-2">Laoseis</label>
                   <input 
                      type="number" 
                      value={stock}
                      onChange={(e) => setStock(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-[#FAF7F2] border border-[#E7DCC7] focus:border-[#FFC857] outline-none font-medium"
                   />
                </div>
              ) : (
                <>
                  <div className="p-4 bg-[#FFF9ED] rounded-xl border border-[#FFC857]/30">
                     <div className="flex items-center gap-2 text-sm font-bold text-[#E17B5C] mb-2">
                        <Calendar className="w-4 h-4" /> Rendiperiood
                     </div>
                     <div className="flex gap-2">
                        <input 
                          value={minDuration}
                          onChange={(e) => setMinDuration(e.target.value)}
                          className="w-16 px-2 py-1 rounded border border-[#E7DCC7]"
                        />
                        <select 
                          value={timeUnit}
                          onChange={(e) => setTimeUnit(e.target.value)}
                          className="flex-1 px-2 py-1 rounded border border-[#E7DCC7] bg-white"
                        >
                           <option value="hour">Tundi</option>
                           <option value="day">Päeva</option>
                           <option value="week">Nädalat</option>
                        </select>
                     </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-[#6B5744] mb-2">Tagatisraha (€)</label>
                    <input 
                      type="number"
                      value={deposit}
                      onChange={(e) => setDeposit(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-[#FAF7F2] border border-[#E7DCC7] focus:border-[#FFC857] outline-none font-medium"
                      placeholder="50.00"
                    />
                  </div>
                </>
              )}
            </div>
          </WarmCard>

          {/* Media Card */}
          <WarmCard padding="lg" className="bg-white">
             <h3 className="text-lg font-bold text-[#2D2721] mb-6 flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-[#8B7355]" /> Meedia
             </h3>
             <div className="grid grid-cols-2 gap-4">
               <div className="border-2 border-dashed border-[#E7DCC7] rounded-xl p-4 flex flex-col items-center justify-center text-center hover:bg-[#FAF7F2] transition-colors cursor-pointer group h-32">
                  <div className="w-10 h-10 bg-[#FAF7F2] rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                     <ImageIcon className="w-5 h-5 text-[#8B7355]" />
                  </div>
                  <div className="text-xs font-bold text-[#2D2721]">Lisa pilt</div>
               </div>
               <div className="border-2 border-dashed border-[#E7DCC7] rounded-xl p-4 flex flex-col items-center justify-center text-center hover:bg-[#FAF7F2] transition-colors cursor-pointer group h-32">
                  <div className="w-10 h-10 bg-[#FAF7F2] rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                     <Video className="w-5 h-5 text-[#8B7355]" />
                  </div>
                  <div className="text-xs font-bold text-[#2D2721]">Lisa video</div>
               </div>
             </div>
             <div className="mt-4 text-[10px] text-center text-[#8B7355]">
                Toetatud formaadid: JPG, PNG, MP4 (max 50MB)
             </div>
          </WarmCard>

        </div>

      </div>
    </div>
  );
}