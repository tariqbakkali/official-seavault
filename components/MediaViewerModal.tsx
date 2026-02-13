import React, { useState, useEffect, useMemo } from 'react';
import {
    View,
    StyleSheet,
    Modal,
    Dimensions,
    TouchableOpacity,
    StatusBar,
    Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { X, Play, Pause } from 'lucide-react-native';
import { Video, ResizeMode } from 'expo-av';
import { getOptimizedUrl } from '@/services/cloudinaryService';
import * as FileSystem from 'expo-file-system/legacy';
import { AlertCircle } from 'lucide-react-native';
import { COLORS, TYPOGRAPHY } from '@/constants';
import { Text } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
} from 'react-native-reanimated';
import { GestureHandlerRootView, GestureDetector, Gesture } from 'react-native-gesture-handler';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface MediaItem {
    id: string;
    url: string;
    type: 'image' | 'video';
    thumbnailUrl?: string;
}

interface MediaViewerModalProps {
    isVisible: boolean;
    onClose: () => void;
    media: MediaItem[];
    initialIndex?: number;
}

const ImageItem = ({ uri }: { uri: string }) => {
    const scale = useSharedValue(1);
    const savedScale = useSharedValue(1);
    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);
    const savedTranslateX = useSharedValue(0);
    const savedTranslateY = useSharedValue(0);

    const pinchGesture = Gesture.Pinch()
        .onUpdate((e: any) => {
            scale.value = savedScale.value * e.scale;
        })
        .onEnd(() => {
            if (scale.value < 1) {
                scale.value = withSpring(1);
                savedScale.value = 1;
                translateX.value = withSpring(0);
                translateY.value = withSpring(0);
                savedTranslateX.value = 0;
                savedTranslateY.value = 0;
            } else {
                savedScale.value = scale.value;
            }
        });

    const panGesture = Gesture.Pan()
        .onUpdate((e: any) => {
            if (scale.value > 1) {
                translateX.value = savedTranslateX.value + e.translationX;
                translateY.value = savedTranslateY.value + e.translationY;
            }
        })
        .onEnd(() => {
            if (scale.value > 1) {
                savedTranslateX.value = translateX.value;
                savedTranslateY.value = translateY.value;
            }
        });

    const doubleTapGesture = Gesture.Tap()
        .numberOfTaps(2)
        .onStart(() => {
            if (scale.value !== 1) {
                scale.value = withSpring(1);
                savedScale.value = 1;
                translateX.value = withSpring(0);
                translateY.value = withSpring(0);
                savedTranslateX.value = 0;
                savedTranslateY.value = 0;
            } else {
                scale.value = withSpring(2.5);
                savedScale.value = 2.5;
            }
        });

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [
            { translateX: translateX.value },
            { translateY: translateY.value },
            { scale: scale.value },
        ],
    }));

    return (
        <GestureDetector gesture={Gesture.Exclusive(doubleTapGesture, Gesture.Simultaneous(pinchGesture, panGesture))}>
            <Animated.View style={[styles.itemContainer, animatedStyle]}>
                <Image
                    source={{ uri }}
                    style={styles.fullMedia}
                    contentFit="contain"
                    transition={200}
                />
            </Animated.View>
        </GestureDetector>
    );
};

