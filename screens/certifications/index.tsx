import React, { useState, useCallback, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    RefreshControl,
    Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Plus, Award } from 'lucide-react-native';

import ScreenHeader from '@/components/ui/ScreenHeader';
import { CertificationCard, CertificationUploadModal, CertificationFullScreen } from '@/components/certification';
import { Certification } from '@/types/database';
import { getUserCertifications, deleteCertification } from '@/services/certificationService';
import { supabase } from '@/services/supabase';
import { TYPOGRAPHY, DIMENSIONS } from '@/constants';

const CertificationsScreen: React.FC = () => {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const [refreshing, setRefreshing] = useState(false);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [certifications, setCertifications] = useState<Certification[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCert, setSelectedCert] = useState<Certification | null>(null);

    // Fetch certifications directly from database
    const fetchCertifications = useCallback(async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const certs = await getUserCertifications(user.id);
            setCertifications(certs);
        } catch (error) {
            console.error('Error fetching certifications:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCertifications();
    }, [fetchCertifications]);

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchCertifications();
        setRefreshing(false);
    };

    const handleAddSuccess = () => {
        fetchCertifications();
    };

    const handleDeleteCert = async (cert: Certification) => {
        Alert.alert(
            'Delete Certification',
            `Are you sure you want to delete your ${cert.level} certification?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const { data: { user } } = await supabase.auth.getUser();
                            if (!user) return;
                            await deleteCertification(user.id, cert.id);
                            // Refresh list after delete
                            fetchCertifications();
                        } catch (error: any) {
                            Alert.alert('Error', 'Failed to delete certification.');
                        }
                    },
                },
            ]
        );
    };

    const handleCardPress = (cert: Certification) => {
        Alert.alert(
            cert.level,
            `${cert.agency} Certification`,
            [
                { text: 'View Full Screen', onPress: () => setSelectedCert(cert) },
                { text: 'Delete', style: 'destructive', onPress: () => handleDeleteCert(cert) },
                { text: 'Cancel', style: 'cancel' },
            ]
        );
    };

    const renderEmptyState = () => (
        <View style={styles.emptyState}>
            <Award size={64} color="#333" />
            <Text style={styles.emptyTitle}>No Certifications Yet</Text>
            <Text style={styles.emptyText}>
                Add your diving certifications to keep them handy during your dives.
            </Text>
            <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => setShowUploadModal(true)}
            >
                <Plus size={20} color="#fff" />
                <Text style={styles.emptyButtonText}>Add First Certification</Text>
            </TouchableOpacity>
        </View>
    );

    const renderCertification = ({ item }: { item: Certification }) => (
        <View style={styles.cardWrapper}>
            <CertificationCard
                certification={item}
                onPress={() => handleCardPress(item)}
            />
            <Text style={styles.cardLabel}>
                {item.agency} • {item.level}
            </Text>
            {item.issued_at && (
                <Text style={styles.cardDate}>
                    Issued: {new Date(item.issued_at).toLocaleDateString()}
                </Text>
            )}
        </View>
    );

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <ScreenHeader
                title="Certifications"
                onBackPress={() => router.back()}
                actions={[
                    {
                        icon: Plus,
                        onPress: () => setShowUploadModal(true),
                    },
                ]}
            />
            <FlatList
                data={certifications}
                keyExtractor={(item) => item.id}
                renderItem={renderCertification}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={renderEmptyState}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        tintColor="#007AFF"
                    />
                }
            />

            <CertificationUploadModal
                visible={showUploadModal}
                onClose={() => setShowUploadModal(false)}
                onSuccess={handleAddSuccess}
            />

            <CertificationFullScreen
                certification={selectedCert}
                visible={selectedCert !== null}
                onClose={() => setSelectedCert(null)}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    addButton: {
        padding: DIMENSIONS.PADDING_SM,
    },
    listContent: {
        padding: DIMENSIONS.PADDING_LG,
        paddingBottom: DIMENSIONS.PADDING_XL * 2,
    },
    cardWrapper: {
        alignItems: 'center',
        marginBottom: DIMENSIONS.MARGIN_XL,
    },
    cardLabel: {
        fontSize: TYPOGRAPHY.SIZE_LG,
        fontWeight: '600',
        color: '#fff',
        marginTop: DIMENSIONS.MARGIN_MD,
    },
    cardDate: {
        fontSize: TYPOGRAPHY.SIZE_SM,
        color: '#666',
        marginTop: DIMENSIONS.MARGIN_XS,
    },
    emptyState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 100,
        paddingHorizontal: DIMENSIONS.PADDING_XL,
    },
    emptyTitle: {
        fontSize: TYPOGRAPHY.SIZE_XXL,
        fontWeight: 'bold',
        color: '#fff',
        marginTop: DIMENSIONS.MARGIN_LG,
    },
    emptyText: {
        fontSize: TYPOGRAPHY.SIZE_MD,
        color: '#666',
        textAlign: 'center',
        marginTop: DIMENSIONS.MARGIN_SM,
        lineHeight: 22,
    },
    emptyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#007AFF',
        paddingHorizontal: DIMENSIONS.PADDING_LG,
        paddingVertical: DIMENSIONS.PADDING_MD,
        borderRadius: 12,
        marginTop: DIMENSIONS.MARGIN_XL,
        gap: DIMENSIONS.GAP_SM,
    },
    emptyButtonText: {
        fontSize: TYPOGRAPHY.SIZE_MD,
        fontWeight: '600',
        color: '#fff',
    },
});

export default CertificationsScreen;
