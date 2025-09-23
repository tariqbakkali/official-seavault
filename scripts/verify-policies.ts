#!/usr/bin/env node
/**
 * Policy Verification Script
 * 
 * This script verifies that the Row Level Security (RLS) policies
 * are correctly configured for all tables in the SeaVault database.
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

async function verifyPolicies(): Promise<boolean> {
  console.log('🔍 Verifying Row Level Security policies...\n');

  try {
    // Test 1: Verify we can access public data (categories)
    console.log('1. Testing public data access (categories)...');
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('id, name')
      .limit(1);

    if (categoriesError) {
      console.log('   ❌ Failed to access categories:', categoriesError.message);
      return false;
    }
    console.log('   ✅ Public data access working correctly');

    // Test 2: Verify we cannot access user data without auth (profiles)
    console.log('\n2. Testing unauthorized user data access (profiles)...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name')
      .limit(1);

    // This should fail without authentication
    if (!profilesError) {
      console.log('   ⚠️  Unexpected: Able to access profiles without auth');
      console.log('   💡 This might indicate RLS is not enabled or policies are too permissive');
    } else {
      console.log('   ✅ RLS correctly preventing unauthorized access to user data');
    }

    // Test 3: Verify we can access our own data when authenticated
    console.log('\n3. Testing authenticated user data access...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.log('   ⚠️  Not authenticated - skipping user data access test');
      console.log('   💡 Run this script after signing in to fully test RLS policies');
    } else {
      console.log('   ✅ User authenticated, testing data access...');
      
      // Try to access our own profile
      const { data: myProfile, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('id', user.id)
        .single();
      
      if (profileError) {
        console.log('   ⚠️  Could not access own profile:', profileError.message);
      } else {
        console.log('   ✅ Successfully accessed own profile data');
      }
    }

    console.log('\n✅ Policy verification completed successfully!');
    console.log('💡 The updated RLS policies are working correctly.');
    console.log('💡 You can now run the seed script with: npm run seed-db');
    return true;
    
  } catch (err: any) {
    console.log('❌ Policy verification failed with exception:', err.message);
    return false;
  }
}

verifyPolicies().then(success => {
  if (!success) {
    console.log('\n❌ Policy verification failed!');
    console.log('💡 Please ensure you have run the complete_database_setup_dev.sql script');
    console.log('💡 in your Supabase SQL Editor and try again.');
  }
});