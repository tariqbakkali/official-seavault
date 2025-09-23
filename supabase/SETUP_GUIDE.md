# SeaVault Database Setup Guide

This guide explains how to properly set up the SeaVault database with all required tables and configurations.

## Prerequisites

1. A Supabase account and project
2. Access to the Supabase dashboard for your project
3. Basic understanding of SQL

## Step-by-Step Setup

### 1. Create the Database Tables

You need to run the SQL script located at `supabase/complete_database_setup_dev.sql` in your Supabase SQL Editor. This script will:

- Create all necessary tables (categories, creatures, dive_sites, profiles, sightings, wishlists, achievements, user_achievements)
- Set up proper Row Level Security (RLS) policies for each table
- Create the user profile trigger function
- Set up appropriate permissions

To run this script:

1. Open your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy the contents of `supabase/complete_database_setup_dev.sql`
4. Paste it into the SQL Editor
5. Run the query

### 2. Verify the Setup

After running the script, you should see:
- Empty results for each table query (indicating the tables exist)
- A row with "handle_new_user" for the function check
- A row with "on_auth_user_created" for the trigger check

### 3. Seed the Database (Optional)

Once the tables are created, you can populate them with sample data by running:

```bash
npm run seed-db
```

This will add sample categories, creatures, dive sites, and achievements to your database.

## Troubleshooting

If you encounter any issues:

1. **Schema Cache Errors**: If you see "Could not find the table in the schema cache" errors, it usually means the tables don't exist or are not properly configured. Make sure you've run the complete setup script.

2. **Permission Errors**: Ensure that you're running the setup script as a user with sufficient privileges (usually the project owner).

3. **RLS Issues**: If users can't access their own data, check that the RLS policies are correctly applied to each table.

## Manual Table Creation (If Needed)

If you prefer to create the tables manually, here are the essential CREATE TABLE statements:

```sql
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
```

After creating the tables, you'll also need to set up RLS policies and the user profile trigger function as shown in the complete setup script.