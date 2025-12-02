import Purchases, { PurchasesOffering, PurchasesPackage } from 'react-native-purchases';
import { Platform } from 'react-native';

const API_KEYS = {
  apple: process.env.EXPO_PUBLIC_RC_APPLE_KEY || 'appl_placeholder',
  google: process.env.EXPO_PUBLIC_RC_GOOGLE_KEY || 'goog_placeholder',
};

export const initRevenueCat = async () => {
  try {
    if (Platform.OS === 'android') {
      await Purchases.configure({ apiKey: API_KEYS.google });
    } else {
      await Purchases.configure({ apiKey: API_KEYS.apple });
    }
    console.log('RevenueCat initialized successfully');
  } catch (error) {
    console.error('Error initializing RevenueCat:', error);
  }
};

export const isRevenueCatConfigured = async (): Promise<boolean> => {
  try {
    return await Purchases.isConfigured();
  } catch {
    return false;
  }
};

export const getOfferings = async (): Promise<PurchasesOffering | null> => {
  try {
    const configured = await isRevenueCatConfigured();
    if (!configured) {
      console.warn('RevenueCat not configured yet');
      return null;
    }
    const offerings = await Purchases.getOfferings();
    if (offerings.current !== null) {
      return offerings.current;
    }
  } catch (e) {
    console.error('Error fetching offerings', e);
  }
  return null;
};

export const purchasePackage = async (pack: PurchasesPackage) => {
  try {
    const { customerInfo } = await Purchases.purchasePackage(pack);
    return customerInfo;
  } catch (e: any) {
    if (!e.userCancelled) {
      console.error('Error purchasing package', e);
      throw e;
    }
  }
};

export const checkSubscriptionStatus = async () => {
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    return customerInfo.entitlements.active['Pro'] !== undefined;
  } catch (e) {
    console.error('Error checking subscription status', e);
    return false;
  }
};

export const setShopIdAttribute = async (shopId: string) => {
  try {
    await Purchases.setAttributes({ shop_id: shopId });
  } catch (e) {
    console.error('Error setting shop ID attribute', e);
  }
};
