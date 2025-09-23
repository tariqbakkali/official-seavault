#!/usr/bin/env node
/**
 * Database Verification Script
 * 
 * This script verifies that the Supabase database is properly configured
 * with all required tables and relationships.
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

// Create Supabase client
const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

async function verifyDatabase() {
  console.log('🔍 Verifying Supabase database configuration...\n');

  // Check 1: Verify profiles table
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('❌ Error accessing profiles table:', error.message);
    } else {
      console.log('✅ Profiles table exists and is accessible');
    }
  } catch (error) {
    console.error('❌ Error accessing profiles table:', error);
  }

  // Check 2: Verify categories table
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('❌ Error accessing categories table:', error.message);
    } else {
      console.log('✅ Categories table exists and is accessible');
    }
  } catch (error) {
    console.error('❌ Error accessing categories table:', error);
  }

  // Check 3: Verify creatures table
  try {
    const { data, error } = await supabase
      .from('creatures')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('❌ Error accessing creatures table:', error.message);
    } else {
      console.log('✅ Creatures table exists and is accessible');
    }
  } catch (error) {
    console.error('❌ Error accessing creatures table:', error);
  }

  // Check 4: Verify dive_sites table
  try {
    const { data, error } = await supabase
      .from('dive_sites')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('❌ Error accessing dive_sites table:', error.message);
    } else {
      console.log('✅ Dive sites table exists and is accessible');
    }
  } catch (error) {
    console.error('❌ Error accessing dive_sites table:', error);
  }

  // Check 5: Verify sightings table
  try {
    const { data, error } = await supabase
      .from('sightings')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('❌ Error accessing sightings table:', error.message);
    } else {
      console.log('✅ Sightings table exists and is accessible');
    }
  } catch (error) {
    console.error('❌ Error accessing sightings table:', error);
  }

  // Check 6: Verify wishlists table
  try {
    const { data, error } = await supabase
      .from('wishlists')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('❌ Error accessing wishlists table:', error.message);
    } else {
      console.log('✅ Wishlists table exists and is accessible');
    }
  } catch (error) {
    console.error('❌ Error accessing wishlists table:', error);
  }

  // Check 7: Verify achievements table
  try {
    const { data, error } = await supabase
      .from('achievements')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('❌ Error accessing achievements table:', error.message);
    } else {
      console.log('✅ Achievements table exists and is accessible');
    }
  } catch (error) {
    console.error('❌ Error accessing achievements table:', error);
  }

  // Check 8: Verify user_achievements table
  try {
    const { data, error } = await supabase
      .from('user_achievements')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('❌ Error accessing user_achievements table:', error.message);
    } else {
      console.log('✅ User achievements table exists and is accessible');
    }
  } catch (error) {
    console.error('❌ Error accessing user_achievements table:', error);
  }

  // Check 9: Verify auth trigger
  try {
    console.log('\n🔍 Checking auth trigger...');
    console.log('ℹ️  To verify the auth trigger, try creating a new user and check if a profile is automatically created');
  } catch (error) {
    console.error('❌ Error checking auth trigger:', error);
  }

  console.log('\n📋 Verification complete!');
  console.log('If all checks passed, your database is properly configured.');
  console.log('If any checks failed, please review the error messages and ensure all migrations have been applied.');
}

// Run verification
verifyDatabase().catch(console.error);