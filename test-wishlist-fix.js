// Simple test script to verify wishlist functionality
const { wishlists$, createWishlistItem, removeWishlistItem, toggleWishlistItem, setCurrentUserID } = require('./stores/syncedObservables');

// Mock the uuid function
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid'),
}));

console.log('Testing wishlist functionality fix...');

// Set a mock user ID
setCurrentUserID('mock-user-id');
console.log('Set user ID to mock-user-id');

// Create a wishlist item
console.log('Creating wishlist item...');
createWishlistItem('mock-creature-id');

// Get the current wishlists
const currentWishlists = wishlists$.get();
console.log('Current wishlists:', currentWishlists);

// Check that the wishlist item was created
if (currentWishlists && currentWishlists['mock-uuid']) {
  console.log('✓ Wishlist item created successfully');
  console.log('Item details:', currentWishlists['mock-uuid']);
} else {
  console.log('✗ Failed to create wishlist item');
}

// Remove the wishlist item
console.log('Removing wishlist item...');
removeWishlistItem('mock-uuid');

// Get the current wishlists after removal
const wishlistsAfterRemoval = wishlists$.get();
console.log('Wishlists after removal:', wishlistsAfterRemoval);

// Check that the wishlist item was removed
if (wishlistsAfterRemoval && Object.keys(wishlistsAfterRemoval).length === 0) {
  console.log('✓ Wishlist item removed successfully');
} else {
  console.log('✗ Failed to remove wishlist item');
}

// Clear the user ID
setCurrentUserID(null);
console.log('Cleared user ID');

console.log('Test completed.');