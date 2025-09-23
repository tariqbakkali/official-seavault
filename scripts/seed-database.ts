#!/usr/bin/env node
/**
 * Database Seeding Script
 * 
 * This script populates the Supabase database with sample data
 * for testing and development purposes.
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

// Sample data
const sampleCategories: any[] = [
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

const sampleCreatures: any[] = [
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

const sampleDiveSites: any[] = [
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

const sampleAchievements: any[] = [
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
    // Insert categories
    console.log('📝 Inserting categories...');
    const { data: categoriesData, error: categoriesError } = await supabase
      .from('categories')
      .insert(sampleCategories as any)
      .select();
    
    if (categoriesError) {
      console.error('❌ Error inserting categories:', categoriesError.message);
      return;
    }
    
    console.log(`✅ Inserted ${categoriesData?.length || 0} categories`);
    
    // Update creatures with category IDs
    if (categoriesData && categoriesData.length >= 4) {
      sampleCreatures[0].category_id = (categoriesData as any)[0].id; // Sharks
      sampleCreatures[1].category_id = (categoriesData as any)[1].id; // Whales
      sampleCreatures[2].category_id = (categoriesData as any)[2].id; // Dolphins
      sampleCreatures[3].category_id = (categoriesData as any)[3].id; // Turtles
    }

    // Insert creatures
    console.log('\n📝 Inserting creatures...');
    const { data: creaturesData, error: creaturesError } = await supabase
      .from('creatures')
      .insert(sampleCreatures as any)
      .select();
    
    if (creaturesError) {
      console.error('❌ Error inserting creatures:', creaturesError.message);
      return;
    }
    
    console.log(`✅ Inserted ${creaturesData?.length || 0} creatures`);

    // Insert dive sites
    console.log('\n📝 Inserting dive sites...');
    const { data: diveSitesData, error: diveSitesError } = await supabase
      .from('dive_sites')
      .insert(sampleDiveSites as any)
      .select();
    
    if (diveSitesError) {
      console.error('❌ Error inserting dive sites:', diveSitesError.message);
      return;
    }
    
    console.log(`✅ Inserted ${diveSitesData?.length || 0} dive sites`);

    // Insert achievements
    console.log('\n📝 Inserting achievements...');
    const { data: achievementsData, error: achievementsError } = await supabase
      .from('achievements')
      .insert(sampleAchievements as any)
      .select();
    
    if (achievementsError) {
      console.error('❌ Error inserting achievements:', achievementsError.message);
      return;
    }
    
    console.log(`✅ Inserted ${achievementsData?.length || 0} achievements`);

    console.log('\n🎉 Database seeding complete!');
    console.log('You now have sample data to test your application.');
    
  } catch (error: any) {
    console.error('❌ Error seeding database:', error.message);
  }
}

// Run seeding
seedDatabase().catch(console.error);