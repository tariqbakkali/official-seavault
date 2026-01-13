import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { COLORS, DIMENSIONS, TYPOGRAPHY } from '@/constants';
import {
    Anchor,
    Ship,
    Sunset,
    Waves,
    Mountain,
    ArrowDownCircle,
    Tent
} from 'lucide-react-native';

export type DiveTypeEnum = 'Shore' | 'Boat' | 'Wreck' | 'Drift' | 'Cave' | 'Night' | 'Deep' | 'Ice' | 'Altitude';

interface DiveTypeSelectorProps {
    selectedType: string | null;
    onSelect: (type: string) => void;
}

const DIVE_TYPES: { id: DiveTypeEnum; label: string; icon: any }[] = [
    { id: 'Shore', label: 'Shore', icon: Mountain },
    { id: 'Boat', label: 'Boat', icon: Ship },
    { id: 'Wreck', label: 'Wreck', icon: Anchor },
    { id: 'Night', label: 'Night', icon: Sunset },
    { id: 'Drift', label: 'Drift', icon: Waves },
    { id: 'Deep', label: 'Deep', icon: ArrowDownCircle },
    { id: 'Cave', label: 'Cave', icon: Tent },
];

const DiveTypeSelector: React.FC<DiveTypeSelectorProps> = ({ selectedType, onSelect }) => {
    return (
        <View style={styles.container}>
            <Text style={styles.label}>Dive Type</Text>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {DIVE_TYPES.map((type) => {
                    const isSelected = selectedType === type.id;
                    const Icon = type.icon;

                    return (
                        <TouchableOpacity
                            key={type.id}
                            style={[
                                styles.card,
                                isSelected && styles.cardSelected
                            ]}
                            onPress={() => onSelect(type.id)}
                            activeOpacity={0.7}
                        >
                            <View style={[
                                styles.iconContainer,
                                isSelected && styles.iconContainerSelected
                            ]}>
                                <Icon
                                    size={24}
                                    color={isSelected ? '#fff' : COLORS.PRIMARY}
                                />
                            </View>
                            <Text style={[
                                styles.typeLabel,
                                isSelected && styles.typeLabelSelected
                            ]}>
                                {type.label}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>
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
    scrollContent: {
        gap: DIMENSIONS.GAP_MD,
        paddingRight: DIMENSIONS.PADDING_LG, // Ensure last item is reachable
    },
    card: {
        width: 80,
        height: 80,
        backgroundColor: COLORS.SURFACE,
        borderRadius: DIMENSIONS.RADIUS_MD,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        gap: 8,
    },
    cardSelected: {
        backgroundColor: COLORS.PRIMARY,
        borderColor: COLORS.PRIMARY,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(57, 181, 74, 0.1)', // Primary with opacity
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconContainerSelected: {
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    typeLabel: {
        fontSize: TYPOGRAPHY.SIZE_XS,
        color: COLORS.TEXT_SECONDARY,
        fontWeight: '600',
    },
    typeLabelSelected: {
        color: '#fff',
    }
});

export default DiveTypeSelector;
