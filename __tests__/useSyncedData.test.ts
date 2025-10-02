// Mock the uuid module before importing anything else
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid'),
}));

// Mock Supabase client
jest.mock('../services/supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: {
          user: {
            id: 'test-user-id',
            email: 'test@example.com',
            user_metadata: {
              full_name: 'Test User',
              avatar_url: 'https://example.com/avatar.jpg'
            }
          }
        }
      })
    }
  }
}));

import { renderHook } from '@testing-library/react-hooks';
import { configureLegendState } from '../services/legendStateConfig';
import { useSyncedData } from '../hooks/useSyncedData';
import * as syncedObservables from '../stores/syncedObservables';

// Mock the synced observables
jest.mock('../stores/syncedObservables', () => ({
  ...jest.requireActual('../stores/syncedObservables'),
  categories$: { get: jest.fn(() => ({})), sync: jest.fn().mockReturnThis() },
  creatures$: { get: jest.fn(() => ({})), sync: jest.fn().mockReturnThis() },
  diveSites$: { get: jest.fn(() => ({})), sync: jest.fn().mockReturnThis() },
  sightings$: { get: jest.fn(() => ({})), sync: jest.fn().mockReturnThis() },
  wishlists$: { get: jest.fn(() => ({})), sync: jest.fn().mockReturnThis() },
  profile$: { get: jest.fn(() => ({})), sync: jest.fn().mockReturnThis(), set: jest.fn() },
  achievements$: { get: jest.fn(() => ({})), sync: jest.fn().mockReturnThis() },
  createSighting: jest.fn(),
  createWishlistItem: jest.fn(),
  createDiveSite: jest.fn(),
  removeWishlistItem: jest.fn(),
  toggleWishlistItem: jest.fn(),
  updateUserProfile: jest.fn(),
}));

describe('useSyncedData Hook', () => {
  beforeAll(() => {
    // Configure Legend State
    configureLegendState();
  });

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
  });

  test('should provide all data and functions', () => {
    const { result } = renderHook(() => useSyncedData());
    
    // Check that all data is provided
    expect(result.current.categories).toBeDefined();
    expect(result.current.creatures).toBeDefined();
    expect(result.current.diveSites).toBeDefined();
    expect(result.current.sightings).toBeDefined();
    expect(result.current.wishlists).toBeDefined();
    expect(result.current.profile).toBeDefined();
    expect(result.current.achievements).toBeDefined();
    
    // Check that all functions are provided
    expect(result.current.fetchCatalog).toBeDefined();
    expect(result.current.fetchUserData).toBeDefined();
    expect(result.current.fetchDiveSites).toBeDefined();
    expect(result.current.ensureUserProfile).toBeDefined();
    expect(result.current.createProfileForCurrentUser).toBeDefined();
    expect(result.current.createSighting).toBeDefined();
    expect(result.current.createWishlistItem).toBeDefined();
    expect(result.current.createDiveSite).toBeDefined();
    expect(result.current.removeWishlistItem).toBeDefined();
    expect(result.current.toggleWishlistItem).toBeDefined();
    expect(result.current.updateUserProfile).toBeDefined();
  });

  test('should call fetch functions', async () => {
    const { result } = renderHook(() => useSyncedData());
    
    // Mock the load function
    const mockLoad = jest.fn().mockResolvedValue(undefined);
    syncedObservables.categories$.sync.mockReturnValue({ load: mockLoad });
    syncedObservables.creatures$.sync.mockReturnValue({ load: mockLoad });
    syncedObservables.achievements$.sync.mockReturnValue({ load: mockLoad });
    syncedObservables.profile$.sync.mockReturnValue({ load: mockLoad });
    syncedObservables.sightings$.sync.mockReturnValue({ load: mockLoad });
    syncedObservables.wishlists$.sync.mockReturnValue({ load: mockLoad });
    syncedObservables.diveSites$.sync.mockReturnValue({ load: mockLoad });
    
    // Call fetch functions
    await result.current.fetchCatalog();
    await result.current.fetchUserData();
    await result.current.fetchDiveSites();
    
    // Verify that the load functions were called
    expect(mockLoad).toHaveBeenCalledTimes(9); // 3 for catalog, 3 for user data, 1 for dive sites
  });
});