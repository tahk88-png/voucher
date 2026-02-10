import { useState, useEffect } from 'react';
import { useNavigate } from '@/lib/router-shim';
import { WarmCard } from '@app/components/WarmCard';
import { WarmButton } from '@app/components/WarmButton';
import { ImageWithFallback } from '@app/components/figma/ImageWithFallback';
import { Input } from '@app/components/ui/input';
import { 
  Trash2, 
  Minus, 
  Plus, 
  ArrowLeft, 
  Lock, 
  CreditCard,
  Truck,
  ShieldCheck,
  User,
  Mail,
  Phone,
  MapPin,
  Building2,
  Package
} from 'lucide-react';
import { CurrencyDisplay } from '@app/components/CurrencyDisplay';
import { useCart } from '@app/contexts/CartContext';
import { UnifiedData } from '@services/unifiedData';
import { IDVerification } from '@app/components/checkout/IDVerification';
import { toast } from 'sonner';

export function Cart() {
  const navigate = useNavigate();
  const { 
    items, 
    removeItem, 
    updateQuantity, 
    cartCount, 
    subtotal, 
    total,
    remainingForFreeShipping,
    progressPercent 
  } = useCart();

  // Load merchant settings
  const merchantSettings = UnifiedData.getMerchantSettings();
  const deliveryOptions = merchantSettings?.deliveryOptions || {
      pickupAllowed: true, pickupPrice: 0, pickupLocation: 'Tallinn, PÃ¤rnu mnt 123',
      courierAllowed: true, courierPrice: 5.90,
      smartpostAllowed: true, smartpostPrice: 2.90,
      omnivaAllowed: true, omnivaPrice: 2.50
  };
  
  const paymentMode = merchantSettings?.paymentMode || 'platform';
  const providerName = merchantSettings?.directPaymentProvider === 'lhv' ? 'LHV Connect' : 
                       merchantSettings?.directPaymentProvider === 'stripe' ? 'Stripe' : 'Montonio';

  // Customer Details State
  const [customerDetails, setCustomerDetails] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    regCode: '',
    address: '',
    city: '',
    zip: ''
  });

  const [deliveryMethod, setDeliveryMethod] = useState(() => {
     if (deliveryOptions.pickupAllowed) return 'pickup';
     if (deliveryOptions.smartpostAllowed) return 'smartpost';
     if (deliveryOptions.omnivaAllowed) return 'omniva';
     return 'courier';
  });
  
  const [isBusinessClient, setIsBusinessClient] = useState(false);

  // ID Verification State
  const hasRentals = items.some(item => item.type === 'rental');
  const hasProducts = items.some(item => item.type === 'product');
  const [isIDVerified, setIsIDVerified] = useState(false);

  // Calculate dynamic shipping cost
  const getShippingCost = () => {
     if (!hasProducts) return 0; // Rentals usually picked up or specific logic
     // If free shipping threshold met (assuming 50â‚¬ default)
     if (remainingForFreeShipping <= 0 && deliveryMethod !== 'courier') return 0;
     
     switch (deliveryMethod) {
         case 'pickup': return deliveryOptions.pickupPrice;
         case 'smartpost': return deliveryOptions.smartpostPrice;
         case 'omniva': return deliveryOptions.omnivaPrice;
         case 'courier': return deliveryOptions.courierPrice;
         default: return 0;
     }
  };

  const currentShippingCost = getShippingCost();
  const grandTotal = subtotal + currentShippingCost;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCustomerDetails(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    if (!customerDetails.firstName || !customerDetails.lastName || !customerDetails.email || !customerDetails.phone) {
      toast.error("Palun tÃ¤ida kÃµik kohustuslikud vÃ¤ljad kontaktandmetes.");
      return false;
    }
    if (hasProducts && deliveryMethod !== 'pickup' && !customerDetails.address) {
       // Simple check
    }
    return true;
  };

  const handleCheckout = () => {
    if (!validateForm()) return;
    if (hasRentals && !isIDVerified) {
      toast.error("Rendi puhul on isikutuvastus kohustuslik.");
      return;
    }
    
    // Proceed to payment (Mock)
    toast.success("Tellimus vormistatud! Suuname maksmisele...");
    // navigate('/payment-success'); // Mock route
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-[#FAF7F2]">
        <div className="flex items-center justify-center p-4 h-[calc(100vh-64px)]">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-[#2D2721] mb-2">Sinu ostukorv on tÃ¼hi</h2>
            <p className="text-[#6B5744] mb-6">Vaata meie uusimaid tooteid ja leia midagi ilusat.</p>
            <WarmButton onClick={() => navigate('/shop')}>Tagasi poodi</WarmButton>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] pb-12">
      
      {/* Header */}
      <div className="bg-white border-b border-[#E7DCC7] sticky top-16 z-20">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
           <button onClick={() => navigate('/shop')} className="text-sm text-[#6B5744] hover:text-[#2D2721] flex items-center gap-2">
             <ArrowLeft className="w-4 h-4" /> JÃ¤tka ostlemist
           </button>
           <h1 className="font-bold text-[#2D2721]">Ostukorv ({cartCount})</h1>
           <div className="w-20" /> {/* Spacer for centering */}
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Items & Data Forms */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Free Shipping Progress */}
            {hasProducts && (
              <WarmCard padding="md" className="bg-white">
                 {remainingForFreeShipping > 0 ? (
                   <div className="mb-2 text-sm text-[#6B5744]">
                     Osta veel <span className="font-bold text-[#2D2721]">{remainingForFreeShipping.toFixed(2)}â‚¬</span> eest, et saada <span className="text-[#E17B5C] font-bold">tasuta tarne</span> (v.a. kuller)
                   </div>
                 ) : (
                   <div className="mb-2 text-sm font-bold text-[#9DB5A5] flex items-center gap-2">
                     <Truck className="w-4 h-4" /> Palju Ãµnne! Sul on tasuta tarne pakiautomaati.
                   </div>
                 )}
                 <div className="h-2 bg-[#FAF7F2] rounded-full overflow-hidden">
                   <div 
                     className="h-full bg-[#E17B5C] transition-all duration-500 rounded-full" 
                     style={{ width: `${progressPercent}%` }} 
                   />
                 </div>
              </WarmCard>
            )}

            {/* Cart Items List */}
            <div className="space-y-4">
              <h2 className="font-bold text-lg text-[#2D2721]">Tooted & Teenused</h2>
              {items.map((item) => (
                <WarmCard key={item.id} padding="md" className="bg-white flex gap-4">
                  <div className="w-20 h-20 md:w-24 md:h-24 rounded-lg overflow-hidden bg-[#FAF7F2] flex-shrink-0 relative">
                    <ImageWithFallback src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    {item.type === 'rental' && (
                        <span className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] uppercase font-bold text-center py-1">RENT</span>
                    )}
                  </div>
                  
                  <div className="flex-1 flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-[#2D2721] text-sm md:text-base">{item.name}</h3>
                        <p className="text-xs md:text-sm text-[#6B5744]">{item.variant}</p>
                        {item.rentalPeriod && (
                            <div className="text-xs text-[#E17B5C] mt-1 font-medium bg-[#FFF9ED] px-2 py-1 rounded inline-block">
                                {item.rentalPeriod.days} pÃ¤eva ({new Date(item.rentalPeriod.start).toLocaleDateString('et-EE')} - {new Date(item.rentalPeriod.end).toLocaleDateString('et-EE')})
                            </div>
                        )}
                      </div>
                      <button 
                        onClick={() => removeItem(item.id)}
                        className="text-[#8B7355] hover:text-red-500 transition-colors p-2"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex justify-between items-end mt-2">
                      <div className="flex items-center border border-[#E7DCC7] rounded-lg bg-white h-8">
                        <button 
                          onClick={() => updateQuantity(item.id, -1)}
                          className="w-8 h-full flex items-center justify-center text-[#6B5744] hover:bg-[#FAF7F2] rounded-l-lg"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-8 text-center text-sm font-medium text-[#2D2721]">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.id, 1)}
                          className="w-8 h-full flex items-center justify-center text-[#6B5744] hover:bg-[#FAF7F2] rounded-r-lg"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="font-bold text-[#2D2721]">
                        <CurrencyDisplay amount={item.rentalPeriod ? item.price * item.quantity * item.rentalPeriod.days : item.price * item.quantity} />
                      </div>
                    </div>
                  </div>
                </WarmCard>
              ))}
            </div>

            {/* CUSTOMER DETAILS FORM */}
            <div className="bg-white rounded-3xl p-6 md:p-8 border border-[#E7DCC7] shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 rounded-full bg-[#FAF7F2] flex items-center justify-center text-[#E17B5C]">
                        <User className="w-4 h-4" />
                    </div>
                    <h2 className="font-bold text-lg text-[#2D2721]">Sinu andmed</h2>
                </div>
                
                <div className="space-y-4">
                    {/* Client Type Toggle */}
                    <div className="flex gap-4 border-b border-[#FAF7F2] pb-4 mb-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input 
                                type="radio" 
                                name="clientType" 
                                checked={!isBusinessClient} 
                                onChange={() => setIsBusinessClient(false)}
                                className="text-[#E17B5C] focus:ring-[#E17B5C]" 
                            />
                            <span className="text-sm font-medium text-[#2D2721]">Eraisik</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input 
                                type="radio" 
                                name="clientType" 
                                checked={isBusinessClient} 
                                onChange={() => setIsBusinessClient(true)}
                                className="text-[#E17B5C] focus:ring-[#E17B5C]" 
                            />
                            <span className="text-sm font-medium text-[#2D2721]">EttevÃµte</span>
                        </label>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-[#6B5744]">Eesnimi *</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8B7355]" />
                                <Input 
                                    name="firstName" 
                                    value={customerDetails.firstName} 
                                    onChange={handleInputChange} 
                                    className="pl-9 bg-[#FAF7F2] border-[#E7DCC7]" 
                                    placeholder="Mari" 
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-[#6B5744]">Perekonnanimi *</label>
                            <Input 
                                name="lastName" 
                                value={customerDetails.lastName} 
                                onChange={handleInputChange} 
                                className="bg-[#FAF7F2] border-[#E7DCC7]" 
                                placeholder="Tamm" 
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-[#6B5744]">E-post *</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8B7355]" />
                                <Input 
                                    name="email" 
                                    type="email" 
                                    value={customerDetails.email} 
                                    onChange={handleInputChange} 
                                    className="pl-9 bg-[#FAF7F2] border-[#E7DCC7]" 
                                    placeholder="mari.tamm@example.com" 
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-[#6B5744]">Telefon *</label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8B7355]" />
                                <Input 
                                    name="phone" 
                                    value={customerDetails.phone} 
                                    onChange={handleInputChange} 
                                    className="pl-9 bg-[#FAF7F2] border-[#E7DCC7]" 
                                    placeholder="+372 5555 5555" 
                                />
                            </div>
                        </div>
                    </div>

                    {isBusinessClient && (
                        <div className="animate-in fade-in slide-in-from-top-2 duration-300 grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                             <div className="space-y-1.5">
                                <label className="text-xs font-bold text-[#6B5744]">EttevÃµtte nimi *</label>
                                <div className="relative">
                                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8B7355]" />
                                    <Input 
                                        name="company" 
                                        value={customerDetails.company} 
                                        onChange={handleInputChange} 
                                        className="pl-9 bg-[#FAF7F2] border-[#E7DCC7]" 
                                        placeholder="Minu Firma OÃœ" 
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-[#6B5744]">Registrikood *</label>
                                <Input 
                                    name="regCode" 
                                    value={customerDetails.regCode} 
                                    onChange={handleInputChange} 
                                    className="bg-[#FAF7F2] border-[#E7DCC7]" 
                                    placeholder="12345678" 
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* DELIVERY METHOD */}
            <div className="bg-white rounded-3xl p-6 md:p-8 border border-[#E7DCC7] shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 rounded-full bg-[#FAF7F2] flex items-center justify-center text-[#E17B5C]">
                        <Package className="w-4 h-4" />
                    </div>
                    <h2 className="font-bold text-lg text-[#2D2721]">Tarneviis</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                    {deliveryOptions.pickupAllowed && (
                        <div 
                            onClick={() => setDeliveryMethod('pickup')}
                            className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col gap-2 ${deliveryMethod === 'pickup' ? 'border-[#E17B5C] bg-[#FFF9ED]' : 'border-[#FAF7F2] hover:border-[#E7DCC7]'}`}
                        >
                            <div className="flex justify-between items-start">
                                <span className="font-bold text-[#2D2721]">Tulen ise jÃ¤rele</span>
                                {deliveryMethod === 'pickup' && <div className="w-4 h-4 rounded-full bg-[#E17B5C] border-[3px] border-white ring-1 ring-[#E17B5C]"></div>}
                            </div>
                            <span className="text-xs text-[#6B5744] truncate" title={deliveryOptions.pickupLocation}>
                                {deliveryOptions.pickupLocation || 'Asukoht mÃ¤Ã¤rata'}
                            </span>
                            <span className="text-sm font-bold text-[#2D2721]">
                                {deliveryOptions.pickupPrice === 0 ? 'Tasuta' : `${deliveryOptions.pickupPrice.toFixed(2)}â‚¬`}
                            </span>
                        </div>
                    )}

                    {deliveryOptions.smartpostAllowed && (
                        <div 
                            onClick={() => setDeliveryMethod('smartpost')}
                            className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col gap-2 ${deliveryMethod === 'smartpost' ? 'border-[#E17B5C] bg-[#FFF9ED]' : 'border-[#FAF7F2] hover:border-[#E7DCC7]'}`}
                        >
                            <div className="flex justify-between items-start">
                                <span className="font-bold text-[#2D2721]">Smartpost</span>
                                {deliveryMethod === 'smartpost' && <div className="w-4 h-4 rounded-full bg-[#E17B5C] border-[3px] border-white ring-1 ring-[#E17B5C]"></div>}
                            </div>
                            <span className="text-xs text-[#6B5744]">Pakiautomaat</span>
                            <span className="text-sm font-bold text-[#2D2721]">
                                {deliveryOptions.smartpostPrice === 0 ? 'Tasuta' : `${deliveryOptions.smartpostPrice.toFixed(2)}â‚¬`}
                            </span>
                        </div>
                    )}

                    {deliveryOptions.omnivaAllowed && (
                        <div 
                            onClick={() => setDeliveryMethod('omniva')}
                            className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col gap-2 ${deliveryMethod === 'omniva' ? 'border-[#E17B5C] bg-[#FFF9ED]' : 'border-[#FAF7F2] hover:border-[#E7DCC7]'}`}
                        >
                            <div className="flex justify-between items-start">
                                <span className="font-bold text-[#2D2721]">Omniva</span>
                                {deliveryMethod === 'omniva' && <div className="w-4 h-4 rounded-full bg-[#E17B5C] border-[3px] border-white ring-1 ring-[#E17B5C]"></div>}
                            </div>
                            <span className="text-xs text-[#6B5744]">Pakiautomaat</span>
                            <span className="text-sm font-bold text-[#2D2721]">
                                {deliveryOptions.omnivaPrice === 0 ? 'Tasuta' : `${deliveryOptions.omnivaPrice.toFixed(2)}â‚¬`}
                            </span>
                        </div>
                    )}

                    {deliveryOptions.courierAllowed && (
                        <div 
                            onClick={() => setDeliveryMethod('courier')}
                            className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col gap-2 ${deliveryMethod === 'courier' ? 'border-[#E17B5C] bg-[#FFF9ED]' : 'border-[#FAF7F2] hover:border-[#E7DCC7]'}`}
                        >
                            <div className="flex justify-between items-start">
                                <span className="font-bold text-[#2D2721]">Kuller</span>
                                {deliveryMethod === 'courier' && <div className="w-4 h-4 rounded-full bg-[#E17B5C] border-[3px] border-white ring-1 ring-[#E17B5C]"></div>}
                            </div>
                            <span className="text-xs text-[#6B5744]">Koju vÃµi kontorisse</span>
                            <span className="text-sm font-bold text-[#2D2721]">
                                {deliveryOptions.courierPrice === 0 ? 'Tasuta' : `${deliveryOptions.courierPrice.toFixed(2)}â‚¬`}
                            </span>
                        </div>
                    )}
                </div>

                {/* Address Fields (Hidden if Pickup) */}
                {deliveryMethod !== 'pickup' && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300 pt-2 border-t border-[#FAF7F2]">
                         <div className="space-y-1.5">
                            <label className="text-xs font-bold text-[#6B5744]">Aadress *</label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8B7355]" />
                                <Input 
                                    name="address" 
                                    value={customerDetails.address} 
                                    onChange={handleInputChange} 
                                    className="pl-9 bg-[#FAF7F2] border-[#E7DCC7]" 
                                    placeholder="TÃ¤nav, maja, korter" 
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-[#6B5744]">Linn / Vald *</label>
                                <Input 
                                    name="city" 
                                    value={customerDetails.city} 
                                    onChange={handleInputChange} 
                                    className="bg-[#FAF7F2] border-[#E7DCC7]" 
                                    placeholder="Tallinn" 
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-[#6B5744]">Postiindeks *</label>
                                <Input 
                                    name="zip" 
                                    value={customerDetails.zip} 
                                    onChange={handleInputChange} 
                                    className="bg-[#FAF7F2] border-[#E7DCC7]" 
                                    placeholder="10111" 
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* ID Verification Step (If rentals exist) */}
            {hasRentals && !isIDVerified && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <IDVerification onVerified={() => setIsIDVerified(true)} />
              </div>
            )}

            {/* Verification Success Message */}
            {hasRentals && isIDVerified && (
              <WarmCard padding="md" className="bg-[#E6F4EA] border border-[#9DB5A5]/30 flex items-center gap-3">
                <ShieldCheck className="w-6 h-6 text-[#00D098]" />
                <div>
                  <h4 className="font-bold text-[#2D2721]">Isik tuvastatud</h4>
                  <p className="text-sm text-[#6B5744]">Sinu rentimine on turvaline ja kinnitatud.</p>
                </div>
              </WarmCard>
            )}

          </div>

          {/* Right Column: Summary & Checkout */}
          <div className="lg:col-span-1">
            <WarmCard padding="lg" className="bg-white sticky top-24">
              <h2 className="font-bold text-lg text-[#2D2721] mb-6">Tellimuse kokkuvÃµte</h2>
              
              <div className="space-y-3 mb-6 text-sm">
                <div className="flex justify-between text-[#6B5744]">
                  <span>Vahesumma</span>
                  <span><CurrencyDisplay amount={subtotal} /></span>
                </div>
                <div className="flex justify-between text-[#6B5744]">
                  <span>Tarne ({
                    deliveryMethod === 'pickup' ? 'Ise jÃ¤rele' : 
                    deliveryMethod === 'courier' ? 'Kuller' : 
                    deliveryMethod === 'smartpost' ? 'Smartpost' : 'Omniva'
                  })</span>
                  <span>
                    {currentShippingCost === 0 ? 'Tasuta' : <CurrencyDisplay amount={currentShippingCost} />}
                  </span>
                </div>
                <div className="pt-3 mt-3 border-t border-[#E7DCC7] flex justify-between font-bold text-lg text-[#2D2721]">
                  <span>Kokku</span>
                  <span><CurrencyDisplay amount={grandTotal} /></span>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex gap-2">
                  <Input placeholder="Sooduskood" className="bg-[#FAF7F2]" />
                  <WarmButton variant="secondary">Lisa</WarmButton>
                </div>
              </div>

              <WarmButton 
                fullWidth 
                size="lg" 
                className="mb-4"
                disabled={hasRentals && !isIDVerified}
                onClick={handleCheckout}
              >
                <Lock className="w-4 h-4 mr-2" />
                {hasRentals && !isIDVerified ? 'Tuvasta isik, et maksta' : 'Maksa turvaliselt'}
              </WarmButton>
              
              {/* Payment Provider Info */}
              <div className="bg-[#FAF7F2] p-3 rounded-lg border border-[#E7DCC7] mb-4 text-xs text-[#6B5744] text-center">
                 {paymentMode === 'platform' ? (
                     <span>Makse saaja: <strong>Platvormi Operaator</strong> (Turvaline keskkond)</span>
                 ) : (
                     <span>Makse saaja: <strong>{merchantSettings?.companyName || 'Kaupmees'}</strong><br/>Vahendaja: {providerName}</span>
                 )}
              </div>

              <div className="flex flex-col gap-2 items-center text-xs text-[#8B7355] text-center">
                <div className="flex gap-2">
                  <CreditCard className="w-4 h-4" />
                  <span>Turvaline makse SSL-iga</span>
                </div>
                <p>Aktsepteerime: Swedbank, SEB, LHV, Visa, Mastercard</p>
              </div>
            </WarmCard>
          </div>

        </div>
      </main>
    </div>
  );
}

