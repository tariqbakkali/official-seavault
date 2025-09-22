/*
  Debug script to diagnose profile creation issues
*/

-- 1. Check if the handle_new_user function exists and its definition
SELECT 
  proname as function_name,
  prosrc as function_definition,
  probin as binary_path
FROM pg_proc 
WHERE proname = 'handle_new_user';

-- 2. Check if the trigger exists and is enabled
SELECT 
  tgname as trigger_name,
  tgrelid::regclass as table_name,
  tgenabled as status,
  tgtype as trigger_type
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created';

-- 3. Check current users in auth.users
SELECT 
  id,
  email,
  created_at,
  confirmed_at,
  last_sign_in_at
FROM auth.users;

-- 4. Check current profiles
SELECT 
  id,
  email,
  created_at,
  full_name,
  is_premium
FROM public.profiles;

-- 5. Check RLS policies on profiles table
SELECT 
  polname as policy_name,
  polrelid::regclass as table_name,
  polcmd as command_type,
  polqual as using_expression,
  polwithcheck as with_check_expression
FROM pg_policy 
WHERE polrelid = 'profiles'::regclass;

-- 6. Test the function manually (this will create a test profile if it doesn't exist)
-- WARNING: Only run this if you have a test user ID
-- SELECT public.handle_new_user();

-- 7. Check for any recent errors in the logs
-- SELECT * FROM supabase_logs WHERE message LIKE '%handle_new_user%' ORDER BY timestamp DESC LIMIT 10;