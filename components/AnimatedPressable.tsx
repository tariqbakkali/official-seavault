import React from 'react';
import { TouchableOpacity, TouchableOpacityProps } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withSequence } from 'react-native-reanimated';

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

interface AnimatedPressableProps extends TouchableOpacityProps {
    hapticStyle?: 'light' | 'medium' | 'heavy' | 'selection' | 'none';
    scaleValue?: number;
    children: React.ReactNode;
}

/**
 * A reusable pressable component with haptic feedback and scale animation
 * @param hapticStyle - Type of haptic feedback (default: 'light')
 * @param scaleValue - Scale down value on press (default: 0.95)
 */
export const AnimatedPressable: React.FC<AnimatedPressableProps> = ({
    hapticStyle = 'light',
    scaleValue = 0.95,
    onPress,
    children,
    style,
    ...props
}) => {
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ scale: scale.value }],
        };
    });

    const handlePress = (event: any) => {
        // Trigger haptic feedback
        if (hapticStyle !== 'none') {
            switch (hapticStyle) {
                case 'light':
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    break;
                case 'medium':
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    break;
                case 'heavy':
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                    break;
                case 'selection':
                    Haptics.selectionAsync();
                    break;
            }
        }

        // Trigger animation
        scale.value = withSequence(
            withSpring(scaleValue, { damping: 15, stiffness: 400 }),
            withSpring(1, { damping: 15, stiffness: 400 })
        );

        // Call original onPress
        if (onPress) {
            onPress(event);
        }
    };

    return (
        <AnimatedTouchableOpacity
            {...props}
            style={[style, animatedStyle]}
            onPress={handlePress}
            activeOpacity={0.8}
        >
            {children}
        </AnimatedTouchableOpacity>
    );
};

export default AnimatedPressable;
