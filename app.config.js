import 'dotenv/config';

export default ({ config }) => {
  const appJsonConfig = {
    name: 'SeaVault',
    slug: 'SeaVault',
    version: '1.0.6',
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    splash: {
      image: './assets/images/icon.png',
      backgroundColor: '#1B87E1',
      resizeMode: 'contain',
    },
    scheme: 'SeaVault',
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'co.uk.seavault.app',
      buildNumber: '1.0.6',
      config: {
        googleMapsApiKey:
          process.env.GOOGLE_MAPS_API_KEY ||
          process.env.GOOGLE_MAPS_API_KEY ||
          '',
      },
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
      },
    },
    android: {
      package: 'com.seavault.app',
      edgeToEdgeEnabled: true,
      permissions: [
        'android.permission.ACCESS_FINE_LOCATION',
        'android.permission.ACCESS_COARSE_LOCATION',
      ],
      config: {
        googleMaps: {
          apiKey:
            process.env.GOOGLE_MAPS_API_KEY ||
            process.env.GOOGLE_MAPS_API_KEY ||
            '',
        },
      },
    },
    web: {
      bundler: 'metro',
      output: 'single',
      favicon: './assets/images/favicon.png',
      // Add Google Maps API key and script for web
      config: {
        googleMaps: {
          apiKey:
            process.env.GOOGLE_MAPS_API_KEY ||
            process.env.GOOGLE_MAPS_API_KEY ||
            '',
        },
      },
      // Add the Google Maps JavaScript API script
      // This ensures the Google Maps API is loaded for web
      googleMapsApiKey:
        process.env.GOOGLE_MAPS_API_KEY ||
        process.env.GOOGLE_MAPS_API_KEY ||
        '',
    },
    plugins: [
      'expo-router',
      'expo-font',
      'expo-web-browser',
      [
        'expo-image-picker',
        {
          photosPermission:
            'The app accesses your photos to let you share them with your friends.',
        },
      ],
      // Add expo-maps plugin for proper expo-maps integration
      [
        'expo-maps',
        {
          googleMaps: {
            apiKey:
              process.env.GOOGLE_MAPS_API_KEY ||
              process.env.GOOGLE_MAPS_API_KEY ||
              '',
          },
          android: {
            googleMaps: {
              apiKey:
                process.env.GOOGLE_MAPS_API_KEY ||
                process.env.GOOGLE_MAPS_API_KEY ||
                '',
            },
          },
          requestLocationPermission: true,
          locationPermission: 'Allow SeaVault to use your location',
        },
      ],
      'expo-secure-store',
      // 'sentry-expo',
    ],
    experiments: {
      typedRoutes: true,
    },
    extra: {
      GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY || '',
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL || '',
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
      router: {
        origin: false,
      },
      eas: {
        projectId: '52fe00cb-8f63-49f2-981a-c93ef80d05bd',
      },
    },
    assetBundlePatterns: ['**/*'],
    platforms: ['ios', 'android', 'web'],
  };

  return appJsonConfig;
};
