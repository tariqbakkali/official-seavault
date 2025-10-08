import { wishlists$, createWishlistItem, removeWishlistItem, toggleWishlistItem, setCurrentUserID } from '../stores/syncedObservables';

// Mock the uuid module
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid'),
}));

describe('Wishlist Functionality Fix', () => {
  beforeEach(() => {
    // Set a mock user ID
    setCurrentUserID('mock-user-id');
    
    // Clear the wishlists observable
    wishlists$.set({});
  });

  afterEach(() => {
    // Clear the user ID
    setCurrentUserID(null);
  });

  test('should create wishlist item with custom create function', () => {
    // Create a wishlist item
    createWishlistItem('mock-creature-id');
    
    // Get the current wishlists
    const currentWishlists = wishlists$.get();
    
    // Check that the wishlist item was created
    expect(currentWishlists).toHaveProperty('mock-uuid');
    expect(currentWishlists['mock-uuid']).toEqual({
      id: 'mock-uuid',
      user_id: 'mock-user-id',
      creature_id: 'mock-creature-id',
      created_at: expect.any(String),
    });
  });

  test('should remove wishlist item with custom delete function', () => {
    // Create a wishlist item first
    createWishlistItem('mock-creature-id');
    
    // Remove the wishlist item
    removeWishlistItem('mock-uuid');
    
    // Get the current wishlists
    const currentWishlists = wishlists$.get();
    
    // Check that the wishlist item was removed
    expect(currentWishlists).toEqual({});
  });

  test('should toggle wishlist item', async () => {
    // Initially toggle should add the item
    const added = await toggleWishlistItem('mock-creature-id');
    expect(added).toBe(true);
    
    // Get the current wishlists
    const currentWishlists = wishlists$.get();
    expect(currentWishlists).toHaveProperty('mock-uuid');
    
    // Toggle again should remove the item
    const removed = await toggleWishlistItem('mock-creature-id');
    expect(removed).toBe(false);
    
    // Check that the wishlist item was removed
    const finalWishlists = wishlists$.get();
    expect(finalWishlists).toEqual({});
  });
});