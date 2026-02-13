import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ScrollView, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { documentDirectory, moveAsync, makeDirectoryAsync, getInfoAsync } from 'expo-file-system/legacy';
let VideoThumbnails: any = null;
try {
    VideoThumbnails = require('expo-video-thumbnails');
} catch (e) {
    console.warn('[MediaSection] VideoThumbnails not available');
}
import { v4 as uuidv4 } from 'uuid';
import { Video, Play } from 'lucide-react-native';
import { COLORS, DIMENSIONS, TYPOGRAPHY } from '@/constants';
import ImageWithFallback from '@/components/ImageWithFallback';

interface MediaItem {
    uri: string;
    type: 'image' | 'video';
    id?: string;
    thumbnailUrl?: string;
}

interface MediaSectionProps {
    media: MediaItem[];
    onMediaAdded: (items: MediaItem[]) => void;
    onMediaRemoved: (index: number) => void;
}

const MediaSection: React.FC<MediaSectionProps> = ({
    media,
    onMediaAdded,
    onMediaRemoved,
}) => {
    const pickMedia = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Required', 'Permissions are needed to select media.');
            return;
        }

        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.All,
                allowsMultipleSelection: true,
                quality: 0.8,
            });

            if (!result.canceled && result.assets) {
                console.log('[MediaSection] Picked assets:', result.assets.length);
                const persistentItems: MediaItem[] = [];
                const mediaDir = `${documentDirectory}media/`;

                // Ensure directory exists
                try {
                    const dirInfo = await getInfoAsync(mediaDir);
                    if (!dirInfo.exists) {
                        console.log('[MediaSection] Creating media directory:', mediaDir);
                        await makeDirectoryAsync(mediaDir, { intermediates: true });
                    }
                } catch (e) {
                    console.error('[MediaSection] Error creating media directory:', e);
                }

                const processedAssets = await Promise.all(result.assets.map(async (asset, index) => {
                    const fileExt = asset.uri.split('.').pop() || (asset.type === 'video' ? 'mp4' : 'jpg');
                    const fileName = `${uuidv4()}.${fileExt}`;
                    const newUri = `${mediaDir}${fileName}`;

                    console.log(`[MediaSection] Processing asset ${index}:`, {
                        type: asset.type,
                        originalUri: asset.uri,
                        newUri
                    });

                    try {
                        // Ensure directory exists before moving, as it might be deleted or not created by the initial check
                        await makeDirectoryAsync(mediaDir, { intermediates: true });
                        await moveAsync({ from: asset.uri, to: newUri });
                        console.log(`[MediaSection] Asset ${index} moved to persistent storage`);

                        let thumbnailUrl = undefined;
                        if (asset.type === 'video') {
                            if (VideoThumbnails) {
                                try {
                                    console.log(`[MediaSection] Generating thumbnail for asset ${index}...`);
                                    const { uri: thumbUri } = await VideoThumbnails.getThumbnailAsync(newUri, { time: 1000 });
                                    const thumbName = `thumb-${uuidv4()}.jpg`;
                                    const persistentThumbUri = `${mediaDir}${thumbName}`;
                                    await moveAsync({ from: thumbUri, to: persistentThumbUri });
                                    thumbnailUrl = persistentThumbUri;
                                    console.log(`[MediaSection] Thumbnail generated for asset ${index}:`, thumbnailUrl);
                                } catch (thumbError) {
                                    console.warn(`[MediaSection] Failed to generate thumbnail for asset ${index}:`, thumbError);
                                }
                            } else {
                                console.warn(`[MediaSection] VideoThumbnails module not available for asset ${index}`);
                            }
                        }

                        return {
                            uri: newUri,
                            type: asset.type || 'image',
                            thumbnailUrl
                        };
                    } catch (e) {
                        console.error(`[MediaSection] Error persisting asset ${index}:`, e);
                        return {
                            uri: asset.uri,
                            type: asset.type || 'image'
                        };
                    }
                }));

                const newItems: MediaItem[] = processedAssets.map(asset => ({
                    uri: asset.uri,
                    type: asset.type as 'image' | 'video',
                    thumbnailUrl: asset.thumbnailUrl
                }));
                console.log('[MediaSection] Adding new items to state:', newItems);
                onMediaAdded(newItems);
            }
        } catch (error) {
            console.error('Pick media error:', error);
        }
    };

    return (
        <View style={styles.section}>
            <Text style={styles.label}>Photos & Videos</Text>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.mediaList}>
                <TouchableOpacity style={styles.addButton} onPress={pickMedia}>
                    <Text style={styles.addIcon}>+</Text>
                    <Text style={styles.addText}>Add</Text>
                </TouchableOpacity>

                {media.map((item, index) => (
                    <View key={index} style={styles.mediaWrapper}>
                        {item.type === 'image' ? (
                            <ImageWithFallback
                                uri={item.uri}
                                style={styles.mediaThumbnail}
                            />
                        ) : (
                            <View style={styles.mediaThumbnail}>
                                <ImageWithFallback
                                    uri={[
                                        item.thumbnailUrl || '',
                                        item.uri?.startsWith('http') ? item.uri.replace(/\.\w+$/, '.jpg') : '',
                                    ].filter(Boolean)}
                                    style={styles.mediaThumbnail}
                                    defaultImageSource={undefined}
                                    showOfflineIndicator={false}
                                />
                                <View style={styles.videoOverlay}>
                                    <Play color="#fff" size={16} fill="#fff" />
                                </View>
                            </View>
                        )}
                        <TouchableOpacity
                            style={styles.removeBadge}
                            onPress={() => onMediaRemoved(index)}
                        >
                            <Text style={styles.removeText}>×</Text>
                        </TouchableOpacity>
                    </View>
                ))}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    section: {
        marginBottom: DIMENSIONS.SPACE_XL,
    },
    label: {
        fontSize: TYPOGRAPHY.SIZE_MD,
        fontWeight: TYPOGRAPHY.WEIGHT_BOLD,
        color: COLORS.TEXT_PRIMARY,
        marginBottom: DIMENSIONS.SPACE_SM,
    },
    mediaList: {
        flexDirection: 'row',
    },
    addButton: {
        width: 100,
        height: 100,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
    },
    addIcon: {
        fontSize: 28,
        color: '#40C4FF',
        fontWeight: '300',
    },
    addText: {
        fontSize: 10,
        color: 'rgba(255, 255, 255, 0.4)',
        marginTop: 2,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    mediaWrapper: {
        position: 'relative',
        marginRight: 12,
    },
    mediaThumbnail: {
        width: 100,
        height: 100,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    videoPlaceholder: {
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(64, 196, 255, 0.15)',
    },
    removeBadge: {
        position: 'absolute',
        top: -6,
        right: -6,
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#FF5252',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#000',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.5,
        shadowRadius: 2,
    },
    removeText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '900',
        lineHeight: 18,
    },
    videoOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
        borderRadius: 12,
    },
});

export default MediaSection;
