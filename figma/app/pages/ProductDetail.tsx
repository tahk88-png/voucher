import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { WarmButton } from '@app/components/WarmButton';
import { ImageWithFallback } from '@app/components/figma/ImageWithFallback';
import { 
  ArrowLeft, 
  ArrowRight,
  Minus, 
  Plus, 
  Star, 
  Truck, 
  ShieldCheck, 
  Heart,
  ChevronDown,
  Gift,
  Wrench,
  PackageCheck,
  Share2,
  Copy,
  Facebook,
  Twitter,
  Linkedin,
  PlayCircle
} from 'lucide-react';
import { CurrencyDisplay } from '@app/components/CurrencyDisplay';
import { useCart } from '@app/contexts/CartContext';
import { UnifiedData, Product } from '@services/unifiedData';
import { SEOHead } from '@app/components/SEOHead';
import { toast } from 'sonner';
import { copyToClipboard } from '@app/utils/clipboard';

// Mock Add-ons Data
const PRODUCT_ADDONS = [
  { id: 'gift_wrap', name: 'Kinkepakend', price: 4.90, icon: Gift, description: 'Luksuslik pakkimine ja kaart.' },
  { id: 'warranty_plus', name: 'Lisagarantii +1 aasta', price: 19.90, icon: ShieldCheck, description: 'Kaitse ootamatuste eest.' },
  { id: 'setup', name: 'Eelseadistus', price: 15.00, icon: Wrench, description: 'Teeme seadme kasutusvalmis.' },
];

type MediaItem = {
  type: 'image' | 'video';
  url: string;
  thumbnail?: string;
};

