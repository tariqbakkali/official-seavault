require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function updateCategoryImages() {
  console.log("Fetching categories...");
  const { data: categories, error: fetchError } = await supabase
    .from('categories')
    .select('id, name');

  if (fetchError) {
    console.error("Error fetching categories:", fetchError);
    return;
  }

  console.log(`Found ${categories.length} categories. Updating images...`);

  let successCount = 0;
  let errorCount = 0;

  for (const category of categories) {
    const fileName = `${category.id}.jpg`;
    
    const rootUrlData = supabase.storage
      .from('seavault-images')
      .getPublicUrl(`categories/${fileName}`);
      
    const imageUrl = rootUrlData.data.publicUrl;

    const { error: updateError } = await supabase
      .from('categories')
      .update({ image_url: imageUrl })
      .eq('id', category.id);

    if (updateError) {
      console.error(`Failed to update ${category.name} (${category.id}):`, updateError.message);
      errorCount++;
    } else {
      console.log(`✅ Updated ${category.name}`);
      successCount++;
    }
  }

  console.log(`\nFinished! Successfully updated: ${successCount}. Errors: ${errorCount}.`);
}

updateCategoryImages();
