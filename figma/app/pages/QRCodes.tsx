import { useState, useRef } from 'react';
import { WarmCard } from '@/figma/app/components/WarmCard';
import { WarmButton } from '@/figma/app/components/WarmButton';
import { QRCodeSVG } from 'qrcode.react';
import { 
  Download, 
  Settings2, 
  Palette, 
  Image as ImageIcon,
  Link as LinkIcon,
  Save,
  Trash2,
  QrCode,
  Type,
  Globe,
  Sparkles,
  Check
} from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/figma/app/components/ui/input';
import { Label } from '@/figma/app/components/ui/label';
import { Slider } from '@/figma/app/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/figma/app/components/ui/tabs';
import { Switch } from '@/figma/app/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/figma/app/components/ui/select';
import { cn } from '@/figma/lib/utils';

// Mock data for saved codes
const SAVED_CODES = [
  {
    id: '1',
    title: 'Summer Sale 20%',
    url: 'https://gifthub.eu/voucher/summer-2024',
    color: '#2D2721',
    bgColor: '#FFFFFF',
    createdAt: '2024-01-15',
    scans: 234,
  },
  {
    id: '2',
    title: 'VIP Event Entry',
    url: 'https://gifthub.eu/event/vip-night',
    color: '#E17B5C',
    bgColor: '#FFF9ED',
    createdAt: '2024-01-20',
    scans: 156,
  }
];

const PRESET_COLORS = [
  { name: 'Classic Black', fg: '#000000', bg: '#FFFFFF' },
  { name: 'Warm Earth', fg: '#6B5744', bg: '#FFF9ED' },
  { name: 'Forest Green', fg: '#2D5B46', bg: '#E8F5F1' },
  { name: 'Sunset Gold', fg: '#B58D3F', bg: '#FFFBE6' },
  { name: 'Brand Primary', fg: '#FFC857', bg: '#2D2721' },
  { name: 'Ocean Blue', fg: '#1E3A8A', bg: '#EFF6FF' },
];

