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

async function testConnection() {
  console.log('\n🔍 Testing database connection...\n');
  
  try {
    // Test if we can access the database at all
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);
    
    if (error) {
      console.log('❌ Connection test failed:', error.message);
      return false;
    } else {
      console.log('✅ Connection test successful - profiles table is accessible');
      return true;
    }
  } catch (err) {
    console.log('❌ Connection test failed with exception:', err.message);
    return false;
  }
}

testConnection().then(success => {
  if (success) {
    console.log('\n🎉 Database connection is working!');
    console.log('💡 Next steps:');
    console.log('1. Run the complete database setup script in your Supabase SQL Editor');
    console.log('2. The script is located at: supabase/complete_database_setup.sql');
    console.log('3. After running the script, you can seed the database with sample data');
  } else {
    console.log('\n❌ Database connection failed!');
    console.log('💡 Please check your Supabase credentials in the .env file');
  }
});