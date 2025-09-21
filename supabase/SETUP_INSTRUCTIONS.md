# SeaVault Database Setup Instructions

This document provides instructions for setting up the SeaVault database schema.

## Prerequisites

1. Access to your Supabase project dashboard
2. SQL Editor access in Supabase

## Setup Steps

1. **Apply Database Schema**:
   - Open your Supabase project dashboard
   - Navigate to the SQL Editor
   - Copy the contents of `complete_setup.sql`
   - Paste it into the SQL Editor
   - Run the query

2. **Verify Setup**:
   - After running the script, the last few lines will test if the setup was successful
   - You should see:
     - An empty result for the profiles table query (indicating the table exists)
     - A row with "handle_new_user" for the function check
     - A row with "on_auth_user_created" for the trigger check

3. **Test Profile Creation**:
   - Sign up as a new user in your app
   - Check if a profile is automatically created by running:
     ```sql
     SELECT * FROM public.profiles;
     ```
   - You should see a row for each user who has signed up

## What This Setup Does

1. **Creates the profiles table** with the following columns:
   - `id`: UUID that references the auth.users table
   - `email`: User's email address
   - `full_name`: User's full name (optional)
   - `avatar_url`: URL to user's avatar image (optional)
   - `membership_tier`: User's membership tier (optional)
   - `created_at`: Timestamp when the profile was created
   - `is_premium`: Boolean indicating if user has premium access
   - `has_seen_onboarding`: Boolean indicating if user has completed onboarding

2. **Sets up Row Level Security (RLS)**:
   - Users can only view their own profile
   - Users can only insert their own profile
   - Users can only update their own profile

3. **Creates a trigger function**:
   - Automatically creates a profile when a new user signs up
   - Handles conflicts if a profile already exists
   - Logs errors but doesn't stop the signup process

## Troubleshooting

If you encounter issues:

1. **Check RLS Policies**:
   ```sql
   SELECT * FROM pg_policy WHERE polrelid = 'profiles'::regclass;
   ```

2. **Check Table Structure**:
   ```sql
   SELECT column_name, data_type, is_nullable 
   FROM information_schema.columns 
   WHERE table_name = 'profiles' 
   ORDER BY ordinal_position;
   ```

3. **Check Function**:
   ```sql
   SELECT proname, prosrc 
   FROM pg_proc 
   WHERE proname = 'handle_new_user';
   ```

4. **Check Trigger**:
   ```sql
   SELECT tgname, tgrelid::regclass 
   FROM pg_trigger 
   WHERE tgname = 'on_auth_user_created';
   ```