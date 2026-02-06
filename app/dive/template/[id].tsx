import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    TouchableOpacity,
    Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
    Clock,
    MapPin,
    Anchor,
    Wind,
    Waves,
    Eye,
    GraduationCap,
    User,
    ArrowLeft,
    Copy
} from 'lucide-react-native';
import { supabase } from '@/services/supabase';
import { cloneDive, diveSites$ } from '@/stores/syncedObservables';
import { COLORS, DIMENSIONS, TYPOGRAPHY, ROUTES } from '@/constants';
import ScreenHeader from '@/components/ui/ScreenHeader';

export default function DiveTemplateScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [loading, setLoading] = useState(true);
    const [cloning, setCloning] = useState(false);
    const [dive, setDive] = useState<any>(null);
    const [siteName, setSiteName] = useState('Unknown Location');
    const [sightings, setSightings] = useState<any[]>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchTemplate();
    }, [id]);

    const fetchTemplate = async () => {
        if (typeof id !== 'string') {
            setLoading(false);
            if (!id && loading) setError('Invalid QR Code');
            return;
        }

        setLoading(true);
        setError(null);
        try {
            // Fetch sightings for this template - only if it's public
            const { data: sightingsData, error } = await supabase
                .from('sightings')
                .select('*, creatures(*)')
                .eq('dive_id', id)
                .eq('is_public_template', true);  // Only fetch public templates

            if (error) throw error;
            if (!sightingsData || sightingsData.length === 0) {
                throw new Error('This dive template is not available');
            }

            const diveData = sightingsData[0] as any;
            setDive(diveData);
            setSightings(sightingsData);

            // Try to get site name
            if (diveData.dive_site_id) {
                const sites = diveSites$.get();
                const site = (sites as any)[diveData.dive_site_id];
                if (site) {
                    setSiteName(site.name);
                } else {
                    const { data: siteData } = await supabase
                        .from('dive_sites')
                        .select('name')
                        .eq('id', diveData.dive_site_id)
                        .single();
                    if (siteData) setSiteName((siteData as any).name);
                }
            }
        } catch (err: any) {
            console.error('Error fetching dive template:', err);
            setError(err.message || 'Could not load dive template');
        } finally {
            setLoading(false);
        }
    };

    const handleGoHome = () => {
        router.replace('/(tabs)' as any);
    };

    const handleClone = async () => {
        if (typeof id !== 'string') return;

        setCloning(true);
        try {
            const newDiveId = await cloneDive(id);

            Alert.alert(
                'Success',
                'Dive log copied to your book!',
                [
                    {
                        text: 'OK',
                        onPress: () => router.replace('/(tabs)' as any)
                    }
                ]
            );
        } catch (err: any) {
            console.error('Error cloning dive:', err);
            Alert.alert('Error', err.message);
        } finally {
            setCloning(false);
        }
    };

    if (loading) {
        return (
            <View style={[styles.container, { paddingTop: insets.top }]}>
                <ScreenHeader title="Dive Template" showBackButton onBackPress={handleGoHome} />
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={COLORS.PRIMARY} />
                    <Text style={styles.loadingText}>Loading template...</Text>
                </View>
            </View>
        );
    }

    // Show error screen with Go Home button
    if (error || !dive) {
        return (
            <View style={[styles.container, { paddingTop: insets.top }]}>
                <ScreenHeader title="Dive Template" showBackButton onBackPress={handleGoHome} />
                <View style={styles.center}>
                    <Text style={styles.errorText}>{error || 'Template not available'}</Text>
                    <Text style={styles.errorSubText}>This dive is private or no longer exists.</Text>
                    <TouchableOpacity style={styles.homeButton} onPress={handleGoHome}>
                        <Text style={styles.homeButtonText}>Go Home</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <Stack.Screen options={{ title: 'Dive Template', headerShown: false }} />
            <ScreenHeader
                title="Dive Template"
                showBackButton
                onBackPress={() => {
                    if (router.canGoBack()) {
                        router.back();
                    } else {
                        router.replace('/(tabs)' as any);
                    }
                }}
            />

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.previewBadge}>
                    <Text style={styles.previewBadgeText}>PREVIEW MODE</Text>
                </View>

                <View style={styles.locationCard}>
                    <View style={styles.locationHeader}>
                        <MapPin size={24} color={COLORS.PRIMARY} />
                        <View>
                            <Text style={styles.siteName}>{siteName}</Text>
                            <Text style={styles.typeText}>{dive.dive_type?.toUpperCase() || 'RECREATIONAL'} DIVE</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.statsGrid}>
                    <View style={styles.statItem}>
                        <Clock size={20} color={COLORS.PRIMARY} />
                        <View>
                            <Text style={styles.statValue}>{dive.duration || '--'} min</Text>
                            <Text style={styles.statLabel}>Duration</Text>
                        </View>
                    </View>
                    <View style={styles.statItem}>
                        <Anchor size={20} color={COLORS.PRIMARY} />
                        <View>
                            <Text style={styles.statValue}>{dive.max_depth || '--'}{dive.depth_unit || 'm'}</Text>
                            <Text style={styles.statLabel}>Max Depth</Text>
                        </View>
                    </View>
                    <View style={styles.statItem}>
                        <Eye size={20} color={COLORS.PRIMARY} />
                        <View>
                            <Text style={styles.statValue}>{dive.visibility || '--'}</Text>
                            <Text style={styles.statLabel}>Visibility</Text>
                        </View>
                    </View>
                    <View style={styles.statItem}>
                        <Wind size={20} color={COLORS.PRIMARY} />
                        <View>
                            <Text style={styles.statValue}>{dive.weather || '--'}</Text>
                            <Text style={styles.statLabel}>Weather</Text>
                        </View>
                    </View>
                    <View style={styles.statItem}>
                        <Waves size={20} color={COLORS.PRIMARY} />
                        <View>
                            <Text style={styles.statValue}>{dive.current || '--'}</Text>
                            <Text style={styles.statLabel}>Current</Text>
                        </View>
                    </View>
                    <View style={styles.statItem}>
                        <GraduationCap size={20} color={COLORS.PRIMARY} />
                        <View>
                            <Text style={styles.statValue}>{dive.course_type || 'None'}</Text>
                            <Text style={styles.statLabel}>Course</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.infoBox}>
                    <Text style={styles.infoTitle}>What's copied?</Text>
                    <Text style={styles.infoText}>
                        • Dive site and conditions{"\n"}
                        • Duration and depth{"\n"}
                        • Dive type and skills completed
                    </Text>
                    <Text style={styles.infoSubText}>
                        Personal data like air consumption and private notes are NOT copied.
                    </Text>
                </View>

                <View style={styles.sightingsSection}>
                    <Text style={styles.sectionTitle}>Sightings in this Dive</Text>
                    {sightings.length > 0 ? (
                        sightings.map((s, idx) => (
                            <View key={s.id || idx} style={styles.sightingItem}>
                                <View style={styles.sightingIcon}>
                                    <View style={styles.dot} />
                                </View>
                                <View>
                                    <Text style={styles.creatureName}>{s.creatures?.name || 'Unknown Creature'}</Text>
                                    <Text style={styles.creatureScience}>{s.creatures?.scientific_name || ''}</Text>
                                </View>
                            </View>
                        ))
                    ) : (
                        <Text style={styles.noSightings}>No creatures recorded in this template.</Text>
                    )}
                </View>

                <TouchableOpacity
                    style={styles.cloneButton}
                    onPress={handleClone}
                    disabled={cloning}
                >
                    {cloning ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <>
                            <Copy size={20} color="white" />
                            <Text style={styles.cloneButtonText}>Add to My Logbook</Text>
                        </>
                    )}
                </TouchableOpacity>

                <Text style={styles.footerHint}>
                    This will create a new entry in your logs with today's date.
                </Text>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        color: '#888',
        fontSize: 16,
    },
    errorText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 8,
    },
    errorSubText: {
        color: '#888',
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 24,
    },
    homeButton: {
        backgroundColor: COLORS.PRIMARY,
        paddingHorizontal: 32,
        paddingVertical: 14,
        borderRadius: 16,
    },
    homeButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    content: {
        padding: 20,
    },
    previewBadge: {
        backgroundColor: 'rgba(27, 135, 225, 0.1)',
        alignSelf: 'center',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.PRIMARY,
        marginBottom: 20,
    },
    previewBadgeText: {
        color: COLORS.PRIMARY,
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 1,
    },
    locationCard: {
        backgroundColor: '#161616',
        padding: 20,
        borderRadius: 20,
        marginBottom: 20,
    },
    locationHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    siteName: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#fff',
    },
    typeText: {
        fontSize: 12,
        color: '#888',
        letterSpacing: 0.5,
        marginTop: 2,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 24,
    },
    statItem: {
        width: '48%',
        backgroundColor: '#161616',
        padding: 16,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    statValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
    },
    statLabel: {
        fontSize: 11,
        color: '#666',
        textTransform: 'uppercase',
    },
    infoBox: {
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        padding: 20,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
        marginBottom: 32,
    },
    infoTitle: {
        color: '#ccc',
        fontWeight: 'bold',
        marginBottom: 12,
        fontSize: 14,
    },
    infoText: {
        color: '#888',
        lineHeight: 22,
        fontSize: 14,
    },
    infoSubText: {
        color: '#666',
        fontSize: 12,
        marginTop: 12,
        fontStyle: 'italic',
    },
    cloneButton: {
        backgroundColor: COLORS.PRIMARY,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 18,
        borderRadius: 16,
        gap: 12,
    },
    cloneButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    footerHint: {
        textAlign: 'center',
        color: '#666',
        fontSize: 12,
        marginTop: 16,
    },
    sightingsSection: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 16,
    },
    sightingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#161616',
        padding: 16,
        borderRadius: 16,
        marginBottom: 10,
        gap: 12,
    },
    sightingIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(27, 135, 225, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: COLORS.PRIMARY,
    },
    creatureName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
    },
    creatureScience: {
        fontSize: 12,
        color: '#888',
        fontStyle: 'italic',
        marginTop: 1,
    },
    noSightings: {
        color: '#666',
        fontStyle: 'italic',
        textAlign: 'center',
        paddingVertical: 20,
    },
});
