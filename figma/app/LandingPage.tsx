import { useState, useEffect } from 'react';
import { CampaignTicker } from './components/CampaignTicker';
import { CampaignCard } from './components/CampaignCard';
import { Button } from './components/ui/button';
import { ChevronRight, Loader2, Smartphone, Ticket, Smile, Camera, ShoppingBag, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { UnifiedData, Campaign } from '@/figma/services/unifiedData';

const HERO_IMAGE = "https://images.unsplash.com/photo-1667235195726-a7c440bca9bd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBzcGElMjB3ZWxsbmVzc3xlbnwxfHx8fDE3NjkzMjQxMDB8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral";

export default function LandingPage() {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate async loading
    const loadData = async () => {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 600)); // Smooth transition
      setCampaigns(UnifiedData.getAllCampaigns());
      setLoading(false);
    };
    loadData();
  }, []);

  const handleNotImplemented = (feature: string) => {
    toast.info(`${feature} ei ole veel saadaval`, {
      description: "Tegeleme selle funktsionaalsusega aktiivselt!",
      duration: 3000,
    });
  };

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] font-sans text-[#2D2721]">
      {/* Ticker */}
      <CampaignTicker />

      {/* Navbar */}

      {/* Hero Section */}
      <section className="relative pt-12 pb-20 px-4 overflow-hidden">
        <div className="container mx-auto">
          <div className="relative rounded-[2.5rem] overflow-hidden min-h-[500px] flex items-center shadow-2xl">
            {/* Background Image */}
            <div className="absolute inset-0">
              <img 
                src={HERO_IMAGE} 
                alt="Hero" 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#2D2721]/90 via-[#2D2721]/40 to-transparent" />
            </div>

            {/* Content */}
            <div className="relative z-10 max-w-2xl px-8 md:px-16 py-12 text-[#FFF9ED]">
              <span className="inline-block py-1 px-3 rounded-full bg-[#E17B5C]/20 border border-[#E17B5C]/50 text-[#E17B5C] text-xs font-bold uppercase tracking-widest mb-6 backdrop-blur-md">
                Päeva Pakkumine
              </span>
              <h1 className="font-display font-bold text-4xl md:text-6xl lg:text-7xl leading-[1.1] mb-6 drop-shadow-lg">
                Avasta linna parimad <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFC857] to-[#E17B5C]">
                  elamused
                </span>
              </h1>
              <p className="text-lg md:text-xl text-[#FFF9ED]/90 mb-10 leading-relaxed max-w-lg drop-shadow-md">
                Eksklusiivsed pakkumised parimatelt restoranidelt, spaadelt ja meelelahutusasutustelt.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  onClick={() => scrollToSection('featured-campaigns')}
                  className="bg-[#E17B5C] hover:bg-[#D16B4C] text-white rounded-full h-14 px-8 text-lg font-medium shadow-warm-lg transition-transform hover:scale-105 border-none"
                >
                  Vaata pakkumisi
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => scrollToSection('modules')}
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20 rounded-full h-14 px-8 text-lg font-medium backdrop-blur-sm"
                >
                  Tutvu teenustega
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* New Services Modules */}
      <section id="modules" className="py-12 px-4">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Rental Module */}
            <div 
              onClick={() => navigate('/rentals')}
              className="group relative h-80 rounded-[2rem] overflow-hidden cursor-pointer shadow-warm-lg"
            >
              <img 
                src="https://images.unsplash.com/photo-1516035069371-29a1b244cc32?ixlib=rb-4.1.0&auto=format&fit=crop&w=800&q=80" 
                alt="Rent" 
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors" />
              <div className="absolute inset-0 p-8 flex flex-col justify-end text-white">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                    <Camera className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-bold uppercase tracking-wider">Tehnika Rent</span>
                </div>
                <h3 className="text-3xl font-display font-bold mb-2">Rendi tippvarustust</h3>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0 duration-300">
                  <span className="font-medium">Vaata seadmeid</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* Shop Module */}
            <div 
              onClick={() => navigate('/shop')}
              className="group relative h-80 rounded-[2rem] overflow-hidden cursor-pointer shadow-warm-lg"
            >
              <img 
                src="https://images.unsplash.com/photo-1483985988355-763728e1935b?ixlib=rb-4.1.0&auto=format&fit=crop&w=800&q=80" 
                alt="Shop" 
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors" />
              <div className="absolute inset-0 p-8 flex flex-col justify-end text-white">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-bold uppercase tracking-wider">E-pood</span>
                </div>
                <h3 className="text-3xl font-display font-bold mb-2">Osta parimaid tooteid</h3>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0 duration-300">
                  <span className="font-medium">Külasta poodi</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Featured Campaigns Grid */}
      <section id="featured-campaigns" className="py-12 px-4 scroll-mt-20">
        <div className="container mx-auto">
          <div className="flex justify-between items-end mb-10">
            <div>
              <h2 className="font-display font-bold text-3xl text-[#2D2721] mb-2">Kuumad pakkumised</h2>
              <p className="text-[#6B5744]">Selle nädala populaarsemad valikud</p>
            </div>
            <Button 
              variant="ghost" 
              onClick={() => navigate('/campaigns')}
              className="text-[#E17B5C] hover:text-[#D16B4C] hover:bg-[#E17B5C]/10 gap-2"
            >
              Vaata kõiki <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-[minmax(0,_auto)]">
            {loading ? (
              <div className="col-span-full flex justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-[#E17B5C]" />
              </div>
            ) : campaigns.length > 0 ? (
              campaigns.map((campaign) => (
                <div key={campaign.id} onClick={() => navigate(`/campaign/${campaign.id}`)} className="cursor-pointer">
                  <CampaignCard 
                    id={campaign.id}
                    title={campaign.title}
                    image={campaign.image_url || ''}
                    price={campaign.price}
                    originalPrice={campaign.original_price}
                    category={campaign.category_name || 'Muu'}
                    rating={4.8}
                  />
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-20 text-[#6B5744]">
                Hetkel aktiivseid pakkumisi ei leitud.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 px-4 bg-white border-t border-[#E7DCC7]/50">
        <div className="container mx-auto text-center">
          <div className="mb-16">
            <h2 className="font-display font-bold text-3xl md:text-4xl text-[#2D2721] mb-4">Kuidas see töötab?</h2>
            <p className="text-[#6B5744] text-lg max-w-2xl mx-auto">
              Säästa aega ja raha vaid kolme lihtsa sammuga. Meie platvorm on loodud pakkuma parimaid elamusi võimalikult mugavalt.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connecting Line (Desktop) */}
            <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-[#F2EDE3]" />

            {[
              {
                icon: Smartphone,
                title: '1. Vali pakkumine',
                desc: 'Sirvi sadu eksklusiivseid pakkumisi ja leia endale sobiv restoran, spaa või meelelahutus.'
              },
              {
                icon: Ticket,
                title: '2. Osta vautšer',
                desc: 'Soorita turvaline ost sekunditega. Sinu vautšer on koheselt saadaval digitaalsel kujul.'
              },
              {
                icon: Smile,
                title: '3. Naudi elamust',
                desc: 'Esita vautšer kohapeal otse telefonist ja naudi oma elamust soodsama hinnaga.'
              }
            ].map((step, i) => (
              <div key={i} className="relative group">
                <div className="w-24 h-24 rounded-[2rem] bg-[#FAF7F2] border border-[#E7DCC7] flex items-center justify-center mx-auto mb-6 group-hover:scale-110 group-hover:border-[#E17B5C] group-hover:bg-[#FFF9ED] transition-all duration-300 relative z-10 shadow-sm">
                  <step.icon className="w-10 h-10 text-[#6B5744] group-hover:text-[#E17B5C] transition-colors" />
                </div>
                <h3 className="font-display font-bold text-xl text-[#2D2721] mb-3">{step.title}</h3>
                <p className="text-[#6B5744] leading-relaxed px-4">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-12 px-4 bg-[#FAF7F2] border-t border-[#E7DCC7]/50">
        <div className="container mx-auto">
          <h2 className="font-display font-bold text-2xl text-[#2D2721] mb-8 text-center">Sirvi kategooriaid</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {['Restoranid', 'Ilu & Tervis', 'Meelelahutus', 'Reisimine', 'Teenused', 'Sport'].map((cat) => (
              <div key={cat} className="group cursor-pointer" onClick={() => handleNotImplemented(`${cat} kategooria`)}>
                <div className="h-32 rounded-2xl bg-white border border-[#E7DCC7] flex items-center justify-center mb-3 group-hover:border-[#E17B5C] group-hover:shadow-md transition-all duration-300">
                  <span className="font-display font-bold text-lg text-[#6B5744] group-hover:text-[#E17B5C] transition-colors">{cat}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
