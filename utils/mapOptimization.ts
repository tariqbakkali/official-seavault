import { Database } from '@/types/database';

type DiveSite = Database['public']['Tables']['dive_sites']['Row'];

/**
 * Optimized marker data structure with only essential fields
 */
export interface OptimizedMarker {
  id: string;
  latitude: number;
  longitude: number;
  name: string;
}

/**
 * Region/viewport bounds
 */
export interface ViewportBounds {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

/**
 * Map region
 */
export interface MapRegion {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

/**
 * Maximum markers to render on Android to prevent freezing
 */
export const MAX_MARKERS_ANDROID = 200;

/**
 * Viewport buffer percentage (show markers slightly outside viewport)
 */
const VIEWPORT_BUFFER = 0.2; // 20% buffer

/**
 * Strip unnecessary fields from dive sites to create lightweight markers
 */
export function optimizeMarkerData(diveSites: DiveSite[]): OptimizedMarker[] {
  return diveSites
    .filter(site => 
      site.latitude !== null && 
      site.longitude !== null &&
      typeof site.latitude === 'number' &&
      typeof site.longitude === 'number'
    )
    .map(site => ({
      id: site.id,
      latitude: site.latitude!,
      longitude: site.longitude!,
      name: site.name,
    }));
}

/**
 * Calculate viewport bounds with buffer zone
 */
export function calculateViewportBounds(region: MapRegion): ViewportBounds {
  const latBuffer = region.latitudeDelta * VIEWPORT_BUFFER;
  const lngBuffer = region.longitudeDelta * VIEWPORT_BUFFER;

  return {
    minLat: region.latitude - (region.latitudeDelta / 2) - latBuffer,
    maxLat: region.latitude + (region.latitudeDelta / 2) + latBuffer,
    minLng: region.longitude - (region.longitudeDelta / 2) - lngBuffer,
    maxLng: region.longitude + (region.longitudeDelta / 2) + lngBuffer,
  };
}

/**
 * Check if a marker is within viewport bounds
 */
export function isInViewport(
  marker: OptimizedMarker,
  bounds: ViewportBounds
): boolean {
  return (
    marker.latitude >= bounds.minLat &&
    marker.latitude <= bounds.maxLat &&
    marker.longitude >= bounds.minLng &&
    marker.longitude <= bounds.maxLng
  );
}

/**
 * Filter markers to only those visible in viewport
 */
export function filterMarkersInViewport(
  markers: OptimizedMarker[],
  region: MapRegion,
  maxMarkers: number = MAX_MARKERS_ANDROID
): OptimizedMarker[] {
  const bounds = calculateViewportBounds(region);
  const visibleMarkers = markers.filter(marker => isInViewport(marker, bounds));
  
  // Limit to max markers to prevent performance issues
  return visibleMarkers.slice(0, maxMarkers);
}

/**
 * Calculate distance between two coordinates (Haversine formula)
 * Returns distance in kilometers
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Debounce function for region changes
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Convert dive sites to GeoJSON format for clustering
 */
export function convertToGeoJSON(markers: OptimizedMarker[]): any[] {
  return markers.map(marker => ({
    type: 'Feature',
    id: marker.id,
    properties: {
      id: marker.id,
      name: marker.name,
    },
    geometry: {
      type: 'Point',
      coordinates: [marker.longitude, marker.latitude],
    },
  }));
}
