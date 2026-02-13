import 'dotenv/config';

export default ({ config }) => {
  const appJsonConfig = {
    name: 'SeaVault',
    slug: 'SeaVault',
    version: '1.1.27',
    orientation: 'portrait',
    icon: './assets/images/icon.png',

    splash: {
      image: './assets/images/icon.png',
      backgroundColor: '#1B87E1',
      resizeMode: 'contain',
    },
    scheme: 'seavault',
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'co.uk.seavault.app',
      associatedDomains: ['applinks:seavault.onelink.me'],
      buildNumber: '1.1.27',
      config: {
        googleMapsApiKey:
          process.env.GOOGLE_MAPS_API_KEY ||
          process.env.GOOGLE_MAPS_API_KEY ||
          '',
      },
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
        NSLocationWhenInUseUsageDescription: 'SeaVault uses your location to show where you are on the map and help you find nearby dive sites.',
        CFBundleURLTypes: [
          {
            CFBundleURLSchemes: [
              process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?.split('.').reverse().join('.') || 'com.googleusercontent.apps.253456152251-ped969r8t38ef0ukdps4oemm9028mshg',
            ],
          },
        ],
      },
    },
    android: {
      package: 'com.seavault.app',
      intentFilters: [
        {
          action: 'VIEW',
          autoVerify: true,
          data: [
            {
              scheme: 'https',
              host: 'seavault.onelink.me',
              pathPrefix: '/',
            }
          ],
          category: ['BROWSABLE', 'DEFAULT'],
        },
      ],
      adaptiveIcon: {
        foregroundImage: './assets/images/icon.png',
        backgroundColor: '#1B87E1',
      },
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
      './plugins/withRemoveAdId',
      './plugins/withGradleFix',
      './plugins/withGradleTimeout',
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
        '@rnmapbox/maps',
        {
          RNMapboxMapsImpl: 'mapbox',
          downloadToken: process.env.MAPBOX_DOWNLOADS_TOKEN,
        },
      ],
      'expo-secure-store',
      '@react-native-google-signin/google-signin',
      'expo-apple-authentication',
      [
        'react-native-appsflyer',
        {
          devKey: process.env.EXPO_PUBLIC_APPSFLYER_DEV_KEY || 'HrD2iEQKVAGU2xraYSKkh5',
          appId: process.env.EXPO_PUBLIC_APPSFLYER_APP_ID || 'id6743347532',
          isDebug: true,
        },
      ],
      // 'sentry-expo',
    ],
    experiments: {
      typedRoutes: true,
    },
    extra: {
      GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY || '',
      MAPBOX_ACCESS_TOKEN: process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN || '',
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
