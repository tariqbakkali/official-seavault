import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Linking,
    Modal,
    Dimensions,
    SafeAreaView
} from 'react-native';
import { Stack, router } from 'expo-router';
import { useSelector } from '@legendapp/state/react';
import { articles$ } from '@/stores/syncedObservables';
import { Article } from '@/types/database';
import { ImageWithFallback } from '@/components';
import { DIMENSIONS, TYPOGRAPHY } from '@/constants';
import { X, ArrowLeft } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function ArticlesListScreen() {
    const articles = useSelector(() => {
        const data = articles$.get();
        if (!data) return [];
        return Object.values(data)
            .filter((a: any) => a.status === 'published')
            .sort((a: any, b: any) => {
                // specific display order takes precedence
                if (a.display_order && b.display_order) {
                    return a.display_order - b.display_order;
                }
                // fallback to most recently published
                return new Date(b.published_at || b.created_at).getTime() - new Date(a.published_at || a.created_at).getTime();
            });
    });

    const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

    const handlePress = async (article: Article) => {
        if (article.external_link) {
            const supported = await Linking.canOpenURL(article.external_link);
            if (supported) {
                await Linking.openURL(article.external_link);
            }
        } else if (article.content) {
            setSelectedArticle(article);
        }
    };

    const renderItem = ({ item }: { item: Article }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => handlePress(item)}
            activeOpacity={0.9}
        >
            <View style={styles.imageContainer}>
                <ImageWithFallback
                    uri={item.image_url || undefined}
                    style={styles.image}
                    fallbackColor="#1a1a1a"
                />
                <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.8)']}
                    style={styles.gradientOverlay}
                />
            </View>
            <View style={styles.cardContent}>
                {item.category && (
                    <View style={styles.categoryChip}>
                        <Text style={styles.categoryText}>{item.category}</Text>
                    </View>
                )}
                <Text style={styles.cardTitle} numberOfLines={2}>
                    {item.title}
                </Text>
                {item.subtitle && (
                    <Text style={styles.cardDesc} numberOfLines={2}>
                        {item.subtitle}
                    </Text>
                )}
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* Header */}
            <SafeAreaView style={styles.headerSafeArea}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <ArrowLeft size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Articles & Stories</Text>
                    <View style={{ width: 40 }} />
                </View>
            </SafeAreaView>

            <FlatList
                data={articles}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
            />

            {/* Article Modal */}
            <Modal
                visible={!!selectedArticle}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setSelectedArticle(null)}
            >
                <View style={styles.modalContainer}>
                    <SafeAreaView style={styles.modalHeader}>
                        <TouchableOpacity
                            onPress={() => setSelectedArticle(null)}
                            style={styles.closeButton}
                        >
                            <X size={24} color="#fff" />
                        </TouchableOpacity>
                    </SafeAreaView>
                    <FlatList
                        ListHeaderComponent={() => (
                            <>
                                {selectedArticle?.image_url && (
                                    <ImageWithFallback
                                        uri={selectedArticle.image_url}
                                        style={styles.modalImage}
                                        fallbackColor="#1a1a1a"
                                    />
                                )}
                                <View style={styles.modalContent}>
                                    <Text style={styles.modalTitle}>{selectedArticle?.title}</Text>
                                    <Text style={styles.modalText}>{selectedArticle?.content}</Text>
                                </View>
                            </>
                        )}
                        data={[]}
                        renderItem={null}
                    />
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    headerSafeArea: {
        backgroundColor: '#000',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: DIMENSIONS.PADDING_LG,
        paddingVertical: DIMENSIONS.PADDING_MD,
    },
    backButton: {
        padding: 8,
        marginLeft: -8,
    },
    headerTitle: {
        fontSize: TYPOGRAPHY.SIZE_XL,
        fontWeight: 'bold',
        color: '#fff',
    },
    listContent: {
        padding: DIMENSIONS.PADDING_LG,
        gap: DIMENSIONS.MARGIN_LG,
    },
    card: {
        width: '100%',
        height: 220,
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: '#1a1a1a',
    },
    imageContainer: {
        width: '100%',
        height: '100%',
        position: 'absolute',
    },
    image: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    gradientOverlay: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 1,
    },
    cardContent: {
        flex: 1,
        justifyContent: 'flex-end',
        padding: DIMENSIONS.PADDING_MD,
        zIndex: 2,
    },
    categoryChip: {
        backgroundColor: '#FF9500',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        alignSelf: 'flex-start',
        marginBottom: 8,
    },
    categoryText: {
        color: '#000',
        fontWeight: 'bold',
        fontSize: TYPOGRAPHY.SIZE_XS,
    },
    cardTitle: {
        fontSize: TYPOGRAPHY.SIZE_LG + 2,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 4,
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: { width: -1, height: 1 },
        textShadowRadius: 10,
    },
    cardDesc: {
        fontSize: TYPOGRAPHY.SIZE_SM,
        color: '#eee',
        fontWeight: '500',
    },
    modalContainer: {
        flex: 1,
        backgroundColor: '#000',
    },
    modalHeader: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10,
        padding: DIMENSIONS.PADDING_MD,
        alignItems: 'flex-end',
    },
    closeButton: {
        padding: 8,
        margin: 8,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 20,
    },
    modalImage: {
        width: '100%',
        height: 300,
        resizeMode: 'cover',
    },
    modalContent: {
        padding: DIMENSIONS.PADDING_XL,
    },
    modalTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: DIMENSIONS.MARGIN_SM,
    },
    modalText: {
        fontSize: 18,
        color: '#ddd',
        lineHeight: 28,
    },
});
