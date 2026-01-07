import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, LayoutAnimation, Platform, UIManager } from 'react-native';
import { ChevronDown, ChevronUp, Clock, Cloud, Eye, Waves, MapPin } from 'lucide-react-native';
import { COLORS, DIMENSIONS, TYPOGRAPHY } from '@/constants';

if (
    Platform.OS === 'android' &&
    UIManager.setLayoutAnimationEnabledExperimental
) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface DiveConditionsSectionProps {
    duration: string;
    weather: string | null;
    visibility: string | null;
    current: string | null;
    waterway: string | null;
    onDurationChange: (duration: string) => void;
    onWeatherChange: (weather: string) => void;
    onVisibilityChange: (visibility: string) => void;
    onCurrentChange: (current: string) => void;
    onWaterwayChange: (waterway: string) => void;
}

const WATERWAY_OPTIONS = [
    { label: 'Ocean/Sea', value: 'ocean' },
    { label: 'Lake/River/Quarry', value: 'lake' },
    { label: 'Pool', value: 'pool' },
    { label: 'Cave/Cenote', value: 'cave' }
];

const WEATHER_OPTIONS = ['Sunny', 'Partly Cloudy', 'Cloudy', 'Rainy', 'Windy', 'Foggy'];
const VISIBILITY_OPTIONS = ['High', 'Average', 'Low'];
const CURRENT_OPTIONS = ['None', 'Light', 'Medium', 'Strong'];

export default function DiveConditionsSection({
    duration,
    weather,
    visibility,
    current,
    waterway,
    onDurationChange,
    onWeatherChange,
    onVisibilityChange,
    onCurrentChange,
    onWaterwayChange
}: DiveConditionsSectionProps) {
    const renderChips = (options: any[], selected: string | null, onSelect: (val: string) => void) => (
        <View style={styles.chipContainer}>
            {options.map((option) => {
                const label = typeof option === 'string' ? option : option.label;
                const value = typeof option === 'string' ? option : option.value;
                const isSelected = selected === value;

                return (
                    <TouchableOpacity
                        key={value}
                        style={[
                            styles.chip,
                            isSelected && styles.chipSelected
                        ]}
                        onPress={() => onSelect(value)}
                    >
                        <Text style={[
                            styles.chipText,
                            isSelected && styles.chipTextSelected
                        ]}>
                            {label}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );

    return (
        <View style={styles.container}>
            {/* Duration Field (Visible) */}
            <View style={styles.inputGroup}>
                <View style={styles.labelRow}>
                    <Clock size={16} color={COLORS.TEXT_SECONDARY} />
                    <Text style={styles.label}>Duration (minutes)</Text>
                </View>
                <TextInput
                    style={styles.input}
                    value={duration}
                    onChangeText={onDurationChange}
                    placeholder="e.g. 45"
                    placeholderTextColor={COLORS.TEXT_TERTIARY}
                    keyboardType="numeric"
                    returnKeyType="done"
                />
            </View>

            <View style={styles.divider} />
            <Text style={styles.headerTitle}>Additional Details</Text>

            {/* Content (Now Always Visible) */}
            <View style={styles.content}>
                {/* Waterway */}
                <View style={styles.section}>
                    <View style={styles.labelRow}>
                        <MapPin size={16} color={COLORS.TEXT_SECONDARY} />
                        <Text style={styles.sectionLabel}>Waterway</Text>
                    </View>
                    {renderChips(WATERWAY_OPTIONS, waterway, onWaterwayChange)}
                </View>

                {/* Weather */}
                <View style={styles.section}>
                    <View style={styles.labelRow}>
                        <Cloud size={16} color={COLORS.TEXT_SECONDARY} />
                        <Text style={styles.sectionLabel}>Weather</Text>
                    </View>
                    {renderChips(WEATHER_OPTIONS, weather, onWeatherChange)}
                </View>

                {/* Visibility */}
                <View style={styles.section}>
                    <View style={styles.labelRow}>
                        <Eye size={16} color={COLORS.TEXT_SECONDARY} />
                        <Text style={styles.sectionLabel}>Visibility</Text>
                    </View>
                    {renderChips(VISIBILITY_OPTIONS, visibility, onVisibilityChange)}
                </View>

                {/* Current */}
                <View style={styles.section}>
                    <View style={styles.labelRow}>
                        <Waves size={16} color={COLORS.TEXT_SECONDARY} />
                        <Text style={styles.sectionLabel}>Current</Text>
                    </View>
                    {renderChips(CURRENT_OPTIONS, current, onCurrentChange)}
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#1E1E1E', // Darker surface
        borderRadius: DIMENSIONS.RADIUS_LG,
        padding: DIMENSIONS.PADDING_MD,
        marginBottom: DIMENSIONS.MARGIN_MD,
    },
    inputGroup: {
        marginBottom: DIMENSIONS.MARGIN_LG,
    },
    labelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: DIMENSIONS.MARGIN_XS,
        gap: DIMENSIONS.GAP_XS,
    },
    label: {
        fontSize: TYPOGRAPHY.SIZE_SM,
        color: COLORS.TEXT_SECONDARY,
        fontWeight: '600',
    },
    input: {
        backgroundColor: COLORS.BACKGROUND,
        borderRadius: DIMENSIONS.RADIUS_MD,
        padding: DIMENSIONS.PADDING_MD,
        color: COLORS.TEXT_PRIMARY,
        fontSize: TYPOGRAPHY.SIZE_MD,
        borderWidth: 1,
        borderColor: '#333',
    },
    divider: {
        height: 1,
        backgroundColor: '#333',
        marginVertical: DIMENSIONS.MARGIN_MD,
    },
    headerTitle: {
        fontSize: TYPOGRAPHY.SIZE_MD,
        color: COLORS.TEXT_SECONDARY,
        fontWeight: '600',
        marginBottom: DIMENSIONS.MARGIN_MD,
    },
    content: {
        // No specific styles needed for open content container anymore
    },
    section: {
        marginBottom: DIMENSIONS.MARGIN_LG,
    },
    sectionLabel: {
        fontSize: TYPOGRAPHY.SIZE_SM,
        color: COLORS.TEXT_SECONDARY,
        marginBottom: DIMENSIONS.MARGIN_XS,
    },
    chipContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: DIMENSIONS.GAP_XS,
    },
    chip: {
        backgroundColor: '#333',
        paddingHorizontal: DIMENSIONS.PADDING_MD,
        paddingVertical: DIMENSIONS.PADDING_XS,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    chipSelected: {
        backgroundColor: 'rgba(0, 122, 255, 0.2)',
        borderColor: '#007AFF',
    },
    chipText: {
        color: '#ccc',
        fontSize: TYPOGRAPHY.SIZE_SM,
    },
    chipTextSelected: {
        color: '#007AFF',
        fontWeight: '600',
    },
});
