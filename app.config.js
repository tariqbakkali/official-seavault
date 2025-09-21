module.exports = {
  expo: {
    name: 'SeaVault',
    slug: 'seavault',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    scheme: 'seavault',
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,
    ios: {
      supportsTablet: true
    },
    web: {
      bundler: 'metro',
      output: 'single',
      favicon: './assets/images/favicon.png'
    },
    plugins: ['expo-router', 'expo-font', 'expo-web-browser', 'expo-image-picker'],
    experiments: {
      typedRoutes: true
    },
    extra: {
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    },
    // Deep linking configuration
    linking: {
      prefixes: ['seavault://', 'https://seavault.app'],
      config: {
        screens: {
          '(auth)': {
            screens: {
              login: 'login'
            }
          },
          '(tabs)': {
            screens: {
              index: 'home',
              categories: 'categories',
              'log-dive': 'log-dive',
              profile: 'profile'
            }
          },
          'categories/[id]': 'categories/[id]/index',
          'creatures/[id]': 'creatures/[id]',
          'profile/edit': 'profile/edit',
          'stats/discovered': 'stats/discovered',
          'stats/wishlist': 'stats/wishlist',
          'stats/points': 'stats/points',
          'modal/leaderboard': 'modal/leaderboard',
          'modal/explore': 'modal/explore',
          '+not-found': '*'
        }
      }
    }
  }
};