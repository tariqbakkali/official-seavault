import ImageWithFallback from '../components/ImageWithFallback';

describe('ImageWithFallback Integration', () => {
  it('should export ImageWithFallback component', () => {
    expect(ImageWithFallback).toBeDefined();
    expect(typeof ImageWithFallback).toBe('function');
  });
});