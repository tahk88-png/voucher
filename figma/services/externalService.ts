import { toast } from "sonner";

// Tüübid väliste teenuste vastuste jaoks
export interface ExternalAvailabilityResponse {
  isAvailable: boolean;
  stockLevel: number;
  nextAvailableDate?: string;
}

export interface ExternalBookingResponse {
  bookingId: string;
  status: 'confirmed' | 'pending' | 'failed';
  externalReference: string;
}

// See teenus simuleerib suhtlust API-dega (nt Stripe, ERP, Broneeringusüsteem)
export const ExternalService = {
  
  // Simuleerib laoseisu kontrolli välisest laotarkvarast
  checkStock: async (sku: string): Promise<ExternalAvailabilityResponse> => {
    console.log(`[External API] Checking stock for SKU: ${sku}...`);
    
    // Simuleeritud võrgu viide
    await new Promise(resolve => setTimeout(resolve, 800));

    // Juhuslik loogika demo eesmärgil
    const isAvailable = Math.random() > 0.1; 
    
    return {
      isAvailable,
      stockLevel: isAvailable ? Math.floor(Math.random() * 50) + 1 : 0,
      nextAvailableDate: isAvailable ? undefined : new Date(Date.now() + 86400000 * 3).toISOString()
    };
  },

  // Simuleerib broneeringu saatmist välisesse kalendrisse
  syncBooking: async (rentalId: string, dates: { start: string, end: string }) => {
    console.log(`[External API] Syncing booking for ${rentalId} to calendar...`);
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    toast.success("Sünkroonitud välise kalendriga", {
      description: `Broneering kinnitatud perioodiks ${dates.start} - ${dates.end}`
    });

    return {
      bookingId: `BK-${Math.floor(Math.random() * 10000)}`,
      status: 'confirmed',
      externalReference: `EXT-CAL-${Date.now()}`
    };
  },

  // Simuleerib makse algatamist
  initiatePayment: async (amount: number, options?: { currency?: string, provider?: string, apiKey?: string }) => {
    const { currency = 'EUR', provider = 'platform', apiKey } = options || {};
    
    console.log(`[External API] Initiating payment via ${provider.toUpperCase()} for ${amount} ${currency}...`);
    if (provider !== 'platform' && apiKey) {
        console.log(`[External API] Using Merchant API Key: ${apiKey.substring(0, 4)}...`);
    }

    await new Promise(resolve => setTimeout(resolve, 1000));
    return {
      paymentId: `PAY-${Date.now()}`,
      provider: provider,
      status: 'pending',
      redirectUrl: '/checkout/success' // Demo URL
    };
  }
};