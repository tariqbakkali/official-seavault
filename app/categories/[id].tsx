import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Check } from 'lucide-react-native';
import { Creature, CachedCatalog, CachedUserData } from '@/types/database';
import { loadCatalogCache, loadUserDataCache } from '@/services/cache';
import ImageWithFallback from '@/components/ImageWithFallback';

const { width } = Dimensions.get('window');
const cardWidth = (width - 60) / 2;

export default function CategoryCreaturesScreen() {
  const { id } = useLocalSearchParams();
  const [creatures, setCreatures] = useState<Creature[]>([]);
  const [categoryName, setCategoryName] = useState('');
  const [seenCreatures, setSeenCreatures] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const [catalog, userData] = await Promise.all([
        loadCatalogCache(),
        loadUserDataCache()
      ]);

      console.log('Category screen - catalog:', catalog?.creatures?.length, 'creatures');
      console.log('Category screen - category id:', id);

      if (catalog && userData) {
        const category = catalog.categories.find(c => c.id === id);
        setCategoryName(category?.name || 'Category');

        const categoryCreatures = catalog.creatures.filter(c => c.category_id === id);
        console.log('Category creatures found:', categoryCreatures.length);
        setCreatures(categoryCreatures);

        const seen = new Set(userData.sightings.map(s => s.creature_id));
        setSeenCreatures(seen);
      }
    } catch (error) {
      console.error('Error loading category creatures:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderCreature = ({ item }: { item: Creature }) => {
    const isSeen = seenCreatures.has(item.id);

    return (
      <TouchableOpacity
        style={styles.creatureCard}
        onPress={() => router.push(`/creatures/${item.id}`)}
      >
        <ImageWithFallback
          uri={item.image_url}
          style={styles.creatureImage}
          containerStyle={styles.imageContainer}
        />
        {isSeen && (
          <View style={styles.seenBadge}>
            <Check size={16} color="#fff" />
          </View>
        )}
        <View style={styles.creatureInfo}>
          <Text style={styles.creatureName} numberOfLines={2}>
            {item.name}
          </Text>
          {item.scientific_name && (
            <Text style={styles.scientificName} numberOfLines={1}>
              {item.scientific_name}
            </Text>
          )}
          {item.points && (
            <View style={styles.pointsBadge}>
              <Text style={styles.pointsText}>{item.points} pts</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>{categoryName}</Text>
        <View style={styles.placeholder} />
      </View>

      <FlatList
        data={creatures}
        keyExtractor={(item) => item.id}
        renderItem={renderCreature}
        numColumns={2}
        contentContainerStyle={styles.listContainer}
        columnWrapperStyle={styles.row}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  placeholder: {
    width: 40,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  row: {
    justifyContent: 'space-between',
  },
  creatureCard: {
    width: cardWidth,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    marginBottom: 20,
    overflow: 'hidden',
  },
  imageContainer: {
    width: '100%',
    height: 120,
  },
  creatureImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  seenBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#34C759',
    justifyContent: 'center',
    alignItems: 'center',
  },
  creatureInfo: {
    padding: 12,
  },
  creatureName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  scientificName: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  pointsBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#007AFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  pointsText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
  },
});