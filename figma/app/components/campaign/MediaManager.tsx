import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Upload, Search, Wand2, Image as ImageIcon, X, Loader2, Sparkles, Download } from 'lucide-react';
import { Input } from '@app/components/ui/input';
import { Button } from '@app/components/ui/button';
import { Label } from '@app/components/ui/label';
import { cn } from '@app/components/ui/utils';

// Mock data for AI generation simulation
const MOCK_GENERATED_IMAGES = [
  "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1633526543814-9718c8922b7a?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&q=80&w=800"
];

const STOCK_IMAGES = [
  "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1544148103-0773bf10d330?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1600891964599-f61ba0e24092?auto=format&fit=crop&q=80&w=800"
];

interface MediaManagerProps {
  onSelect: (imageUrl: string) => void;
  currentImage?: string | null;
  className?: string;
}

type Tab = 'upload' | 'stock' | 'ai';

export function MediaManager({ onSelect, currentImage, className }: MediaManagerProps) {
  const [activeTab, setActiveTab] = useState<Tab>('upload');
  const [dragActive, setDragActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // AI Generator State
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [aiStyle, setAiStyle] = useState('realistic');

  // Handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      handleFile(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    // In a real app, this would upload to S3/Supabase Storage
    const reader = new FileReader();
    reader.onloadend = () => {
      onSelect(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleGenerate = () => {
    if (!aiPrompt) return;
    setIsGenerating(true);
    // Simulate API delay
    setTimeout(() => {
      setIsGenerating(false);
      setGeneratedImages(MOCK_GENERATED_IMAGES);
    }, 2500);
  };

  return (
    <div className={cn("bg-white border border-[#E7DCC7] rounded-xl overflow-hidden shadow-sm", className)}>
      {/* Tabs Header */}
      <div className="flex border-b border-[#F2EDE3]">
        <button
          onClick={() => setActiveTab('upload')}
          className={cn(
            "flex-1 py-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors relative",
            activeTab === 'upload' ? "text-[#2D2721] bg-[#FFF9ED]" : "text-[#8B7355] hover:bg-[#FAF7F2]"
          )}
        >
          <Upload className="w-4 h-4" />
          <span>Üleslaadimine</span>
          {activeTab === 'upload' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#E17B5C]" />}
        </button>
        <button
          onClick={() => setActiveTab('stock')}
          className={cn(
            "flex-1 py-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors relative",
            activeTab === 'stock' ? "text-[#2D2721] bg-[#FFF9ED]" : "text-[#8B7355] hover:bg-[#FAF7F2]"
          )}
        >
          <Search className="w-4 h-4" />
          <span>Pildipank</span>
          {activeTab === 'stock' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#E17B5C]" />}
        </button>
        <button
          onClick={() => setActiveTab('ai')}
          className={cn(
            "flex-1 py-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors relative",
            activeTab === 'ai' ? "text-[#6A0DAD] bg-[#F8F0FF]" : "text-[#8B7355] hover:bg-[#FAF7F2]"
          )}
        >
          <Wand2 className="w-4 h-4" />
          <span>AI Generaator</span>
          {activeTab === 'ai' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#6A0DAD]" />}
        </button>
      </div>

      {/* Content Area */}
      <div className="p-6 bg-[#FAF7F2] min-h-[320px]">
        <AnimatePresence mode="wait">
          
          {/* UPLOAD TAB */}
          {activeTab === 'upload' && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="h-full"
            >
              <div 
                className={cn(
                  "border-2 border-dashed rounded-xl p-10 text-center h-full flex flex-col items-center justify-center transition-all bg-white",
                  dragActive ? "border-[#E17B5C] bg-[#FFF9ED]" : "border-[#E7DCC7] hover:border-[#FFC857]"
                )}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <div className="w-16 h-16 bg-[#FFF9ED] rounded-full flex items-center justify-center mb-4 text-[#FFC857]">
                  <Upload className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-medium text-[#2D2721] mb-2">Lohista pilt siia</h3>
                <p className="text-sm text-[#8B7355] mb-6">või vali fail arvutist (JPG, PNG)</p>
                
                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileChange}
                />
                <Label 
                  htmlFor="file-upload" 
                  className="cursor-pointer bg-[#2D2721] text-white px-6 py-2.5 rounded-full font-medium text-sm hover:bg-[#4A4036] transition-colors"
                >
                  Vali fail
                </Label>
              </div>
            </motion.div>
          )}

          {/* STOCK TAB */}
          {activeTab === 'stock' && (
            <motion.div
              key="stock"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="h-full flex flex-col"
            >
              <div className="flex gap-2 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8B7355] w-4 h-4" />
                  <Input 
                    placeholder="Otsi pildipangast (nt. restoran, spa...)" 
                    className="pl-9 bg-white"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Button variant="outline" className="bg-white">Otsi</Button>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 overflow-y-auto max-h-[300px] pr-2">
                {STOCK_IMAGES.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => onSelect(img)}
                    className="relative group aspect-square rounded-lg overflow-hidden border border-[#E7DCC7] hover:border-[#E17B5C] transition-all"
                  >
                    <img src={img} alt="Stock" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Download className="text-white w-6 h-6" />
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* AI GENERATOR TAB */}
          {activeTab === 'ai' && (
            <motion.div
              key="ai"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="h-full"
            >
              <div className="bg-white p-4 rounded-xl border border-[#E7DCC7] mb-4 shadow-sm">
                <div className="flex gap-3 mb-3">
                  <div className="flex-1">
                    <Label className="text-xs text-[#8B7355] mb-1.5 block">Mida soovid luua?</Label>
                    <Input 
                      placeholder="Nt. Luksuslik õhtusöök küünlavalgel, vaade merele..." 
                      className="bg-[#FAF7F2]"
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                    />
                  </div>
                  <div className="w-1/3">
                    <Label className="text-xs text-[#8B7355] mb-1.5 block">Stiil</Label>
                    <select 
                      className="w-full h-10 px-3 rounded-md border border-input bg-[#FAF7F2] text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      value={aiStyle}
                      onChange={(e) => setAiStyle(e.target.value)}
                    >
                      <option value="realistic">Fotorealistlik</option>
                      <option value="artistic">Kunstiline</option>
                      <option value="minimal">Minimalistlik</option>
                    </select>
                  </div>
                </div>
                <Button 
                  onClick={handleGenerate} 
                  disabled={!aiPrompt || isGenerating}
                  className="w-full bg-gradient-to-r from-[#6A0DAD] to-[#9D4EDD] hover:from-[#580B91] hover:to-[#7B2CBF] text-white border-none shadow-md"
                >
                  {isGenerating ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Genereerin visuaale...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      Genereeri (3 krediiti)
                    </span>
                  )}
                </Button>
              </div>

              {/* Results */}
              {generatedImages.length > 0 ? (
                 <div className="space-y-2">
                   <Label className="text-xs text-[#8B7355]">Tulemused</Label>
                   <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {generatedImages.map((img, i) => (
                      <motion.button
                        key={i}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.1 }}
                        onClick={() => onSelect(img)}
                        className="relative group aspect-square rounded-lg overflow-hidden border border-[#E7DCC7] hover:border-[#6A0DAD] shadow-sm hover:shadow-md transition-all"
                      >
                        <img src={img} alt="Generated" className="w-full h-full object-cover" />
                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-1 text-center">
                          <span className="text-[10px] text-white uppercase tracking-wider font-bold">Vali</span>
                        </div>
                      </motion.button>
                    ))}
                   </div>
                 </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[180px] text-[#8B7355] opacity-50 border-2 border-dashed border-[#E7DCC7] rounded-xl bg-[#FFFBF5]">
                  <Sparkles className="w-8 h-8 mb-2" />
                  <p className="text-sm">Sisesta kirjeldus ja lase AI-l luua maagiat</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Current Selection Indicator */}
      {currentImage && (
        <div className="bg-[#FFF9ED] p-3 border-t border-[#E7DCC7] flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-md overflow-hidden bg-white border border-[#E7DCC7]">
                    <img src={currentImage} alt="Selected" className="w-full h-full object-cover" />
                </div>
                <span className="text-sm font-medium text-[#2D2721]"><span className="text-green-600">✓</span> Pilt valitud</span>
            </div>
            <Button variant="ghost" size="sm" onClick={() => onSelect('')} className="text-red-500 hover:text-red-600 hover:bg-red-50 h-8">
                Eemalda
            </Button>
        </div>
      )}
    </div>
  );
}
