import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ScrollView, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Video } from 'lucide-react-native';
import { COLORS, DIMENSIONS, TYPOGRAPHY } from '@/constants';

interface MediaItem {
    uri: string;
    type: 'image' | 'video';
    id?: string;
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
                const newItems: MediaItem[] = result.assets.map(asset => ({
                    uri: asset.uri,
                    type: asset.type === 'video' ? 'video' : 'image',
                }));
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
                            <Image source={{ uri: item.uri }} style={styles.mediaThumbnail} />
                        ) : (
                            <View style={[styles.mediaThumbnail, styles.videoPlaceholder]}>
                                <Video color="#fff" size={24} />
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
});

export default MediaSection;
