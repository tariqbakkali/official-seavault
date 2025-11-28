import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Platform } from 'react-native';
import Purchases, { PurchasesPackage } from 'react-native-purchases';
import { getOfferings, purchasePackage } from '@/services/revenueCat';
import { useShop } from '@/contexts/ShopContext';
import { COLORS, TYPOGRAPHY, DIMENSIONS } from '@/constants';
import { X } from 'lucide-react-native';

interface PaywallProps {
    onClose: () => void;
}

export default function Paywall({ onClose }: PaywallProps) {
    const [packages, setPackages] = useState<PurchasesPackage[]>([]);
    const [loading, setLoading] = useState(true);
    const { shop, error, redeemReferral } = useShop();

    useEffect(() => {
        loadOfferings();
    }, []);

    const loadOfferings = async () => {
        try {
            const currentOffering = await getOfferings();
            if (currentOffering) {
                setPackages(currentOffering.availablePackages);
            }
        } catch (error) {
            console.error('Error loading offerings', error);
            Alert.alert('Error', 'Failed to load subscription options.');
        } finally {
            setLoading(false);
        }
    };

    const handlePurchase = async (pack: PurchasesPackage) => {
        try {
            setLoading(true);
            const customerInfo = await purchasePackage(pack);
            if (customerInfo?.entitlements.active['pro']) {
                const result = await redeemReferral();
                if (result.success) {
                    Alert.alert('Success', 'You are now a Pro member! ' + result.message);
                } else {
                    Alert.alert('Success', 'You are now a Pro member!');
                }
                onClose();
            }
        } catch (error) {
            console.error('Purchase failed', error);
            Alert.alert('Error', 'Purchase failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleRestore = async () => {
        try {
            setLoading(true);
            const customerInfo = await Purchases.restorePurchases();
            if (customerInfo?.entitlements.active['pro']) {
                Alert.alert('Success', 'Purchases restored!');
                onClose();
            } else {
                Alert.alert('Info', 'No active subscription found.');
            }
        } catch (error) {
            console.error('Restore failed', error);
            Alert.alert('Error', 'Failed to restore purchases.');
        } finally {
            setLoading(false);
        }
    };

    const handleRedeemCode = async () => {
        if (Platform.OS === 'ios') {
            try {
                await Purchases.presentCodeRedemptionSheet();
            } catch (error) {
                console.error('Redemption sheet failed', error);
            }
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.PRIMARY} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <X color="#fff" size={24} />
            </TouchableOpacity>

            <Text style={styles.title}>Unlock SeaVault Pro</Text>

            {error ? (
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                </View>
            ) : shop ? (
                <View style={styles.discountContainer}>
                    <Text style={styles.discountText}>
                        Special Offer from {shop.name}!
                    </Text>
                    <Text style={styles.discountSubtext}>
                        Save {shop.discount_percent}% on Lifetime Membership
                    </Text>
                </View>
            ) : (
                <Text style={styles.subtitle}>
                    Get unlimited access to all features.
                </Text>
            )}

            <View style={styles.packagesContainer}>
                {packages.map((pack) => (
                    <TouchableOpacity
                        key={pack.identifier}
                        style={styles.packageButton}
                        onPress={() => handlePurchase(pack)}
                    >
                        <Text style={styles.packageTitle}>{pack.product.title}</Text>
                        <Text style={styles.packagePrice}>{pack.product.priceString}</Text>
                        {shop && (
                            <Text style={styles.originalPrice}>
                                (Normally $39.99)
                            </Text>
                        )}
                    </TouchableOpacity>
                ))}
            </View>

            <View style={styles.footer}>
                <TouchableOpacity onPress={handleRestore}>
                    <Text style={styles.footerText}>Restore Purchases</Text>
                </TouchableOpacity>

                {Platform.OS === 'ios' && (
                    <TouchableOpacity onPress={handleRedeemCode}>
                        <Text style={styles.footerText}>Redeem Offer Code</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
        padding: DIMENSIONS.PADDING_XL,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingContainer: {
        flex: 1,
        backgroundColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeButton: {
        position: 'absolute',
        top: 50,
        right: 20,
        padding: 10,
    },
    title: {
        fontSize: TYPOGRAPHY.SIZE_XXXL,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: DIMENSIONS.MARGIN_MD,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: TYPOGRAPHY.SIZE_LG,
        color: '#ccc',
        marginBottom: DIMENSIONS.MARGIN_XL,
        textAlign: 'center',
    },
    errorContainer: {
        backgroundColor: 'rgba(255, 59, 48, 0.1)',
        padding: DIMENSIONS.PADDING_MD,
        borderRadius: 12,
        marginBottom: DIMENSIONS.MARGIN_LG,
        borderWidth: 1,
        borderColor: 'rgba(255, 59, 48, 0.3)',
    },
    errorText: {
        color: '#FF3B30',
        fontSize: TYPOGRAPHY.SIZE_MD,
        textAlign: 'center',
        fontWeight: '600',
    },
    discountContainer: {
        backgroundColor: 'rgba(255, 215, 0, 0.1)',
        padding: DIMENSIONS.PADDING_MD,
        borderRadius: 12,
        marginBottom: DIMENSIONS.MARGIN_LG,
        borderWidth: 1,
        borderColor: 'rgba(255, 215, 0, 0.3)',
    },
    discountText: {
        fontSize: TYPOGRAPHY.SIZE_XL,
        fontWeight: 'bold',
        color: '#FFD700',
        marginBottom: 4,
        textAlign: 'center',
    },
    discountSubtext: {
        fontSize: TYPOGRAPHY.SIZE_MD,
        color: '#fff',
        textAlign: 'center',
    },
    packagesContainer: {
        width: '100%',
        gap: DIMENSIONS.GAP_MD,
    },
    packageButton: {
        backgroundColor: '#1a1a1a',
        padding: DIMENSIONS.PADDING_XL,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#333',
    },
    packageTitle: {
        fontSize: TYPOGRAPHY.SIZE_LG,
        fontWeight: '600',
        color: '#fff',
        marginBottom: 4,
    },
    packagePrice: {
        fontSize: TYPOGRAPHY.SIZE_XXL,
        fontWeight: 'bold',
        color: COLORS.PRIMARY,
    },
    originalPrice: {
        fontSize: TYPOGRAPHY.SIZE_SM,
        color: '#666',
        textDecorationLine: 'line-through',
        marginTop: 2,
    },
    footer: {
        marginTop: DIMENSIONS.MARGIN_XL,
        gap: DIMENSIONS.GAP_MD,
        alignItems: 'center',
    },
    footerText: {
        color: '#666',
        fontSize: TYPOGRAPHY.SIZE_MD,
        textDecorationLine: 'underline',
    },
});
