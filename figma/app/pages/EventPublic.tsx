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
  Check,
  Mail,
  CreditCard,
  ChevronDown,
  ChevronUp,
  Info,
  Tag,
  CalendarCheck,
  PlayCircle
} from 'lucide-react';
import { Input } from '@app/components/ui/input';
import { Label } from '@app/components/ui/label';
import { CurrencyDisplay } from '@app/components/CurrencyDisplay';
import { toast } from 'sonner';
import { copyToClipboard } from '@app/utils/clipboard';

type TicketType = {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  available: number;
  total: number;
  description: string;
};

export function EventPublic() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [selectedTickets, setSelectedTickets] = useState<Record<string, number>>({});
  const [showTicketDetails, setShowTicketDetails] = useState<Record<string, boolean>>({});
  const [purchaseComplete, setPurchaseComplete] = useState(false);
  const [isPlayingVideo, setIsPlayingVideo] = useState(false);

  // Mock event data - in real app would fetch from API/Supabase
  const event = {
    id: 'evt-1',
    name: 'Summer Music Festival 2024',
    description: 'Join us for the biggest music festival of the year featuring top artists from around Europe',
    longDescription: `Experience an unforgettable weekend of music, food, and entertainment at the Summer Music Festival 2024.

- World-class lineup featuring 50+ artists
- Gourmet food trucks and local vendors
- Art installations and interactive experiences
- VIP areas with exclusive amenities

Don't miss out on the event of the summer!`,
    date: '2024-07-15',
    time: '18:00',
    location: 'Stockholm Arena',
    venue: 'Stockholm Arena',
    city: 'Stockholm',
    country: 'Sweden',
    image: null,
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', // Demo video
    merchantName: 'EventPro Stockholm',
    ticketTypes: [
      { 
        id: 'early-bird',
        name: 'Early Bird', 
        price: 89, 
        originalPrice: 120,
        available: 50, 
        total: 500,
        description: 'Limited early bird special - save â‚¬31! Includes general admission and festival wristband.'
      },
      { 
        id: 'general',
        name: 'General Admission', 
        price: 120, 
        available: 720, 
        total: 1000,
        description: 'Full access to all festival stages and areas. Food and drinks available for purchase.'
      },
      { 
        id: 'vip',
        name: 'VIP Pass', 
        price: 250, 
        available: 55, 
        total: 100,
        description: 'Premium experience with VIP lounge access, complimentary drinks, exclusive viewing areas, and meet & greet opportunities.'
      },
    ],
  };

  const COMMISSION_RATE = 0.06; // 6% commission

  const calculateTotal = () => {
    return Object.entries(selectedTickets).reduce((sum, [ticketId, quantity]) => {
      const ticket = event.ticketTypes.find(t => t.id === ticketId);
      if (ticket && quantity > 0) {
        return sum + (ticket.price * quantity);
      }
      return sum;
    }, 0);
  };

  const calculateCommission = () => {
    return calculateTotal() * COMMISSION_RATE;
  };

  const totalTickets = Object.values(selectedTickets).reduce((sum, qty) => sum + qty, 0);

  const handleQuantityChange = (ticketId: string, change: number) => {
    const ticket = event.ticketTypes.find(t => t.id === ticketId);
    if (!ticket) return;

    const currentQty = selectedTickets[ticketId] || 0;
    const newQty = Math.max(0, Math.min(currentQty + change, ticket.available, 10));
    
    setSelectedTickets({
      ...selectedTickets,
      [ticketId]: newQty,
    });
  };

  const toggleTicketDetails = (ticketId: string) => {
    setShowTicketDetails({
      ...showTicketDetails,
      [ticketId]: !showTicketDetails[ticketId],
    });
  };

  const handlePurchase = () => {
    // Validate email
    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    // Validate ticket selection
    if (totalTickets === 0) {
      toast.error('Please select at least one ticket');
      return;
    }

    // In a real implementation, this would:
    // 1. Create a Stripe Checkout session
    // 2. Redirect to Stripe payment page
    // 3. Handle webhook for successful payment
    // 4. Send ticket to email
    
    // Mock Stripe redirect
    toast.loading('Redirecting to secure payment...', { duration: 2000 });
    
    // Simulate successful payment after 2 seconds
    setTimeout(() => {
      handlePaymentSuccess();
    }, 2000);
  };

  const handlePaymentSuccess = () => {
    // This would be called by Stripe webhook in real implementation
    setPurchaseComplete(true);
    toast.success('Payment successful! Ticket sent to your email.');
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: event.name,
          text: `Check out ${event.name}!`,
          url: window.location.href,
        });
        toast.success('Shared successfully!');
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          const success = await copyToClipboard(window.location.href);
          if (success) {
            toast.success('Link copied to clipboard!');
          }
        }
      }
    } else {
      const success = await copyToClipboard(window.location.href);
      if (success) {
        toast.success('Link copied to clipboard!');
      }
    }
  };

  const addToGoogleCalendar = () => {
    // Format: YYYYMMDDTHHMMSSZ or YYYYMMDD
    const dateStr = event.date.replace(/-/g, '');
    const timeStr = event.time.replace(/:/g, '') + '00';
    
    // Assume 3h duration if no end time provided
    const startDateTime = `${dateStr}T${timeStr}`;
    const endDateTime = `${dateStr}T${parseInt(timeStr.substring(0,2)) + 3}0000`; // simple +3h logic

    const title = event.name;
    const details = `${event.description}\n\nOsta piletid: ${window.location.href}`;
    const location = `${event.venue}, ${event.city}`;

    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${startDateTime}/${endDateTime}&details=${encodeURIComponent(details)}&location=${encodeURIComponent(location)}`;
    
    window.open(url, '_blank');
  };

  if (purchaseComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FFFBF5] via-[#FFF9ED] to-[#FFE5B4] flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          <WarmCard padding="lg" className="text-center">
            <div className="py-8">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#9DB5A5] to-[#7FA090] flex items-center justify-center mx-auto mb-6 shadow-warm">
                <Check className="h-10 w-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-[#2D2721] mb-3">Payment Successful!</h2>
              <p className="text-lg text-[#6B5744] mb-2">
                Your tickets have been sent to
              </p>
              <p className="text-xl font-semibold text-[#2D2721] mb-8">
                {email}
              </p>
              
              <div className="bg-gradient-to-br from-[#FFF9ED] to-[#FFE5B4] rounded-[20px] p-6 mb-8 border-2 border-[#FFC857]">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <Ticket className="h-8 w-8 text-[#FFC857]" />
                  <h3 className="text-2xl font-bold text-[#2D2721]">{event.name}</h3>
                </div>
                <div className="space-y-3 text-left">
                  <div className="flex items-start gap-3 text-[#6B5744]">
                    <Calendar className="h-5 w-5 text-[#FFC857] mt-0.5" />
                    <span>{event.date} at {event.time}</span>
                  </div>
                  <div className="flex items-start gap-3 text-[#6B5744]">
                    <MapPin className="h-5 w-5 text-[#FFC857] mt-0.5" />
                    <span>{event.location}</span>
                  </div>
                </div>
                
                <button 
                  onClick={addToGoogleCalendar}
                  className="mt-6 w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-white text-[#2D2721] font-bold border border-[#E7DCC7] hover:border-[#FFC857] transition-all shadow-sm"
                >
                  <CalendarCheck className="w-4 h-4 text-[#4285F4]" />
                  Add to Google Calendar
                </button>
              </div>

              <div className="bg-[#E8F5E9] rounded-[16px] p-4 mb-6">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-[#9DB5A5] mt-0.5 flex-shrink-0" />
                  <div className="text-left text-sm text-[#2D2721]">
                    <p className="font-semibold mb-1">Check your email</p>
                    <p className="text-[#6B5744]">
                      Your tickets include a QR code that will be scanned at the venue entrance. Please keep the email safe.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <WarmButton fullWidth onClick={() => navigate('/wallet')}>
                  <Ticket className="h-5 w-5 mr-2" />
                  View in My Wallet
                </WarmButton>
                <WarmButton variant="outline" fullWidth onClick={handleShare}>
                  <Share2 className="h-5 w-5 mr-2" />
                  Share Event
                </WarmButton>
              </div>
            </div>
          </WarmCard>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFFBF5] via-[#FFF9ED] to-[#FFE5B4] py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-12 h-12 rounded-[14px] bg-gradient-to-br from-[#FFC857] to-[#FFB627] flex items-center justify-center shadow-warm">
              <Calendar className="h-7 w-7 text-[#2D2721]" />
            </div>
            <span className="text-xl font-bold text-[#2D2721]">{event.merchantName}</span>
          </div>
        </div>

        {/* Event Hero Card */}
        <WarmCard padding="lg" className="mb-6">
          {/* Event Image/Video Placeholder */}
          <div className="w-full h-64 bg-gradient-to-br from-[#FFE5B4] to-[#FFC857] rounded-[16px] flex items-center justify-center mb-6 overflow-hidden relative group">
            {isPlayingVideo && event.videoUrl ? (
               <iframe 
                 src={`${event.videoUrl}?autoplay=1`}
                 title="Event Video"
                 allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                 allowFullScreen
                 className="w-full h-full object-cover"
               />
            ) : (
               <>
                 <Calendar className="h-24 w-24 text-white/50" />
                 {event.videoUrl && (
                    <button 
                       onClick={() => setIsPlayingVideo(true)}
                       className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-all"
                    >
                       <div className="w-16 h-16 rounded-full bg-white/90 backdrop-blur flex items-center justify-center shadow-lg transform transition-transform group-hover:scale-110">
                          <PlayCircle className="w-10 h-10 text-[#2D2721] ml-1" />
                       </div>
                    </button>
                 )}
               </>
            )}
          </div>

          {/* Event Title & Info */}
          <div className="space-y-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-[#2D2721] mb-3">{event.name}</h1>
              <p className="text-lg text-[#6B5744]">{event.description}</p>
            </div>

            {/* Event Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
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
                  <div className="font-semibold text-[#2D2721]">{event.time}</div>
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
              
              {/* GOOGLE CALENDAR BUTTON */}
              <div className="sm:col-span-2 mt-2 pt-2 border-t border-[#FAF7F2]">
                 <button 
                   onClick={addToGoogleCalendar}
                   className="flex items-center gap-2 text-sm font-bold text-[#6B5744] hover:text-[#2D2721] hover:bg-[#FAF7F2] p-2 rounded-lg transition-colors"
                 >
                    <CalendarCheck className="w-4 h-4 text-[#4285F4]" />
                    Add to Google Calendar
                 </button>
              </div>
            </div>

            {/* Long Description */}
            <div className="pt-4 border-t border-[rgba(139,115,85,0.1)]">
              <h3 className="font-semibold text-[#2D2721] mb-2">About This Event</h3>
              <p className="text-[#6B5744] whitespace-pre-line">{event.longDescription}</p>
            </div>
          </div>
        </WarmCard>

        {/* Ticket Selection */}
        <WarmCard padding="lg" className="mb-6">
          <h2 className="text-2xl font-bold text-[#2D2721] mb-6">Select Tickets</h2>
          
          <div className="space-y-4">
            {event.ticketTypes.map((ticket) => {
              const quantity = selectedTickets[ticket.id] || 0;
              const isShowingDetails = showTicketDetails[ticket.id];
              const isSoldOut = ticket.available === 0;
              const hasDiscount = ticket.originalPrice && ticket.originalPrice > ticket.price;

              return (
                <div key={ticket.id} className={`rounded-[16px] border-2 transition-all ${
                  quantity > 0 
                    ? 'border-[#FFC857] bg-gradient-to-br from-[#FFF9ED] to-[#FFFBF5]' 
                    : 'border-[rgba(139,115,85,0.1)] bg-white'
                } ${isSoldOut ? 'opacity-60' : ''}`}>
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-semibold text-[#2D2721]">{ticket.name}</h3>
                          {hasDiscount && (
                            <span className="px-2 py-1 bg-gradient-to-br from-[#E17B5C] to-[#D16B4C] text-white text-xs font-semibold rounded-full flex items-center gap-1">
                              <Tag className="h-3 w-3" />
                              SAVE â‚¬{ticket.originalPrice! - ticket.price}
                            </span>
                          )}
                        </div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-bold text-[#2D2721]">
                            <CurrencyDisplay amount={ticket.price} currency="EUR" />
                          </span>
                          {hasDiscount && (
                            <span className="text-sm text-[#8B7355] line-through">
                              <CurrencyDisplay amount={ticket.originalPrice!} currency="EUR" />
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-[#8B7355] mt-1">
                          {isSoldOut ? (
                            <span className="font-semibold text-[#E17B5C]">Sold Out</span>
                          ) : (
                            <span>{ticket.available} of {ticket.total} available</span>
                          )}
                        </div>
                      </div>
                      
                      {!isSoldOut && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleQuantityChange(ticket.id, -1)}
                            disabled={quantity === 0}
                            className="w-10 h-10 rounded-lg bg-[#F2EDE3] hover:bg-[#E5D9C8] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center text-[#2D2721] font-bold transition-colors"
                          >
                            âˆ’
                          </button>
                          <span className="w-12 text-center text-lg font-semibold text-[#2D2721]">
                            {quantity}
                          </span>
                          <button
                            onClick={() => handleQuantityChange(ticket.id, 1)}
                            disabled={quantity >= Math.min(ticket.available, 10)}
                            className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#FFC857] to-[#FFB627] hover:from-[#FFD470] hover:to-[#FFC040] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center text-white font-bold shadow-warm transition-all"
                          >
                            +
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Expandable Description */}
                    <button
                      onClick={() => toggleTicketDetails(ticket.id)}
                      className="flex items-center gap-2 text-sm text-[#8B7355] hover:text-[#6B5744] transition-colors"
                    >
                      <span>{isShowingDetails ? 'Hide' : 'Show'} details</span>
                      {isShowingDetails ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </button>

                    {isShowingDetails && (
                      <div className="mt-3 pt-3 border-t border-[rgba(139,115,85,0.1)]">
                        <p className="text-sm text-[#6B5744]">{ticket.description}</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </WarmCard>

        {/* Email & Checkout */}
        {totalTickets > 0 && (
          <WarmCard padding="lg" className="mb-6">
            <h2 className="text-2xl font-bold text-[#2D2721] mb-6">Checkout</h2>
            
            {/* Email Input */}
            <div className="mb-6">
              <Label htmlFor="email" className="text-[#2D2721] mb-2 block">
                Email Address <span className="text-[#E17B5C]">*</span>
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#8B7355]" />
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
              <p className="text-sm text-[#8B7355] mt-2">
                Your tickets will be sent to this email address
              </p>
            </div>

            {/* Order Summary */}
            <div className="bg-gradient-to-br from-[#FFF9ED] to-[#FFFBF5] rounded-[16px] p-6 mb-6">
              <h3 className="font-semibold text-[#2D2721] mb-4">Order Summary</h3>
              <div className="space-y-3">
                {Object.entries(selectedTickets).map(([ticketId, quantity]) => {
                  if (quantity === 0) return null;
                  const ticket = event.ticketTypes.find(t => t.id === ticketId);
                  if (!ticket) return null;
                  
                  return (
                    <div key={ticketId} className="flex items-center justify-between text-[#6B5744]">
                      <span>{quantity}Ã— {ticket.name}</span>
                      <span className="font-semibold">
                        <CurrencyDisplay amount={ticket.price * quantity} currency="EUR" />
                      </span>
                    </div>
                  );
                })}
                
                <div className="pt-3 border-t border-[rgba(139,115,85,0.2)]">
                  <div className="flex items-center justify-between text-sm text-[#8B7355] mb-1">
                    <span>Subtotal</span>
                    <span>
                      <CurrencyDisplay amount={calculateTotal()} currency="EUR" />
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-[#8B7355] mb-3">
                    <span className="flex items-center gap-1">
                      Service Fee (6%)
                      <Info className="h-3 w-3" />
                    </span>
                    <span>
                      <CurrencyDisplay amount={calculateCommission()} currency="EUR" />
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xl font-bold text-[#2D2721]">
                    <span>Total</span>
                    <span>
                      <CurrencyDisplay amount={calculateTotal() + calculateCommission()} currency="EUR" />
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Stripe Payment Info */}
            <div className="bg-[#E8F5E9] rounded-[12px] p-4 mb-6">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-[#9DB5A5] mt-0.5 flex-shrink-0" />
                <div className="text-sm text-[#2D2721]">
                  <p className="font-semibold mb-1">Secure Payment with Stripe</p>
                  <p className="text-[#6B5744]">
                    You'll be redirected to Stripe's secure payment page to complete your purchase. After successful payment, your tickets will be sent to your email.
                  </p>
                </div>
              </div>
            </div>

            {/* Purchase Button */}
            <WarmButton
              fullWidth
              size="lg"
              onClick={handlePurchase}
              disabled={!email || !email.includes('@')}
            >
              <CreditCard className="h-5 w-5 mr-2" />
              Proceed to Payment
            </WarmButton>
          </WarmCard>
        )}

        {/* Share Button */}
        <div className="text-center">
          <WarmButton variant="outline" onClick={handleShare}>
            <Share2 className="h-5 w-5 mr-2" />
            Share Event
          </WarmButton>
        </div>
      </div>
    </div>
  );
}

