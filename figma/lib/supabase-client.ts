import { createClient } from '@supabase/supabase-js';

// These should be environmental variables in a real app.
// Use process.env to keep compatibility with Next.js build.
const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  'https://your-project.supabase.co';
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  'your-anon-key';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Types for our database tables
export interface Campaign {
  id: string;
  created_at: string;
  title: string;
  description: string;
  image_url: string | null;
  price: number;
  original_price: number;
  discount_percentage: number;
  start_date: string;
  end_date: string;
  category_id: string | null;
  category_name: string | null; // Joined field often useful
  status: 'draft' | 'active' | 'expired';
  user_id: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon_name: string;
}
