import { useState } from 'react';
import { WarmCard } from '@/figma/app/components/WarmCard';
import { WarmButton } from '@/figma/app/components/WarmButton';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Upload, X, Plus, Trash2, Calendar, MapPin, Globe, Facebook, Instagram, Twitter, Linkedin, Video, Users, Phone, Mail, Tag } from 'lucide-react';
import { Input } from '@/figma/app/components/ui/input';
import { Label } from '@/figma/app/components/ui/label';
import { Textarea } from '@/figma/app/components/ui/textarea';
import { toast } from 'sonner';
import { CurrencyDisplay } from '@/figma/app/components/CurrencyDisplay';
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
    { id: '1', name: 'General Admission', price: '', originalPrice: '', quantity: '', description: '', salesStartDate: '', salesEndDate: '' },
  ]);

  // Step 3: Additional Settings
  const [settings, setSettings] = useState({
    requireApproval: false,
    showAttendeesCount: true,
    allowWaitlist: true,
    maxTicketsPerOrder: '10',
    minTicketsPerOrder: '1',
    refundPolicy: 'No refunds',
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
    { number: 1, label: 'Event Details' },
    { number: 2, label: 'Ticket Types' },
    { number: 3, label: 'Settings' },
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
      toast.error('Please fill in all required fields');
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
    toast.success('Event created successfully!');
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
          Back to events
        </button>
        <h1 className="text-3xl font-bold text-[#2D2721]">Create Event</h1>
        <p className="text-[#6B5744] mt-1">Set up your event and start selling tickets</p>
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
                      Event Name <span className="text-[#E17B5C]">*</span>
                    </Label>
                    <Input
                      id="name"
                      placeholder="e.g., Summer Music Festival 2024"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="rounded-[12px] border-[rgba(139,115,85,0.2)] bg-white h-12"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-[#2D2721] font-medium">
                      Short Description <span className="text-[#E17B5C]">*</span>
                    </Label>
                    <Textarea
                      id="description"
                      placeholder="Brief description for event listings..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="rounded-[12px] border-[rgba(139,115,85,0.2)] bg-white min-h-[80px]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="longDescription" className="text-[#2D2721] font-medium">
                      Full Description
                    </Label>
                    <Textarea
                      id="longDescription"
                      placeholder="Full event description, schedule, lineup, etc..."
                      value={formData.longDescription}
                      onChange={(e) => setFormData({ ...formData, longDescription: e.target.value })}
                      className="rounded-[12px] border-[rgba(139,115,85,0.2)] bg-white min-h-[120px]"
                    />
                  </div>

                  {/* Image Upload */}
                  <div className="space-y-2">
                    <Label className="text-[#2D2721] font-medium">
                      Event Image <span className="text-[#E17B5C]">*</span>
                    </Label>
                    {!imagePreview ? (
                      <label
                        htmlFor="image-upload"
                        className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-[rgba(139,115,85,0.2)] rounded-[12px] cursor-pointer bg-[#FFF9ED] hover:bg-[#FFE5B4] transition-colors"
                      >
                        <Upload className="h-10 w-10 text-[#FFC857] mb-3" />
                        <span className="text-sm font-medium text-[#6B5744]">
                          Click to upload event banner
                        </span>
                        <span className="text-xs text-[#8B7355] mt-1">
                          PNG, JPG up to 10MB (1920x1080 recommended)
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
                        Date <span className="text-[#E17B5C]">*</span>
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
                        Time <span className="text-[#E17B5C]">*</span>
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
                        End Date
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
                        End Time
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
                      Venue Name <span className="text-[#E17B5C]">*</span>
                    </Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#8B7355] pointer-events-none" />
                      <Input
                        id="location"
                        placeholder="e.g., Stockholm Arena"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        className="rounded-[12px] border-[rgba(139,115,85,0.2)] bg-white h-12 pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address" className="text-[#2D2721] font-medium">
                      Address
                    </Label>
                    <Input
                      id="address"
                      placeholder="e.g., 123 Main St, Stockholm"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="rounded-[12px] border-[rgba(139,115,85,0.2)] bg-white h-12"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city" className="text-[#2D2721] font-medium">
                        City
                      </Label>
                      <Input
                        id="city"
                        placeholder="Stockholm"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        className="rounded-[12px] border-[rgba(139,115,85,0.2)] bg-white h-12"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="country" className="text-[#2D2721] font-medium">
                        Country
                      </Label>
                      <Input
                        id="country"
                        placeholder="Sweden"
                        value={formData.country}
                        onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                        className="rounded-[12px] border-[rgba(139,115,85,0.2)] bg-white h-12"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category" className="text-[#2D2721] font-medium">
                      Category
                    </Label>
                    <select
                      id="category"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full rounded-[12px] border border-[rgba(139,115,85,0.2)] bg-white h-12 px-4 text-[#2D2721]"
                    >
                      <option value="">Select category</option>
                      <option value="music">Music & Concerts</option>
                      <option value="conference">Conference & Summit</option>
                      <option value="workshop">Workshop & Class</option>
                      <option value="sports">Sports & Fitness</option>
                      <option value="food">Food & Drink</option>
                      <option value="arts">Arts & Culture</option>
                      <option value="networking">Networking</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tags" className="text-[#2D2721] font-medium">
                      Tags
                    </Label>
                    <Input
                      id="tags"
                      placeholder="e.g., music, festival, summer"
                      value={formData.tags}
                      onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                      className="rounded-[12px] border-[rgba(139,115,85,0.2)] bg-white h-12"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="registrationDeadline" className="text-[#2D2721] font-medium">
                      Registration Deadline
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
                      Registration Deadline Time
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
                      Organizer Name
                    </Label>
                    <Input
                      id="organizerName"
                      placeholder="e.g., Event Organizers Inc."
                      value={formData.organizerName}
                      onChange={(e) => setFormData({ ...formData, organizerName: e.target.value })}
                      className="rounded-[12px] border-[rgba(139,115,85,0.2)] bg-white h-12"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contactEmail" className="text-[#2D2721] font-medium">
                      Contact Email
                    </Label>
                    <Input
                      id="contactEmail"
                      type="email"
                      placeholder="e.g., contact@eventorganizers.com"
                      value={formData.contactEmail}
                      onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                      className="rounded-[12px] border-[rgba(139,115,85,0.2)] bg-white h-12"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contactPhone" className="text-[#2D2721] font-medium">
                      Contact Phone
                    </Label>
                    <Input
                      id="contactPhone"
                      type="tel"
                      placeholder="e.g., +46 123 456 789"
                      value={formData.contactPhone}
                      onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                      className="rounded-[12px] border-[rgba(139,115,85,0.2)] bg-white h-12"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="eventWebsite" className="text-[#2D2721] font-medium">
                      Event Website
                    </Label>
                    <Input
                      id="eventWebsite"
                      type="url"
                      placeholder="e.g., https://www.eventorganizers.com"
                      value={formData.eventWebsite}
                      onChange={(e) => setFormData({ ...formData, eventWebsite: e.target.value })}
                      className="rounded-[12px] border-[rgba(139,115,85,0.2)] bg-white h-12"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="languages" className="text-[#2D2721] font-medium">
                      Languages
                    </Label>
                    <Input
                      id="languages"
                      placeholder="e.g., English, Swedish"
                      value={formData.languages}
                      onChange={(e) => setFormData({ ...formData, languages: e.target.value })}
                      className="rounded-[12px] border-[rgba(139,115,85,0.2)] bg-white h-12"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="capacity" className="text-[#2D2721] font-medium">
                      Capacity
                    </Label>
                    <Input
                      id="capacity"
                      type="number"
                      placeholder="e.g., 1000"
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
                      <h3 className="text-lg font-semibold text-[#2D2721]">Ticket Types</h3>
                      <p className="text-sm text-[#6B5744]">Add different ticket tiers and pricing</p>
                    </div>
                    <WarmButton size="sm" onClick={addTicketType}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Ticket
                    </WarmButton>
                  </div>

                  <div className="space-y-4">
                    {ticketTypes.map((ticket, index) => (
                      <WarmCard key={ticket.id} padding="lg" className="bg-[#FFF9ED]">
                        <div className="flex items-start justify-between mb-4">
                          <h4 className="font-semibold text-[#2D2721]">Ticket Type {index + 1}</h4>
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
                              Ticket Name <span className="text-[#E17B5C]">*</span>
                            </Label>
                            <Input
                              placeholder="e.g., Early Bird, VIP, General Admission"
                              value={ticket.name}
                              onChange={(e) => updateTicketType(ticket.id, 'name', e.target.value)}
                              className="rounded-[12px] border-[rgba(139,115,85,0.2)] bg-white h-12"
                            />
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="space-y-2">
                              <Label className="text-[#2D2721] font-medium">
                                Price (€) <span className="text-[#E17B5C]">*</span>
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
                                Original Price (€)
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
                                Quantity <span className="text-[#E17B5C]">*</span>
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
                              Description
                            </Label>
                            <Textarea
                              placeholder="What's included with this ticket..."
                              value={ticket.description}
                              onChange={(e) => updateTicketType(ticket.id, 'description', e.target.value)}
                              className="rounded-[12px] border-[rgba(139,115,85,0.2)] bg-white min-h-[60px]"
                            />
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label className="text-[#2D2721] font-medium">
                                Sales Start Date
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
                                Sales End Date
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
                                <span className="text-[#8B7355]">Potential Revenue:</span>
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
                      <h3 className="text-lg font-semibold text-[#2D2721] mb-4">Ticket Settings</h3>
                      
                      <div className="space-y-3">
                        <label className="flex items-center justify-between p-4 bg-[#FFF9ED] rounded-lg cursor-pointer hover:bg-[#FFE5B4] transition-colors">
                          <div>
                            <div className="font-medium text-[#2D2721]">Show Attendees Count</div>
                            <div className="text-xs text-[#8B7355]">Display how many people are attending</div>
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
                            <div className="font-medium text-[#2D2721]">Allow Waitlist</div>
                            <div className="text-xs text-[#8B7355]">Let people join waitlist when sold out</div>
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
                            <div className="font-medium text-[#2D2721]">Require Approval</div>
                            <div className="text-xs text-[#8B7355]">Manually approve each ticket purchase</div>
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
                        Max Tickets Per Order
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
                        Min Tickets Per Order
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
                        Refund Policy
                      </Label>
                      <select
                        id="refundPolicy"
                        value={settings.refundPolicy}
                        onChange={(e) => setSettings({ ...settings, refundPolicy: e.target.value })}
                        className="w-full rounded-[12px] border border-[rgba(139,115,85,0.2)] bg-white h-12 px-4 text-[#2D2721]"
                      >
                        <option value="No refunds">No refunds</option>
                        <option value="7 days before">Refund up to 7 days before</option>
                        <option value="14 days before">Refund up to 14 days before</option>
                        <option value="30 days before">Refund up to 30 days before</option>
                        <option value="Anytime">Refund anytime</option>
                      </select>
                    </div>

                    {/* Stripe Payment Settings */}
                    <div className="pt-6 border-t border-[rgba(139,115,85,0.1)]">
                      <h3 className="text-lg font-semibold text-[#2D2721] mb-4">Payment Settings</h3>
                      
                      <div className="bg-gradient-to-br from-[#E8F5E9] to-[#F1F8E9] rounded-[16px] p-6 mb-4">
                        <div className="flex items-start gap-3 mb-4">
                          <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center flex-shrink-0">
                            <CreditCard className="h-5 w-5 text-[#9DB5A5]" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-[#2D2721] mb-1">Stripe Payments</h4>
                            <p className="text-sm text-[#6B5744]">
                              Secure payment processing powered by Stripe. Customers pay with credit card, and funds are automatically transferred to your account.
                            </p>
                          </div>
                        </div>
                        
                        <div className="bg-white rounded-lg p-4 space-y-3">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-[#8B7355]">Platform Fee:</span>
                            <span className="font-semibold text-[#2D2721]">6% per ticket</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-[#8B7355]">Stripe Processing Fee:</span>
                            <span className="font-semibold text-[#2D2721]">~2.9% + €0.25</span>
                          </div>
                          <div className="pt-3 border-t border-[rgba(139,115,85,0.1)]">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-[#8B7355]">Your Estimated Revenue:</span>
                              <span className="text-lg font-bold text-[#2D2721]">
                                <CurrencyDisplay amount={totalRevenue * 0.94} currency="EUR" />
                              </span>
                            </div>
                            <p className="text-xs text-[#8B7355] mt-1">Based on {totalRevenue > 0 ? <CurrencyDisplay amount={totalRevenue} currency="EUR" /> : '€0.00'} potential revenue (excl. Stripe fees)</p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="stripeAccountId" className="text-[#2D2721] font-medium">
                          Stripe Account ID (Optional)
                        </Label>
                        <Input
                          id="stripeAccountId"
                          placeholder="acct_1234567890"
                          value={settings.stripeAccountId}
                          onChange={(e) => setSettings({ ...settings, stripeAccountId: e.target.value })}
                          className="rounded-[12px] border-[rgba(139,115,85,0.2)] bg-white h-12"
                        />
                        <p className="text-xs text-[#8B7355]">
                          Connect your Stripe account for direct payouts. Leave empty to use platform default.
                        </p>
                      </div>
                    </div>

                    {/* Social Media Links */}
                    <div className="pt-6 border-t border-[rgba(139,115,85,0.1)]">
                      <h3 className="text-lg font-semibold text-[#2D2721] mb-4">Social Media Links</h3>
                      
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
                      <h3 className="text-lg font-semibold text-[#2D2721] mb-4">Additional Information</h3>
                      
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <Label className="text-[#2D2721] font-medium">
                            Accessibility Info
                          </Label>
                          <Textarea
                            placeholder="Information about accessibility features..."
                            value={settings.accessibilityInfo}
                            onChange={(e) => setSettings({ ...settings, accessibilityInfo: e.target.value })}
                            className="rounded-[12px] border-[rgba(139,115,85,0.2)] bg-white min-h-[60px]"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[#2D2721] font-medium">
                            Special Instructions
                          </Label>
                          <Textarea
                            placeholder="Any special instructions for attendees..."
                            value={settings.specialInstructions}
                            onChange={(e) => setSettings({ ...settings, specialInstructions: e.target.value })}
                            className="rounded-[12px] border-[rgba(139,115,85,0.2)] bg-white min-h-[60px]"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[#2D2721] font-medium">
                            Age Restriction
                          </Label>
                          <Input
                            type="text"
                            placeholder="e.g., 18+"
                            value={settings.ageRestriction}
                            onChange={(e) => setSettings({ ...settings, ageRestriction: e.target.value })}
                            className="rounded-[12px] border-[rgba(139,115,85,0.2)] bg-white h-12"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[#2D2721] font-medium">
                            Dress Code
                          </Label>
                          <Input
                            type="text"
                            placeholder="e.g., Formal, Casual"
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
                {currentStep === 1 ? 'Cancel' : 'Back'}
              </WarmButton>
              <WarmButton onClick={handleNext}>
                {currentStep === 3 ? 'Create Event' : 'Next'}
                {currentStep < 3 && <ArrowRight className="h-5 w-5 ml-2" />}
              </WarmButton>
            </div>
          </WarmCard>
        </div>

        {/* Preview Section */}
        <div className="lg:col-span-1">
          <div className="sticky top-6">
            <WarmCard padding="lg">
              <h3 className="text-lg font-semibold text-[#2D2721] mb-4">Preview</h3>
              
              {imagePreview && (
                <img
                  src={imagePreview}
                  alt="Event preview"
                  className="w-full h-32 object-cover rounded-lg mb-4"
                />
              )}

              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-[#8B7355]">Event Name:</span>
                  <p className="font-medium text-[#2D2721]">{formData.name || 'Not set'}</p>
                </div>
                <div>
                  <span className="text-[#8B7355]">Date & Time:</span>
                  <p className="font-medium text-[#2D2721]">
                    {formData.date && formData.time ? `${formData.date} at ${formData.time}` : 'Not set'}
                  </p>
                </div>
                <div>
                  <span className="text-[#8B7355]">Location:</span>
                  <p className="font-medium text-[#2D2721]">{formData.location || 'Not set'}</p>
                </div>
                <div>
                  <span className="text-[#8B7355]">Ticket Types:</span>
                  <p className="font-medium text-[#2D2721]">{ticketTypes.length}</p>
                </div>
                <div>
                  <span className="text-[#8B7355]">Total Capacity:</span>
                  <p className="font-medium text-[#2D2721]">
                    {ticketTypes.reduce((sum, t) => sum + (parseInt(t.quantity) || 0), 0)} tickets
                  </p>
                </div>
                <div className="pt-3 border-t border-[rgba(139,115,85,0.1)]">
                  <span className="text-[#8B7355]">Potential Revenue:</span>
                  <p className="text-lg font-bold text-[#2D2721]">
                    <CurrencyDisplay amount={totalRevenue} currency="EUR" />
                  </p>
                  <p className="text-xs text-[#8B7355] mt-1">
                    After 6% fee: <CurrencyDisplay amount={totalRevenue * 0.94} currency="EUR" />
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