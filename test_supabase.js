require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  console.log("Testing Supabase Connection...");
  console.log("URL:", supabaseUrl);
  
  try {
    // Check connection by getting session or a simple auth call
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error("❌ Connection error:", error.message);
    } else {
      console.log("✅ Successfully connected to Supabase!");
      console.log("Session data retrieved (should be null for fresh client):", data.session);
    }
  } catch (err) {
    console.error("❌ Failed to connect:", err.message);
  }
}

testConnection();
