/*
  This file contains all the migrations combined for easy application
  Copy and paste this entire content into your Supabase SQL editor to apply all fixes
*/

/*
  # Create profile trigger function

  1. New Functions
    - `handle_new_user()` - Automatically creates a profile for new users
  
  2. New Triggers
    - `on_auth_user_created` - Triggered when a new user is created in auth.users
*/
-- Create function to handle new user creation
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
    NULL,  -- is_premium
    FALSE  -- has_seen_onboarding
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to call the function when a new user is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

/*
  # Fix profiles table RLS and triggers

  1. Ensure proper RLS policies for profiles table
  2. Ensure the profile creation trigger is working
  3. Add missing policies for profile management
*/

-- First, ensure the profiles table exists
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
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Create policies
CREATE POLICY "Users can view their own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id);

/*
  # Complete profile setup with proper error handling

  1. Ensure profiles table exists with correct structure
  2. Set up proper RLS policies
  3. Create robust trigger function with error handling
*/

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

-- Grant necessary permissions
GRANT ALL ON public.profiles TO authenticated;