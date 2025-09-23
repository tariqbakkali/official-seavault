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

async function verifyPolicies() {
  console.log('\n🔍 Verifying updated RLS policies...\n');
  
  try {
    // Test 1: Check if we can select from categories (should work)
    console.log('📝 Test 1: Checking SELECT permission on categories...');
    const { data: selectData, error: selectError } = await supabase
      .from('categories')
      .select('id')
      .limit(1);
    
    if (selectError) {
      console.log('❌ SELECT test failed:', selectError.message);
      return false;
    } else {
      console.log('✅ SELECT test passed - can read from categories');
    }
    
    // Test 2: Try to insert a category (should work with updated policies)
    console.log('\n📝 Test 2: Checking INSERT permission on categories...');
    const { data: insertData, error: insertError } = await supabase
      .from('categories')
      .insert({
        name: 'Policy Verification Test',
        image_url: 'https://example.com/test.jpg'
      })
      .select();
    
    if (insertError) {
      console.log('❌ INSERT test failed:', insertError.message);
      return false;
    } else {
      console.log('✅ INSERT test passed - can insert into categories');
      console.log('📝 Created test category with ID:', insertData[0].id);
      
      // Clean up - delete the test category
      const { error: deleteError } = await supabase
        .from('categories')
        .delete()
        .eq('id', insertData[0].id);
      
      if (deleteError) {
        console.log('⚠️  Could not clean up test category:', deleteError.message);
      } else {
        console.log('✅ Test category cleaned up successfully');
      }
    }
    
    console.log('\n🎉 All policy tests passed!');
    console.log('💡 The updated RLS policies are working correctly.');
    console.log('💡 You can now run the seed script with: npm run seed-db');
    return true;
    
  } catch (err) {
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