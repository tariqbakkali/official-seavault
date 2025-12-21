import React, { useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, ScrollView, Dimensions } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector } from '@legendapp/state/react';
import { Clock, MapPin, Wind, Waves, Eye, Calendar, Thermometer, ArrowLeft, Anchor } from 'lucide-react-native';
import ScreenHeader from '@/components/ui/ScreenHeader';
import { currentUserSightings$, diveSites$, creatures$ } from '@/stores/syncedObservables';
import { COLORS, DIMENSIONS, TYPOGRAPHY } from '@/constants';
import { Sighting, DiveSite, Creature } from '@/types/database';
import { ImageWithFallback } from '@/components';

const { width } = Dimensions.get('window');

export default function DiveLogDetailScreen() {
    const { id } = useLocalSearchParams();
    const insets = useSafeAreaInsets();

    const diveLog = useSelector(() => {
        if (typeof id !== 'string') return null;

        const sightings = Object.values(currentUserSightings$.get() || {}) as unknown as Sighting[];
        const sites = Object.values(diveSites$.get() || {}) as unknown as DiveSite[];
        const creatures = Object.values(creatures$.get() || {}) as unknown as Creature[];

        const siteMap = new Map(sites.map(s => [s.id, s.name]));

        // Map both id and creature_id to support legacy/migrated data
        const creatureMap = new Map();
        creatures.forEach(c => {
            if (c.id) creatureMap.set(c.id, c);
            if (c.creature_id) creatureMap.set(c.creature_id, c);
        });

        // We filter sightings that match the group ID (date_siteId_time)
        const matchingSightings = sightings.filter(s => {
            // Reconstruct key logic from DiveLogsScreen
            const key = `${s.date}_${s.dive_site_id || 'unknown'}_${s.time_of_day || '00:00'}`;
            return key === id;
        });

        if (matchingSightings.length === 0) return null;

        const first = matchingSightings[0];
        const siteName = siteMap.get(first.dive_site_id || '') || 'Unknown Site';

        // Aggregate data
        const weather = matchingSightings.find(s => s.weather)?.weather;
        const visibility = matchingSightings.find(s => s.visibility)?.visibility;
        const current = matchingSightings.find(s => s.current)?.current;
        const duration = matchingSightings.find(s => s.duration)?.duration;
        const diveType = matchingSightings.find(s => s.dive_type)?.dive_type;
        const diveNotes = matchingSightings.map(s => s.dive_notes).filter(n => n).join('\n\n'); // Combine notes if multiple exist
        const maxDepth = matchingSightings.reduce((max, s) => {
            const depth = parseFloat(s.depth || '0');
            return depth > max ? depth : max;
        }, 0);

        // Temperature not currently supported in schema
        // const avgTemp = matchingSightings.find(s => s.water_temp)?.water_temp;

        const sightingsWithDetails = matchingSightings.map(s => {
            const creature = creatureMap.get(s.creature_id);
            return {
                ...s,
                creatureName: creature?.name || 'Unknown Creature', // Fallback if regular sync fails
                creatureScientific: creature?.scientific_name,
                creatureImage: creature?.image_url,
                category: creature?.category_id
            };
        });

        return {
            date: first.date,
            time: first.time_of_day,
            siteName,
            duration,
            maxDepth: maxDepth > 0 ? maxDepth : null,
            // temperature: avgTemp,
            weather,
            visibility,
            current,
            diveType,
            diveNotes,
            totalSightings: matchingSightings.length,
            items: sightingsWithDetails
        };
    });

    if (!diveLog) {
        return (
            <View style={[styles.container, { paddingTop: insets.top }]}>
                <ScreenHeader title="Dive Detail" showBackButton />
                <View style={styles.center}>
                    <Text style={styles.errorText}>Dive log not found.</Text>
                </View>
            </View>
        );
    }

    const StatItem = ({ icon: Icon, value, label }: { icon: any, value: string | number | null | undefined, label: string }) => {
        if (!value) return null;
        return (
            <View style={styles.statItem}>
                <View style={styles.statIconContainer}>
                    <Icon size={18} color={COLORS.PRIMARY} />
                </View>
                <View>
                    <Text style={styles.statValue}>{value}</Text>
                    <Text style={styles.statLabel}>{label}</Text>
                </View>
            </View>
        );
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <ScreenHeader title="Dive Details" showBackButton />

            <ScrollView contentContainerStyle={styles.content}>

                {/* Header / Location Card */}
                <View style={styles.locationCard}>
                    <View style={styles.locationHeader}>
                        <MapPin size={24} color={COLORS.PRIMARY} />
                        <View style={{ flex: 1 }}>
                            <Text style={styles.siteName}>{diveLog.siteName}</Text>
                            <Text style={styles.dateText}>
                                {new Date(diveLog.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Main Stats Grid */}
                <View style={styles.statsGrid}>
                    <StatItem icon={Clock} value={diveLog.time} label="Time In" />
                    <StatItem icon={Clock} value={diveLog.duration ? `${diveLog.duration} min` : null} label="Duration" />
                    <StatItem icon={Anchor} value={diveLog.maxDepth ? `${diveLog.maxDepth}m` : null} label="Max Depth" />
                    {/* Temperature removed as not in schema */}
                    <StatItem icon={Eye} value={diveLog.visibility} label="Visibility" />
                    <StatItem icon={Wind} value={diveLog.weather} label="Weather" />
                    <StatItem icon={Waves} value={diveLog.current} label="Current" />
                    <StatItem icon={Anchor} value={diveLog.diveType} label="Type" />
                </View>

                {diveLog.diveNotes ? (
                    <View style={styles.notesSection}>
                        <Text style={styles.notesTitle}>Notes</Text>
                        <Text style={styles.notesBody}>{diveLog.diveNotes}</Text>
                    </View>
                ) : null}

                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Sightings Log</Text>
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>{diveLog.totalSightings}</Text>
                    </View>
                </View>

                <View style={styles.sightingsList}>
                    {diveLog.items.map((item, index) => (
                        <View key={item.id} style={styles.sightingCard}>
                            <View style={styles.sightingImageContainer}>
                                <ImageWithFallback
                                    uri={item.image_url || item.creatureImage || undefined}
                                    style={styles.sightingImage}
                                    fallbackColor="#2A2A2A"
                                />
                            </View>
                            <View style={styles.sightingOverlay}>
                                <View style={styles.sightingContent}>
                                    <Text style={styles.creatureName}>{item.creatureName}</Text>
                                    {item.creatureScientific && (
                                        <Text style={styles.scientificName}>{item.creatureScientific}</Text>
                                    )}

                                    <View style={styles.sightingMeta}>
                                        {item.depth && (
                                            <View style={styles.metaTag}>
                                                <Anchor size={12} color="#ccc" />
                                                <Text style={styles.metaText}>{item.depth}m</Text>
                                            </View>
                                        )}
                                        {/* Count logic removed as field does not exist */}
                                    </View>

                                    {item.creature_notes && (
                                        <View style={styles.notesContainer}>
                                            <Text style={styles.notes} numberOfLines={2}>"{item.creature_notes}"</Text>
                                        </View>
                                    )}
                                </View>
                            </View>
                        </View>
                    ))}
                </View>

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    content: {
        padding: DIMENSIONS.PADDING_LG,
        paddingBottom: 40,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorText: {
        color: '#666',
        fontSize: TYPOGRAPHY.SIZE_LG,
    },
    locationCard: {
        marginBottom: DIMENSIONS.MARGIN_XL,
    },
    locationHeader: {
        flexDirection: 'row',
        gap: DIMENSIONS.GAP_MD,
        alignItems: 'center',
    },
    siteName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 4,
    },
    dateText: {
        fontSize: TYPOGRAPHY.SIZE_MD,
        color: '#888',
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: DIMENSIONS.GAP_MD,
        marginBottom: DIMENSIONS.MARGIN_XL,
        backgroundColor: '#161616',
        padding: 16,
        borderRadius: 16,
    },
    statItem: {
        width: '47%', // 2 columns roughly
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 8,
    },
    statIconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    statValue: {
        fontSize: TYPOGRAPHY.SIZE_MD,
        fontWeight: 'bold',
        color: '#fff',
    },
    statLabel: {
        fontSize: 11,
        color: '#666',
        textTransform: 'uppercase',
    },
    notesSection: {
        marginBottom: DIMENSIONS.MARGIN_XL,
        backgroundColor: '#1E1E1E',
        padding: 16,
        borderRadius: 16,
    },
    notesTitle: {
        fontSize: TYPOGRAPHY.SIZE_SM,
        color: '#666',
        textTransform: 'uppercase',
        marginBottom: 8,
        fontWeight: 'bold',
    },
    notesBody: {
        fontSize: TYPOGRAPHY.SIZE_MD,
        color: '#ccc',
        lineHeight: 22,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: DIMENSIONS.MARGIN_LG,
    },
    sectionTitle: {
        fontSize: TYPOGRAPHY.SIZE_XL,
        fontWeight: 'bold',
        color: '#fff',
    },
    badge: {
        backgroundColor: COLORS.PRIMARY,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
    },
    badgeText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#fff',
    },
    sightingsList: {
        gap: DIMENSIONS.GAP_LG,
    },
    sightingCard: {
        backgroundColor: '#1E1E1E',
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#333',
    },
    sightingImageContainer: {
        width: '100%',
        height: 200,
    },
    sightingImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    sightingOverlay: {
        padding: DIMENSIONS.PADDING_LG,
        backgroundColor: '#1E1E1E',
    },
    sightingContent: {
        gap: 4,
    },
    creatureName: {
        fontSize: TYPOGRAPHY.SIZE_XL,
        fontWeight: 'bold',
        color: '#fff',
    },
    scientificName: {
        fontSize: TYPOGRAPHY.SIZE_SM,
        color: '#888',
        fontStyle: 'italic',
        marginBottom: 8,
    },
    sightingMeta: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 8,
    },
    metaTag: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#333',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    metaText: {
        fontSize: 12,
        color: '#eee',
    },
    notesContainer: {
        marginTop: 4,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#333',
    },
    notes: {
        fontSize: TYPOGRAPHY.SIZE_SM,
        color: '#aaa',
        fontStyle: 'italic',
        lineHeight: 20,
    },
});
