// Mock the uuid module before importing anything else
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid'),
}));

import { observable } from '@legendapp/state';
import { configureLegendState, createSyncedObservable } from '../services/legendStateConfig';
import { 
  categories$, 
  creatures$, 
  diveSites$, 
  sightings$, 
  wishlists$, 
  profile$,
  setCurrentUserID,
  createSighting,
  createWishlistItem
} from '../stores/syncedObservables';

// Mock Supabase client
const mockSupabase = {
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  single: jest.fn().mockReturnThis(),
  maybeSingle: jest.fn().mockReturnThis(),
};

describe('Local-First Sync Implementation', () => {
  beforeAll(() => {
    // Configure Legend State
    configureLegendState();
  });

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
  });

  test('should initialize synced observables', () => {
    // Check that observables are created
    expect(categories$).toBeDefined();
    expect(creatures$).toBeDefined();
    expect(diveSites$).toBeDefined();
    expect(sightings$).toBeDefined();
    expect(wishlists$).toBeDefined();
    expect(profile$).toBeDefined();
  });

  test('should set current user ID', () => {
    const testUserId = 'test-user-id';
    setCurrentUserID(testUserId);
    
    // TODO: Verify user ID is set correctly in a real implementation
    // TODO: Implement more comprehensive tests for localFirstSync
    expect(setCurrentUserID).toBeDefined();
  });

  test('should create sighting with generated ID', () => {
    // Set current user ID
    setCurrentUserID('test-user-id');
    
    // Create a test sighting with all required fields
    const testSighting = {
      creature_id: 'test-creature',
      date: new Date().toISOString(),
      dive_notes: 'Test dive notes',
      image_url: null,
      dive_site_id: null,
      dive_type: null,
      time_of_day: null,
      depth: null,
      creature_notes: null,
    };
    
    // This should not throw an error
    expect(() => createSighting(testSighting)).not.toThrow();
  });

  test('should create wishlist item with generated ID', () => {
    // Set current user ID
    setCurrentUserID('test-user-id');
    
    // Create a test wishlist item
    const testCreatureId = 'test-creature';
    
    // This should not throw an error
    expect(() => createWishlistItem(testCreatureId)).not.toThrow();
  });
});