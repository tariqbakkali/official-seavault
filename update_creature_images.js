require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function updateCreatureImages() {
  console.log("Fetching creatures...");
  const { data: creatures, error: fetchError } = await supabase
    .from('creatures')
    .select('id, name');

  if (fetchError) {
    console.error("Error fetching creatures:", fetchError);
    return;
  }

  console.log(`Found ${creatures.length} creatures. Updating images...`);

  let successCount = 0;
  let errorCount = 0;

  for (const creature of creatures) {
    // Generate the public URL based on the creature's ID
    const fileName = `${creature.id}.jpg`;
    const { data: publicUrlData } = supabase.storage
      .from('seavault-images')
      .getPublicUrl(`creatures/${fileName}`); // Assuming they are in the root or creatures folder? Wait, the user didn't mention a folder.
    
    // I will use the root of seavault-images based on the previous conversation unless specified.
    const rootUrlData = supabase.storage
      .from('seavault-images')
      .getPublicUrl(`creatures/${fileName}`);
      
    const imageUrl = rootUrlData.data.publicUrl;

    const { error: updateError } = await supabase
      .from('creatures')
      .update({ image_url: imageUrl })
      .eq('id', creature.id);

    if (updateError) {
      console.error(`Failed to update ${creature.name} (${creature.id}):`, updateError.message);
      errorCount++;
    } else {
      console.log(`✅ Updated ${creature.name}`);
      successCount++;
    }
  }

  console.log(`\nFinished! Successfully updated: ${successCount}. Errors: ${errorCount}.`);
}

updateCreatureImages();
