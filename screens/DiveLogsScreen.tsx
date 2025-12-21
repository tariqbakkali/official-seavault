import React, { useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector } from '@legendapp/state/react';
import { Calendar, MapPin, Clock, ArrowRight, Waves, Fish } from 'lucide-react-native';
import ScreenHeader from '@/components/ui/ScreenHeader';
import { currentUserSightings$, diveSites$, creatures$ } from '@/stores/syncedObservables';
import { COLORS, DIMENSIONS, TYPOGRAPHY, ROUTES } from '@/constants';
import { Sighting, DiveSite, Creature } from '@/types/database';

interface DiveLogGroup {
    id: string; // Unique ID for the group (e.g., date + siteId + time)
    date: string;
    time: string;
    siteId: string;
    siteName: string;
    duration: number | null;
    maxDepth: number | null;
    sightings: Sighting[];
    previewCreatures: string[];
}

export default function DiveLogsScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const diveLogs = useSelector(() => {
        const sightings = Object.values(currentUserSightings$.get() || {}) as unknown as Sighting[];
        const sites = Object.values(diveSites$.get() || {}) as unknown as DiveSite[];
        const creatures = Object.values(creatures$.get() || {}) as unknown as Creature[];

        const siteMap = new Map(sites.map(s => [s.id, s.name]));

        // Robust creature mapping
        const creatureMap = new Map();
        creatures.forEach(c => {
            if (c.id) creatureMap.set(c.id, c.name);
            if (c.creature_id) creatureMap.set(c.creature_id, c.name);
        });

        // Group by Date + Site + Time (approximate a "Dive")
        const groups: Record<string, DiveLogGroup> = {};

        sightings.forEach(sighting => {
            // Normalize ID handling
            const siteId = sighting.dive_site_id || 'unknown';
            const date = sighting.date;
            // Handle time potentially missing
            const time = sighting.time_of_day || '00:00';

            // key to group by
            const key = `${date}_${siteId}_${time}`;

            if (!groups[key]) {
                const siteNameRaw = siteMap.get(siteId);
                groups[key] = {
                    id: key,
                    date,
                    time,
                    siteId,
                    siteName: siteNameRaw || 'Unknown Location',
                    duration: sighting.duration || null,
                    maxDepth: sighting.depth ? parseFloat(sighting.depth) : null,
                    sightings: [],
                    previewCreatures: []
                };
            }

            // Update aggregates
            if (!groups[key].duration && sighting.duration) {
                groups[key].duration = sighting.duration;
            }
            // track max depth
            const sDepth = sighting.depth ? parseFloat(sighting.depth) : 0;
            if (sDepth > (groups[key].maxDepth || 0)) {
                groups[key].maxDepth = sDepth;
            }

            // Get creature name
            const creatureName = creatureMap.get(sighting.creature_id) || null;
            if (creatureName && !groups[key].previewCreatures.includes(creatureName)) {
                // Limit preview creatures to avoid clutter
                if (groups[key].previewCreatures.length < 3) {
                    groups[key].previewCreatures.push(creatureName);
                }
            }

            groups[key].sightings.push(sighting);
        });

        return Object.values(groups).sort((a, b) => {
            // Sort by date desc
            return new Date(b.date + 'T' + b.time).getTime() - new Date(a.date + 'T' + a.time).getTime();
        });
    });

    const handlePress = (log: DiveLogGroup) => {
        router.push(ROUTES.PROFILE.DIVE_LOG_DETAIL(log.id));
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
                    <Text style={styles.date}>{new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</Text>
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
                            <Text style={styles.metricText}>{item.maxDepth}m</Text>
                        </View>
                    )}
                </View>

                {item.previewCreatures.length > 0 && (
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
                )}
            </View>
            <View style={styles.cardArrow}>
                <ArrowRight size={20} color="#444" />
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <ScreenHeader title="Dive Logs" showBackButton />

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
