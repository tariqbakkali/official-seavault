import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    Share,
    Dimensions,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { X, Share2, Copy, Check } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { currentUserSightings$ } from '../stores/syncedObservables';
import { Sighting } from '../types/database';

const { width } = Dimensions.get('window');

interface DiveShareModalProps {
    isVisible: boolean;
    onClose: () => void;
    diveId: string;
    isPublic: boolean;
    diveName: string;
}

export const DiveShareModal: React.FC<DiveShareModalProps> = ({
    isVisible,
    onClose,
    diveId,
    isPublic,
    diveName,
}) => {
    const [copied, setCopied] = useState(false);
    const [internalIsPublic, setInternalIsPublic] = useState(isPublic);

    React.useEffect(() => {
        setInternalIsPublic(isPublic);
    }, [isPublic]);

    // OneLink URL with deep_link_value for proper app opening on iOS/Android
    const shareUrl = `https://seavault.onelink.me/s9Gs?deep_link_value=dive/template/${diveId}`;

    const togglePublic = async () => {
        const newValue = !internalIsPublic;
        setInternalIsPublic(newValue);
        try {
            // Update all sightings with this dive_id
            const sightings = (Object.values(currentUserSightings$.peek() || {}) as Sighting[])
                .filter(s => s.dive_id === diveId);

            for (const s of sightings) {
                (currentUserSightings$ as any)[s.id].assign({ is_public_template: newValue });
            }
        } catch (error) {
            console.error('Error updating dive template status:', error);
            // Revert on error
            setInternalIsPublic(!newValue);
        }
    };

    const handleShare = async () => {
        try {
            await Share.share({
                message: `Check out my dive log on SeaVault: ${diveName}\nLog this dive yourself: ${shareUrl}`,
                url: shareUrl,
            });
        } catch (error) {
            console.error('Error sharing dive:', error);
        }
    };

    const handleCopyLink = () => {
        // In a real app we'd use Clipboard, but for now we'll just show feedback
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Modal
            visible={isVisible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill}>
                <TouchableOpacity
                    style={styles.overlay}
                    activeOpacity={1}
                    onPress={onClose}
                >
                    <TouchableOpacity activeOpacity={1} style={styles.content}>
                        <View style={styles.header}>
                            <Text style={styles.title}>Share Dive Log</Text>
                            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                                <X size={24} color="#666" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.qrContainer}>
                            <View style={styles.qrWrapper}>
                                <QRCode
                                    value={shareUrl}
                                    size={width * 0.6}
                                    backgroundColor="white"
                                    color="black"
                                />
                            </View>
                            <Text style={styles.qrHint}>Scan to log this dive</Text>
                        </View>

                        <View style={styles.infoSection}>
                            <Text style={styles.diveName}>{diveName}</Text>
                            <Text style={styles.diveId}>ID: {diveId}</Text>
                        </View>

                        <TouchableOpacity
                            style={[styles.toggleButton, internalIsPublic && styles.toggleButtonActive]}
                            onPress={togglePublic}
                        >
                            <View style={styles.toggleRow}>
                                <View>
                                    <Text style={styles.toggleLabel}>Public Template</Text>
                                    <Text style={styles.toggleSublabel}>
                                        {internalIsPublic
                                            ? "Anyone with the link can clone this dive"
                                            : "Only shared friends can see this"}
                                    </Text>
                                </View>
                                <View style={[styles.switch, internalIsPublic && styles.switchActive]}>
                                    <View style={[styles.switchKnob, internalIsPublic && styles.switchKnobActive]} />
                                </View>
                            </View>
                        </TouchableOpacity>

                        <View style={styles.actions}>
                            <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
                                <Share2 size={20} color="white" />
                                <Text style={styles.actionText}>Share Link</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.secondaryButton} onPress={handleCopyLink}>
                                {copied ? <Check size={20} color="#1B87E1" /> : <Copy size={20} color="#1B87E1" />}
                                <Text style={styles.secondaryText}>{copied ? 'Copied!' : 'Copy Link'}</Text>
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>
                </TouchableOpacity>
            </BlurView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    content: {
        backgroundColor: 'white',
        borderRadius: 24,
        width: '100%',
        maxWidth: 400,
        padding: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        marginBottom: 24,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: '#333',
    },
    closeButton: {
        padding: 4,
    },
    qrContainer: {
        alignItems: 'center',
        marginBottom: 24,
    },
    qrWrapper: {
        padding: 16,
        backgroundColor: 'white',
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 3,
    },
    qrHint: {
        marginTop: 12,
        color: '#666',
        fontSize: 14,
    },
    infoSection: {
        alignItems: 'center',
        marginBottom: 24,
    },
    diveName: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1B87E1',
        marginBottom: 4,
    },
    diveId: {
        fontSize: 12,
        color: '#999',
        fontFamily: 'monospace',
    },
    toggleButton: {
        width: '100%',
        padding: 16,
        backgroundColor: '#F8F9FA',
        borderRadius: 16,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#E9ECEF',
    },
    toggleButtonActive: {
        borderColor: '#1B87E1',
        backgroundColor: '#F0F7FF',
    },
    toggleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    toggleLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    toggleSublabel: {
        fontSize: 12,
        color: '#666',
        marginTop: 2,
    },
    switch: {
        width: 44,
        height: 24,
        backgroundColor: '#CED4DA',
        borderRadius: 12,
        padding: 2,
    },
    switchActive: {
        backgroundColor: '#1B87E1',
    },
    switchKnob: {
        width: 20,
        height: 20,
        backgroundColor: 'white',
        borderRadius: 10,
    },
    switchKnobActive: {
        transform: [{ translateX: 20 }],
    },
    actions: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    actionButton: {
        flex: 1,
        backgroundColor: '#1B87E1',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        gap: 8,
    },
    actionText: {
        color: 'white',
        fontWeight: '600',
        fontSize: 16,
    },
    secondaryButton: {
        flex: 1,
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#1B87E1',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        gap: 8,
    },
    secondaryText: {
        color: '#1B87E1',
        fontWeight: '600',
        fontSize: 16,
    },
});
