import Constants from 'expo-constants';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { MapPin } from 'lucide-react-native';
import { Database } from '@/types/database';
import OfflineImageHandler from '@/components/OfflineImageHandler';
import { COLORS, TYPOGRAPHY, DIMENSIONS } from '@/constants';

type DiveSite = Database['public']['Tables']['dive_sites']['Row'];

interface ExploreDiveSiteCardProps {
  diveSite: DiveSite;
  onPress: () => void;
  isCurrentUserItem?: boolean;
}

const { width } = Dimensions.get('window');
const cardWidth = (width - 60) / 2;

export default function ExploreDiveSiteCard({
  diveSite,
  onPress,
  isCurrentUserItem,
}: ExploreDiveSiteCardProps) {
  // Generate a static map URL (you'll need to replace YOUR_API_KEY with an actual Google Maps API key)
  const key = Constants.expoConfig?.extra?.GOOGLE_MAPS_API_KEY || '';
  const mapUrl =
    diveSite.latitude && diveSite.longitude
      ? `https://maps.googleapis.com/maps/api/staticmap?center=${
          diveSite.latitude
        },${diveSite.longitude}&zoom=10&size=400x400&key=${key || ''}`
      : null;

  return (
    <TouchableOpacity
      style={[styles.card, isCurrentUserItem && styles.currentUserCard]}
      onPress={onPress}
    >
      <View style={styles.imageContainer}>
        <OfflineImageHandler uri={mapUrl} style={styles.image} />
      </View>
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={2}>
          {diveSite.name}
        </Text>
        <View style={styles.locationContainer}>
          <MapPin size={14} color="#666" />
          <Text style={styles.location} numberOfLines={1}>
            {diveSite.latitude && diveSite.longitude
              ? `${diveSite.latitude.toFixed(4)}, ${diveSite.longitude.toFixed(
                  4
                )}`
              : 'Location unknown'}
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
    borderRadius: DIMENSIONS.RADIUS_LG,
    marginBottom: DIMENSIONS.SPACE_LG,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#333',
  },
  currentUserCard: {
    backgroundColor: COLORS.PRIMARY_LIGHT,
    borderColor: COLORS.PRIMARY,
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
    padding: DIMENSIONS.PADDING_SM,
  },
  name: {
    color: '#fff',
    fontSize: TYPOGRAPHY.SIZE_LG,
    fontWeight: '600',
    marginBottom: DIMENSIONS.SPACE_XS,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DIMENSIONS.SPACE_XS,
  },
  location: {
    color: '#666',
    fontSize: TYPOGRAPHY.SIZE_SM,
    flex: 1,
  },
});
