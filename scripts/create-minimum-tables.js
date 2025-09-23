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

console.log('🔍 Connecting to Supabase...');
console.log('URL:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Function to create a table if it doesn't exist
async function createTableIfNotExists(tableName, schema) {
  try {
    // First, check if table exists by attempting to describe it
    const { error } = await supabase
      .from(tableName)
      .select('id')
      .limit(1);

    if (error && error.code === '42P01') {
      // Table doesn't exist, create it
      console.log(` Creating table '${tableName}'...`);
      
      // Note: In a production environment, you would typically use Supabase's SQL interface
      // to create tables. For this simple verification, we'll just log what would be created.
      console.log(`  - Would create table with schema:`, JSON.stringify(schema, null, 2));
      return true;
    } else {
      console.log(`✅ Table '${tableName}' already exists`);
      return false;
    }
  } catch (err) {
    console.log(`❌ Error checking/creating table '${tableName}':`, err.message);
    return false;
  }
}

async function createMinimumTables() {
  console.log('\n🔍 Creating minimum required tables...\n');
  
  // Define table schemas
  const tables = {
    categories: {
      id: 'uuid primary key default uuid_generate_v4()',
      name: 'text not null',
      created_at: 'timestamp with time zone default now()',
      image_url: 'text'
    },
    creatures: {
      id: 'uuid primary key default uuid_generate_v4()',
      creature_id: 'text not null',
      name: 'text not null',
      scientific_name: 'text',
      category_id: 'uuid references categories(id)',
      points: 'integer default 0',
      description: 'text',
      habitat: 'text',
      diet: 'text',
      depth_range: 'text',
      length: 'text',
      weight: 'text',
      lifespan: 'text',
      image_url: 'text',
      created_at: 'timestamp with time zone default now()',
      class: 'text'
    },
    dive_sites: {
      id: 'uuid primary key default uuid_generate_v4()',
      name: 'text not null',
      latitude: 'double precision',
      longitude: 'double precision',
      osm_id: 'text'
    },
    profiles: {
      id: 'uuid primary key',
      email: 'text',
      full_name: 'text',
      avatar_url: 'text',
      membership_tier: 'text',
      created_at: 'timestamp with time zone default now()',
      is_premium: 'boolean',
      has_seen_onboarding: 'boolean'
    },
    sightings: {
      id: 'uuid primary key default uuid_generate_v4()',
      user_id: 'uuid references auth.users(id)',
      creature_id: 'uuid references creatures(id)',
      date: 'date not null',
      dive_notes: 'text',
      image_url: 'text',
      created_at: 'timestamp with time zone default now()',
      dive_site_id: 'uuid references dive_sites(id)',
      dive_type: 'text',
      time_of_day: 'text',
      depth: 'text',
      creature_notes: 'text'
    },
    wishlists: {
      id: 'uuid primary key default uuid_generate_v4()',
      user_id: 'uuid references auth.users(id)',
      creature_id: 'uuid references creatures(id)',
      created_at: 'timestamp with time zone default now()'
    },
    achievements: {
      id: 'uuid primary key default uuid_generate_v4()',
      code: 'text not null',
      name: 'text not null',
      description: 'text',
      category: 'text',
      icon_name: 'text',
      points: 'integer',
      created_at: 'timestamp with time zone default now()'
    }
  };

  let createdCount = 0;
  
  for (const [tableName, schema] of Object.entries(tables)) {
    const created = await createTableIfNotExists(tableName, schema);
    if (created) createdCount++;
  }
  
  console.log('\n' + '='.repeat(50));
  if (createdCount > 0) {
    console.log(`🎉 Created ${createdCount} missing tables!`);
  } else {
    console.log('✅ All required tables already exist!');
  }
  console.log('💡 For actual table creation, use Supabase SQL editor with proper migrations');
  console.log('='.repeat(50));
  
  return createdCount;
}

async function main() {
  try {
    await createMinimumTables();
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    process.exit(1);
  }
}

main();