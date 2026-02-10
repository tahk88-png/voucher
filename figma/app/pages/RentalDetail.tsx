import { useState, useEffect } from 'react';
import { useParams, useNavigate } from '@/lib/router-shim';
import { WarmButton } from '@app/components/WarmButton';
import { ImageWithFallback } from '@app/components/figma/ImageWithFallback';
import { 
  ArrowLeft, 
  MapPin, 
  CheckCircle2, 
  ShieldCheck, 
  ChevronRight, 
  ArrowRight,
  ChevronDown,
  Star, 
  Calendar as CalendarIcon,
  AlertCircle,
  Clock,
  Battery,
  Cable,
  CalendarCheck,
  Share2,
  Facebook,
  Twitter,
  Linkedin,
  Copy,
  PlayCircle,
  PackageCheck,
  TrendingDown,
  FileText,
  BookOpen
} from 'lucide-react';
import { toast } from 'sonner';
import { UnifiedData, Rental } from '@services/unifiedData';
import { useCart } from '@app/contexts/CartContext';
import { ExternalService } from '@services/externalService';
import { SEOHead } from '@app/components/SEOHead';
import { format, differenceInDays, addDays, isSameDay } from 'date-fns';
import { et } from 'date-fns/locale';
import { DayPicker, DateRange } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { copyToClipboard } from '@app/utils/clipboard';

// RENTAL ADD-ONS MOCK
const RENTAL_ADDONS = [
  { id: 'insurance_full', name: 'TÃ¤iskindlustus', price: 5.00, perDay: true, icon: ShieldCheck, description: 'Omavastutus 0â‚¬.' },
  { id: 'extra_battery', name: 'Lisaaku', price: 3.00, perDay: true, icon: Battery, description: 'Ole alati valmis.' },
  { id: 'cables_set', name: 'Kaablite komplekt', price: 2.00, perDay: false, icon: Cable, description: 'KÃµik vajalikud Ã¼leminekud.' },
];

type MediaItem = {
  type: 'image' | 'video';
  url: string;
  thumbnail?: string;
};

// Mock booked dates (e.g., 3 days starting from tomorrow + 5 days)
const getMockBookedDates = () => {
    const today = new Date();
    return [
        addDays(today, 5),
        addDays(today, 6),
        addDays(today, 7),
        addDays(today, 15),
    ];
};

