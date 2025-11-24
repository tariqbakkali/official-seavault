import React, { useState, useEffect } from 'react';
import { Text, StyleSheet, View } from 'react-native';
import { getCountryCodeFromCoordinates, getCountryFlag } from '@/utils/locationUtils';
import { TYPOGRAPHY } from '@/constants';

interface CountryFlagProps {
  latitude: number;
  longitude: number;
  size?: number;
  style?: any;
}

const CountryFlag: React.FC<CountryFlagProps> = ({ latitude, longitude, size = TYPOGRAPHY.SIZE_LG, style }) => {
  const [flag, setFlag] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchFlag = async () => {
      if (latitude && longitude) {
        const countryCode = await getCountryCodeFromCoordinates(latitude, longitude);
        if (isMounted && countryCode) {
          setFlag(getCountryFlag(countryCode));
        }
      }
    };

    fetchFlag();

    return () => {
      isMounted = false;
    };
  }, [latitude, longitude]);

  if (!flag) return null;

  return (
    <Text style={[styles.flag, { fontSize: size }, style]}>{flag}</Text>
  );
};

const styles = StyleSheet.create({
  flag: {
    marginRight: 8,
  },
});

export default CountryFlag;
