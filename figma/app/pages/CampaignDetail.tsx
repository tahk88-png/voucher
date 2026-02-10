import { useState, useEffect } from 'react';
import { WarmCard } from '@app/components/WarmCard';
import { WarmButton } from '@app/components/WarmButton';
import { ShareModal } from '@app/components/ShareModal';
import { ImageWithFallback } from '@app/components/figma/ImageWithFallback';
import { useNavigate, useParams } from '@/lib/router-shim';
import { 
  ChevronRight,
  Share2,
  Ticket,
  Clock,
  CheckCircle2,
  Copy,
  Play,
  MapPin,
  Loader2,
  ArrowLeft,
  ShoppingBag,
  Store
} from 'lucide-react';
import QRCode from 'react-qr-code';
import { CurrencyDisplay } from '@app/components/CurrencyDisplay';
import { toast } from 'sonner';
import { copyToClipboard } from '@app/utils/clipboard';
import { UnifiedData, Campaign } from '@services/unifiedData';
import { useCart } from '@app/contexts/CartContext';
import { SEOHead } from '@app/components/SEOHead';

const DEFAULT_IMAGES = {
  hero: "https://images.unsplash.com/photo-1759392790299-a8874cabc000?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbGVjdHJvbmljcyUyMHN0b3JlJTIwbW9kZXJuJTIwaW50ZXJpb3J8ZW58MXx8fHwxNzY5MzU0NDA4fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  gallery: [
    "https://images.unsplash.com/photo-1759668358660-0d06064f0f84?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsYXB0b3AlMjBjb21wdXRlciUyMG1vZGVybiUyMGRlc2t8ZW58MXx8fHwxNzY5MzU0NDExfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    "https://images.unsplash.com/photo-1649061740305-65e2a5764cb5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzbWFydHBob25lJTIwaGVsZCUyMGluJTIwaGFuZHxlbnwxfHx8fDE3NjkzNTQ0MTV8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    "https://images.unsplash.com/photo-1639416360690-43be9f526dc6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0YWJsZXQlMjBvbiUyMHRhYmxlJTIwY29mZmVlfGVufDF8fHx8MTc2OTM1NDQxOXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
  ],
  merchant: [
    "https://images.unsplash.com/photo-1752650735929-5be9a75aab74?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmcmllbmRseSUyMGJ1c2luZXNzJTIwdGVhbSUyMG9mZmljZXxlbnwxfHx8fDE3NjkzNTU0NTR8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    "https://images.unsplash.com/photo-1769107805412-90d9191d53e9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdG9yZWZyb250JTIwbW9kZXJuJTIwYm91dGlxdWV8ZW58MXx8fHwxNzY5MzU1NDU4fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
  ]
};

// Extends base Campaign with mock UI details
type EnrichedCampaign = Campaign & {
  merchantDetails: {
    name: string;
    logo: string;
    address: string;
    mapImage: string;
    description: string;
    openingHours: { day: string; hours: string }[];
    images: string[];
  };
  longDescription: string;
};

