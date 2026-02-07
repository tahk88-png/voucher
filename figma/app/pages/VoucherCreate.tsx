import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Upload, X, RefreshCw, QrCode } from 'lucide-react';
import { toast } from 'sonner';
import { QRCodeSVG } from 'qrcode.react';

import { WarmCard } from '@/figma/app/components/WarmCard';
import { WarmButton } from '@/figma/app/components/WarmButton';
import { TemplateGallery, Template } from '@/figma/app/components/TemplateGallery';
import { Label } from '@/figma/app/components/ui/label';
import { Input } from '@/figma/app/components/ui/input';
import { RichTextEditor } from '@/figma/app/components/RichTextEditor';

type Step = 1 | 2 | 3;

// Helper function to generate random voucher code
const generateVoucherCode = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Avoiding confusing characters
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
    if (i === 3) code += '-'; // Add dash in the middle
  }
  return code;
};

export function VoucherCreate() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [formData, setFormData] = useState({
    headline: '',
    description: '',
    code: '',
    discountType: 'percentage',
    discountValue: '',
    originalPrice: '',
    discountedPrice: '',
    validFrom: '',
    validUntil: '',
    usageLimit: '',
    image: null as File | null,
  });

  const steps = [
    { number: 1, label: 'Template' },
    { number: 2, label: 'Details' },
    { number: 3, label: 'Settings' },
  ];

  const handleGenerateCode = () => {
    const newCode = generateVoucherCode();
    setFormData({ ...formData, code: newCode });
    toast.success('Code generated!');
  };

  const isStepValid = (step: Step): boolean => {
    switch (step) {
      case 1:
        return selectedTemplate !== null;
      case 2:
        return formData.headline.length > 0 && formData.code.length > 0;
      case 3:
        return formData.discountValue.length > 0 && formData.validUntil.length > 0;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep((currentStep + 1) as Step);
    } else {
      navigate('/vouchers');
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as Step);
    } else {
      navigate('/vouchers');
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, image: file });
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageRemove = () => {
    setFormData({ ...formData, image: null });
    setImagePreview(null);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <button
          onClick={() => navigate('/vouchers')}
          className="flex items-center gap-2 text-sm text-[#6B5744] hover:text-[#2D2721] mb-4 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to vouchers
        </button>
        <h1 className="text-3xl font-bold text-[#2D2721]">Create Voucher</h1>
        <p className="text-[#6B5744] mt-1">Design a beautiful voucher in minutes</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Section */}
        <div className="lg:col-span-2">
          <WarmCard padding="lg">
            {/* Stepper */}
            <div className="flex items-center justify-between mb-8">
              {steps.map((step, index) => (
                <div key={step.number} className="flex items-center flex-1">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                        currentStep >= step.number
                          ? 'bg-gradient-to-br from-[#FFC857] to-[#FFB627] text-[#2D2721] shadow-warm'
                          : 'bg-[#F2EDE3] text-[#8B7355]'
                      }`}
                    >
                      {currentStep > step.number ? <Check className="h-5 w-5" /> : step.number}
                    </div>
                    <span
                      className={`text-sm font-medium hidden sm:block ${
                        currentStep >= step.number ? 'text-[#2D2721]' : 'text-[#8B7355]'
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`flex-1 h-0.5 mx-4 transition-all ${
                        currentStep > step.number ? 'bg-[#FFC857]' : 'bg-[#F2EDE3]'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Step Content */}
            <div className="space-y-6">
              {currentStep === 1 && (
                <>
                  <div className="space-y-2">
                    <Label className="text-[#2D2721] font-medium">
                      Select Template <span className="text-[#E17B5C]">*</span>
                    </Label>
                    <TemplateGallery
                      selectedTemplateId={selectedTemplate?.id}
                      onSelectTemplate={setSelectedTemplate}
                      defaultImage={imagePreview || undefined}
                    />
                  </div>
                </>
              )}

              {currentStep === 2 && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="headline" className="text-[#2D2721] font-medium">
                      Headline <span className="text-[#E17B5C]">*</span>
                    </Label>
                    <Input
                      id="headline"
                      placeholder="e.g., 25% Off Summer Collection"
                      value={formData.headline}
                      onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
                      className="rounded-[12px] border-[rgba(139,115,85,0.2)] bg-white h-12"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-[#2D2721] font-medium">
                      Description
                    </Label>
                    <RichTextEditor
                      placeholder="Add terms and conditions..."
                      content={formData.description}
                      onChange={(content) => setFormData({ ...formData, description: content })}
                      className="min-h-[200px]"
                    />
                  </div>
                  
                  {/* Image Upload */}
                  <div className="space-y-2">
                    <Label className="text-[#2D2721] font-medium">
                      Voucher Image
                    </Label>
                    {!imagePreview ? (
                      <label
                        htmlFor="image-upload"
                        className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-[rgba(139,115,85,0.2)] rounded-[12px] cursor-pointer bg-[#FFF9ED] hover:bg-[#FFE5B4] transition-colors"
                      >
                        <Upload className="h-8 w-8 text-[#FFC857] mb-2" />
                        <span className="text-sm font-medium text-[#6B5744]">
                          Click to upload image
                        </span>
                        <span className="text-xs text-[#8B7355] mt-1">
                          PNG, JPG up to 10MB
                        </span>
                        <input
                          id="image-upload"
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="hidden"
                        />
                      </label>
                    ) : (
                      <div className="relative">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-full h-40 object-cover rounded-[12px]"
                        />
                        <button
                          onClick={handleImageRemove}
                          className="absolute top-2 right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-warm hover:bg-[#FEE2E2] transition-colors"
                        >
                          <X className="h-4 w-4 text-[#E17B5C]" />
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="code" className="text-[#2D2721] font-medium">
                      Voucher Code <span className="text-[#E17B5C]">*</span>
                    </Label>
                    <div className="flex items-center">
                      <Input
                        id="code"
                        placeholder="e.g., SUMMER25"
                        value={formData.code}
                        onChange={(e) =>
                          setFormData({ ...formData, code: e.target.value.toUpperCase() })
                        }
                        className="rounded-[12px] border-[rgba(139,115,85,0.2)] bg-white h-12 font-mono"
                        required
                      />
                      <WarmButton
                        variant="outline"
                        onClick={handleGenerateCode}
                        className="ml-2"
                      >
                        <RefreshCw className="h-5 w-5" />
                      </WarmButton>
                    </div>
                    <p className="text-xs text-[#8B7355]">Use uppercase letters and numbers only</p>
                  </div>
                </>
              )}

              {currentStep === 3 && (
                <>
                  <div className="space-y-2">
                    <Label className="text-[#2D2721] font-medium">
                      Discount Value <span className="text-[#E17B5C]">*</span>
                    </Label>
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        type="number"
                        placeholder="25"
                        value={formData.discountValue}
                        onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                        className="rounded-[12px] border-[rgba(139,115,85,0.2)] bg-white h-12"
                        required
                      />
                      <select
                        value={formData.discountType}
                        onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                        className="rounded-[12px] border-[rgba(139,115,85,0.2)] bg-white h-12 px-4 text-[#2D2721]"
                      >
                        <option value="percentage">Percentage (%)</option>
                        <option value="fixed">Fixed Amount (€)</option>
                      </select>
                    </div>
                  </div>
                  
                  {/* Pricing Section */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="originalPrice" className="text-[#2D2721] font-medium">
                        Original Price (€)
                      </Label>
                      <Input
                        id="originalPrice"
                        type="number"
                        step="0.01"
                        placeholder="100.00"
                        value={formData.originalPrice}
                        onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
                        className="rounded-[12px] border-[rgba(139,115,85,0.2)] bg-white h-12"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="discountedPrice" className="text-[#2D2721] font-medium">
                        Discounted Price (€)
                      </Label>
                      <Input
                        id="discountedPrice"
                        type="number"
                        step="0.01"
                        placeholder="75.00"
                        value={formData.discountedPrice}
                        onChange={(e) => setFormData({ ...formData, discountedPrice: e.target.value })}
                        className="rounded-[12px] border-[rgba(139,115,85,0.2)] bg-white h-12"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-[#8B7355]">
                    Optional: Show before/after pricing to customers
                  </p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="validFrom" className="text-[#2D2721] font-medium">
                        Valid From
                      </Label>
                      <Input
                        id="validFrom"
                        type="date"
                        value={formData.validFrom}
                        onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                        className="rounded-[12px] border-[rgba(139,115,85,0.2)] bg-white h-12"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="validUntil" className="text-[#2D2721] font-medium">
                        Valid Until <span className="text-[#E17B5C]">*</span>
                      </Label>
                      <Input
                        id="validUntil"
                        type="date"
                        value={formData.validUntil}
                        onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                        className="rounded-[12px] border-[rgba(139,115,85,0.2)] bg-white h-12"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="usageLimit" className="text-[#2D2721] font-medium">
                      Usage Limit
                    </Label>
                    <Input
                      id="usageLimit"
                      type="number"
                      placeholder="100"
                      value={formData.usageLimit}
                      onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                      className="rounded-[12px] border-[rgba(139,115,85,0.2)] bg-white h-12"
                    />
                    <p className="text-xs text-[#8B7355]">Leave empty for unlimited usage</p>
                  </div>
                </>
              )}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-[rgba(139,115,85,0.1)]">
              <WarmButton variant="outline" onClick={handleBack}>
                <ArrowLeft className="h-5 w-5 mr-2" />
                {currentStep === 1 ? 'Cancel' : 'Back'}
              </WarmButton>
              <WarmButton onClick={handleNext} disabled={!isStepValid(currentStep)}>
                {currentStep === 3 ? 'Create Voucher' : 'Next'}
                {currentStep < 3 && <ArrowRight className="h-5 w-5 ml-2" />}
              </WarmButton>
            </div>
          </WarmCard>
        </div>

        {/* Live Preview */}
        <div className="lg:col-span-1">
          <div className="sticky top-6">
            <WarmCard gradient padding="lg">
              <div className="text-center mb-4">
                <div className="text-xs font-medium text-[#8B7355] mb-2">LIVE PREVIEW</div>
              </div>
              <WarmCard padding="lg" className="bg-white">
                <div className="text-center space-y-4">
                  {imagePreview && (
                    <div className="rounded-[12px] overflow-hidden mb-2 shadow-sm">
                      <img 
                        src={imagePreview} 
                        alt="Voucher preview" 
                        className="w-full h-40 object-cover" 
                      />
                    </div>
                  )}
                  <div className="text-3xl font-bold text-[#2D2721]">
                    {formData.discountValue || '—'}
                    {formData.discountType === 'percentage' ? '%' : '€'}
                  </div>
                  <h3 className="text-lg font-semibold text-[#2D2721]">
                    {formData.headline || 'Your headline here'}
                  </h3>
                  {formData.code && (
                    <>
                      <div className="bg-[#FFF9ED] rounded-[12px] px-4 py-3 border border-[rgba(139,115,85,0.1)]">
                        <div className="text-xs text-[#8B7355] mb-1">CODE</div>
                        <div className="text-lg font-mono font-bold text-[#2D2721]">
                          {formData.code}
                        </div>
                      </div>
                      
                      {/* QR Code */}
                      <div className="flex flex-col items-center gap-2 pt-4 border-t border-[rgba(139,115,85,0.1)]">
                        <div className="p-3 bg-white rounded-[12px] border-2 border-[rgba(139,115,85,0.1)]">
                          <QRCodeSVG
                            value={`VOUCHER:${formData.code}`}
                            size={120}
                            level="H"
                            includeMargin={false}
                            fgColor="#2D2721"
                          />
                        </div>
                        <div className="flex items-center gap-1 text-xs text-[#8B7355]">
                          <QrCode className="h-3 w-3" />
                          <span>Scannable QR Code</span>
                        </div>
                      </div>
                    </>
                  )}
                  {formData.validUntil && (
                    <div className="text-xs text-[#8B7355]">Valid until {formData.validUntil}</div>
                  )}
                  
                  {formData.description && (
                    <div 
                      className="text-left text-sm text-[#6B5744] prose prose-sm prose-warm max-w-none mt-4 border-t border-[rgba(139,115,85,0.1)] pt-4"
                      dangerouslySetInnerHTML={{ __html: formData.description }}
                    />
                  )}
                </div>
              </WarmCard>
            </WarmCard>
          </div>
        </div>
      </div>
    </div>
  );
}