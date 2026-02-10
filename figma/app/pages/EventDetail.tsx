import { useState } from 'react';
import { WarmCard } from '@app/components/WarmCard';
import { WarmButton } from '@app/components/WarmButton';
import { useParams, useNavigate } from '@/lib/router-shim';
import { 
  Calendar,
  Clock,
  MapPin,
  Users,
  Ticket,
  Share2,
  ArrowLeft,
  Edit,
  Trash2,
  Download,
  TrendingUp,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Mail,
  QrCode,
  BarChart3,
  FileText,
  Phone,
  Globe,
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  Video,
  Info,
  Accessibility
} from 'lucide-react';
import { CurrencyDisplay } from '@app/components/CurrencyDisplay';
import { toast } from 'sonner';
import { copyToClipboard } from '@app/utils/clipboard';
import { useLanguage } from '@app/contexts/LanguageContext';

type EventStatus = 'upcoming' | 'ongoing' | 'ended' | 'cancelled';

type TicketType = {
  name: string;
  price: number;
  currency: 'EUR';
  sold: number;
  total: number;
  revenue: number;
};

type Attendee = {
  id: string;
  name: string;
  email: string;
  ticketType: string;
  purchaseDate: string;
  checkInDate: string | null;
  status: 'confirmed' | 'pending' | 'cancelled';
};

