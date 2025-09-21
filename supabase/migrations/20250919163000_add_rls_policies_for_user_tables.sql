/*
  # Add RLS policies for user data tables

  1. Enable RLS on all tables that store user-specific data
  2. Create policies to ensure users can only access their own data
  3. This enhances security for the delete_user_data function
*/

-- Enable RLS on user_achievements table
ALTER TABLE IF EXISTS public.user_achievements ENABLE ROW LEVEL SECURITY;

-- Drop existing policies on user_achievements
DROP POLICY IF EXISTS "Users can view their own achievements" ON public.user_achievements;
DROP POLICY IF EXISTS "Users can insert their own achievements" ON public.user_achievements;
DROP POLICY IF EXISTS "Users can update their own achievements" ON public.user_achievements;
DROP POLICY IF EXISTS "Users can delete their own achievements" ON public.user_achievements;

-- Create policies for user_achievements
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

-- Enable RLS on wishlists table
ALTER TABLE IF EXISTS public.wishlists ENABLE ROW LEVEL SECURITY;

-- Drop existing policies on wishlists
DROP POLICY IF EXISTS "Users can view their own wishlists" ON public.wishlists;
DROP POLICY IF EXISTS "Users can insert their own wishlists" ON public.wishlists;
DROP POLICY IF EXISTS "Users can update their own wishlists" ON public.wishlists;
DROP POLICY IF EXISTS "Users can delete their own wishlists" ON public.wishlists;

-- Create policies for wishlists
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

-- Enable RLS on sightings table
ALTER TABLE IF EXISTS public.sightings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies on sightings
DROP POLICY IF EXISTS "Users can view their own sightings" ON public.sightings;
DROP POLICY IF EXISTS "Users can insert their own sightings" ON public.sightings;
DROP POLICY IF EXISTS "Users can update their own sightings" ON public.sightings;
DROP POLICY IF EXISTS "Users can delete their own sightings" ON public.sightings;

-- Create policies for sightings
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

-- Grant necessary permissions
GRANT ALL ON public.user_achievements TO authenticated;
GRANT ALL ON public.wishlists TO authenticated;
GRANT ALL ON public.sightings TO authenticated;