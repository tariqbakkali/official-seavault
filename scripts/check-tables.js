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
  process.exit(1);
}

console.log('🔍 Connecting to Supabase...');
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

async function checkTables() {
  console.log('\n🔍 Checking which tables exist...\n');
  
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
        } else {
          console.log(`⚠️  Table '${table}' exists but got error:`, error.message);
        }
      } else {
        console.log(`✅ Table '${table}' exists`);
      }
    } catch (err) {
      console.log(`❌ Error checking table '${table}':`, err.message);
    }
  }
}

checkTables().catch(console.error);