-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Profiles table (extends Supabase auth.users)
create table public.profiles (
  id uuid references auth.users not null primary key,
  email text,
  full_name text,
  avatar_url text,
  role text default 'user' check (role in ('user', 'merchant', 'admin')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Categories table
create table public.categories (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  slug text not null unique,
  icon_name text,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Campaigns table
create table public.campaigns (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) not null,
  title text not null,
  description text,
  image_url text,
  
  price numeric(10,2) not null check (price >= 0),
  original_price numeric(10,2) not null check (original_price >= price),
  discount_percentage integer generated always as (
    case when original_price > 0 
    then round((1 - price/original_price) * 100) 
    else 0 end
  ) stored,
  
  start_date timestamp with time zone not null,
  end_date timestamp with time zone not null,
  
  category_id uuid references public.categories(id),
  category_name text, -- Denormalized for easier querying if needed, or join
  
  status text default 'draft' check (status in ('draft', 'active', 'expired', 'archived')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS Policies (Row Level Security)
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.campaigns enable row level security;

-- Public read access
create policy "Public profiles are viewable by everyone" on public.profiles for select using (true);
create policy "Categories are viewable by everyone" on public.categories for select using (true);
create policy "Active campaigns are viewable by everyone" on public.campaigns for select using (status = 'active');

-- Auth write access
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Merchants can insert campaigns" on public.campaigns for insert with check (auth.uid() = user_id);
create policy "Merchants can update own campaigns" on public.campaigns for update using (auth.uid() = user_id);

-- Seed Data (Initial Categories)
insert into public.categories (name, slug, icon_name) values
('Restoranid', 'restoranid', 'Utensils'),
('Ilu & Tervis', 'ilu-tervis', 'Sparkles'),
('Meelelahutus', 'meelelahutus', 'PartyPopper'),
('Sport', 'sport', 'Dumbbell'),
('Reisimine', 'reisimine', 'Plane'),
('Teenused', 'teenused', 'Briefcase');