export function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedColor, setSelectedColor] = useState<{name: string, value: string} | null>(null);
  const [selectedSize, setSelectedSize] = useState('M');
  const [quantity, setQuantity] = useState(1);
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'details' | 'specs' | 'reviews'>('details');
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  
  // Add-ons state
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);

  // Load product
  useEffect(() => {
    if (id) {
      const found = UnifiedData.getProductById(id);
      if (found) {
        setProduct(found);
        if (found.colors && found.colors.length > 0) {
          setSelectedColor(found.colors[0]);
        }

        // Setup media items
        const items: MediaItem[] = [];
        // Add main image
        items.push({ type: 'image', url: found.image });
        
        // Add video if exists
        if (found.videoUrl) {
          items.push({ type: 'video', url: found.videoUrl, thumbnail: found.image });
        }

        // Add more images (duplicates for demo)
        items.push({ type: 'image', url: found.image });
        items.push({ type: 'image', url: found.image });

        setMediaItems(items);
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

  const calculateTotal = () => {
    if (!product) return 0;
    const baseTotal = product.price * quantity;
    const addonsTotal = selectedAddons.reduce((sum, id) => {
      const addon = PRODUCT_ADDONS.find(a => a.id === id);
      return sum + (addon ? addon.price : 0);
    }, 0);
    return baseTotal + addonsTotal;
  };

  const handleAddToCart = () => {
    if (!product) return;
    
    // Create detailed variant string
    const variantStr = [
      selectedSize,
      selectedColor?.name,
      selectedAddons.length > 0 ? `+ ${selectedAddons.length} lisa` : null
    ].filter(Boolean).join(' / ');

    addItem({
      sourceId: product.id,
      type: 'product',
      name: product.name,
      price: calculateTotal() / quantity, // Store unit price effectively per item including addons logic roughly
      quantity: quantity,
      image: product.image,
      variant: variantStr
    });

    toast.success(`${product.name} lisatud ostukorvi!`);
  };

  const handleShare = async (platform?: string) => {
    const url = window.location.href;
    const text = `Vaata seda: ${product?.name}`;

    if (platform === 'facebook') {
       window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
    } else if (platform === 'twitter') {
       window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`, '_blank');
    } else if (platform === 'linkedin') {
       window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
    } else {
       // Native share or copy
       if (navigator.share) {
          try {
             await navigator.share({ title: product?.name, text, url });
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

  if (!product) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center">
        <SEOHead title="Laen..." noIndex />
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 bg-[#E7DCC7] rounded-full mb-4"></div>
          <div className="h-4 w-32 bg-[#E7DCC7] rounded"></div>
        </div>
      </div>
    );
  }

  const displaySizes = ['XS', 'S', 'M', 'L', 'XL'];
  const activeMedia = mediaItems[activeMediaIndex] || { type: 'image', url: product.image };

  return (
    <div className="min-h-screen bg-[#FAF7F2] pb-24 lg:pb-12">
      <SEOHead 
        title={`${product.name} | GiftHub Shop`}
        description={product.description || 'Parim valik.'}
        image={product.image}
        type="product"
      />
      
      {/* Context Bar */}
      <div className="bg-white border-b border-[#E7DCC7] sticky top-16 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
           <button onClick={() => navigate('/shop')} className="text-sm font-medium text-[#6B5744] hover:text-[#2D2721] flex items-center gap-2 group transition-colors">
             <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Tagasi poodi
           </button>
           <div className="hidden md:flex items-center gap-2 text-sm text-[#8B7355]">
              <span>Kodu</span>
              <span className="text-[#E7DCC7]">/</span>
              <span>{product.category}</span>
              <span className="text-[#E7DCC7]">/</span>
              <span className="text-[#2D2721] font-bold">{product.name}</span>
           </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Left: Gallery (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="aspect-[4/5] md:aspect-square lg:aspect-[4/3] rounded-3xl overflow-hidden bg-white shadow-warm-lg relative group">
              {activeMedia.type === 'video' ? (
                 <iframe 
                   src={activeMedia.url} 
                   title="Product Video"
                   allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                   allowFullScreen
                   className="w-full h-full object-cover"
                 />
              ) : (
                <ImageWithFallback 
                  src={activeMedia.url} 
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              )}
              
              {/* Action Buttons Overlay - Only show if not video or video is overlaid */}
              <div className="absolute top-4 right-4 flex flex-col gap-2 pointer-events-none">
                 <div className="pointer-events-auto">
                    <button className="p-3 bg-white/90 backdrop-blur rounded-full text-[#2D2721] shadow-sm hover:scale-110 transition-transform mb-2">
                      <Heart className="w-6 h-6" />
                    </button>
                    <div className="relative">
                       <button 
                          onClick={() => setIsShareOpen(!isShareOpen)}
                          className="p-3 bg-white/90 backdrop-blur rounded-full text-[#2D2721] shadow-sm hover:scale-110 transition-transform"
                       >
                          <Share2 className="w-6 h-6" />
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
            </div>

            <div className="grid grid-cols-4 gap-4">
              {mediaItems.map((item, idx) => (
                <button 
                  key={idx}
                  onClick={() => setActiveMediaIndex(idx)}
                  className={`aspect-square rounded-2xl overflow-hidden cursor-pointer border-2 transition-all relative ${
                    activeMediaIndex === idx 
                      ? 'border-[#2D2721] ring-2 ring-[#2D2721]/10' 
                      : 'border-transparent hover:border-[#E7DCC7]'
                  }`}
                >
                  <ImageWithFallback 
                     src={item.type === 'video' ? (item.thumbnail || product.image) : item.url} 
                     alt={`View ${idx}`} 
                     className="w-full h-full object-cover" 
                  />
                  {/* Overlay for video thumbnail */}
                  {item.type === 'video' && (
                     <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                        <PlayCircle className="w-8 h-8 text-white drop-shadow-md" />
                     </div>
                  )}
                  {activeMediaIndex === idx && <div className="absolute inset-0 bg-black/10" />}
                </button>
              ))}
            </div>

            {/* Content Tabs */}
            <div className="mt-12 bg-white rounded-3xl p-8 shadow-sm border border-[#E7DCC7]">
              <div className="flex gap-8 border-b border-[#FAF7F2] pb-1 mb-6 overflow-x-auto">
                <button 
                  onClick={() => setActiveTab('details')}
                  className={`pb-4 text-sm font-bold tracking-wide uppercase transition-colors relative whitespace-nowrap ${activeTab === 'details' ? 'text-[#2D2721]' : 'text-[#8B7355] hover:text-[#2D2721]'}`}
                >
                  Tooteinfo
                  {activeTab === 'details' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2D2721]" />}
                </button>
                <button 
                  onClick={() => setActiveTab('specs')}
                  className={`pb-4 text-sm font-bold tracking-wide uppercase transition-colors relative whitespace-nowrap ${activeTab === 'specs' ? 'text-[#2D2721]' : 'text-[#8B7355] hover:text-[#2D2721]'}`}
                >
                  Tehnilised andmed
                  {activeTab === 'specs' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2D2721]" />}
                </button>
                <button 
                  onClick={() => setActiveTab('reviews')}
                  className={`pb-4 text-sm font-bold tracking-wide uppercase transition-colors relative whitespace-nowrap ${activeTab === 'reviews' ? 'text-[#2D2721]' : 'text-[#8B7355] hover:text-[#2D2721]'}`}
                >
                  Arvustused (124)
                  {activeTab === 'reviews' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2D2721]" />}
                </button>
              </div>

              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                {activeTab === 'details' && (
                   <div className="prose prose-stone max-w-none text-[#6B5744]">
                     <p className="lead text-lg">See on loodud nõudlikule kasutajale, kes hindab kvaliteeti.</p>
                     <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation.</p>
                     <ul className="grid sm:grid-cols-2 gap-4 mt-6 list-none pl-0">
                        <li className="flex items-center gap-3 bg-[#FAF7F2] p-3 rounded-xl">
                           <PackageCheck className="w-5 h-5 text-[#E17B5C]" /> 
                           <span className="font-bold text-[#2D2721]">Kiire tarne 1-3p</span>
                        </li>
                        <li className="flex items-center gap-3 bg-[#FAF7F2] p-3 rounded-xl">
                           <ShieldCheck className="w-5 h-5 text-[#E17B5C]" /> 
                           <span className="font-bold text-[#2D2721]">2-aastane garantii</span>
                        </li>
                     </ul>
                   </div>
                )}
                
                {activeTab === 'specs' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
                     <div className="flex justify-between py-3 border-b border-[#FAF7F2]">
                        <span className="text-[#8B7355]">Materjal</span>
                        <span className="font-bold text-[#2D2721]">Orgaaniline puuvill</span>
                     </div>
                     <div className="flex justify-between py-3 border-b border-[#FAF7F2]">
                        <span className="text-[#8B7355]">Kaal</span>
                        <span className="font-bold text-[#2D2721]">350g</span>
                     </div>
                     <div className="flex justify-between py-3 border-b border-[#FAF7F2]">
                        <span className="text-[#8B7355]">Päritolumaa</span>
                        <span className="font-bold text-[#2D2721]">Eesti</span>
                     </div>
                  </div>
                )}

                {activeTab === 'reviews' && (
                   <div className="space-y-6">
                      <div className="flex items-center gap-4 bg-[#FFF9ED] p-6 rounded-2xl">
                         <div className="text-4xl font-bold text-[#FFC857]">4.9</div>
                         <div>
                            <div className="flex text-[#FFC857] mb-1"><Star className="fill-current w-5 h-5" /><Star className="fill-current w-5 h-5" /><Star className="fill-current w-5 h-5" /><Star className="fill-current w-5 h-5" /><Star className="fill-current w-5 h-5" /></div>
                            <div className="text-sm text-[#8B7355] font-bold">Põhineb 124 hinnangul</div>
                         </div>
                      </div>
                      {/* Demo Review */}
                      <div className="border-b border-[#FAF7F2] pb-6">
                         <div className="flex items-center justify-between mb-2">
                            <span className="font-bold text-[#2D2721]">Mari T.</span>
                            <span className="text-xs text-[#8B7355]">2 päeva tagasi</span>
                         </div>
                         <div className="flex text-[#FFC857] w-3 h-3 gap-0.5 mb-2"><Star className="fill-current" /><Star className="fill-current" /><Star className="fill-current" /><Star className="fill-current" /><Star className="fill-current" /></div>
                         <p className="text-sm text-[#6B5744]">Väga rahul tootega! Värv vastas täpselt pildile ja materjal on super pehme.</p>
                      </div>
                   </div>
                )}
              </div>
            </div>
          </div>

          {/* Right: Actions (5 cols) */}
          <div className="lg:col-span-5 relative">
            <div className="sticky top-32 space-y-8">
              
              {/* Header Info */}
              <div>
                 <div className="flex items-start justify-between gap-4 mb-4">
                    <h1 className="text-3xl md:text-4xl font-display font-bold text-[#2D2721] leading-tight">{product.name}</h1>
                    {/* Merchant Logo Badge */}
                    {product.merchantName && (
                        <div className="flex-shrink-0" title={`Pakkuja: ${product.merchantName}`}>
                            {product.merchantLogo ? (
                                <img src={product.merchantLogo} alt={product.merchantName} className="w-14 h-14 rounded-full border-2 border-[#E7DCC7] p-0.5 bg-white shadow-sm object-cover" />
                            ) : (
                                <div className="w-14 h-14 rounded-full border-2 border-[#E7DCC7] bg-[#FAF7F2] flex items-center justify-center font-bold text-[#2D2721] text-xl">
                                    {product.merchantName.charAt(0)}
                                </div>
                            )}
                        </div>
                    )}
                 </div>

                 <div className="flex items-center justify-between mb-6">
                    <div className="text-3xl font-bold text-[#2D2721]">
                       <CurrencyDisplay amount={product.price} />
                    </div>
                    
                    {/* Trust Badge instead of just name */}
                    <div className="flex items-center gap-2 text-xs font-medium text-[#8B7355] bg-[#FAF7F2] px-3 py-1.5 rounded-lg border border-[#E7DCC7]">
                       <ShieldCheck className="w-3.5 h-3.5 text-[#00D098]" />
                       <span>Müüb: <span className="font-bold text-[#2D2721]">{product.merchantName || 'Partner'}</span></span>
                    </div>
                 </div>
              </div>

              {/* Configure Product */}
              <div className="bg-white p-6 rounded-3xl border border-[#E7DCC7] shadow-sm space-y-6">
                 
                 {/* Color */}
                 {product.colors && product.colors.length > 0 && selectedColor && (
                    <div>
                       <span className="text-sm font-bold text-[#2D2721] mb-3 block">Värv: <span className="text-[#8B7355] font-normal">{selectedColor.name}</span></span>
                       <div className="flex gap-3">
                          {product.colors.map((color) => (
                             <button
                                key={color.name}
                                onClick={() => setSelectedColor(color)}
                                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                                   selectedColor.name === color.name ? 'ring-2 ring-[#2D2721] ring-offset-2' : 'hover:scale-110'
                                }`}
                                style={{ backgroundColor: color.value }}
                                title={color.name}
                             />
                          ))}
                       </div>
                    </div>
                 )}

                 {/* Size */}
                 <div>
                    <div className="flex justify-between mb-3">
                       <span className="text-sm font-bold text-[#2D2721]">Suurus: <span className="text-[#8B7355] font-normal">{selectedSize}</span></span>
                       <button className="text-xs font-bold text-[#E17B5C] hover:underline">Suuruste tabel</button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                       {displaySizes.map((size) => (
                          <button
                             key={size}
                             onClick={() => setSelectedSize(size)}
                             className={`h-11 min-w-[3.5rem] px-4 rounded-xl text-sm font-bold transition-all border-2 ${
                                selectedSize === size 
                                   ? 'bg-[#2D2721] text-white border-[#2D2721]' 
                                   : 'bg-white text-[#6B5744] border-[#E7DCC7] hover:border-[#2D2721]'
                             }`}
                          >
                             {size}
                          </button>
                       ))}
                    </div>
                 </div>

                 {/* ADD-ONS Section */}
                 <div className="pt-6 border-t border-[#FAF7F2]">
                    <h3 className="text-sm font-bold text-[#2D2721] mb-4 uppercase tracking-wider">Lisa veel juurde</h3>
                    <div className="space-y-3">
                       {PRODUCT_ADDONS.map((addon) => {
                          const Icon = addon.icon;
                          const isSelected = selectedAddons.includes(addon.id);
                          return (
                             <div 
                                key={addon.id}
                                onClick={() => toggleAddon(addon.id)}
                                className={`flex items-center justify-between p-3 rounded-xl border-2 cursor-pointer transition-all ${
                                   isSelected ? 'border-[#E17B5C] bg-[#FFF9ED]' : 'border-[#FAF7F2] hover:border-[#E7DCC7]'
                                }`}
                             >
                                <div className="flex items-center gap-3">
                                   <div className={`p-2 rounded-lg ${isSelected ? 'bg-[#E17B5C] text-white' : 'bg-[#FAF7F2] text-[#8B7355]'}`}>
                                      <Icon className="w-4 h-4" />
                                   </div>
                                   <div>
                                      <div className="font-bold text-sm text-[#2D2721]">{addon.name}</div>
                                      <div className="text-xs text-[#8B7355]">{addon.description}</div>
                                   </div>
                                </div>
                                <div className="text-sm font-bold text-[#2D2721]">
                                   +<CurrencyDisplay amount={addon.price} />
                                </div>
                             </div>
                          );
                       })}
                    </div>
                 </div>

              </div>

              {/* Checkout Bar */}
              <div className="bg-[#2D2721] p-6 rounded-3xl text-white shadow-xl">
                 <div className="flex items-center justify-between mb-6">
                    <div>
                       <div className="text-sm text-white/60 font-medium">Kogusumma</div>
                       <div className="text-3xl font-bold"><CurrencyDisplay amount={calculateTotal()} /></div>
                    </div>
                    <div className="flex items-center bg-white/10 rounded-xl p-1">
                       <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-10 h-10 flex items-center justify-center hover:bg-white/10 rounded-lg transition-colors"><Minus className="w-4 h-4" /></button>
                       <span className="w-8 text-center font-bold">{quantity}</span>
                       <button onClick={() => setQuantity(quantity + 1)} className="w-10 h-10 flex items-center justify-center hover:bg-white/10 rounded-lg transition-colors"><Plus className="w-4 h-4" /></button>
                    </div>
                 </div>
                 
                 <WarmButton fullWidth size="lg" className="bg-[#E17B5C] hover:bg-[#D16B4C] text-white border-none h-14 text-lg shadow-none" onClick={handleAddToCart}>
                    Lisa ostukorvi
                 </WarmButton>
                 
                 <div className="mt-4 flex items-center justify-center gap-2 text-xs text-white/50">
                    <Truck className="w-3 h-3" /> Tasuta tarne alates 50€
                 </div>
              </div>

            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
