import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Linking,
    Dimensions,
    Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BookOpen, X } from 'lucide-react-native'; // Assuming BookOpen icon exists
import { ImageWithFallback } from '@/components';
import { Article } from '@/types/database';
import { DIMENSIONS, TYPOGRAPHY } from '@/constants';
import { useSelector } from '@legendapp/state/react';
import { articles$ } from '@/stores/syncedObservables';

import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - (DIMENSIONS.PADDING_LG * 2); // Full available width

export default function ArticlesSection() {
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

    if (articles.length === 0) {
        return null;
    }

    return (
        <View style={styles.container}>
            <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleRow}>
                    <BookOpen size={20} color="#FF9500" />
                    <Text style={styles.sectionTitle}>Articles & Stories</Text>
                </View>
                <TouchableOpacity onPress={() => router.push('/articles')}>
                    <Text style={styles.seeAllButton}>See All</Text>
                </TouchableOpacity>
            </View>

            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                decelerationRate="fast"
                snapToInterval={CARD_WIDTH + DIMENSIONS.MARGIN_MD}
            >
                {articles.slice(0, 5).map((article: Article) => (
                    <TouchableOpacity
                        key={article.id}
                        style={styles.card}
                        onPress={() => handlePress(article)}
                        activeOpacity={0.9}
                    >
                        <View style={styles.imageContainer}>
                            <ImageWithFallback
                                uri={article.image_url || undefined}
                                style={styles.image}
                                fallbackColor="#1a1a1a"
                            />
                            <LinearGradient
                                colors={['transparent', 'rgba(0,0,0,0.8)']}
                                style={styles.gradientOverlay}
                            />
                        </View>
                        <View style={styles.cardContent}>
                            {article.category && (
                                <View style={styles.categoryChip}>
                                    <Text style={styles.categoryText}>{article.category}</Text>
                                </View>
                            )}
                            <Text style={styles.cardTitle} numberOfLines={2}>
                                {article.title}
                            </Text>
                            {(article.subtitle) && (
                                <Text style={styles.cardDesc} numberOfLines={2}>
                                    {article.subtitle}
                                </Text>
                            )}
                        </View>
                    </TouchableOpacity>
                ))}
            </ScrollView>

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
                    <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
                        {selectedArticle?.image_url && (
                            <ImageWithFallback
                                uri={selectedArticle.image_url}
                                style={styles.modalImage}
                                fallbackColor="#1a1a1a"
                            />
                        )}
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>{selectedArticle?.title}</Text>
                            {/* Simple text rendering with some formatting */}
                            <Text style={styles.modalText}>{selectedArticle?.content}</Text>
                        </View>
                    </ScrollView>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: DIMENSIONS.PADDING_LG,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: DIMENSIONS.PADDING_LG,
        marginBottom: DIMENSIONS.MARGIN_MD,
    },
    sectionTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: DIMENSIONS.GAP_SM,
    },
    sectionTitle: {
        fontSize: TYPOGRAPHY.SIZE_XXL,
        fontWeight: 'bold',
        color: '#fff',
    },
    seeAllButton: {
        color: '#007AFF',
        fontSize: TYPOGRAPHY.SIZE_LG,
        fontWeight: '600',
    },
    scrollContent: {
        paddingHorizontal: DIMENSIONS.PADDING_LG,
        gap: DIMENSIONS.MARGIN_MD,
    },
    card: {
        width: CARD_WIDTH,
        height: 220, // Taller card for better visuals
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
    // Modal Styles
    modalContainer: {
        flex: 1,
        backgroundColor: '#000', // Dark background for reading
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
    modalScrollView: {
        flex: 1,
    },
    modalImage: {
        width: '100%',
        height: 300,
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
    modalAuthor: {
        fontSize: TYPOGRAPHY.SIZE_MD,
        color: '#888',
        marginBottom: DIMENSIONS.MARGIN_LG,
        fontStyle: 'italic',
    },
    modalText: {
        fontSize: 18,
        color: '#ddd',
        lineHeight: 28, // Improved readability
    },
});
