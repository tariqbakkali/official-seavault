// Simple test script to verify wishlist custom functions
const fs = require('fs');

// Read the syncedObservables.ts file
const fileContent = fs.readFileSync('./stores/syncedObservables.ts', 'utf8');

// Check if our custom functions are properly defined
const hasCreateFunction = fileContent.includes('create: async (input: any) => {');
const hasDeleteFunction = fileContent.includes('delete: async (input: any) => {');

// Look for the Supabase calls with more flexible matching
const lines = fileContent.split('\n');
let hasCustomSupabaseInsert = false;
let hasCustomSupabaseDelete = false;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('create: async (input: any) => {')) {
    // Check next few lines for the insert call
    for (let j = i; j < Math.min(i + 10, lines.length); j++) {
      if (lines[j].includes('.from(') && lines[j].includes('wishlists')) {
        hasCustomSupabaseInsert = true;
        break;
      }
    }
  }
  
  if (lines[i].includes('delete: async (input: any) => {')) {
    // Check next few lines for the delete call
    for (let j = i; j < Math.min(i + 10, lines.length); j++) {
      if (lines[j].includes('.from(') && lines[j].includes('wishlists')) {
        hasCustomSupabaseDelete = true;
        break;
      }
    }
  }
}

console.log('Testing wishlist custom functions implementation...');
console.log('=============================================');

if (hasCreateFunction) {
  console.log('✓ Custom create function found');
} else {
  console.log('✗ Custom create function not found');
}

// Check if custom delete function is removed (which is what we want)
if (!hasDeleteFunction) {
  console.log('✓ Custom delete function correctly removed (using Legend-State soft deletes)');
} else {
  console.log('✗ Custom delete function still present');
}

if (hasCustomSupabaseInsert) {
  console.log('✓ Custom Supabase insert call found');
} else {
  console.log('✗ Custom Supabase insert call not found');
}

// Check if custom Supabase delete is removed (which is what we want)
if (!hasCustomSupabaseDelete) {
  console.log('✓ Custom Supabase delete call correctly removed (using Legend-State soft deletes)');
} else {
  console.log('✗ Custom Supabase delete call still present');
}

// Check if actions property is removed
const wishlistSection = fileContent.split('// Wishlists observable - user-specific')[1].split('// Profile observable - user-specific')[0];
const hasActionsProperty = wishlistSection.includes('actions: [\'read\', \'create\', \'delete\', \'update\']');
if (!hasActionsProperty) {
  console.log('✓ Actions property correctly removed');
} else {
  console.log('✗ Actions property still present');
}

console.log('\nImplementation verification complete.');