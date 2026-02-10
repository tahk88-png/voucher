import { useState } from 'react';
import { WarmButton } from '@app/components/WarmButton';
import { ImageWithFallback } from '@app/components/figma/ImageWithFallback';
import { Switch } from '@app/components/ui/switch';
import { Input } from '@app/components/ui/input';
import { Label } from '@app/components/ui/label';
import { Textarea } from '@app/components/ui/textarea';
import { 
  MoveVertical, 
  Plus, 
  Eye, 
  Smartphone, 
  Monitor, 
  Check, 
  Globe,
  Settings,
  Zap,
  Search,
  MessageCircle,
  BarChart,
  Gift,
  Bot,
  Rocket,
  Star,
  Video,
  Instagram,
  LayoutTemplate,
  Palette,
  FileText,
  ChevronLeft,
  Image as ImageIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Trash2,
  ShoppingBag,
  Menu,
  Calendar,
  Sparkles,
  Pencil,
  X
} from 'lucide-react';
import { toast } from 'sonner';

// Define styles for different templates
const TEMPLATES = {
  modern: {
    id: 'modern',
    name: 'Modernne',
    radius: '1rem',
    shadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    font: 'Inter',
    buttonStyle: 'rounded-full',
    sectionSpacing: 'py-16'
  },
  minimal: {
    id: 'minimal',
    name: 'Minimalistlik',
    radius: '0px',
    shadow: 'none',
    font: 'Inter',
    buttonStyle: 'rounded-none uppercase tracking-widest',
    sectionSpacing: 'py-24'
  },
  luxury: {
    id: 'luxury',
    name: 'Luksuslik',
    radius: '0.25rem',
    shadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
    font: 'Playfair Display',
    buttonStyle: 'rounded-sm',
    sectionSpacing: 'py-20'
  }
};

