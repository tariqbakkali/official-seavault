# React Native Maps Example for Expo

This is a clean, minimal example of using `react-native-maps` in an Expo React Native app that is compatible with Expo Go and production builds.

## Features

- Display a single marker showing a dive site location
- Basic zoom and pan gestures
- Automatic centering on the dive site marker
- Clean, modular structure with separate files for UI, logic, and utilities
- Expo Go friendly (no native config or prebuild needed)
- TypeScript and React Native best practices
- Dynamic marker position updates when selecting different dive sites

## File Structure

```
map-example/
├── MapScreen.tsx     # Main map screen component
├── useMap.ts         # Custom hook for map logic
├── mapUtils.ts       # Utility functions for map operations
├── index.ts          # Export file for easy imports
└── README.md         # This file
```

## Implementation Details

### MapScreen.tsx
The main screen component that renders the map and dive site selector. It uses:
- `MapView` from `react-native-maps` for the map display
- `Marker` component to show dive site locations
- A simple UI to select between different dive sites

### useMap.ts
A custom hook that manages map state:
- Tracks the currently selected dive site
- Calculates the initial region for the map based on the selected site
- Provides data needed for rendering markers

### mapUtils.ts
Utility functions for map operations:
- `calculateRegion`: Creates a region object for the map
- `validateCoordinates`: Validates latitude/longitude values
- `calculateDistance`: Calculates distance between two coordinates

### index.ts
An export file that makes it easy to import the components:
```typescript
import { MapScreen, useMap, calculateRegion } from './map-example';
```

## Usage

1. Copy the files to your project
2. Import and use the `MapScreen` component in your app
3. Customize the `SAMPLE_DIVE_SITES` data or replace with your own data source

## Offline-First Considerations

This example is designed with offline-first principles in mind:
- All data is stored locally (in this example, as a constant array)
- No network requests are needed for basic map functionality
- The map will work without an internet connection
- Can be extended to sync with remote data when online

## Expo Go Compatibility

This implementation is compatible with Expo Go because:
- It uses `react-native-maps` which is pre-installed in Expo Go
- No additional native configuration is required
- No custom native modules are used
- All functionality is available in the Expo Go environment

## Customization

To use your own dive site data:
1. Replace the `SAMPLE_DIVE_SITES` array with your data source
2. Adjust the map region calculations if needed
3. Modify the UI components to match your app's design

## TypeScript Benefits

This example uses TypeScript for:
- Type safety for dive site objects
- Clear function signatures
- Better IDE support and autocomplete
- Reduced runtime errors