const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from the project root
const envPath = path.join(__dirname, '..', '.env');
dotenv.config({ path: envPath });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔍 Loading environment variables from:', envPath);

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('Supabase URL:', supabaseUrl ? '✅ Found' : '❌ Missing');
  console.log('Supabase Anon Key:', supabaseAnonKey ? '✅ Found' : '❌ Missing');
  process.exit(1);
}

console.log('🔍 Checking Supabase connectivity...');
console.log('URL:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Tables to check
const tables = [
  'categories',
  'creatures',
  'dive_sites',
  'profiles',
  'sightings',
  'wishlists',
  'achievements'
];

async function verifyTables() {
  console.log('\n🔍 Checking if required tables exist...\n');
  
  let allTablesExist = true;
  
  for (const table of tables) {
    try {
      // Try to select one row from each table to verify it exists
      const { data, error } = await supabase
        .from(table)
        .select('id')
        .limit(1);
      
      if (error) {
        if (error.code === '42P01') { // Undefined table error
          console.log(`❌ Table '${table}' does not exist`);
          allTablesExist = false;
        } else {
          console.log(`⚠️  Table '${table}' exists but got error:`, error.message);
        }
      } else {
        console.log(`✅ Table '${table}' exists`);
      }
    } catch (err) {
      console.log(`❌ Error checking table '${table}':`, err.message);
      allTablesExist = false;
    }
  }
  
  console.log('\n' + '='.repeat(50));
  if (allTablesExist) {
    console.log('🎉 All required tables exist!');
    console.log('✅ Your database is properly configured for SeaVault');
  } else {
    console.log('❌ Some tables are missing');
    console.log('💡 Run "npm run create-minimum-tables" to create them');
  }
  console.log('='.repeat(50));
  
  return allTablesExist;
}

async function main() {
  try {
    await verifyTables();
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    process.exit(1);
  }
}

main();