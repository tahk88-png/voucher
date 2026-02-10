import { useState } from 'react';
import { WarmCard } from '@app/components/WarmCard';
import { WarmButton } from '@app/components/WarmButton';
import { useNavigate } from '@/lib/router-shim';
import { 
  Calendar,
  Plus,
  Search,
  Filter,
  MapPin,
  Users,
  Clock,
  Ticket,
  TrendingUp,
  MoreVertical,
  Edit,
  Copy,
  Trash2,
  Eye,
  QrCode,
  CheckCircle2,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { CurrencyDisplay } from '@app/components/CurrencyDisplay';
import { Input } from '@app/components/ui/input';
import { toast } from 'sonner';

type EventStatus = 'upcoming' | 'ongoing' | 'ended' | 'cancelled';

type Event = {
  id: string;
  name: string;
  date: string;
  time: string;
  location: string;
  description: string;
  image?: string;
  status: EventStatus;
  ticketTypes: Array<{
    name: string;
    price: number;
    currency: 'EUR';
    sold: number;
    total: number;
  }>;
  stats: {
    totalTickets: number;
    soldTickets: number;
    revenue: number;
    checkIns: number;
  };
};

export function EventsList() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<EventStatus | 'all'>('all');
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const events: Event[] = [
    {
      id: 'evt-1',
      name: 'Summer Music Festival 2024',
      date: '2024-07-15',
      time: '18:00',
      location: 'Stockholm Arena',
      description: 'The biggest music festival of the year',
      status: 'upcoming',
      ticketTypes: [
        { name: 'Early Bird', price: 89, currency: 'EUR', sold: 450, total: 500 },
        { name: 'General Admission', price: 120, currency: 'EUR', sold: 280, total: 1000 },
        { name: 'VIP Pass', price: 250, currency: 'EUR', sold: 45, total: 100 },
      ],
      stats: {
        totalTickets: 1600,
        soldTickets: 775,
        revenue: 85450,
        checkIns: 0,
      },
    },
    {
      id: 'evt-2',
      name: 'Tech Conference Nordic 2024',
      date: '2024-02-10',
      time: '09:00',
      location: 'Helsinki Convention Center',
      description: 'Leading tech innovation conference',
      status: 'ongoing',
      ticketTypes: [
        { name: 'Standard', price: 199, currency: 'EUR', sold: 340, total: 400 },
        { name: 'Premium', price: 399, currency: 'EUR', sold: 89, total: 100 },
      ],
      stats: {
        totalTickets: 500,
        soldTickets: 429,
        revenue: 103201,
        checkIns: 387,
      },
    },
    {
      id: 'evt-3',
      name: 'Food & Wine Tasting',
      date: '2024-01-20',
      time: '19:00',
      location: 'Grand Hotel Oslo',
      description: 'Exclusive culinary experience',
      status: 'ended',
      ticketTypes: [
        { name: 'Regular', price: 75, currency: 'EUR', sold: 120, total: 120 },
      ],
      stats: {
        totalTickets: 120,
        soldTickets: 120,
        revenue: 9000,
        checkIns: 115,
      },
    },
    {
      id: 'evt-4',
      name: 'New Year Gala',
      date: '2023-12-31',
      time: '21:00',
      location: 'Copenhagen City Hall',
      description: 'Cancelled due to weather',
      status: 'cancelled',
      ticketTypes: [
        { name: 'Standard', price: 150, currency: 'EUR', sold: 78, total: 200 },
      ],
      stats: {
        totalTickets: 200,
        soldTickets: 78,
        revenue: 0,
        checkIns: 0,
      },
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

  const filteredEvents = events.filter((event) => {
    const matchesSearch = event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          event.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || event.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalRevenue = events.reduce((sum, event) => sum + event.stats.revenue, 0);
  const totalSold = events.reduce((sum, event) => sum + event.stats.soldTickets, 0);
  const activeEvents = events.filter(e => e.status === 'upcoming' || e.status === 'ongoing').length;

  const handleDuplicate = (eventId: string) => {
    toast.success('Event duplicated successfully');
    setActiveMenu(null);
  };

  const handleDelete = (eventId: string) => {
    toast.success('Event deleted');
    setActiveMenu(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#2D2721]">Events & Tickets</h1>
          <p className="text-[#6B5744] mt-1">Manage your events and track ticket sales</p>
        </div>
        <WarmButton onClick={() => navigate('/events/create')}>
          <Plus className="h-5 w-5 mr-2" />
          Create Event
        </WarmButton>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <WarmCard padding="lg" hover>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-[#8B7355] mb-1">Active Events</p>
              <p className="text-2xl font-bold text-[#2D2721]">{activeEvents}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#FFC857] to-[#FFB627] flex items-center justify-center shadow-warm">
              <Calendar className="h-6 w-6 text-white" />
            </div>
          </div>
        </WarmCard>

        <WarmCard padding="lg" hover>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-[#8B7355] mb-1">Tickets Sold</p>
              <p className="text-2xl font-bold text-[#2D2721]">{totalSold.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#9DB5A5] to-[#7FA090] flex items-center justify-center shadow-warm">
              <Ticket className="h-6 w-6 text-white" />
            </div>
          </div>
        </WarmCard>

        <WarmCard padding="lg" hover>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-[#8B7355] mb-1">Total Revenue</p>
              <p className="text-2xl font-bold text-[#2D2721]">
                <CurrencyDisplay amount={totalRevenue} currency="EUR" />
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#E17B5C] to-[#D16B4C] flex items-center justify-center shadow-warm">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
          </div>
        </WarmCard>

        <WarmCard padding="lg" hover>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-[#8B7355] mb-1">Avg. Attendance</p>
              <p className="text-2xl font-bold text-[#2D2721]">
                {Math.round((events.reduce((sum, e) => sum + e.stats.checkIns, 0) / events.filter(e => e.status === 'ended').length) || 0)}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#F5C98E] to-[#E5B97E] flex items-center justify-center shadow-warm">
              <Users className="h-6 w-6 text-white" />
            </div>
          </div>
        </WarmCard>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#8B7355]" />
          <Input
            type="text"
            placeholder="Search events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 -mb-2">
          {[
            { id: 'all' as const, label: 'All', count: events.length },
            { id: 'upcoming' as const, label: 'Upcoming', count: events.filter(e => e.status === 'upcoming').length },
            { id: 'ongoing' as const, label: 'Live', count: events.filter(e => e.status === 'ongoing').length },
            { id: 'ended' as const, label: 'Ended', count: events.filter(e => e.status === 'ended').length },
          ].map((filter) => (
            <button
              key={filter.id}
              onClick={() => setStatusFilter(filter.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                statusFilter === filter.id
                  ? 'bg-gradient-to-br from-[#FFC857] to-[#FFB627] text-white shadow-warm'
                  : 'bg-[#FFF9ED] text-[#6B5744] hover:bg-[#FFE5B4]'
              }`}
            >
              {filter.label} ({filter.count})
            </button>
          ))}
        </div>
      </div>

      {/* Events List */}
      {filteredEvents.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {filteredEvents.map((event) => {
            const statusConfig = getStatusConfig(event.status);
            const StatusIcon = statusConfig.icon;
            const soldPercentage = (event.stats.soldTickets / event.stats.totalTickets) * 100;
            
            return (
              <WarmCard key={event.id} padding="lg" hover className="relative">
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Event Image */}
                  <div className="w-full lg:w-48 h-48 bg-gradient-to-br from-[#FFE5B4] to-[#FFC857] rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
                    <Calendar className="h-16 w-16 text-white/50" />
                  </div>

                  {/* Event Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-semibold text-[#2D2721]">{event.name}</h3>
                          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${statusConfig.color}`}>
                            <StatusIcon className="h-3 w-3" />
                            {statusConfig.label}
                          </span>
                        </div>
                        <p className="text-sm text-[#6B5744] mb-3">{event.description}</p>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-[#8B7355]">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            {event.date}
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            {event.time}
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            {event.location}
                          </div>
                        </div>
                      </div>

                      {/* Action Menu */}
                      <div className="relative">
                        <button
                          onClick={() => setActiveMenu(activeMenu === event.id ? null : event.id)}
                          className="p-2 hover:bg-[#FFF9ED] rounded-lg transition-colors"
                        >
                          <MoreVertical className="h-5 w-5 text-[#8B7355]" />
                        </button>
                        {activeMenu === event.id && (
                          <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-warm-lg border border-[rgba(139,115,85,0.1)] z-10 overflow-hidden">
                            <button
                              onClick={() => navigate(`/events/${event.id}`)}
                              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#FFF9ED] transition-colors text-[#2D2721]"
                            >
                              <Eye className="h-4 w-4" />
                              View Details
                            </button>
                            <button
                              onClick={() => navigate(`/events/${event.id}/edit`)}
                              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#FFF9ED] transition-colors text-[#2D2721]"
                            >
                              <Edit className="h-4 w-4" />
                              Edit Event
                            </button>
                            <button
                              onClick={() => handleDuplicate(event.id)}
                              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#FFF9ED] transition-colors text-[#2D2721]"
                            >
                              <Copy className="h-4 w-4" />
                              Duplicate
                            </button>
                            <button
                              onClick={() => handleDelete(event.id)}
                              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#FEE2E2] transition-colors text-[#E17B5C]"
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Ticket Types */}
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Ticket className="h-4 w-4 text-[#FFC857]" />
                        <span className="text-sm font-semibold text-[#2D2721]">Ticket Types</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {event.ticketTypes.map((ticket, idx) => (
                          <div key={idx} className="p-3 bg-[#FFF9ED] rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-[#2D2721]">{ticket.name}</span>
                              <span className="text-sm font-bold text-[#2D2721]">
                                <CurrencyDisplay amount={ticket.price} currency={ticket.currency} />
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-xs text-[#8B7355]">
                              <span>{ticket.sold} / {ticket.total} sold</span>
                              <span>{Math.round((ticket.sold / ticket.total) * 100)}%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-[#8B7355]">Overall Sales Progress</span>
                        <span className="font-semibold text-[#2D2721]">
                          {event.stats.soldTickets} / {event.stats.totalTickets} tickets
                        </span>
                      </div>
                      <div className="h-2 bg-[#F2EDE3] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#9DB5A5] to-[#7FA090] transition-all"
                          style={{ width: `${soldPercentage}%` }}
                        />
                      </div>
                    </div>

                    {/* Stats & Actions */}
                    <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-[rgba(139,115,85,0.1)]">
                      <div className="flex items-center gap-6 text-sm">
                        <div>
                          <span className="text-[#8B7355]">Revenue: </span>
                          <span className="font-semibold text-[#2D2721]">
                            <CurrencyDisplay amount={event.stats.revenue} currency="EUR" />
                          </span>
                        </div>
                        {event.status === 'ongoing' || event.status === 'ended' ? (
                          <div>
                            <span className="text-[#8B7355]">Check-ins: </span>
                            <span className="font-semibold text-[#2D2721]">{event.stats.checkIns}</span>
                          </div>
                        ) : null}
                      </div>
                      <div className="flex items-center gap-2">
                        <WarmButton size="sm" variant="outline" onClick={() => navigate(`/events/${event.id}`)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Event
                        </WarmButton>
                        {event.status === 'upcoming' || event.status === 'ongoing' ? (
                          <WarmButton size="sm" onClick={() => navigate(`/redeem?event=${event.id}`)}>
                            <QrCode className="h-4 w-4 mr-2" />
                            Scan Tickets
                          </WarmButton>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              </WarmCard>
            );
          })}
        </div>
      ) : (
        <WarmCard padding="lg" className="text-center py-16">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#FFE5B4] to-[#FFC857] flex items-center justify-center mx-auto mb-6">
            <Calendar className="h-10 w-10 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-[#2D2721] mb-3">No events found</h3>
          <p className="text-[#6B5744] mb-6">
            {searchQuery || statusFilter !== 'all'
              ? 'Try adjusting your filters to find events.'
              : 'Create your first event to start selling tickets.'}
          </p>
          <WarmButton onClick={() => navigate('/events/create')}>
            <Plus className="h-5 w-5 mr-2" />
            Create Event
          </WarmButton>
        </WarmCard>
      )}
    </div>
  );
}

