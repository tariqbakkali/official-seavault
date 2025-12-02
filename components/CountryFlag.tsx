import React, { useState, useEffect } from 'react';
import { Text, StyleSheet, View, ActivityIndicator, ViewStyle, StyleProp } from 'react-native';
import { MapPin } from 'lucide-react-native';
import { getCountryCodeFromCoordinates, getCountryFlag } from '@/utils/locationUtils';
import { TYPOGRAPHY } from '@/constants';

interface CountryFlagProps {
  latitude: number;
  longitude: number;
  size?: number;
  showCode?: boolean;
  style?: StyleProp<ViewStyle>;
}

const CountryFlag: React.FC<CountryFlagProps> = ({
  latitude,
  longitude,
  size = TYPOGRAPHY.SIZE_MD,
  showCode = false,
  style
}) => {
  const [flag, setFlag] = useState<string | null>(null);
  const [code, setCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchCountry = async () => {
      if (!latitude || !longitude) {
        if (isMounted) setLoading(false);
        return;
      }

      try {
        const countryCode = await getCountryCodeFromCoordinates(latitude, longitude);
        if (isMounted && countryCode) {
          setCode(countryCode);
          setFlag(getCountryFlag(countryCode));
        }
      } catch (error) {
        // Suppress error - geocoding service may not be available on emulators
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchCountry();

    return () => {
      isMounted = false;
    };
  }, [latitude, longitude]);

  if (loading) {
    return <ActivityIndicator size="small" color="#999" style={[{ width: size, height: size }, style]} />;
  }

  if (!flag && !code) {
    return (
      <View style={[styles.container, style]}>
        <MapPin size={size} color="#666" />
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      {flag ? (
        <Text style={[styles.flag, { fontSize: size }]}>{flag}</Text>
      ) : (
        <Text style={[styles.code, { fontSize: size * 0.8 }]}>{code}</Text>
      )}
      {showCode && flag && code && <Text style={styles.code}>{code}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  flag: {
    marginRight: 4,
  },
  code: {
    fontSize: TYPOGRAPHY.SIZE_SM,
    color: '#666',
  },
});

export default CountryFlag;
