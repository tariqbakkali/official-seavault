import { Platform } from 'react-native';
import * as TrackingTransparency from 'expo-tracking-transparency';

// Conditional import to avoid errors in Expo Go
let appsFlyer: any = null;
try {
  appsFlyer = require('react-native-appsflyer').default;
} catch (e) {
  console.warn('AppsFlyer SDK not available (running in Expo Go?)');
}

const APPSFLYER_CONFIG = {
  devKey: process.env.EXPO_PUBLIC_APPSFLYER_DEV_KEY || 'HrD2iEQKVAGU2xraYSKkh5',
  isDebug: __DEV__,
  appId: process.env.EXPO_PUBLIC_APPSFLYER_APP_ID || 'id6743347532', // iOS App ID from App Store Connect
  onInstallConversionDataListener: true,
  onDeepLinkListener: true,
  timeToWaitForATTUserAuthorization: 10,
};

export const initAppsFlyer = async () => {
  if (!appsFlyer) {
    console.warn('AppsFlyer SDK not available - skipping initialization');
    return Promise.resolve({ status: 'skipped', reason: 'SDK not available' });
  }

  // Request tracking permission on iOS 14+
  if (Platform.OS === 'ios') {
    try {
      const { status } = await TrackingTransparency.requestTrackingPermissionsAsync();
      console.log('ATT Permission Status:', status);
      if (status === 'granted') {
        console.log('✅ User granted tracking permission - IDFA available');
      } else {
        console.log('⚠️ User denied tracking permission - using AppsFlyer ID');
      }
    } catch (error) {
      console.warn('ATT request failed:', error);
    }
  }

  return new Promise((resolve, reject) => {
    appsFlyer.initSdk(
      APPSFLYER_CONFIG,
      (result: any) => {
        console.log('AppsFlyer initialized successfully:', result);
        resolve(result);
      },
      (error: any) => {
        console.error('AppsFlyer initialization error:', error);
        reject(error);
      }
    );
  });
};

export const setAppsFlyerUserId = (userId: string) => {
  if (!appsFlyer) return;
  appsFlyer.setCustomerUserId(userId, (res: any) => {
    console.log('AppsFlyer user ID set:', res);
  });
};

export const logAppsFlyerEvent = (eventName: string, eventValues: Record<string, any>) => {
  if (!appsFlyer) return;
  appsFlyer.logEvent(
    eventName,
    eventValues,
    (res: any) => {
      console.log('AppsFlyer event logged:', res);
    },
    (err: any) => {
      console.error('AppsFlyer event error:', err);
    }
  );
};

// Deep link listener
export const onAppsFlyerDeepLink = (callback: (deepLinkData: any) => void) => {
  if (!appsFlyer) {
    console.warn('AppsFlyer SDK not available - deep link listener not registered');
    return;
  }
  appsFlyer.onDeepLink((res: any) => {
    if (res?.deepLinkStatus === 'FOUND') {
      console.log('AppsFlyer deep link found:', res.data);
      callback(res.data);
    } else if (res?.deepLinkStatus === 'NOT_FOUND') {
      console.log('AppsFlyer deep link not found');
    } else {
      console.log('AppsFlyer deep link error:', res);
    }
  });
};

// Get AppsFlyer Device ID (IDFA)
export const getDeviceIDFA = async (): Promise<string> => {
  if (!appsFlyer) {
    console.warn('AppsFlyer SDK not available - cannot get device ID');
    return Promise.resolve('N/A - SDK not available');
  }
  return new Promise((resolve, reject) => {
    appsFlyer.getAppsFlyerUID((error: any, uid: any) => {
      if (error) {
        console.error('Error getting AppsFlyer UID:', error);
        reject(error);
      } else {
        console.log('📱 AppsFlyer Device ID (IDFA):', uid);
        console.log('🔑 Use this ID in AppsFlyer Dashboard → Test Devices');
        resolve(uid);
      }
    });
  });
};

export default appsFlyer;
