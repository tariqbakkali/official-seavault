import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Svg, { Path, Defs, ClipPath, Rect, G } from 'react-native-svg';
import Animated, {
    useSharedValue,
    useAnimatedProps,
    withRepeat,
    withTiming,
    Easing,
    useDerivedValue
} from 'react-native-reanimated';
import { COLORS } from '@/constants';

interface SharkAnimationProps {
    size?: number;
    color?: string;
    style?: ViewStyle;
}

const AnimatedRect = Animated.createAnimatedComponent(Rect);

export const SharkAnimation: React.FC<SharkAnimationProps> = ({
    size = 100,
    color = COLORS.PRIMARY || '#007AFF',
    style,
}) => {
    // Shark silhouette path
    // A stylized shark shape
    const sharkPath = "M25,65 C25,65 10,60 5,55 C0,50 5,45 15,45 C15,45 25,40 35,35 C35,35 45,15 50,5 C55,15 65,35 65,35 C75,40 85,45 85,45 C95,45 100,50 95,55 C90,60 75,65 75,65 L25,65 Z";
    // A more detailed shark path (simplified for SVG)
    // This is a placeholder path that resembles a shark/fish shape. 
    // Ideally, this would be a proper designer asset.
    const betterSharkPath = `
    M90.5,45.5 c-5-2-15-5-25-5 c-5,0-10,1-15,3 c-5-10-10-25-12-30 c-1-2-4-2-5,0 c-2,5-5,20-8,30 
    c-8-2-18-3-22-3 c-5,0-8,2-8,5 c0,2 2,4 5,5 c5,2 15,5 25,5 c2,0 4,0 6-0.5 c2,5 5,12 6,14 
    c1,2 4,2 5,0 c1-2 4-9 6-14 c2,0.5 4,0.5 6,0.5 c10,0 20-3 25-5 c3-1 5-3 5-5 C95.5,47.5 93.5,46.5 90.5,45.5 z
  `;

    // Using a simplified shark shape for better filling effect
    const finalPath = "M95.6,44.3c-4.2-1.9-13.3-4.8-23.8-4.8c-4.8,0-9.4,0.6-13.8,1.7C53.8,31.7,49.6,18.8,48.2,14c-0.6-2.1-3.6-2.1-4.2,0c-1.4,4.8-5.6,17.7-9.8,27.2c-4.4-1.1-9-1.7-13.8-1.7c-10.5,0-19.6,2.9-23.8,4.8c-2.8,1.3-2.8,5.3,0,6.6c4.2,1.9,13.3,4.8,23.8,4.8c4.8,0,9.4-0.6,13.8-1.7c4.2,9.5,8.4,22.4,9.8,27.2c0.6,2.1,3.6,2.1,4.2,0c1.4-4.8,5.6-17.7,9.8-27.2c4.4,1.1,9,1.7,13.8,1.7c10.5,0,19.6-2.9,23.8-4.8C98.4,49.6,98.4,45.6,95.6,44.3z";

    const progress = useSharedValue(0);

    useEffect(() => {
        progress.value = withRepeat(
            withTiming(1, {
                duration: 1500,
                easing: Easing.inOut(Easing.ease),
            }),
            -1,
            true // reverse
        );
    }, []);

    const animatedRectProps = useAnimatedProps(() => {
        return {
            y: 100 - (progress.value * 100),
            height: progress.value * 100,
        };
    });

    return (
        <View style={[styles.container, { width: size, height: size }, style]}>
            <Svg width="100%" height="100%" viewBox="0 0 100 100">
                <Defs>
                    <ClipPath id="sharkClip">
                        <Path d={finalPath} />
                    </ClipPath>
                </Defs>

                {/* Background (Empty Shark) */}
                <Path
                    d={finalPath}
                    fill={color}
                    fillOpacity={0.2}
                    stroke={color}
                    strokeWidth="2"
                />

                {/* Filling Animation */}
                <G clipPath="url(#sharkClip)">
                    <AnimatedRect
                        x="0"
                        width="100"
                        fill={color}
                        fillOpacity={1}
                        animatedProps={animatedRectProps}
                    />
                </G>
            </Svg>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default SharkAnimation;
