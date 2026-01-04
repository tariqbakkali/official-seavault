import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, DIMENSIONS, TYPOGRAPHY } from '@/constants';
import { Compass, GraduationCap } from 'lucide-react-native';

interface ModeSelectionProps {
    mode: 'leisure' | 'training';
    onModeChange: (mode: 'leisure' | 'training') => void;
}

const ModeSelection: React.FC<ModeSelectionProps> = ({ mode, onModeChange }) => {
    return (
        <View style={styles.container}>
            <Text style={styles.label}>Dive Mode</Text>
            <View style={styles.selectorContainer}>
                <TouchableOpacity
                    style={[
                        styles.option,
                        mode === 'leisure' && styles.optionSelected,
                    ]}
                    onPress={() => onModeChange('leisure')}
                    activeOpacity={0.8}
                >
                    <Compass
                        size={20}
                        color={mode === 'leisure' ? '#fff' : COLORS.TEXT_SECONDARY}
                    />
                    <Text style={[
                        styles.optionText,
                        mode === 'leisure' && styles.optionTextSelected
                    ]}>
                        Leisure
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[
                        styles.option,
                        mode === 'training' && styles.optionSelected,
                    ]}
                    onPress={() => onModeChange('training')}
                    activeOpacity={0.8}
                >
                    <GraduationCap
                        size={20}
                        color={mode === 'training' ? '#fff' : COLORS.TEXT_SECONDARY}
                    />
                    <Text style={[
                        styles.optionText,
                        mode === 'training' && styles.optionTextSelected
                    ]}>
                        Training
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: DIMENSIONS.MARGIN_XL,
    },
    label: {
        fontSize: TYPOGRAPHY.SIZE_MD,
        color: COLORS.TEXT_SECONDARY,
        marginBottom: DIMENSIONS.MARGIN_SM,
        fontWeight: '600',
    },
    selectorContainer: {
        flexDirection: 'row',
        backgroundColor: COLORS.SURFACE,
        borderRadius: DIMENSIONS.RADIUS_LG,
        padding: 4,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    option: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: DIMENSIONS.PADDING_MD,
        borderRadius: DIMENSIONS.RADIUS_MD,
        gap: 8,
    },
    optionSelected: {
        backgroundColor: COLORS.PRIMARY,
    },
    optionText: {
        fontSize: TYPOGRAPHY.SIZE_MD,
        color: COLORS.TEXT_SECONDARY,
        fontWeight: '600',
    },
    optionTextSelected: {
        color: '#fff',
        fontWeight: 'bold',
    },
});

export default ModeSelection;
