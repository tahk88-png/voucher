import { useState, useEffect } from 'react';
import { WarmCard } from '@app/components/WarmCard';
import { WarmButton } from '@app/components/WarmButton';
import { Input } from '@app/components/ui/input';
import { Label } from '@app/components/ui/label';
import { Switch } from '@app/components/ui/switch';
import { CountrySelector } from '@app/components/CountrySelector';
import { toast } from 'sonner';
import { useNavigate } from 'react-router';
import { UnifiedData } from '@services/unifiedData';
import { 
  CreditCard, 
  ArrowRight, 
  Upload, 
  Crown, 
  Check, 
  Share2, 
  TrendingUp, 
  Award, 
  Save,
  Shield,
  Truck,
  Package,
  MapPin,
  Clock,
  Phone,
  Plus,
  Trash2,
  Store,
  Edit2
} from 'lucide-react';

// Mock types
type Location = {
  id: string;
  name: string;
  address: string;
  city: string;
  hours: string;
  phone: string;
  isActive: boolean;
};

export function Settings() {
  const navigate = useNavigate();
  
  // Locations state
  const [locations, setLocations] = useState<Location[]>([
     { id: '1', name: 'Tallinna Esindus', address: 'Pärnu mnt 123', city: 'Tallinn', hours: 'E-R 9-18', phone: '+372 5555 5555', isActive: true },
     { id: '2', name: 'Tartu Ladu', address: 'Riia 14', city: 'Tartu', hours: 'E-R 10-17', phone: '+372 5123 4567', isActive: true }
  ]);
  const [isEditingLocation, setIsEditingLocation] = useState<string | null>(null);
  const [newLocation, setNewLocation] = useState<Partial<Location>>({ name: '', address: '', city: '', hours: '', phone: '', isActive: true });

  const [formData, setFormData] = useState({
    // Personal Info
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@email.com',
    phone: '+372 5123 4567',
    birthday: '1990-01-15',
    
    // Address
    street: 'Narva mnt 7',
    city: 'Tallinn',
    postalCode: '10117',
    country: 'Estonia',
    
    // Company Info
    companyName: 'Fashion Store OÜ',
    registryCode: '12345678',
    vatNumber: 'EE123456789',
    companyEmail: 'contact@fashionstore.com',
    companyPhone: '+372 6123 456',
    website: 'https://fashionstore.com',
    bankAccount: 'EE12 3456 7890 1234 5678',
    
    // Billing Address
    billingStreet: 'Narva mnt 7',
    billingCity: 'Tallinn',
    billingPostalCode: '10117',
    billingCountry: 'Estonia',
    
    // Branding
    logoUrl: '',
    brandColor: '#FFC857',
    accentColor: '#E17B5C',

    // Payment Settings
    paymentMode: 'platform', // 'platform' | 'direct'
    directPaymentProvider: 'montonio', // 'montonio' | 'stripe' | 'lhv'
    directPaymentApiKey: '',
    directPaymentSecret: '',

    // Delivery Settings
    deliveryPickupAllowed: true,
    deliveryPickupPrice: 0,
    deliveryCourierAllowed: true,
    deliveryCourierPrice: 5.90,
    deliveryFreeThreshold: 50.00, // New field
    deliverySmartpostAllowed: true,
    deliverySmartpostPrice: 2.90,
    deliveryOmnivaAllowed: true,
    deliveryOmnivaPrice: 2.50,
  });

  // Load from UnifiedData on mount (simulation)
  useEffect(() => {
     const saved = UnifiedData.getMerchantSettings();
     if (saved) {
         const { deliveryOptions, ...rest } = saved;
         setFormData(prev => ({ 
             ...prev, 
             ...rest,
             deliveryPickupAllowed: deliveryOptions?.pickupAllowed ?? true,
             deliveryPickupPrice: deliveryOptions?.pickupPrice ?? 0,
             deliveryCourierAllowed: deliveryOptions?.courierAllowed ?? true,
             deliveryCourierPrice: deliveryOptions?.courierPrice ?? 5.90,
             deliveryFreeThreshold: deliveryOptions?.freeThreshold ?? 50.00,
             deliverySmartpostAllowed: deliveryOptions?.smartpostAllowed ?? true,
             deliverySmartpostPrice: deliveryOptions?.smartpostPrice ?? 2.90,
             deliveryOmnivaAllowed: deliveryOptions?.omnivaAllowed ?? true,
             deliveryOmnivaPrice: deliveryOptions?.omnivaPrice ?? 2.50,
         }));
     }
  }, []);

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    
    const toSave = {
        ...formData,
        deliveryOptions: {
            pickupAllowed: formData.deliveryPickupAllowed,
            pickupPrice: Number(formData.deliveryPickupPrice),
            courierAllowed: formData.deliveryCourierAllowed,
            courierPrice: Number(formData.deliveryCourierPrice),
            freeThreshold: Number(formData.deliveryFreeThreshold),
            smartpostAllowed: formData.deliverySmartpostAllowed,
            smartpostPrice: Number(formData.deliverySmartpostPrice),
            omnivaAllowed: formData.deliveryOmnivaAllowed,
            omnivaPrice: Number(formData.deliveryOmnivaPrice)
        }
    };

    // Simulate API call and save to UnifiedData
    UnifiedData.saveMerchantSettings(toSave);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setIsSaving(false);
    toast.success('Seaded salvestatud edukalt!');
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setFormData({ ...formData, logoUrl: url });
      toast.success('Logo üles laetud!');
    }
  };

  // Location Handlers
  const addLocation = () => {
    if (!newLocation.name || !newLocation.address) return;
    const loc: Location = {
       id: Math.random().toString(36).substr(2, 9),
       name: newLocation.name,
       address: newLocation.address,
       city: newLocation.city || '',
       hours: newLocation.hours || '',
       phone: newLocation.phone || '',
       isActive: true
    };
    setLocations([...locations, loc]);
    setNewLocation({ name: '', address: '', city: '', hours: '', phone: '', isActive: true });
    setIsEditingLocation(null);
    toast.success('Uus asukoht lisatud!');
  };

  const removeLocation = (id: string) => {
     setLocations(locations.filter(l => l.id !== id));
     toast.success('Asukoht eemaldatud');
  };

  return (
    <div className="space-y-6 max-w-3xl pb-12 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-[#2D2721]">Seaded</h1>
        <p className="text-[#6B5744] mt-1">Halda oma poe seadeid, tarneviise ja asukohti</p>
      </div>

      {/* Locations & Stores */}
      <WarmCard padding="lg" className="border-l-4 border-l-[#FFC857]">
         <h2 className="text-xl font-semibold text-[#2D2721] mb-6 flex items-center gap-2">
            <Store className="w-5 h-5 text-[#E17B5C]" />
            Poed ja Laod
         </h2>
         <p className="text-sm text-[#6B5744] mb-4">Määra asukohad, kust kliendid saavad kauba ise kätte ("Tulen ise järele").</p>
         
         <div className="space-y-4">
            {locations.map(loc => (
               <div key={loc.id} className="bg-white p-4 rounded-xl border border-[#E7DCC7] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm hover:shadow-md transition-all">
                  <div className="flex gap-4 items-start">
                     <div className="w-10 h-10 bg-[#FAF7F2] rounded-full flex items-center justify-center text-[#8B7355] flex-shrink-0">
                        <MapPin className="w-5 h-5" />
                     </div>
                     <div>
                        <h3 className="font-bold text-[#2D2721]">{loc.name}</h3>
                        <div className="text-sm text-[#6B5744] flex flex-col gap-1 mt-1">
                           <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {loc.address}, {loc.city}</span>
                           <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {loc.hours}</span>
                           <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {loc.phone}</span>
                        </div>
                     </div>
                  </div>
                  <div className="flex items-center gap-2 self-end sm:self-center">
                     <Switch checked={loc.isActive} onCheckedChange={() => {}} />
                     <button onClick={() => removeLocation(loc.id)} className="p-2 hover:bg-[#FFF9ED] text-[#E17B5C] rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                     </button>
                  </div>
               </div>
            ))}

            {/* Add New Location Form */}
            {isEditingLocation === 'new' ? (
               <div className="bg-[#FAF7F2] p-4 rounded-xl border border-[#E7DCC7] animate-in slide-in-from-top-2">
                  <h3 className="font-bold text-[#2D2721] mb-3">Lisa uus asukoht</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                     <div>
                        <Label>Nimi (nt. Tallinna Esindus)</Label>
                        <Input value={newLocation.name} onChange={e => setNewLocation({...newLocation, name: e.target.value})} className="bg-white" />
                     </div>
                     <div>
                        <Label>Aadress</Label>
                        <Input value={newLocation.address} onChange={e => setNewLocation({...newLocation, address: e.target.value})} className="bg-white" />
                     </div>
                     <div>
                        <Label>Linn</Label>
                        <Input value={newLocation.city} onChange={e => setNewLocation({...newLocation, city: e.target.value})} className="bg-white" />
                     </div>
                     <div>
                        <Label>Lahtiolekuaeg</Label>
                        <Input value={newLocation.hours} onChange={e => setNewLocation({...newLocation, hours: e.target.value})} className="bg-white" placeholder="E-R 9-17" />
                     </div>
                     <div>
                        <Label>Telefon</Label>
                        <Input value={newLocation.phone} onChange={e => setNewLocation({...newLocation, phone: e.target.value})} className="bg-white" />
                     </div>
                  </div>
                  <div className="flex justify-end gap-2">
                     <WarmButton variant="ghost" onClick={() => setIsEditingLocation(null)}>Tühista</WarmButton>
                     <WarmButton onClick={addLocation}>Lisa asukoht</WarmButton>
                  </div>
               </div>
            ) : (
               <button 
                  onClick={() => setIsEditingLocation('new')}
                  className="w-full py-3 border-2 border-dashed border-[#E7DCC7] rounded-xl text-[#8B7355] font-bold hover:bg-[#FAF7F2] hover:border-[#FFC857] transition-all flex items-center justify-center gap-2"
               >
                  <Plus className="w-5 h-5" /> Lisa uus asukoht
               </button>
            )}
         </div>
      </WarmCard>

      {/* Delivery Settings */}
      <WarmCard padding="lg">
        <h2 className="text-xl font-semibold text-[#2D2721] mb-6 flex items-center gap-2">
            <Truck className="w-5 h-5 text-[#E17B5C]" />
            Tarneviisid
        </h2>
        
        <div className="space-y-6">
            
            {/* Free Shipping Threshold */}
            <div className="bg-[#FFF9ED] p-4 rounded-xl border border-[#FFC857] flex flex-col md:flex-row items-center justify-between gap-4">
               <div className="flex items-center gap-3">
                  <div className="bg-[#FFC857] p-2 rounded-lg text-[#2D2721]"><Award className="w-5 h-5" /></div>
                  <div>
                     <h3 className="font-bold text-[#2D2721]">Tasuta tarne</h3>
                     <p className="text-sm text-[#6B5744]">Rakenda tasuta tarne, kui ostukorvi summa ületab piiri</p>
                  </div>
               </div>
               <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-[#2D2721]">Alates (€):</span>
                  <Input 
                     type="number" 
                     className="w-24 bg-white border-[#FFC857]" 
                     value={formData.deliveryFreeThreshold}
                     onChange={(e) => setFormData({...formData, deliveryFreeThreshold: parseFloat(e.target.value)})}
                  />
               </div>
            </div>

            {/* Pickup */}
            <div className="p-4 bg-[#F8F6F1] rounded-xl border border-[rgba(139,115,85,0.1)] space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="font-semibold text-[#2D2721] flex items-center gap-2">
                            <Package className="w-4 h-4 text-[#8B7355]" />
                            Tulen ise järele
                        </h3>
                        <p className="text-sm text-[#6B5744]">Klient valib ühe sinu poodidest (ülal määratud)</p>
                    </div>
                    <Switch 
                        checked={formData.deliveryPickupAllowed} 
                        onCheckedChange={(c) => setFormData({...formData, deliveryPickupAllowed: c})}
                    />
                </div>
                
                {formData.deliveryPickupAllowed && (
                    <div className="animate-in slide-in-from-top-2 fade-in">
                        <div className="space-y-2 max-w-xs">
                            <Label className="text-[#2D2721]">Hind (€)</Label>
                            <Input 
                                type="number" 
                                min="0" 
                                step="0.01"
                                value={formData.deliveryPickupPrice}
                                onChange={(e) => setFormData({...formData, deliveryPickupPrice: parseFloat(e.target.value)})}
                                className="bg-white"
                            />
                            <p className="text-xs text-[#8B7355]">Tavaliselt tasuta (0.00€)</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Courier */}
            <div className="p-4 bg-[#F8F6F1] rounded-xl border border-[rgba(139,115,85,0.1)] space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="font-semibold text-[#2D2721] flex items-center gap-2">
                            <Truck className="w-4 h-4 text-[#8B7355]" />
                            Kulleriga koju
                        </h3>
                        <p className="text-sm text-[#6B5744]">DPD, Itella või Omniva kuller</p>
                    </div>
                    <Switch 
                        checked={formData.deliveryCourierAllowed} 
                        onCheckedChange={(c) => setFormData({...formData, deliveryCourierAllowed: c})}
                    />
                </div>
                
                {formData.deliveryCourierAllowed && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in slide-in-from-top-2 fade-in">
                        <div className="space-y-2">
                            <Label className="text-[#2D2721]">Hind (€)</Label>
                            <Input 
                                type="number" 
                                min="0" 
                                step="0.01"
                                value={formData.deliveryCourierPrice}
                                onChange={(e) => setFormData({...formData, deliveryCourierPrice: parseFloat(e.target.value)})}
                                className="bg-white"
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Parcel Machines */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-[#F8F6F1] rounded-xl border border-[rgba(139,115,85,0.1)] space-y-4">
                    <div className="flex items-center justify-between">
                        <span className="font-semibold text-[#2D2721]">Smartpost pakiautomaat</span>
                        <Switch 
                            checked={formData.deliverySmartpostAllowed} 
                            onCheckedChange={(c) => setFormData({...formData, deliverySmartpostAllowed: c})}
                        />
                    </div>
                    {formData.deliverySmartpostAllowed && (
                        <div className="space-y-2 animate-in fade-in">
                             <Label className="text-[#2D2721]">Hind (€)</Label>
                             <Input 
                                type="number" 
                                min="0" 
                                step="0.01"
                                value={formData.deliverySmartpostPrice}
                                onChange={(e) => setFormData({...formData, deliverySmartpostPrice: parseFloat(e.target.value)})}
                                className="bg-white"
                            />
                        </div>
                    )}
                </div>

                <div className="p-4 bg-[#F8F6F1] rounded-xl border border-[rgba(139,115,85,0.1)] space-y-4">
                    <div className="flex items-center justify-between">
                        <span className="font-semibold text-[#2D2721]">Omniva pakiautomaat</span>
                        <Switch 
                            checked={formData.deliveryOmnivaAllowed} 
                            onCheckedChange={(c) => setFormData({...formData, deliveryOmnivaAllowed: c})}
                        />
                    </div>
                    {formData.deliveryOmnivaAllowed && (
                        <div className="space-y-2 animate-in fade-in">
                             <Label className="text-[#2D2721]">Hind (€)</Label>
                             <Input 
                                type="number" 
                                min="0" 
                                step="0.01"
                                value={formData.deliveryOmnivaPrice}
                                onChange={(e) => setFormData({...formData, deliveryOmnivaPrice: parseFloat(e.target.value)})}
                                className="bg-white"
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
      </WarmCard>

      {/* Payment Configuration */}
      <WarmCard padding="lg">
        <h2 className="text-xl font-semibold text-[#2D2721] mb-6 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-[#E17B5C]" />
            Maksed
        </h2>
        
        <div className="space-y-6">
          <div className="flex flex-col gap-4">
             <div className="flex items-center justify-between p-4 bg-[#F8F6F1] rounded-xl border border-[rgba(139,115,85,0.1)]">
                <div>
                    <h3 className="font-semibold text-[#2D2721] mb-1">Platvormi maksed (Soovitatud)</h3>
                    <p className="text-sm text-[#6B5744] max-w-sm">
                        Meie keskne makselahendus. Hoolitseme tagasimaksete ja raportite eest.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <span className={`text-sm font-bold ${formData.paymentMode === 'platform' ? 'text-[#E17B5C]' : 'text-[#8B7355]'}`}>
                        {formData.paymentMode === 'platform' ? 'Aktiivne' : 'Mitteaktiivne'}
                    </span>
                    <Switch 
                        checked={formData.paymentMode === 'platform'} 
                        onCheckedChange={(checked) => setFormData({ ...formData, paymentMode: checked ? 'platform' : 'direct' })}
                    />
                </div>
             </div>

             <div className="flex items-center justify-between p-4 bg-[#F8F6F1] rounded-xl border border-[rgba(139,115,85,0.1)]">
                <div>
                    <h3 className="font-semibold text-[#2D2721] mb-1">Otsemaksed (Sinu API)</h3>
                    <p className="text-sm text-[#6B5744] max-w-sm">
                        Raha laekub otse sinu kontole. Vastutad ise tagasimaksete eest.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <span className={`text-sm font-bold ${formData.paymentMode === 'direct' ? 'text-[#E17B5C]' : 'text-[#8B7355]'}`}>
                        {formData.paymentMode === 'direct' ? 'Aktiivne' : 'Mitteaktiivne'}
                    </span>
                    <Switch 
                        checked={formData.paymentMode === 'direct'} 
                        onCheckedChange={(checked) => setFormData({ ...formData, paymentMode: checked ? 'direct' : 'platform' })}
                    />
                </div>
             </div>
          </div>

          {formData.paymentMode === 'direct' && (
             <div className="space-y-4 pt-4 border-t border-[rgba(139,115,85,0.1)] animate-in slide-in-from-top-2 fade-in duration-300">
                <div className="space-y-2">
                    <Label htmlFor="provider" className="text-[#2D2721] font-medium">Teenusepakkuja</Label>
                    <select 
                        id="provider"
                        value={formData.directPaymentProvider}
                        onChange={(e) => setFormData({...formData, directPaymentProvider: e.target.value})}
                        className="w-full h-12 rounded-[12px] border-[rgba(139,115,85,0.2)] bg-white px-3 text-[#2D2721]"
                    >
                        <option value="montonio">Montonio</option>
                        <option value="stripe">Stripe</option>
                        <option value="lhv">LHV Connect</option>
                    </select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="apiKey" className="text-[#2D2721] font-medium">API Võti</Label>
                    <Input 
                        id="apiKey"
                        type="password" 
                        value={formData.directPaymentApiKey} 
                        onChange={(e) => setFormData({...formData, directPaymentApiKey: e.target.value})}
                        placeholder="sk_live_..."
                        className="rounded-[12px] border-[rgba(139,115,85,0.2)] bg-white h-12 font-mono"
                    />
                </div>
                <div className="bg-[#FFF9ED] p-4 rounded-xl border border-[#E7DCC7] flex gap-3 text-sm text-[#8B7355]">
                    <Shield className="w-5 h-5 flex-shrink-0 text-[#E17B5C]" />
                    <p>Sinu võtmed on krüpteeritud ja turvaliselt hoitud.</p>
                </div>
             </div>
          )}
        </div>
      </WarmCard>

      {/* Brand Settings */}
      <WarmCard padding="lg">
        <h2 className="text-xl font-semibold text-[#2D2721] mb-6">Bränding</h2>
        
        <div className="space-y-6">
          <div className="space-y-2">
            <Label className="text-[#2D2721] font-medium">Logo</Label>
            <div className="flex items-center gap-4">
              {formData.logoUrl ? (
                <img
                  src={formData.logoUrl}
                  alt="Brand logo"
                  className="w-20 h-20 rounded-[12px] object-cover border-2 border-[rgba(139,115,85,0.1)]"
               />
              ) : (
                <div className="w-20 h-20 rounded-[12px] bg-[#F8F6F1] flex items-center justify-center border-2 border-dashed border-[rgba(139,115,85,0.2)]">
                  <Upload className="h-8 w-8 text-[#8B7355]" />
                </div>
              )}
              <div className="flex-1">
                <input
                  type="file"
                  id="logo"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
                <label htmlFor="logo" className="cursor-pointer">
                  <div className="inline-block">
                    <WarmButton variant="secondary" size="sm" type="button">
                      <Upload className="h-4 w-4 mr-2" />
                      Lae üles
                    </WarmButton>
                  </div>
                </label>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="brandColor" className="text-[#2D2721] font-medium">Põhivärv</Label>
              <div className="flex gap-2">
                <input
                  type="color"
                  id="brandColor"
                  value={formData.brandColor}
                  onChange={(e) => setFormData({ ...formData, brandColor: e.target.value })}
                  className="w-16 h-12 rounded-[12px] border-2 border-[rgba(139,115,85,0.2)] cursor-pointer"
                />
                <Input
                  value={formData.brandColor}
                  onChange={(e) => setFormData({ ...formData, brandColor: e.target.value })}
                  className="rounded-[12px] border-[rgba(139,115,85,0.2)] bg-white h-12 font-mono"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="accentColor" className="text-[#2D2721] font-medium">Aktsentvärv</Label>
              <div className="flex gap-2">
                <input
                  type="color"
                  id="accentColor"
                  value={formData.accentColor}
                  onChange={(e) => setFormData({ ...formData, accentColor: e.target.value })}
                  className="w-16 h-12 rounded-[12px] border-2 border-[rgba(139,115,85,0.2)] cursor-pointer"
                />
                <Input
                  value={formData.accentColor}
                  onChange={(e) => setFormData({ ...formData, accentColor: e.target.value })}
                  className="rounded-[12px] border-[rgba(139,115,85,0.2)] bg-white h-12 font-mono"
                />
              </div>
            </div>
          </div>
        </div>
      </WarmCard>

      {/* Save Button */}
      <div className="flex justify-end sticky bottom-6 z-10">
        <WarmButton size="lg" onClick={handleSave} isLoading={isSaving} className="shadow-xl">
          <Save className="h-5 w-5 mr-2" />
          Salvesta muudatused
        </WarmButton>
      </div>
    </div>
  );
}