// Mock Component for the "Live Preview"
const LivePreview = ({ sections, addons, theme, template, viewMode, pages }: any) => {
  const currentTemplate = TEMPLATES[template as keyof typeof TEMPLATES];
  
  const buttonClass = `px-6 py-3 font-bold transition-transform active:scale-95 ${currentTemplate.buttonStyle}`;

  return (
    <div className={`bg-white shadow-2xl mx-auto transition-all duration-500 overflow-hidden border border-[#E7DCC7] relative ${
      viewMode === 'mobile' ? 'w-[375px] rounded-[3rem] min-h-[700px] border-[8px] border-[#2D2721]' : 'w-full max-w-[1200px] rounded-xl min-h-[600px]'
    }`}>
      {/* Fake Browser Header */}
      {viewMode === 'desktop' && (
        <div className="bg-[#FAF7F2] border-b border-[#E7DCC7] p-3 flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-[#E17B5C]/50"></div>
            <div className="w-3 h-3 rounded-full bg-[#FFC857]/50"></div>
            <div className="w-3 h-3 rounded-full bg-[#00D098]/50"></div>
          </div>
          <div className="bg-white px-4 py-1 rounded-md text-xs text-[#8B7355] flex-1 text-center font-mono">
             minupood.ee
          </div>
        </div>
      )}

      <div className={`bg-white min-h-[600px] overflow-y-auto max-h-[800px] custom-scrollbar relative font-${currentTemplate.font === 'Inter' ? 'sans' : 'serif'}`}>
        {/* Navigation Mock */}
        <nav className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-[#E7DCC7] p-4 flex justify-between items-center transition-all">
          <div className={`text-xl tracking-tight ${currentTemplate.id === 'luxury' ? 'font-serif italic' : 'font-bold'}`} style={{ color: theme.primary }}>
             Minu Pood
          </div>
          
          {/* Smart Search Addon */}
          {addons.smartSearch && (
             <div className={`hidden md:flex items-center bg-[#FAF7F2] px-3 py-1.5 border border-[#E7DCC7] w-1/3 transition-all`} style={{ borderRadius: currentTemplate.radius }}>
                <Search className="w-4 h-4 text-[#8B7355] mr-2" />
                <span className="text-xs text-[#8B7355]">Otsi tooteid...</span>
             </div>
          )}

          {/* Dynamic Menu Items */}
          <div className="hidden md:flex gap-6 text-sm font-medium text-[#6B5744]">
            {pages.map((page: any) => (
               <span key={page.id} className="hover:text-[#2D2721] cursor-pointer transition-colors relative group">
                  {page.name}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#E17B5C] transition-all group-hover:w-full"></span>
               </span>
            ))}
          </div>
          
          <div className="flex items-center gap-3">
             {addons.multiLanguage && (
                <div className="text-xs font-bold text-[#6B5744] cursor-pointer hover:bg-[#FAF7F2] px-2 py-1 rounded">EST</div>
             )}
             <div className="w-8 h-8 flex items-center justify-center hover:bg-[#FAF7F2] transition-colors" style={{ borderRadius: currentTemplate.radius }}>
               <ShoppingBag className="w-4 h-4" />
             </div>
             <div className="md:hidden">
                <Menu className="w-5 h-5" />
             </div>
          </div>
        </nav>

        {sections.filter((s: any) => s.active).map((section: any) => {
          // Dynamic styles from section content
          const alignClass = section.content.align === 'left' ? 'text-left items-start' : section.content.align === 'right' ? 'text-right items-end' : 'text-center items-center';
          const bgColor = section.content.bgColor || 'bg-[#FAF7F2]';
          const textColor = section.content.textColor || 'text-[#2D2721]';
          
          return (
          <div key={section.id} className="relative group">
            
            {/* --- HERO SECTION --- */}
            {section.type === 'hero' && (
              <div className={`relative ${currentTemplate.id === 'luxury' ? 'h-[600px]' : 'h-[500px]'} flex ${alignClass.replace('text-', 'justify-').replace('items-', 'items-')} p-8 overflow-hidden`} style={{ backgroundColor: section.content.bgColor || '#FAF7F2' }}>
                {section.content.bgImage && (
                   <ImageWithFallback 
                      src={section.content.bgImage} 
                      className="absolute inset-0 w-full h-full object-cover opacity-90 transition-transform duration-1000 hover:scale-105"
                      alt="Hero"
                   />
                )}
                {section.content.bgImage && (
                   <div className={`absolute inset-0 ${currentTemplate.id === 'minimal' ? 'bg-white/10' : 'bg-black/30'}`}></div>
                )}
                
                <div className={`relative z-10 max-w-2xl flex flex-col ${alignClass} animate-in fade-in slide-in-from-bottom-4 duration-700`} style={{ color: section.content.textColor || (section.content.bgImage ? 'white' : '#2D2721') }}>
                  <h2 className={`text-5xl md:text-7xl mb-6 ${currentTemplate.id === 'luxury' ? 'font-serif italic' : 'font-bold'}`}>{section.content.title}</h2>
                  <p className="text-lg mb-8 opacity-90 font-light">{section.content.subtitle}</p>
                  <div className="flex gap-4">
                    <button className={`${buttonClass} bg-white text-black hover:bg-gray-100`}>
                      {section.content.buttonText || 'Osta kohe'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* --- FEATURES SECTION --- */}
            {section.type === 'features' && (
               <div className={`${currentTemplate.sectionSpacing} px-8`} style={{ backgroundColor: section.content.bgColor || 'white' }}>
                  <div className={`max-w-6xl mx-auto grid md:grid-cols-3 gap-8 ${alignClass}`}>
                     {[
                        { icon: Rocket, title: "Kiire Tarne", text: "Kaup kätte 1-2 päevaga" },
                        { icon: Calendar, title: "Paindlik Rent", text: "Broneeri kalendrist" },
                        { icon: Check, title: "Garantii", text: "2 aastat tootjapoolset garantiid" }
                     ].map((feature, idx) => (
                        <div key={idx} className="p-6 transition-all hover:-translate-y-1">
                           <div className={`w-12 h-12 bg-[#FAF7F2] text-[#E17B5C] flex items-center justify-center mb-4 ${section.content.align === 'center' ? 'mx-auto' : ''}`} style={{ borderRadius: currentTemplate.radius }}>
                              <feature.icon className="w-6 h-6" />
                           </div>
                           <h4 className="text-lg font-bold mb-2" style={{ color: section.content.textColor }}>{feature.title}</h4>
                           <p className="opacity-80 text-sm" style={{ color: section.content.textColor }}>{feature.text}</p>
                        </div>
                     ))}
                  </div>
               </div>
            )}

            {/* --- PRODUCTS SECTION --- */}
            {section.type === 'featured_products' && (
              <div className={`${currentTemplate.sectionSpacing} px-8 max-w-7xl mx-auto`}>
                <h3 className={`text-3xl ${section.content.align === 'left' ? 'text-left' : 'text-center'} mb-12 ${currentTemplate.id === 'luxury' ? 'font-serif italic' : 'font-bold'}`} style={{ color: theme.primary }}>{section.content.title}</h3>
                
                {addons.recommendations && (
                   <div className={`mb-8 flex ${section.content.align === 'left' ? 'justify-start' : 'justify-center'}`}>
                      <span className="bg-[#E6F4EA] text-[#00D098] px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 border border-[#00D098]/20">
                         <Sparkles className="w-3.5 h-3.5" /> Soovitatud just Sinule
                      </span>
                   </div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="group cursor-pointer flex flex-col h-full">
                      <div className="aspect-[3/4] bg-[#FAF7F2] mb-4 overflow-hidden relative" style={{ borderRadius: currentTemplate.radius }}>
                         <ImageWithFallback src={`https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="Product" />
                      </div>
                      <div className="mt-auto">
                        <div className="font-bold text-base text-[#2D2721] group-hover:text-[#E17B5C] transition-colors">Toode {i}</div>
                        <div className="text-[#8B7355] text-sm mt-1">Lühikirjeldus</div>
                        <div className="text-[#2D2721] font-bold mt-2">€129.00</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* --- VIDEO SECTION --- */}
            {section.type === 'video_hero' && (
               <div className="relative h-[400px] overflow-hidden bg-black flex items-center justify-center group">
                  <div className="absolute inset-0 bg-black/40 z-10"></div>
                  <ImageWithFallback src={section.content.bgImage || "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=1200&q=80"} className="absolute inset-0 w-full h-full object-cover opacity-60" alt="Video Bg" />
                  <div className="relative z-20 text-center text-white">
                     <div className="w-16 h-16 rounded-full border-2 border-white flex items-center justify-center mx-auto mb-6 cursor-pointer hover:bg-white hover:text-black transition-colors">
                        <Video className="w-6 h-6 ml-1" />
                     </div>
                     <h3 className="text-3xl font-bold mb-2">{section.content.title || 'Vaata meie lugu'}</h3>
                     <p className="opacity-80">{section.content.subtitle || 'Kuidas valmivad käsitööna meie tooted'}</p>
                  </div>
               </div>
            )}

            {/* --- RENTAL SECTION --- */}
            {section.type === 'rental_spotlight' && (
              <div className={`${currentTemplate.sectionSpacing} bg-[#1E1A17] text-[#E7DCC7]`}>
                <div className="max-w-6xl mx-auto px-8 grid md:grid-cols-2 gap-12 items-center">
                  <div className={section.content.align === 'right' ? 'order-2' : ''}>
                    <div className="inline-block px-3 py-1 bg-[#E17B5C] text-white text-xs font-bold mb-4" style={{ borderRadius: currentTemplate.radius }}>RENT</div>
                    <h3 className={`text-4xl mb-6 text-white ${currentTemplate.id === 'luxury' ? 'font-serif italic' : 'font-bold'}`}>{section.content.title}</h3>
                    <p className="mb-8 opacity-80 text-lg leading-relaxed">Miks osta, kui saab rentida? Meie valikus on üle 500 seadme alates kaameratest kuni droonideni.</p>
                    <WarmButton className="bg-[#FFC857] text-[#2D2721] hover:bg-[#E1AA36] border-none px-8 py-3 h-auto text-base">Broneeri kalendrist</WarmButton>
                  </div>
                  <div className={`grid grid-cols-2 gap-4 ${section.content.align === 'right' ? 'order-1' : ''}`}>
                     <div className="aspect-square bg-[#2D2721] overflow-hidden" style={{ borderRadius: currentTemplate.radius }}>
                        <ImageWithFallback src="https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&q=80" className="w-full h-full object-cover opacity-80 hover:opacity-100 transition-opacity" alt="Camera" />
                     </div>
                     <div className="aspect-square bg-[#2D2721] overflow-hidden mt-8" style={{ borderRadius: currentTemplate.radius }}>
                        <ImageWithFallback src="https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=400&q=80" className="w-full h-full object-cover opacity-80 hover:opacity-100 transition-opacity" alt="Drone" />
                     </div>
                  </div>
                </div>
              </div>
            )}

            {/* --- TESTIMONIALS --- */}
            {section.type === 'testimonials' && (
               <div className={`${currentTemplate.sectionSpacing} px-8 bg-[#FAF7F2]`}>
                  <h3 className={`${section.content.align === 'left' ? 'text-left' : 'text-center'} text-2xl font-bold mb-12 text-[#2D2721]`}>{section.content.title || 'Mida kliendid räägivad'}</h3>
                  <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-6">
                     {[1, 2, 3].map((i) => (
                        <div key={i} className="p-8 bg-white" style={{ borderRadius: currentTemplate.radius, boxShadow: currentTemplate.shadow }}>
                           <div className="flex text-[#FFC857] mb-4 gap-1">
                              {[1,2,3,4,5].map(s => <Star key={s} className="w-4 h-4 fill-current" />)}
                           </div>
                           <p className="text-[#6B5744] mb-6 italic">"Väga mugav rentimise protsess ja suurepärane klienditeenindus. Soovitan kindlasti!"</p>
                           <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-[#E7DCC7] rounded-full"></div>
                              <div className="text-sm font-bold text-[#2D2721]">Mari Maasikas</div>
                           </div>
                        </div>
                     ))}
                  </div>
               </div>
            )}

            {/* Hover overlay for Builder UI */}
            <div className="absolute inset-0 border-2 border-[#E17B5C] bg-[#E17B5C]/5 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity flex items-center justify-center z-30">
               <span className="bg-[#E17B5C] text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">Muuda sektsiooni</span>
            </div>
          </div>
        )})}
        
        {/* Footer Mock */}
        <footer className="bg-[#2D2721] text-white py-16 px-8 relative">
           <div className="max-w-6xl mx-auto grid md:grid-cols-4 gap-8 mb-12">
              <div>
                 <h4 className="font-bold text-lg mb-4">Minu Pood</h4>
                 <p className="text-white/60 text-sm">Parim valik tooteid ja renditeenuseid Eestis.</p>
              </div>
              <div>
                 <h4 className="font-bold mb-4">Lingid</h4>
                 <ul className="space-y-2 text-sm text-white/60">
                    {pages.map((p: any) => (
                       <li key={p.id}>{p.name}</li>
                    ))}
                 </ul>
              </div>
              <div>
                 <h4 className="font-bold mb-4">Kontakt</h4>
                 <ul className="space-y-2 text-sm text-white/60">
                    <li>info@minupood.ee</li>
                    <li>+372 5555 5555</li>
                 </ul>
              </div>
              <div>
                 <h4 className="font-bold mb-4">Jälgi meid</h4>
                 <div className="flex gap-4">
                    <Instagram className="w-5 h-5 text-white/60 hover:text-white cursor-pointer" />
                    <Globe className="w-5 h-5 text-white/60 hover:text-white cursor-pointer" />
                 </div>
              </div>
           </div>
           <div className="border-t border-white/10 pt-8 text-center text-white/40 text-sm flex justify-between items-center">
             <p>© 2024 Minu Pood. Kõik õigused kaitstud.</p>
             {addons.seoPro && (
                <div className="text-[10px] text-[#00D098] bg-[#00D098]/10 px-2 py-0.5 rounded border border-[#00D098]/20">SEO Optimeeritud</div>
             )}
           </div>
        </footer>
      </div>

      {/* Floating Addons */}
      {addons.chat && (
         <div className="absolute bottom-6 right-6 w-14 h-14 bg-[#E17B5C] rounded-full flex items-center justify-center text-white shadow-xl z-20 hover:scale-105 transition-transform cursor-pointer">
            <MessageCircle className="w-7 h-7" />
            <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-[#00D098] rounded-full border-2 border-white"></div>
         </div>
      )}
    </div>
  );
};

export function StorefrontEditor() {
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [activeTab, setActiveTab] = useState<'content' | 'design' | 'pages' | 'addons'>('content');
  const [editingSectionId, setEditingSectionId] = useState<number | null>(null);
  const [editingPageId, setEditingPageId] = useState<number | null>(null);
  const [editPageData, setEditPageData] = useState({ name: '', slug: '' });
  
  const [theme, setTheme] = useState({
    primary: '#2D2721',
    secondary: '#E17B5C',
    font: 'Inter'
  });

  const [template, setTemplate] = useState('modern');

  const [addons, setAddons] = useState({
    smartSearch: false,
    chat: false,
    recommendations: false,
    seoPro: false,
    multiLanguage: false,
    loyalty: false
  });

  const [pages, setPages] = useState([
     { id: 1, name: 'Avaleht', slug: '/' },
     { id: 2, name: 'Tooted', slug: '/shop' },
     { id: 3, name: 'Rent', slug: '/rent' }
  ]);
  const [newPageName, setNewPageName] = useState('');

  const [sections, setSections] = useState<any[]>([
    { 
       id: 1, 
       type: 'hero', 
       name: 'Avalöök (Hero)', 
       active: true, 
       content: { 
          title: 'Uus Kevadkollektsioon', 
          subtitle: 'Avasta hooaja parimad pakkumised ja rendivõimalused.',
          align: 'center',
          bgImage: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&q=80'
       } 
    },
    { id: 2, type: 'features', name: 'Eelised (Features)', active: true, content: { align: 'center', bgColor: '#FFFFFF' } },
    { id: 3, type: 'featured_products', name: 'Populaarsed Tooted', active: true, content: { title: 'Kliendid soovitavad', align: 'center' } },
    { id: 4, type: 'video_hero', name: 'Videolugu', active: false, content: { title: 'Meie Lugu', align: 'center' } },
    { id: 5, type: 'rental_spotlight', name: 'Rendiplokk', active: true, content: { title: 'Professionaalne Tehnika Rent', align: 'left' } },
    { id: 6, type: 'testimonials', name: 'Tagasiside', active: true, content: { title: 'Mida kliendid räägivad', align: 'center' } },
  ]);

  const toggleSection = (id: number) => {
    setSections(sections.map(s => s.id === id ? { ...s, active: !s.active } : s));
  };

  const updateSectionContent = (id: number, key: string, value: any) => {
     setSections(sections.map(s => s.id === id ? { ...s, content: { ...s.content, [key]: value } } : s));
  };

  const toggleAddon = (key: keyof typeof addons) => {
     setAddons(prev => {
        const newState = { ...prev, [key]: !prev[key] };
        if (newState[key]) {
           toast.success('Moodul aktiveeritud!', { description: 'Muudatus nähtav eelvaates.' });
        }
        return newState;
     });
  };

  const startEditingPage = (page: any) => {
    setEditingPageId(page.id);
    setEditPageData({ name: page.name, slug: page.slug });
  };

  const savePageEdit = () => {
    if (!editPageData.name) return;
    setPages(pages.map(p => p.id === editingPageId ? { ...p, ...editPageData } : p));
    setEditingPageId(null);
    toast.success('Lehe andmed uuendatud!');
  };

  const cancelPageEdit = () => {
    setEditingPageId(null);
  };

  const handleAddPage = () => {
     if (!newPageName) return;
     const newPage = {
        id: Math.random(),
        name: newPageName,
        slug: `/${newPageName.toLowerCase().replace(/\s+/g, '-')}`
     };
     setPages([...pages, newPage]);
     setNewPageName('');
     toast.success(`Leht "${newPage.name}" lisatud menüüsse`);
  };

  const handlePublish = () => {
    toast.success('Pood on avalikustatud!', {
      description: 'Teie muudatused on nüüd klientidele nähtavad.',
    });
  };

  const handleAddSection = () => {
    const newId = Math.max(0, ...sections.map(s => s.id)) + 1;
    const newSection = {
      id: newId,
      type: 'features',
      name: 'Uus Sektsioon',
      active: true,
      content: { 
        title: 'Uus Sektsioon', 
        align: 'center', 
        bgColor: '#FFFFFF',
        textColor: '#2D2721'
      }
    };
    setSections([...sections, newSection]);
    setEditingSectionId(newId);
    toast.success('Uus sektsioon lisatud!');
  };

  const editingSection = sections.find(s => s.id === editingSectionId);

  return (
    <div className="flex flex-col h-screen bg-[#FAF7F2] overflow-hidden">
      
      {/* Top Bar */}
      <header className="h-16 bg-white border-b border-[#E7DCC7] flex items-center justify-between px-6 z-20 shrink-0">
         <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-[#2D2721]">Poe Disainer</h1>
            <div className="h-6 w-px bg-[#E7DCC7]"></div>
            <div className="flex gap-1 bg-[#FAF7F2] p-1 rounded-lg border border-[#E7DCC7]">
               <button 
                  onClick={() => setViewMode('desktop')}
                  className={`p-1.5 rounded-md transition-all ${viewMode === 'desktop' ? 'bg-white shadow-sm text-[#2D2721]' : 'text-[#8B7355] hover:text-[#2D2721]'}`}
               >
                  <Monitor className="w-4 h-4" />
               </button>
               <button 
                  onClick={() => setViewMode('mobile')}
                  className={`p-1.5 rounded-md transition-all ${viewMode === 'mobile' ? 'bg-white shadow-sm text-[#2D2721]' : 'text-[#8B7355] hover:text-[#2D2721]'}`}
               >
                  <Smartphone className="w-4 h-4" />
               </button>
            </div>
         </div>

         <div className="flex items-center gap-3">
            <span className="text-xs text-[#6B5744] flex items-center gap-1.5">
               <div className="w-2 h-2 rounded-full bg-[#00D098]"></div>
               Salvestatud
            </span>
            <WarmButton variant="outline" className="gap-2">
               <Eye className="w-4 h-4" /> Eelvaade
            </WarmButton>
            <WarmButton className="gap-2 shadow-warm" onClick={handlePublish}>
               <Globe className="w-4 h-4" /> Avalikusta
            </WarmButton>
         </div>
      </header>

      {/* Main Workspace */}
      <div className="flex-1 flex overflow-hidden">
         
         {/* Left Sidebar - Controls */}
         <aside className="w-80 bg-white border-r border-[#E7DCC7] flex flex-col z-10 shrink-0">
            
            {/* If Editing a Section */}
            {editingSection ? (
               <div className="flex-1 flex flex-col">
                  <div className="p-4 border-b border-[#E7DCC7] flex items-center gap-2 bg-[#FAF7F2]">
                     <button onClick={() => setEditingSectionId(null)} className="p-1 hover:bg-white rounded">
                        <ChevronLeft className="w-5 h-5 text-[#8B7355]" />
                     </button>
                     <span className="font-bold text-[#2D2721] text-sm">Muuda: {editingSection.name}</span>
                  </div>
                  <div className="p-6 overflow-y-auto space-y-6">
                     <div className="space-y-3">
                        <Label>Pealkiri</Label>
                        <Input 
                           value={editingSection.content.title || ''} 
                           onChange={(e) => updateSectionContent(editingSection.id, 'title', e.target.value)}
                           className="bg-[#FAF7F2]"
                        />
                     </div>
                     
                     {(editingSection.type === 'hero' || editingSection.type === 'video_hero') && (
                        <div className="space-y-3">
                           <Label>Alapealkiri</Label>
                           <Textarea 
                              value={editingSection.content.subtitle || ''} 
                              onChange={(e) => updateSectionContent(editingSection.id, 'subtitle', e.target.value)}
                              className="bg-[#FAF7F2]"
                           />
                        </div>
                     )}

                     <div className="space-y-3">
                        <Label>Joondus</Label>
                        <div className="flex bg-[#FAF7F2] p-1 rounded-lg border border-[#E7DCC7]">
                           {['left', 'center', 'right'].map((align) => (
                              <button
                                 key={align}
                                 onClick={() => updateSectionContent(editingSection.id, 'align', align)}
                                 className={`flex-1 p-2 rounded flex justify-center ${editingSection.content.align === align ? 'bg-white shadow-sm' : 'text-[#8B7355]'}`}
                              >
                                 {align === 'left' && <AlignLeft className="w-4 h-4" />}
                                 {align === 'center' && <AlignCenter className="w-4 h-4" />}
                                 {align === 'right' && <AlignRight className="w-4 h-4" />}
                              </button>
                           ))}
                        </div>
                     </div>

                     <div className="space-y-3">
                        <Label>Taustapilt (URL)</Label>
                        <div className="flex gap-2">
                           <Input 
                              value={editingSection.content.bgImage || ''} 
                              onChange={(e) => updateSectionContent(editingSection.id, 'bgImage', e.target.value)}
                              placeholder="https://..."
                              className="bg-[#FAF7F2]"
                           />
                           <button className="p-2 bg-[#FAF7F2] border border-[#E7DCC7] rounded hover:bg-white" title="Vali galeriist">
                              <ImageIcon className="w-4 h-4 text-[#8B7355]" />
                           </button>
                        </div>
                     </div>

                     <div className="space-y-3">
                        <Label>Värvid</Label>
                        <div className="grid grid-cols-2 gap-3">
                           <div>
                              <div className="text-xs text-[#8B7355] mb-1">Taust</div>
                              <div className="flex gap-2">
                                 {['#FFFFFF', '#FAF7F2', '#1E1A17', '#E17B5C'].map(c => (
                                    <button 
                                       key={c}
                                       onClick={() => updateSectionContent(editingSection.id, 'bgColor', c)}
                                       className={`w-6 h-6 rounded-full border border-gray-200 ${editingSection.content.bgColor === c ? 'ring-2 ring-offset-2 ring-[#2D2721]' : ''}`}
                                       style={{ backgroundColor: c }}
                                    />
                                 ))}
                              </div>
                           </div>
                           <div>
                              <div className="text-xs text-[#8B7355] mb-1">Tekst</div>
                              <div className="flex gap-2">
                                 {['#2D2721', '#FFFFFF', '#E17B5C'].map(c => (
                                    <button 
                                       key={c}
                                       onClick={() => updateSectionContent(editingSection.id, 'textColor', c)}
                                       className={`w-6 h-6 rounded-full border border-gray-200 ${editingSection.content.textColor === c ? 'ring-2 ring-offset-2 ring-[#2D2721]' : ''}`}
                                       style={{ backgroundColor: c }}
                                    />
                                 ))}
                              </div>
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
            ) : (
               <>
                  {/* Tabs */}
                  <div className="flex border-b border-[#E7DCC7]">
                     <button 
                        onClick={() => setActiveTab('content')}
                        className={`flex-1 py-4 text-sm font-bold border-b-2 transition-colors ${activeTab === 'content' ? 'border-[#E17B5C] text-[#2D2721]' : 'border-transparent text-[#8B7355] hover:text-[#2D2721]'}`}
                     >
                        Sisu
                     </button>
                     <button 
                        onClick={() => setActiveTab('design')}
                        className={`flex-1 py-4 text-sm font-bold border-b-2 transition-colors ${activeTab === 'design' ? 'border-[#E17B5C] text-[#2D2721]' : 'border-transparent text-[#8B7355] hover:text-[#2D2721]'}`}
                     >
                        Kujundus
                     </button>
                     <button 
                        onClick={() => setActiveTab('pages')}
                        className={`flex-1 py-4 text-sm font-bold border-b-2 transition-colors ${activeTab === 'pages' ? 'border-[#E17B5C] text-[#2D2721]' : 'border-transparent text-[#8B7355] hover:text-[#2D2721]'}`}
                     >
                        Lehed
                     </button>
                     <button 
                        onClick={() => setActiveTab('addons')}
                        className={`flex-1 py-4 text-sm font-bold border-b-2 transition-colors flex items-center justify-center gap-1 ${activeTab === 'addons' ? 'border-[#E17B5C] text-[#2D2721]' : 'border-transparent text-[#8B7355] hover:text-[#2D2721]'}`}
                     >
                        <Zap className="w-3.5 h-3.5" />
                     </button>
                  </div>

                  {/* Sidebar Content */}
                  <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                     
                     {activeTab === 'content' && (
                        <div className="space-y-6">
                           <div>
                              <h3 className="text-xs font-bold text-[#8B7355] uppercase tracking-wider mb-4">Aktiivsed Sektsioonid</h3>
                              <div className="space-y-3">
                                 {sections.map((section, index) => (
                                    <div key={section.id} onClick={() => setEditingSectionId(section.id)} className="bg-[#FAF7F2] border border-[#E7DCC7] rounded-lg p-3 flex items-center justify-between group hover:border-[#FFC857] transition-all cursor-pointer">
                                       <div className="flex items-center gap-3">
                                          <div className="cursor-move text-[#E7DCC7] group-hover:text-[#8B7355]" onClick={(e) => e.stopPropagation()}>
                                             <MoveVertical className="w-4 h-4" />
                                          </div>
                                          <div>
                                             <div className="text-sm font-bold text-[#2D2721]">{section.name}</div>
                                             <div className="text-[10px] text-[#8B7355]">{section.active ? 'Nähtav' : 'Peidetud'}</div>
                                          </div>
                                       </div>
                                       <div className="flex items-center gap-2">
                                          <Switch checked={section.active} onCheckedChange={() => toggleSection(section.id)} onClick={(e) => e.stopPropagation()} />
                                          <button className="p-1.5 hover:bg-white rounded text-[#E17B5C]">
                                             <Settings className="w-4 h-4" />
                                          </button>
                                       </div>
                                    </div>
                                 ))}
                              </div>
                           </div>

                           <WarmButton onClick={handleAddSection} variant="outline" className="w-full border-dashed gap-2">
                              <Plus className="w-4 h-4" /> Lisa uus sektsioon
                           </WarmButton>
                        </div>
                     )}

                     {activeTab === 'pages' && (
                        <div className="space-y-6">
                           <div className="bg-[#FAF7F2] p-4 rounded-xl">
                              <h3 className="text-sm font-bold text-[#2D2721] mb-2">Menüü Struktuur</h3>
                              <div className="space-y-2">
                                 {pages.map((page) => (
                                    <div key={page.id} className="bg-white p-3 rounded-lg border border-[#E7DCC7] shadow-sm">
                                       {editingPageId === page.id ? (
                                          <div className="space-y-2">
                                             <Input 
                                                value={editPageData.name} 
                                                onChange={(e) => setEditPageData({...editPageData, name: e.target.value})}
                                                placeholder="Lehe nimi"
                                                className="h-8 text-sm"
                                             />
                                             <Input 
                                                value={editPageData.slug} 
                                                onChange={(e) => setEditPageData({...editPageData, slug: e.target.value})}
                                                placeholder="/slug"
                                                className="h-8 text-sm font-mono text-[#8B7355]"
                                             />
                                             <div className="flex gap-2 justify-end mt-2">
                                                <button onClick={cancelPageEdit} className="p-1 text-[#8B7355] hover:text-[#2D2721]"><X className="w-4 h-4" /></button>
                                                <button onClick={savePageEdit} className="p-1 text-[#00D098] hover:text-[#00A070]"><Check className="w-4 h-4" /></button>
                                             </div>
                                          </div>
                                       ) : (
                                          <div className="flex items-center justify-between">
                                             <div className="flex items-center gap-2">
                                                <FileText className="w-4 h-4 text-[#E17B5C]" />
                                                <div>
                                                   <span className="text-sm font-medium block">{page.name}</span>
                                                   <span className="text-[10px] text-[#8B7355] font-mono">{page.slug}</span>
                                                </div>
                                             </div>
                                             <div className="flex gap-1">
                                                <button onClick={() => startEditingPage(page)} className="p-1.5 text-[#8B7355] hover:text-[#2D2721] rounded hover:bg-[#FAF7F2]">
                                                   <Pencil className="w-3.5 h-3.5" />
                                                </button>
                                                {page.slug !== '/' && (
                                                   <button onClick={() => setPages(pages.filter(p => p.id !== page.id))} className="p-1.5 text-[#8B7355] hover:text-red-500 rounded hover:bg-[#FAF7F2]">
                                                      <Trash2 className="w-3.5 h-3.5" />
                                                   </button>
                                                )}
                                             </div>
                                          </div>
                                       )}
                                    </div>
                                 ))}
                              </div>
                           </div>
                           
                           <div className="space-y-3">
                              <Label>Lisa uus leht</Label>
                              <div className="flex gap-2">
                                 <Input 
                                    placeholder="Nt. Meist" 
                                    className="bg-white"
                                    value={newPageName}
                                    onChange={(e) => setNewPageName(e.target.value)}
                                 />
                                 <WarmButton onClick={handleAddPage}>
                                    <Plus className="w-4 h-4" />
                                 </WarmButton>
                              </div>
                           </div>
                        </div>
                     )}

                     {activeTab === 'design' && (
                        <div className="space-y-8 animate-in slide-in-from-left-4 duration-300">
                           {/* Layout Templates */}
                           <div>
                              <h3 className="text-xs font-bold text-[#8B7355] uppercase tracking-wider mb-4 flex items-center gap-2">
                                 <LayoutTemplate className="w-4 h-4" />
                                 Vali Põhiplaan
                              </h3>
                              <div className="grid gap-3">
                                 {Object.values(TEMPLATES).map((tmpl) => (
                                    <button
                                       key={tmpl.id}
                                       onClick={() => setTemplate(tmpl.id)}
                                       className={`p-3 rounded-xl border-2 text-left transition-all relative overflow-hidden group ${
                                          template === tmpl.id 
                                             ? 'border-[#E17B5C] bg-[#FFF9ED]' 
                                             : 'border-[#E7DCC7] bg-white hover:border-[#FFC857]'
                                       }`}
                                    >
                                       <div className="flex items-center justify-between mb-1">
                                          <span className={`font-bold ${template === tmpl.id ? 'text-[#2D2721]' : 'text-[#6B5744]'}`}>
                                             {tmpl.name}
                                          </span>
                                          {template === tmpl.id && <Check className="w-4 h-4 text-[#E17B5C]" />}
                                       </div>
                                    </button>
                                 ))}
                              </div>
                           </div>
                        </div>
                     )}

                     {activeTab === 'addons' && (
                        <div className="space-y-6">
                           <div className="bg-gradient-to-br from-[#2D2721] to-[#3E362E] rounded-xl p-4 text-white mb-6">
                              <div className="flex items-center gap-2 mb-2">
                                 <Rocket className="w-5 h-5 text-[#FFC857]" />
                                 <h3 className="font-bold">Full Stack Pakett</h3>
                              </div>
                              <p className="text-xs opacity-80 mb-3">Vii oma e-pood uuele tasemele nutikate lisadega.</p>
                           </div>

                           <div className="space-y-4">
                              <div className="flex items-start justify-between">
                                 <div>
                                    <div className="flex items-center gap-2 font-bold text-[#2D2721] text-sm">
                                       <Search className="w-4 h-4 text-[#E17B5C]" />
                                       Nutikas Otsing
                                    </div>
                                    <p className="text-[10px] text-[#8B7355] mt-1 max-w-[180px]">AI-põhine otsingumootor.</p>
                                 </div>
                                 <Switch checked={addons.smartSearch} onCheckedChange={() => toggleAddon('smartSearch')} />
                              </div>

                              <div className="h-px bg-[#E7DCC7]"></div>

                              <div className="flex items-start justify-between">
                                 <div>
                                    <div className="flex items-center gap-2 font-bold text-[#2D2721] text-sm">
                                       <Bot className="w-4 h-4 text-[#E17B5C]" />
                                       AI Chatbot
                                    </div>
                                    <p className="text-[10px] text-[#8B7355] mt-1 max-w-[180px]">24/7 automaatne klienditugi.</p>
                                 </div>
                                 <Switch checked={addons.chat} onCheckedChange={() => toggleAddon('chat')} />
                              </div>
                           </div>
                        </div>
                     )}
                  </div>
               </>
            )}
         </aside>

         {/* Center - Preview Area */}
         <main className="flex-1 bg-[#F0EBE0] overflow-y-auto p-8 flex items-start justify-center relative">
            <LivePreview sections={sections} addons={addons} theme={theme} template={template} viewMode={viewMode} pages={pages} />
            
            {/* Helper Text */}
            <div className="fixed bottom-6 right-6 bg-white/90 backdrop-blur px-4 py-2 rounded-full text-xs font-bold text-[#6B5744] border border-[#E7DCC7] shadow-lg animate-pulse">
               Automaatne salvestamine...
            </div>
         </main>

      </div>
    </div>
  );
}
