import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, DIMENSIONS, TYPOGRAPHY } from '@/constants';

interface MapErrorStateProps {
    message?: string;
    onRetry?: () => void;
    onSwitchToList?: () => void;
}

/**
 * Error state component for map failures
 * Shows error message with retry and fallback options
 */
const MapErrorState: React.FC<MapErrorStateProps> = ({
    message = 'Failed to load map',
    onRetry,
    onSwitchToList
}) => {
    return (
        <View style={styles.container}>
            <View style={styles.errorContainer}>
                <Text style={styles.errorIcon}>⚠️</Text>
                <Text style={styles.errorTitle}>Map Unavailable</Text>
                <Text style={styles.errorMessage}>{message}</Text>

                <View style={styles.buttonContainer}>
                    {onRetry && (
                        <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
                            <Text style={styles.retryButtonText}>🔄 Retry</Text>
                        </TouchableOpacity>
                    )}

                    {onSwitchToList && (
                        <TouchableOpacity style={styles.listButton} onPress={onSwitchToList}>
                            <Text style={styles.listButtonText}>📋 View List</Text>
                        </TouchableOpacity>
                    )}
                </View>

                <Text style={styles.helpText}>
                    Try checking your internet connection or switching to list view
                </Text>
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
    errorContainer: {
        flex: 1,
        backgroundColor: COLORS.SURFACE_SECONDARY,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.BORDER_SECONDARY,
        borderRadius: DIMENSIONS.RADIUS_MD,
        padding: DIMENSIONS.SPACE_LG,
    },
    errorIcon: {
        fontSize: 48,
        marginBottom: DIMENSIONS.SPACE_MD,
    },
    errorTitle: {
        fontSize: TYPOGRAPHY.SIZE_XL,
        fontWeight: TYPOGRAPHY.WEIGHT_BOLD,
        color: COLORS.ERROR,
        marginBottom: DIMENSIONS.SPACE_SM,
    },
    errorMessage: {
        fontSize: TYPOGRAPHY.SIZE_MD,
        color: COLORS.TEXT_SECONDARY,
        textAlign: 'center',
        marginBottom: DIMENSIONS.SPACE_LG,
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: DIMENSIONS.SPACE_MD,
        marginBottom: DIMENSIONS.SPACE_MD,
    },
    retryButton: {
        backgroundColor: COLORS.PRIMARY,
        paddingHorizontal: DIMENSIONS.SPACE_LG,
        paddingVertical: DIMENSIONS.SPACE_MD,
        borderRadius: DIMENSIONS.RADIUS_SM,
    },
    retryButtonText: {
        color: COLORS.TEXT_PRIMARY,
        fontSize: TYPOGRAPHY.SIZE_MD,
        fontWeight: TYPOGRAPHY.WEIGHT_BOLD,
    },
    listButton: {
        backgroundColor: COLORS.SURFACE,
        paddingHorizontal: DIMENSIONS.SPACE_LG,
        paddingVertical: DIMENSIONS.SPACE_MD,
        borderRadius: DIMENSIONS.RADIUS_SM,
        borderWidth: 1,
        borderColor: COLORS.BORDER_PRIMARY,
    },
    listButtonText: {
        color: COLORS.TEXT_PRIMARY,
        fontSize: TYPOGRAPHY.SIZE_MD,
        fontWeight: TYPOGRAPHY.WEIGHT_MEDIUM,
    },
    helpText: {
        fontSize: TYPOGRAPHY.SIZE_SM,
        color: COLORS.TEXT_TERTIARY,
        textAlign: 'center',
        marginTop: DIMENSIONS.SPACE_SM,
    },
});

export default MapErrorState;
