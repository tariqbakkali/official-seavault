import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { COLORS, DIMENSIONS, TYPOGRAPHY } from '@/constants';

interface MapLoadingStateProps {
    message?: string;
    showTimeout?: boolean;
}

/**
 * Loading state component for map initialization
 * Shows skeleton UI with loading indicator
 */
const MapLoadingState: React.FC<MapLoadingStateProps> = ({
    message = 'Loading map...',
    showTimeout = false
}) => {
    return (
        <View style={styles.container}>
            <View style={styles.skeletonMap}>
                <ActivityIndicator size="large" color={COLORS.PRIMARY} />
                <Text style={styles.loadingText}>{message}</Text>
                {showTimeout && (
                    <Text style={styles.timeoutText}>
                        This is taking longer than expected...
                    </Text>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        borderRadius: DIMENSIONS.RADIUS_MD,
        overflow: 'hidden',
    },
    skeletonMap: {
        flex: 1,
        backgroundColor: COLORS.SURFACE_SECONDARY,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.BORDER_SECONDARY,
        borderRadius: DIMENSIONS.RADIUS_MD,
    },
    loadingText: {
        marginTop: DIMENSIONS.SPACE_MD,
        fontSize: TYPOGRAPHY.SIZE_MD,
        color: COLORS.TEXT_SECONDARY,
        fontWeight: TYPOGRAPHY.WEIGHT_MEDIUM,
    },
    timeoutText: {
        marginTop: DIMENSIONS.SPACE_SM,
        fontSize: TYPOGRAPHY.SIZE_SM,
        color: COLORS.WARNING,
        textAlign: 'center',
        paddingHorizontal: DIMENSIONS.SPACE_LG,
    },
});

export default MapLoadingState;
