import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Image, Animated, Easing, Platform } from 'react-native';
import { COLORS, TYPOGRAPHY, DIMENSIONS } from '@/constants';
import { useTabBar } from '@/contexts/TabBarContext';

interface LoadingScreenProps {
  message?: string;
  showIcon?: boolean;
  variant?: 'fullscreen' | 'overlay' | 'inline';
  hideTabBar?: boolean;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  message = 'Loading...',
  showIcon = true,
  variant = 'fullscreen',
  hideTabBar = true
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;
  const [dots, setDots] = React.useState('');
  const tabBar = useTabBar();

  useEffect(() => {
    // Hide tab bar when loading screen mounts
    if (hideTabBar && variant === 'fullscreen') {
      tabBar.hideTabBar();
    }

    // Show tab bar when loading screen unmounts
    return () => {
      if (hideTabBar && variant === 'fullscreen') {
        tabBar.showTabBar();
      }
    };
  }, [hideTabBar, variant, tabBar]);

  useEffect(() => {
    // Animated dots effect
    const interval = setInterval(() => {
      setDots(prev => {
        if (prev === '...') return '.';
        if (prev === '..') return '...';
        if (prev === '.') return '..';
        return '.';
      });
    }, 500);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Smooth breathing animation with easing
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(scaleAnim, {
            toValue: 1.15,
            duration: 1200,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 0.7,
            duration: 1200,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 1200,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: 1200,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start();
  }, [scaleAnim, opacityAnim]);

  const containerStyles = [
    styles.container,
    variant === 'fullscreen' && styles.fullscreen,
    variant === 'overlay' && styles.overlay,
    variant === 'inline' && styles.inline,
  ];

  const logoSize = variant === 'inline' ? 40 : 120;

  // Remove existing ... from message if present
  const cleanMessage = message.replace(/\.\.\.$/, '');

  return (
    <View style={containerStyles}>
      <View style={styles.content}>
        <Animated.View
          style={{
            transform: [{ scale: scaleAnim }],
            opacity: opacityAnim,
          }}
        >
          <Image
            source={require('@/assets/images/icon.png')}
            style={{ width: logoSize, height: logoSize }}
            resizeMode="contain"
          />
        </Animated.View>
        {message && (
          <Text style={styles.message}>
            {cleanMessage}
            <Text style={styles.dots}>{dots}</Text>
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreen: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    zIndex: 999,
  },
  inline: {
    padding: DIMENSIONS.PADDING_MD,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginBottom: DIMENSIONS.MARGIN_LG,
    opacity: 0.8,
  },
  message: {
    marginTop: DIMENSIONS.MARGIN_LG,
    color: '#fff',
    fontSize: TYPOGRAPHY.SIZE_LG,
    fontWeight: '500',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  dots: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    minWidth: 30,
  },
});

export default LoadingScreen;
