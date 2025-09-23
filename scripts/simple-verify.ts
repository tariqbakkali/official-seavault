#!/usr/bin/env node
/**
 * Simple Database Verification Script
 * 
 * This script checks if the essential Supabase tables exist
 * and are accessible with the current configuration.
 */

import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/database';

// Load environment variables
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔍 Checking Supabase configuration...');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Please ensure EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY are set in your .env file');
  process.exit(1);
}

console.log('✅ Supabase environment variables found');
console.log('🌐 Supabase URL:', supabaseUrl);

// Create Supabase client
const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

async function verifyDatabase() {
  console.log('\n🔍 Verifying database connectivity...\n');

  try {
    // Test 1: Check if we can connect to Supabase
    console.log('1. Testing basic connectivity...');
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('❌ Error connecting to database:', error.message);
      if (error.message.includes('relation') || error.message.includes('table')) {
        console.log('💡 This likely means the required tables have not been created yet.');
        console.log('💡 Please run the database migrations or create the tables manually.');
      }
      return false;
    } else {
      console.log('✅ Database connection successful');
    }
  } catch (error) {
    console.error('❌ Error connecting to database:', error);
    return false;
  }

  // Test 2: Check each required table
  const tables = [
    'profiles',
    'categories',
    'creatures',
    'dive_sites',
    'sightings',
    'wishlists',
    'achievements'
  ];

  console.log('\n2. Checking required tables...');
  let allTablesExist = true;

  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('id')
        .limit(1);
      
      if (error) {
        console.log(`❌ Table '${table}' not accessible:`, error.message);
        allTablesExist = false;
      } else {
        console.log(`✅ Table '${table}' exists and is accessible`);
      }
    } catch (error) {
      console.log(`❌ Error checking table '${table}':`, error);
      allTablesExist = false;
    }
  }

  if (allTablesExist) {
    console.log('\n🎉 All required tables exist and are accessible!');
    console.log('✅ Your database is properly configured for SeaVault.');
    return true;
  } else {
    console.log('\n❌ Some tables are missing or not accessible.');
    console.log('💡 Please run the database migrations or create the missing tables.');
    return false;
  }
}

// Run verification
verifyDatabase().then(success => {
  if (success) {
    console.log('\n✅ Database verification completed successfully!');
    console.log('You can now run your SeaVault application.');
  } else {
    console.log('\n❌ Database verification failed.');
    console.log('Please check the errors above and fix your database configuration.');
    process.exit(1);
  }
}).catch(error => {
  console.error('Unexpected error during verification:', error);
  process.exit(1);
});