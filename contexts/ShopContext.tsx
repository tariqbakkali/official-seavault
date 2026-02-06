import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/services/supabase';
import { setShopIdAttribute, initRevenueCat, isRevenueCatConfigured } from '@/services/revenueCat';
import { initAppsFlyer, onAppsFlyerDeepLink, getDeviceIDFA } from '@/services/appsFlyer';
import Purchases from 'react-native-purchases';
import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { usePurchase } from '@/contexts/PurchaseContext';

import { Database } from '@/types/database';

type Shop = Database['public']['Tables']['dive_shops']['Row'];

interface ShopContextType {
    referralCode: string | null;
    shop: Shop | null;
    isLoading: boolean;
    error: string | null;
    setReferralCode: (code: string | null) => Promise<void>;
    redeemReferral: () => Promise<{ success: boolean; message: string }>;
}

const ShopContext = createContext<ShopContextType | undefined>(undefined);

export const ShopProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [referralCode, setReferralCodeState] = useState<string | null>(null);
    const [shop, setShop] = useState<Shop | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [shouldNavigateToPaywall, setShouldNavigateToPaywall] = useState(false);

    // Prevent duplicate deep link navigations
    const handledDeepLinks = useRef<Set<string>>(new Set());

    const { isPro, isLoading: isPurchaseLoading } = usePurchase();

    useEffect(() => {
        const init = async () => {
            await initRevenueCat();
            // Initialize AppsFlyer
            try {
                await initAppsFlyer();
                console.log('AppsFlyer initialized');
                // Get and log device ID for testing
                const deviceId = await getDeviceIDFA();
                console.log('✅ AppsFlyer Device ID:', deviceId);
            } catch (error) {
                console.error('AppsFlyer init failed:', error);
            }
            loadReferralCode();
        };
        init();
        handleDeepLinking();
        handleAppsFlyerDeepLink();
    }, []);

    useEffect(() => {
        if (referralCode) {
            console.log('🔍 Fetching shop with code:', referralCode);
            fetchShop(referralCode);
        } else {
            setShop(null);
        }
    }, [referralCode]);

    // Handle navigation to paywall when shop is loaded and user is not Pro
    useEffect(() => {
        const checkAuthAndNavigate = async () => {
            if (shouldNavigateToPaywall && shop && !isPurchaseLoading) {
                const { data: { session } } = await supabase.auth.getSession();

                if (!session?.user) {
                    console.log('User not logged in, skipping paywall navigation');
                    setShouldNavigateToPaywall(false);
                    return;
                }

                if (!isPro) {
                    console.log('Navigating to paywall for referral:', referralCode);
                    setTimeout(() => {
                        router.push('/modal/paywall');
                    }, 500);
                } else {
                    console.log('User is already Pro, skipping paywall navigation');
                }
                setShouldNavigateToPaywall(false);
            }
        };

        checkAuthAndNavigate();
    }, [shouldNavigateToPaywall, shop, isPurchaseLoading, isPro]);

    useEffect(() => {
        // Listen for auth changes to handle deferred referral redemption
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN' && session?.user && referralCode) {
                console.log('User signed in, re-applying referral code:', referralCode);
                // Re-fetch shop to apply attributes to the new user
                await fetchShop(referralCode);
                setShouldNavigateToPaywall(true);
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [referralCode]);

    const handleAppsFlyerDeepLink = () => {
        onAppsFlyerDeepLink((deepLinkData) => {
            console.log('AppsFlyer deep link data:', JSON.stringify(deepLinkData, null, 2));

            // Check for dive template deep link first
            const deepLinkValue = deepLinkData?.deep_link_value?.toString() || '';
            if (deepLinkValue.startsWith('dive/template/')) {
                const templateId = deepLinkValue.replace('dive/template/', '');
                console.log('Raw AppsFlyer deep link for template:', templateId);

                // Prevent duplicate navigation
                if (handledDeepLinks.current.has(templateId)) {
                    console.log('Already navigated to template (blocked by guard):', templateId);
                    return;
                }
                handledDeepLinks.current.add(templateId);

                // Allow rescanning after 5 seconds
                setTimeout(() => {
                    handledDeepLinks.current.delete(templateId);
                }, 5000);


                console.log('Navigating to dive template (REPLACE):', templateId);
                setTimeout(() => {
                    try {
                        router.replace({
                            pathname: '/dive/template/[id]',
                            params: { id: templateId }
                        } as any);
                    } catch (e) {
                        console.error('Navigation error:', e);
                    }
                }, 500);
                return; // Don't process as referral code
            }

            // Prioritize explicit code parameters from the link data
            let code = deepLinkData?.params?.code ||
                deepLinkData?.data?.code ||
                deepLinkData?.code;

            // If no explicit code param, check deep_link_value but validate it
            if (!code && deepLinkData?.deep_link_value) {
                const value = deepLinkData.deep_link_value.toString();

                // IGNORE generic schemes or likely URLs that aren't codes
                // "seavault://ref" is the deep_link_value for some campaigns but NOT the code itself
                if (
                    value === 'seavault://ref' ||
                    value.startsWith('seavault://') ||
                    value.startsWith('http') ||
                    value.includes('/')
                ) {
                    console.log('Ignoring generic deep link value:', value);
                } else {
                    code = value;
                }
            }

            // Also check for 'code' in the query params of the deep link value url if it exists
            if (!code && deepLinkData?.deep_link_value) {
                try {
                    // Try to parse as URL to see if it has ?code=...
                    const url = deepLinkData.deep_link_value.toString();
                    if (url.includes('code=')) {
                        const match = url.match(/[?&]code=([^&]+)/);
                        if (match && match[1]) {
                            code = match[1];
                        }
                    }
                } catch (e) {
                    // ignore parse error
                }
            }

            console.log('AppsFlyer extracted code (raw):', code);

            if (code) {
                // Sanitize code: remove quotes if present, trim whitespace
                code = code.toString().replace(/['"]+/g, '').trim();
                console.log('AppsFlyer extracted code (sanitized):', code);
                setReferralCode(code);
                setShouldNavigateToPaywall(true);
            }
        });
    };

    const handleDeepLinking = () => {
        const handleUrl = (event: { url: string }) => {
            console.log('Deep Link URL:', event.url);
            const parsed = Linking.parse(event.url);
            const { queryParams, path } = parsed;
            console.log('Deep Link Parsed:', { path, queryParams });

            // Check for dive template path (seavault://dive/template/{id} or via OneLink)
            if (path?.startsWith('dive/template/')) {
                const templateId = path.replace('dive/template/', '');
                console.log('Raw deep link event for template:', templateId);

                // Prevent duplicate navigation
                if (handledDeepLinks.current.has(templateId)) {
                    console.log('Already navigated to template (blocked by guard):', templateId);
                    return;
                }
                handledDeepLinks.current.add(templateId);

                // Allow rescanning after 5 seconds
                setTimeout(() => {
                    handledDeepLinks.current.delete(templateId);
                }, 5000);


                console.log('Navigating to dive template (REPLACE):', templateId);
                setTimeout(() => {
                    try {
                        router.replace({
                            pathname: '/dive/template/[id]',
                            params: { id: templateId }
                        } as any);
                    } catch (e) {
                        console.error('Navigation error:', e);
                    }
                }, 500);
                return;
            }

            // Check for deep_link_value query param (OneLink format)
            const deepLinkValue = queryParams?.deep_link_value as string;
            if (deepLinkValue?.startsWith('dive/template/')) {
                const templateId = deepLinkValue.replace('dive/template/', '');

                // Prevent duplicate navigation
                if (handledDeepLinks.current.has(templateId)) {
                    console.log('Already navigated to template:', templateId);
                    return;
                }
                handledDeepLinks.current.add(templateId);

                console.log('Navigating to dive template from OneLink:', templateId);
                setTimeout(() => {
                    router.push(`/dive/template/${templateId}` as any);
                }, 500);
                return;
            }

            // Check for 'code' parameter as per new workflow
            let code = queryParams?.code as string;

            if (code) {
                // Sanitize code
                code = code.toString().replace(/['"]+/g, '').trim();
                console.log('Deep Link extracted code (sanitized):', code);
                setReferralCode(code);
                setShouldNavigateToPaywall(true);
            }
        };

        const subscription = Linking.addEventListener('url', handleUrl);
        Linking.getInitialURL().then((url) => {
            if (url) {
                handleUrl({ url });
            }
        });

        return () => subscription.remove();
    };

    const loadReferralCode = async () => {
        try {
            const storedCode = await AsyncStorage.getItem('referral_code');
            if (storedCode) {
                setReferralCodeState(storedCode);
            }
        } catch (error) {
            console.error('Failed to load referral code', error);
        } finally {
            setIsLoading(false);
        }
    };

    const setReferralCode = async (code: string | null) => {
        try {
            if (code) {
                await AsyncStorage.setItem('referral_code', code);
            } else {
                await AsyncStorage.removeItem('referral_code');
            }
            setReferralCodeState(code);
        } catch (error) {
            console.error('Failed to save referral code', error);
        }
    };

    const fetchShop = async (code: string) => {
        try {
            setError(null);

            console.log('🔍 Fetching shop with code:', code);
            console.log('🔍 Code length:', code.length);
            console.log('🔍 Code trimmed:', code.trim());

            const { data, error } = await supabase
                .from('dive_shops')
                .select('*')
                .eq('referral_code', code.trim())
                .maybeSingle();

            console.log('🔍 Supabase response:', { data, error });

            if (error) {
                console.error('Error fetching shop:', error);
                setError('An error occurred while validating the code.');
                setShop(null);
                return;
            }

            if (!data) {
                console.log('❌ Shop not found for code:', code);
                setError('Invalid referral code. Please check and try again.');
                setShop(null);
                return;
            }

            const shopData = data as unknown as Shop;
            console.log('✅ Shop found:', shopData.name, 'Offering:', shopData.offering_id);


            if (!shopData.is_active) {
                setError('This referral code is no longer active.');
                setShop(null);
                return;
            }

            setShop(shopData);
            setError(null);

            // Set RevenueCat attributes for tracking and offering switching
            if (shopData?.referral_code) {
                const isConfigured = await isRevenueCatConfigured();
                if (isConfigured) {
                    await Purchases.setAttributes({ referral_code: shopData.referral_code });

                    // Only log in as referral user if NO user is currently logged in
                    // This prevents overwriting the real user's identity
                    const { data: { session } } = await supabase.auth.getSession();
                    if (!session?.user) {
                        try {
                            await Purchases.logIn(`ref_${shopData.referral_code}`);
                        } catch (e) {
                            console.error('Error logging in to RevenueCat with referral code', e);
                        }
                    } else {
                        console.log('User logged in, skipping referral user login but attributes set');
                    }
                } else {
                    console.warn('RevenueCat not configured, skipping attributes/login');
                }
            }

            if (shopData?.id) {
                await setShopIdAttribute(shopData.id.toString());
            }
        } catch (error) {
            console.error('Error fetching shop:', error);
            setError('Unable to validate referral code. Please try again.');
            setShop(null);
        }
    };

    const redeemReferral = async (): Promise<{ success: boolean; message: string }> => {
        if (!referralCode || !shop) {
            return { success: false, message: 'No active referral code' };
        }

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) {
                return { success: false, message: 'Please sign in to redeem referral' };
            }

            const { data, error } = await supabase.rpc('redeem_shop_referral', {
                ref_code: referralCode
            } as any);

            if (error) {
                console.error('Error redeeming referral:', error);
                if (error.message?.includes('already redeemed')) {
                    return { success: false, message: 'You have already redeemed this referral code' };
                }
                return { success: false, message: 'Failed to redeem referral. Please try again.' };
            }

            console.log('Referral redeemed successfully:', data);
            return { success: true, message: 'Referral applied successfully!' };
        } catch (error) {
            console.error('Error redeeming referral:', error);
            return { success: false, message: 'An error occurred. Please try again.' };
        }
    };

    return (
        <ShopContext.Provider value={{ referralCode, shop, isLoading, error, setReferralCode, redeemReferral }}>
            {children}
        </ShopContext.Provider>
    );
};

export const useShop = () => {
    const context = useContext(ShopContext);
    if (context === undefined) {
        throw new Error('useShop must be used within a ShopProvider');
    }
    return context;
};
