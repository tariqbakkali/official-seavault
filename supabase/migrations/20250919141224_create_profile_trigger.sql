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