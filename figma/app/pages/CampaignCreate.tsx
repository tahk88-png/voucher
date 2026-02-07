import { useState } from 'react';
import { WarmCard } from '@app/components/WarmCard';
import { WarmButton } from '@app/components/WarmButton';
import { RichTextEditor } from '@app/components/RichTextEditor';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  Upload, 
  Calendar, 
  Tag, 
  FileText, 
  Eye, 
  AlertCircle, 
  Users, 
  Sparkles,
  Smartphone,
  Monitor,
  Wand2
} from 'lucide-react';
import { Input } from '@app/components/ui/input';
import { Label } from '@app/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@app/components/ui/select';
import { DatePicker } from '@app/components/DatePicker';
import { toast } from 'sonner';
import { MediaManager } from '@app/components/campaign/MediaManager';
import { CategorySelector } from '@app/components/campaign/CategorySelector';
import { CATEGORY_DATA } from '@app/data/categories';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '@services/api';

type Step = 1 | 2 | 3 | 4 | 5;

export function CampaignCreate() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<'mobile' | 'desktop'>('mobile');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    categoryId: '',
    subcategoryId: '',
    startDate: '',
    endDate: '',
    budget: '',
    price: '',
    originalPrice: '',
    discountType: 'percentage',
    discountValue: '',
    imageUrl: '', 
    status: 'draft',
    targetAudience: 'all',
    targetAge: '18-65',
    targetInterests: [] as string[]
  });

  // Calculate discount
  const calculateSavings = () => {
    const price = parseFloat(formData.price) || 0;
    const original = parseFloat(formData.originalPrice) || 0;
    
    if (price > 0 && original > 0) {
      const savings = original - price;
      const percent = Math.round((savings / original) * 100);
      return { savings, percent };
    }
    return { savings: 0, percent: 0 };
  };

  const steps = [
    { number: 1, label: 'Põhiinfo', icon: FileText },
    { number: 2, label: 'Pakkumine', icon: Tag },
    { number: 3, label: 'Sihtgrupp', icon: Users },
    { number: 4, label: 'Ajakava', icon: Calendar },
    { number: 5, label: 'Visuaal', icon: Upload },
  ];

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCategorySelect = (catId: string, subId: string) => {
    const cat = CATEGORY_DATA.find(c => c.id === catId);
    const sub = cat?.subcategories.find(s => s.id === subId);
    
    if (cat && sub) {
      setFormData(prev => ({ 
        ...prev, 
        categoryId: catId,
        subcategoryId: subId,
        category: sub.label
      }));
    }
  };

  const handleImageRemove = () => {
    setFormData(prev => ({ ...prev, imageUrl: '' }));
    setImagePreview(null);
  };

  const handleGenerateDescription = () => {
    if (!formData.name) {
       toast.error('Sisesta enne kampaania nimi');
       return;
    }
    setIsGeneratingAI(true);
    setTimeout(() => {
       const descriptions = [
          `<p>Avasta meie uus <strong>${formData.name}</strong>! See on loodud pakkuma sulle parimat elamust.</p><p>Ainult piiratud aja jooksul saadaval erihinnaga.</p><ul><li>Eksklusiivne kvaliteet</li><li>Parim hind turul</li><li>Rahulolu garanteeritud</li></ul>`,
          `<p>Ära maga maha! <strong>${formData.name}</strong> on nüüd saadaval.</p><p>Ideaalne kingitus endale või lähedasele.</p>`
       ];
       handleInputChange('description', descriptions[0]);
       setIsGeneratingAI(false);
       toast.success('AI kirjeldus genereeritud ✨');
    }, 1500);
  };

  const validateStep = (step: Step): boolean => {
    switch (step) {
      case 1:
        if (!formData.name) { toast.error('Sisesta nimi'); return false; }
        if (!formData.category) { toast.error('Vali kategooria'); return false; }
        return true;
      case 2:
        if (!formData.price || !formData.originalPrice) { toast.error('Sisesta hinnad'); return false; }
        return true;
      case 3:
        return true;
      case 4:
        if (!formData.startDate || !formData.endDate) { toast.error('Vali kuupäevad'); return false; }
        return true;
      case 5:
        return true;
      default: return true;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < 5) {
        setCurrentStep((prev) => (prev + 1) as Step);
      } else {
        handleCreate();
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as Step);
    } else {
      navigate('/campaigns');
    }
  };

  const handleCreate = async () => {
    const loadingToast = toast.loading('Loon kampaaniat...');
    try {
      await api.campaigns.create({
        ...formData,
        price: parseFloat(formData.price),
        original_price: parseFloat(formData.originalPrice),
        image_url: formData.imageUrl || imagePreview,
        status: 'active'
      });
      toast.dismiss(loadingToast);
      toast.success('Kampaania edukalt loodud!');
      setTimeout(() => navigate('/campaigns'), 1500);
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error('Viga salvestamisel');
    }
  };

  // Helper for DatePicker
  const parseDate = (dateStr: string) => dateStr ? new Date(dateStr) : undefined;
  const formatDate = (date: Date | undefined) => {
    if (!date) return '';
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - (offset * 60 * 1000));
    return localDate.toISOString().split('T')[0];
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 pb-20 animate-in fade-in">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => navigate('/campaigns')}
          className="p-2 hover:bg-[#FFF9ED] rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-[#6B5744]" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-[#2D2721]">Loo uus kampaania</h1>
          <p className="text-[#6B5744] mt-1">Samm-sammuline nõustaja eduka kampaania loomiseks</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Form Steps (8 cols) */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-6">
          {/* Stepper */}
          <WarmCard padding="md" className="overflow-x-auto">
            <div className="flex items-center min-w-[500px]">
              {steps.map((step, index) => {
                const Icon = step.icon;
                const isActive = currentStep === step.number;
                const isCompleted = currentStep > step.number;
                return (
                  <div key={step.number} className="flex items-center flex-1 last:flex-none">
                    <div className="flex flex-col items-center relative z-10">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-all duration-300 border-2 ${
                          isActive
                            ? 'bg-[#FFC857] border-[#FFC857] text-[#2D2721] scale-110 shadow-md'
                            : isCompleted
                            ? 'bg-[#E6F4EA] border-[#00D098] text-[#00D098]'
                            : 'bg-white border-[#E7DCC7] text-[#8B7355]'
                        }`}
                      >
                        {isCompleted ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                      </div>
                      <span className={`text-xs font-bold uppercase tracking-wide whitespace-nowrap ${isActive ? 'text-[#2D2721]' : 'text-[#8B7355]'}`}>
                        {step.label}
                      </span>
                    </div>
                    {index < steps.length - 1 && (
                      <div className={`h-1 flex-1 mx-2 rounded-full transition-colors duration-500 ${isCompleted ? 'bg-[#00D098]' : 'bg-[#E7DCC7]'}`} />
                    )}
                  </div>
                );
              })}
            </div>
          </WarmCard>

          {/* Step Content */}
          <WarmCard padding="lg" className="min-h-[500px]">
             <AnimatePresence mode="wait">
                {currentStep === 1 && (
                  <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                    <div>
                      <h3 className="text-xl font-bold text-[#2D2721]">Põhiandmed</h3>
                      <p className="text-[#6B5744]">Pane oma kampaaniale nimi ja vali kategooria.</p>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <Label>Kampaania nimi *</Label>
                        <Input
                          placeholder="nt. Kevadine Suurmüük"
                          value={formData.name}
                          onChange={(e) => handleInputChange('name', e.target.value)}
                          className="mt-1.5 text-lg"
                        />
                      </div>
                      
                      <div>
                        <Label>Kategooria *</Label>
                        <div className="mt-1.5">
                          <CategorySelector 
                            onSelect={handleCategorySelect}
                            selectedCategory={formData.categoryId}
                            selectedSubcategory={formData.subcategoryId}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-1.5">
                           <Label>Kirjeldus *</Label>
                           <button 
                              onClick={handleGenerateDescription}
                              disabled={isGeneratingAI}
                              className="text-xs font-bold text-[#E17B5C] flex items-center gap-1 hover:underline disabled:opacity-50"
                           >
                              <Wand2 className="w-3 h-3" />
                              {isGeneratingAI ? 'Genereerin...' : 'Küsi AI abi'}
                           </button>
                        </div>
                        <RichTextEditor
                          content={formData.description}
                          onChange={(content) => handleInputChange('description', content)}
                          placeholder="Kirjelda pakkumist..."
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                {currentStep === 2 && (
                  <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                    <div>
                      <h3 className="text-xl font-bold text-[#2D2721]">Hinnastamine</h3>
                      <p className="text-[#6B5744]">Määra hinnad ja soodustused.</p>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <Label>Tavahind (€) *</Label>
                        <Input type="number" value={formData.originalPrice} onChange={(e) => handleInputChange('originalPrice', e.target.value)} className="mt-1.5" placeholder="0.00" />
                      </div>
                      <div>
                        <Label>Soodushind (€) *</Label>
                        <Input type="number" value={formData.price} onChange={(e) => handleInputChange('price', e.target.value)} className="mt-1.5 border-[#FFC857]" placeholder="0.00" />
                        {calculateSavings().percent > 0 && <p className="text-xs text-[#00D098] font-bold mt-1">Sääst: {calculateSavings().percent}%</p>}
                      </div>
                    </div>
                  </motion.div>
                )}

                {currentStep === 3 && (
                  <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                    <div>
                      <h3 className="text-xl font-bold text-[#2D2721]">Sihtgrupp</h3>
                      <p className="text-[#6B5744]">Kellele see kampaania on suunatud?</p>
                    </div>

                    <div className="space-y-4">
                       <div>
                          <Label>Sihtrühm</Label>
                          <Select value={formData.targetAudience} onValueChange={(val) => handleInputChange('targetAudience', val)}>
                             <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                             <SelectContent>
                                <SelectItem value="all">Kõik kliendid</SelectItem>
                                <SelectItem value="new">Uued kliendid</SelectItem>
                                <SelectItem value="loyal">Püsikliendid</SelectItem>
                             </SelectContent>
                          </Select>
                       </div>

                       <div>
                          <Label>Vanusevahemik</Label>
                          <div className="grid grid-cols-2 gap-4 mt-1.5">
                             <div className="p-3 border border-[#E7DCC7] rounded-lg text-center cursor-pointer hover:bg-[#FFF9ED] hover:border-[#FFC857] transition-all bg-white font-medium text-sm">
                                18-35 aastased
                             </div>
                             <div className="p-3 border border-[#E7DCC7] rounded-lg text-center cursor-pointer hover:bg-[#FFF9ED] hover:border-[#FFC857] transition-all bg-white font-medium text-sm">
                                36-65+ aastased
                             </div>
                          </div>
                       </div>
                    </div>
                  </motion.div>
                )}

                {currentStep === 4 && (
                  <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                    <div>
                      <h3 className="text-xl font-bold text-[#2D2721]">Ajakava</h3>
                      <p className="text-[#6B5744]">Millal kampaania algab ja lõpeb?</p>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                       <div>
                          <Label>Algus</Label>
                          <div className="mt-1.5">
                             <DatePicker date={parseDate(formData.startDate)} setDate={(d) => handleInputChange('startDate', formatDate(d))} />
                          </div>
                       </div>
                       <div>
                          <Label>Lõpp</Label>
                          <div className="mt-1.5">
                             <DatePicker date={parseDate(formData.endDate)} setDate={(d) => handleInputChange('endDate', formatDate(d))} />
                          </div>
                       </div>
                    </div>
                  </motion.div>
                )}

                {currentStep === 5 && (
                  <motion.div key="step5" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                    <div>
                      <h3 className="text-xl font-bold text-[#2D2721]">Visuaal</h3>
                      <p className="text-[#6B5744]">Lisa pilt, mis köidab tähelepanu.</p>
                    </div>
                    <MediaManager 
                       currentImage={imagePreview}
                       onSelect={(url) => {
                          if (!url) handleImageRemove();
                          else { setImagePreview(url); setFormData(prev => ({ ...prev, imageUrl: url })); }
                       }}
                    />
                  </motion.div>
                )}
             </AnimatePresence>
          </WarmCard>

          {/* Navigation */}
          <div className="flex items-center justify-between pt-4">
            <WarmButton variant="outline" onClick={handleBack} disabled={currentStep === 1 && !imagePreview}>
              {currentStep === 1 ? 'Loobu' : 'Tagasi'}
            </WarmButton>
            <WarmButton onClick={handleNext}>
              {currentStep === 5 ? 'Kinnita ja Loo' : 'Järgmine samm'}
              <ArrowRight className="h-4 w-4 ml-2" />
            </WarmButton>
          </div>
        </div>

        {/* Right Column: Preview */}
        <div className="lg:col-span-5 xl:col-span-4">
           <div className="sticky top-6">
              <div className="flex items-center justify-between mb-4">
                 <h3 className="font-bold text-[#8B7355] text-sm uppercase tracking-wider">Eelvaade</h3>
                 <div className="flex bg-[#E7DCC7]/30 rounded-lg p-1">
                    <button 
                       onClick={() => setPreviewMode('mobile')}
                       className={`p-1.5 rounded-md transition-all ${previewMode === 'mobile' ? 'bg-white shadow-sm text-[#2D2721]' : 'text-[#8B7355]'}`}
                    >
                       <Smartphone className="w-4 h-4" />
                    </button>
                    <button 
                       onClick={() => setPreviewMode('desktop')}
                       className={`p-1.5 rounded-md transition-all ${previewMode === 'desktop' ? 'bg-white shadow-sm text-[#2D2721]' : 'text-[#8B7355]'}`}
                    >
                       <Monitor className="w-4 h-4" />
                    </button>
                 </div>
              </div>

              <div className={`transition-all duration-500 mx-auto ${
                 previewMode === 'mobile' ? 'w-[320px]' : 'w-full'
              }`}>
                 <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-[#F2EDE3]">
                    <div className="relative aspect-[4/3] bg-[#FAF7F2]">
                       {imagePreview ? (
                          <img src={imagePreview} className="w-full h-full object-cover" alt="Preview" />
                       ) : (
                          <div className="flex items-center justify-center w-full h-full text-[#E7DCC7]">
                             <Sparkles className="w-12 h-12" />
                          </div>
                       )}
                       {calculateSavings().percent > 0 && (
                          <div className="absolute top-4 right-4 bg-[#E17B5C] text-white font-bold px-3 py-1 rounded-full shadow-lg">
                             -{calculateSavings().percent}%
                          </div>
                       )}
                    </div>
                    <div className="p-5">
                       <h3 className="font-bold text-xl text-[#2D2721] mb-2 leading-tight">
                          {formData.name || 'Sinu kampaania pealkiri'}
                       </h3>
                       <div className="flex items-baseline gap-2 mb-4">
                          <span className="text-2xl font-bold text-[#E17B5C]">{formData.price ? `€${formData.price}` : '€0.00'}</span>
                          {formData.originalPrice && (
                             <span className="text-sm text-[#8B7355] line-through">€{formData.originalPrice}</span>
                          )}
                       </div>
                       <div className="prose prose-sm prose-warm line-clamp-3 text-[#6B5744]" dangerouslySetInnerHTML={{ __html: formData.description || 'Kampaania kirjeldus ilmub siia...' }}></div>
                       
                       <div className="mt-6">
                          <WarmButton className="w-full">Vaata pakkumist</WarmButton>
                       </div>
                    </div>
                 </div>
              </div>

              {/* Tips Card */}
              <div className="mt-6 bg-[#FFF9ED] border border-[#FFC857] rounded-xl p-4">
                 <div className="flex gap-3">
                    <div className="p-2 bg-[#FFC857]/20 rounded-full h-fit text-[#B88E40]">
                       <Wand2 className="w-4 h-4" />
                    </div>
                    <div>
                       <h4 className="font-bold text-[#2D2721] text-sm">Kas teadsid?</h4>
                       <p className="text-xs text-[#6B5744] mt-1 leading-relaxed">
                          AI poolt genereeritud kirjeldused suurendavad konversiooni keskmiselt 15%. Kasuta "Küsi AI abi" nuppu!
                       </p>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}