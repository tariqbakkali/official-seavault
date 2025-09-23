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

async function testInsert() {
  console.log('\n🔍 Testing category insertion...\n');
  
  try {
    // Try to insert a test category
    const { data, error } = await supabase
      .from('categories')
      .insert({
        name: 'Test Category',
        image_url: 'https://example.com/test.jpg'
      })
      .select();
    
    if (error) {
      console.log('❌ Insert test failed:', error.message);
      return false;
    } else {
      console.log('✅ Insert test successful - category created');
      console.log('📝 Created category:', data[0]);
      
      // Clean up - delete the test category
      const { error: deleteError } = await supabase
        .from('categories')
        .delete()
        .eq('id', data[0].id);
      
      if (deleteError) {
        console.log('⚠️  Could not clean up test category:', deleteError.message);
      } else {
        console.log('✅ Test category cleaned up');
      }
      
      return true;
    }
  } catch (err) {
    console.log('❌ Insert test failed with exception:', err.message);
    return false;
  }
}

testInsert().then(success => {
  if (success) {
    console.log('\n🎉 Category insertion is working!');
    console.log('💡 You can now run the seed script with: npm run seed-db');
  } else {
    console.log('\n❌ Category insertion failed!');
    console.log('💡 Please run the complete database setup script in your Supabase SQL Editor');
    console.log('💡 Script location: supabase/complete_database_setup_dev.sql');
  }
});