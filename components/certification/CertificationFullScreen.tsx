import React, { useState, useEffect } from 'react';
import {
    View,
    StyleSheet,
    Modal,
    TouchableOpacity,
    Dimensions,
    Text,
    ActivityIndicator,
} from 'react-native';
import { X, RotateCcw } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ImageWithFallback } from '@/components';
import { Certification } from '@/types/database';
import { refreshCertificationUrls, getAgencyInfo, CertificationAgency } from '@/services/certificationService';
import { TYPOGRAPHY, DIMENSIONS as DIMS } from '@/constants';

interface CertificationFullScreenProps {
    certification: Certification | null;
    visible: boolean;
    onClose: () => void;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const CertificationFullScreen: React.FC<CertificationFullScreenProps> = ({
    certification,
    visible,
    onClose,
}) => {
    const insets = useSafeAreaInsets();
    const [showFront, setShowFront] = useState(true);
    const [frontUrl, setFrontUrl] = useState<string | null>(null);
    const [backUrl, setBackUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (visible && certification) {
            loadUrls();
        }
    }, [visible, certification]);

    const loadUrls = async () => {
        if (!certification) return;
        setLoading(true);
        const urls = await refreshCertificationUrls(certification);
        setFrontUrl(urls.front);
        setBackUrl(urls.back);
        setLoading(false);
    };

    if (!certification) return null;

    const agencyInfo = getAgencyInfo(certification.agency as CertificationAgency);
    const currentUrl = showFront ? frontUrl : backUrl;
    const hasBack = !!certification.card_back_url;

    return (
        <Modal visible={visible} animationType="fade" transparent>
            <View style={[styles.container, { paddingTop: insets.top }]}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <X size={28} color="#fff" />
                    </TouchableOpacity>
                    <View style={styles.headerInfo}>
                        <Text style={styles.agencyText}>{certification.agency}</Text>
                        <Text style={styles.levelText}>{certification.level}</Text>
                    </View>
                    {hasBack && (
                        <TouchableOpacity
                            onPress={() => setShowFront(!showFront)}
                            style={styles.flipButton}
                        >
                            <RotateCcw size={24} color="#fff" />
                            <Text style={styles.flipText}>{showFront ? 'Back' : 'Front'}</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Card Image */}
                <View style={styles.imageContainer}>
                    {loading ? (
                        <ActivityIndicator size="large" color="#fff" />
                    ) : currentUrl ? (
                        <ImageWithFallback
                            uri={currentUrl}
                            style={styles.cardImage}
                            fallbackColor={agencyInfo.color}
                        />
                    ) : (
                        <View style={[styles.placeholder, { backgroundColor: agencyInfo.color }]}>
                            <Text style={styles.placeholderAgency}>{agencyInfo.name}</Text>
                            <Text style={styles.placeholderLevel}>{certification.level}</Text>
                            {certification.certification_number && (
                                <Text style={styles.placeholderNumber}>
                                    #{certification.certification_number}
                                </Text>
                            )}
                            <Text style={styles.placeholderSide}>
                                {showFront ? 'FRONT' : 'BACK'} - No image uploaded
                            </Text>
                        </View>
                    )}
                </View>

                {/* Footer info */}
                <View style={styles.footer}>
                    {certification.certification_number && (
                        <Text style={styles.footerText}>
                            Card #: {certification.certification_number}
                        </Text>
                    )}
                    {certification.issued_at && (
                        <Text style={styles.footerText}>
                            Issued: {new Date(certification.issued_at).toLocaleDateString()}
                        </Text>
                    )}
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: DIMS.PADDING_LG,
        paddingVertical: DIMS.PADDING_MD,
    },
    closeButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerInfo: {
        flex: 1,
        alignItems: 'center',
    },
    agencyText: {
        fontSize: TYPOGRAPHY.SIZE_LG,
        fontWeight: '600',
        color: '#fff',
    },
    levelText: {
        fontSize: TYPOGRAPHY.SIZE_MD,
        color: 'rgba(255, 255, 255, 0.7)',
    },
    flipButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: DIMS.PADDING_MD,
        paddingVertical: DIMS.PADDING_SM,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 20,
        gap: 6,
    },
    flipText: {
        fontSize: TYPOGRAPHY.SIZE_SM,
        color: '#fff',
        fontWeight: '600',
    },
    imageContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: DIMS.PADDING_LG,
    },
    cardImage: {
        width: SCREEN_WIDTH - DIMS.PADDING_LG * 2,
        height: (SCREEN_WIDTH - DIMS.PADDING_LG * 2) * 0.63,
        borderRadius: 12,
        resizeMode: 'contain',
    },
    placeholder: {
        width: SCREEN_WIDTH - DIMS.PADDING_LG * 2,
        height: (SCREEN_WIDTH - DIMS.PADDING_LG * 2) * 0.63,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        padding: DIMS.PADDING_XL,
    },
    placeholderAgency: {
        fontSize: TYPOGRAPHY.SIZE_XXXL,
        fontWeight: 'bold',
        color: '#fff',
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    placeholderLevel: {
        fontSize: TYPOGRAPHY.SIZE_XL,
        fontWeight: '600',
        color: 'rgba(255, 255, 255, 0.9)',
        marginTop: DIMS.MARGIN_SM,
        textAlign: 'center',
    },
    placeholderNumber: {
        fontSize: TYPOGRAPHY.SIZE_LG,
        color: 'rgba(255, 255, 255, 0.7)',
        marginTop: DIMS.MARGIN_SM,
        fontFamily: 'monospace',
    },
    placeholderSide: {
        fontSize: TYPOGRAPHY.SIZE_SM,
        color: 'rgba(255, 255, 255, 0.5)',
        marginTop: DIMS.MARGIN_LG,
    },
    footer: {
        padding: DIMS.PADDING_LG,
        alignItems: 'center',
        gap: 4,
    },
    footerText: {
        fontSize: TYPOGRAPHY.SIZE_MD,
        color: 'rgba(255, 255, 255, 0.6)',
    },
});

export default CertificationFullScreen;
