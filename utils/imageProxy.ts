/**
 * Utility functions for handling image loading
 */

/**
 * Generate a proxy URL for an image to avoid CORS issues
 * @param imageUrl The original image URL
 * @returns A proxied URL or the original URL if no proxy is needed
 */
export function getProxyImageUrl(imageUrl: string | null | undefined): string | null {
  return imageUrl || null;
}

/**
 * Try multiple approaches to load an image
 * @param imageUrl The original image URL
 * @returns An object with different URL options to try
 */
export function getImageUrlOptions(imageUrl: string | null | undefined): {
  original: string | null;
  proxied: string | null;
  encoded: string | null;
} {
  if (!imageUrl) {
    return {
      original: null,
      proxied: null,
      encoded: null,
    };
  }

  return {
    original: imageUrl,
    proxied: null,
    encoded: null,
  };
}