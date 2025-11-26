import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Dimensions,
    TouchableOpacity,
    FlatList,
    ViewToken,
    ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Waves, BookOpen, Fish, Wifi, Compass } from 'lucide-react-native';
import { setOnboardingComplete } from '@/utils/onboardingStorage';
import { COLORS, TYPOGRAPHY, DIMENSIONS } from '@/constants';

const { width, height } = Dimensions.get('window');

interface OnboardingSlide {
    id: string;
    title: string;
    description: string;
    icon: React.ReactNode;
    gradient: readonly [string, string, ...string[]];
}

const slides: OnboardingSlide[] = [
    {
        id: '1',
        title: 'Welcome to SeaVault',
        description: 'Your personal underwater adventure companion',
        icon: <Compass size={80} color="#fff" />,
        gradient: ['#0f2027', '#203a43', '#2c5364'] as const,
    },
    {
        id: '2',
        title: 'Log Your Dives',
        description: 'Easily record every dive with location, depth, and marine life',
        icon: <Waves size={80} color="#fff" />,
        gradient: ['#1e3c72', '#2a5298', '#7597de'] as const,
    },
    {
        id: '3',
        title: 'Digital Logbook',
        description: 'Keep a lifetime record of all your underwater adventures',
        icon: <BookOpen size={80} color="#fff" />,
        gradient: ['#134e5e', '#71b280'] as const,
    },
    {
        id: '4',
        title: 'Track Marine Life',
        description: 'Collect and identify thousands of ocean creatures',
        icon: <Fish size={80} color="#fff" />,
        gradient: ['#0575e6', '#021b79'] as const,
    },
    {
        id: '5',
        title: 'Offline Support',
        description: 'Access your dives and creatures anywhere, even without internet',
        icon: <Wifi size={80} color="#fff" />,
        gradient: ['#1a2980', '#26d0ce'] as const,
    },
];

export default function OnboardingScreen() {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loadingState, setLoadingState] = useState<'idle' | 'skipping' | 'completing'>('idle');
    const flatListRef = useRef<FlatList>(null);

    const onViewableItemsChanged = useRef(
        ({ viewableItems }: { viewableItems: ViewToken[] }) => {
            if (viewableItems.length > 0) {
                setCurrentIndex(viewableItems[0].index || 0);
            }
        }
    ).current;

    const viewabilityConfig = useRef({
        itemVisiblePercentThreshold: 50,
    }).current;

    const handleNext = () => {
        if (currentIndex < slides.length - 1) {
            flatListRef.current?.scrollToIndex({
                index: currentIndex + 1,
                animated: true,
            });
        } else {
            handleGetStarted();
        }
    };

    const handleSkip = async () => {
        setLoadingState('skipping');
        try {
            await setOnboardingComplete();
            router.replace('/(auth)/login');
        } catch (error) {
            console.error('Error saving onboarding status:', error);
            setLoadingState('idle');
        }
    };

    const handleGetStarted = async () => {
        setLoadingState('completing');
        try {
            await setOnboardingComplete();
            router.replace('/(auth)/login');
        } catch (error) {
            console.error('Error saving onboarding status:', error);
            setLoadingState('idle');
        }
    };

    const renderSlide = ({ item }: { item: OnboardingSlide }) => {
        return (
            <LinearGradient colors={item.gradient} style={styles.slide}>
                <View style={styles.content}>
                    <View style={styles.iconContainer}>{item.icon}</View>
                    <Text style={styles.title}>{item.title}</Text>
                    <Text style={styles.description}>{item.description}</Text>
                </View>
            </LinearGradient>
        );
    };

    return (
        <View style={styles.container}>
            {/* Skip Button */}
            {/* Skip Button */}
            <TouchableOpacity
                style={styles.skipButton}
                onPress={handleSkip}
                disabled={loadingState !== 'idle'}
            >
                {loadingState === 'skipping' ? (
                    <ActivityIndicator size="small" color="#fff" />
                ) : (
                    <Text style={[styles.skipText, loadingState !== 'idle' && { opacity: 0.5 }]}>Skip</Text>
                )}
            </TouchableOpacity>

            {/* Slides */}
            <FlatList
                ref={flatListRef}
                data={slides}
                renderItem={renderSlide}
                keyExtractor={(item) => item.id}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                bounces={false}
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={viewabilityConfig}
            />

            {/* Pagination Dots */}
            <View style={styles.pagination}>
                {slides.map((_, index) => (
                    <View
                        key={index}
                        style={[
                            styles.dot,
                            currentIndex === index && styles.activeDot,
                        ]}
                    />
                ))}
            </View>

            {/* Next / Get Started Button */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.nextButton, loadingState !== 'idle' && { opacity: 0.8 }]}
                    onPress={handleNext}
                    disabled={loadingState !== 'idle'}
                >
                    {loadingState === 'completing' ? (
                        <ActivityIndicator size="small" color="#000" />
                    ) : (
                        <Text style={styles.nextButtonText}>
                            {currentIndex === slides.length - 1 ? 'Get Started' : 'Next'}
                        </Text>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    skipButton: {
        position: 'absolute',
        top: 60,
        right: 20,
        zIndex: 10,
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    skipText: {
        color: '#fff',
        fontSize: TYPOGRAPHY.SIZE_MD,
        fontWeight: '600',
        opacity: 0.8,
    },
    slide: {
        width,
        height,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: DIMENSIONS.PADDING_XL,
    },
    iconContainer: {
        marginBottom: DIMENSIONS.SPACE_XXL,
    },
    title: {
        fontSize: TYPOGRAPHY.SIZE_XXXL,
        fontWeight: TYPOGRAPHY.WEIGHT_BOLD,
        color: '#fff',
        textAlign: 'center',
        marginBottom: DIMENSIONS.SPACE_LG,
    },
    description: {
        fontSize: TYPOGRAPHY.SIZE_LG,
        color: 'rgba(255, 255, 255, 0.8)',
        textAlign: 'center',
        lineHeight: 24,
        paddingHorizontal: DIMENSIONS.PADDING_LG,
    },
    pagination: {
        position: 'absolute',
        bottom: 140,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
    },
    activeDot: {
        width: 24,
        backgroundColor: '#fff',
    },
    footer: {
        position: 'absolute',
        bottom: 60,
        left: 0,
        right: 0,
        paddingHorizontal: DIMENSIONS.PADDING_XL,
    },
    nextButton: {
        backgroundColor: '#fff',
        paddingVertical: DIMENSIONS.SPACE_LG,
        borderRadius: DIMENSIONS.RADIUS_LG,
        alignItems: 'center',
    },
    nextButtonText: {
        color: '#000',
        fontSize: TYPOGRAPHY.SIZE_LG,
        fontWeight: TYPOGRAPHY.WEIGHT_BOLD,
    },
});
