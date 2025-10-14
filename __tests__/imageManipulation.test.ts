/**
 * Test to verify that image manipulation modules can be imported without errors
 */

describe('Image Manipulation Modules', () => {
  it('should import image storage service without errors', async () => {
    // This test will fail if there are import errors
    expect(() => {
      require('../services/imageStorageService');
    }).not.toThrow();
  });

  it('should import image utils without errors', async () => {
    // This test will fail if there are import errors
    expect(() => {
      require('../utils/imageUtils');
    }).not.toThrow();
  });

  it('should handle missing ImageManipulator gracefully', () => {
    // Mock the require to simulate missing native module
    jest.mock('expo-image-manipulator', () => {
      throw new Error('Cannot find native module');
    });

    // This should not throw an error even if ImageManipulator is not available
    expect(() => {
      require('../services/imageStorageService');
    }).not.toThrow();
  });
});