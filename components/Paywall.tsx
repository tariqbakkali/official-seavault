import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Platform, Animated, ScrollView, Dimensions, Share } from 'react-native';
import * as Linking from 'expo-linking';
import Purchases, { PurchasesPackage } from 'react-native-purchases';
import { getOfferings, purchasePackage } from '@/services/revenueCat';
import { useShop } from '@/contexts/ShopContext';
import { COLORS, TYPOGRAPHY, DIMENSIONS } from '@/constants';
import { Waves, Fish, TrendingUp, Shield, Headphones, Sparkles, Check, Share as ShareIcon } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { getCurrentUserID } from '@/stores/syncedObservables';

interface PaywallProps {
    onClose: () => void;
}

const { width, height } = Dimensions.get('window');

// Animated bubble component
const AnimatedBubble = ({ delay }: { delay: number }) => {
    const translateY = useRef(new Animated.Value(height)).current;
    const initialX = useRef(Math.random() * width).current;
    const translateX = useRef(new Animated.Value(initialX)).current;
    const scale = useRef(new Animated.Value(0.5 + Math.random() * 0.5)).current;

    useEffect(() => {
        const animate = () => {
            translateY.setValue(height);
            translateX.setValue(initialX);
            Animated.parallel([
                Animated.timing(translateY, {
                    toValue: -100,
                    duration: 8000 + Math.random() * 4000,
                    delay,
                    useNativeDriver: true,
                }),
                Animated.sequence([
                    Animated.timing(translateX, {
                        toValue: initialX + (Math.random() - 0.5) * 100,
                        duration: 2000,
                        useNativeDriver: true,
                    }),
                    Animated.timing(translateX, {
                        toValue: initialX - (Math.random() - 0.5) * 100,
                        duration: 2000,
                        useNativeDriver: true,
                    }),
                ]),
            ]).start(() => animate());
        };
        animate();
    }, []);

    return (
        <Animated.View
            style={[
                styles.bubble,
                {
                    transform: [{ translateY }, { translateX }, { scale }],
                },
            ]}
        />
    );
};