const VideoItem = ({ uri, thumbnailUrl, isVisible }: { uri: string; thumbnailUrl?: string; isVisible: boolean }) => {
    const video = React.useRef<Video>(null);
    const [status, setStatus] = React.useState<any>({});
    const [fileMissing, setFileMissing] = useState(false);

    const [triedFallback, setTriedFallback] = useState(false);
    const [currentUri, setCurrentUri] = useState(uri);

    useEffect(() => {
        const checkFile = async () => {
            if (currentUri.startsWith('file://')) {
                try {
                    const info = await FileSystem.getInfoAsync(currentUri);
                    if (!info.exists) {
                        console.log('[MediaViewerModal] Local file missing:', currentUri);
                        if (!triedFallback && uri !== thumbnailUrl) {
                            // Try thumbnail as fallback if it's a remote URL
                            if (thumbnailUrl?.startsWith('http')) {
                                console.log('[MediaViewerModal] Attempting fallback to remote URL');
                                setCurrentUri(thumbnailUrl);
                                setTriedFallback(true);
                            } else {
                                setFileMissing(true);
                            }
                        } else {
                            setFileMissing(true);
                        }
                    } else {
                        setFileMissing(false);
                    }
                } catch (e) {
                    setFileMissing(true);
                }
            } else {
                setFileMissing(false);
            }
        };
        checkFile();
    }, [currentUri, uri, triedFallback, thumbnailUrl]);

    const videoSource = useMemo(() => {
        if (!currentUri) return { uri: '' };

        if (currentUri.startsWith('http') && currentUri.includes('cloudinary.com')) {
            // Apply f_auto, q_auto for optimization
            const publicId = currentUri.split('/').pop()?.split('.')[0];
            if (publicId) {
                return { uri: getOptimizedUrl(publicId, 'video', ['f_auto', 'q_auto']) };
            }
        }
        return { uri: currentUri };
    }, [currentUri]);

    useEffect(() => {
        if (!isVisible && video.current) {
            video.current.pauseAsync();
        }
    }, [isVisible]);

    const posterSource = useMemo(() => {
        if (thumbnailUrl) return { uri: thumbnailUrl };
        if (uri.includes('cloudinary.com')) {
            const publicId = uri.split('/').pop()?.split('.')[0];
            if (publicId) {
                return { uri: getOptimizedUrl(publicId, 'video', ['c_fill', 'w_800', 'h_800', 'f_auto', 'q_auto']) + '.jpg' };
            }
        }
        return undefined;
    }, [uri, thumbnailUrl]);

    return (
        <View style={styles.itemContainer}>
            {fileMissing ? (
                <View style={styles.errorContainer}>
                    <AlertCircle size={48} color={COLORS.ERROR} />
                    <Text style={styles.errorText}>Video file not found</Text>
                    <Text style={styles.errorSubtext}>The local file has been moved or deleted.</Text>
                </View>
            ) : (
                <>
                    <Video
                        ref={video}
                        style={styles.fullMedia}
                        source={videoSource}
                        useNativeControls
                        resizeMode={ResizeMode.CONTAIN}
                        isLooping
                        posterSource={posterSource}
                        usePoster={true}
                        posterStyle={styles.fullMedia}
                        onPlaybackStatusUpdate={status => setStatus(() => status)}
                    />
                    {status.isLoaded && !status.isPlaying && (
                        <TouchableOpacity
                            style={styles.playButtonOverlay}
                            onPress={() => video.current?.playAsync()}
                        >
                            <Play size={50} color="#fff" fill="#fff" opacity={0.8} />
                        </TouchableOpacity>
                    )}
                </>
            )}
        </View>
    );
};

export const MediaViewerModal: React.FC<MediaViewerModalProps> = ({
    isVisible,
    onClose,
    media,
    initialIndex = 0,
}) => {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);

    useEffect(() => {
        if (isVisible) {
            setCurrentIndex(initialIndex);
        }
    }, [isVisible, initialIndex]);

    if (!isVisible) return null;

    return (
        <Modal
            visible={isVisible}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose}
        >
            <GestureHandlerRootView style={styles.container}>
                <StatusBar barStyle="light-content" backgroundColor="#000" />

                <TouchableOpacity
                    style={styles.closeButton}
                    onPress={onClose}
                    activeOpacity={0.7}
                >
                    <X size={30} color="#fff" />
                </TouchableOpacity>

                <Animated.FlatList
                    data={media}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    initialScrollIndex={initialIndex}
                    getItemLayout={(_, index) => ({
                        length: SCREEN_WIDTH,
                        offset: SCREEN_WIDTH * index,
                        index,
                    })}
                    onMomentumScrollEnd={(e) => {
                        const nextIndex = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
                        setCurrentIndex(nextIndex);
                    }}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item, index }) => (
                        <View style={styles.page}>
                            {item.type === 'video' ? (
                                <VideoItem
                                    uri={item.url}
                                    thumbnailUrl={item.thumbnailUrl}
                                    isVisible={currentIndex === index}
                                />
                            ) : (
                                <ImageItem uri={item.url} />
                            )}
                        </View>
                    )}
                />

                <View style={styles.footer}>
                    <Animated.Text style={styles.paginationText}>
                        {currentIndex + 1} / {media.length}
                    </Animated.Text>
                </View>
            </GestureHandlerRootView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    closeButton: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 60 : 40,
        right: 20,
        zIndex: 10,
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    page: {
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT,
        justifyContent: 'center',
        alignItems: 'center',
    },
    itemContainer: {
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT,
        justifyContent: 'center',
        alignItems: 'center',
    },
    fullMedia: {
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT,
    },
    footer: {
        position: 'absolute',
        bottom: Platform.OS === 'ios' ? 40 : 20,
        left: 0,
        right: 0,
        alignItems: 'center',
    },
    paginationText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    playButtonOverlay: {
        position: 'absolute',
        zIndex: 10,
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: 40,
        padding: 10,
    },
    errorContainer: {
        alignItems: 'center',
        padding: 40,
        gap: 12,
    },
    errorText: {
        color: '#fff',
        fontSize: TYPOGRAPHY.SIZE_LG,
        fontWeight: 'bold',
        marginTop: 8,
    },
    errorSubtext: {
        color: '#888',
        fontSize: TYPOGRAPHY.SIZE_SM,
        textAlign: 'center',
    },
});

export default MediaViewerModal;
