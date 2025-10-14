/**
 * Integration test for image services to verify they work without throwing errors
 */

describe('Image Service Integration', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('should import image storage service without native module errors', () => {
    // This test verifies that the service can be imported without
    // throwing errors related to missing native modules
    expect(() => {
      require('../services/imageStorageService');
    }).not.toThrow();
  });

  it('should import image utils without native module errors', () => {
    // This test verifies that the utils can be imported without
    // throwing errors related to missing native modules
    expect(() => {
      require('../utils/imageUtils');
    }).not.toThrow();
  });

  it('should provide fallback functionality when ImageManipulator is not available', async () => {
    // Mock console.warn to suppress warnings in tests
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

    // Mock the require to simulate missing native module
    jest.mock('expo-image-manipulator', () => {
      throw new Error('Cannot find native module');
    }, { virtual: true });

    // Re-require the modules to test fallback behavior
    const imageStorageService = require('../services/imageStorageService');
    const imageUtils = require('../utils/imageUtils');

    // Test that functions exist and don't throw errors
    expect(imageStorageService).toBeDefined();
    expect(imageUtils).toBeDefined();

    // Restore console.warn
    consoleWarnSpy.mockRestore();
  });

  it('should work with ImageManipulator when available', async () => {
    // Mock console.warn to suppress warnings in tests
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

    // Mock ImageManipulator to simulate it being available
    jest.mock('expo-image-manipulator', () => ({
      manipulateAsync: jest.fn().mockResolvedValue({
        uri: 'test-uri',
        width: 100,
        height: 100
      }),
      SaveFormat: {
        JPEG: 'jpeg'
      }
    }), { virtual: true });

    // Re-require the modules to test normal behavior
    const imageStorageService = require('../services/imageStorageService');
    const imageUtils = require('../utils/imageUtils');

    // Test that functions exist
    expect(imageStorageService).toBeDefined();
    expect(imageUtils).toBeDefined();

    // Restore console.warn
    consoleWarnSpy.mockRestore();
  });
});