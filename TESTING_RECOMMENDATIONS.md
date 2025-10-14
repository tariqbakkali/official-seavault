# Testing Recommendations for Offline-First Image Handling

This document provides comprehensive testing recommendations for the offline-first image handling system.

## Test Environment Setup

### Required Dependencies

Ensure the following testing libraries are installed:

```bash
npm install --save-dev @testing-library/react-native
npm install --save-dev @testing-library/jest-native
npm install --save-dev jest-fetch-mock
npm install --save-dev react-native-testing-library
```

### Mock Configuration

Create mock implementations for native modules:

```javascript
// __mocks__/expo-file-system.js
export default {
  documentDirectory: 'file:///mock/document/',
  cacheDirectory: 'file:///mock/cache/',
  getInfoAsync: jest.fn(),
  makeDirectoryAsync: jest.fn(),
  copyAsync: jest.fn(),
  deleteAsync: jest.fn(),
  readAsStringAsync: jest.fn(),
  writeAsStringAsync: jest.fn(),
  readDirectoryAsync: jest.fn(),
  downloadAsync: jest.fn(),
  uploadAsync: jest.fn(),
};

// __mocks__/expo-image-manipulator.js
export default {
  manipulateAsync: jest.fn(),
};

// __mocks__/@react-native-community/netinfo.js
export default {
  fetch: jest.fn(),
  addEventListener: jest.fn(),
};
```

## Unit Testing

### 1. Image Storage Service Tests

```javascript
// __tests__/imageStorageService.test.ts
import {
  saveImageLocally,
  generateThumbnail,
  compressImage,
  deleteLocalImage,
  getLocalImagesForDiveSite,
} from '../services/imageStorageService';

describe('Image Storage Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('saveImageLocally', () => {
    it('should save image locally and return metadata', async () => {
      // Mock file system operations
      // Test successful save
      // Test error handling
    });

    it('should handle file system errors gracefully', async () => {
      // Mock file system error
      // Test error handling
    });
  });

  describe('generateThumbnail', () => {
    it('should generate thumbnail with correct dimensions', async () => {
      // Mock image manipulation
      // Test thumbnail generation
    });
  });

  describe('compressImage', () => {
    it('should compress image with specified quality', async () => {
      // Test compression with different quality values
    });
  });

  describe('deleteLocalImage', () => {
    it('should delete existing image file', async () => {
      // Test successful deletion
    });

    it('should handle missing files gracefully', async () => {
      // Test deletion of non-existent files
    });
  });

  describe('getLocalImagesForDiveSite', () => {
    it('should return list of local images for dive site', async () => {
      // Test successful retrieval
    });

    it('should return empty array for non-existent dive site', async () => {
      // Test dive site without images
    });
  });
});
```

### 2. Image Service Tests

```javascript
// __tests__/imageService.test.ts
import {
  createImageMetadata,
  uploadImageToSupabase,
  downloadImageFromSupabase,
  processNewImage,
  deleteImage,
} from '../services/imageService';

describe('Image Service', () => {
  describe('createImageMetadata', () => {
    it('should create valid image metadata object', () => {
      // Test metadata creation with various inputs
    });
  });

  describe('uploadImageToSupabase', () => {
    it('should upload image and return public URL', async () => {
      // Mock Supabase storage upload
      // Test successful upload
    });

    it('should handle upload errors', async () => {
      // Mock upload failure
      // Test error handling
    });
  });

  describe('downloadImageFromSupabase', () => {
    it('should download image to local storage', async () => {
      // Mock download operation
      // Test successful download
    });
  });

  describe('processNewImage', () => {
    it('should process image and generate metadata', async () => {
      // Test complete image processing pipeline
    });
  });

  describe('deleteImage', () => {
    it('should delete both local and remote images', async () => {
      // Test complete deletion
    });
  });
});
```

### 3. Image Sync Service Tests

```javascript
// __tests__/imageSyncService.test.ts
import {
  addToUploadQueue,
  processUploadQueue,
  ensureImageDownloaded,
  batchUploadImages,
} from '../services/imageSyncService';

describe('Image Sync Service', () => {
  describe('addToUploadQueue', () => {
    it('should add image to upload queue', () => {
      // Test queue addition
    });

    it('should prevent duplicate queue entries', () => {
      // Test duplicate prevention
    });
  });

  describe('processUploadQueue', () => {
    it('should process pending uploads when online', async () => {
      // Mock network connectivity
      // Test successful uploads
    });

    it('should skip processing when offline', async () => {
      // Mock offline state
      // Test queue processing skip
    });
  });

  describe('ensureImageDownloaded', () => {
    it('should return local URI when available', async () => {
      // Test local image return
    });

    it('should download remote image when needed', async () => {
      // Test remote image download
    });
  });

  describe('batchUploadImages', () => {
    it('should upload multiple images with concurrency control', async () => {
      // Test batch upload
    });
  });
});
```

## Integration Testing

### 1. End-to-End Image Flow Test

```javascript
// __tests__/imageFlow.test.ts
describe('Complete Image Flow', () => {
  it('should handle complete offline-first image workflow', async () => {
    // 1. Capture/select image
    // 2. Save locally
    // 3. Add to upload queue
    // 4. Process when online
    // 5. Sync with Supabase
    // 6. Verify database and storage state
  });

  it('should handle offline image capture and sync later', async () => {
    // Test offline capture
    // Test delayed sync
  });
});
```

### 2. Network Resilience Tests