export function RentalDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();

  const [rentalItem, setRentalItem] = useState<Rental | null>(null);
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  
  // Calendar State
  const [range, setRange] = useState<DateRange | undefined>();
  const [isShareOpen, setIsShareOpen] = useState(false);
  
  // Time Selection
  const [pickupTime, setPickupTime] = useState('10:00');
  const [returnTime, setReturnTime] = useState('10:00');
  
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [checkingStock, setCheckingStock] = useState(false);
  
  const [bookedDates, setBookedDates] = useState<Date[]>([]);

  useEffect(() => {
    if (id) {
       const found = UnifiedData.getRentalById(id);
       if (found) {
          setRentalItem(found);
          
          // Setup media items
          const items: MediaItem[] = [];
          items.push({ type: 'image', url: found.image });
          
          if (found.videoUrl) {
             items.push({ type: 'video', url: found.videoUrl, thumbnail: found.image });
          }
          
          items.push({ type: 'image', url: found.image });
          items.push({ type: 'image', url: found.image });
          
          setMediaItems(items);
          
          // Load booked dates
          setBookedDates(getMockBookedDates());
       }
    }
  }, [id]);

  const toggleAddon = (addonId: string) => {
    setSelectedAddons(prev => 
      prev.includes(addonId) 
        ? prev.filter(id => id !== addonId) 
        : [...prev, addonId]
    );
  };

  const calculateDays = () => {
    if (!range?.from) return 0;
    const end = range.to || range.from;
    return differenceInDays(end, range.from) + 1;
  };

  const days = calculateDays();
  const minDays = rentalItem?.minRentalDays || 1;
  const isTooShort = days > 0 && days < minDays;

  const getActivePrice = (daysCount: number) => {
    if (!rentalItem) return 0;
    if (!rentalItem.priceTiers || rentalItem.priceTiers.length === 0) return rentalItem.pricePerDay;
    
    const tiers = [...rentalItem.priceTiers].sort((a, b) => b.minDays - a.minDays);
    const activeTier = tiers.find(t => daysCount >= t.minDays);
    
    return activeTier ? activeTier.price : rentalItem.pricePerDay;
  };

  const activePricePerDay = getActivePrice(days || minDays);

  const calculateTotal = () => {
    if (!rentalItem) return 0;
    if (days === 0) return 0;

    const basePrice = activePricePerDay * days;
    
    const addonsPrice = selectedAddons.reduce((sum, id) => {
      const addon = RENTAL_ADDONS.find(a => a.id === id);
      if (!addon) return sum;
      return sum + (addon.price * (addon.perDay ? days : 1));
    }, 0);

    return basePrice + addonsPrice;
  };

  const handleBook = async () => {
    if (!range?.from) {
      toast.error('Palun vali rendiperiood kalendrist');
      return;
    }
    
    if (isTooShort) {
       toast.error(`Minimaalne rendiperiood on ${minDays} pÃ¤eva`);
       return;
    }

    const start = range.from;
    const end = range.to || range.from;

    setCheckingStock(true);
    
    try {
      const availability = await ExternalService.checkStock(rentalItem!.id);
      
      if (!availability.isAvailable) {
         toast.error("Vabandust, see toode pole valitud perioodil saadaval.");
         return;
      }

      const addonNames = selectedAddons.map(id => RENTAL_ADDONS.find(a => a.id === id)?.name).join(', ');
      
      const timeInfo = `VÃ¤ljastus: ${pickupTime}, Tagastus: ${returnTime}`;

      addItem({
        sourceId: rentalItem!.id,
        type: 'rental',
        name: rentalItem!.title,
        price: calculateTotal(),
        quantity: 1,
        image: rentalItem!.image,
        rentalPeriod: {
          start: start.toISOString(),
          end: end.toISOString(),
          days: days
        },
        variant: `${timeInfo}${addonNames ? ` | Lisad: ${addonNames}` : ''}`
      });

      await ExternalService.syncBooking(rentalItem!.id, { start: start.toISOString(), end: end.toISOString() });
      
      toast.success('Broneering lisatud ostukorvi!');
      navigate('/cart');

    } catch (e) {
      console.error(e);
      toast.error("Viga broneerimisel");
    } finally {
      setCheckingStock(false);
    }
  };

  const addToGoogleCalendar = () => {
    if (!range?.from || isTooShort) {
      toast.error(isTooShort ? `Vali vÃ¤hemalt ${minDays} pÃ¤eva` : "Vali enne kuupÃ¤evad");
      return;
    }

    const formatDate = (date: Date) => date.toISOString().replace(/-|:|\.\d\d\d/g, "");
    
    const [pickupH, pickupM] = pickupTime.split(':').map(Number);
    const [returnH, returnM] = returnTime.split(':').map(Number);

    const start = range.from!;
    const end = range.to || range.from!;

    const startDate = new Date(start);
    startDate.setHours(pickupH, pickupM, 0);
    const endDate = new Date(end);
    endDate.setHours(returnH, returnM, 0);

    const startStr = formatDate(startDate);
    const endStr = formatDate(endDate);

    const title = `Rent: ${rentalItem!.title}`;
    const details = `Rendiperiood GiftHubist.\nToode: ${rentalItem!.title}\nAsukoht: ${rentalItem!.location}\nKellaajad: ${pickupTime} - ${returnTime}`;
    const location = rentalItem!.location;

    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${startStr}/${endStr}&details=${encodeURIComponent(details)}&location=${encodeURIComponent(location)}`;
    
    window.open(url, '_blank');
  };

  const handleShare = async (platform?: string) => {
    const url = window.location.href;
    const text = `Vaata seda renditoodet: ${rentalItem?.title}`;

    if (platform === 'facebook') {
       window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
    } else if (platform === 'twitter') {
       window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`, '_blank');
    } else if (platform === 'linkedin') {
       window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
    } else {
       if (navigator.share) {
          try {
             await navigator.share({ title: rentalItem?.title, text, url });
          } catch (err) {
             console.log('Share cancelled');
          }
       } else {
          await copyToClipboard(url);
          toast.success('Link kopeeritud!');
       }
    }
    setIsShareOpen(false);
  };

  const generateTimeSlots = (startHour: number, endHour: number, stepMinutes: number) => {
    const slots: string[] = [];
    for (let h = startHour; h <= endHour; h++) {
      for (let m = 0; m < 60; m += stepMinutes) {
        if (h === endHour && m > 0) break;
        const time = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
        slots.push(time);
      }
    }
    return slots;
  };

  const timeOptions = generateTimeSlots(9, 18, 5);

  if (!rentalItem) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#FAF7F2]">
          <SEOHead title="Laen..." noIndex />
          <div className="animate-spin w-8 h-8 border-4 border-[#E7DCC7] border-t-[#2D2721] rounded-full"></div>
        </div>
      );
  }

  const activeMedia = mediaItems[activeMediaIndex] || { type: 'image', url: rentalItem.image };

  return (
    <div className="min-h-screen bg-[#FAF7F2] pb-12">
      <SEOHead 
        title={`Rendi ${rentalItem.title}`}
        description={rentalItem.description || `Rendi professionaalne ${rentalItem.title}.`}
        image={rentalItem.image}
        type="product"
      />
      
      {/* Context Bar */}
      <div className="bg-white border-b border-[#E7DCC7] sticky top-16 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
           <button onClick={() => navigate('/rentals')} className="text-sm font-medium text-[#6B5744] hover:text-[#2D2721] flex items-center gap-2 group transition-colors">
             <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Tagasi renti
           </button>
           <div className="hidden md:flex items-center gap-2 text-sm text-[#8B7355]">
              <span>Seadmed</span>
              <ChevronRight className="w-3 h-3 text-[#E7DCC7]" />
              <span>{rentalItem.category}</span>
           </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        
        {/* LEFT COLUMN: Info & Specs (7 cols) */}
        <div className="lg:col-span-7 space-y-8">
          
          {/* Gallery */}
          <div className="space-y-4">
            <div className="aspect-video rounded-3xl overflow-hidden shadow-warm-lg bg-black relative group">
              {activeMedia.type === 'video' ? (
                 <iframe 
                   src={activeMedia.url} 
                   title="Rental Video"
                   allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                   allowFullScreen
                   className="w-full h-full object-cover"
                 />
              ) : (
                <ImageWithFallback 
                  src={activeMedia.url} 
                  alt="Main view" 
                  className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
                />
              )}
              
              <div className="absolute top-4 left-4 flex gap-2 pointer-events-none">
                 <div className="bg-[#2D2721] text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                    <Clock className="w-3 h-3" /> Min. {minDays} pÃ¤eva
                 </div>
                 {/* Stock Badge */}
                 {rentalItem.stock > 0 && (
                    <div className="bg-[#00D098] text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                       <PackageCheck className="w-3 h-3" /> Laos: {rentalItem.stock}
                    </div>
                 )}
              </div>
              
              {/* Share Button Overlay */}
              <div className="absolute top-4 right-4 relative pointer-events-none">
                  <div className="pointer-events-auto">
                     <button 
                        onClick={() => setIsShareOpen(!isShareOpen)}
                        className="p-3 bg-white/90 backdrop-blur rounded-full text-[#2D2721] shadow-sm hover:scale-110 transition-transform"
                     >
                        <Share2 className="w-5 h-5" />
                     </button>
                     
                     {/* Share Dropdown */}
                     {isShareOpen && (
                        <div className="absolute top-full right-0 mt-2 bg-white rounded-xl shadow-xl border border-[#E7DCC7] p-2 min-w-[150px] z-30 animate-in fade-in zoom-in-95 duration-200">
                           <button onClick={() => handleShare('facebook')} className="flex items-center gap-3 w-full p-2 hover:bg-[#FAF7F2] rounded-lg text-sm font-bold text-[#6B5744]">
                              <Facebook className="w-4 h-4 text-[#1877F2]" /> Facebook
                           </button>
                           <button onClick={() => handleShare('twitter')} className="flex items-center gap-3 w-full p-2 hover:bg-[#FAF7F2] rounded-lg text-sm font-bold text-[#6B5744]">
                              <Twitter className="w-4 h-4 text-[#1DA1F2]" /> Twitter
                           </button>
                           <button onClick={() => handleShare('linkedin')} className="flex items-center gap-3 w-full p-2 hover:bg-[#FAF7F2] rounded-lg text-sm font-bold text-[#6B5744]">
                              <Linkedin className="w-4 h-4 text-[#0A66C2]" /> LinkedIn
                           </button>
                           <div className="h-px bg-[#E7DCC7] my-1"></div>
                           <button onClick={() => handleShare()} className="flex items-center gap-3 w-full p-2 hover:bg-[#FAF7F2] rounded-lg text-sm font-bold text-[#6B5744]">
                              <Copy className="w-4 h-4" /> Kopeeri link
                           </button>
                        </div>
                     )}
                  </div>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-4">
              {mediaItems.map((item, idx) => (
                <div 
                  key={idx} 
                  onClick={() => setActiveMediaIndex(idx)}
                  className={`aspect-[4/3] rounded-xl overflow-hidden cursor-pointer border-2 transition-all relative ${
                     activeMediaIndex === idx ? 'border-[#E17B5C] ring-2 ring-[#E17B5C]/20' : 'border-transparent hover:border-[#E7DCC7]'
                  }`}
                >
                  <ImageWithFallback 
                     src={item.type === 'video' ? (item.thumbnail || rentalItem.image) : item.url} 
                     alt={`Thumb ${idx}`} 
                     className="w-full h-full object-cover" 
                  />
                  {item.type === 'video' && (
                     <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                        <PlayCircle className="w-6 h-6 text-white drop-shadow-md" />
                     </div>
                  )}
                  {activeMediaIndex === idx && <div className="absolute inset-0 bg-[#E17B5C]/10" />}
                </div>
              ))}
            </div>
          </div>

          {/* Details Tabs / Sections */}
          <div className="bg-white rounded-3xl p-8 border border-[#E7DCC7] space-y-8">
             
             {/* Description */}
             <div>
                <h2 className="text-2xl font-display font-bold text-[#2D2721] mb-4">Kirjeldus</h2>
                <p className="text-[#6B5744] leading-relaxed text-lg whitespace-pre-line">
                   {rentalItem.description || "See seade on mÃµeldud professionaalidele, kes vajavad usaldusvÃ¤Ã¤rsust. Enne iga vÃ¤ljastust kontrollitakse seade meie tehnikute poolt Ã¼le."}
                </p>
             </div>

             {/* Usage Guide */}
             {rentalItem.usageGuide && (
                <div className="bg-[#FAF7F2] p-6 rounded-2xl border border-[#E7DCC7]">
                   <h3 className="font-bold text-[#2D2721] mb-3 flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-[#E17B5C]" />
                      LÃ¼hijuhend
                   </h3>
                   <p className="text-[#6B5744] whitespace-pre-line text-sm leading-relaxed">
                      {rentalItem.usageGuide}
                   </p>
                </div>
             )}
             
             {/* Manual Link */}
             {rentalItem.manualUrl && (
                <div>
                   <a 
                     href={rentalItem.manualUrl} 
                     target="_blank" 
                     rel="noopener noreferrer"
                     className="inline-flex items-center gap-2 text-[#E17B5C] font-bold hover:underline"
                   >
                      <FileText className="w-4 h-4" />
                      Ava kasutusjuhend (PDF)
                   </a>
                </div>
             )}

             <div className="h-px bg-[#E7DCC7]"></div>

             <div className="grid md:grid-cols-2 gap-8">
                <div>
                   <h3 className="font-bold text-[#2D2721] mb-4 flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-[#00D098]" /> Komplektis</h3>
                   <ul className="space-y-3">
                      {['Kandekott', 'Laadija', 'MÃ¤lukaart 64GB', 'Puhastuslapp'].map((item, i) => (
                         <li key={i} className="flex items-center gap-3 text-[#6B5744] bg-[#FAF7F2] p-2 rounded-lg">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#E7DCC7]"></div>
                            {item}
                         </li>
                      ))}
                   </ul>
                </div>
                <div>
                   <h3 className="font-bold text-[#2D2721] mb-4 flex items-center gap-2"><MapPin className="w-5 h-5 text-[#E17B5C]" /> Pakkuja & Asukoht</h3>
                   <div className="bg-[#FAF7F2] p-5 rounded-xl border border-[#E7DCC7] flex flex-col gap-4">
                       {/* Merchant Info */}
                       <div className="flex items-center gap-3">
                           {rentalItem.merchantLogo ? (
                               <img src={rentalItem.merchantLogo} alt={rentalItem.merchantName} className="w-12 h-12 rounded-full bg-white shadow-sm object-cover border border-[#E7DCC7]" />
                           ) : (
                               <div className="w-12 h-12 rounded-full bg-white shadow-sm border border-[#E7DCC7] flex items-center justify-center font-bold text-[#2D2721]">
                                   {rentalItem.merchantName?.charAt(0)}
                               </div>
                           )}
                           <div>
                               <div className="font-bold text-[#2D2721] text-lg leading-tight">{rentalItem.merchantName || "Partner"}</div>
                               <div className="text-xs text-[#8B7355] flex items-center gap-1 mt-0.5">
                                   <ShieldCheck className="w-3 h-3 text-[#00D098]" />
                                   <span className="font-medium">Kontrollitud partner</span>
                               </div>
                           </div>
                       </div>
                       
                       <div className="h-px bg-[#E7DCC7]/50 w-full"></div>
                       
                       {/* Location Info */}
                       <div>
                           <div className="flex items-start gap-2 mb-1">
                               <MapPin className="w-4 h-4 text-[#8B7355] mt-0.5 flex-shrink-0" />
                               <div className="font-bold text-[#2D2721] text-sm">{rentalItem.location}</div>
                           </div>
                           <div className="text-xs text-[#8B7355] pl-6 mb-2">Avatud E-R 9:00 - 18:00</div>
                           <button className="text-xs font-bold text-[#E17B5C] pl-6 hover:underline">Vaata asukohta kaardil</button>
                       </div>
                   </div>
                </div>
             </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Calendar & Booking (5 cols) */}
        <div className="lg:col-span-5 relative">
           <div className="sticky top-32 space-y-6">
              
              <div className="bg-white rounded-3xl p-6 border border-[#E7DCC7] shadow-xl">
                 
                 {/* Header Price */}
                 <div className="flex justify-between items-end mb-6 border-b border-[#FAF7F2] pb-6">
                    <div>
                       <h1 className="text-xl font-bold text-[#2D2721] mb-1">{rentalItem.title}</h1>
                       <div className="flex items-baseline gap-1">
                          <span className={`text-3xl font-bold ${days >= minDays && activePricePerDay < rentalItem.pricePerDay ? 'text-[#00D098]' : 'text-[#E17B5C]'}`}>
                             {activePricePerDay}â‚¬
                          </span>
                          <span className="text-[#8B7355] font-medium">/ pÃ¤ev</span>
                          
                          {days >= minDays && activePricePerDay < rentalItem.pricePerDay && (
                             <span className="ml-2 text-sm text-[#8B7355] line-through">{rentalItem.pricePerDay}â‚¬</span>
                          )}
                       </div>
                    </div>
                    <div className="text-right">
                       <div className="flex items-center gap-1 font-bold text-[#FFC857] justify-end">
                          <Star className="fill-current w-4 h-4" /> {rentalItem.rating || 4.9}
                       </div>
                       <div className="text-xs text-[#8B7355] underline cursor-pointer">Lugeda reegleid</div>
                    </div>
                 </div>

                 {/* Visual Price Grid (Rentster style) */}
                 <div className="grid grid-cols-4 gap-0 mb-6 rounded-xl overflow-hidden border border-[#E7DCC7] divide-x divide-[#E7DCC7] shadow-sm">
                    {[
                       { label: '1 pÃ¤ev', days: 1 },
                       { label: '3 pÃ¤eva', days: 3 },
                       { label: '1 nÃ¤dal', days: 7 },
                       { label: '1 kuu', days: 30 }
                    ].map((tier) => {
                       const tierPricePerDay = getActivePrice(tier.days);
                       const totalPrice = tierPricePerDay * tier.days;
                       const isActive = days === tier.days; 
                       
                       return (
                          <div 
                             key={tier.days} 
                             className={`flex flex-col items-center justify-center p-3 text-center transition-colors cursor-pointer hover:bg-[#FAF7F2] ${isActive ? 'bg-[#FFF9ED] ring-inset ring-2 ring-[#E17B5C]' : 'bg-white'}`}
                          >
                             <div className={`text-lg md:text-xl font-bold leading-none mb-1 ${isActive ? 'text-[#E17B5C]' : 'text-[#2D2721]'}`}>
                                {totalPrice}â‚¬
                             </div>
                             <div className="text-[10px] md:text-xs font-medium text-[#8B7355] uppercase tracking-wide">
                                {tier.label}
                             </div>
                             {tier.days > 1 && tierPricePerDay < rentalItem.pricePerDay && (
                                <div className="mt-1 text-[9px] text-[#00D098] font-bold bg-[#00D098]/10 px-1.5 py-0.5 rounded-full">
                                   -{Math.round((1 - tierPricePerDay/rentalItem.pricePerDay)*100)}%
                                </div>
                             )}
                          </div>
                       );
                    })}
                 </div>

                 {/* Calendar */}
                 <div className="mb-6 flex flex-col items-center bg-white border border-[#E7DCC7] rounded-3xl p-6 shadow-sm">
                    <style>{`
                       .rdp { --rdp-accent-color: #E17B5C; margin: 0; }
                       .rdp-month { width: 100%; }
                       .rdp-caption { text-align: left; padding-left: 1rem; }
                       
                       /* Range Middle (Light Orange) */
                       .rdp-day_range_middle:not([disabled]) { 
                          background-color: #FFF9ED !important; 
                          color: #E17B5C !important;
                          border-radius: 0 !important;
                       }
                       
                       /* Start & End (Dark Orange, Rounded sides) */
                       .rdp-day_range_start:not([disabled]) {
                          background-color: var(--rdp-accent-color) !important;
                          color: white !important;
                          border-top-left-radius: 50% !important;
                          border-bottom-left-radius: 50% !important;
                          border-top-right-radius: 0 !important;
                          border-bottom-right-radius: 0 !important;
                       }
                       .rdp-day_range_end:not([disabled]) {
                          background-color: var(--rdp-accent-color) !important;
                          color: white !important;
                          border-top-left-radius: 0 !important;
                          border-bottom-left-radius: 0 !important;
                          border-top-right-radius: 50% !important;
                          border-bottom-right-radius: 50% !important;
                       }

                       /* Single Day Selection */
                       .rdp-day_selected:not(.rdp-day_range_middle):not(.rdp-day_range_start):not(.rdp-day_range_end):not([disabled]) { 
                          background-color: var(--rdp-accent-color); 
                          color: white; 
                          border-radius: 50%;
                          font-weight: bold;
                       }

                       /* Booked Dates */
                       .booked-date { 
                          background-color: #FEE2E2 !important; 
                          color: #EF4444 !important; 
                          text-decoration: line-through;
                          opacity: 0.5;
                          pointer-events: none;
                       }
                       
                       .rdp-button:hover:not([disabled]):not(.rdp-day_selected) {
                          background-color: #FAF7F2;
                          color: #E17B5C;
                          font-weight: bold;
                       }
                    `}</style>
                    <div className="w-full overflow-x-auto flex justify-center">
                        <DayPicker
                           mode="range"
                           selected={range}
                           onSelect={setRange}
                           locale={et}
                           min={minDays}
                           disabled={[{ before: new Date() }, ...bookedDates]}
                           numberOfMonths={2}
                           pagedNavigation
                           weekStartsOn={1}
                           modifiers={{ booked: bookedDates }}
                           modifiersClassNames={{ booked: 'booked-date' }}
                           className="rdp-custom"
                        />
                    </div>
                    
                    {/* Calendar Legend */}
                    <div className="flex flex-wrap justify-center gap-6 mt-6 border-t border-[#FAF7F2] pt-4 w-full">
                        <div className="flex items-center gap-2 text-sm text-[#6B5744]">
                           <div className="w-4 h-4 rounded-full border border-[#E7DCC7] bg-white"></div>
                           <span>Vaba</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-[#6B5744]">
                           <div className="flex">
                              <div className="w-4 h-4 bg-[#E17B5C] rounded-l-full"></div>
                              <div className="w-4 h-4 bg-[#FFF9ED]"></div>
                              <div className="w-4 h-4 bg-[#E17B5C] rounded-r-full"></div>
                           </div>
                           <span>Sinu valik</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-[#6B5744]">
                           <div className="w-4 h-4 rounded-full bg-[#FEE2E2] border border-[#EF4444] opacity-50 relative overflow-hidden">
                              <div className="absolute inset-0 flex items-center justify-center transform -rotate-45 text-[#EF4444] text-[8px] font-bold">/</div>
                           </div>
                           <span className="text-[#EF4444]">Broneeritud</span>
                        </div>
                    </div>
                 </div>

                 {/* Duration Info & Time Selection */}
                 {days > 0 ? (
                    <div className="space-y-4 mb-6 animate-in slide-in-from-top-2 duration-300">
                      {isTooShort ? (
                         <div className="bg-[#FFF9ED] border border-[#FFC857] rounded-2xl p-4 flex items-center gap-3 text-[#B45309]">
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            <div className="text-sm font-bold">
                               Minimaalne rendiperiood on {minDays} pÃ¤eva. Palun vali pikem periood.
                            </div>
                         </div>
                      ) : (
                        <div className="bg-white border border-[#E17B5C] rounded-2xl p-5 shadow-sm relative overflow-hidden">
                           <div className="absolute top-0 left-0 w-1 h-full bg-[#E17B5C]"></div>
                           
                           <div className="flex items-center justify-between mb-4">
                              <div>
                                 <div className="text-xs text-[#8B7355] font-bold uppercase tracking-wider mb-1">Rendiperiood</div>
                                 <div className="font-bold text-lg text-[#2D2721] flex items-center gap-2">
                                    {range?.from && format(range.from, 'dd.MM')} 
                                    <ArrowRight className="w-4 h-4 text-[#E7DCC7]" /> 
                                    {(range?.to || range?.from) && format(range.to || range.from!, 'dd.MM')}
                                    <span className="text-sm font-normal text-[#8B7355] ml-1">({days} pÃ¤eva)</span>
                                 </div>
                              </div>
                              <CalendarIcon className="w-8 h-8 text-[#E17B5C] opacity-20" />
                           </div>
                           
                           {/* Visual Time Selectors */}
                           <div className="grid grid-cols-2 gap-4 border-t border-[#FAF7F2] pt-4">
                              <div>
                                 <label className="text-xs font-bold text-[#8B7355] block mb-2 flex items-center gap-1">
                                    VÃ¤ljastus (Alates)
                                 </label>
                                 <div className="relative">
                                   <select 
                                      value={pickupTime}
                                      onChange={(e) => setPickupTime(e.target.value)}
                                      className="w-full appearance-none bg-[#FAF7F2] border border-[#E7DCC7] rounded-xl py-2.5 pl-3 pr-8 text-sm font-bold text-[#2D2721] focus:outline-none focus:border-[#E17B5C] focus:ring-1 focus:ring-[#E17B5C]"
                                   >
                                      {timeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                                   </select>
                                   <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8B7355] pointer-events-none" />
                                 </div>
                              </div>
                              <div>
                                 <label className="text-xs font-bold text-[#8B7355] block mb-2 flex items-center gap-1">
                                    Tagastus (Kuni)
                                 </label>
                                 <div className="relative">
                                   <select 
                                      value={returnTime}
                                      onChange={(e) => setReturnTime(e.target.value)}
                                      className="w-full appearance-none bg-[#FAF7F2] border border-[#E7DCC7] rounded-xl py-2.5 pl-3 pr-8 text-sm font-bold text-[#2D2721] focus:outline-none focus:border-[#E17B5C] focus:ring-1 focus:ring-[#E17B5C]"
                                   >
                                      {timeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                                   </select>
                                   <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8B7355] pointer-events-none" />
                                 </div>
                              </div>
                           </div>
                        </div>
                      )}
                      
                      <button 
                        onClick={addToGoogleCalendar}
                        disabled={isTooShort}
                        className={`w-full flex items-center justify-center gap-2 p-3 rounded-xl text-xs font-bold text-[#6B5744] border border-transparent transition-all group hover:shadow-sm ${isTooShort ? 'opacity-50 cursor-not-allowed bg-[#FAF7F2]' : 'hover:bg-white hover:border-[#E7DCC7]'}`}
                      >
                        <CalendarCheck className="w-4 h-4 text-[#4285F4] group-hover:scale-110 transition-transform" />
                        Salvesta Google Kalendrisse
                      </button>
                    </div>
                 ) : (
                    <div className="bg-[#FAF7F2] rounded-xl p-4 mb-6 flex items-center gap-3 text-[#8B7355] border border-dashed border-[#E7DCC7]">
                       <AlertCircle className="w-5 h-5" />
                       <span className="text-sm">Palun vali kalendrist vÃ¤hemalt {minDays} pÃ¤eva</span>
                    </div>
                 )}

                 {/* Add-ons */}
                 <div className="space-y-3 mb-6">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#8B7355]">Soovitatud lisad</h3>
                    {RENTAL_ADDONS.map((addon) => {
                       const Icon = addon.icon;
                       const isSelected = selectedAddons.includes(addon.id);
                       return (
                          <div 
                             key={addon.id}
                             onClick={() => toggleAddon(addon.id)}
                             className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                                isSelected ? 'border-[#E17B5C] bg-[#FFF9ED]' : 'border-[#E7DCC7] hover:border-[#2D2721]'
                             }`}
                          >
                             <div className="flex items-center gap-3">
                                <Icon className={`w-4 h-4 ${isSelected ? 'text-[#E17B5C]' : 'text-[#8B7355]'}`} />
                                <span className="font-bold text-sm text-[#2D2721]">{addon.name}</span>
                             </div>
                             <div className="text-sm font-bold">
                                +{addon.price}â‚¬ {addon.perDay && <span className="text-[10px] font-normal text-[#8B7355]">/pÃ¤ev</span>}
                             </div>
                          </div>
                       );
                    })}
                 </div>

                 {/* Total & Action */}
                 <div className="space-y-4">
                    <div className="flex justify-between items-center text-lg font-bold text-[#2D2721] border-t border-[#FAF7F2] pt-4">
                       <span>Kokku</span>
                       <span>{calculateTotal().toFixed(2)}â‚¬</span>
                    </div>
                    <WarmButton 
                       fullWidth 
                       size="lg" 
                       onClick={handleBook} 
                       disabled={checkingStock || days === 0 || isTooShort}
                       className={days === 0 || isTooShort ? 'opacity-50 cursor-not-allowed' : ''}
                    >
                       {checkingStock ? 'Kontrollin...' : (isTooShort ? `Vali min. ${minDays} pÃ¤eva` : 'Broneeri kohe')}
                    </WarmButton>
                 </div>
                 
              </div>

              {/* Security Badge */}
              <div className="flex items-center justify-center gap-2 text-xs text-[#8B7355]">
                 <ShieldCheck className="w-4 h-4 text-[#00D098]" />
                 Turvaline makse ja kindlustus garanteeritud
              </div>
           </div>
        </div>

      </main>
    </div>
  );
}


