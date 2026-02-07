import { useState, useEffect } from 'react';
import { WarmCard } from '@/figma/app/components/WarmCard';
import { WarmButton } from '@/figma/app/components/WarmButton';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Gift, CreditCard, Mail, Upload, X, Check, Eye } from 'lucide-react';
import { Input } from '@/figma/app/components/ui/input';
import { Label } from '@/figma/app/components/ui/label';
import { Textarea } from '@/figma/app/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/figma/app/components/ui/select';
import { toast } from 'sonner';
import { QRCodeSVG } from 'qrcode.react';
import { motion, AnimatePresence } from 'motion/react';

type Step = 1 | 2 | 3;

// Mock card themes
const CARD_THEMES = {
  warm: {
    id: 'warm',
    name: 'Warm & Welcoming',
    description: 'Soft beige and yellow tones, perfect for any occasion.',
    bg: 'bg-gradient-to-br from-[#FFF9ED] via-[#FFE5B4] to-[#FFC857]',
    text: 'text-[#2D2721]',
    accent: 'text-[#8B7355]',
    border: 'border-[#E7DCC7]',
  },
  minimal: {
    id: 'minimal',
    name: 'Clean & Minimal',
    description: 'Simple elegance with plenty of whitespace.',
    bg: 'bg-white',
    text: 'text-[#2D2721]',
    accent: 'text-[#6B5744]',
    border: 'border-[#F2EDE3]',
  },
  festive: {
    id: 'festive',
    name: 'Festive & Bold',
    description: 'Vibrant colors for celebrations.',
    bg: 'bg-gradient-to-br from-[#FFC857] to-[#E17B5C]',
    text: 'text-white',
    accent: 'text-white/80',
    border: 'border-white/20',
  },
  luxury: {
    id: 'luxury',
    name: 'Premium Luxury',
    description: 'Dark tones with gold accents.',
    bg: 'bg-[#2D2721]',
    text: 'text-[#FFC857]',
    accent: 'text-[#E7DCC7]',
    border: 'border-[#FFC857]/30',
  }
};

