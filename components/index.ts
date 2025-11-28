// Components index - re-export all components for easy imports

// UI Components
export { default as ImageWithFallback } from './ImageWithFallback';
export { default as AnimatedPressable } from './AnimatedPressable';
export * from './LoadingShimmer';
export * from './DefaultImagePlaceholder';
export * from './ErrorDisplay';
export * from './ImagePicker';
export { default as CustomClusteredMapView } from './MapboxClusteredMapView'; // Using Mapbox version
export { default as SimpleMapView } from './SimpleMapView'; // Already migrated to Mapbox
// Removed DiveSiteMarker and DiveSiteMarkerExpo exports (they use expo-maps)
export { default as AchievementCard } from './AchievementCard';

// Component Categories
export * from './ui';
export * from './forms';