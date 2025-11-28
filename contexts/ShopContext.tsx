import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/services/supabase';
import { setShopIdAttribute } from '@/services/revenueCat';
import * as Linking from 'expo-linking';

interface Shop {
    id: number;
    name: string;
    referral_code: string;
    discount_percent: number;
    lifetime: boolean;
    is_active: boolean;
    ios_link?: string;
    android_link?: string;
}

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

    useEffect(() => {
        loadReferralCode();
        handleDeepLinking();
    }, []);

    useEffect(() => {
        if (referralCode) {
            fetchShop(referralCode);
        } else {
            setShop(null);
        }
    }, [referralCode]);

    const handleDeepLinking = () => {
        const handleUrl = (event: { url: string }) => {
            const { queryParams } = Linking.parse(event.url);
            if (queryParams?.ref) {
                setReferralCode(queryParams.ref as string);
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
            const { data, error } = await supabase
                .from('dive_shops')
                .select('*')
                .eq('referral_code', code)
                .single();

            if (error) {
                console.error('Error fetching shop:', error);
                setError('Invalid referral code. Please check and try again.');
                setShop(null);
                return;
            }

            const shopData = data as unknown as Shop;

            if (!shopData.is_active) {
                setError('This referral code is no longer active.');
                setShop(null);
                return;
            }

            setShop(shopData);
            setError(null);

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
