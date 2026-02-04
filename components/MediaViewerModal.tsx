import React, { useState, useEffect } from 'react';
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
import { X } from 'lucide-react-native';
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
                    renderItem={({ item }) => (
                        <View style={styles.page}>
                            <ImageItem uri={item.url} />
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
});

export default MediaViewerModal;
