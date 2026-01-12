import React, { useRef, useEffect, useState } from 'react';
import { View, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import RevenueCatUI, { PAYWALL_RESULT } from 'react-native-purchases-ui';
import { useShop } from '@/contexts/ShopContext';
import { getCurrentUserID } from '@/stores/syncedObservables';
import Purchases, { PurchasesOffering } from 'react-native-purchases';
import * as Haptics from 'expo-haptics';

interface PaywallProps {
    onClose: () => void;
}

export default function DynamicPaywall({ onClose }: PaywallProps) {
    const { shop, redeemReferral } = useShop();
    const [offering, setOffering] = useState<PurchasesOffering | null>(null);

    useEffect(() => {
        const loadOffering = async () => {
            if (shop?.offering_id) {
                try {
                    // Check if we're online before attempting to fetch offerings
                    const isOnline = require('@/stores/networkStore').getIsOnline();
                    if (!isOnline) {
                        console.log('[Paywall] Offline, skipping offering fetch');
                        return;
                    }

                    const offerings = await Purchases.getOfferings();
                    if (offerings.all[shop.offering_id]) {
                        setOffering(offerings.all[shop.offering_id]);
                    }
                } catch (e) {
                    console.error('Failed to load specific offering', e);
                    // Don't show alert - just log the error
                }
            }
        };
        loadOffering();
    }, [shop]);

    const handlePurchaseCompleted = async (customerInfo: any) => {
        try {
            if (customerInfo?.entitlements.active['Pro']) {
                // Redeem referral in background
                redeemReferral().catch(err => console.error('Referral redemption failed:', err));

                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                // The Paywall UI handles the success state mostly, but we can close it
                // Or let the user dismiss it if the UI provides a close button
            }
        } catch (error) {
            console.error('Post-purchase handling failed', error);
        }
    };

    const handleRestoreCompleted = (customerInfo: any) => {
        if (customerInfo?.entitlements.active['Pro']) {
            Alert.alert('Success', 'Purchases restored!');
            onClose();
        } else {
            Alert.alert('Info', 'No active subscription found.');
        }
    };

    return (
        <View style={styles.container}>
            <RevenueCatUI.Paywall
                options={{
                    offering: offering || undefined,
                }}
                onPurchaseCompleted={({ customerInfo }) => {
                    handlePurchaseCompleted(customerInfo);
                }}
                onRestoreCompleted={({ customerInfo }) => {
                    handleRestoreCompleted(customerInfo);
                }}
                onDismiss={() => {
                    onClose();
                }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000',
    },
});
