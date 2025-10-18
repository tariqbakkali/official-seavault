import 'dotenv/config';

export default ({ config }) => {
  const appJsonConfig = {
    name: 'SeaVault',
    slug: 'SeaVault',
    version: '1.0.0',
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
        'android.permission.RECORD_AUDIO',
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
      supabaseUrl: 'https://hqqebvozpvwpopxtixyt.supabase.co',
      supabaseAnonKey:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhxcWVidm96cHZ3cG9weHRpeHl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwOTQwODUsImV4cCI6MjA3MzY3MDA4NX0.WYn1ISKphuoVM92XKiVrywxpPrBGvIuV3tGP88Y6Wqc',
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
