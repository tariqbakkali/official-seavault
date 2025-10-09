export default ({ config }) => {
  const appJsonConfig = {
    name: 'SeaVault',
    slug: 'seavault',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    scheme: 'seavault',
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.seavault.app',
    },
    android: {
      package: 'com.seavault.app',
      edgeToEdgeEnabled: true,
      permissions: ['android.permission.RECORD_AUDIO'],
    },
    web: {
      bundler: 'metro',
      output: 'single',
      favicon: './assets/images/favicon.png',
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
      'expo-maps',
      'expo-secure-store',
      'sentry-expo',
    ],
    experiments: {
      typedRoutes: true,
    },
    extra: {
      EXPO_PUBLIC_GOOGLE_MAPS_API_KEY: '',
      supabaseUrl: 'https://hqqebvozpvwpopxtixyt.supabase.co',
      supabaseAnonKey:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhxcWVidm96cHZ3cG9weHRpeHl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwOTQwODUsImV4cCI6MjA3MzY3MDA4NX0.WYn1ISKphuoVM92XKiVrywxpPrBGvIuV3tGP88Y6Wqc',
      router: {
        origin: false,
      },
      eas: {
        projectId: '61041964-a99c-4b5e-874e-5250ca4e93e1',
      },
    },
    assetBundlePatterns: ['**/*'],
    platforms: ['ios', 'android', 'web'],
  };

  return {
    ...appJsonConfig,
    android: {
      ...appJsonConfig.android,
      config: {
        ...appJsonConfig.android?.config,
        googleMaps: {
          apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
        },
      },
    },
  };
};
