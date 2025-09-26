/*
  Complete setup script for SeaVault application
  Run this in your Supabase SQL Editor to set up all necessary database objects
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create categories table
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  image_url TEXT
);

-- Create creatures table
CREATE TABLE IF NOT EXISTS public.creatures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creature_id TEXT NOT NULL,
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
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  osm_id TEXT
);

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  membership_tier TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_premium BOOLEAN DEFAULT FALSE,
  has_seen_onboarding BOOLEAN DEFAULT FALSE
);

-- Create sightings table
CREATE TABLE IF NOT EXISTS public.sightings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  creature_id UUID REFERENCES public.creatures(id),
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
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  creature_id UUID REFERENCES public.creatures(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create achievements table
CREATE TABLE IF NOT EXISTS public.achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  icon_name TEXT,
  points INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_achievements table
CREATE TABLE IF NOT EXISTS public.user_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  achievement_id UUID REFERENCES public.achievements(id),
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dive_sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sightings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

-- Create policies for categories
DROP POLICY IF EXISTS "Categories are viewable by everyone" ON public.categories;
DROP POLICY IF EXISTS "Admins can insert categories" ON public.categories;
DROP POLICY IF EXISTS "Admins can update categories" ON public.categories;
DROP POLICY IF EXISTS "Admins can delete categories" ON public.categories;
CREATE POLICY "Categories are viewable by everyone" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Admins can insert categories" ON public.categories FOR INSERT WITH CHECK (
  -- Allow during development/testing
  (auth.role() = 'authenticated') OR
  -- For seeding scripts, allow if no user context
  (auth.uid() IS NULL AND current_user = 'postgres')
);
CREATE POLICY "Admins can update categories" ON public.categories FOR UPDATE USING (
  -- Allow during development/testing
  (auth.role() = 'authenticated') OR
  -- For seeding scripts, allow if no user context
  (auth.uid() IS NULL AND current_user = 'postgres')
);
CREATE POLICY "Admins can delete categories" ON public.categories FOR DELETE USING (
  -- Allow during development/testing
  (auth.role() = 'authenticated') OR
  -- For seeding scripts, allow if no user context
  (auth.uid() IS NULL AND current_user = 'postgres')
);

-- Create policies for creatures
DROP POLICY IF EXISTS "Creatures are viewable by everyone" ON public.creatures;
DROP POLICY IF EXISTS "Admins can insert creatures" ON public.creatures;
DROP POLICY IF EXISTS "Admins can update creatures" ON public.creatures;
DROP POLICY IF EXISTS "Admins can delete creatures" ON public.creatures;
CREATE POLICY "Creatures are viewable by everyone" ON public.creatures FOR SELECT USING (true);
CREATE POLICY "Admins can insert creatures" ON public.creatures FOR INSERT WITH CHECK (
  -- Allow during development/testing
  (auth.role() = 'authenticated') OR
  -- For seeding scripts, allow if no user context
  (auth.uid() IS NULL AND current_user = 'postgres')
);
CREATE POLICY "Admins can update creatures" ON public.creatures FOR UPDATE USING (
  -- Allow during development/testing
  (auth.role() = 'authenticated') OR
  -- For seeding scripts, allow if no user context
  (auth.uid() IS NULL AND current_user = 'postgres')
);
CREATE POLICY "Admins can delete creatures" ON public.creatures FOR DELETE USING (
  -- Allow during development/testing
  (auth.role() = 'authenticated') OR
  -- For seeding scripts, allow if no user context
  (auth.uid() IS NULL AND current_user = 'postgres')
);

-- Create policies for dive_sites
DROP POLICY IF EXISTS "Dive sites are viewable by everyone" ON public.dive_sites;
DROP POLICY IF EXISTS "Authenticated users can insert dive sites" ON public.dive_sites;
DROP POLICY IF EXISTS "Authenticated users can update dive sites" ON public.dive_sites;
DROP POLICY IF EXISTS "Authenticated users can delete dive sites" ON public.dive_sites;
CREATE POLICY "Dive sites are viewable by everyone" ON public.dive_sites FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert dive sites" ON public.dive_sites FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update dive sites" ON public.dive_sites FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete dive sites" ON public.dive_sites FOR DELETE USING (auth.role() = 'authenticated');

-- Create policies for profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Create policies for sightings
DROP POLICY IF EXISTS "Users can view their own sightings" ON public.sightings;
DROP POLICY IF EXISTS "Users can insert their own sightings" ON public.sightings;
DROP POLICY IF EXISTS "Users can update their own sightings" ON public.sightings;
DROP POLICY IF EXISTS "Users can delete their own sightings" ON public.sightings;
CREATE POLICY "Users can view their own sightings" ON public.sightings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own sightings" ON public.sightings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own sightings" ON public.sightings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own sightings" ON public.sightings FOR DELETE USING (auth.uid() = user_id);

-- Create policies for wishlists
DROP POLICY IF EXISTS "Users can view their own wishlists" ON public.wishlists;
DROP POLICY IF EXISTS "Users can insert their own wishlists" ON public.wishlists;
DROP POLICY IF EXISTS "Users can update their own wishlists" ON public.wishlists;
DROP POLICY IF EXISTS "Users can delete their own wishlists" ON public.wishlists;
CREATE POLICY "Users can view their own wishlists" ON public.wishlists FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own wishlists" ON public.wishlists FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own wishlists" ON public.wishlists FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own wishlists" ON public.wishlists FOR DELETE USING (auth.uid() = user_id);

-- Create policies for achievements
DROP POLICY IF EXISTS "Achievements are viewable by everyone" ON public.achievements;
DROP POLICY IF EXISTS "Admins can insert achievements" ON public.achievements;
DROP POLICY IF EXISTS "Admins can update achievements" ON public.achievements;
DROP POLICY IF EXISTS "Admins can delete achievements" ON public.achievements;
CREATE POLICY "Achievements are viewable by everyone" ON public.achievements FOR SELECT USING (true);
CREATE POLICY "Admins can insert achievements" ON public.achievements FOR INSERT WITH CHECK (
  -- Allow during development/testing
  (auth.role() = 'authenticated') OR
  -- For seeding scripts, allow if no user context
  (auth.uid() IS NULL AND current_user = 'postgres')
);
CREATE POLICY "Admins can update achievements" ON public.achievements FOR UPDATE USING (
  -- Allow during development/testing
  (auth.role() = 'authenticated') OR
  -- For seeding scripts, allow if no user context
  (auth.uid() IS NULL AND current_user = 'postgres')
);
CREATE POLICY "Admins can delete achievements" ON public.achievements FOR DELETE USING (
  -- Allow during development/testing
  (auth.role() = 'authenticated') OR
  -- For seeding scripts, allow if no user context
  (auth.uid() IS NULL AND current_user = 'postgres')
);

-- Create policies for user_achievements
DROP POLICY IF EXISTS "Users can view their own achievements" ON public.user_achievements;
DROP POLICY IF EXISTS "System can insert user achievements" ON public.user_achievements;
DROP POLICY IF EXISTS "System can update user achievements" ON public.user_achievements;
DROP POLICY IF EXISTS "System can delete user achievements" ON public.user_achievements;
CREATE POLICY "Users can view their own achievements" ON public.user_achievements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can insert user achievements" ON public.user_achievements FOR INSERT WITH CHECK (true);
CREATE POLICY "System can update user achievements" ON public.user_achievements FOR UPDATE USING (true);
CREATE POLICY "System can delete user achievements" ON public.user_achievements FOR DELETE USING (true);

-- Grant necessary permissions
GRANT ALL ON public.categories TO authenticated;
GRANT ALL ON public.creatures TO authenticated;
GRANT ALL ON public.dive_sites TO authenticated;
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.sightings TO authenticated;
GRANT ALL ON public.wishlists TO authenticated;
GRANT ALL ON public.achievements TO authenticated;
GRANT ALL ON public.user_achievements TO authenticated;

-- Create the function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert a new profile for the new user
  INSERT INTO public.profiles (id, email, full_name, avatar_url, membership_tier, is_premium, has_seen_onboarding)
  VALUES (
    NEW.id,
    NEW.email,
    NULL,  -- full_name
    NULL,  -- avatar_url
    NULL,  -- membership_tier
    FALSE, -- is_premium
    FALSE  -- has_seen_onboarding
  )
  ON CONFLICT (id) DO NOTHING; -- Prevent errors if profile already exists
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't stop the signup process
    RAISE LOG 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create leaderboard function
CREATE OR REPLACE FUNCTION public.get_leaderboard(limit_count INTEGER)
RETURNS TABLE (
  user_id UUID,
  full_name TEXT,
  avatar_url TEXT,
  creatures_discovered BIGINT,
  total_points BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as user_id,
    p.full_name,
    p.avatar_url,
    COUNT(DISTINCT s.creature_id) as creatures_discovered,
    COALESCE(SUM(c.points), 0) as total_points
  FROM public.profiles p
  LEFT JOIN public.sightings s ON p.id = s.user_id
  LEFT JOIN public.creatures c ON s.creature_id = c.id
  WHERE p.full_name IS NOT NULL 
    AND p.full_name != ''
  GROUP BY p.id, p.full_name, p.avatar_url
  ORDER BY total_points DESC, creatures_discovered DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Test the setup
-- Check if the tables exist
SELECT * FROM public.categories LIMIT 0;
SELECT * FROM public.creatures LIMIT 0;
SELECT * FROM public.dive_sites LIMIT 0;
SELECT * FROM public.profiles LIMIT 0;
SELECT * FROM public.sightings LIMIT 0;
SELECT * FROM public.wishlists LIMIT 0;
SELECT * FROM public.achievements LIMIT 0;

-- Check if the function exists
SELECT proname FROM pg_proc WHERE proname = 'handle_new_user';

-- Check if the trigger exists
SELECT tgname FROM pg_trigger WHERE tgname = 'on_auth_user_created';