export default function Paywall({ onClose }: PaywallProps) {
    const [packages, setPackages] = useState<PurchasesPackage[]>([]);
    const [loading, setLoading] = useState(true);
    const [purchaseSuccess, setPurchaseSuccess] = useState(false);
    const { shop, error, redeemReferral } = useShop();
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;

    useEffect(() => {
        loadOfferings();
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 600,
                useNativeDriver: true,
            }),
            Animated.spring(slideAnim, {
                toValue: 0,
                tension: 50,
                friction: 8,
                useNativeDriver: true,
            }),
        ]).start();
    }, [shop]);

    const loadOfferings = async () => {
        try {
            // If a shop referral is active, use its specific offering_id
            // Otherwise load the default offering
            const offeringId = shop?.offering_id || undefined;
            const currentOffering = await getOfferings(offeringId);
            
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
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setLoading(true);
            
            // Get current user ID
            const userId = getCurrentUserID();
            if (!userId) {
                Alert.alert('Error', 'You must be logged in to purchase.');
                return;
            }
            
            const customerInfo = await purchasePackage(pack, userId);
            if (customerInfo?.entitlements.active['Pro']) {
                // Redeem referral in background
                redeemReferral().catch(err => console.error('Referral redemption failed:', err));
                
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                setPurchaseSuccess(true);
                
                // Auto-close modal after showing success message
                setTimeout(() => {
                    onClose();
                }, 2000);
            }
        } catch (error) {
            console.error('Purchase failed', error);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert('Error', 'Purchase failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleRestore = async () => {
        try {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setLoading(true);
            const customerInfo = await Purchases.restorePurchases();
            if (customerInfo?.entitlements.active['Pro']) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                Alert.alert('Success', 'Purchases restored!');
                onClose();
            } else {
                Alert.alert('Info', 'No active subscription found.');
            }
        } catch (error) {
            console.error('Restore failed', error);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert('Error', 'Failed to restore purchases.');
        } finally {
            setLoading(false);
        }
    };

    const handleRedeemCode = async () => {
        if (Platform.OS === 'ios') {
            try {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                await Purchases.presentCodeRedemptionSheet();
            } catch (error) {
                console.error('Redemption sheet failed', error);
            }
        }
    };





    const handleShare = async () => {
        try {
            await Share.share({
                message: 'I just became a SeaVault Pro member! 🦈 Check out the app to log your dives and explore marine life.',
            });
        } catch (error) {
            console.error('Error sharing:', error);
        }
    };

    const features = [
        { icon: Waves, title: 'Unlimited Dive Logs', description: 'Log every dive without limits' },
        { icon: Fish, title: 'Full Creature Database', description: 'Access 1000+ marine species' },
        { icon: TrendingUp, title: 'Advanced Analytics', description: 'Track your diving progress' },
        { icon: Shield, title: 'Ad-Free Experience', description: 'Enjoy distraction-free diving' },
        { icon: Headphones, title: 'Priority Support', description: 'Get help when you need it' },
    ];

    if (loading) {
        return (
            <LinearGradient
                colors={['#001a33', '#003d5c', '#006b8f']}
                style={styles.loadingContainer}
            >
                {[...Array(6)].map((_, i) => (
                    <AnimatedBubble key={i} delay={i * 400} />
                ))}
                <ActivityIndicator size="large" color="#4DD0E1" />
                <Text style={styles.loadingText}>Loading premium features...</Text>
            </LinearGradient>
        );
    }

    if (purchaseSuccess) {
        return (
            <LinearGradient
                colors={['#001a33', '#003d5c', '#006b8f']}
                style={styles.container}
            >
                {[...Array(8)].map((_, i) => (
                    <AnimatedBubble key={i} delay={i * 500} />
                ))}

                <View style={styles.successContainer}>
                    <View style={styles.successIconContainer}>
                        <Check color="#fff" size={48} />
                    </View>
                    <Text style={styles.successTitle}>Welcome to Pro!</Text>
                    <Text style={styles.successSubtitle}>
                        You've successfully unlocked all premium features.
                    </Text>

                    <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
                        <ShareIcon color="#001a33" size={20} style={{ marginRight: 8 }} />
                        <Text style={styles.shareButtonText}>Share the News</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.continueButton} onPress={onClose}>
                        <Text style={styles.continueButtonText}>Continue to App</Text>
                    </TouchableOpacity>
                </View>
            </LinearGradient>
        );
    }

    return (
        <LinearGradient
            colors={['#001a33', '#003d5c', '#006b8f']}
            style={styles.container}
        >
            {/* Animated bubbles background */}
            {[...Array(8)].map((_, i) => (
                <AnimatedBubble key={i} delay={i * 500} />
            ))}



            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <Animated.View
                    style={[
                        styles.content,
                        {
                            opacity: fadeAnim,
                            transform: [{ translateY: slideAnim }],
                        },
                    ]}
                >
                    {/* Header */}
                    <View style={styles.header}>
                        <Sparkles color="#4DD0E1" size={32} />
                        <Text style={styles.title}>Unlock SeaVault Pro</Text>
                        <Text style={styles.subtitle}>
                            Dive deeper into your underwater adventures
                        </Text>
                    </View>

                    {/* Shop discount banner */}
                    {error ? (
                        <View style={styles.errorContainer}>
                            <Text style={styles.errorText}>{error}</Text>
                        </View>
                    ) : shop ? (
                        <View style={styles.discountContainer}>
                            <Text style={styles.discountBadge}>🎉 SPECIAL OFFER</Text>
                            <Text style={styles.discountText}>
                                {shop.name} Exclusive
                            </Text>
                            <Text style={styles.discountSubtext}>
                                Save {shop.discount_percent}% on Lifetime Membership
                            </Text>
                        </View>
                    ) : null}

                    {/* Features Grid */}
                    <View style={styles.featuresContainer}>
                        {features.map((feature, index) => {
                            const Icon = feature.icon;
                            return (
                                <Animated.View
                                    key={index}
                                    style={[
                                        styles.featureCard,
                                        {
                                            opacity: fadeAnim,
                                            transform: [
                                                {
                                                    translateY: slideAnim.interpolate({
                                                        inputRange: [0, 50],
                                                        outputRange: [0, 50 + index * 10],
                                                    }),
                                                },
                                            ],
                                        },
                                    ]}
                                >
                                    <View style={styles.featureIconContainer}>
                                        <Icon color="#4DD0E1" size={24} />
                                    </View>
                                    <View style={styles.featureTextContainer}>
                                        <Text style={styles.featureTitle}>{feature.title}</Text>
                                        <Text style={styles.featureDescription}>{feature.description}</Text>
                                    </View>
                                </Animated.View>
                            );
                        })}
                    </View>

                    {/* Package Selection */}
                    <View style={styles.packagesContainer}>
                        {packages.map((pack) => (
                            <TouchableOpacity
                                key={pack.identifier}
                                style={styles.packageButton}
                                onPress={() => handlePurchase(pack)}
                                activeOpacity={0.8}
                            >
                                <LinearGradient
                                    colors={['rgba(77, 208, 225, 0.2)', 'rgba(77, 208, 225, 0.05)']}
                                    style={styles.packageGradient}
                                >
                                    <View style={styles.bestValueBadge}>
                                        <Text style={styles.bestValueText}>BEST VALUE</Text>
                                    </View>
                                    <Text style={styles.packageTitle}>{pack.product.title}</Text>
                                    <View style={styles.priceContainer}>
                                        <Text style={styles.packagePrice}>{pack.product.priceString}</Text>
                                        {shop && (
                                            <Text style={styles.originalPrice}>
                                                (Normally £39.99)
                                            </Text>
                                        )}
                                    </View>
                                    <Text style={styles.packageSubtitle}>One-time payment • Lifetime access</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Footer */}
                    <View style={styles.footer}>
                        <TouchableOpacity onPress={handleRestore}>
                            <Text style={styles.footerText}>Restore Purchases</Text>
                        </TouchableOpacity>

                        {Platform.OS === 'ios' && (
                            <TouchableOpacity onPress={handleRedeemCode}>
                                <Text style={styles.footerText}>Redeem App Store Code</Text>
                            </TouchableOpacity>
                        )}

                        {/* Manual Referral Code Entry */}
                        <View style={styles.legalLinksContainer}>
                            <TouchableOpacity onPress={() => Linking.openURL('https://seavault.co.uk/privacy')}>
                                <Text style={styles.legalLink}>Privacy Policy</Text>
                            </TouchableOpacity>
                            <Text style={styles.legalLinkSeparator}>•</Text>
                            <TouchableOpacity onPress={() => Linking.openURL('https://seavault.co.uk/terms')}>
                                <Text style={styles.legalLink}>Terms of Use</Text>
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.termsText}>
                            By purchasing, you agree to our Terms of Service
                        </Text>
                    </View>
                </Animated.View>
            </ScrollView>
        </LinearGradient>
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
    },
    loadingText: {
        color: '#4DD0E1',
        fontSize: TYPOGRAPHY.SIZE_MD,
        marginTop: DIMENSIONS.MARGIN_MD,
        fontWeight: '600',
    },
    bubble: {
        position: 'absolute',
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: 'rgba(77, 208, 225, 0.15)',
        borderWidth: 1,
        borderColor: 'rgba(77, 208, 225, 0.3)',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingTop: 80,
        paddingBottom: 40,
    },
    content: {
        paddingHorizontal: DIMENSIONS.PADDING_LG,
    },
    closeButton: {
        position: 'absolute',
        top: 50,
        right: 20,
        zIndex: 10,
    },
    closeButtonInner: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    header: {
        alignItems: 'center',
        marginBottom: DIMENSIONS.MARGIN_XL,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#fff',
        marginTop: DIMENSIONS.MARGIN_SM,
        marginBottom: DIMENSIONS.MARGIN_XS,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: TYPOGRAPHY.SIZE_LG,
        color: 'rgba(255, 255, 255, 0.8)',
        textAlign: 'center',
        paddingHorizontal: DIMENSIONS.PADDING_MD,
    },
    errorContainer: {
        backgroundColor: 'rgba(255, 59, 48, 0.15)',
        padding: DIMENSIONS.PADDING_MD,
        borderRadius: 16,
        marginBottom: DIMENSIONS.MARGIN_LG,
        borderWidth: 1,
        borderColor: 'rgba(255, 59, 48, 0.3)',
    },
    errorText: {
        color: '#FF6B6B',
        fontSize: TYPOGRAPHY.SIZE_MD,
        textAlign: 'center',
        fontWeight: '600',
    },
    discountContainer: {
        backgroundColor: 'rgba(255, 215, 0, 0.15)',
        padding: DIMENSIONS.PADDING_LG,
        borderRadius: 16,
        marginBottom: DIMENSIONS.MARGIN_XL,
        borderWidth: 2,
        borderColor: 'rgba(255, 215, 0, 0.4)',
        alignItems: 'center',
    },
    discountBadge: {
        fontSize: TYPOGRAPHY.SIZE_SM,
        fontWeight: 'bold',
        color: '#FFD700',
        letterSpacing: 1,
        marginBottom: 4,
    },
    discountText: {
        fontSize: TYPOGRAPHY.SIZE_XL,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 4,
    },
    discountSubtext: {
        fontSize: TYPOGRAPHY.SIZE_MD,
        color: 'rgba(255, 255, 255, 0.9)',
    },
    featuresContainer: {
        marginBottom: DIMENSIONS.MARGIN_XL,
    },
    featureCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        padding: DIMENSIONS.PADDING_MD,
        borderRadius: 12,
        marginBottom: DIMENSIONS.MARGIN_SM,
        borderWidth: 1,
        borderColor: 'rgba(77, 208, 225, 0.2)',
    },
    featureIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(77, 208, 225, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: DIMENSIONS.MARGIN_MD,
    },
    featureTextContainer: {
        flex: 1,
    },
    featureTitle: {
        fontSize: TYPOGRAPHY.SIZE_MD,
        fontWeight: '600',
        color: '#fff',
        marginBottom: 2,
    },
    featureDescription: {
        fontSize: TYPOGRAPHY.SIZE_SM,
        color: 'rgba(255, 255, 255, 0.7)',
    },
    packagesContainer: {
        marginBottom: DIMENSIONS.MARGIN_XL,
    },
    packageButton: {
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: '#4DD0E1',
        shadowColor: '#4DD0E1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    packageGradient: {
        padding: DIMENSIONS.PADDING_XL,
        alignItems: 'center',
    },
    bestValueBadge: {
        backgroundColor: '#4DD0E1',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        marginBottom: DIMENSIONS.MARGIN_SM,
    },
    bestValueText: {
        fontSize: TYPOGRAPHY.SIZE_XS,
        fontWeight: 'bold',
        color: '#001a33',
        letterSpacing: 1,
    },
    packageTitle: {
        fontSize: TYPOGRAPHY.SIZE_LG,
        fontWeight: '600',
        color: '#fff',
        marginBottom: DIMENSIONS.MARGIN_SM,
    },
    priceContainer: {
        alignItems: 'center',
        marginBottom: DIMENSIONS.MARGIN_XS,
    },
    packagePrice: {
        fontSize: 36,
        fontWeight: 'bold',
        color: '#4DD0E1',
    },
    originalPrice: {
        fontSize: TYPOGRAPHY.SIZE_SM,
        color: 'rgba(255, 255, 255, 0.5)',
        textDecorationLine: 'line-through',
        marginTop: 4,
    },
    packageSubtitle: {
        fontSize: TYPOGRAPHY.SIZE_SM,
        color: 'rgba(255, 255, 255, 0.8)',
        fontWeight: '500',
    },
    footer: {
        alignItems: 'center',
        gap: DIMENSIONS.GAP_MD,
        paddingTop: DIMENSIONS.PADDING_MD,
    },
    footerText: {
        color: 'rgba(255, 255, 255, 0.7)',
        fontSize: TYPOGRAPHY.SIZE_MD,
        textDecorationLine: 'underline',
        fontWeight: '500',
    },

    termsText: {
        color: 'rgba(255, 255, 255, 0.5)',
        fontSize: TYPOGRAPHY.SIZE_XS,
        textAlign: 'center',
        marginTop: DIMENSIONS.MARGIN_SM,
    },
    successContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: DIMENSIONS.PADDING_XL,
    },
    successIconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#4DD0E1',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: DIMENSIONS.MARGIN_XL,
        shadowColor: '#4DD0E1',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 10,
    },
    successTitle: {
        fontSize: 36,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: DIMENSIONS.MARGIN_MD,
        textAlign: 'center',
    },
    successSubtitle: {
        fontSize: TYPOGRAPHY.SIZE_LG,
        color: 'rgba(255, 255, 255, 0.8)',
        textAlign: 'center',
        marginBottom: 48,
        lineHeight: 28,
    },
    shareButton: {
        flexDirection: 'row',
        backgroundColor: '#4DD0E1',
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 30,
        alignItems: 'center',
        marginBottom: DIMENSIONS.MARGIN_MD,
        width: '100%',
        justifyContent: 'center',
        shadowColor: '#4DD0E1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    shareButtonText: {
        color: '#001a33',
        fontSize: TYPOGRAPHY.SIZE_LG,
        fontWeight: 'bold',
    },
    continueButton: {
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 30,
        alignItems: 'center',
        width: '100%',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    continueButtonText: {
        color: '#fff',
        fontSize: TYPOGRAPHY.SIZE_LG,
        fontWeight: '600',
    },
    legalLinksContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: DIMENSIONS.MARGIN_MD,
        gap: DIMENSIONS.GAP_SM,
    },
    legalLink: {
        color: 'rgba(255, 255, 255, 0.6)',
        fontSize: TYPOGRAPHY.SIZE_SM,
        textDecorationLine: 'underline',
    },
    legalLinkSeparator: {
        color: 'rgba(255, 255, 255, 0.4)',
        fontSize: TYPOGRAPHY.SIZE_SM,
    },
});