```javascript
// __tests__/networkResilience.test.ts
describe('Network Resilience', () => {
  it('should retry failed uploads with exponential backoff', async () => {
    // Test retry mechanism
  });

  it('should queue uploads during network outages', async () => {
    // Test offline queuing
  });

  it('should resume sync when connectivity is restored', async () => {
    // Test network recovery
  });
});
```

## UI Component Testing

### 1. ImagePicker Component Tests

```javascript
// __tests__/ImagePicker.test.tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ImagePicker } from '../components/ImagePicker';

describe('ImagePicker', () => {
  it('should render camera and library options', () => {
    const { getByText } = render(
      <ImagePicker onImageSelect={jest.fn()} diveSiteId="test-site" />
    );
    
    expect(getByText('Take Photo')).toBeTruthy();
    expect(getByText('Choose from Library')).toBeTruthy();
  });

  it('should call onImageSelect when image is captured', async () => {
    const mockOnImageSelect = jest.fn();
    const { getByText } = render(
      <ImagePicker onImageSelect={mockOnImageSelect} diveSiteId="test-site" />
    );
    
    // Mock camera launch
    // Test image selection callback
  });

  it('should show upload progress during image upload', () => {
    // Test progress indicator
  });
});
```

### 2. OptimizedImage Component Tests

```javascript
// __tests__/OptimizedImage.test.tsx
import React from 'react';
import { render } from '@testing-library/react-native';
import { OptimizedImage } from '../components/OptimizedImage';

describe('OptimizedImage', () => {
  it('should display local image when available', () => {
    // Test local image display
  });

  it('should display remote image when online', () => {
    // Test remote image display
  });

  it('should show placeholder when image is not available', () => {
    // Test placeholder display
  });

  it('should show sync status when enabled', () => {
    // Test sync status display
  });
});
```

### 3. ImageGallery Component Tests

```javascript
// __tests__/ImageGallery.test.tsx
import React from 'react';
import { render } from '@testing-library/react-native';
import { ImageGallery } from '../components/ImageGallery';

describe('ImageGallery', () => {
  it('should render images in a grid layout', () => {
    // Test grid rendering
  });

  it('should show sync status badges for each image', () => {
    // Test status badges
  });

  it('should handle image selection and modal display', () => {
    // Test modal functionality
  });

  it('should show failed uploads summary', () => {
    // Test failed uploads display
  });
});
```

## Performance Testing

### 1. Memory Usage Tests

```javascript
// __tests__/memoryUsage.test.ts
describe('Memory Usage', () => {
  it('should not leak memory during image processing', async () => {
    // Test memory consumption
  });

  it('should properly clean up image cache', async () => {
    // Test cache cleanup
  });
});
```

### 2. Storage Usage Tests

```javascript
// __tests__/storageUsage.test.ts
describe('Storage Usage', () => {
  it('should manage storage space efficiently', async () => {
    // Test storage management
  });

  it('should clean up old cached images', async () => {
    // Test cache cleanup
  });
});
```

## Edge Case Testing

### 1. Error Handling Tests

```javascript
// __tests__/errorHandling.test.ts
describe('Error Handling', () => {
  it('should handle permission denials gracefully', async () => {
    // Test permission errors
  });

  it('should handle network interruptions', async () => {
    // Test network errors
  });

  it('should handle insufficient storage space', async () => {
    // Test storage errors
  });

  it('should handle corrupted image files', async () => {
    // Test file corruption
  });

  it('should handle sync conflicts', async () => {
    // Test sync conflicts
  });
});
```

### 2. Boundary Condition Tests

```javascript
// __tests__/boundaryConditions.test.ts
describe('Boundary Conditions', () => {
  it('should handle very large images', async () => {
    // Test large image handling
  });

  it('should handle very small images', async () => {
    // Test small image handling
  });

  it('should handle unsupported file formats', async () => {
    // Test format validation
  });

  it('should handle concurrent image operations', async () => {
    // Test concurrency
  });
});
```

## Manual Testing Checklist

### Offline Functionality

- [ ] Capture images while offline
- [ ] Select images from library while offline
- [ ] View locally stored images while offline
- [ ] Delete local images while offline
- [ ] Verify images remain accessible after app restart

### Online Functionality

- [ ] Upload images when connectivity is restored
- [ ] Download remote images for offline viewing
- [ ] Sync image metadata with Supabase
- [ ] Handle upload failures and retries
- [ ] Verify images are accessible across devices

### User Experience

- [ ] Image picker interface is responsive
- [ ] Upload progress indicators are accurate
- [ ] Error messages are user-friendly
- [ ] Sync status is clearly visible
- [ ] Gallery performance is smooth

### Edge Cases

- [ ] App behavior during network interruptions
- [ ] Handling of very large image files
- [ ] Behavior when storage space is low
- [ ] Response to permission denials
- [ ] Handling of corrupted image files

## Test Data Requirements

### Sample Images

- JPEG images of various sizes (100KB, 1MB, 5MB)
- PNG images with transparency
- GIF images (animated and static)
- WEBP images
- Corrupted image files

### Test Scenarios

- Fast network (WiFi)
- Slow network (3G/4G)
- Intermittent connectivity
- No connectivity
- Low storage space
- High storage space
- Multiple concurrent users
- Large number of images

## Monitoring and Debugging

### Logging Strategy

- Enable debug logging during testing
- Capture error logs for analysis
- Monitor performance metrics
- Track sync status changes
- Record user interactions

### Performance Metrics

- Image processing time
- Upload/download speeds
- Memory consumption
- Storage usage
- Battery consumption

This comprehensive testing approach ensures the offline-first image handling system is robust, reliable, and provides an excellent user experience under all conditions.