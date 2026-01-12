import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { checkSubscriptionStatus, syncCustomerInfo } from '@/services/revenueCat';
import Purchases from 'react-native-purchases';
import { getCurrentUserID } from '@/stores/syncedObservables';

interface PurchaseContextType {
  isPro: boolean;
  isLoading: boolean;
  checkPurchaseStatus: () => Promise<boolean>;
}

const PurchaseContext = createContext<PurchaseContextType | undefined>(undefined);

export const usePurchase = () => {
  const context = useContext(PurchaseContext);
  if (!context) {
    throw new Error('usePurchase must be used within PurchaseProvider');
  }
  return context;
};

interface PurchaseProviderProps {
  children: ReactNode;
}

export const PurchaseProvider = ({ children }: PurchaseProviderProps) => {
  const [isPro, setIsPro] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const checkPurchaseStatus = async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      const hasPro = await checkSubscriptionStatus();
      setIsPro(hasPro);
      console.log('[PurchaseContext] Purchase status checked:', hasPro ? 'Pro' : 'Free');

      // Debug: Get full customer info to inspect (Wrapped in try/catch for offline safety)
      try {
        const isOnline = require('@/stores/networkStore').getIsOnline();
        if (isOnline) {
          const customerInfo = await Purchases.getCustomerInfo();
          console.log('[PurchaseContext] DEBUG - Active entitlements:', Object.keys(customerInfo.entitlements.active));
          if (customerInfo.entitlements.active['Pro']) {
            const proEntitlement = customerInfo.entitlements.active['Pro'];
            console.log('[PurchaseContext] DEBUG - Pro entitlement:', {
              identifier: proEntitlement.identifier,
              isActive: proEntitlement.isActive,
              willRenew: proEntitlement.willRenew,
              expirationDate: proEntitlement.expirationDate,
            });
          }
        }
      } catch (ncError) {
        console.warn('[PurchaseContext] Could not fetch latest customer info (likely offline), relying on cached/local status:', ncError);
      }

      // Sync with Supabase if user is logged in
      // REMOVED: We no longer sync on every app load.
      // 1. We trust the database (Legend State).
      // 2. We don't want to overwrite manual DB grants with "False" from RC (handled by syncSubscriptionToSupabase logic now anyway, but saving the network call is better).
      /*
      const userId = getCurrentUserID();
      if (userId) {
        try {
          await syncCustomerInfo(userId);
          console.log('[PurchaseContext] Synced subscription status to Supabase');
        } catch (error) {
          console.error('[PurchaseContext] Error syncing to Supabase:', error);
          // Don't throw - allow the app to continue even if sync fails
        }
      }
      */
      return hasPro;
    } catch (error) {
      console.error('[PurchaseContext] Error checking purchase status:', error);
      setIsPro(false);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkPurchaseStatus();

    // Listen for purchase updates from RevenueCat
    let customerInfoUpdateListener: any;
    try {
      customerInfoUpdateListener = Purchases.addCustomerInfoUpdateListener(async (info) => {
        const hasProFromRC = info.entitlements.active['Pro'] !== undefined;

        // Also check the database - user could be manually granted pro status
        const hasProFromDB = await checkSubscriptionStatus();

        // User is pro if EITHER RevenueCat says so OR database says so
        const hasPro = hasProFromRC || hasProFromDB;

        setIsPro(hasPro);
        console.log('[PurchaseContext] Purchase status updated:', hasPro ? 'Pro' : 'Free', '(RC:', hasProFromRC, ', DB:', hasProFromDB, ')');
        console.log('[PurchaseContext] DEBUG - Listener received active entitlements:', Object.keys(info.entitlements.active));
        if (info.entitlements.active['Pro']) {
          const proEntitlement = info.entitlements.active['Pro'];
          console.log('[PurchaseContext] DEBUG - Pro entitlement details:', {
            identifier: proEntitlement.identifier,
            isActive: proEntitlement.isActive,
            willRenew: proEntitlement.willRenew,
            expirationDate: proEntitlement.expirationDate,
          });
        }

        // Sync with Supabase when subscription status changes (only if RC says pro)
        // We only sync if RevenueCat confirms pro status to avoid overwriting manual grants
        const userId = getCurrentUserID();
        if (userId && hasProFromRC) {
          try {
            await syncCustomerInfo(userId);
            console.log('[PurchaseContext] Synced updated subscription status to Supabase');
          } catch (error) {
            console.error('[PurchaseContext] Error syncing updated status to Supabase:', error);
          }
        }
      });
    } catch (error) {
      console.warn('[PurchaseContext] Failed to add customer info listener:', error);
    }

    return () => {
      try {
        if (customerInfoUpdateListener?.remove) {
          customerInfoUpdateListener.remove();
        }
      } catch (error) {
        console.warn('[PurchaseContext] Failed to remove customer info listener:', error);
      }
    };
  }, []);

  return (
    <PurchaseContext.Provider value={{ isPro, isLoading, checkPurchaseStatus }}>
      {children}
    </PurchaseContext.Provider>
  );
};
