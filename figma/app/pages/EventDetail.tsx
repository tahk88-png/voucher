import { useState } from 'react';
import { WarmCard } from '@/figma/app/components/WarmCard';
import { WarmButton } from '@/figma/app/components/WarmButton';
import { useParams, useNavigate } from 'react-router-dom';
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
import { CurrencyDisplay } from '@/figma/app/components/CurrencyDisplay';
import { toast } from 'sonner';
import { copyToClipboard } from '@/figma/app/utils/clipboard';

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
  const [activeTab, setActiveTab] = useState<'overview' | 'attendees' | 'analytics'>('overview');

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

🎵 World-class lineup featuring 50+ artists
🍔 Gourmet food trucks and local vendors
🎨 Art installations and interactive experiences
🌟 VIP areas with exclusive amenities

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
        return { label: 'Upcoming', color: 'bg-[#9DB5A5] text-white', icon: Clock };
      case 'ongoing':
        return { label: 'Live Now', color: 'bg-gradient-to-br from-[#FFC857] to-[#FFB627] text-white animate-pulse', icon: CheckCircle2 };
      case 'ended':
        return { label: 'Ended', color: 'bg-[#8B7355] text-white', icon: CheckCircle2 };
      case 'cancelled':
        return { label: 'Cancelled', color: 'bg-[#E17B5C] text-white', icon: XCircle };
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
          text: `Check out ${event.name}!`,
          url: url,
        });
        toast.success('Shared successfully!');
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          const success = await copyToClipboard(url);
          if (success) {
            toast.success('Link copied to clipboard!');
          }
        }
      }
    } else {
      const success = await copyToClipboard(url);
      if (success) {
        toast.success('Link copied to clipboard!');
      }
    }
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      toast.success('Event deleted successfully');
      navigate('/events');
    }
  };

  const handleExportAttendees = () => {
    toast.success('Exporting attendee list...');
  };

  const tabs = [
    { id: 'overview' as const, label: 'Overview', icon: FileText },
    { id: 'attendees' as const, label: 'Attendees', icon: Users },
    { id: 'analytics' as const, label: 'Analytics', icon: BarChart3 },
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
          Back to events
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
              Share
            </WarmButton>
            <WarmButton variant="outline" size="sm" onClick={() => navigate(`/events/create?duplicate=${event.id}`)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
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
              <p className="text-sm text-[#8B7355] mb-1">Tickets Sold</p>
              <p className="text-2xl font-bold text-[#2D2721]">
                {event.stats.soldTickets} / {event.stats.totalTickets}
              </p>
              <p className="text-xs text-[#8B7355] mt-1">{Math.round(soldPercentage)}% sold</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#FFC857] to-[#FFB627] flex items-center justify-center shadow-warm">
              <Ticket className="h-6 w-6 text-white" />
            </div>
          </div>
        </WarmCard>

        <WarmCard padding="lg" hover>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-[#8B7355] mb-1">Revenue</p>
              <p className="text-2xl font-bold text-[#2D2721]">
                <CurrencyDisplay amount={event.stats.revenue} currency="EUR" />
              </p>
              <p className="text-xs text-[#8B7355] mt-1">After fees: <CurrencyDisplay amount={event.stats.revenue * 0.94} currency="EUR" /></p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#9DB5A5] to-[#7FA090] flex items-center justify-center shadow-warm">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
          </div>
        </WarmCard>

        <WarmCard padding="lg" hover>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-[#8B7355] mb-1">Page Views</p>
              <p className="text-2xl font-bold text-[#2D2721]">{event.stats.viewCount.toLocaleString()}</p>
              <p className="text-xs text-[#8B7355] mt-1">Last 30 days</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#E17B5C] to-[#D16B4C] flex items-center justify-center shadow-warm">
              <Users className="h-6 w-6 text-white" />
            </div>
          </div>
        </WarmCard>

        <WarmCard padding="lg" hover>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-[#8B7355] mb-1">Check-ins</p>
              <p className="text-2xl font-bold text-[#2D2721]">{event.stats.checkIns}</p>
              <p className="text-xs text-[#8B7355] mt-1">
                {event.status === 'upcoming' ? 'Event not started' : `${event.stats.soldTickets - event.stats.checkIns} remaining`}
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
              <h2 className="text-xl font-bold text-[#2D2721] mb-4">Event Details</h2>
              
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
                    <div className="text-sm text-[#8B7355]">Date</div>
                    <div className="font-semibold text-[#2D2721]">{event.date}</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#9DB5A5] to-[#7FA090] flex items-center justify-center flex-shrink-0">
                    <Clock className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <div className="text-sm text-[#8B7355]">Time</div>
                    <div className="font-semibold text-[#2D2721]">{event.time} - {event.endTime}</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#E17B5C] to-[#D16B4C] flex items-center justify-center flex-shrink-0">
                    <MapPin className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <div className="text-sm text-[#8B7355]">Location</div>
                    <div className="font-semibold text-[#2D2721]">{event.venue}</div>
                    <div className="text-sm text-[#6B5744]">{event.city}, {event.country}</div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-[rgba(139,115,85,0.1)]">
                <h3 className="font-semibold text-[#2D2721] mb-2">About This Event</h3>
                <p className="text-[#6B5744] whitespace-pre-line">{event.longDescription}</p>
              </div>

              {/* Organizer & Contact */}
              <div className="pt-4 border-t border-[rgba(139,115,85,0.1)]">
                <h3 className="font-semibold text-[#2D2721] mb-4">Organizer & Contact</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {event.organizer.name && (
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-[#FFF9ED] text-[#FFC857]">
                        <Users className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="text-sm text-[#8B7355]">Organizer</div>
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
                        <div className="text-sm text-[#8B7355]">Email</div>
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
                        <div className="text-sm text-[#8B7355]">Phone</div>
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
                        <div className="text-sm text-[#8B7355]">Website</div>
                        <a href={event.organizer.website} target="_blank" rel="noopener noreferrer" className="font-medium text-[#2D2721] hover:text-[#E17B5C] transition-colors">
                          Visit Website
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Social Media */}
              {(event.settings.facebookUrl || event.settings.instagramUrl || event.settings.twitterUrl || event.settings.linkedinUrl || event.settings.videoUrl) && (
                <div className="pt-4 border-t border-[rgba(139,115,85,0.1)]">
                  <h3 className="font-semibold text-[#2D2721] mb-4">Social Media</h3>
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
                        <span className="font-medium">Twitter</span>
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
                        <span className="font-medium">Video</span>
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Additional Information */}
              {(event.settings.accessibilityInfo || event.settings.specialInstructions || event.settings.ageRestriction || event.settings.dressCode) && (
                <div className="pt-4 border-t border-[rgba(139,115,85,0.1)]">
                  <h3 className="font-semibold text-[#2D2721] mb-4">Additional Information</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {event.settings.accessibilityInfo && (
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-[#E8F5E9] text-[#9DB5A5]">
                          <Accessibility className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="text-sm text-[#8B7355]">Accessibility</div>
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
                          <div className="text-sm text-[#8B7355]">Special Instructions</div>
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
                          <div className="text-sm text-[#8B7355]">Age Restriction</div>
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
                          <div className="text-sm text-[#8B7355]">Dress Code</div>
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
                <h2 className="text-xl font-bold text-[#2D2721]">Ticket Types</h2>
                <span className="text-sm text-[#8B7355]">{event.ticketTypes.length} types</span>
              </div>
              
              <div className="space-y-3">
                {event.ticketTypes.map((ticket, idx) => {
                  const ticketSoldPercentage = (ticket.sold / ticket.total) * 100;
                  return (
                    <div key={idx} className="p-4 bg-[#FFF9ED] rounded-xl">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-[#2D2721]">{ticket.name}</h3>
                          <p className="text-sm text-[#8B7355]">{ticket.sold} / {ticket.total} sold ({Math.round(ticketSoldPercentage)}%)</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-[#2D2721]">
                            <CurrencyDisplay amount={ticket.price} currency={ticket.currency} />
                          </p>
                          <p className="text-xs text-[#8B7355]">
                            <CurrencyDisplay amount={ticket.revenue} currency={ticket.currency} /> revenue
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
              <h3 className="font-semibold text-[#2D2721] mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <WarmButton fullWidth variant="outline" onClick={() => navigate(`/redeem?event=${event.id}`)}>
                  <QrCode className="h-4 w-4 mr-2" />
                  Scan Tickets
                </WarmButton>
                <WarmButton fullWidth variant="outline" onClick={() => window.open(`/event/${event.id}`, '_blank')}>
                  <Share2 className="h-4 w-4 mr-2" />
                  View Public Page
                </WarmButton>
                <WarmButton fullWidth variant="outline" onClick={handleExportAttendees}>
                  <Download className="h-4 w-4 mr-2" />
                  Export Attendees
                </WarmButton>
              </div>
            </WarmCard>

            <WarmCard padding="lg">
              <h3 className="font-semibold text-[#2D2721] mb-4">Settings</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-[#8B7355]">Show Attendees Count</span>
                  <span className="font-medium text-[#2D2721]">{event.settings.showAttendeesCount ? 'Yes' : 'No'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#8B7355]">Allow Waitlist</span>
                  <span className="font-medium text-[#2D2721]">{event.settings.allowWaitlist ? 'Yes' : 'No'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#8B7355]">Require Approval</span>
                  <span className="font-medium text-[#2D2721]">{event.settings.requireApproval ? 'Yes' : 'No'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#8B7355]">Max Tickets/Order</span>
                  <span className="font-medium text-[#2D2721]">{event.settings.maxTicketsPerOrder}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#8B7355]">Refund Policy</span>
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
              <h2 className="text-2xl font-bold text-[#2D2721]">Attendees</h2>
              <p className="text-sm text-[#8B7355] mt-1">{mockAttendees.length} attendees</p>
            </div>
            <WarmButton onClick={handleExportAttendees}>
              <Download className="h-4 w-4 mr-2" />
              Export List
            </WarmButton>
          </div>

          <WarmCard padding="lg">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[rgba(139,115,85,0.1)]">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-[#2D2721]">Name</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-[#2D2721]">Email</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-[#2D2721]">Ticket Type</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-[#2D2721]">Purchase Date</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-[#2D2721]">Status</th>
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
                          {attendee.status.charAt(0).toUpperCase() + attendee.status.slice(1)}
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
            <h2 className="text-2xl font-bold text-[#2D2721] mb-6">Event Analytics</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 bg-[#FFF9ED] rounded-xl">
                <h3 className="font-semibold text-[#2D2721] mb-4">Sales Progress</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#8B7355]">Target</span>
                    <span className="font-semibold text-[#2D2721]">{event.stats.totalTickets} tickets</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#8B7355]">Sold</span>
                    <span className="font-semibold text-[#2D2721]">{event.stats.soldTickets} tickets</span>
                  </div>
                  <div className="h-4 bg-[#F2EDE3] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#FFC857] to-[#FFB627] transition-all"
                      style={{ width: `${soldPercentage}%` }}
                    />
                  </div>
                  <p className="text-xs text-[#8B7355]">{Math.round(soldPercentage)}% of target reached</p>
                </div>
              </div>

              <div className="p-6 bg-[#E8F5E9] rounded-xl">
                <h3 className="font-semibold text-[#2D2721] mb-4">Revenue Breakdown</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#6B5744]">Gross Revenue</span>
                    <span className="font-semibold text-[#2D2721]">
                      <CurrencyDisplay amount={event.stats.revenue} currency="EUR" />
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#6B5744]">Platform Fee (6%)</span>
                    <span className="font-semibold text-[#E17B5C]">
                      -<CurrencyDisplay amount={event.stats.revenue * 0.06} currency="EUR" />
                    </span>
                  </div>
                  <div className="pt-2 border-t border-[rgba(139,115,85,0.1)]">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-[#2D2721]">Net Revenue</span>
                      <span className="text-lg font-bold text-[#9DB5A5]">
                        <CurrencyDisplay amount={event.stats.revenue * 0.94} currency="EUR" />
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 p-6 bg-gradient-to-br from-[#FFF9ED] to-[#FFFBF5] rounded-xl">
              <h3 className="font-semibold text-[#2D2721] mb-4">Engagement Metrics</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-[#8B7355] mb-1">Page Views</p>
                  <p className="text-2xl font-bold text-[#2D2721]">{event.stats.viewCount.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-[#8B7355] mb-1">Shares</p>
                  <p className="text-2xl font-bold text-[#2D2721]">{event.stats.shareCount}</p>
                </div>
                <div>
                  <p className="text-sm text-[#8B7355] mb-1">Conversion Rate</p>
                  <p className="text-2xl font-bold text-[#2D2721]">
                    {((event.stats.soldTickets / event.stats.viewCount) * 100).toFixed(1)}%
                  </p>
                </div>
                <div>
                  <p className="text-sm text-[#8B7355] mb-1">Avg. Ticket Value</p>
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
