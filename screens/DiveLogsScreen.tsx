import React, { useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector } from '@legendapp/state/react';
import { Calendar, MapPin, Clock, ArrowRight, Waves, Fish, Pencil } from 'lucide-react-native';
import ScreenHeader from '@/components/ui/ScreenHeader';
import { currentUserSightings$, diveSites$, creatures$ } from '@/stores/syncedObservables';
import { COLORS, DIMENSIONS, TYPOGRAPHY, ROUTES } from '@/constants';
import { Sighting, DiveSite, Creature } from '@/types/database';

interface DiveLogGroup {
    id: string;
    date: string;
    time: string;
    siteId: string;
    siteName: string;
    duration: number | null;
    maxDepth: number | null;
    sightings: Sighting[];
    previewCreatures: string[];
    waterway: string | null;
    diveType: string | null;
}

export default function DiveLogsScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const diveLogs = useSelector(() => {
        const sightings = (Object.values(currentUserSightings$.get() || {}) as unknown as Sighting[]).filter(Boolean);
        const sites = (Object.values(diveSites$.get() || {}) as unknown as DiveSite[]).filter(Boolean);
        const creatures = (Object.values(creatures$.get() || {}) as unknown as Creature[]).filter(Boolean);

        const siteMap = new Map(sites.map(s => [s.id, s.name]));

        // Robust creature mapping
        const creatureMap = new Map();
        creatures.forEach(c => {
            if (c.id) creatureMap.set(c.id, c.name);
            if (c.creature_id) creatureMap.set(c.creature_id, c.name);
        });

        // Group sightings by dive session (date + time_in + dive_site_id)
        const diveGroups = new Map<string, Sighting[]>();

        // First pass: identify legacy-to-UUID mappings
        const legacyToUuidMap = new Map<string, string>();
        sightings.forEach(s => {
            if (s.dive_id) {
                const legacyKey = `${s.date}_${s.time_in || '00:00'}_${s.dive_site_id || 'unknown'}`;
                legacyToUuidMap.set(legacyKey, s.dive_id);
            }
        });

        sightings.forEach(sighting => {
            // Priority:
            // 1. Existing dive_id
            // 2. Mapped UUID from another sighting in same session
            // 3. Fallback to composite legacy key
            const legacyKey = `${sighting.date}_${sighting.time_in || '00:00'}_${sighting.dive_site_id || 'unknown'}`;
            const diveKey = sighting.dive_id || legacyToUuidMap.get(legacyKey) || legacyKey;

            if (!diveGroups.has(diveKey)) {
                diveGroups.set(diveKey, []);
            }
            diveGroups.get(diveKey)!.push(sighting);
        });

        // Convert groups to dive logs
        const logs: DiveLogGroup[] = Array.from(diveGroups.entries()).map(([key, diveSightings]) => {
            const firstSighting = diveSightings[0];

            // Get preview creatures (unique names, max 3)
            const previewCreatures = Array.from(new Set(
                diveSightings
                    .map(s => creatureMap.get(s.creature_id))
                    .filter(name => name) // filter out null/undefined
            )).slice(0, 3) as string[];

            const siteName = firstSighting.dive_site_id ? (siteMap.get(firstSighting.dive_site_id) || 'Unknown Location') : 'Unknown Location';

            // Use time_in from sighting
            const time = firstSighting.time_in || '00:00';

            return {
                id: key,
                date: firstSighting.date,
                time: time,
                siteId: firstSighting.dive_site_id || 'unknown',
                siteName: siteName,
                duration: firstSighting.duration,
                maxDepth: firstSighting.depth ? parseFloat(firstSighting.depth) : null,
                sightings: diveSightings,
                previewCreatures,
                waterway: firstSighting.waterway || null,
                diveType: firstSighting.dive_type || null,
            };
        });

        const sortedLogs = logs.sort((a, b) => {
            // Sort by date desc (Robust string comparison for ISO dates)
            const dateCompare = b.date.localeCompare(a.date);
            if (dateCompare !== 0) return dateCompare;

            // If same date, sort by time desc
            return (b.time || '').localeCompare(a.time || '');
        });

        return sortedLogs;
    });

    const handlePress = (log: DiveLogGroup) => {
        router.push(ROUTES.PROFILE.DIVE_LOG_DETAIL(log.id));
    };

    const handleEdit = (log: DiveLogGroup) => {
        router.push({
            pathname: ROUTES.TABS.LOG_DIVE,
            params: { editId: log.id }
        });
    };

    const renderItem = ({ item }: { item: DiveLogGroup }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => handlePress(item)}
            activeOpacity={0.7}
        >
            <View style={styles.cardContent}>
                <View style={styles.cardHeader}>
                    <View style={styles.locationContainer}>
                        <MapPin size={16} color={COLORS.PRIMARY} style={{ marginTop: 2 }} />
                        <Text style={styles.siteName} numberOfLines={1}>{item.siteName}</Text>
                    </View>
                    <View style={styles.headerRight}>
                        <TouchableOpacity
                            style={styles.editButton}
                            onPress={() => handleEdit(item)}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <Pencil size={14} color={COLORS.PRIMARY} />
                        </TouchableOpacity>
                        <Text style={styles.date}>{new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</Text>
                    </View>
                </View>

                <View style={styles.metricsRow}>
                    <View style={styles.metricItem}>
                        <Clock size={14} color="#888" />
                        <Text style={styles.metricText}>{item.time}</Text>
                    </View>
                    {item.duration && (
                        <View style={styles.metricItem}>
                            <View style={styles.dot} />
                            <Text style={styles.metricText}>{item.duration} min</Text>
                        </View>
                    )}
                    {item.maxDepth && (
                        <View style={styles.metricItem}>
                            <View style={styles.dot} />
                            <Text style={styles.metricText}>{Math.round(item.maxDepth)}m</Text>
                        </View>
                    )}
                    {item.diveType === 'training' && (
                        <View style={styles.metricItem}>
                            <View style={styles.dot} />
                            <Text style={[styles.metricText, { color: COLORS.PRIMARY }]}>Training</Text>
                        </View>
                    )}
                </View>


                {(item.previewCreatures.length > 0) ? (
                    <View style={styles.highlightsContainer}>
                        <View style={styles.tagsRow}>
                            {item.previewCreatures.map((creature, idx) => (
                                <View key={idx} style={styles.creatureTag}>
                                    <Fish size={10} color="#fff" />
                                    <Text style={styles.creatureTagText}>{creature}</Text>
                                </View>
                            ))}
                            {item.sightings.length > item.previewCreatures.length && (
                                <Text style={styles.moreCount}>+{item.sightings.length - item.previewCreatures.length}</Text>
                            )}
                        </View>
                    </View>
                ) : (
                    /* Show something if no creatures but it's a valid dive */
                    <View style={styles.highlightsContainer}>
                        <View style={styles.tagsRow}>
                            <View style={[styles.creatureTag, { backgroundColor: '#333' }]}>
                                <Waves size={10} color="#888" />
                                <Text style={[styles.creatureTagText, { color: '#aaa' }]}>
                                    {item.waterway ? (item.waterway.charAt(0).toUpperCase() + item.waterway.slice(1)) : 'No Sightings'}
                                </Text>
                            </View>
                        </View>
                    </View>
                )}
            </View>
            <View style={styles.cardArrow}>
                <ArrowRight size={20} color="#444" />
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <ScreenHeader title="Dive Logs" showBackButton onBackPress={() => router.back()} />

            <FlatList
                data={diveLogs}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Waves size={64} color="#333" />
                        <Text style={styles.emptyTitle}>No Dives Yet</Text>
                        <Text style={styles.emptyText}>Your dive history will appear here once you log your first sighting.</Text>
                    </View>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    listContent: {
        padding: DIMENSIONS.PADDING_LG,
        paddingBottom: 40,
    },
    card: {
        backgroundColor: '#1E1E1E',
        borderRadius: 16,
        marginBottom: DIMENSIONS.MARGIN_LG,
        flexDirection: 'row',
        alignItems: 'center',
        padding: DIMENSIONS.PADDING_LG,
        borderWidth: 1,
        borderColor: '#333',
    },
    cardContent: {
        flex: 1,
        gap: 8,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    locationContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 6,
        flex: 1,
        paddingRight: 8,
    },
    siteName: {
        fontSize: TYPOGRAPHY.SIZE_LG,
        fontWeight: 'bold',
        color: '#fff',
        flexShrink: 1,
    },
    date: {
        fontSize: TYPOGRAPHY.SIZE_SM,
        color: '#888',
        fontWeight: '500',
    },
    metricsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
    },
    metricItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    metricText: {
        fontSize: TYPOGRAPHY.SIZE_SM,
        color: '#ccc',
    },
    headerRight: {
        alignItems: 'flex-end',
        gap: 4,
    },
    editButton: {
        backgroundColor: 'rgba(64, 196, 255, 0.1)',
        padding: 6,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(64, 196, 255, 0.2)',
    },
    dot: {
        width: 3,
        height: 3,
        borderRadius: 1.5,
        backgroundColor: '#666',
        marginHorizontal: 8,
    },
    highlightsContainer: {
        marginTop: 4,
    },
    tagsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        alignItems: 'center',
    },
    creatureTag: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#333',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        gap: 4,
    },
    creatureTagText: {
        fontSize: 11,
        color: '#eee',
        fontWeight: '500',
    },
    moreCount: {
        fontSize: 11,
        color: '#888',
    },
    cardArrow: {
        paddingLeft: 12,
    },
    emptyState: {
        padding: DIMENSIONS.PADDING_XL,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 60,
        gap: 16,
    },
    emptyTitle: {
        fontSize: TYPOGRAPHY.SIZE_XL,
        fontWeight: 'bold',
        color: '#fff',
    },
    emptyText: {
        color: '#888',
        fontSize: TYPOGRAPHY.SIZE_MD,
        textAlign: 'center',
        lineHeight: 22,
        maxWidth: 280,
    }
});
