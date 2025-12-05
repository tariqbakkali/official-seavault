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
      
      // Debug: Get full customer info to inspect
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
      
      // Sync with Supabase if user is logged in
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
        const hasPro = info.entitlements.active['Pro'] !== undefined;
        setIsPro(hasPro);
        console.log('[PurchaseContext] Purchase status updated:', hasPro ? 'Pro' : 'Free');
        console.log('[PurchaseContext] DEBUG - Listener received active entitlements:', Object.keys(info.entitlements.active));
        if (info.entitlements.active['Pro']) {
          const proEntitlement = info.entitlements.active['Pro'];
          console.log('[PurchaseContext] DEBUG - Pro entitleme details:', {
            identifier: proEntitlement.identifier,
            isActive: proEntitlement.isActive,
            willRenew: proEntitlement.willRenew,
            expirationDate: proEntitlement.expirationDate,
          });
        }
        
        // Sync with Supabase when subscription status changes
        const userId = getCurrentUserID();
        if (userId) {
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
