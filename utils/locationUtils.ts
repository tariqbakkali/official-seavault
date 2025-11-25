import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';

const COUNTRY_CACHE_KEY = 'country_code_cache';
const CACHE_EXPIRY_DAYS = 30;
const MAX_CACHE_SIZE = 1000;

interface CacheEntry {
  code: string;
  timestamp: number;
}

interface CountryCache {
  [key: string]: CacheEntry;
}

export const getCountryFlag = (countryCode: string) => {
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
};

const getCacheKey = (latitude: number, longitude: number) => {
  // Round to 3 decimal places (approx 110m accuracy) to increase cache hits
  return `${latitude.toFixed(3)},${longitude.toFixed(3)}`;
};

export const getCountryCodeFromCoordinates = async (latitude: number, longitude: number): Promise<string | null> => {
  const cacheKey = getCacheKey(latitude, longitude);
  
  try {
    // Check cache first
    const cachedData = await AsyncStorage.getItem(COUNTRY_CACHE_KEY);
    if (cachedData) {
      const cache: CountryCache = JSON.parse(cachedData);
      const entry = cache[cacheKey];
      
      if (entry) {
        const now = Date.now();
        const ageInDays = (now - entry.timestamp) / (1000 * 60 * 60 * 24);
        
        if (ageInDays < CACHE_EXPIRY_DAYS) {
          return entry.code;
        }
      }
    }
    
    // Fetch from API
    const [address] = await Location.reverseGeocodeAsync({ latitude, longitude });
    const countryCode = address?.isoCountryCode || null;
    
    if (countryCode) {
      // Update cache
      const currentCacheStr = await AsyncStorage.getItem(COUNTRY_CACHE_KEY);
      let cache: CountryCache = currentCacheStr ? JSON.parse(currentCacheStr) : {};
      
      // Add new entry
      cache[cacheKey] = {
        code: countryCode,
        timestamp: Date.now(),
      };
      
      // Prune cache if too large (simple removal of old entries could be added here, 
      // but for now we'll just limit by replacing the whole object if it gets huge, 
      // or we could implement proper LRU. Given the constraints, let's just save it.)
      // To prevent unlimited growth, if size > MAX_CACHE_SIZE, we could clear half.
      const keys = Object.keys(cache);
      if (keys.length > MAX_CACHE_SIZE) {
        // Remove oldest 500 entries
        const sortedKeys = keys.sort((a, b) => cache[a].timestamp - cache[b].timestamp);
        const keysToRemove = sortedKeys.slice(0, 500);
        keysToRemove.forEach(k => delete cache[k]);
      }
      
      await AsyncStorage.setItem(COUNTRY_CACHE_KEY, JSON.stringify(cache));
    }
    
    return countryCode;
  } catch (error) {
    // Suppress error logging for common geocoding issues (e.g. service not available on emulator)
    // console.warn('Error getting country code:', error);
    return null;
  }
};


export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
};

const deg2rad = (deg: number): number => {
  return deg * (Math.PI / 180);
};