export function CampaignDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { addItem } = useCart();
  
  const [campaign, setCampaign] = useState<EnrichedCampaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  useEffect(() => {
    if (id) {
       const found = UnifiedData.getCampaignById(id);
       if (found) {
         // Enrich with mock details
         setCampaign({
            ...found,
            merchantDetails: {
                name: found.merchant || 'Partner',
                logo: 'Store',
                address: 'Tallinn, Eesti',
                mapImage: 'https://images.unsplash.com/photo-1569336415962-a4bd9f69cd83?ixlib=rb-4.1.0&auto=format&fit=crop&w=800&q=80',
                description: 'Oleme usaldusvÃ¤Ã¤rne partner aastast 2010.',
                openingHours: [
                    { day: 'E-R', hours: '10:00 - 19:00' },
                    { day: 'L-P', hours: '11:00 - 17:00' }
                ],
                images: DEFAULT_IMAGES.merchant
            },
            longDescription: 'See on suurepÃ¤rane vÃµimalus nautida kvaliteetset teenust. Pakkumine kehtib piiratud aja jooksul.'
         });
       }
       setLoading(false);
    }
  }, [id]);

  const handleAddToCart = () => {
    if (!campaign) return;
    
    addItem({
      sourceId: campaign.id,
      type: 'campaign',
      name: campaign.title,
      price: campaign.price,
      quantity: 1,
      image: campaign.image_url || DEFAULT_IMAGES.hero
    });
    
    navigate('/cart');
  };

  const handleCopyCode = async (code: string) => {
    const success = await copyToClipboard(code);
    if (success) toast.success('Kood kopeeritud!');
  };

  const handleShare = async () => {
    if (!campaign) return;
    const url = window.location.href;
    
    if (navigator.share) {
      try {
        await navigator.share({ title: campaign.title, text: campaign.longDescription, url });
        toast.success('Jagatud edukalt!');
      } catch (err) { /* ignore abort */ }
    } else {
        setIsShareModalOpen(true);
    }
  };

  if (loading) return <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center"><Loader2 className="animate-spin text-[#E17B5C]" /></div>;
  if (!campaign) return (
    <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center">
        <SEOHead title="Kampaaniat ei leitud" noIndex />
        Kampaaniat ei leitud
    </div>
  );

  const heroImage = campaign.image_url || DEFAULT_IMAGES.hero;
  const galleryImages = [heroImage, ...DEFAULT_IMAGES.gallery].slice(0, 3);
  const discount = campaign.original_price ? Math.round((1 - campaign.price / campaign.original_price) * 100) : 0;
  // Mock voucher code
  const freeCode = `SALE${discount}-XYZ`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product', // Kampaania kui toode
    name: campaign.title,
    image: [heroImage],
    description: campaign.longDescription,
    sku: campaign.id,
    brand: {
      '@type': 'Organization',
      name: campaign.merchantDetails.name
    },
    offers: {
      '@type': 'Offer',
      price: campaign.price,
      priceCurrency: 'EUR',
      priceValidUntil: '2026-12-31',
      url: window.location.href,
      availability: 'https://schema.org/InStock'
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2]">
      <SEOHead 
        title={`${campaign.title} -${discount}% | ${campaign.merchantDetails.name}`}
        description={`${campaign.title}. Vaata pakkumist partnerilt ${campaign.merchantDetails.name}. Hind: ${campaign.price}â‚¬ (Tavahind: ${campaign.original_price}â‚¬).`}
        image={heroImage}
        type="product"
        jsonLd={jsonLd}
      />

      <ShareModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          title={campaign.title}
          description={campaign.longDescription}
          url={window.location.href}
      />

      {/* Breadcrumb */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-[#E7DCC7] sticky top-16 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-2 text-sm text-[#8B7355]">
            <button onClick={() => navigate('/campaigns')} className="hover:text-[#2D2721] flex items-center gap-1">
               <ArrowLeft className="w-4 h-4" /> Kampaaniad
            </button>
            <ChevronRight className="h-4 w-4" />
            <span>{campaign.category_name}</span>
            <ChevronRight className="h-4 w-4" />
            <span className="text-[#2D2721] font-medium truncate max-w-[200px]">{campaign.title}</span>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          
          {/* Left: Images */}
          <div className="lg:col-span-2 space-y-6">
            <div className="relative rounded-3xl overflow-hidden aspect-video shadow-warm-lg group">
              <ImageWithFallback src={heroImage} alt={campaign.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute bottom-6 left-6 text-white bg-black/40 backdrop-blur p-4 rounded-xl">
                 <h1 className="text-2xl font-bold mb-1">{campaign.title}</h1>
                 <p>{campaign.merchantDetails.name}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {galleryImages.map((img, i) => (
                <div key={i} className="rounded-xl overflow-hidden aspect-[4/3] shadow-sm cursor-pointer hover:shadow-warm transition-all">
                  <ImageWithFallback src={img} alt="Gallery" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>

          {/* Right: Actions */}
          <div className="space-y-6">
             <WarmCard padding="lg" className="sticky top-24 bg-white">
                <div 
                  onClick={() => campaign.merchantId && navigate(`/merchant/${campaign.merchantId}`)}
                  className={`flex items-center gap-4 mb-6 pb-6 border-b border-[#E7DCC7]/50 ${campaign.merchantId ? 'cursor-pointer group' : ''}`}
                >
                    <div className="w-14 h-14 rounded-full bg-[#FAF7F2] flex items-center justify-center text-2xl border border-[#E7DCC7] group-hover:border-[#E17B5C] transition-colors">
                        <Store className="w-7 h-7 text-[#8B7355]" />
                    </div>
                    <div>
                        <h3 className="font-bold text-[#2D2721] group-hover:text-[#E17B5C] transition-colors">{campaign.merchantDetails.name}</h3>
                        <div className="flex items-center gap-1 text-[#9DB5A5] text-xs font-bold uppercase tracking-wider">
                             <CheckCircle2 className="w-3 h-3" /> Kontrollitud partner
                        </div>
                    </div>
                </div>

                <div className="mb-8">
                    <div className="flex items-baseline gap-2 mb-1">
                        <span className="text-3xl font-bold text-[#2D2721]">
                            <CurrencyDisplay amount={campaign.price} />
                        </span>
                        {campaign.original_price && (
                            <span className="text-lg text-[#8B7355] line-through">
                                <CurrencyDisplay amount={campaign.original_price} />
                            </span>
                        )}
                    </div>
                    {campaign.original_price && (
                        <span className="text-sm font-bold text-[#E17B5C] bg-[#FFF9ED] px-2 py-1 rounded-md">
                            SÃ¤Ã¤stad {Math.round((1 - campaign.price / campaign.original_price) * 100)}%
                        </span>
                    )}
                </div>

                <WarmButton fullWidth size="lg" onClick={handleAddToCart} className="mb-3">
                    <ShoppingBag className="w-4 h-4 mr-2" />
                    Lisa ostukorvi
                </WarmButton>
                
                <WarmButton fullWidth variant="outline" onClick={handleShare}>
                    <Share2 className="w-4 h-4 mr-2" />
                    Jaga sÃµbraga
                </WarmButton>

                <div className="mt-6 pt-6 border-t border-[#E7DCC7]/50 space-y-3 text-sm text-[#6B5744]">
                    <div className="flex items-start gap-3">
                        <MapPin className="w-5 h-5 text-[#E17B5C] flex-shrink-0" />
                        <span>{campaign.merchantDetails.address}</span>
                    </div>
                    <div className="flex items-start gap-3">
                        <Clock className="w-5 h-5 text-[#E17B5C] flex-shrink-0" />
                        <div className="flex flex-col">
                            {campaign.merchantDetails.openingHours.map((h, i) => (
                                <div key={i} className="flex justify-between w-full gap-4">
                                    <span>{h.day}</span>
                                    <span>{h.hours}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
             </WarmCard>
          </div>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
                <section>
                    <h2 className="text-2xl font-bold text-[#2D2721] mb-4">Pakkumise sisu</h2>
                    <p className="text-[#6B5744] leading-relaxed whitespace-pre-line">{campaign.longDescription}</p>
                </section>

                <section id="vouchers" className="scroll-mt-24">
                  <h2 className="text-2xl font-bold text-[#2D2721] mb-6 flex items-center gap-2">
                    <Ticket className="w-6 h-6 text-[#E17B5C]" />
                    Paketid
                  </h2>
                  <div className="space-y-4">
                     {/* Paid Package */}
                     <WarmCard padding="lg" hover className="bg-white border-l-4 border-l-[#E17B5C]">
                        <div className="flex flex-col sm:flex-row justify-between gap-6">
                            <div>
                                <h3 className="text-lg font-bold text-[#2D2721] mb-2">TÃ¤ispakett</h3>
                                <p className="text-[#6B5744] mb-4">Sisaldab kÃµiki teenuseid ja on parim valik.</p>
                                <div className="font-bold text-[#2D2721] text-xl">
                                    <CurrencyDisplay amount={campaign.price} />
                                </div>
                            </div>
                            <div className="flex flex-col justify-center sm:w-40">
                                <WarmButton onClick={handleAddToCart}>Osta</WarmButton>
                            </div>
                        </div>
                     </WarmCard>

                     {/* Free Voucher (Coupon) */}
                     <WarmCard padding="lg" hover className="bg-white border-l-4 border-l-[#9DB5A5]">
                         <div className="flex flex-col sm:flex-row gap-6">
                            <div className="flex-1">
                                <div className="flex justify-between">
                                    <h3 className="text-lg font-bold text-[#2D2721] mb-2">Sooduskood -{discount}%</h3>
                                    <span className="bg-[#9DB5A5] text-white text-xs font-bold px-2 py-1 rounded h-fit">TASUTA</span>
                                </div>
                                <p className="text-[#6B5744] mb-4">Kasuta seda koodi broneerimisel vÃµi kohapeal.</p>
                                
                                <div className="bg-[#FAF7F2] p-3 rounded-lg border border-dashed border-[#8B7355]/30 flex items-center justify-between">
                                    <span className="font-mono font-bold text-[#2D2721] tracking-widest">{freeCode}</span>
                                    <button onClick={() => handleCopyCode(freeCode)} className="text-[#E17B5C] hover:text-[#D16B4C]">
                                        <Copy className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                            <div className="flex items-center justify-center sm:border-l sm:border-[#E7DCC7]/50 sm:pl-6">
                                <div className="bg-white p-2 rounded shadow-sm border border-[#E7DCC7]">
                                   <QRCode value={freeCode} size={80} level="M" fgColor="#2D2721" />
                                </div>
                            </div>
                         </div>
                     </WarmCard>
                  </div>
                </section>
            </div>
        </div>
      </main>
    </div>
  );
}


