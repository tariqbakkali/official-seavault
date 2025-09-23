/*
  # Create core application tables

  1. Create all core tables for the SeaVault application
  2. Set up proper relationships between tables
  3. Enable RLS with appropriate policies
*/

-- Create categories table
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  image_url TEXT
);

-- Create creatures table
CREATE TABLE IF NOT EXISTS public.creatures (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  creature_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  scientific_name TEXT,
  category_id UUID REFERENCES public.categories(id),
  points INTEGER DEFAULT 0,
  description TEXT,
  habitat TEXT,
  diet TEXT,
  depth_range TEXT,
  length TEXT,
  weight TEXT,
  lifespan TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  class TEXT
);

-- Create dive_sites table
CREATE TABLE IF NOT EXISTS public.dive_sites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  osm_id TEXT
);

-- Create sightings table
CREATE TABLE IF NOT EXISTS public.sightings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  creature_id UUID REFERENCES public.creatures(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  dive_notes TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  dive_site_id UUID REFERENCES public.dive_sites(id),
  dive_type TEXT,
  time_of_day TEXT,
  depth TEXT,
  creature_notes TEXT
);

-- Create wishlists table
CREATE TABLE IF NOT EXISTS public.wishlists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  creature_id UUID REFERENCES public.creatures(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create achievements table
CREATE TABLE IF NOT EXISTS public.achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  icon_name TEXT,
  points INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_achievements table (to track which users have unlocked which achievements)
CREATE TABLE IF NOT EXISTS public.user_achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  achievement_id UUID REFERENCES public.achievements(id) ON DELETE CASCADE NOT NULL,
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

-- Enable RLS on all tables
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dive_sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sightings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

-- Create policies for categories (public read, admin write)
CREATE POLICY "Categories are viewable by everyone"
  ON public.categories FOR SELECT
  USING (true);

CREATE POLICY "Only admins can insert categories"
  ON public.categories FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND membership_tier = 'admin'
  ));

CREATE POLICY "Only admins can update categories"
  ON public.categories FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND membership_tier = 'admin'
  ));

CREATE POLICY "Only admins can delete categories"
  ON public.categories FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND membership_tier = 'admin'
  ));

-- Create policies for creatures (public read, admin write)
CREATE POLICY "Creatures are viewable by everyone"
  ON public.creatures FOR SELECT
  USING (true);

CREATE POLICY "Only admins can insert creatures"
  ON public.creatures FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND membership_tier = 'admin'
  ));

CREATE POLICY "Only admins can update creatures"
  ON public.creatures FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND membership_tier = 'admin'
  ));

CREATE POLICY "Only admins can delete creatures"
  ON public.creatures FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND membership_tier = 'admin'
  ));

-- Create policies for dive_sites (public read, admin write)
CREATE POLICY "Dive sites are viewable by everyone"
  ON public.dive_sites FOR SELECT
  USING (true);

CREATE POLICY "Only admins can insert dive sites"
  ON public.dive_sites FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND membership_tier = 'admin'
  ));

CREATE POLICY "Only admins can update dive sites"
  ON public.dive_sites FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND membership_tier = 'admin'
  ));

CREATE POLICY "Only admins can delete dive sites"
  ON public.dive_sites FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND membership_tier = 'admin'
  ));

-- Create policies for sightings (users can only access their own)
CREATE POLICY "Users can view their own sightings"
  ON public.sightings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sightings"
  ON public.sightings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sightings"
  ON public.sightings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sightings"
  ON public.sightings FOR DELETE
  USING (auth.uid() = user_id);

-- Create policies for wishlists (users can only access their own)
CREATE POLICY "Users can view their own wishlists"
  ON public.wishlists FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own wishlists"
  ON public.wishlists FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own wishlists"
  ON public.wishlists FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own wishlists"
  ON public.wishlists FOR DELETE
  USING (auth.uid() = user_id);

-- Create policies for achievements (public read, admin write)
CREATE POLICY "Achievements are viewable by everyone"
  ON public.achievements FOR SELECT
  USING (true);

CREATE POLICY "Only admins can insert achievements"
  ON public.achievements FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND membership_tier = 'admin'
  ));

CREATE POLICY "Only admins can update achievements"
  ON public.achievements FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND membership_tier = 'admin'
  ));

CREATE POLICY "Only admins can delete achievements"
  ON public.achievements FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND membership_tier = 'admin'
  ));

-- Create policies for user_achievements (users can only access their own)
CREATE POLICY "Users can view their own achievements"
  ON public.user_achievements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own achievements"
  ON public.user_achievements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own achievements"
  ON public.user_achievements FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own achievements"
  ON public.user_achievements FOR DELETE
  USING (auth.uid() = user_id);

-- Grant necessary permissions
GRANT ALL ON public.categories TO authenticated;
GRANT ALL ON public.creatures TO authenticated;
GRANT ALL ON public.dive_sites TO authenticated;
GRANT ALL ON public.sightings TO authenticated;
GRANT ALL ON public.wishlists TO authenticated;
GRANT ALL ON public.achievements TO authenticated;
GRANT ALL ON public.user_achievements TO authenticated;

-- Grant select permissions for public read tables
GRANT SELECT ON public.categories TO anon;
GRANT SELECT ON public.creatures TO anon;
GRANT SELECT ON public.dive_sites TO anon;
GRANT SELECT ON public.achievements TO anon;