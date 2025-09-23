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

// Sample data
const sampleCategories = [
  {
    name: 'Sharks',
    image_url: 'https://images.unsplash.com/photo-1524260749402-63abbd8775e2?w=400'
  },
  {
    name: 'Whales',
    image_url: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=400'
  },
  {
    name: 'Dolphins',
    image_url: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=400'
  },
  {
    name: 'Turtles',
    image_url: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=400'
  }
];

const sampleCreatures = [
  {
    creature_id: 'great-white-001',
    name: 'Great White Shark',
    scientific_name: 'Carcharodon carcharias',
    category_id: '', // Will be filled after categories are inserted
    points: 100,
    description: 'The great white shark is a large shark found in coastal surface waters in all major oceans.',
    habitat: 'Coastal and offshore waters',
    diet: 'Fish, seals, sea lions',
    depth_range: 'Surface to 1,200m',
    length: '4.6-6.1m',
    weight: '1,905-2,268kg',
    lifespan: '70+ years',
    image_url: 'https://images.unsplash.com/photo-1524260749402-63abbd8775e2?w=400',
    class: 'Sharks'
  },
  {
    creature_id: 'blue-whale-001',
    name: 'Blue Whale',
    scientific_name: 'Balaenoptera musculus',
    category_id: '', // Will be filled after categories are inserted
    points: 150,
    description: 'The blue whale is a marine mammal and the largest animal known to have ever existed.',
    habitat: 'Open oceans worldwide',
    diet: 'Krill',
    depth_range: 'Surface to 500m',
    length: '24-30m',
    weight: '100-150 tons',
    lifespan: '80-90 years',
    image_url: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=400',
    class: 'Whales'
  },
  {
    creature_id: 'bottlenose-001',
    name: 'Bottlenose Dolphin',
    scientific_name: 'Tursiops truncatus',
    category_id: '', // Will be filled after categories are inserted
    points: 75,
    description: 'Bottlenose dolphins are the most well-known members of the dolphin family.',
    habitat: 'Tropical and temperate oceans',
    diet: 'Fish, squid',
    depth_range: 'Surface to 300m',
    length: '2-4m',
    weight: '150-650kg',
    lifespan: '40-50 years',
    image_url: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=400',
    class: 'Dolphins'
  },
  {
    creature_id: 'leatherback-001',
    name: 'Leatherback Sea Turtle',
    scientific_name: 'Dermochelys coriacea',
    category_id: '', // Will be filled after categories are inserted
    points: 80,
    description: 'The leatherback sea turtle is the largest living turtle and the heaviest non-crocodilian reptile.',
    habitat: 'Open ocean',
    diet: 'Jellyfish',
    depth_range: 'Surface to 1,280m',
    length: '1.5-2m',
    weight: '250-700kg',
    lifespan: '45-50 years',
    image_url: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=400',
    class: 'Turtles'
  }
];

const sampleDiveSites = [
  {
    name: 'Great Barrier Reef',
    latitude: -18.2871,
    longitude: 147.6992,
    osm_id: 'great-barrier-reef'
  },
  {
    name: 'Belize Barrier Reef',
    latitude: 17.3437,
    longitude: -87.5426,
    osm_id: 'belize-barrier-reef'
  },
  {
    name: 'Red Sea Coral Reef',
    latitude: 24.3875,
    longitude: 35.5444,
    osm_id: 'red-sea-coral-reef'
  }
];

const sampleAchievements = [
  {
    code: 'first_catch',
    name: 'First Catch',
    description: 'Log your first creature sighting',
    category: 'progress',
    icon_name: 'trophy',
    points: 10
  },
  {
    code: 'getting_feet_wet',
    name: 'Getting Your Feet Wet',
    description: 'Log 5 creature sightings',
    category: 'progress',
    icon_name: 'award',
    points: 25
  },
  {
    code: 'underwater_explorer',
    name: 'Underwater Explorer',
    description: 'Log 10 creature sightings',
    category: 'progress',
    icon_name: 'compass',
    points: 50
  },
  {
    code: 'marine_enthusiast',
    name: 'Marine Enthusiast',
    description: 'Log 25 creature sightings',
    category: 'progress',
    icon_name: 'star',
    points: 100
  }
];

