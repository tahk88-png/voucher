import { useState } from 'react';
import { WarmCard } from '@app/components/WarmCard';
import { WarmButton } from '@app/components/WarmButton';
import { Input } from '@app/components/ui/input';
import { Label } from '@app/components/ui/label';
import { Textarea } from '@app/components/ui/textarea';
import { useNavigate } from '@/lib/router-shim';
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
import { useLanguage } from '@app/contexts/LanguageContext';

export function MerchantOnboarding() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const tr = (en: string, et: string) => (language === 'et' ? et : en);

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
        toast.error(tr('Please fill in all required business information', 'Palun taida koik kohustuslikud ariteabe valjad'));
        return;
      }
    }
    if (step === 2) {
      if (!formData.contactPerson || !formData.email || !formData.phone || !formData.address) {
        toast.error(tr('Please fill in all required contact information', 'Palun taida koik kohustuslikud kontaktiandmed'));
        return;
      }
    }
    if (step === 3) {
      if (!formData.targetAudience || !formData.bankAccount) {
        toast.error(tr('Please fill in all required fields', 'Palun taida koik kohustuslikud valjad'));
        return;
      }
    }
    if (step === 4) {
      if (!formData.termsAccepted || !formData.gdprAccepted) {
        toast.error(tr('Please accept Terms of Service and GDPR policy', 'Palun noustu kasutustingimuste ja GDPR poliitikaga'));
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
    
    toast.success(tr('Application submitted successfully! Redirecting to plan selection...', 'Taotlus esitatud! Suuname paketivalikusse...'));
    
    // Redirect to subscription plans
    setTimeout(() => {
      navigate('/subscription-plans');
    }, 1500);
  };

  const businessTypes = [
    { value: 'retail', label: tr('Retail Store', 'Jaekauplus') },
    { value: 'restaurant', label: tr('Restaurant/Cafe', 'Restoran/Kohvik') },
    { value: 'service', label: tr('Service Provider', 'Teenusepakkuja') },
    { value: 'online', label: tr('Online Business', 'Veebiettevote') },
    { value: 'other', label: tr('Other', 'Muu') },
  ];

  const categories = [
    { value: 'food_drink', label: tr('Food & Drink', 'Toit ja jook') },
    { value: 'fashion', label: tr('Fashion', 'Mood') },
    { value: 'beauty', label: tr('Beauty & Wellness', 'Ilu ja heaolu') },
    { value: 'electronics', label: tr('Electronics', 'Elektroonika') },
    { value: 'travel', label: tr('Travel & Tourism', 'Reisimine ja turism') },
    { value: 'events', label: tr('Events & Entertainment', 'Uritused ja meelelahutus') },
    { value: 'home', label: tr('Home & Garden', 'Kodu ja aed') },
    { value: 'sports', label: tr('Sports & Fitness', 'Sport ja fitness') },
    { value: 'other', label: tr('Other', 'Muu') },
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
            <span className="font-semibold text-[#2D2721]">{tr('Merchant Registration', 'Kaupmehe registreerimine')}</span>
          </div>
          <h1 className="text-4xl font-bold text-[#2D2721] mb-3">
            {tr('Join Our Platform', 'Liitu meie platvormiga')}
          </h1>
          <p className="text-lg text-[#6B5744]">
            {tr('Complete your business profile to start creating campaigns', 'Taienda ariprofiil, et alustada kampaaniate loomist')}
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
                    {s === 1 && tr('Business', 'Ari')}
                    {s === 2 && tr('Contact', 'Kontakt')}
                    {s === 3 && tr('Details', 'Detailid')}
                    {s === 4 && tr('Legal', 'Juriidika')}
                    {s === 5 && tr('Review', 'Ulevaade')}
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
                <h2 className="text-2xl font-bold text-[#2D2721]">{tr('Business Information', 'Ariinfo')}</h2>
                <p className="text-sm text-[#8B7355]">{tr('Tell us about your business', 'Ragi meile oma ettevottest')}</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="businessName">{tr('Business Name *', 'Ettevotte nimi *')}</Label>
                  <Input
                    id="businessName"
                    placeholder={tr('Your Business Name', 'Sinu ettevotte nimi')}
                    value={formData.businessName}
                    onChange={(e) => updateField('businessName', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="businessType">{tr('Business Type *', 'Ettevotte tuup *')}</Label>
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
                <Label htmlFor="category">{tr('Business Category *', 'Ettevotte kategooria *')}</Label>
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
                  <Label htmlFor="registrationNumber">{tr('Business Registration Number *', 'Registrikood *')}</Label>
                  <Input
                    id="registrationNumber"
                    placeholder="12345678"
                    value={formData.registrationNumber}
                    onChange={(e) => updateField('registrationNumber', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="vatNumber">{tr('VAT Number (Optional)', 'KMKR number (valikuline)')}</Label>
                  <Input
                    id="vatNumber"
                    placeholder="EE123456789"
                    value={formData.vatNumber}
                    onChange={(e) => updateField('vatNumber', e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">{tr('Business Description *', 'Ettevotte kirjeldus *')}</Label>
                <Textarea
                  id="description"
                  placeholder={tr('Describe your business, products, and services...', 'Kirjelda oma ettevotet, tooteid ja teenuseid...')}
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
                <h2 className="text-2xl font-bold text-[#2D2721]">{tr('Contact & Location', 'Kontakt ja asukoht')}</h2>
                <p className="text-sm text-[#8B7355]">{tr('How can we reach you?', 'Kuidas saame sinuga uhendust?')}</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="contactPerson">{tr('Contact Person Name *', 'Kontaktisiku nimi *')}</Label>
                  <Input
                    id="contactPerson"
                    placeholder="John Doe"
                    value={formData.contactPerson}
                    onChange={(e) => updateField('contactPerson', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="email">{tr('Business Email *', 'Ettevotte e-post *')}</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder={tr('contact@business.com', 'kontakt@ettevote.ee')}
                    value={formData.email}
                    onChange={(e) => updateField('email', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="phone">{tr('Phone Number *', 'Telefoninumber *')}</Label>
                  <Input
                    id="phone"
                    placeholder="+372 5123 4567"
                    value={formData.phone}
                    onChange={(e) => updateField('phone', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="website">{tr('Website (Optional)', 'Veebileht (valikuline)')}</Label>
                  <Input
                    id="website"
                    placeholder={tr('https://www.business.com', 'https://www.ettevote.ee')}
                    value={formData.website}
                    onChange={(e) => updateField('website', e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="address">{tr('Street Address *', 'Tanava aadress *')}</Label>
                <Input
                  id="address"
                  placeholder={tr('123 Main Street', 'Peatanav 123')}
                  value={formData.address}
                  onChange={(e) => updateField('address', e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <Label htmlFor="city">{tr('City *', 'Linn *')}</Label>
                  <Input
                    id="city"
                    placeholder="Tallinn"
                    value={formData.city}
                    onChange={(e) => updateField('city', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="postalCode">{tr('Postal Code *', 'Postiindeks *')}</Label>
                  <Input
                    id="postalCode"
                    placeholder="10111"
                    value={formData.postalCode}
                    onChange={(e) => updateField('postalCode', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="country">{tr('Country *', 'Riik *')}</Label>
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
                <h2 className="text-2xl font-bold text-[#2D2721]">{tr('Business Details', 'Ari detailid')}</h2>
                <p className="text-sm text-[#8B7355]">{tr('Help us understand your business better', 'Aita meil sinu ettevotet paremini moista')}</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="employeeCount">{tr('Number of Employees', 'Tootajate arv')}</Label>
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
                  <Label htmlFor="monthlyRevenue">{tr('Monthly Revenue (EUR)', 'Kuine kaive (EUR)')}</Label>
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
                <Label htmlFor="bankAccount">{tr('Bank Account (IBAN) *', 'Pangakonto (IBAN) *')}</Label>
                <Input
                  id="bankAccount"
                  placeholder="EE00 0000 0000 0000 0000"
                  value={formData.bankAccount}
                  onChange={(e) => updateField('bankAccount', e.target.value)}
                  className="mt-1"
                />
                <p className="text-xs text-[#8B7355] mt-1">
                  {tr('Required for payouts from ticket and gift card sales. A 6% service fee applies to all payouts.', 'Vajalik valjamakseteks piletite ja kinkekaartide muugist. Koigile valjamaksetele rakendub 6% teenustasu.')}
                </p>
              </div>

              <div>
                <Label htmlFor="targetAudience">{tr('Target Audience *', 'Sihtruhm *')}</Label>
                <Textarea
                  id="targetAudience"
                  placeholder={tr('Describe your ideal customers, demographics, interests...', 'Kirjelda oma ideaalset klienti, demograafiat ja huve...')}
                  rows={4}
                  value={formData.targetAudience}
                  onChange={(e) => updateField('targetAudience', e.target.value)}
                />
              </div>

              <div>
                <Label>{tr('Social Media (Optional)', 'Sotsiaalmeedia (valikuline)')}</Label>
                <div className="space-y-3 mt-2">
                  <Input
                    placeholder={tr('Facebook page URL', 'Facebooki lehe URL')}
                    value={formData.socialMedia.facebook}
                    onChange={(e) => updateSocialMedia('facebook', e.target.value)}
                  />
                  <Input
                    placeholder={tr('Instagram username', 'Instagrami kasutajanimi')}
                    value={formData.socialMedia.instagram}
                    onChange={(e) => updateSocialMedia('instagram', e.target.value)}
                  />
                  <Input
                    placeholder={tr('LinkedIn company page', 'LinkedIni ettevotte leht')}
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
                <h2 className="text-2xl font-bold text-[#2D2721]">{tr('Legal & Compliance', 'Juriidika ja vastavus')}</h2>
                <p className="text-sm text-[#8B7355]">{tr('Please review and accept our policies', 'Palun vaata ule ja noustu meie poliitikatega')}</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="p-6 bg-gradient-to-br from-[#FFF9ED] to-[#FFE5B4] rounded-[16px] border border-[rgba(139,115,85,0.1)]">
                <h3 className="font-semibold text-[#2D2721] mb-4">{tr('Required Agreements', 'Kohustuslikud kokkulepped')}</h3>
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
                        {tr('I accept the Terms of Service *', 'Noustun kasutustingimustega *')}
                      </span>
                      <p className="text-sm text-[#8B7355] mt-1">
                        {tr("You agree to our platform's terms, conditions, and merchant responsibilities.", 'Noustud platvormi tingimuste ja kaupmehe kohustustega.')}
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
                        {tr('I accept the GDPR & Privacy Policy *', 'Noustun GDPR-i ja privaatsuspoliitikaga *')}
                      </span>
                      <p className="text-sm text-[#8B7355] mt-1">
                        {tr('Your data will be processed according to GDPR regulations.', 'Andmeid toodeldakse vastavalt GDPR nouetele.')}
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
                        {tr('I agree to receive marketing communications (Optional)', 'Noustun turundusteavitustega (valikuline)')}
                      </span>
                      <p className="text-sm text-[#8B7355] mt-1">
                        {tr('Get updates about new features, tips, and special offers.', 'Saa uuendusi funktsioonide, nippide ja eripakkumiste kohta.')}
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              <div className="p-4 bg-[#E8F5F1] border border-[#9DB5A5] rounded-[12px]">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-[#9DB5A5] flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-[#2D2721]">
                    <strong>{tr('Important:', 'Taehelepanu:')}</strong>{' '}
                    {tr("Your application will be reviewed by our team within 24-48 hours. You'll receive an email notification once approved.", 'Meie tiim vaatab taotluse ule 24-48 tunni jooksul. Kinnituse korral saad e-kirja.')}
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
                <h2 className="text-2xl font-bold text-[#2D2721]">{tr('Review Your Application', 'Kontrolli oma taotlust')}</h2>
                <p className="text-sm text-[#8B7355]">{tr('Please verify all information before submitting', 'Palun kontrolli enne esitamist koik andmed ule')}</p>
              </div>
            </div>

            <div className="space-y-6">
              {/* Business Info Summary */}
              <div className="p-6 bg-gradient-to-br from-[#FFF9ED] to-[#FFE5B4] rounded-[16px]">
                <h3 className="font-semibold text-[#2D2721] mb-4 flex items-center gap-2">
                  <Building className="h-5 w-5 text-[#FFC857]" />
                  {tr('Business Information', 'Ariinfo')}
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-[#8B7355]">{tr('Business Name:', 'Ettevotte nimi:')}</span>
                    <div className="font-semibold text-[#2D2721]">{formData.businessName}</div>
                  </div>
                  <div>
                    <span className="text-[#8B7355]">{tr('Category:', 'Kategooria:')}</span>
                    <div className="font-semibold text-[#2D2721]">
                      {categories.find(c => c.value === formData.category)?.label}
                    </div>
                  </div>
                  <div>
                    <span className="text-[#8B7355]">{tr('Registration #:', 'Registrikood:')}</span>
                    <div className="font-semibold text-[#2D2721]">{formData.registrationNumber}</div>
                  </div>
                  <div>
                    <span className="text-[#8B7355]">{tr('VAT #:', 'KMKR:')}</span>
                    <div className="font-semibold text-[#2D2721]">{formData.vatNumber || tr('N/A', 'Puudub')}</div>
                  </div>
                </div>
              </div>

              {/* Contact Summary */}
              <div className="p-6 bg-gradient-to-br from-[#FFF9ED] to-[#FFE5B4] rounded-[16px]">
                <h3 className="font-semibold text-[#2D2721] mb-4 flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-[#9DB5A5]" />
                  {tr('Contact & Location', 'Kontakt ja asukoht')}
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-[#8B7355]">{tr('Contact Person:', 'Kontaktisik:')}</span>
                    <div className="font-semibold text-[#2D2721]">{formData.contactPerson}</div>
                  </div>
                  <div>
                    <span className="text-[#8B7355]">{tr('Email:', 'E-post:')}</span>
                    <div className="font-semibold text-[#2D2721]">{formData.email}</div>
                  </div>
                  <div>
                    <span className="text-[#8B7355]">{tr('Phone:', 'Telefon:')}</span>
                    <div className="font-semibold text-[#2D2721]">{formData.phone}</div>
                  </div>
                  <div>
                    <span className="text-[#8B7355]">{tr('Location:', 'Asukoht:')}</span>
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
                  {tr('Business Details', 'Ari detailid')}
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-[#8B7355]">{tr('Employees:', 'Tootajad:')}</span>
                    <div className="font-semibold text-[#2D2721]">{formData.employeeCount}</div>
                  </div>
                  <div>
                    <span className="text-[#8B7355]">{tr('Monthly Revenue:', 'Kuine kaive:')}</span>
                    <div className="font-semibold text-[#2D2721]">{formData.monthlyRevenue}</div>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[#8B7355]">{tr('Bank Account (IBAN):', 'Pangakonto (IBAN):')}</span>
                    <div className="font-semibold text-[#2D2721] font-mono">{formData.bankAccount}</div>
                    <div className="text-xs text-[#8B7355] mt-0.5">{tr('Includes 6% service fee agreement', 'Sisaldab 6% teenustasu kokkulepet')}</div>
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
              {tr('Previous', 'Eelmine')}
            </WarmButton>
          ) : (
            <div />
          )}

          {step < 5 ? (
            <WarmButton onClick={nextStep}>
              {tr('Next', 'Jargmine')}
              <ArrowRight className="h-4 w-4 ml-2" />
            </WarmButton>
          ) : (
            <WarmButton onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2 animate-spin" />
                  {tr('Submitting...', 'Esitamine...')}
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  {tr('Submit Application', 'Esita taotlus')}
                </>
              )}
            </WarmButton>
          )}
        </div>
      </div>
    </div>
  );
}


