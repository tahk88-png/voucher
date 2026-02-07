import { supabase, Campaign } from '@/figma/lib/supabase-client';

// Mock data to use when Supabase is not connected or returns empty
const MOCK_CAMPAIGNS: Campaign[] = [
  {
    id: '1',
    user_id: 'mock-user-1',
    created_at: new Date().toISOString(),
    title: 'Restoran Ööbik - 3-käiguline õhtusöök',
    description: 'Nautige unustamatut maitseelamust meie peakoka poolt koostatud erimenüüga.',
    image_url: "https://images.unsplash.com/photo-1513772457252-c0417654a2a0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnb3VybWV0JTIwZGlubmVyJTIwcmVzdGF1cmFudHxlbnwxfHx8fDE3NjkzNTExNzh8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    price: 45,
    original_price: 75,
    discount_percentage: 40,
    start_date: new Date().toISOString(),
    end_date: new Date(Date.now() + 86400000 * 30).toISOString(),
    category_id: 'cat-1',
    category_name: 'Restoranid',
    status: 'active'
  },
  {
    id: '2',
    user_id: 'mock-user-2',
    created_at: new Date().toISOString(),
    title: 'Veinidegusteerimine vanalinnas',
    description: 'Avasta parimad Itaalia veinid hubases vanalinna veinikeldris.',
    image_url: "https://images.unsplash.com/photo-1687877954846-00876ced28bf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3aW5lJTIwdGFzdGluZyUyMHZpbmV5YXJkfGVufDF8fHx8MTc2OTMzMjY5NXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    price: 25,
    original_price: 35,
    discount_percentage: 28,
    start_date: new Date().toISOString(),
    end_date: new Date(Date.now() + 86400000 * 14).toISOString(),
    category_id: 'cat-3',
    category_name: 'Meelelahutus',
    status: 'active'
  },
  {
    id: '3',
    user_id: 'mock-user-3',
    created_at: new Date().toISOString(),
    title: 'Surfikoolitus Pärnus',
    description: '3-tunnine algajate surfikoolitus kogenud instruktoriga.',
    image_url: "https://images.unsplash.com/photo-1761576881154-42de9dc70b25?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdXJmJTIwc2Nob29sJTIwYmVhY2h8ZW58MXx8fHwxNzY5MzUxMTc5fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    price: 39,
    original_price: 50,
    discount_percentage: 22,
    start_date: new Date().toISOString(),
    end_date: new Date(Date.now() + 86400000 * 60).toISOString(),
    category_id: 'cat-4',
    category_name: 'Sport',
    status: 'active'
  }
];

// In-memory store for new campaigns created during the session
// This simulates persistence without a real backend for the demo
let sessionCampaigns: Campaign[] = [];

export const api = {
  campaigns: {
    list: async (): Promise<Campaign[]> => {
      // 1. Try to fetch from Supabase (will fail gracefully if no keys)
      try {
        const { data, error } = await supabase
          .from('campaigns')
          .select('*')
          .eq('status', 'active')
          .order('created_at', { ascending: false });
        
        if (!error && data && data.length > 0) {
          return [...sessionCampaigns, ...data];
        }
      } catch (e) {
        console.warn('Supabase fetch failed, using mock data', e);
      }

      // 2. Return mock data + session data if API fails or is empty
      return [...sessionCampaigns, ...MOCK_CAMPAIGNS];
    },

    create: async (campaign: Omit<Campaign, 'id' | 'created_at' | 'discount_percentage' | 'user_id'>): Promise<Campaign | null> => {
      // Calculate derived fields
      const discount_percentage = campaign.original_price > 0 
        ? Math.round((1 - campaign.price / campaign.original_price) * 100)
        : 0;
      
      const newCampaign: Campaign = {
        ...campaign,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
        discount_percentage,
        user_id: 'current-user-id' // Mock user ID
      };

      // 1. Try to save to Supabase
      try {
        const { error } = await supabase.from('campaigns').insert(newCampaign);
        if (error) throw error;
        return newCampaign;
      } catch (e) {
        console.warn('Supabase insert failed, using session store', e);
        // Fallback to session store
        sessionCampaigns = [newCampaign, ...sessionCampaigns];
        return newCampaign;
      }
    },

    get: async (id: string): Promise<Campaign | null> => {
      // 1. Check session store first
      const sessionCampaign = sessionCampaigns.find(c => c.id === id);
      if (sessionCampaign) return sessionCampaign;

      // 2. Check mock data
      const mockCampaign = MOCK_CAMPAIGNS.find(c => c.id === id);
      if (mockCampaign) return mockCampaign;

      // 3. Try fetch from Supabase
      try {
        const { data, error } = await supabase
          .from('campaigns')
          .select('*')
          .eq('id', id)
          .single();
        
        if (!error && data) return data;
      } catch (e) {
        console.warn('Supabase fetch failed', e);
      }

      return null;
    }
  }
};
