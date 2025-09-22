/*
  Fix script for profile creation issues
  Run this in your Supabase SQL editor to ensure the profile trigger is working correctly
*/

-- First, check if the profiles table exists with correct structure
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

-- Enable RLS on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Public profiles are viewable by themselves." ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;

-- Create policies with proper conditions
CREATE POLICY "Public profiles are viewable by themselves."
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile."
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile."
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Grant necessary permissions
GRANT ALL ON public.profiles TO authenticated;

-- Create or replace the function with better error handling
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

-- Create or replace trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Refresh the schema cache
SELECT pg_notify('pgrst', 'reload schema');

-- Test the function
-- SELECT public.handle_new_user();