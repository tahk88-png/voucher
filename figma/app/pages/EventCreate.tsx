import { useState } from 'react';
import { WarmCard } from '@app/components/WarmCard';
import { WarmButton } from '@app/components/WarmButton';
import { useNavigate } from '@/lib/router-shim';
import { ArrowLeft, ArrowRight, Check, Upload, X, Plus, Trash2, Calendar, MapPin, Globe, Facebook, Instagram, Twitter, Linkedin, Video, Users, Phone, Mail, Tag } from 'lucide-react';
import { Input } from '@app/components/ui/input';
import { Label } from '@app/components/ui/label';
import { Textarea } from '@app/components/ui/textarea';
import { useLanguage } from '@app/contexts/LanguageContext';
import { toast } from 'sonner';
import { CurrencyDisplay } from '@app/components/CurrencyDisplay';
import { CreditCard } from 'lucide-react';

type Step = 1 | 2 | 3;

type TicketType = {
  id: string;
  name: string;
  price: string;
  originalPrice: string;
  quantity: string;
  description: string;
  salesStartDate: string;
  salesEndDate: string;
};

export function EventCreate() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const tr = (en: string, et: string) => (language === 'et' ? et : en);
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Step 1: Event Details
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    longDescription: '',
    date: '',
    time: '',
    endDate: '',
    endTime: '',
    location: '',
    venue: '',
    address: '',
    city: '',
    country: '',
    image: null as File | null,
    category: '',
    tags: '',
    registrationDeadline: '',
    registrationDeadlineTime: '',
    organizerName: '',
    contactEmail: '',
    contactPhone: '',
    eventWebsite: '',
    languages: '',
    capacity: '',
  });

  // Step 2: Ticket Types
  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([
    { id: '1', name: '', price: '', originalPrice: '', quantity: '', description: '', salesStartDate: '', salesEndDate: '' },
  ]);

  // Step 3: Additional Settings
  const [settings, setSettings] = useState({
    requireApproval: false,
    showAttendeesCount: true,
    allowWaitlist: true,
    maxTicketsPerOrder: '10',
    minTicketsPerOrder: '1',
    refundPolicy: 'none',
    enableEarlyBird: false,
    earlyBirdDiscount: '',
    earlyBirdDeadline: '',
    stripeAccountId: '', // Merchant's Stripe account for payouts
    enableStripePayments: true,
    facebookUrl: '',
    instagramUrl: '',
    twitterUrl: '',
    linkedinUrl: '',
    videoUrl: '',
    accessibilityInfo: '',
    specialInstructions: '',
    ageRestriction: '',
    dressCode: '',
  });

  const steps = [
    { number: 1, label: tr('Event Details', 'Sündmuse andmed') },
    { number: 2, label: tr('Ticket Types', 'Piletitüübid') },
    { number: 3, label: tr('Settings', 'Seaded') },
  ];

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

  const addTicketType = () => {
    const newId = (ticketTypes.length + 1).toString();
    setTicketTypes([
      ...ticketTypes,
      { id: newId, name: '', price: '', originalPrice: '', quantity: '', description: '', salesStartDate: '', salesEndDate: '' },
    ]);
  };

  const removeTicketType = (id: string) => {
    if (ticketTypes.length > 1) {
      setTicketTypes(ticketTypes.filter(t => t.id !== id));
    }
  };

  const updateTicketType = (id: string, field: keyof TicketType, value: string) => {
    setTicketTypes(ticketTypes.map(t => t.id === id ? { ...t, [field]: value } : t));
  };

  const isStepValid = (step: Step): boolean => {
    switch (step) {
      case 1:
        return formData.name.length > 0 && formData.date.length > 0 && formData.location.length > 0;
      case 2:
        return ticketTypes.every(t => t.name.length > 0 && t.price.length > 0 && t.quantity.length > 0);
      case 3:
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (!isStepValid(currentStep)) {
      toast.error(tr('Please fill in all required fields.', 'Palun täida kõik kohustuslikud väljad.'));
      return;
    }
    if (currentStep < 3) {
      setCurrentStep((currentStep + 1) as Step);
    } else {
      handleCreate();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as Step);
    } else {
      navigate('/events');
    }
  };

  const handleCreate = () => {
    toast.success(tr('Event created successfully!', 'Sündmus loodi edukalt!'));
    setTimeout(() => navigate('/events'), 1500);
  };

  const totalRevenue = ticketTypes.reduce((sum, ticket) => {
    const price = parseFloat(ticket.price) || 0;
    const qty = parseInt(ticket.quantity) || 0;
    return sum + (price * qty);
  }, 0);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <button
          onClick={() => navigate('/events')}
          className="flex items-center gap-2 text-sm text-[#6B5744] hover:text-[#2D2721] mb-4 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          {tr('Back to events', 'Tagasi sündmuste juurde')}
        </button>
        <h1 className="text-3xl font-bold text-[#2D2721]">{tr('Create Event', 'Loo sündmus')}</h1>
        <p className="text-[#6B5744] mt-1">{tr('Set up your event and start selling tickets', 'Sea sündmus üles ja alusta piletite müüki')}</p>
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
                    <div className="flex-1 h-0.5 bg-[#F2EDE3] mx-4">
                      <div
                        className={`h-full transition-all ${
                          currentStep > step.number
                            ? 'bg-gradient-to-r from-[#FFC857] to-[#FFB627]'
                            : ''
                        }`}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Step Content */}
            <div className="space-y-6">
              {/* Step 1: Event Details */}
              {currentStep === 1 && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-[#2D2721] font-medium">
                      {tr('Event Name', 'Sündmuse nimi')} <span className="text-[#E17B5C]">*</span>
                    </Label>
                    <Input
                      id="name"
                      placeholder={tr('e.g., Summer Music Festival 2024', 'nt Suvine Muusikafestival 2024')}
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="rounded-[12px] border-[rgba(139,115,85,0.2)] bg-white h-12"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-[#2D2721] font-medium">
                      {tr('Short Description', 'Lühikirjeldus')} <span className="text-[#E17B5C]">*</span>
                    </Label>
                    <Textarea
                      id="description"
                      placeholder={tr('Brief description for event listings...', 'Lühikirjeldus sündmuse loendi jaoks...')}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="rounded-[12px] border-[rgba(139,115,85,0.2)] bg-white min-h-[80px]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="longDescription" className="text-[#2D2721] font-medium">
                      {tr('Full Description', 'Täiskirjeldus')}
                    </Label>
                    <Textarea
                      id="longDescription"
                      placeholder={tr('Full event description, schedule, lineup, etc...', 'Täielik sündmuse kirjeldus, ajakava, esinejad jne...')}
                      value={formData.longDescription}
                      onChange={(e) => setFormData({ ...formData, longDescription: e.target.value })}
                      className="rounded-[12px] border-[rgba(139,115,85,0.2)] bg-white min-h-[120px]"
                    />
                  </div>

                  {/* Image Upload */}
                  <div className="space-y-2">
                    <Label className="text-[#2D2721] font-medium">
                      {tr('Event Image', 'Sündmuse pilt')} <span className="text-[#E17B5C]">*</span>
                    </Label>
                    {!imagePreview ? (
                      <label
                        htmlFor="image-upload"
                        className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-[rgba(139,115,85,0.2)] rounded-[12px] cursor-pointer bg-[#FFF9ED] hover:bg-[#FFE5B4] transition-colors"
                      >
                        <Upload className="h-10 w-10 text-[#FFC857] mb-3" />
                        <span className="text-sm font-medium text-[#6B5744]">
                          {tr('Click to upload event banner', 'Klõpsa sündmuse bänneri üleslaadimiseks')}
                        </span>
                        <span className="text-xs text-[#8B7355] mt-1">
                          {tr('PNG, JPG up to 10MB (1920x1080 recommended)', 'PNG, JPG kuni 10MB (soovituslik 1920x1080)')}
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
                          alt={tr('Preview', 'Eelvaade')}
                          className="w-full h-48 object-cover rounded-[12px]"
                        />
                        <button
                          onClick={handleImageRemove}
                          className="absolute top-3 right-3 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-warm hover:bg-[#FEE2E2] transition-colors"
                        >
                          <X className="h-5 w-5 text-[#E17B5C]" />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="date" className="text-[#2D2721] font-medium">
                        {tr('Date', 'Kuupäev')} <span className="text-[#E17B5C]">*</span>
                      </Label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#8B7355] pointer-events-none" />
                        <Input
                          id="date"
                          type="date"
                          value={formData.date}
                          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                          className="rounded-[12px] border-[rgba(139,115,85,0.2)] bg-white h-12 pl-10"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="time" className="text-[#2D2721] font-medium">
                        {tr('Time', 'Kellaaeg')} <span className="text-[#E17B5C]">*</span>
                      </Label>
                      <Input
                        id="time"
                        type="time"
                        value={formData.time}
                        onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                        className="rounded-[12px] border-[rgba(139,115,85,0.2)] bg-white h-12"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="endDate" className="text-[#2D2721] font-medium">
                        {tr('End Date', 'Lõppkuupäev')}
                      </Label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#8B7355] pointer-events-none" />
                        <Input
                          id="endDate"
                          type="date"
                          value={formData.endDate}
                          onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                          className="rounded-[12px] border-[rgba(139,115,85,0.2)] bg-white h-12 pl-10"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="endTime" className="text-[#2D2721] font-medium">
                        {tr('End Time', 'Lõppaeg')}
                      </Label>
                      <Input
                        id="endTime"
                        type="time"
                        value={formData.endTime}
                        onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                        className="rounded-[12px] border-[rgba(139,115,85,0.2)] bg-white h-12"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location" className="text-[#2D2721] font-medium">
                      {tr('Venue Name', 'Toimumiskoha nimi')} <span className="text-[#E17B5C]">*</span>
                    </Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#8B7355] pointer-events-none" />
                      <Input
                        id="location"
                        placeholder={tr('e.g., Stockholm Arena', 'nt Tondiraba jäähall')}
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        className="rounded-[12px] border-[rgba(139,115,85,0.2)] bg-white h-12 pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address" className="text-[#2D2721] font-medium">
                      {tr('Address', 'Aadress')}
                    </Label>
                    <Input
                      id="address"
                      placeholder={tr('e.g., 123 Main St, Stockholm', 'nt Pärnu mnt 10, Tallinn')}
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="rounded-[12px] border-[rgba(139,115,85,0.2)] bg-white h-12"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city" className="text-[#2D2721] font-medium">
                        {tr('City', 'Linn')}
                      </Label>
                      <Input
                        id="city"
                        placeholder={tr('Stockholm', 'Tallinn')}
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        className="rounded-[12px] border-[rgba(139,115,85,0.2)] bg-white h-12"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="country" className="text-[#2D2721] font-medium">
                        {tr('Country', 'Riik')}
                      </Label>
                      <Input
                        id="country"
                        placeholder={tr('Sweden', 'Eesti')}
                        value={formData.country}
                        onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                        className="rounded-[12px] border-[rgba(139,115,85,0.2)] bg-white h-12"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category" className="text-[#2D2721] font-medium">
                      {tr('Category', 'Kategooria')}
                    </Label>
                    <select
                      id="category"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full rounded-[12px] border border-[rgba(139,115,85,0.2)] bg-white h-12 px-4 text-[#2D2721]"
                    >
                      <option value="">{tr('Select category', 'Vali kategooria')}</option>
                      <option value="music">{tr('Music & Concerts', 'Muusika ja kontserdid')}</option>
                      <option value="conference">{tr('Conference & Summit', 'Konverents ja tippkohtumine')}</option>
                      <option value="workshop">{tr('Workshop & Class', 'Töötuba ja koolitus')}</option>
                      <option value="sports">{tr('Sports & Fitness', 'Sport ja treening')}</option>
                      <option value="food">{tr('Food & Drink', 'Toit ja jook')}</option>
                      <option value="arts">{tr('Arts & Culture', 'Kunst ja kultuur')}</option>
                      <option value="networking">{tr('Networking', 'Võrgustik')}</option>
                      <option value="other">{tr('Other', 'Muu')}</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tags" className="text-[#2D2721] font-medium">
                      {tr('Tags', 'Sildid')}
                    </Label>
                    <Input
                      id="tags"
                      placeholder={tr('e.g., music, festival, summer', 'nt muusika, festival, suvi')}
                      value={formData.tags}
                      onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                      className="rounded-[12px] border-[rgba(139,115,85,0.2)] bg-white h-12"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="registrationDeadline" className="text-[#2D2721] font-medium">
                      {tr('Registration Deadline', 'Registreerimise tähtaeg')}
                    </Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#8B7355] pointer-events-none" />
                      <Input
                        id="registrationDeadline"
                        type="date"
                        value={formData.registrationDeadline}
                        onChange={(e) => setFormData({ ...formData, registrationDeadline: e.target.value })}
                        className="rounded-[12px] border-[rgba(139,115,85,0.2)] bg-white h-12 pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="registrationDeadlineTime" className="text-[#2D2721] font-medium">
                      {tr('Registration Deadline Time', 'Registreerimise lõppaeg')}
                    </Label>
                    <Input
                      id="registrationDeadlineTime"
                      type="time"
                      value={formData.registrationDeadlineTime}
                      onChange={(e) => setFormData({ ...formData, registrationDeadlineTime: e.target.value })}
                      className="rounded-[12px] border-[rgba(139,115,85,0.2)] bg-white h-12"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="organizerName" className="text-[#2D2721] font-medium">
                      {tr('Organizer Name', 'Korraldaja nimi')}
                    </Label>
                    <Input
                      id="organizerName"
                      placeholder={tr('e.g., Event Organizers Inc.', 'nt Event Korraldajad OÜ')}
                      value={formData.organizerName}
                      onChange={(e) => setFormData({ ...formData, organizerName: e.target.value })}
                      className="rounded-[12px] border-[rgba(139,115,85,0.2)] bg-white h-12"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contactEmail" className="text-[#2D2721] font-medium">
                      {tr('Contact Email', 'Kontakt e-post')}
                    </Label>
                    <Input
                      id="contactEmail"
                      type="email"
                        placeholder={tr('e.g., contact@eventorganizers.com', 'nt info@sundmus.ee')}
                      value={formData.contactEmail}
                      onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                      className="rounded-[12px] border-[rgba(139,115,85,0.2)] bg-white h-12"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contactPhone" className="text-[#2D2721] font-medium">
                      {tr('Contact Phone', 'Kontakttelefon')}
                    </Label>
                    <Input
                      id="contactPhone"
                      type="tel"
                        placeholder={tr('e.g., +46 123 456 789', 'nt +372 5555 5555')}
                      value={formData.contactPhone}
                      onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                      className="rounded-[12px] border-[rgba(139,115,85,0.2)] bg-white h-12"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="eventWebsite" className="text-[#2D2721] font-medium">
                      {tr('Event Website', 'Sündmuse veebileht')}
                    </Label>
                    <Input
                      id="eventWebsite"
                      type="url"
                        placeholder={tr('e.g., https://www.eventorganizers.com', 'nt https://www.sundmus.ee')}
                      value={formData.eventWebsite}
                      onChange={(e) => setFormData({ ...formData, eventWebsite: e.target.value })}
                      className="rounded-[12px] border-[rgba(139,115,85,0.2)] bg-white h-12"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="languages" className="text-[#2D2721] font-medium">
                      {tr('Languages', 'Keeled')}
                    </Label>
                    <Input
                      id="languages"
                      placeholder={tr('e.g., English, Swedish', 'nt eesti, inglise')}
                      value={formData.languages}
                      onChange={(e) => setFormData({ ...formData, languages: e.target.value })}
                      className="rounded-[12px] border-[rgba(139,115,85,0.2)] bg-white h-12"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="capacity" className="text-[#2D2721] font-medium">
                      {tr('Capacity', 'Mahutavus')}
                    </Label>
                    <Input
                      id="capacity"
                      type="number"
                      placeholder={tr('e.g., 1000', 'nt 1000')}
                      value={formData.capacity}
                      onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                      className="rounded-[12px] border-[rgba(139,115,85,0.2)] bg-white h-12"
                    />
                  </div>
                </>
              )}

              {/* Step 2: Ticket Types */}
              {currentStep === 2 && (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-[#2D2721]">{tr('Ticket Types', 'Piletitüübid')}</h3>
                      <p className="text-sm text-[#6B5744]">{tr('Add different ticket tiers and pricing', 'Lisa erinevad piletitasemed ja hinnad')}</p>
                    </div>
                    <WarmButton size="sm" onClick={addTicketType}>
                      <Plus className="h-4 w-4 mr-2" />
                      {tr('Add Ticket', 'Lisa pilet')}
                    </WarmButton>
                  </div>

                  <div className="space-y-4">
                    {ticketTypes.map((ticket, index) => (
                      <WarmCard key={ticket.id} padding="lg" className="bg-[#FFF9ED]">
                        <div className="flex items-start justify-between mb-4">
                          <h4 className="font-semibold text-[#2D2721]">{tr('Ticket Type', 'Piletitüüp')} {index + 1}</h4>
                          {ticketTypes.length > 1 && (
                            <button
                              onClick={() => removeTicketType(ticket.id)}
                              className="p-2 hover:bg-[#FEE2E2] rounded-lg transition-colors"
                            >
                              <Trash2 className="h-4 w-4 text-[#E17B5C]" />
                            </button>
                          )}
                        </div>

                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label className="text-[#2D2721] font-medium">
                              {tr('Ticket Name', 'Pileti nimi')} <span className="text-[#E17B5C]">*</span>
                            </Label>
                            <Input
                              placeholder={tr('e.g., Early Bird, VIP, General Admission', 'nt Varajane pääse, VIP, Üldpääse')}
                              value={ticket.name}
                              onChange={(e) => updateTicketType(ticket.id, 'name', e.target.value)}
                              className="rounded-[12px] border-[rgba(139,115,85,0.2)] bg-white h-12"
                            />
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="space-y-2">
                              <Label className="text-[#2D2721] font-medium">
                                {tr('Price (€)', 'Hind (€)')} <span className="text-[#E17B5C]">*</span>
                              </Label>
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="99.00"
                                value={ticket.price}
                                onChange={(e) => updateTicketType(ticket.id, 'price', e.target.value)}
                                className="rounded-[12px] border-[rgba(139,115,85,0.2)] bg-white h-12"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-[#2D2721] font-medium">
                                {tr('Original Price (€)', 'Alghind (€)')}
                              </Label>
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="150.00"
                                value={ticket.originalPrice}
                                onChange={(e) => updateTicketType(ticket.id, 'originalPrice', e.target.value)}
                                className="rounded-[12px] border-[rgba(139,115,85,0.2)] bg-white h-12"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-[#2D2721] font-medium">
                                {tr('Quantity', 'Kogus')} <span className="text-[#E17B5C]">*</span>
                              </Label>
                              <Input
                                type="number"
                                placeholder="100"
                                value={ticket.quantity}
                                onChange={(e) => updateTicketType(ticket.id, 'quantity', e.target.value)}
                                className="rounded-[12px] border-[rgba(139,115,85,0.2)] bg-white h-12"
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-[#2D2721] font-medium">
                              {tr('Description', 'Kirjeldus')}
                            </Label>
                            <Textarea
                              placeholder={tr("What's included with this ticket...", 'Mis selle piletiga kaasneb...')}
                              value={ticket.description}
                              onChange={(e) => updateTicketType(ticket.id, 'description', e.target.value)}
                              className="rounded-[12px] border-[rgba(139,115,85,0.2)] bg-white min-h-[60px]"
                            />
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label className="text-[#2D2721] font-medium">
                                {tr('Sales Start Date', 'Müügi alguskuupäev')}
                              </Label>
                              <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#8B7355] pointer-events-none" />
                                <Input
                                  type="date"
                                  value={ticket.salesStartDate}
                                  onChange={(e) => updateTicketType(ticket.id, 'salesStartDate', e.target.value)}
                                  className="rounded-[12px] border-[rgba(139,115,85,0.2)] bg-white h-12 pl-10"
                                />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-[#2D2721] font-medium">
                                {tr('Sales End Date', 'Müügi lõppkuupäev')}
                              </Label>
                              <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#8B7355] pointer-events-none" />
                                <Input
                                  type="date"
                                  value={ticket.salesEndDate}
                                  onChange={(e) => updateTicketType(ticket.id, 'salesEndDate', e.target.value)}
                                  className="rounded-[12px] border-[rgba(139,115,85,0.2)] bg-white h-12 pl-10"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Ticket Preview */}
                          {ticket.price && ticket.quantity && (
                            <div className="pt-3 border-t border-[rgba(139,115,85,0.1)]">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-[#8B7355]">{tr('Potential Revenue:', 'Potentsiaalne tulu:')}</span>
                                <span className="font-semibold text-[#2D2721]">
                                  <CurrencyDisplay
                                    amount={parseFloat(ticket.price) * parseInt(ticket.quantity)}
                                    currency="EUR"
                                  />
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </WarmCard>
                    ))}
                  </div>
                </>
              )}

              {/* Step 3: Settings */}
              {currentStep === 3 && (
                <>
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-[#2D2721] mb-4">{tr('Ticket Settings', 'Piletiseaded')}</h3>
                      
                      <div className="space-y-3">
                        <label className="flex items-center justify-between p-4 bg-[#FFF9ED] rounded-lg cursor-pointer hover:bg-[#FFE5B4] transition-colors">
                          <div>
                            <div className="font-medium text-[#2D2721]">{tr('Show Attendees Count', 'Näita osalejate arvu')}</div>
                            <div className="text-xs text-[#8B7355]">{tr('Display how many people are attending', 'Kuva, mitu inimest osaleb')}</div>
                          </div>
                          <input
                            type="checkbox"
                            checked={settings.showAttendeesCount}
                            onChange={(e) => setSettings({ ...settings, showAttendeesCount: e.target.checked })}
                            className="h-5 w-5 rounded border-[#E7DCC7] text-[#FFC857] focus:ring-[#FFC857]"
                          />
                        </label>

                        <label className="flex items-center justify-between p-4 bg-[#FFF9ED] rounded-lg cursor-pointer hover:bg-[#FFE5B4] transition-colors">
                          <div>
                            <div className="font-medium text-[#2D2721]">{tr('Allow Waitlist', 'Luba ootenimekiri')}</div>
                            <div className="text-xs text-[#8B7355]">{tr('Let people join waitlist when sold out', 'Luba liituda ootenimekirjaga, kui piletid on läbi')}</div>
                          </div>
                          <input
                            type="checkbox"
                            checked={settings.allowWaitlist}
                            onChange={(e) => setSettings({ ...settings, allowWaitlist: e.target.checked })}
                            className="h-5 w-5 rounded border-[#E7DCC7] text-[#FFC857] focus:ring-[#FFC857]"
                          />
                        </label>

                        <label className="flex items-center justify-between p-4 bg-[#FFF9ED] rounded-lg cursor-pointer hover:bg-[#FFE5B4] transition-colors">
                          <div>
                            <div className="font-medium text-[#2D2721]">{tr('Require Approval', 'Nõua kinnitamist')}</div>
                            <div className="text-xs text-[#8B7355]">{tr('Manually approve each ticket purchase', 'Kinnita iga piletimüük käsitsi')}</div>
                          </div>
                          <input
                            type="checkbox"
                            checked={settings.requireApproval}
                            onChange={(e) => setSettings({ ...settings, requireApproval: e.target.checked })}
                            className="h-5 w-5 rounded border-[#E7DCC7] text-[#FFC857] focus:ring-[#FFC857]"
                          />
                        </label>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="maxTickets" className="text-[#2D2721] font-medium">
                        {tr('Max Tickets Per Order', 'Maksimaalne piletite arv tellimuses')}
                      </Label>
                      <Input
                        id="maxTickets"
                        type="number"
                        value={settings.maxTicketsPerOrder}
                        onChange={(e) => setSettings({ ...settings, maxTicketsPerOrder: e.target.value })}
                        className="rounded-[12px] border-[rgba(139,115,85,0.2)] bg-white h-12"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="minTickets" className="text-[#2D2721] font-medium">
                        {tr('Min Tickets Per Order', 'Minimaalne piletite arv tellimuses')}
                      </Label>
                      <Input
                        id="minTickets"
                        type="number"
                        value={settings.minTicketsPerOrder}
                        onChange={(e) => setSettings({ ...settings, minTicketsPerOrder: e.target.value })}
                        className="rounded-[12px] border-[rgba(139,115,85,0.2)] bg-white h-12"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="refundPolicy" className="text-[#2D2721] font-medium">
                        {tr('Refund Policy', 'Tagastuspoliitika')}
                      </Label>
                      <select
                        id="refundPolicy"
                        value={settings.refundPolicy}
                        onChange={(e) => setSettings({ ...settings, refundPolicy: e.target.value })}
                        className="w-full rounded-[12px] border border-[rgba(139,115,85,0.2)] bg-white h-12 px-4 text-[#2D2721]"
                      >
                        <option value="none">{tr('No refunds', 'Tagastusi ei ole')}</option>
                        <option value="7days">{tr('Refund up to 7 days before', 'Tagastus kuni 7 päeva enne')}</option>
                        <option value="14days">{tr('Refund up to 14 days before', 'Tagastus kuni 14 päeva enne')}</option>
                        <option value="30days">{tr('Refund up to 30 days before', 'Tagastus kuni 30 päeva enne')}</option>
                        <option value="anytime">{tr('Refund anytime', 'Tagastus igal ajal')}</option>
                      </select>
                    </div>

                    {/* Stripe Payment Settings */}
                    <div className="pt-6 border-t border-[rgba(139,115,85,0.1)]">
                      <h3 className="text-lg font-semibold text-[#2D2721] mb-4">{tr('Payment Settings', 'Maksete seaded')}</h3>
                      
                      <div className="bg-gradient-to-br from-[#E8F5E9] to-[#F1F8E9] rounded-[16px] p-6 mb-4">
                        <div className="flex items-start gap-3 mb-4">
                          <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center flex-shrink-0">
                            <CreditCard className="h-5 w-5 text-[#9DB5A5]" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-[#2D2721] mb-1">{tr('Stripe Payments', 'Stripe maksed')}</h4>
                            <p className="text-sm text-[#6B5744]">
                              {tr('Secure payment processing powered by Stripe. Customers pay with credit card, and funds are automatically transferred to your account.', 'Turvaline maksete töötlemine Stripe kaudu. Kliendid maksavad kaardiga ja raha kantakse automaatselt sinu kontole.')}
                            </p>
                          </div>
                        </div>
                        
                        <div className="bg-white rounded-lg p-4 space-y-3">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-[#8B7355]">{tr('Platform Fee:', 'Platvormi tasu:')}</span>
                            <span className="font-semibold text-[#2D2721]">{tr('6% per ticket', '6% pileti kohta')}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-[#8B7355]">{tr('Stripe Processing Fee:', 'Stripe töötlemistasu:')}</span>
                            <span className="font-semibold text-[#2D2721]">~2.9% + €0.25</span>
                          </div>
                          <div className="pt-3 border-t border-[rgba(139,115,85,0.1)]">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-[#8B7355]">{tr('Your Estimated Revenue:', 'Sinu hinnanguline tulu:')}</span>
                              <span className="text-lg font-bold text-[#2D2721]">
                                <CurrencyDisplay amount={totalRevenue * 0.94} currency="EUR" />
                              </span>
                            </div>
                            <p className="text-xs text-[#8B7355] mt-1">
                              {tr('Based on', 'Põhineb')} {totalRevenue > 0 ? <CurrencyDisplay amount={totalRevenue} currency="EUR" /> : '€0.00'} {tr('potential revenue (excl. Stripe fees)', 'potentsiaalsel tulul (ilma Stripe tasudeta)')}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="stripeAccountId" className="text-[#2D2721] font-medium">
                          {tr('Stripe Account ID (Optional)', 'Stripe konto ID (valikuline)')}
                        </Label>
                        <Input
                          id="stripeAccountId"
                          placeholder="acct_1234567890"
                          value={settings.stripeAccountId}
                          onChange={(e) => setSettings({ ...settings, stripeAccountId: e.target.value })}
                          className="rounded-[12px] border-[rgba(139,115,85,0.2)] bg-white h-12"
                        />
                        <p className="text-xs text-[#8B7355]">
                          {tr('Connect your Stripe account for direct payouts. Leave empty to use platform default.', 'Ühenda oma Stripe konto otseväljamaksete jaoks. Jäta tühjaks, kui soovid kasutada platvormi vaikeseadeid.')}
                        </p>
                      </div>
                    </div>

                    {/* Social Media Links */}
                    <div className="pt-6 border-t border-[rgba(139,115,85,0.1)]">
                      <h3 className="text-lg font-semibold text-[#2D2721] mb-4">{tr('Social Media Links', 'Sotsiaalmeedia lingid')}</h3>
                      
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <Facebook className="h-5 w-5 text-[#3B5998]" />
                          <Input
                            type="url"
                            placeholder="https://www.facebook.com/yourpage"
                            value={settings.facebookUrl}
                            onChange={(e) => setSettings({ ...settings, facebookUrl: e.target.value })}
                            className="rounded-[12px] border-[rgba(139,115,85,0.2)] bg-white h-12"
                          />
                        </div>
                        <div className="flex items-center gap-3">
                          <Instagram className="h-5 w-5 text-[#E1306C]" />
                          <Input
                            type="url"
                            placeholder="https://www.instagram.com/yourpage"
                            value={settings.instagramUrl}
                            onChange={(e) => setSettings({ ...settings, instagramUrl: e.target.value })}
                            className="rounded-[12px] border-[rgba(139,115,85,0.2)] bg-white h-12"
                          />
                        </div>
                        <div className="flex items-center gap-3">
                          <Twitter className="h-5 w-5 text-[#1DA1F2]" />
                          <Input
                            type="url"
                            placeholder="https://www.twitter.com/yourpage"
                            value={settings.twitterUrl}
                            onChange={(e) => setSettings({ ...settings, twitterUrl: e.target.value })}
                            className="rounded-[12px] border-[rgba(139,115,85,0.2)] bg-white h-12"
                          />
                        </div>
                        <div className="flex items-center gap-3">
                          <Linkedin className="h-5 w-5 text-[#0077B5]" />
                          <Input
                            type="url"
                            placeholder="https://www.linkedin.com/yourpage"
                            value={settings.linkedinUrl}
                            onChange={(e) => setSettings({ ...settings, linkedinUrl: e.target.value })}
                            className="rounded-[12px] border-[rgba(139,115,85,0.2)] bg-white h-12"
                          />
                        </div>
                        <div className="flex items-center gap-3">
                          <Video className="h-5 w-5 text-[#FF0000]" />
                          <Input
                            type="url"
                            placeholder="https://www.youtube.com/yourpage"
                            value={settings.videoUrl}
                            onChange={(e) => setSettings({ ...settings, videoUrl: e.target.value })}
                            className="rounded-[12px] border-[rgba(139,115,85,0.2)] bg-white h-12"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Additional Information */}
                    <div className="pt-6 border-t border-[rgba(139,115,85,0.1)]">
                      <h3 className="text-lg font-semibold text-[#2D2721] mb-4">{tr('Additional Information', 'Lisainfo')}</h3>
                      
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <Label className="text-[#2D2721] font-medium">
                            {tr('Accessibility Info', 'Ligipääsetavuse info')}
                          </Label>
                          <Textarea
                            placeholder={tr('Information about accessibility features...', 'Info ligipääsetavuse võimaluste kohta...')}
                            value={settings.accessibilityInfo}
                            onChange={(e) => setSettings({ ...settings, accessibilityInfo: e.target.value })}
                            className="rounded-[12px] border-[rgba(139,115,85,0.2)] bg-white min-h-[60px]"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[#2D2721] font-medium">
                            {tr('Special Instructions', 'Erijuhised')}
                          </Label>
                          <Textarea
                            placeholder={tr('Any special instructions for attendees...', 'Kõik erijuhised osalejatele...')}
                            value={settings.specialInstructions}
                            onChange={(e) => setSettings({ ...settings, specialInstructions: e.target.value })}
                            className="rounded-[12px] border-[rgba(139,115,85,0.2)] bg-white min-h-[60px]"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[#2D2721] font-medium">
                            {tr('Age Restriction', 'Vanusepiirang')}
                          </Label>
                          <Input
                            type="text"
                            placeholder={tr('e.g., 18+', 'nt 18+')}
                            value={settings.ageRestriction}
                            onChange={(e) => setSettings({ ...settings, ageRestriction: e.target.value })}
                            className="rounded-[12px] border-[rgba(139,115,85,0.2)] bg-white h-12"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[#2D2721] font-medium">
                            {tr('Dress Code', 'Riietuskood')}
                          </Label>
                          <Input
                            type="text"
                            placeholder={tr('e.g., Formal, Casual', 'nt pidulik, vaba')}
                            value={settings.dressCode}
                            onChange={(e) => setSettings({ ...settings, dressCode: e.target.value })}
                            className="rounded-[12px] border-[rgba(139,115,85,0.2)] bg-white h-12"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-[rgba(139,115,85,0.1)]">
              <WarmButton variant="outline" onClick={handleBack}>
                <ArrowLeft className="h-5 w-5 mr-2" />
                {currentStep === 1 ? tr('Cancel', 'Tühista') : tr('Back', 'Tagasi')}
              </WarmButton>
              <WarmButton onClick={handleNext}>
                {currentStep === 3 ? tr('Create Event', 'Loo sündmus') : tr('Next', 'Järgmine')}
                {currentStep < 3 && <ArrowRight className="h-5 w-5 ml-2" />}
              </WarmButton>
            </div>
          </WarmCard>
        </div>

        {/* Preview Section */}
        <div className="lg:col-span-1">
          <div className="sticky top-6">
            <WarmCard padding="lg">
              <h3 className="text-lg font-semibold text-[#2D2721] mb-4">{tr('Preview', 'Eelvaade')}</h3>
              
              {imagePreview && (
                <img
                  src={imagePreview}
                  alt={tr('Event preview', 'Sündmuse eelvaade')}
                  className="w-full h-32 object-cover rounded-lg mb-4"
                />
              )}

              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-[#8B7355]">{tr('Event Name:', 'Sündmuse nimi:')}</span>
                  <p className="font-medium text-[#2D2721]">{formData.name || tr('Not set', 'Määramata')}</p>
                </div>
                <div>
                  <span className="text-[#8B7355]">{tr('Date & Time:', 'Kuupäev ja kellaaeg:')}</span>
                  <p className="font-medium text-[#2D2721]">
                    {formData.date && formData.time ? `${formData.date} ${tr('at', 'kell')} ${formData.time}` : tr('Not set', 'Määramata')}
                  </p>
                </div>
                <div>
                  <span className="text-[#8B7355]">{tr('Location:', 'Asukoht:')}</span>
                  <p className="font-medium text-[#2D2721]">{formData.location || tr('Not set', 'Määramata')}</p>
                </div>
                <div>
                  <span className="text-[#8B7355]">{tr('Ticket Types:', 'Piletitüübid:')}</span>
                  <p className="font-medium text-[#2D2721]">{ticketTypes.length}</p>
                </div>
                <div>
                  <span className="text-[#8B7355]">{tr('Total Capacity:', 'Kogumahutavus:')}</span>
                  <p className="font-medium text-[#2D2721]">
                    {ticketTypes.reduce((sum, t) => sum + (parseInt(t.quantity) || 0), 0)} {tr('tickets', 'piletit')}
                  </p>
                </div>
                <div className="pt-3 border-t border-[rgba(139,115,85,0.1)]">
                  <span className="text-[#8B7355]">{tr('Potential Revenue:', 'Potentsiaalne tulu:')}</span>
                  <p className="text-lg font-bold text-[#2D2721]">
                    <CurrencyDisplay amount={totalRevenue} currency="EUR" />
                  </p>
                  <p className="text-xs text-[#8B7355] mt-1">
                    {tr('After 6% fee:', 'Pärast 6% tasu:')} <CurrencyDisplay amount={totalRevenue * 0.94} currency="EUR" />
                  </p>
                </div>
              </div>
            </WarmCard>
          </div>
        </div>
      </div>
    </div>
  );
}