async function seedDatabase() {
  console.log('🌱 Seeding database with sample data...\n');

  try {
    // Insert categories only if they don't already exist
    console.log('📝 Checking if categories already exist...');
    const { data: existingCategories, error: checkCategoriesError } = await supabase
      .from('categories')
      .select('id')
      .limit(1);
    
    if (checkCategoriesError) {
      console.error('❌ Error checking categories:', checkCategoriesError.message);
      return;
    }
    
    if (existingCategories && existingCategories.length > 0) {
      console.log('✅ Categories already exist, skipping insertion');
    } else {
      console.log('📝 Inserting categories...');
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .insert(sampleCategories)
        .select();
      
      if (categoriesError) {
        console.error('❌ Error inserting categories:', categoriesError.message);
        return;
      }
      
      console.log(`✅ Inserted ${categoriesData?.length || 0} categories`);
      
      // Update creatures with category IDs
      if (categoriesData && categoriesData.length >= 4) {
        sampleCreatures[0].category_id = categoriesData[0].id; // Sharks
        sampleCreatures[1].category_id = categoriesData[1].id; // Whales
        sampleCreatures[2].category_id = categoriesData[2].id; // Dolphins
        sampleCreatures[3].category_id = categoriesData[3].id; // Turtles
      }
    }

    // Insert creatures only if they don't already exist
    console.log('📝 Checking if creatures already exist...');
    const { data: existingCreatures, error: checkCreaturesError } = await supabase
      .from('creatures')
      .select('id')
      .limit(1);
    
    if (checkCreaturesError) {
      console.error('❌ Error checking creatures:', checkCreaturesError.message);
      return;
    }
    
    if (existingCreatures && existingCreatures.length > 0) {
      console.log('✅ Creatures already exist, skipping insertion');
    } else {
      // Get categories data to update creature category IDs
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('id');
      
      if (categoriesError) {
        console.error('❌ Error fetching categories:', categoriesError.message);
        return;
      }
      
      // Update creatures with category IDs
      if (categoriesData && categoriesData.length >= 4) {
        sampleCreatures[0].category_id = categoriesData[0].id; // Sharks
        sampleCreatures[1].category_id = categoriesData[1].id; // Whales
        sampleCreatures[2].category_id = categoriesData[2].id; // Dolphins
        sampleCreatures[3].category_id = categoriesData[3].id; // Turtles
      }
      
      console.log('\n📝 Inserting creatures...');
      const { data: creaturesData, error: creaturesError } = await supabase
        .from('creatures')
        .insert(sampleCreatures)
        .select();
      
      if (creaturesError) {
        console.error('❌ Error inserting creatures:', creaturesError.message);
        return;
      }
      
      console.log(`✅ Inserted ${creaturesData?.length || 0} creatures`);
    }

    // Insert dive sites only if they don't already exist
    console.log('\n📝 Checking if dive sites already exist...');
    const { data: existingDiveSites, error: checkDiveSitesError } = await supabase
      .from('dive_sites')
      .select('id')
      .limit(1);
    
    if (checkDiveSitesError) {
      console.error('❌ Error checking dive sites:', checkDiveSitesError.message);
      return;
    }
    
    if (existingDiveSites && existingDiveSites.length > 0) {
      console.log('✅ Dive sites already exist, skipping insertion');
    } else {
      console.log('\n📝 Inserting dive sites...');
      const { data: diveSitesData, error: diveSitesError } = await supabase
        .from('dive_sites')
        .insert(sampleDiveSites)
        .select();
      
      if (diveSitesError) {
        console.error('❌ Error inserting dive sites:', diveSitesError.message);
        return;
      }
      
      console.log(`✅ Inserted ${diveSitesData?.length || 0} dive sites`);
    }

    // Insert achievements only if they don't already exist
    console.log('\n📝 Checking if achievements already exist...');
    const { data: existingAchievements, error: checkAchievementsError } = await supabase
      .from('achievements')
      .select('id')
      .limit(1);
    
    if (checkAchievementsError) {
      console.error('❌ Error checking achievements:', checkAchievementsError.message);
      return;
    }
    
    if (existingAchievements && existingAchievements.length > 0) {
      console.log('✅ Achievements already exist, skipping insertion');
    } else {
      console.log('\n📝 Inserting achievements...');
      const { data: achievementsData, error: achievementsError } = await supabase
        .from('achievements')
        .insert(sampleAchievements)
        .select();
      
      if (achievementsError) {
        console.error('❌ Error inserting achievements:', achievementsError.message);
        return;
      }
      
      console.log(`✅ Inserted ${achievementsData?.length || 0} achievements`);
    }

    console.log('\n🎉 Database seeding complete!');
    console.log('You now have sample data to test your application.');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
  }
}

// Run seeding
seedDatabase().catch(console.error);