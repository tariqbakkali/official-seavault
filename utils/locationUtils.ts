import * as Location from 'expo-location';

export const getCountryFlag = (countryCode: string) => {
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
};

export const getCountryCodeFromCoordinates = async (latitude: number, longitude: number): Promise<string | null> => {
  try {
    const [address] = await Location.reverseGeocodeAsync({ latitude, longitude });
    return address?.isoCountryCode || null;
  } catch (error) {
    console.error('Error getting country code:', error);
    return null;
  }
};
