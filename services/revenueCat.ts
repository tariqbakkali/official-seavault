import Purchases, { PurchasesOffering, PurchasesPackage, CustomerInfo } from 'react-native-purchases';
import { Platform } from 'react-native';
import { supabase } from './supabase';
import { updateUserProfile } from '@/stores/syncedObservables';
import { Database } from '@/types/database';

const API_KEYS = {
  apple: process.env.EXPO_PUBLIC_RC_APPLE_KEY || 'appl_placeholder',
  google: process.env.EXPO_PUBLIC_RC_GOOGLE_KEY || 'goog_placeholder',
};

export const initRevenueCat = async (userId?: string) => {
  try {
    if (Platform.OS === 'android') {
      await Purchases.configure({ apiKey: API_KEYS.google });
    } else {
      await Purchases.configure({ apiKey: API_KEYS.apple });
    }
    console.log('RevenueCat initialized successfully');
    
    // If userId is provided, configure RevenueCat with it
    if (userId) {
      await loginUser(userId);
    }
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

/**
 * Configure RevenueCat with a user ID
 * This should be called when a user logs in
 */
export const loginUser = async (userId: string) => {
  try {
    console.log('[RevenueCat] Logging in user:', userId);
    await Purchases.logIn(userId);
    console.log('[RevenueCat] User logged in successfully');
  } catch (error) {
    console.error('[RevenueCat] Error logging in user:', error);
    throw error;
  }
};

/**
 * Reset RevenueCat user
 * This should be called when a user logs out
 */
export const logoutUser = async () => {
  try {
    const isAnonymous = await Purchases.isAnonymous();
    if (isAnonymous) {
      console.log('[RevenueCat] User is already anonymous, skipping logout');
      return;
    }
    console.log('[RevenueCat] Logging out user');
    await Purchases.logOut();
    console.log('[RevenueCat] User logged out successfully');
  } catch (error) {
    console.error('[RevenueCat] Error logging out user:', error);
  }
};

export const getOfferings = async (offeringId?: string): Promise<PurchasesOffering | null> => {
  try {
    const configured = await isRevenueCatConfigured();
    if (!configured) {
      console.warn('RevenueCat not configured yet');
      return null;
    }
    const offerings = await Purchases.getOfferings();
    
    if (offeringId && offerings.all[offeringId]) {
      return offerings.all[offeringId];
    }

    if (offerings.current !== null) {
      return offerings.current;
    }
  } catch (e) {
    console.error('Error fetching offerings', e);
  }
  return null;
};

/**
 * Sync subscription status to Supabase profile
 */
export const syncSubscriptionToSupabase = async (customerInfo: CustomerInfo, userId: string) => {
  try {
    const isPremium = customerInfo.entitlements.active['Pro'] !== undefined;
    
    // Determine membership tier based on active entitlements
    let membershipTier = 'free';
    if (isPremium) {
      // You can customize this based on your specific entitlements
      membershipTier = 'pro';
    }
    
    console.log('[RevenueCat] Syncing to Supabase - isPremium:', isPremium, 'tier:', membershipTier);
    
    // Update Supabase profile
    const { error } = await (supabase
      .from('profiles') as any)
      .update({
        is_premium: isPremium,
        membership_tier: membershipTier,
      })
      .eq('id', userId);
    
    if (error) {
      console.error('[RevenueCat] Error updating Supabase profile:', error);
      throw error;
    }
    
    // Update Legend State observable
    await updateUserProfile({
      is_premium: isPremium,
      membership_tier: membershipTier,
    } as any);
    
    console.log('[RevenueCat] Successfully synced subscription to Supabase');
  } catch (error) {
    console.error('[RevenueCat] Error syncing subscription to Supabase:', error);
    throw error;
  }
};

export const purchasePackage = async (pack: PurchasesPackage, userId: string) => {
  try {
    const { customerInfo } = await Purchases.purchasePackage(pack);
    
    // Sync subscription status to Supabase after successful purchase
    await syncSubscriptionToSupabase(customerInfo, userId);
    
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

/**
 * Get customer info and sync with Supabase
 * This should be called periodically to ensure sync
 */
export const syncCustomerInfo = async (userId: string) => {
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    
    // Sync to Supabase in background so we don't block the UI
    syncSubscriptionToSupabase(customerInfo, userId).catch(err => 
      console.error('Background sync failed:', err)
    );
    
    return customerInfo;
  } catch (error) {
    console.error('[RevenueCat] Error syncing customer info:', error);
    throw error;
  }
};

export const setShopIdAttribute = async (shopId: string) => {
  try {
    await Purchases.setAttributes({ shop_id: shopId });
  } catch (e) {
    console.error('Error setting shop ID attribute', e);
  }
};
