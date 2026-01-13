import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { User, X, ChevronRight, Search } from 'lucide-react-native';
import { router } from 'expo-router';
import { COLORS, DIMENSIONS, TYPOGRAPHY } from '@/constants';

interface InstructorPickerProps {
    instructorName: string | null;
    onClear: () => void;
}

const InstructorPicker: React.FC<InstructorPickerProps> = ({ instructorName, onClear }) => {
    const handlePress = () => {
        router.push('/modal/instructor-picker');
    };

    return (
        <View style={styles.container}>
            <Text style={styles.label}>Instructor</Text>

            <TouchableOpacity
                style={styles.selector}
                onPress={handlePress}
                activeOpacity={0.7}
            >
                {instructorName ? (
                    <View style={styles.content}>
                        <View style={styles.leftContent}>
                            <View style={styles.iconContainer}>
                                <User size={20} color={COLORS.PRIMARY} />
                            </View>
                            <Text style={styles.valueText}>{instructorName}</Text>
                        </View>
                        <TouchableOpacity onPress={onClear} style={styles.clearButton}>
                            <X size={16} color={COLORS.TEXT_TERTIARY} />
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.content}>
                        <View style={styles.leftContent}>
                            <View style={[styles.iconContainer, styles.placeholderIcon]}>
                                <Search size={18} color={COLORS.TEXT_TERTIARY} />
                            </View>
                            <Text style={styles.placeholderText}>Select Instructor</Text>
                        </View>
                        <ChevronRight size={20} color={COLORS.TEXT_TERTIARY} />
                    </View>
                )}
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: DIMENSIONS.SPACE_LG,
    },
    label: {
        fontSize: TYPOGRAPHY.SIZE_SM,
        fontWeight: '600',
        color: COLORS.TEXT_SECONDARY,
        marginBottom: DIMENSIONS.SPACE_XS,
        marginLeft: DIMENSIONS.SPACE_XS,
    },
    selector: {
        borderWidth: 1,
        borderColor: COLORS.BORDER_PRIMARY,
        borderRadius: DIMENSIONS.RADIUS_MD,
        padding: DIMENSIONS.SPACE_MD,
        backgroundColor: COLORS.SURFACE,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    leftContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: DIMENSIONS.SPACE_SM,
        flex: 1,
    },
    iconContainer: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: COLORS.SURFACE_SECONDARY,
        alignItems: 'center',
        justifyContent: 'center',
    },
    placeholderIcon: {
        backgroundColor: 'transparent',
    },
    valueText: {
        fontSize: TYPOGRAPHY.SIZE_MD,
        color: COLORS.TEXT_PRIMARY,
        fontWeight: '500',
    },
    placeholderText: {
        fontSize: TYPOGRAPHY.SIZE_MD,
        color: COLORS.TEXT_TERTIARY,
    },
    clearButton: {
        padding: 4,
    }
});

export default InstructorPicker;
