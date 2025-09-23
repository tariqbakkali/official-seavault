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
  console.log('\n🔍 Verifying database setup...\n');
  
  try {
    // Test 1: Check if we can select from categories (should work)
    console.log('📝 Test 1: Checking if categories table exists and is readable...');
    const { data: selectData, error: selectError } = await supabase
      .from('categories')
      .select('id')
      .limit(1);
    
    if (selectError && selectError.message.includes('Could not find the table')) {
      console.log('❌ Categories table does not exist');
      console.log('💡 Please run the complete_database_setup_dev.sql script in your Supabase SQL Editor');
      return false;
    } else if (selectError) {
      console.log('⚠️  Categories table exists but got error:', selectError.message);
    } else {
      console.log('✅ Categories table exists and is accessible');
    }
    
    // Test 2: Try a simple insert without complex policy checks
    console.log('\n📝 Test 2: Checking if we can insert into categories...');
    const testCategory = {
      name: 'Policy Verification Test',
      image_url: 'https://example.com/test.jpg'
    };
    
    // First try to insert
    const { data: insertData, error: insertError } = await supabase
      .from('categories')
      .insert(testCategory)
      .select();
    
    if (insertError) {
      console.log('❌ INSERT test failed:', insertError.message);
      if (insertError.message.includes('permission denied') || insertError.message.includes('row-level security')) {
        console.log('💡 This indicates RLS policies are in place but may be too restrictive');
        console.log('💡 Please run the complete_database_setup_dev.sql script in your Supabase SQL Editor');
      }
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
    
    console.log('\n🎉 Database verification completed successfully!');
    console.log('💡 The database setup is working correctly.');
    console.log('💡 You can now run the seed script with: npm run seed-db');
    return true;
    
  } catch (err) {
    console.log('❌ Database verification failed with exception:', err.message);
    return false;
  }
}

verifyPolicies().then(success => {
  if (!success) {
    console.log('\n❌ Database verification failed!');
    console.log('💡 Please ensure you have run the complete_database_setup_dev.sql script');
    console.log('💡 in your Supabase SQL Editor and try again.');
  }
});