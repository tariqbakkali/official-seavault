import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Dimensions,
} from 'react-native';
import { ImageWithFallback } from '@/components';
import { Certification } from '@/types/database';
import { getAgencyInfo, refreshCertificationUrls, CertificationAgency } from '@/services/certificationService';
import { TYPOGRAPHY, DIMENSIONS as DIMS } from '@/constants';

interface CertificationCardProps {
    certification: Certification;
    onPress?: () => void;
    compact?: boolean;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.85;
const CARD_HEIGHT = CARD_WIDTH * 0.63; // Credit card ratio

const CertificationCard: React.FC<CertificationCardProps> = ({
    certification,
    onPress,
    compact = false,
}) => {
    const [isFlipped, setIsFlipped] = useState(false);
    const [frontUrl, setFrontUrl] = useState<string | null>(null);
    const [backUrl, setBackUrl] = useState<string | null>(null);
    const flipAnimation = React.useRef(new Animated.Value(0)).current;

    const agencyInfo = getAgencyInfo(certification.agency as CertificationAgency);

    // Load signed URLs on mount
    useEffect(() => {
        const loadUrls = async () => {
            const urls = await refreshCertificationUrls(certification);
            setFrontUrl(urls.front);
            setBackUrl(urls.back);
        };
        loadUrls();
    }, [certification.id, certification.card_front_url, certification.card_back_url]);

    const handleFlip = () => {
        if (compact) return; // No flip in compact mode

        const toValue = isFlipped ? 0 : 1;
        Animated.spring(flipAnimation, {
            toValue,
            friction: 8,
            tension: 10,
            useNativeDriver: true,
        }).start();
        setIsFlipped(!isFlipped);
    };

    const frontInterpolate = flipAnimation.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '180deg'],
    });

    const backInterpolate = flipAnimation.interpolate({
        inputRange: [0, 1],
        outputRange: ['180deg', '360deg'],
    });

    const frontAnimatedStyle = {
        transform: [{ rotateY: frontInterpolate }],
    };

    const backAnimatedStyle = {
        transform: [{ rotateY: backInterpolate }],
    };

    const cardWidth = compact ? CARD_WIDTH * 0.5 : CARD_WIDTH;
    const cardHeight = compact ? CARD_HEIGHT * 0.5 : CARD_HEIGHT;

    const renderCardFace = (
        isFront: boolean,
        imageUrl: string | null,
        animatedStyle: any
    ) => (
        <Animated.View
            style={[
                styles.cardFace,
                {
                    width: cardWidth,
                    height: cardHeight,
                    backgroundColor: agencyInfo.color,
                },
                isFront ? animatedStyle : [animatedStyle, styles.cardBack],
            ]}
        >
            {imageUrl ? (
                <ImageWithFallback
                    uri={imageUrl}
                    style={styles.cardImage}
                    fallbackColor={agencyInfo.color}
                />
            ) : (
                <View style={styles.placeholderCard}>
                    <Text style={[styles.agencyText, compact && styles.agencyTextCompact]}>
                        {agencyInfo.name}
                    </Text>
                    <Text style={[styles.levelText, compact && styles.levelTextCompact]}>
                        {certification.level}
                    </Text>
                    {!compact && certification.certification_number && (
                        <Text style={styles.certNumberText}>
                            #{certification.certification_number}
                        </Text>
                    )}
                    {!compact && (
                        <Text style={styles.sideLabel}>
                            {isFront ? 'FRONT' : 'BACK'}
                        </Text>
                    )}
                </View>
            )}
        </Animated.View>
    );

    const handlePress = () => {
        if (onPress) {
            onPress();
        } else {
            handleFlip();
        }
    };

    return (
        <TouchableOpacity
            style={[styles.container, { width: cardWidth, height: cardHeight }]}
            onPress={handlePress}
            activeOpacity={0.9}
        >
            {renderCardFace(true, frontUrl, frontAnimatedStyle)}
            {renderCardFace(false, backUrl, backAnimatedStyle)}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardFace: {
        position: 'absolute',
        borderRadius: 12,
        overflow: 'hidden',
        backfaceVisibility: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    cardBack: {
        position: 'absolute',
    },
    cardImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    placeholderCard: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: DIMS.PADDING_LG,
    },
    agencyText: {
        fontSize: TYPOGRAPHY.SIZE_XXXL,
        fontWeight: 'bold',
        color: '#fff',
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    agencyTextCompact: {
        fontSize: TYPOGRAPHY.SIZE_XL,
    },
    levelText: {
        fontSize: TYPOGRAPHY.SIZE_XL,
        fontWeight: '600',
        color: 'rgba(255, 255, 255, 0.9)',
        marginTop: DIMS.MARGIN_SM,
        textAlign: 'center',
    },
    levelTextCompact: {
        fontSize: TYPOGRAPHY.SIZE_MD,
    },
    certNumberText: {
        fontSize: TYPOGRAPHY.SIZE_MD,
        color: 'rgba(255, 255, 255, 0.7)',
        marginTop: DIMS.MARGIN_SM,
        fontFamily: 'monospace',
    },
    sideLabel: {
        position: 'absolute',
        bottom: DIMS.PADDING_MD,
        right: DIMS.PADDING_MD,
        fontSize: TYPOGRAPHY.SIZE_SM,
        color: 'rgba(255, 255, 255, 0.5)',
        fontWeight: '600',
    },
});

export default CertificationCard;
