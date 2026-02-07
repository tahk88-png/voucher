import { useState } from 'react';
import { WarmCard } from '@/figma/app/components/WarmCard';
import { WarmButton } from '@/figma/app/components/WarmButton';
import { Input } from '@/figma/app/components/ui/input';
import { Label } from '@/figma/app/components/ui/label';
import { Textarea } from '@/figma/app/components/ui/textarea';
import { useNavigate } from 'react-router-dom';
import { 
  Store, 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  FileText, 
  Upload,
  CheckCircle2,
  Building,
  CreditCard,
  Users,
  Tag,
  Image as ImageIcon,
  AlertCircle,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';
import { toast } from 'sonner';

export function MerchantOnboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    // Step 1: Business Information
    businessName: '',
    businessType: 'retail',
    category: 'food_drink',
    registrationNumber: '',
    vatNumber: '',
    description: '',
    
    // Step 2: Contact & Location
    contactPerson: '',
    email: '',
    phone: '',
    website: '',
    address: '',
    city: '',
    postalCode: '',
    country: 'Estonia',
    
    // Step 3: Business Details
    employeeCount: '1-10',
    monthlyRevenue: '0-5000',
    bankAccount: '',
    targetAudience: '',
    socialMedia: {
      facebook: '',
      instagram: '',
      linkedin: '',
    },
    
    // Step 4: Legal & Documents
    termsAccepted: false,
    gdprAccepted: false,
    marketingAccepted: false,
  });

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const updateSocialMedia = (platform: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      socialMedia: { ...prev.socialMedia, [platform]: value }
    }));
  };

  const nextStep = () => {
    // Validate current step
    if (step === 1) {
      if (!formData.businessName || !formData.registrationNumber) {
        toast.error('Please fill in all required business information');
        return;
      }
    }
    if (step === 2) {
      if (!formData.contactPerson || !formData.email || !formData.phone || !formData.address) {
        toast.error('Please fill in all required contact information');
        return;
      }
    }
    if (step === 3) {
      if (!formData.targetAudience || !formData.bankAccount) {
        toast.error('Please fill in all required fields');
        return;
      }
    }
    if (step === 4) {
      if (!formData.termsAccepted || !formData.gdprAccepted) {
        toast.error('Please accept Terms of Service and GDPR policy');
        return;
      }
    }
    
    if (step < 5) {
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    toast.success('Application submitted successfully! Redirecting to plan selection...');
    
    // Redirect to subscription plans
    setTimeout(() => {
      navigate('/subscription-plans');
    }, 1500);
  };

  const businessTypes = [
    { value: 'retail', label: 'Retail Store' },
    { value: 'restaurant', label: 'Restaurant/Café' },
    { value: 'service', label: 'Service Provider' },
    { value: 'online', label: 'Online Business' },
    { value: 'other', label: 'Other' },
  ];

  const categories = [
    { value: 'food_drink', label: '🍽️ Food & Drink' },
    { value: 'fashion', label: '👗 Fashion' },
    { value: 'beauty', label: '💄 Beauty & Wellness' },
    { value: 'electronics', label: '📱 Electronics' },
    { value: 'travel', label: '✈️ Travel & Tourism' },
    { value: 'events', label: '🎉 Events & Entertainment' },
    { value: 'home', label: '🏠 Home & Garden' },
    { value: 'sports', label: '⚽ Sports & Fitness' },
    { value: 'other', label: '📦 Other' },
  ];

  const countries = [
    'Estonia', 'Latvia', 'Lithuania', 'Finland', 'Sweden', 
    'Norway', 'Denmark', 'Poland', 'Germany', 'Netherlands',
    'Belgium', 'France'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFFBF5] via-[#FFF9ED] to-[#FFE5B4] py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm border border-[rgba(139,115,85,0.1)] mb-4">
            <Store className="h-5 w-5 text-[#FFC857]" />
            <span className="font-semibold text-[#2D2721]">Merchant Registration</span>
          </div>
          <h1 className="text-4xl font-bold text-[#2D2721] mb-3">
            Join Our Platform
          </h1>
          <p className="text-lg text-[#6B5744]">
            Complete your business profile to start creating campaigns
          </p>
        </div>

        {/* Progress Steps */}
        <WarmCard padding="lg" className="mb-8">
          <div className="flex items-center justify-between">
            {[1, 2, 3, 4, 5].map((s) => (
              <div key={s} className="flex items-center flex-1">
                <div className="flex flex-col items-center w-full">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                    step >= s 
                      ? 'bg-gradient-to-br from-[#FFC857] to-[#FFB627] text-white shadow-warm' 
                      : 'bg-[#E5D5C5] text-[#8B7355]'
                  }`}>
                    {step > s ? <CheckCircle2 className="h-5 w-5" /> : s}
                  </div>
                  <span className={`text-xs mt-2 font-medium ${
                    step >= s ? 'text-[#2D2721]' : 'text-[#8B7355]'
                  }`}>
                    {s === 1 && 'Business'}
                    {s === 2 && 'Contact'}
                    {s === 3 && 'Details'}
                    {s === 4 && 'Legal'}
                    {s === 5 && 'Review'}
                  </span>
                </div>
                {s < 5 && (
                  <div className={`h-1 flex-1 mx-2 rounded-full transition-all ${
                    step > s ? 'bg-[#FFC857]' : 'bg-[#E5D5C5]'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </WarmCard>

        {/* Step 1: Business Information */}
        {step === 1 && (
          <WarmCard padding="xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-[14px] bg-gradient-to-br from-[#FFC857] to-[#FFB627] flex items-center justify-center shadow-warm">
                <Building className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-[#2D2721]">Business Information</h2>
                <p className="text-sm text-[#8B7355]">Tell us about your business</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="businessName">Business Name *</Label>
                  <Input
                    id="businessName"
                    placeholder="Your Business Name"
                    value={formData.businessName}
                    onChange={(e) => updateField('businessName', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="businessType">Business Type *</Label>
                  <select
                    id="businessType"
                    className="w-full px-3 py-2 rounded-[12px] border border-[rgba(139,115,85,0.2)] bg-white text-[#2D2721]"
                    value={formData.businessType}
                    onChange={(e) => updateField('businessType', e.target.value)}
                  >
                    {businessTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <Label htmlFor="category">Business Category *</Label>
                <select
                  id="category"
                  className="w-full px-3 py-2 rounded-[12px] border border-[rgba(139,115,85,0.2)] bg-white text-[#2D2721]"
                  value={formData.category}
                  onChange={(e) => updateField('category', e.target.value)}
                >
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="registrationNumber">Business Registration Number *</Label>
                  <Input
                    id="registrationNumber"
                    placeholder="12345678"
                    value={formData.registrationNumber}
                    onChange={(e) => updateField('registrationNumber', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="vatNumber">VAT Number (Optional)</Label>
                  <Input
                    id="vatNumber"
                    placeholder="EE123456789"
                    value={formData.vatNumber}
                    onChange={(e) => updateField('vatNumber', e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Business Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your business, products, and services..."
                  rows={4}
                  value={formData.description}
                  onChange={(e) => updateField('description', e.target.value)}
                />
              </div>
            </div>
          </WarmCard>
        )}

        {/* Step 2: Contact & Location */}
        {step === 2 && (
          <WarmCard padding="xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-[14px] bg-gradient-to-br from-[#9DB5A5] to-[#7FA090] flex items-center justify-center shadow-warm">
                <MapPin className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-[#2D2721]">Contact & Location</h2>
                <p className="text-sm text-[#8B7355]">How can we reach you?</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="contactPerson">Contact Person Name *</Label>
                  <Input
                    id="contactPerson"
                    placeholder="John Doe"
                    value={formData.contactPerson}
                    onChange={(e) => updateField('contactPerson', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="email">Business Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="contact@business.com"
                    value={formData.email}
                    onChange={(e) => updateField('email', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    placeholder="+372 5123 4567"
                    value={formData.phone}
                    onChange={(e) => updateField('phone', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="website">Website (Optional)</Label>
                  <Input
                    id="website"
                    placeholder="https://www.business.com"
                    value={formData.website}
                    onChange={(e) => updateField('website', e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="address">Street Address *</Label>
                <Input
                  id="address"
                  placeholder="123 Main Street"
                  value={formData.address}
                  onChange={(e) => updateField('address', e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    placeholder="Tallinn"
                    value={formData.city}
                    onChange={(e) => updateField('city', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="postalCode">Postal Code *</Label>
                  <Input
                    id="postalCode"
                    placeholder="10111"
                    value={formData.postalCode}
                    onChange={(e) => updateField('postalCode', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="country">Country *</Label>
                  <select
                    id="country"
                    className="w-full px-3 py-2 rounded-[12px] border border-[rgba(139,115,85,0.2)] bg-white text-[#2D2721]"
                    value={formData.country}
                    onChange={(e) => updateField('country', e.target.value)}
                  >
                    {countries.map(country => (
                      <option key={country} value={country}>{country}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </WarmCard>
        )}

        {/* Step 3: Business Details */}
        {step === 3 && (
          <WarmCard padding="xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-[14px] bg-gradient-to-br from-[#E17B5C] to-[#D16B4C] flex items-center justify-center shadow-warm">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-[#2D2721]">Business Details</h2>
                <p className="text-sm text-[#8B7355]">Help us understand your business better</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="employeeCount">Number of Employees</Label>
                  <select
                    id="employeeCount"
                    className="w-full px-3 py-2 rounded-[12px] border border-[rgba(139,115,85,0.2)] bg-white text-[#2D2721]"
                    value={formData.employeeCount}
                    onChange={(e) => updateField('employeeCount', e.target.value)}
                  >
                    <option value="1-10">1-10</option>
                    <option value="11-50">11-50</option>
                    <option value="51-200">51-200</option>
                    <option value="201-500">201-500</option>
                    <option value="500+">500+</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="monthlyRevenue">Monthly Revenue (EUR)</Label>
                  <select
                    id="monthlyRevenue"
                    className="w-full px-3 py-2 rounded-[12px] border border-[rgba(139,115,85,0.2)] bg-white text-[#2D2721]"
                    value={formData.monthlyRevenue}
                    onChange={(e) => updateField('monthlyRevenue', e.target.value)}
                  >
                    <option value="0-5000">€0 - €5,000</option>
                    <option value="5000-15000">€5,000 - €15,000</option>
                    <option value="15000-50000">€15,000 - €50,000</option>
                    <option value="50000-100000">€50,000 - €100,000</option>
                    <option value="100000+">€100,000+</option>
                  </select>
                </div>
              </div>

              <div>
                <Label htmlFor="bankAccount">Bank Account (IBAN) *</Label>
                <Input
                  id="bankAccount"
                  placeholder="EE00 0000 0000 0000 0000"
                  value={formData.bankAccount}
                  onChange={(e) => updateField('bankAccount', e.target.value)}
                  className="mt-1"
                />
                <p className="text-xs text-[#8B7355] mt-1">
                  Required for payouts from ticket and gift card sales. A 6% service fee applies to all payouts.
                </p>
              </div>

              <div>
                <Label htmlFor="targetAudience">Target Audience *</Label>
                <Textarea
                  id="targetAudience"
                  placeholder="Describe your ideal customers, demographics, interests..."
                  rows={4}
                  value={formData.targetAudience}
                  onChange={(e) => updateField('targetAudience', e.target.value)}
                />
              </div>

              <div>
                <Label>Social Media (Optional)</Label>
                <div className="space-y-3 mt-2">
                  <Input
                    placeholder="Facebook page URL"
                    value={formData.socialMedia.facebook}
                    onChange={(e) => updateSocialMedia('facebook', e.target.value)}
                  />
                  <Input
                    placeholder="Instagram username"
                    value={formData.socialMedia.instagram}
                    onChange={(e) => updateSocialMedia('instagram', e.target.value)}
                  />
                  <Input
                    placeholder="LinkedIn company page"
                    value={formData.socialMedia.linkedin}
                    onChange={(e) => updateSocialMedia('linkedin', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </WarmCard>
        )}

        {/* Step 4: Legal & Terms */}
        {step === 4 && (
          <WarmCard padding="xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-[14px] bg-gradient-to-br from-[#F5C98E] to-[#E5B97E] flex items-center justify-center shadow-warm">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-[#2D2721]">Legal & Compliance</h2>
                <p className="text-sm text-[#8B7355]">Please review and accept our policies</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="p-6 bg-gradient-to-br from-[#FFF9ED] to-[#FFE5B4] rounded-[16px] border border-[rgba(139,115,85,0.1)]">
                <h3 className="font-semibold text-[#2D2721] mb-4">Required Agreements</h3>
                <div className="space-y-4">
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={formData.termsAccepted}
                      onChange={(e) => updateField('termsAccepted', e.target.checked)}
                      className="mt-1 w-5 h-5 rounded border-[rgba(139,115,85,0.3)]"
                    />
                    <div className="flex-1">
                      <span className="text-[#2D2721] font-medium group-hover:text-[#FFC857] transition-colors">
                        I accept the Terms of Service *
                      </span>
                      <p className="text-sm text-[#8B7355] mt-1">
                        You agree to our platform's terms, conditions, and merchant responsibilities.
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={formData.gdprAccepted}
                      onChange={(e) => updateField('gdprAccepted', e.target.checked)}
                      className="mt-1 w-5 h-5 rounded border-[rgba(139,115,85,0.3)]"
                    />
                    <div className="flex-1">
                      <span className="text-[#2D2721] font-medium group-hover:text-[#FFC857] transition-colors">
                        I accept the GDPR & Privacy Policy *
                      </span>
                      <p className="text-sm text-[#8B7355] mt-1">
                        Your data will be processed according to GDPR regulations.
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={formData.marketingAccepted}
                      onChange={(e) => updateField('marketingAccepted', e.target.checked)}
                      className="mt-1 w-5 h-5 rounded border-[rgba(139,115,85,0.3)]"
                    />
                    <div className="flex-1">
                      <span className="text-[#2D2721] font-medium group-hover:text-[#FFC857] transition-colors">
                        I agree to receive marketing communications (Optional)
                      </span>
                      <p className="text-sm text-[#8B7355] mt-1">
                        Get updates about new features, tips, and special offers.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              <div className="p-4 bg-[#E8F5F1] border border-[#9DB5A5] rounded-[12px]">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-[#9DB5A5] flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-[#2D2721]">
                    <strong>Important:</strong> Your application will be reviewed by our team within 24-48 hours. 
                    You'll receive an email notification once approved.
                  </div>
                </div>
              </div>
            </div>
          </WarmCard>
        )}

        {/* Step 5: Review & Submit */}
        {step === 5 && (
          <WarmCard padding="xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-[14px] bg-gradient-to-br from-[#9DB5A5] to-[#7FA090] flex items-center justify-center shadow-warm">
                <CheckCircle2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-[#2D2721]">Review Your Application</h2>
                <p className="text-sm text-[#8B7355]">Please verify all information before submitting</p>
              </div>
            </div>

            <div className="space-y-6">
              {/* Business Info Summary */}
              <div className="p-6 bg-gradient-to-br from-[#FFF9ED] to-[#FFE5B4] rounded-[16px]">
                <h3 className="font-semibold text-[#2D2721] mb-4 flex items-center gap-2">
                  <Building className="h-5 w-5 text-[#FFC857]" />
                  Business Information
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-[#8B7355]">Business Name:</span>
                    <div className="font-semibold text-[#2D2721]">{formData.businessName}</div>
                  </div>
                  <div>
                    <span className="text-[#8B7355]">Category:</span>
                    <div className="font-semibold text-[#2D2721]">
                      {categories.find(c => c.value === formData.category)?.label}
                    </div>
                  </div>
                  <div>
                    <span className="text-[#8B7355]">Registration #:</span>
                    <div className="font-semibold text-[#2D2721]">{formData.registrationNumber}</div>
                  </div>
                  <div>
                    <span className="text-[#8B7355]">VAT #:</span>
                    <div className="font-semibold text-[#2D2721]">{formData.vatNumber || 'N/A'}</div>
                  </div>
                </div>
              </div>

              {/* Contact Summary */}
              <div className="p-6 bg-gradient-to-br from-[#FFF9ED] to-[#FFE5B4] rounded-[16px]">
                <h3 className="font-semibold text-[#2D2721] mb-4 flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-[#9DB5A5]" />
                  Contact & Location
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-[#8B7355]">Contact Person:</span>
                    <div className="font-semibold text-[#2D2721]">{formData.contactPerson}</div>
                  </div>
                  <div>
                    <span className="text-[#8B7355]">Email:</span>
                    <div className="font-semibold text-[#2D2721]">{formData.email}</div>
                  </div>
                  <div>
                    <span className="text-[#8B7355]">Phone:</span>
                    <div className="font-semibold text-[#2D2721]">{formData.phone}</div>
                  </div>
                  <div>
                    <span className="text-[#8B7355]">Location:</span>
                    <div className="font-semibold text-[#2D2721]">
                      {formData.city}, {formData.country}
                    </div>
                  </div>
                </div>
              </div>

              {/* Business Details Summary */}
              <div className="p-6 bg-gradient-to-br from-[#FFF9ED] to-[#FFE5B4] rounded-[16px]">
                <h3 className="font-semibold text-[#2D2721] mb-4 flex items-center gap-2">
                  <Users className="h-5 w-5 text-[#E17B5C]" />
                  Business Details
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-[#8B7355]">Employees:</span>
                    <div className="font-semibold text-[#2D2721]">{formData.employeeCount}</div>
                  </div>
                  <div>
                    <span className="text-[#8B7355]">Monthly Revenue:</span>
                    <div className="font-semibold text-[#2D2721]">{formData.monthlyRevenue}</div>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[#8B7355]">Bank Account (IBAN):</span>
                    <div className="font-semibold text-[#2D2721] font-mono">{formData.bankAccount}</div>
                    <div className="text-xs text-[#8B7355] mt-0.5">Includes 6% service fee agreement</div>
                  </div>
                </div>
              </div>
            </div>
          </WarmCard>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mt-8">
          {step > 1 ? (
            <WarmButton variant="outline" onClick={prevStep} disabled={isSubmitting}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous
            </WarmButton>
          ) : (
            <div />
          )}

          {step < 5 ? (
            <WarmButton onClick={nextStep}>
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </WarmButton>
          ) : (
            <WarmButton onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Submit Application
                </>
              )}
            </WarmButton>
          )}
        </div>
      </div>
    </div>
  );
}
