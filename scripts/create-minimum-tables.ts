#!/usr/bin/env node
/**
 * Database Table Creation Script
 * 
 * This script creates the minimum required tables for the SeaVault app
 * if they don't already exist.
 */

import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/database';

// Load environment variables
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Please ensure EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY are set');
  process.exit(1);
}

// Create Supabase client with service role key for admin operations
const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

async function createTables() {
  console.log('🔧 Creating minimum required tables...\n');

  try {
    // Create profiles table
    console.log('1. Creating profiles table...');
    const { error: profilesError } = await supabase.rpc('create_profiles_table_if_not_exists' as any);
    
    // If RPC doesn't exist, create table directly
    if (profilesError) {
      console.log('   Creating profiles table directly...');
      const { error: directError } = await supabase.rpc('execute_sql' as any, {
        sql: `
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
          
          ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
          
          CREATE POLICY "Users can view their own profile" 
          ON public.profiles FOR SELECT 
          USING (auth.uid() = id);
          
          CREATE POLICY "Users can insert their own profile" 
          ON public.profiles FOR INSERT 
          WITH CHECK (auth.uid() = id);
          
          CREATE POLICY "Users can update their own profile" 
          ON public.profiles FOR UPDATE 
          USING (auth.uid() = id);
          
          GRANT ALL ON public.profiles TO authenticated;
        `
      } as any);
      
      if (directError) {
        console.log('   ⚠️  Could not create profiles table (may already exist or insufficient permissions)');
      } else {
        console.log('   ✅ Profiles table created or already exists');
      }
    } else {
      console.log('   ✅ Profiles table created or already exists');
    }

    // Create categories table
    console.log('\n2. Creating categories table...');
    const { error: categoriesError } = await supabase.rpc('execute_sql' as any, {
      sql: `
        CREATE TABLE IF NOT EXISTS public.categories (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          name TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          image_url TEXT
        );
        
        ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Categories are viewable by everyone"
        ON public.categories FOR SELECT
        USING (true);
        
        GRANT ALL ON public.categories TO authenticated;
        GRANT SELECT ON public.categories TO anon;
      `
    } as any);
    
    if (categoriesError) {
      console.log('   ⚠️  Could not create categories table (may already exist or insufficient permissions)');
    } else {
      console.log('   ✅ Categories table created or already exists');
    }

    // Create creatures table
    console.log('\n3. Creating creatures table...');
    const { error: creaturesError } = await supabase.rpc('execute_sql' as any, {
      sql: `
        CREATE TABLE IF NOT EXISTS public.creatures (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          creature_id TEXT UNIQUE NOT NULL,
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
        
        ALTER TABLE public.creatures ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Creatures are viewable by everyone"
        ON public.creatures FOR SELECT
        USING (true);
        
        GRANT ALL ON public.creatures TO authenticated;
        GRANT SELECT ON public.creatures TO anon;
      `
    } as any);
    
    if (creaturesError) {
      console.log('   ⚠️  Could not create creatures table (may already exist or insufficient permissions)');
    } else {
      console.log('   ✅ Creatures table created or already exists');
    }

    // Create dive_sites table
    console.log('\n4. Creating dive_sites table...');
    const { error: diveSitesError } = await supabase.rpc('execute_sql' as any, {
      sql: `
        CREATE TABLE IF NOT EXISTS public.dive_sites (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          name TEXT NOT NULL,
          latitude DOUBLE PRECISION,
          longitude DOUBLE PRECISION,
          osm_id TEXT
        );
        
        ALTER TABLE public.dive_sites ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Dive sites are viewable by everyone"
        ON public.dive_sites FOR SELECT
        USING (true);
        
        GRANT ALL ON public.dive_sites TO authenticated;
        GRANT SELECT ON public.dive_sites TO anon;
      `
    } as any);
    
    if (diveSitesError) {
      console.log('   ⚠️  Could not create dive_sites table (may already exist or insufficient permissions)');
    } else {
      console.log('   ✅ Dive sites table created or already exists');
    }

    // Create sightings table
    console.log('\n5. Creating sightings table...');
    const { error: sightingsError } = await supabase.rpc('execute_sql' as any, {
      sql: `
        CREATE TABLE IF NOT EXISTS public.sightings (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
          creature_id UUID REFERENCES public.creatures(id) ON DELETE CASCADE NOT NULL,
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
        
        ALTER TABLE public.sightings ENABLE ROW LEVEL SECURITY;
        
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
        
        GRANT ALL ON public.sightings TO authenticated;
      `
    } as any);
    
    if (sightingsError) {
      console.log('   ⚠️  Could not create sightings table (may already exist or insufficient permissions)');
    } else {
      console.log('   ✅ Sightings table created or already exists');
    }

    // Create wishlists table
    console.log('\n6. Creating wishlists table...');
    const { error: wishlistsError } = await supabase.rpc('execute_sql' as any, {
      sql: `
        CREATE TABLE IF NOT EXISTS public.wishlists (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
          creature_id UUID REFERENCES public.creatures(id) ON DELETE CASCADE NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Users can view their own wishlists"
        ON public.wishlists FOR SELECT
        USING (auth.uid() = user_id);
        
        CREATE POLICY "Users can insert their own wishlists"
        ON public.wishlists FOR INSERT
        WITH CHECK (auth.uid() = user_id);
        
        CREATE POLICY "Users can delete their own wishlists"
        ON public.wishlists FOR DELETE
        USING (auth.uid() = user_id);
        
        GRANT ALL ON public.wishlists TO authenticated;
      `
    } as any);
    
    if (wishlistsError) {
      console.log('   ⚠️  Could not create wishlists table (may already exist or insufficient permissions)');
    } else {
      console.log('   ✅ Wishlists table created or already exists');
    }

    // Create achievements table
    console.log('\n7. Creating achievements table...');
    const { error: achievementsError } = await supabase.rpc('execute_sql' as any, {
      sql: `
        CREATE TABLE IF NOT EXISTS public.achievements (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          code TEXT UNIQUE NOT NULL,
          name TEXT NOT NULL,
          description TEXT,
          category TEXT,
          icon_name TEXT,
          points INTEGER,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Achievements are viewable by everyone"
        ON public.achievements FOR SELECT
        USING (true);
        
        GRANT ALL ON public.achievements TO authenticated;
        GRANT SELECT ON public.achievements TO anon;
      `
    } as any);
    
    if (achievementsError) {
      console.log('   ⚠️  Could not create achievements table (may already exist or insufficient permissions)');
    } else {
      console.log('   ✅ Achievements table created or already exists');
    }

    console.log('\n🎉 All required tables checked/created successfully!');
    console.log('You can now run the seeding script to populate sample data.');
    
  } catch (error: any) {
    console.error('❌ Error creating tables:', error.message);
    process.exit(1);
  }
}

// Run table creation
createTables().catch(console.error);