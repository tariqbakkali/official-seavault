/*
  Test script to verify profile creation is working
  Run this in your Supabase SQL editor after applying the migrations
*/

-- Check if the handle_new_user function exists
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname = 'handle_new_user';

-- Check if the trigger exists
SELECT tgname, tgrelid::regclass 
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created';

-- Check RLS policies on profiles table
SELECT polname, polrelid::regclass, polcmd, polqual, polwithcheck
FROM pg_policy 
WHERE polrelid = 'profiles'::regclass;

-- Check table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;