/**
 * Utility functions for handling image loading with proxy services to avoid CORS issues
 */

// List of known proxy services that can be used to load images
const PROXY_SERVICES = [
  'https://images.weserv.nl/?url=',
  'https://imgproxy.snappify.io/?url=',
  'https://wsrv.nl/?url=',
];

/**
 * Generate a proxy URL for an image to avoid CORS issues
 * @param imageUrl The original image URL
 * @returns A proxied URL or the original URL if no proxy is needed
 */
export function getProxyImageUrl(imageUrl: string | null | undefined): string | null {
  if (!imageUrl) {
    return null;
  }

  try {
    const url = new URL(imageUrl);
    
    // Only use proxy for Wikimedia/Wikipedia URLs which might have CORS issues
    if (url.hostname.includes('wikimedia.org') || url.hostname.includes('wikipedia.org')) {
      // Use the first proxy service (we can rotate if needed)
      const proxyService = PROXY_SERVICES[0];
      
      // For weserv.nl and similar services, we need to remove the protocol
      const cleanUrl = imageUrl.replace(/^https?:\/\//, '');
      return `${proxyService}${cleanUrl}`;
    }
    
    // Return original URL for other images
    return imageUrl;
  } catch (e) {
    console.warn('Invalid image URL:', imageUrl, e);
    return null;
  }
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

  try {
    const url = new URL(imageUrl);
    
    // Original URL
    const original = imageUrl;
    
    // Proxied URL for Wikimedia images
    const proxied = getProxyImageUrl(imageUrl);
    
    // Encoded URL for Wikimedia images
    let encoded = null;
    if (url.hostname.includes('wikimedia.org') || url.hostname.includes('wikipedia.org')) {
      try {
        const encodedPath = encodeURI(decodeURI(url.pathname));
        encoded = `${url.protocol}//${url.hostname}${encodedPath}${url.search}${url.hash}`;
      } catch (e) {
        console.warn('Error encoding URL path:', url.pathname, e);
        encoded = imageUrl;
      }
    }
    
    return {
      original,
      proxied,
      encoded,
    };
  } catch (e) {
    console.warn('Invalid image URL:', imageUrl, e);
    return {
      original: null,
      proxied: null,
      encoded: null,
    };
  }
}