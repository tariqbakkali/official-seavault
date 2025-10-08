import { v4 as uuidv4 } from 'uuid';

// Mock Supabase client
const mockSupabase = {
  from: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  single: jest.fn().mockReturnThis(),
};

jest.mock('../services/supabase', () => ({
  supabase: mockSupabase
}));

// Mock uuid
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid'),
}));

import { wishlists$, setCurrentUserID } from '../stores/syncedObservables';

describe('Wishlist Custom Functions', () => {
  const mockUserId = 'mock-user-id';
  const mockCreatureId = 'mock-creature-id';
  const mockWishlistId = 'mock-wishlist-id';

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Set current user ID
    setCurrentUserID(mockUserId);
    
    // Setup Supabase mock responses
    mockSupabase.from.mockReturnThis();
    mockSupabase.insert.mockReturnThis();
    mockSupabase.delete.mockReturnThis();
    mockSupabase.eq.mockReturnThis();
    mockSupabase.select.mockReturnThis();
    mockSupabase.single.mockReturnValue({ 
      data: { 
        id: mockWishlistId,
        user_id: mockUserId,
        creature_id: mockCreatureId,
        created_at: new Date().toISOString()
      }, 
      error: null 
    });
  });

  afterEach(() => {
    // Clear the user ID
    setCurrentUserID(null);
  });

  test('should call custom create function with correct parameters', async () => {
    // Prepare input data
    const inputData = {
      id: mockWishlistId,
      user_id: mockUserId,
      creature_id: mockCreatureId,
      created_at: new Date().toISOString()
    };

    // Call the custom create function directly
    const result = await (wishlists$ as any).sync.create(inputData, {});

    // Verify Supabase methods were called correctly
    expect(mockSupabase.from).toHaveBeenCalledWith('wishlists');
    expect(mockSupabase.insert).toHaveBeenCalledWith(inputData);
    expect(mockSupabase.select).toHaveBeenCalled();
    expect(mockSupabase.single).toHaveBeenCalled();

    // Verify the result
    expect(result).toEqual({
      data: {
        id: mockWishlistId,
        user_id: mockUserId,
        creature_id: mockCreatureId,
        created_at: expect.any(String)
      },
      error: null
    });
  });

  test('should call custom delete function with correct parameters', async () => {
    // Prepare input data
    const inputData = { id: mockWishlistId };

    // Setup delete mock to return success
    mockSupabase.single.mockReturnValueOnce({ 
      data: null, 
      error: null 
    });

    // Call the custom delete function directly
    const result = await (wishlists$ as any).sync.delete(inputData, {});

    // Verify Supabase methods were called correctly
    expect(mockSupabase.from).toHaveBeenCalledWith('wishlists');
    expect(mockSupabase.delete).toHaveBeenCalled();
    expect(mockSupabase.eq).toHaveBeenCalledWith('id', mockWishlistId);

    // Verify the result
    expect(result).toEqual({
      data: null,
      error: null
    });
  });

  test('should handle create function errors', async () => {
    // Setup Supabase mock to return an error
    const mockError = { message: 'Insert failed' };
    mockSupabase.single.mockReturnValueOnce({ 
      data: null, 
      error: mockError 
    });

    // Prepare input data
    const inputData = {
      id: mockWishlistId,
      user_id: mockUserId,
      creature_id: mockCreatureId,
      created_at: new Date().toISOString()
    };

    // Verify that the function throws an error
    await expect((wishlists$ as any).sync.create(inputData, {}))
      .rejects
      .toThrow('Failed to create wishlist item: Insert failed');
  });

  test('should handle delete function errors', async () => {
    // Setup Supabase mock to return an error
    const mockError = { message: 'Delete failed' };
    mockSupabase.single.mockReturnValueOnce({ 
      data: null, 
      error: mockError 
    });

    // Prepare input data
    const inputData = { id: mockWishlistId };

    // Verify that the function throws an error
    await expect((wishlists$ as any).sync.delete(inputData, {}))
      .rejects
      .toThrow('Failed to delete wishlist item: Delete failed');
  });
});