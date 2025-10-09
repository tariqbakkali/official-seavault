import * as React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { MapPin } from 'lucide-react-native';
import { Database } from '@/types/database';
import ImageWithFallback from '@/components/ImageWithFallback';

type DiveSite = Database['public']['Tables']['dive_sites']['Row'];

interface ExploreDiveSiteCardProps {
  diveSite: DiveSite;
  onPress: () => void;
}

const { width } = Dimensions.get('window');
const cardWidth = (width - 60) / 2;

export default function ExploreDiveSiteCard({ diveSite, onPress }: ExploreDiveSiteCardProps) {
  // Generate a static map URL (you'll need to replace YOUR_API_KEY with an actual Google Maps API key)
  const mapUrl = diveSite.latitude && diveSite.longitude 
    ? `https://maps.googleapis.com/maps/api/staticmap?center=${diveSite.latitude},${diveSite.longitude}&zoom=10&size=400x400&key=${process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY}`
    : null;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.imageContainer}>
        <ImageWithFallback 
          uri={mapUrl}
          style={styles.image}
        />
      </View>
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={2}>
          {diveSite.name}
        </Text>
        <View style={styles.locationContainer}>
          <MapPin size={14} color="#666" />
          <Text style={styles.location} numberOfLines={1}>
            {diveSite.latitude && diveSite.longitude 
              ? `${diveSite.latitude.toFixed(4)}, ${diveSite.longitude.toFixed(4)}`
              : 'Location unknown'
            }
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: cardWidth,
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    marginBottom: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#333',
  },
  imageContainer: {
    height: 120,
    backgroundColor: '#2a2a2a',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  content: {
    padding: 12,
  },
  name: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  location: {
    color: '#666',
    fontSize: 12,
    flex: 1,
  },
});