export function QRCodes() {
  const [activeTab, setActiveTab] = useState('design');
  const [url, setUrl] = useState('https://gifthub.eu');
  const [title, setTitle] = useState('');
  const [fgColor, setFgColor] = useState('#2D2721');
  const [bgColor, setBgColor] = useState('#FFFFFF');
  const [includeLogo, setIncludeLogo] = useState(true);
  const [logoSize, setLogoSize] = useState(40);
  const [qrSize] = useState(256);
  const [savedCodes, setSavedCodes] = useState(SAVED_CODES);
  
  const qrRef = useRef<HTMLDivElement>(null);

  const handleDownload = () => {
    const svg = qrRef.current?.querySelector('svg');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    const margin = 20;

    img.onload = () => {
      canvas.width = img.width + margin * 2;
      canvas.height = img.height + margin * 2;
      
      if (ctx) {
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, margin, margin);
      }
      
      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = `qr-${title || 'code'}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
      toast.success('Allalaadimine õnnestus');
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  const handleSave = () => {
    if (!title) {
      toast.error('Palun lisa koodile nimi');
      return;
    }
    
    const newCode = {
      id: Date.now().toString(),
      title,
      url,
      color: fgColor,
      bgColor,
      createdAt: new Date().toISOString(),
      scans: 0
    };
    
    setSavedCodes([newCode, ...savedCodes]);
    toast.success('QR kood salvestatud');
    setActiveTab('library');
  };

  const loadCode = (code: typeof SAVED_CODES[0]) => {
    setTitle(code.title);
    setUrl(code.url);
    setFgColor(code.color);
    setBgColor(code.bgColor || '#FFFFFF');
    setActiveTab('design');
    toast.info(`Laetud "${code.title}"`);
  };

  const handleDelete = (id: string) => {
    setSavedCodes(savedCodes.filter(c => c.id !== id));
    toast.success('QR kood kustutatud');
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-[#E7DCC7] pb-6">
        <div>
          <h1 className="text-3xl font-display font-bold text-[#2D2721] flex items-center gap-3">
            <QrCode className="w-8 h-8 text-[#E17B5C]" />
            QR Disainer
          </h1>
          <p className="text-[#6B5744] mt-2 text-lg">Loo unikaalseid ja bränditud QR koode oma kampaaniate jaoks.</p>
        </div>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto">
          <TabsList className="grid w-full grid-cols-2 bg-[#FAF7F2] border border-[#E7DCC7]">
            <TabsTrigger value="design" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Disainer</TabsTrigger>
            <TabsTrigger value="library" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Salvestatud</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
        
        {/* DESIGN TAB */}
        <TabsContent value="design" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            
            {/* Left Column: Controls */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* 1. Content */}
              <WarmCard padding="lg" className="bg-white">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-[#FFF9ED] flex items-center justify-center text-[#E17B5C]">
                    <Globe className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#2D2721] text-lg">Sisu ja Sihtkoht</h3>
                    <p className="text-xs text-[#8B7355]">Kuhu QR kood peaks viima?</p>
                  </div>
                </div>

                <div className="space-y-5">
                  <div className="space-y-2">
                    <Label className="text-[#2D2721] font-medium flex items-center gap-2">
                      <Type className="w-4 h-4 text-[#8B7355]" />
                      Nimi (Sisemiseks kasutuseks)
                    </Label>
                    <Input 
                      placeholder="nt. Suvekampaania Flaier" 
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="bg-[#FAF7F2] border-[#E7DCC7] focus:border-[#E17B5C] focus:ring-[#E17B5C]"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-[#2D2721] font-medium flex items-center gap-2">
                      <LinkIcon className="w-4 h-4 text-[#8B7355]" />
                      Sihtkoha URL
                    </Label>
                    <div className="flex gap-2">
                      <Input 
                        placeholder="https://..." 
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        className="bg-[#FAF7F2] border-[#E7DCC7] focus:border-[#E17B5C] focus:ring-[#E17B5C]"
                      />
                    </div>
                    
                    <Select onValueChange={(val) => setUrl(val)}>
                      <SelectTrigger className="w-full bg-white border-[#E7DCC7] text-[#6B5744]">
                        <SelectValue placeholder="Või vali kiirlink..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="https://gifthub.eu">Avaleht</SelectItem>
                        <SelectItem value="https://gifthub.eu/vouchers">Kõik Vautšerid</SelectItem>
                        <SelectItem value="https://gifthub.eu/campaigns">Kampaaniad</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </WarmCard>

              {/* 2. Appearance */}
              <WarmCard padding="lg" className="bg-white">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-[#E8F5F1] flex items-center justify-center text-[#2D5B46]">
                    <Palette className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#2D2721] text-lg">Välimus</h3>
                    <p className="text-xs text-[#8B7355]">Kohanda värve ja stiili</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <Label className="mb-3 block text-[#2D2721] font-medium">Valmis teemad</Label>
                    <div className="grid grid-cols-6 gap-2">
                      {PRESET_COLORS.map((preset) => {
                        const isActive = fgColor === preset.fg && bgColor === preset.bg;
                        return (
                          <button
                            key={preset.name}
                            onClick={() => {
                              setFgColor(preset.fg);
                              setBgColor(preset.bg);
                            }}
                            className={cn(
                              "aspect-square rounded-xl border-2 transition-all relative group overflow-hidden",
                              isActive ? "border-[#2D2721] scale-110 shadow-md" : "border-transparent hover:scale-105"
                            )}
                            style={{ background: preset.bg }}
                            title={preset.name}
                          >
                            <div 
                              className="absolute inset-0 m-auto w-1/2 h-1/2 rounded-full shadow-sm" 
                              style={{ background: preset.fg }} 
                            />
                            {isActive && (
                              <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                                <Check className="w-4 h-4 text-[#2D2721] drop-shadow-md" />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs uppercase tracking-wider font-bold text-[#8B7355]">Koodi värv</Label>
                      <div className="flex items-center gap-3 p-2 rounded-lg border border-[#E7DCC7] bg-[#FAF7F2]">
                        <div className="relative w-8 h-8 rounded-full overflow-hidden shadow-sm border border-black/5 shrink-0">
                          <input 
                            type="color" 
                            value={fgColor}
                            onChange={(e) => setFgColor(e.target.value)}
                            className="absolute inset-0 w-[150%] h-[150%] -top-1/4 -left-1/4 cursor-pointer p-0 border-0"
                          />
                        </div>
                        <span className="text-sm font-mono text-[#6B5744] uppercase">{fgColor}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs uppercase tracking-wider font-bold text-[#8B7355]">Taust</Label>
                      <div className="flex items-center gap-3 p-2 rounded-lg border border-[#E7DCC7] bg-[#FAF7F2]">
                        <div className="relative w-8 h-8 rounded-full overflow-hidden shadow-sm border border-black/5 shrink-0">
                          <input 
                            type="color" 
                            value={bgColor}
                            onChange={(e) => setBgColor(e.target.value)}
                            className="absolute inset-0 w-[150%] h-[150%] -top-1/4 -left-1/4 cursor-pointer p-0 border-0"
                          />
                        </div>
                        <span className="text-sm font-mono text-[#6B5744] uppercase">{bgColor}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </WarmCard>

              {/* 3. Logo */}
              <WarmCard padding="lg" className="bg-white">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-[#FFF0F0] flex items-center justify-center text-[#D16B4C]">
                    <ImageIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#2D2721] text-lg">Logo</h3>
                    <p className="text-xs text-[#8B7355]">Lisa oma brändi logo</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center justify-between p-3 bg-[#FAF7F2] rounded-xl border border-[#E7DCC7]">
                    <div className="flex flex-col">
                      <span className="font-medium text-[#2D2721]">Näita logot</span>
                      <span className="text-xs text-[#8B7355]">Kuvatakse koodi keskel</span>
                    </div>
                    <Switch 
                      checked={includeLogo}
                      onCheckedChange={setIncludeLogo}
                    />
                  </div>

                  {includeLogo && (
                    <div className="space-y-3 px-1">
                       <div className="flex justify-between items-center text-sm">
                         <span className="text-[#6B5744]">Logo suurus</span>
                         <span className="font-bold text-[#2D2721]">{logoSize}px</span>
                       </div>
                       <Slider 
                         value={[logoSize]} 
                         min={20} 
                         max={60} 
                         step={5} 
                         onValueChange={([val]) => setLogoSize(val)}
                         className="py-2"
                       />
                    </div>
                  )}
                </div>
              </WarmCard>
            </div>

            {/* Right Column: Preview */}
            <div className="lg:col-span-7">
              <div className="sticky top-24 space-y-6">
                <WarmCard padding="none" className="bg-[#FAF7F2] border-[#E7DCC7] overflow-hidden flex flex-col items-center justify-center min-h-[500px] relative">
                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
                  
                  <div className="relative z-10 text-center mb-8">
                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/50 border border-[#E7DCC7] text-xs font-bold text-[#8B7355] uppercase tracking-wider mb-2">
                      <Sparkles className="w-3 h-3" />
                      Live Eelvaade
                    </span>
                    <h2 className="text-2xl font-bold text-[#2D2721]">{title || "Sinu Kampaania"}</h2>
                    <p className="text-[#6B5744] text-sm max-w-xs mx-auto truncate mt-1">{url}</p>
                  </div>

                  <div 
                    ref={qrRef}
                    className="p-8 bg-white rounded-3xl shadow-warm-lg transition-all duration-300 transform hover:scale-105"
                    style={{ backgroundColor: bgColor }}
                  >
                    <QRCodeSVG
                      value={url}
                      size={qrSize}
                      fgColor={fgColor}
                      bgColor={bgColor}
                      level="H"
                      includeMargin={false}
                      imageSettings={includeLogo ? {
                        src: "https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=64&h=64&fit=crop&q=80",
                        x: undefined,
                        y: undefined,
                        height: logoSize,
                        width: logoSize,
                        excavate: true,
                      } : undefined}
                    />
                  </div>

                  <div className="relative z-10 mt-10 flex flex-col sm:flex-row gap-4 w-full max-w-md px-6">
                     <WarmButton onClick={handleDownload} size="lg" className="flex-1 shadow-lg shadow-[#FFC857]/20">
                       <Download className="h-5 w-5 mr-2" />
                       Lae alla (PNG)
                     </WarmButton>
                     <WarmButton variant="secondary" onClick={handleSave} size="lg" className="flex-1 bg-white hover:bg-white/80">
                       <Save className="h-5 w-5 mr-2" />
                       Salvesta
                     </WarmButton>
                  </div>
                </WarmCard>

                <div className="flex gap-4 p-4 bg-blue-50/50 border border-blue-100 rounded-xl text-blue-800 text-sm">
                  <Settings2 className="h-5 w-5 shrink-0 mt-0.5" />
                  <p>
                    <span className="font-bold block mb-1">Soovitus:</span>
                    Parima loetavuse tagamiseks kasuta alati tumedat koodi heledal taustal. Kontrolli koodi oma telefoni kaameraga enne trükki saatmist.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* LIBRARY TAB */}
        <TabsContent value="library" className="animate-in fade-in zoom-in-95 duration-300">
          {savedCodes.length === 0 ? (
            <div className="text-center py-24 bg-white rounded-3xl border border-[#E7DCC7] border-dashed">
              <div className="w-24 h-24 bg-[#FFF9ED] rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                <QrCode className="h-10 w-10 text-[#FFC857]" />
              </div>
              <h3 className="text-2xl font-bold text-[#2D2721] mb-2">Pole salvestatud koode</h3>
              <p className="text-[#6B5744] mb-8 max-w-md mx-auto">Sinu salvestatud disainid ilmuvad siia. Loo oma esimene kood ja salvesta see hilisemaks kasutamiseks.</p>
              <WarmButton onClick={() => setActiveTab('design')} size="lg">
                Loo esimene kood
              </WarmButton>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {savedCodes.map((code) => (
                <WarmCard key={code.id} hover padding="lg" className="group bg-white">
                  <div className="flex justify-between items-start mb-4">
                    <div 
                      className="w-16 h-16 rounded-xl border flex items-center justify-center overflow-hidden bg-white shadow-sm transition-transform group-hover:scale-105"
                      style={{ backgroundColor: code.bgColor || '#FFFFFF' }}  
                    >
                      <QRCodeSVG
                        value={code.url}
                        size={48}
                        fgColor={code.color}
                        bgColor={code.bgColor}
                      />
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                       <button 
                         onClick={() => loadCode(code)}
                         className="p-2 hover:bg-[#FFF9ED] rounded-lg text-[#8B7355] transition-colors"
                         title="Muuda"
                       >
                         <Settings2 className="h-4 w-4" />
                       </button>
                       <button 
                         onClick={() => handleDelete(code.id)}
                         className="p-2 hover:bg-[#FEE2E2] rounded-lg text-[#E17B5C] transition-colors"
                         title="Kustuta"
                       >
                         <Trash2 className="h-4 w-4" />
                       </button>
                    </div>
                  </div>
                  
                  <h3 className="font-bold text-[#2D2721] text-lg mb-1 truncate">{code.title}</h3>
                  <div className="flex items-center gap-1.5 text-xs text-[#8B7355] mb-4 bg-[#FAF7F2] p-2 rounded-lg border border-[#E7DCC7]/50">
                    <LinkIcon className="h-3 w-3 shrink-0" />
                    <span className="truncate">{code.url}</span>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-[#E7DCC7]/30">
                    <div className="text-xs font-medium text-[#6B5744] flex items-center gap-1">
                      <Download className="w-3 h-3" />
                      {code.scans} allalaadimist
                    </div>
                    <span className="text-[10px] uppercase tracking-wider text-[#8B7355] font-bold">
                      {new Date(code.createdAt).toLocaleDateString('et-EE')}
                    </span>
                  </div>
                </WarmCard>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
