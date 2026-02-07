import { useState } from 'react';
import { WarmCard } from '@app/components/WarmCard';
import { WarmButton } from '@app/components/WarmButton';
import { PaymentMethodModal } from '@app/components/PaymentMethodModal';
import { 
  CreditCard, 
  Check, 
  AlertCircle, 
  Clock,
  Zap,
  TrendingUp,
  X,
  Calendar,
  Download,
  Receipt,
  Plus,
  Edit2,
  Building,
  Mail,
  PieChart,
  BarChart3,
  ArrowRight
} from 'lucide-react';
import { CurrencyDisplay } from '@app/components/CurrencyDisplay';
import { Input } from '@app/components/ui/input';
import { Label } from '@app/components/ui/label';
import { toast } from 'sonner';

type SubscriptionStatus = 'trial' | 'active' | 'past_due' | 'cancelled' | 'expired';

type Plan = {
  id: string;
  name: string;
  price: number;
  interval: 'month' | 'year';
  features: string[];
  recommended?: boolean;
};

type Invoice = {
  id: string;
  date: string;
  amount: number;
  status: 'paid' | 'pending' | 'failed';
  pdfUrl?: string;
};

export function Billing() {
  const [currentPlan] = useState<Plan>({
    id: 'pro',
    name: 'Pro Pakett',
    price: 29,
    interval: 'month',
    features: ['Kuni 10,000 kinkekaarti kuus', 'Piiramatu arv kampaaniaid', 'Täiustatud analüütika', 'Oma bränding', 'API ligipääs', 'Prioriteetne tugi'],
  });

  const [subscriptionStatus] = useState<SubscriptionStatus>('active');
  const [trialEndsAt] = useState('15.02.2024');
  const [currentPeriodEnd] = useState('01.03.2024');
  const [paymentMethod] = useState({
    type: 'card',
    last4: '4242',
    brand: 'Visa',
    expiryMonth: 12,
    expiryYear: 2025,
  });

  const [billingDetails, setBillingDetails] = useState({
      companyName: 'Fashion Store OÜ',
      vatNumber: 'EE123456789',
      address: 'Narva mnt 7, Tallinn 10117',
      email: 'arved@fashionstore.com'
  });

  const [isEditingBilling, setIsEditingBilling] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const plans: Plan[] = [
    {
      id: 'starter',
      name: 'Starter',
      price: 19,
      interval: 'month',
      features: [
        'Kuni 1,000 kinkekaarti kuus',
        '5 aktiivset kampaaniat',
        'Baasanalüütika',
        'QR koodide genereerimine',
        'E-posti tugi',
      ],
    },
    {
      id: 'pro',
      name: 'Pro',
      price: 29,
      interval: 'month',
      features: [
        'Kuni 10,000 kinkekaarti kuus',
        'Piiramatu arv kampaaniaid',
        'Täiustatud analüütika',
        'Oma bränding',
        'API ligipääs',
        'Prioriteetne tugi',
      ],
      recommended: true,
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 39,
      interval: 'month',
      features: [
        'Piiramatu maht',
        'Piiramatu arv kampaaniaid',
        'White-label lahendus',
        'Mitme asukoha tugi',
        'Personaalne haldur',
        '24/7 telefoni tugi',
        'Eritingimused',
      ],
    },
  ];

  const invoices: Invoice[] = [
    { id: 'ARVE-2024-001', date: '01.01.2024', amount: 29, status: 'paid' },
    { id: 'ARVE-2023-112', date: '01.12.2023', amount: 29, status: 'paid' },
    { id: 'ARVE-2023-105', date: '01.11.2023', amount: 29, status: 'paid' },
  ];

  const getStatusConfig = (status: SubscriptionStatus) => {
    switch (status) {
      case 'trial':
        return {
          label: 'Prooviperiood',
          color: 'bg-gradient-to-br from-[#9DB5A5] to-[#7FA090] text-white',
          icon: Clock,
        };
      case 'active':
        return {
          label: 'Aktiivne',
          color: 'bg-gradient-to-br from-[#9DB5A5] to-[#7FA090] text-white',
          icon: Check,
        };
      case 'past_due':
        return {
          label: 'Makse ebaõnnestus',
          color: 'bg-gradient-to-br from-[#E17B5C] to-[#D16B4C] text-white',
          icon: AlertCircle,
        };
      case 'cancelled':
        return {
          label: 'Tühistatud',
          color: 'bg-[#8B7355] text-white',
          icon: X,
        };
      case 'expired':
        return {
          label: 'Aegunud',
          color: 'bg-[#8B7355] text-white',
          icon: AlertCircle,
        };
    }
  };

  const statusConfig = getStatusConfig(subscriptionStatus);
  const StatusIcon = statusConfig.icon;

  const handleChangePlan = (planId: string) => {
    toast.success(`Pakett vahetatud: ${plans.find(p => p.id === planId)?.name}`);
  };

  const handleUpdatePayment = () => {
    setIsPaymentModalOpen(true);
  };

  const handlePaymentSave = (data: any) => {
    console.log('Payment data:', data);
    toast.success('Makseviis uuendatud edukalt!');
  };

  const handleCancelSubscription = () => {
    toast.error('Tellimus tühistatud');
  };

  const handleDownloadInvoice = (invoiceId: string) => {
    toast.success('Arve allalaadimine algas');
  };

  const handleSaveBillingDetails = () => {
     setIsEditingBilling(false);
     toast.success('Arve andmed salvestatud');
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      {/* Payment Method Modal */}
      <PaymentMethodModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onSave={handlePaymentSave}
      />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#2D2721]">Finantsid ja Arved</h1>
          <p className="text-[#6B5744] mt-1">Halda oma tellimust, makseviise ja ettevõtte andmeid</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-[#8B7355] bg-white px-3 py-1.5 rounded-full border border-[#E7DCC7] shadow-sm">
           <Zap className="w-4 h-4 text-[#FFC857] fill-[#FFC857]" />
           Järgmine makse: <strong>29.00€</strong> ({currentPeriodEnd})
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         
         {/* Left Column: Plan & Usage */}
         <div className="lg:col-span-2 space-y-6">
            
            {/* Current Plan Card */}
            <WarmCard padding="lg" className="relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-[#FFC857]/10 rounded-bl-full -mr-8 -mt-8 pointer-events-none"></div>
               
               <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 mb-8 relative z-10">
                  <div>
                     <div className="flex items-center gap-3 mb-2">
                        <h2 className="text-2xl font-bold text-[#2D2721]">Sinu Pakett</h2>
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${statusConfig.color}`}>
                           <StatusIcon className="h-3 w-3" />
                           {statusConfig.label}
                        </span>
                     </div>
                     <p className="text-[#6B5744] text-lg">
                        Kasutad hetkel <span className="font-bold text-[#2D2721]">{currentPlan.name}</span> paketti
                     </p>
                  </div>
                  <div className="text-right">
                     <div className="text-4xl font-bold text-[#2D2721] flex items-baseline justify-end gap-1">
                        <CurrencyDisplay amount={currentPlan.price} currency="EUR" />
                        <span className="text-lg text-[#8B7355] font-normal">/kuu</span>
                     </div>
                     <div className="text-sm text-[#8B7355] mt-1">
                        Uuendab automaatselt {currentPeriodEnd}
                     </div>
                  </div>
               </div>

               {/* Usage Stats */}
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  <div className="bg-white/50 p-4 rounded-xl border border-[#E7DCC7]">
                     <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-bold text-[#6B5744]">Kinkekaarte kuus</span>
                        <span className="text-xs font-bold text-[#2D2721]">4,250 / 10,000</span>
                     </div>
                     <div className="h-2 bg-[#E7DCC7] rounded-full overflow-hidden">
                        <div className="h-full bg-[#00D098] w-[42%] rounded-full"></div>
                     </div>
                  </div>
                  <div className="bg-white/50 p-4 rounded-xl border border-[#E7DCC7]">
                     <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-bold text-[#6B5744]">Salvestusruum</span>
                        <span className="text-xs font-bold text-[#2D2721]">1.2 GB / 5.0 GB</span>
                     </div>
                     <div className="h-2 bg-[#E7DCC7] rounded-full overflow-hidden">
                        <div className="h-full bg-[#FFC857] w-[24%] rounded-full"></div>
                     </div>
                  </div>
               </div>

               <div className="flex flex-wrap gap-3 pt-6 border-t border-[#E7DCC7]/50">
                  <WarmButton variant="outline" onClick={handleUpdatePayment} className="bg-white">
                     <CreditCard className="h-4 w-4 mr-2" />
                     Muuda makseviisi
                  </WarmButton>
                  <WarmButton variant="ghost" className="text-[#E17B5C] hover:text-[#C56041] hover:bg-[#FFF9ED]" onClick={handleCancelSubscription}>
                     Tühista tellimus
                  </WarmButton>
               </div>
            </WarmCard>

            {/* Invoices */}
            <div>
               <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-[#2D2721]">Maksete Ajalugu</h2>
                  <WarmButton variant="ghost" size="sm" className="text-[#8B7355]">Vaata kõiki</WarmButton>
               </div>
               <WarmCard padding="none" className="overflow-hidden bg-white">
                  <div className="divide-y divide-[#FAF7F2]">
                     {invoices.map((invoice) => (
                        <div
                           key={invoice.id}
                           className="flex items-center justify-between p-4 hover:bg-[#FAF7F2] transition-colors group"
                        >
                           <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-lg bg-[#FAF7F2] group-hover:bg-white border border-[#E7DCC7] flex items-center justify-center transition-colors">
                                 <Receipt className="h-5 w-5 text-[#8B7355]" />
                              </div>
                              <div>
                                 <div className="font-bold text-[#2D2721] text-sm">{invoice.id}</div>
                                 <div className="text-xs text-[#8B7355]">{invoice.date}</div>
                              </div>
                           </div>
                           <div className="flex items-center gap-4">
                              <div className="text-right hidden sm:block">
                                 <div className="font-bold text-[#2D2721]">
                                    <CurrencyDisplay amount={invoice.amount} currency="EUR" />
                                 </div>
                                 <div className="text-[10px] font-bold uppercase tracking-wider text-[#00D098]">
                                    {invoice.status === 'paid' ? 'Tasutud' : 'Ootel'}
                                 </div>
                              </div>
                              <button
                                 onClick={() => handleDownloadInvoice(invoice.id)}
                                 className="p-2 text-[#8B7355] hover:text-[#2D2721] hover:bg-[#E7DCC7]/30 rounded-lg transition-colors"
                                 title="Lae alla PDF"
                              >
                                 <Download className="h-4 w-4" />
                              </button>
                           </div>
                        </div>
                     ))}
                  </div>
               </WarmCard>
            </div>
         </div>

         {/* Right Column: Billing Details & Upgrade */}
         <div className="space-y-6">
            
            {/* Billing Details */}
            <WarmCard padding="lg" className="bg-[#FAF7F2] border-[#E7DCC7]">
               <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-[#2D2721] flex items-center gap-2">
                     <Building className="w-4 h-4 text-[#E17B5C]" />
                     Arve Andmed
                  </h3>
                  <button 
                     onClick={() => isEditingBilling ? handleSaveBillingDetails() : setIsEditingBilling(true)}
                     className="text-xs font-bold text-[#8B7355] hover:text-[#2D2721] hover:underline"
                  >
                     {isEditingBilling ? 'Salvesta' : 'Muuda'}
                  </button>
               </div>
               
               {isEditingBilling ? (
                  <div className="space-y-3 animate-in fade-in">
                     <div>
                        <Label className="text-xs">Ettevõtte nimi</Label>
                        <Input 
                           value={billingDetails.companyName} 
                           onChange={e => setBillingDetails({...billingDetails, companyName: e.target.value})} 
                           className="h-8 bg-white text-sm"
                        />
                     </div>
                     <div>
                        <Label className="text-xs">KMKR nr</Label>
                        <Input 
                           value={billingDetails.vatNumber} 
                           onChange={e => setBillingDetails({...billingDetails, vatNumber: e.target.value})} 
                           className="h-8 bg-white text-sm"
                        />
                     </div>
                     <div>
                        <Label className="text-xs">Aadress</Label>
                        <Input 
                           value={billingDetails.address} 
                           onChange={e => setBillingDetails({...billingDetails, address: e.target.value})} 
                           className="h-8 bg-white text-sm"
                        />
                     </div>
                     <div>
                        <Label className="text-xs">E-mail arvetele</Label>
                        <Input 
                           value={billingDetails.email} 
                           onChange={e => setBillingDetails({...billingDetails, email: e.target.value})} 
                           className="h-8 bg-white text-sm"
                        />
                     </div>
                  </div>
               ) : (
                  <div className="space-y-3 text-sm">
                     <div className="font-bold text-[#2D2721]">{billingDetails.companyName}</div>
                     <div className="text-[#6B5744] flex items-center gap-2">
                        <span className="w-4 flex justify-center opacity-50">#</span> {billingDetails.vatNumber}
                     </div>
                     <div className="text-[#6B5744] flex items-center gap-2">
                        <span className="w-4 flex justify-center opacity-50"><Building className="w-3 h-3" /></span> {billingDetails.address}
                     </div>
                     <div className="text-[#6B5744] flex items-center gap-2">
                        <span className="w-4 flex justify-center opacity-50"><Mail className="w-3 h-3" /></span> {billingDetails.email}
                     </div>
                  </div>
               )}
            </WarmCard>

            {/* Upgrade Promo */}
            <div className="bg-[#2D2721] rounded-2xl p-6 text-[#E7DCC7] relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-[#FFC857] rounded-full blur-[60px] opacity-20"></div>
               <h3 className="text-xl font-bold text-white mb-2 relative z-10">Vajad rohkem võimsust?</h3>
               <p className="text-sm opacity-80 mb-6 relative z-10">Enterprise pakett pakub piiramatut mahtu ja personaalset haldurit.</p>
               
               <div className="space-y-3 mb-6 relative z-10">
                  <div className="flex items-center gap-2 text-sm">
                     <Check className="w-4 h-4 text-[#00D098]" /> Piiramatu maht
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                     <Check className="w-4 h-4 text-[#00D098]" /> White-label lahendus
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                     <Check className="w-4 h-4 text-[#00D098]" /> 24/7 tugi
                  </div>
               </div>

               <WarmButton className="w-full bg-[#FFC857] text-[#2D2721] hover:bg-[#FFD480] border-none relative z-10 font-bold">
                  Vaata Enterprise paketti <ArrowRight className="w-4 h-4 ml-2" />
               </WarmButton>
            </div>

         </div>
      </div>

      {/* Plans Comparison */}
      <div className="pt-8 border-t border-[#E7DCC7]">
         <h2 className="text-2xl font-bold text-[#2D2721] mb-6 text-center">Kõik Paketid</h2>
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           {plans.map((plan) => (
             <WarmCard
               key={plan.id}
               padding="lg"
               className={`relative transition-all duration-300 ${plan.recommended ? 'border-2 border-[#FFC857] shadow-lg scale-105 z-10' : 'hover:border-[#E7DCC7] hover:shadow-md'}`}
             >
               {plan.recommended && (
                 <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 inline-flex items-center gap-1 px-4 py-1 rounded-full bg-[#FFC857] text-[#2D2721] text-xs font-bold uppercase tracking-wider shadow-sm">
                   <Zap className="h-3 w-3" />
                   Soovitatud
                 </div>
               )}
               <h3 className="text-xl font-bold text-[#2D2721] mb-2 text-center">{plan.name}</h3>
               <div className="flex items-baseline justify-center gap-1 mb-6">
                 <span className="text-4xl font-bold text-[#2D2721]">
                   <CurrencyDisplay amount={plan.price} currency="EUR" />
                 </span>
                 <span className="text-[#8B7355]">/kuu</span>
               </div>
               <ul className="space-y-4 mb-8">
                 {plan.features.map((feature, idx) => (
                   <li key={idx} className="flex items-start gap-3">
                     <div className="w-5 h-5 rounded-full bg-[#E6F4EA] flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="h-3 w-3 text-[#00D098]" />
                     </div>
                     <span className="text-sm text-[#6B5744] font-medium">{feature}</span>
                   </li>
                 ))}
               </ul>
               <WarmButton
                 className="w-full"
                 variant={plan.id === currentPlan.id ? 'outline' : 'default'}
                 disabled={plan.id === currentPlan.id}
                 onClick={() => handleChangePlan(plan.id)}
               >
                 {plan.id === currentPlan.id ? 'Sinu praegune pakett' : 'Vali pakett'}
               </WarmButton>
             </WarmCard>
           ))}
         </div>
      </div>
    </div>
  );
}