export function GiftCardCreate() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<Step>(1);
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    value: '',
    currency: 'EUR',
    validUntil: '',
    recipientName: '',
    recipientEmail: '',
    message: '',
    sendNow: true,
    design: 'warm' as keyof typeof CARD_THEMES,
  });

  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Initialize date to 1 year from now
  useEffect(() => {
    const date = new Date();
    date.setFullYear(date.getFullYear() + 1);
    setFormData(prev => ({ ...prev, validUntil: date.toISOString().split('T')[0] }));
  }, []);

  const steps = [
    { number: 1, label: 'Details', icon: Gift },
    { number: 2, label: 'Recipient', icon: Mail },
    { number: 3, label: 'Design', icon: CreditCard },
  ];

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageRemove = () => {
    setImage(null);
    setImagePreview(null);
  };

  const validateStep = (step: Step): boolean => {
    if (step === 1) {
      if (!formData.name || !formData.value || !formData.validUntil) {
        toast.error('Please fill in all required fields');
        return false;
      }
    }
    if (step === 2) {
      if (!formData.recipientEmail || !formData.recipientName) {
        toast.error('Please provide recipient details');
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < 3) setCurrentStep((prev) => (prev + 1) as Step);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep((prev) => (prev - 1) as Step);
  };

  const handleCreate = () => {
    toast.success('Gift card created successfully!');
    setTimeout(() => navigate('/gift-cards'), 1500);
  };

  const currentTheme = CARD_THEMES[formData.design];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => navigate('/gift-cards')}
          className="p-2 hover:bg-[#FFF9ED] rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-[#6B5744]" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-[#2D2721]">Create Gift Card</h1>
          <p className="text-[#6B5744] mt-1">Design a gift card with monetary value</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Form Steps (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Stepper */}
          <WarmCard padding="md">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => {
                const Icon = step.icon;
                const isActive = currentStep === step.number;
                const isCompleted = currentStep > step.number;

                return (
                  <div key={step.number} className="flex items-center flex-1">
                    <div className="flex flex-col items-center flex-1 relative">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-all duration-300 ${
                          isActive
                            ? 'bg-gradient-to-br from-[#FFC857] to-[#FFB627] text-[#2D2721] shadow-warm scale-110'
                            : isCompleted
                            ? 'bg-[#9DB5A5] text-white'
                            : 'bg-[#F2EDE3] text-[#8B7355]'
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <span
                        className={`text-sm font-medium ${
                          isActive ? 'text-[#2D2721]' : 'text-[#8B7355]'
                        }`}
                      >
                        {step.label}
                      </span>
                    </div>
                    {index < steps.length - 1 && (
                      <div
                        className={`h-0.5 flex-1 mx-4 transition-colors duration-500 ${
                          isCompleted ? 'bg-[#9DB5A5]' : 'bg-[#F2EDE3]'
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </WarmCard>

          {/* Step Content */}
          <WarmCard padding="lg" className="min-h-[400px]">
            {currentStep === 1 && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-xl font-semibold text-[#2D2721] mb-1">Gift Card Details</h3>
                  <p className="text-[#6B5744]">Set the value and validity of your gift card</p>
                </div>

                <div className="grid gap-6">
                  <div>
                    <Label htmlFor="name">Internal Name *</Label>
                    <Input
                      id="name"
                      placeholder="e.g., Summer Promotion Gift Card"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="mt-1.5"
                    />
                    <p className="text-xs text-[#8B7355] mt-1">Only visible to administrators</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="value">Value *</Label>
                      <div className="relative mt-1.5">
                        <Input
                          id="value"
                          type="number"
                          placeholder="0.00"
                          value={formData.value}
                          onChange={(e) => handleInputChange('value', e.target.value)}
                          className="pl-8"
                        />
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8B7355] font-medium">
                          {formData.currency === 'EUR' ? '€' : formData.currency === 'USD' ? '$' : 'kr'}
                        </span>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="currency">Currency *</Label>
                      <Select 
                        value={formData.currency} 
                        onValueChange={(val) => handleInputChange('currency', val)}
                      >
                        <SelectTrigger className="mt-1.5">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="EUR">EUR (€)</SelectItem>
                          <SelectItem value="USD">USD ($)</SelectItem>
                          <SelectItem value="SEK">SEK (kr)</SelectItem>
                          <SelectItem value="NOK">NOK (kr)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="validUntil">Valid Until *</Label>
                    <Input
                      id="validUntil"
                      type="date"
                      value={formData.validUntil}
                      onChange={(e) => handleInputChange('validUntil', e.target.value)}
                      className="mt-1.5"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Card Image (Optional)</Label>
                    <div className="border-2 border-dashed border-[#E7DCC7] rounded-xl p-6 text-center hover:border-[#FFC857] transition-colors bg-[#FFFBF5]">
                      <input
                        type="file"
                        id="image"
                        className="hidden"
                        accept="image/*"
                        onChange={handleImageChange}
                      />
                      {!imagePreview ? (
                        <label htmlFor="image" className="cursor-pointer flex flex-col items-center">
                          <div className="w-12 h-12 bg-[#FFF9ED] rounded-full flex items-center justify-center mb-3 text-[#FFC857]">
                            <Upload className="h-6 w-6" />
                          </div>
                          <span className="text-sm font-medium text-[#2D2721]">Click to upload image</span>
                          <span className="text-xs text-[#8B7355] mt-1">SVG, PNG, JPG up to 2MB</span>
                        </label>
                      ) : (
                        <div className="relative w-full max-w-md mx-auto">
                          <img 
                            src={imagePreview} 
                            alt="Preview" 
                            className="w-full h-48 object-cover rounded-lg shadow-sm"
                          />
                          <button
                            onClick={handleImageRemove}
                            className="absolute -top-2 -right-2 p-1 bg-white rounded-full shadow-md text-red-500 hover:bg-red-50 transition-colors"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {currentStep === 2 && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-xl font-semibold text-[#2D2721] mb-1">Recipient Information</h3>
                  <p className="text-[#6B5744]">Who will receive this gift card?</p>
                </div>

                <div className="grid gap-6">
                  <div>
                    <Label htmlFor="recipientName">Recipient Name *</Label>
                    <Input
                      id="recipientName"
                      placeholder="e.g., Anna Andersson"
                      value={formData.recipientName}
                      onChange={(e) => handleInputChange('recipientName', e.target.value)}
                      className="mt-1.5"
                    />
                  </div>

                  <div>
                    <Label htmlFor="recipientEmail">Recipient Email *</Label>
                    <Input
                      id="recipientEmail"
                      type="email"
                      placeholder="anna@example.com"
                      value={formData.recipientEmail}
                      onChange={(e) => handleInputChange('recipientEmail', e.target.value)}
                      className="mt-1.5"
                    />
                  </div>

                  <div>
                    <Label htmlFor="message">Personal Message (Optional)</Label>
                    <Textarea
                      id="message"
                      placeholder="Write a personalized message..."
                      value={formData.message}
                      onChange={(e) => handleInputChange('message', e.target.value)}
                      className="mt-1.5 min-h-[120px]"
                    />
                    <div className="flex justify-between mt-1">
                      <span className="text-xs text-[#8B7355]">Will be displayed on the gift card email</span>
                      <span className="text-xs text-[#8B7355]">{formData.message.length}/500</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 bg-[#FFF9ED] rounded-xl border border-[#E7DCC7]">
                    <div className="flex items-center h-5 mt-0.5">
                      <input
                        type="checkbox"
                        id="sendNow"
                        checked={formData.sendNow}
                        onChange={(e) => handleInputChange('sendNow', e.target.checked)}
                        className="h-4 w-4 rounded border-[#E7DCC7] text-[#FFC857] focus:ring-[#FFC857]"
                      />
                    </div>
                    <div className="flex-1">
                      <Label htmlFor="sendNow" className="cursor-pointer font-medium text-[#2D2721]">
                        Send immediately
                      </Label>
                      <p className="text-sm text-[#6B5744] mt-0.5">
                        If unchecked, the card will be created as a draft and can be sent later.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {currentStep === 3 && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-xl font-semibold text-[#2D2721] mb-1">Choose Design</h3>
                  <p className="text-[#6B5744]">Select a design theme for your gift card</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {Object.values(CARD_THEMES).map((theme) => (
                    <button
                      key={theme.id}
                      onClick={() => handleInputChange('design', theme.id)}
                      className={`relative group p-4 rounded-xl border-2 transition-all text-left overflow-hidden ${
                        formData.design === theme.id
                          ? 'border-[#FFC857] bg-[#FFF9ED] ring-1 ring-[#FFC857]'
                          : 'border-[rgba(139,115,85,0.15)] hover:border-[rgba(139,115,85,0.3)] bg-white'
                      }`}
                    >
                      <div className={`h-24 w-full rounded-lg mb-3 ${theme.bg} shadow-inner`}>
                         {/* Mini preview elements */}
                         <div className="h-full w-full opacity-50 p-3 flex flex-col justify-between">
                            <div className={`w-8 h-8 rounded-full bg-white/30`} />
                            <div className="space-y-2">
                               <div className="h-2 w-2/3 bg-white/30 rounded" />
                               <div className="h-2 w-1/2 bg-white/30 rounded" />
                            </div>
                         </div>
                      </div>
                      
                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-1">
                           <h4 className="font-semibold text-[#2D2721]">{theme.name}</h4>
                           {formData.design === theme.id && (
                             <div className="bg-[#FFC857] text-[#2D2721] p-1 rounded-full">
                               <Check className="h-3 w-3" />
                             </div>
                           )}
                        </div>
                        <p className="text-sm text-[#8B7355]">{theme.description}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </WarmCard>

          {/* Navigation */}
          <div className="flex items-center justify-between pt-4">
            <WarmButton
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 1}
              className={currentStep === 1 ? 'invisible' : ''}
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back
            </WarmButton>

            {currentStep < 3 ? (
              <WarmButton onClick={handleNext}>
                Next
                <ArrowRight className="h-5 w-5 ml-2" />
              </WarmButton>
            ) : (
              <WarmButton onClick={handleCreate}>
                Create & Send
                <Mail className="h-5 w-5 ml-2" />
              </WarmButton>
            )}
          </div>
        </div>

        {/* Right Column: Live Preview (4 cols) */}
        <div className="lg:col-span-4">
           <div className="sticky top-6 space-y-4">
             <div className="flex items-center justify-between text-[#8B7355] px-1">
                <span className="text-xs font-bold tracking-wider uppercase">Live Preview</span>
                <Eye className="h-4 w-4" />
             </div>
             
             {/* The Card */}
             <div 
               className={`w-full aspect-[1.586/1] rounded-2xl shadow-warm-lg relative overflow-hidden transition-all duration-500 ${currentTheme.bg}`}
             >
                {/* Background Pattern/Texture */}
                <div className="absolute inset-0 opacity-10" 
                     style={{ 
                       backgroundImage: 'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.4) 0%, transparent 40%)' 
                     }} 
                />
                
                <div className={`h-full flex flex-col p-6 ${currentTheme.text} relative z-10`}>
                   {/* Card Header */}
                   <div className="flex justify-between items-start mb-auto">
                      <div className="flex items-center gap-2">
                         <div className={`w-10 h-10 rounded-lg flex items-center justify-center backdrop-blur-sm bg-white/20`}>
                            <Gift className={`h-5 w-5 ${currentTheme.text}`} />
                         </div>
                         <span className="font-bold text-lg tracking-tight">GIFT CARD</span>
                      </div>
                      <div className={`text-2xl font-bold font-mono tracking-tight`}>
                         {formData.value ? (
                            <span>{formData.value} <span className="text-sm opacity-80">{formData.currency}</span></span>
                         ) : (
                            <span className="opacity-50">0.00</span>
                         )}
                      </div>
                   </div>

                   {/* Middle Content */}
                   <div className="flex-1 flex items-center justify-center my-4">
                      {imagePreview ? (
                         <div className="w-full h-24 rounded-lg overflow-hidden shadow-md">
                            <img src={imagePreview} alt="Card visual" className="w-full h-full object-cover" />
                         </div>
                      ) : (
                         <div className={`text-center space-y-2 opacity-80 ${currentTheme.accent}`}>
                            <p className="text-sm font-medium uppercase tracking-widest">Valid Until</p>
                            <p className="font-mono text-lg">{formData.validUntil || 'YYYY-MM-DD'}</p>
                         </div>
                      )}
                   </div>

                   {/* Footer */}
                   <div className="flex justify-between items-end mt-auto">
                      <div className="space-y-1">
                         <p className={`text-xs uppercase tracking-wider opacity-70`}>To</p>
                         <p className="font-semibold text-lg truncate max-w-[150px]">
                            {formData.recipientName || 'Recipient Name'}
                         </p>
                      </div>
                      
                      <div className="bg-white p-2 rounded-lg shadow-sm">
                         <QRCodeSVG 
                            value={`GIFT:${formData.name || 'DEMO'}`}
                            size={48}
                            level="M"
                            fgColor="#000000"
                            bgColor="#FFFFFF"
                         />
                      </div>
                   </div>
                </div>
             </div>

             {/* Message Preview Bubble */}
             {formData.message && (
               <motion.div 
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 className="relative mt-6"
               >
                  <div className="absolute -top-2 left-8 w-4 h-4 bg-white transform rotate-45 border-l border-t border-[rgba(139,115,85,0.1)]"></div>
                  <div className="bg-white rounded-xl p-4 shadow-sm border border-[rgba(139,115,85,0.1)] text-[#6B5744] italic text-sm relative z-10">
                     "{formData.message}"
                  </div>
               </motion.div>
             )}
             
             {/* Summary Info */}
             <div className="bg-[#FFF9ED] rounded-xl p-4 space-y-3 border border-[rgba(139,115,85,0.1)]">
                <div className="flex justify-between text-sm">
                   <span className="text-[#8B7355]">Status</span>
                   <span className="text-[#2D2721] font-medium bg-[#FFC857] px-2 py-0.5 rounded-full text-xs">Draft</span>
                </div>
                <div className="flex justify-between text-sm">
                   <span className="text-[#8B7355]">Delivery</span>
                   <span className="text-[#2D2721] font-medium">{formData.recipientEmail || '—'}</span>
                </div>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
}