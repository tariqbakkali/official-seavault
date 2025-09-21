# Supabase Migrations

This directory contains SQL migrations to fix profile creation issues and routing problems in the SeaVault application.

## Files

1. `20250919141224_create_profile_trigger.sql` - Initial profile creation trigger
2. `20250919141225_fix_profiles_rls.sql` - Fixes for Row Level Security policies
3. `20250919141226_complete_profile_setup.sql` - Complete profile setup with error handling
4. `apply_migrations.sql` - Combined migrations for easy application

## How to Apply Migrations

Since the automated CLI approach requires project configuration, you can apply these migrations manually through the Supabase dashboard:

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy the contents of `apply_migrations.sql`
4. Paste it into the SQL Editor
5. Run the query

This will apply all the necessary fixes to:
- Create the profile creation trigger
- Set up proper Row Level Security policies
- Ensure the profiles table has the correct structure
- Add error handling to the profile creation process

## What These Migrations Fix

1. **Profile Creation Issues**: The database trigger that automatically creates profiles when users sign up
2. **Row Level Security**: Proper policies that allow users to view, insert, and update their own profiles
3. **Error Handling**: Better error handling in the profile creation process to prevent failures

After applying these migrations, restart your Expo application and try signing up again. The profile should be created automatically.