export function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [activeTab, setActiveTab] = useState<'overview' | 'attendees' | 'analytics'>('overview');
  const tr = (en: string, et: string) => (language === 'et' ? et : en);

  // Mock event data
  const event = {
    id: 'evt-1',
    name: 'Summer Music Festival 2024',
    date: '2024-07-15',
    time: '18:00',
    endTime: '23:00',
    location: 'Stockholm Arena',
    venue: 'Stockholm Arena',
    city: 'Stockholm',
    country: 'Sweden',
    description: 'The biggest music festival of the year featuring top artists from around Europe',
    longDescription: `Experience an unforgettable weekend of music, food, and entertainment at the Summer Music Festival 2024.

- World-class lineup featuring 50+ artists
- Gourmet food trucks and local vendors
- Art installations and interactive experiences
- VIP areas with exclusive amenities

Don't miss out on the event of the summer!`,
    status: 'upcoming' as EventStatus,
    category: 'music',
    image: null,
    ticketTypes: [
      { name: 'Early Bird', price: 89, currency: 'EUR' as const, sold: 450, total: 500, revenue: 40050 },
      { name: 'General Admission', price: 120, currency: 'EUR' as const, sold: 280, total: 1000, revenue: 33600 },
      { name: 'VIP Pass', price: 250, currency: 'EUR' as const, sold: 45, total: 100, revenue: 11250 },
    ],
    stats: {
      totalTickets: 1600,
      soldTickets: 775,
      revenue: 84900,
      checkIns: 0,
      viewCount: 2340,
      shareCount: 156,
    },
    settings: {
      showAttendeesCount: true,
      allowWaitlist: true,
      requireApproval: false,
      maxTicketsPerOrder: 10,
      refundPolicy: '7 days before',
      stripeAccountId: '',
      enableStripePayments: true,
      facebookUrl: 'https://facebook.com/summerfest',
      instagramUrl: 'https://instagram.com/summerfest',
      twitterUrl: 'https://twitter.com/summerfest',
      linkedinUrl: '',
      videoUrl: '',
      accessibilityInfo: 'Wheelchair accessible entrance and viewing platforms available.',
      specialInstructions: 'Please arrive 30 minutes early for security check.',
      ageRestriction: '18+',
      dressCode: 'Casual Festival',
    },
    organizer: {
      name: 'Summer Events AB',
      email: 'contact@summerevents.se',
      phone: '+46 70 123 4567',
      website: 'https://summerevents.se',
    },
  };

  const mockAttendees: Attendee[] = [
    {
      id: '1',
      name: 'Anna Kask',
      email: 'anna.kask@example.com',
      ticketType: 'VIP Pass',
      purchaseDate: '2024-01-15',
      checkInDate: null,
      status: 'confirmed',
    },
    {
      id: '2',
      name: 'Jaan Tamm',
      email: 'jaan.tamm@example.com',
      ticketType: 'General Admission',
      purchaseDate: '2024-01-18',
      checkInDate: null,
      status: 'confirmed',
    },
    {
      id: '3',
      name: 'Mari Saar',
      email: 'mari.saar@example.com',
      ticketType: 'Early Bird',
      purchaseDate: '2024-01-10',
      checkInDate: null,
      status: 'confirmed',
    },
  ];

  const getStatusConfig = (status: EventStatus) => {
    switch (status) {
      case 'upcoming':
        return { label: tr('Upcoming', 'Tulemas'), color: 'bg-[#9DB5A5] text-white', icon: Clock };
      case 'ongoing':
        return { label: tr('Live Now', 'Toimub praegu'), color: 'bg-gradient-to-br from-[#FFC857] to-[#FFB627] text-white animate-pulse', icon: CheckCircle2 };
      case 'ended':
        return { label: tr('Ended', 'Loppenud'), color: 'bg-[#8B7355] text-white', icon: CheckCircle2 };
      case 'cancelled':
        return { label: tr('Cancelled', 'Tuhistatud'), color: 'bg-[#E17B5C] text-white', icon: XCircle };
    }
  };

  const statusConfig = getStatusConfig(event.status);
  const StatusIcon = statusConfig.icon;
  const soldPercentage = (event.stats.soldTickets / event.stats.totalTickets) * 100;

  const handleShare = async () => {
    const url = `${window.location.origin}/event/${event.id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: event.name,
          text: tr(`Check out ${event.name}!`, `Vaata ${event.name} uritust!`),
          url: url,
        });
        toast.success(tr('Shared successfully!', 'Jagamine onnestus!'));
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          const success = await copyToClipboard(url);
          if (success) {
            toast.success(tr('Link copied to clipboard!', 'Link kopeeriti loikelauale!'));
          }
        }
      }
    } else {
      const success = await copyToClipboard(url);
      if (success) {
        toast.success(tr('Link copied to clipboard!', 'Link kopeeriti loikelauale!'));
      }
    }
  };

  const handleDelete = () => {
    if (confirm(tr('Are you sure you want to delete this event? This action cannot be undone.', 'Kas oled kindel, et soovid selle urituse kustutada? Seda tegevust ei saa tagasi votta.'))) {
      toast.success(tr('Event deleted successfully', 'Uritus kustutati edukalt'));
      navigate('/events');
    }
  };

  const handleExportAttendees = () => {
    toast.success(tr('Exporting attendee list...', 'Osalejate nimekirja eksportimine...'));
  };

  const tabs = [
    { id: 'overview' as const, label: tr('Overview', 'Ulevaade'), icon: FileText },
    { id: 'attendees' as const, label: tr('Attendees', 'Osalejad'), icon: Users },
    { id: 'analytics' as const, label: tr('Analytics', 'Analyytika'), icon: BarChart3 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <button
          onClick={() => navigate('/events')}
          className="flex items-center gap-2 text-sm text-[#6B5744] hover:text-[#2D2721] mb-4 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          {tr('Back to events', 'Tagasi urituste juurde')}
        </button>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-[#2D2721]">{event.name}</h1>
              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${statusConfig.color}`}>
                <StatusIcon className="h-3 w-3" />
                {statusConfig.label}
              </span>
            </div>
            <p className="text-[#6B5744]">{event.description}</p>
          </div>
          <div className="flex items-center gap-2">
            <WarmButton variant="outline" size="sm" onClick={handleShare}>
              <Share2 className="h-4 w-4 mr-2" />
              {tr('Share', 'Jaga')}
            </WarmButton>
            <WarmButton variant="outline" size="sm" onClick={() => navigate(`/events/create?duplicate=${event.id}`)}>
              <Edit className="h-4 w-4 mr-2" />
              {tr('Edit', 'Muuda')}
            </WarmButton>
            <button
              onClick={handleDelete}
              className="p-2 hover:bg-[#FEE2E2] rounded-lg transition-colors text-[#E17B5C]"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <WarmCard padding="lg" hover>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-[#8B7355] mb-1">{tr('Tickets Sold', 'Muudud piletid')}</p>
              <p className="text-2xl font-bold text-[#2D2721]">
                {event.stats.soldTickets} / {event.stats.totalTickets}
              </p>
              <p className="text-xs text-[#8B7355] mt-1">{Math.round(soldPercentage)}% {tr('sold', 'muudud')}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#FFC857] to-[#FFB627] flex items-center justify-center shadow-warm">
              <Ticket className="h-6 w-6 text-white" />
            </div>
          </div>
        </WarmCard>

        <WarmCard padding="lg" hover>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-[#8B7355] mb-1">{tr('Revenue', 'Kaive')}</p>
              <p className="text-2xl font-bold text-[#2D2721]">
                <CurrencyDisplay amount={event.stats.revenue} currency="EUR" />
              </p>
              <p className="text-xs text-[#8B7355] mt-1">{tr('After fees:', 'Parast tasusid:')} <CurrencyDisplay amount={event.stats.revenue * 0.94} currency="EUR" /></p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#9DB5A5] to-[#7FA090] flex items-center justify-center shadow-warm">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
          </div>
        </WarmCard>

        <WarmCard padding="lg" hover>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-[#8B7355] mb-1">{tr('Page Views', 'Lehevaatamised')}</p>
              <p className="text-2xl font-bold text-[#2D2721]">{event.stats.viewCount.toLocaleString()}</p>
              <p className="text-xs text-[#8B7355] mt-1">{tr('Last 30 days', 'Viimased 30 paeva')}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#E17B5C] to-[#D16B4C] flex items-center justify-center shadow-warm">
              <Users className="h-6 w-6 text-white" />
            </div>
          </div>
        </WarmCard>

        <WarmCard padding="lg" hover>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-[#8B7355] mb-1">{tr('Check-ins', 'Sissepaasud')}</p>
              <p className="text-2xl font-bold text-[#2D2721]">{event.stats.checkIns}</p>
              <p className="text-xs text-[#8B7355] mt-1">
                {event.status === 'upcoming' ? tr('Event not started', 'Uritus pole alanud') : `${event.stats.soldTickets - event.stats.checkIns} ${tr('remaining', 'alles')}`}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#F5C98E] to-[#E5B97E] flex items-center justify-center shadow-warm">
              <CheckCircle2 className="h-6 w-6 text-white" />
            </div>
          </div>
        </WarmCard>
      </div>

      {/* Tabs */}
      <div className="border-b border-[rgba(139,115,85,0.1)]">
        <div className="flex gap-1 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-3 font-medium whitespace-nowrap transition-all border-b-2 ${
                  activeTab === tab.id
                    ? 'border-[#FFC857] text-[#2D2721]'
                    : 'border-transparent text-[#8B7355] hover:text-[#6B5744]'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            <WarmCard padding="lg">
              <h2 className="text-xl font-bold text-[#2D2721] mb-4">{tr('Event Details', 'Urituse detailid')}</h2>
              
              {/* Event Image Placeholder */}
              <div className="w-full h-64 bg-gradient-to-br from-[#FFE5B4] to-[#FFC857] rounded-xl flex items-center justify-center mb-6 overflow-hidden">
                <Calendar className="h-24 w-24 text-white/50" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#FFC857] to-[#FFB627] flex items-center justify-center flex-shrink-0">
                    <Calendar className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <div className="text-sm text-[#8B7355]">{tr('Date', 'Kuupaev')}</div>
                    <div className="font-semibold text-[#2D2721]">{event.date}</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#9DB5A5] to-[#7FA090] flex items-center justify-center flex-shrink-0">
                    <Clock className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <div className="text-sm text-[#8B7355]">{tr('Time', 'Kellaaeg')}</div>
                    <div className="font-semibold text-[#2D2721]">{event.time} - {event.endTime}</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#E17B5C] to-[#D16B4C] flex items-center justify-center flex-shrink-0">
                    <MapPin className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <div className="text-sm text-[#8B7355]">{tr('Location', 'Asukoht')}</div>
                    <div className="font-semibold text-[#2D2721]">{event.venue}</div>
                    <div className="text-sm text-[#6B5744]">{event.city}, {event.country}</div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-[rgba(139,115,85,0.1)]">
                <h3 className="font-semibold text-[#2D2721] mb-2">{tr('About This Event', 'Urituse kirjeldus')}</h3>
                <p className="text-[#6B5744] whitespace-pre-line">{event.longDescription}</p>
              </div>

              {/* Organizer & Contact */}
              <div className="pt-4 border-t border-[rgba(139,115,85,0.1)]">
                <h3 className="font-semibold text-[#2D2721] mb-4">{tr('Organizer & Contact', 'Korraldaja ja kontakt')}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {event.organizer.name && (
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-[#FFF9ED] text-[#FFC857]">
                        <Users className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="text-sm text-[#8B7355]">{tr('Organizer', 'Korraldaja')}</div>
                        <div className="font-medium text-[#2D2721]">{event.organizer.name}</div>
                      </div>
                    </div>
                  )}
                  {event.organizer.email && (
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-[#FFF9ED] text-[#FFC857]">
                        <Mail className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="text-sm text-[#8B7355]">{tr('Email', 'E-post')}</div>
                        <a href={`mailto:${event.organizer.email}`} className="font-medium text-[#2D2721] hover:text-[#E17B5C] transition-colors">
                          {event.organizer.email}
                        </a>
                      </div>
                    </div>
                  )}
                  {event.organizer.phone && (
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-[#FFF9ED] text-[#FFC857]">
                        <Phone className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="text-sm text-[#8B7355]">{tr('Phone', 'Telefon')}</div>
                        <a href={`tel:${event.organizer.phone}`} className="font-medium text-[#2D2721] hover:text-[#E17B5C] transition-colors">
                          {event.organizer.phone}
                        </a>
                      </div>
                    </div>
                  )}
                  {event.organizer.website && (
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-[#FFF9ED] text-[#FFC857]">
                        <Globe className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="text-sm text-[#8B7355]">{tr('Website', 'Veebileht')}</div>
                        <a href={event.organizer.website} target="_blank" rel="noopener noreferrer" className="font-medium text-[#2D2721] hover:text-[#E17B5C] transition-colors">
                          {tr('Visit Website', 'Ava veebileht')}
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Social Media */}
              {(event.settings.facebookUrl || event.settings.instagramUrl || event.settings.twitterUrl || event.settings.linkedinUrl || event.settings.videoUrl) && (
                <div className="pt-4 border-t border-[rgba(139,115,85,0.1)]">
                  <h3 className="font-semibold text-[#2D2721] mb-4">{tr('Social Media', 'Sotsiaalmeedia')}</h3>
                  <div className="flex flex-wrap gap-4">
                    {event.settings.facebookUrl && (
                      <a href={event.settings.facebookUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 bg-[#F2EDE3] rounded-lg text-[#3B5998] hover:bg-[#E7DCC7] transition-colors">
                        <Facebook className="h-5 w-5" />
                        <span className="font-medium">Facebook</span>
                      </a>
                    )}
                    {event.settings.instagramUrl && (
                      <a href={event.settings.instagramUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 bg-[#F2EDE3] rounded-lg text-[#E1306C] hover:bg-[#E7DCC7] transition-colors">
                        <Instagram className="h-5 w-5" />
                        <span className="font-medium">Instagram</span>
                      </a>
                    )}
                    {event.settings.twitterUrl && (
                      <a href={event.settings.twitterUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 bg-[#F2EDE3] rounded-lg text-[#1DA1F2] hover:bg-[#E7DCC7] transition-colors">
                        <Twitter className="h-5 w-5" />
                        <span className="font-medium">{tr('Twitter', 'X / Twitter')}</span>
                      </a>
                    )}
                    {event.settings.linkedinUrl && (
                      <a href={event.settings.linkedinUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 bg-[#F2EDE3] rounded-lg text-[#0077B5] hover:bg-[#E7DCC7] transition-colors">
                        <Linkedin className="h-5 w-5" />
                        <span className="font-medium">LinkedIn</span>
                      </a>
                    )}
                    {event.settings.videoUrl && (
                      <a href={event.settings.videoUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 bg-[#F2EDE3] rounded-lg text-[#FF0000] hover:bg-[#E7DCC7] transition-colors">
                        <Video className="h-5 w-5" />
                        <span className="font-medium">{tr('Video', 'Video')}</span>
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Additional Information */}
              {(event.settings.accessibilityInfo || event.settings.specialInstructions || event.settings.ageRestriction || event.settings.dressCode) && (
                <div className="pt-4 border-t border-[rgba(139,115,85,0.1)]">
                  <h3 className="font-semibold text-[#2D2721] mb-4">{tr('Additional Information', 'Lisainfo')}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {event.settings.accessibilityInfo && (
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-[#E8F5E9] text-[#9DB5A5]">
                          <Accessibility className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="text-sm text-[#8B7355]">{tr('Accessibility', 'Ligipaasetavus')}</div>
                          <div className="text-sm text-[#2D2721]">{event.settings.accessibilityInfo}</div>
                        </div>
                      </div>
                    )}
                    {event.settings.specialInstructions && (
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-[#E8F5E9] text-[#9DB5A5]">
                          <Info className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="text-sm text-[#8B7355]">{tr('Special Instructions', 'Erijuhised')}</div>
                          <div className="text-sm text-[#2D2721]">{event.settings.specialInstructions}</div>
                        </div>
                      </div>
                    )}
                    {event.settings.ageRestriction && (
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-[#E8F5E9] text-[#9DB5A5]">
                          <Users className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="text-sm text-[#8B7355]">{tr('Age Restriction', 'Vanusepiirang')}</div>
                          <div className="font-medium text-[#2D2721]">{event.settings.ageRestriction}</div>
                        </div>
                      </div>
                    )}
                    {event.settings.dressCode && (
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-[#E8F5E9] text-[#9DB5A5]">
                          <Info className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="text-sm text-[#8B7355]">{tr('Dress Code', 'Riietusstiil')}</div>
                          <div className="font-medium text-[#2D2721]">{event.settings.dressCode}</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </WarmCard>

            {/* Ticket Types */}
            <WarmCard padding="lg">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-[#2D2721]">{tr('Ticket Types', 'Piletituubid')}</h2>
                <span className="text-sm text-[#8B7355]">{event.ticketTypes.length} {tr('types', 'tuupi')}</span>
              </div>
              
              <div className="space-y-3">
                {event.ticketTypes.map((ticket, idx) => {
                  const ticketSoldPercentage = (ticket.sold / ticket.total) * 100;
                  return (
                    <div key={idx} className="p-4 bg-[#FFF9ED] rounded-xl">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-[#2D2721]">{ticket.name}</h3>
                          <p className="text-sm text-[#8B7355]">{ticket.sold} / {ticket.total} {tr('sold', 'muudud')} ({Math.round(ticketSoldPercentage)}%)</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-[#2D2721]">
                            <CurrencyDisplay amount={ticket.price} currency={ticket.currency} />
                          </p>
                          <p className="text-xs text-[#8B7355]">
                            <CurrencyDisplay amount={ticket.revenue} currency={ticket.currency} /> {tr('revenue', 'kaivet')}
                          </p>
                        </div>
                      </div>
                      <div className="h-2 bg-[#F2EDE3] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#9DB5A5] to-[#7FA090] transition-all"
                          style={{ width: `${ticketSoldPercentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </WarmCard>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <WarmCard padding="lg">
              <h3 className="font-semibold text-[#2D2721] mb-4">{tr('Quick Actions', 'Kiirtoimingud')}</h3>
              <div className="space-y-2">
                <WarmButton fullWidth variant="outline" onClick={() => navigate(`/redeem?event=${event.id}`)}>
                  <QrCode className="h-4 w-4 mr-2" />
                  {tr('Scan Tickets', 'Skaneeri pileteid')}
                </WarmButton>
                <WarmButton fullWidth variant="outline" onClick={() => window.open(`/event/${event.id}`, '_blank')}>
                  <Share2 className="h-4 w-4 mr-2" />
                  {tr('View Public Page', 'Ava avalik leht')}
                </WarmButton>
                <WarmButton fullWidth variant="outline" onClick={handleExportAttendees}>
                  <Download className="h-4 w-4 mr-2" />
                  {tr('Export Attendees', 'Ekspordi osalejad')}
                </WarmButton>
              </div>
            </WarmCard>

            <WarmCard padding="lg">
              <h3 className="font-semibold text-[#2D2721] mb-4">{tr('Settings', 'Seaded')}</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-[#8B7355]">{tr('Show Attendees Count', 'Nae osalejate arvu')}</span>
                  <span className="font-medium text-[#2D2721]">{event.settings.showAttendeesCount ? tr('Yes', 'Jah') : tr('No', 'Ei')}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#8B7355]">{tr('Allow Waitlist', 'Luba ootejarjekord')}</span>
                  <span className="font-medium text-[#2D2721]">{event.settings.allowWaitlist ? tr('Yes', 'Jah') : tr('No', 'Ei')}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#8B7355]">{tr('Require Approval', 'Nua kinnitamist')}</span>
                  <span className="font-medium text-[#2D2721]">{event.settings.requireApproval ? tr('Yes', 'Jah') : tr('No', 'Ei')}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#8B7355]">{tr('Max Tickets/Order', 'Maks pileteid tellimusel')}</span>
                  <span className="font-medium text-[#2D2721]">{event.settings.maxTicketsPerOrder}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#8B7355]">{tr('Refund Policy', 'Tagastuspoliitika')}</span>
                  <span className="font-medium text-[#2D2721]">{event.settings.refundPolicy}</span>
                </div>
              </div>
            </WarmCard>
          </div>
        </div>
      )}

      {activeTab === 'attendees' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-[#2D2721]">{tr('Attendees', 'Osalejad')}</h2>
              <p className="text-sm text-[#8B7355] mt-1">{mockAttendees.length} {tr('attendees', 'osalejat')}</p>
            </div>
            <WarmButton onClick={handleExportAttendees}>
              <Download className="h-4 w-4 mr-2" />
              {tr('Export List', 'Ekspordi nimekiri')}
            </WarmButton>
          </div>

          <WarmCard padding="lg">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[rgba(139,115,85,0.1)]">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-[#2D2721]">{tr('Name', 'Nimi')}</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-[#2D2721]">{tr('Email', 'E-post')}</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-[#2D2721]">{tr('Ticket Type', 'Piletituup')}</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-[#2D2721]">{tr('Purchase Date', 'Ostukuupaev')}</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-[#2D2721]">{tr('Status', 'Staatus')}</th>
                  </tr>
                </thead>
                <tbody>
                  {mockAttendees.map((attendee) => (
                    <tr key={attendee.id} className="border-b border-[rgba(139,115,85,0.05)]">
                      <td className="py-3 px-4 text-sm text-[#2D2721] font-medium">{attendee.name}</td>
                      <td className="py-3 px-4 text-sm text-[#6B5744]">{attendee.email}</td>
                      <td className="py-3 px-4 text-sm text-[#6B5744]">{attendee.ticketType}</td>
                      <td className="py-3 px-4 text-sm text-[#6B5744]">{attendee.purchaseDate}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
                          attendee.status === 'confirmed' ? 'bg-[#E8F5E9] text-[#9DB5A5]' :
                          attendee.status === 'pending' ? 'bg-[#FFF9ED] text-[#FFC857]' :
                          'bg-[#FEE2E2] text-[#E17B5C]'
                        }`}>
                          {attendee.status === 'confirmed' && <CheckCircle2 className="h-3 w-3" />}
                          {attendee.status === 'pending' && <AlertCircle className="h-3 w-3" />}
                          {attendee.status === 'cancelled' && <XCircle className="h-3 w-3" />}
                          {attendee.status === 'confirmed'
                            ? tr('Confirmed', 'Kinnitatud')
                            : attendee.status === 'pending'
                            ? tr('Pending', 'Ootel')
                            : tr('Cancelled', 'Tuhistatud')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </WarmCard>
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <WarmCard padding="lg">
            <h2 className="text-2xl font-bold text-[#2D2721] mb-6">{tr('Event Analytics', 'Urituse analyytika')}</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 bg-[#FFF9ED] rounded-xl">
                <h3 className="font-semibold text-[#2D2721] mb-4">{tr('Sales Progress', 'Muugiedu')}</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#8B7355]">{tr('Target', 'Eesmark')}</span>
                    <span className="font-semibold text-[#2D2721]">{event.stats.totalTickets} {tr('tickets', 'piletit')}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#8B7355]">{tr('Sold', 'Muudud')}</span>
                    <span className="font-semibold text-[#2D2721]">{event.stats.soldTickets} {tr('tickets', 'piletit')}</span>
                  </div>
                  <div className="h-4 bg-[#F2EDE3] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#FFC857] to-[#FFB627] transition-all"
                      style={{ width: `${soldPercentage}%` }}
                    />
                  </div>
                  <p className="text-xs text-[#8B7355]">{Math.round(soldPercentage)}% {tr('of target reached', 'eesmargist saavutatud')}</p>
                </div>
              </div>

              <div className="p-6 bg-[#E8F5E9] rounded-xl">
                <h3 className="font-semibold text-[#2D2721] mb-4">{tr('Revenue Breakdown', 'Kaibe jaotus')}</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#6B5744]">{tr('Gross Revenue', 'Brutokaive')}</span>
                    <span className="font-semibold text-[#2D2721]">
                      <CurrencyDisplay amount={event.stats.revenue} currency="EUR" />
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#6B5744]">{tr('Platform Fee (6%)', 'Platvormi tasu (6%)')}</span>
                    <span className="font-semibold text-[#E17B5C]">
                      -<CurrencyDisplay amount={event.stats.revenue * 0.06} currency="EUR" />
                    </span>
                  </div>
                  <div className="pt-2 border-t border-[rgba(139,115,85,0.1)]">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-[#2D2721]">{tr('Net Revenue', 'Netokaive')}</span>
                      <span className="text-lg font-bold text-[#9DB5A5]">
                        <CurrencyDisplay amount={event.stats.revenue * 0.94} currency="EUR" />
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 p-6 bg-gradient-to-br from-[#FFF9ED] to-[#FFFBF5] rounded-xl">
              <h3 className="font-semibold text-[#2D2721] mb-4">{tr('Engagement Metrics', 'Kaasatuse mootdikud')}</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-[#8B7355] mb-1">{tr('Page Views', 'Lehevaatamised')}</p>
                  <p className="text-2xl font-bold text-[#2D2721]">{event.stats.viewCount.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-[#8B7355] mb-1">{tr('Shares', 'Jagamised')}</p>
                  <p className="text-2xl font-bold text-[#2D2721]">{event.stats.shareCount}</p>
                </div>
                <div>
                  <p className="text-sm text-[#8B7355] mb-1">{tr('Conversion Rate', 'Konversioon')}</p>
                  <p className="text-2xl font-bold text-[#2D2721]">
                    {((event.stats.soldTickets / event.stats.viewCount) * 100).toFixed(1)}%
                  </p>
                </div>
                <div>
                  <p className="text-sm text-[#8B7355] mb-1">{tr('Avg. Ticket Value', 'Keskmine piletivaartus')}</p>
                  <p className="text-2xl font-bold text-[#2D2721]">
                    <CurrencyDisplay amount={event.stats.revenue / event.stats.soldTickets} currency="EUR" />
                  </p>
                </div>
              </div>
            </div>
          </WarmCard>
        </div>
      )}
    </div>
  );
}


