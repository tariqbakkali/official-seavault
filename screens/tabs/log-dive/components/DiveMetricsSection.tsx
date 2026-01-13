import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Switch, TouchableOpacity, Platform, Modal } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { COLORS, DIMENSIONS, TYPOGRAPHY } from '@/constants';
import { Clock, Gauge, Ruler } from 'lucide-react-native';
// Reusing same styles/imports as other sections for consistency

interface DiveMetricsSectionProps {
    timeIn: string;
    timeOut: string;
    airIn: string;
    airOut: string;
    airUnit: 'bar' | 'psi';
    onTimeInChange: (value: string) => void;
    onTimeOutChange: (value: string) => void;
    onAirInChange: (value: string) => void;
    onAirOutChange: (value: string) => void;
    onAirUnitChange: (unit: 'bar' | 'psi') => void;
    depth: string;
    onDepthChange: (value: string) => void;
    depthUnit: 'meters' | 'feet';
    onDepthUnitChange: (unit: 'meters' | 'feet') => void;
}

const DiveMetricsSection: React.FC<DiveMetricsSectionProps> = ({
    timeIn,
    timeOut,
    airIn,
    airOut,
    airUnit,
    onTimeInChange,
    onTimeOutChange,
    onAirInChange,
    onAirOutChange,
    onAirUnitChange,
    depth,
    onDepthChange,
    depthUnit,
    onDepthUnitChange,
}) => {
    const [showTimeInPicker, setShowTimeInPicker] = useState(false);
    const [showTimeOutPicker, setShowTimeOutPicker] = useState(false);

    // Helper to convert time string (HH:MM) to Date object
    const timeStringToDate = (timeStr: string): Date => {
        const now = new Date();
        if (timeStr && timeStr.includes(':')) {
            const [hours, minutes] = timeStr.split(':').map(Number);
            if (!isNaN(hours) && !isNaN(minutes)) {
                now.setHours(hours, minutes, 0, 0);
                return now;
            }
        }
        // Return current time if no valid time string
        return now;
    };

    // Helper to format Date to HH:MM string in 24-hour format
    const formatTime = (date: Date): string => {
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
    };

    // Handle time in picker open - close time out picker if open
    const handleTimeInPress = () => {
        setShowTimeOutPicker(false);
        setShowTimeInPicker(true);
    };

    // Handle time out picker open - close time in picker if open
    const handleTimeOutPress = () => {
        setShowTimeInPicker(false);
        setShowTimeOutPicker(true);
    };

    return (
        <View style={styles.container}>
            {/* Time Section - Side by Side */}
            <View style={styles.row}>
                <View style={styles.halfInput}>
                    <Text style={styles.label}>Time In</Text>
                    <TouchableOpacity
                        style={styles.inputWrapper}
                        onPress={handleTimeInPress}
                        activeOpacity={0.7}
                    >
                        <Clock size={18} color={COLORS.PRIMARY} />
                        <Text style={[styles.input, styles.timeText, !timeIn && styles.placeholderText]}>
                            {timeIn || 'HH:MM'}
                        </Text>
                    </TouchableOpacity>
                    {showTimeInPicker && (
                        <Modal
                            transparent={true}
                            animationType="fade"
                            visible={showTimeInPicker}
                            onRequestClose={() => setShowTimeInPicker(false)}
                        >
                            <TouchableOpacity
                                style={styles.modalOverlay}
                                activeOpacity={1}
                                onPress={() => setShowTimeInPicker(false)}
                            >
                                <View style={styles.pickerContainer}>
                                    <View style={styles.pickerHeader}>
                                        <Text style={styles.pickerTitle}>Select Time In</Text>
                                        <TouchableOpacity onPress={() => setShowTimeInPicker(false)}>
                                            <Text style={styles.doneButton}>Done</Text>
                                        </TouchableOpacity>
                                    </View>
                                    <DateTimePicker
                                        value={timeStringToDate(timeIn)}
                                        mode="time"
                                        is24Hour={false}
                                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                        onChange={(event, selectedDate) => {
                                            if (event.type === 'set' && selectedDate) {
                                                onTimeInChange(formatTime(selectedDate));
                                            }
                                            if (Platform.OS === 'android') {
                                                setShowTimeInPicker(false);
                                            }
                                        }}
                                        style={styles.dateTimePicker}
                                    />
                                </View>
                            </TouchableOpacity>
                        </Modal>
                    )}
                </View>
                <View style={styles.halfInput}>
                    <Text style={styles.label}>Time Out</Text>
                    <TouchableOpacity
                        style={styles.inputWrapper}
                        onPress={handleTimeOutPress}
                        activeOpacity={0.7}
                    >
                        <Clock size={18} color={COLORS.PRIMARY} />
                        <Text style={[styles.input, styles.timeText, !timeOut && styles.placeholderText]}>
                            {timeOut || 'HH:MM'}
                        </Text>
                    </TouchableOpacity>
                    {showTimeOutPicker && (
                        <Modal
                            transparent={true}
                            animationType="fade"
                            visible={showTimeOutPicker}
                            onRequestClose={() => setShowTimeOutPicker(false)}
                        >
                            <TouchableOpacity
                                style={styles.modalOverlay}
                                activeOpacity={1}
                                onPress={() => setShowTimeOutPicker(false)}
                            >
                                <View style={styles.pickerContainer}>
                                    <View style={styles.pickerHeader}>
                                        <Text style={styles.pickerTitle}>Select Time Out</Text>
                                        <TouchableOpacity onPress={() => setShowTimeOutPicker(false)}>
                                            <Text style={styles.doneButton}>Done</Text>
                                        </TouchableOpacity>
                                    </View>
                                    <DateTimePicker
                                        value={timeStringToDate(timeOut)}
                                        mode="time"
                                        is24Hour={false}
                                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                        onChange={(event, selectedDate) => {
                                            if (event.type === 'set' && selectedDate) {
                                                onTimeOutChange(formatTime(selectedDate));
                                            }
                                            if (Platform.OS === 'android') {
                                                setShowTimeOutPicker(false);
                                            }
                                        }}
                                        style={styles.dateTimePicker}
                                    />
                                </View>
                            </TouchableOpacity>
                        </Modal>
                    )}
                </View>
            </View>

            {/* Depth Section - Prominent */}
            <View style={styles.sectionBlock}>
                <View style={styles.unitHeader}>
                    <Text style={styles.label}>Max Depth</Text>
                    <View style={styles.unitToggle}>
                        <TouchableOpacity
                            style={[styles.unitBtn, depthUnit === 'meters' && styles.unitBtnActive]}
                            onPress={() => onDepthUnitChange('meters')}
                            activeOpacity={0.8}
                        >
                            <Text style={[styles.unitText, depthUnit === 'meters' && styles.unitTextActive]}>M</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.unitBtn, depthUnit === 'feet' && styles.unitBtnActive]}
                            onPress={() => onDepthUnitChange('feet')}
                            activeOpacity={0.8}
                        >
                            <Text style={[styles.unitText, depthUnit === 'feet' && styles.unitTextActive]}>FT</Text>
                        </TouchableOpacity>
                    </View>
                </View>
                <View style={[styles.inputWrapper, styles.prominentInput]}>
                    <Ruler size={20} color={COLORS.PRIMARY} />
                    <TextInput
                        style={[styles.input, styles.prominentText]}
                        value={depth}
                        onChangeText={onDepthChange}
                        placeholder={depthUnit === 'meters' ? "0.0" : "0"}
                        placeholderTextColor={COLORS.TEXT_TERTIARY}
                        keyboardType="numeric"
                        selectionColor={COLORS.PRIMARY}
                    />
                    <Text style={styles.unitSuffix}>{depthUnit}</Text>
                </View>
            </View>

            {/* Air Consumption Section */}
            <View style={styles.sectionBlock}>
                <View style={styles.unitHeader}>
                    <Text style={styles.label}>Air Consumption <Text style={{ fontWeight: '400', fontSize: 12, color: COLORS.TEXT_TERTIARY }}>(Optional)</Text></Text>
                    <View style={styles.unitToggle}>
                        <TouchableOpacity
                            style={[styles.unitBtn, airUnit === 'bar' && styles.unitBtnActive]}
                            onPress={() => onAirUnitChange('bar')}
                            activeOpacity={0.8}
                        >
                            <Text style={[styles.unitText, airUnit === 'bar' && styles.unitTextActive]}>BAR</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.unitBtn, airUnit === 'psi' && styles.unitBtnActive]}
                            onPress={() => onAirUnitChange('psi')}
                            activeOpacity={0.8}
                        >
                            <Text style={[styles.unitText, airUnit === 'psi' && styles.unitTextActive]}>PSI</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.row}>
                    <View style={styles.halfInput}>
                        <Text style={styles.subLabel}>Start</Text>
                        <View style={styles.inputWrapper}>
                            <Gauge size={18} color={COLORS.PRIMARY} />
                            <TextInput
                                style={styles.input}
                                value={airIn}
                                onChangeText={onAirInChange}
                                placeholder={airUnit === 'bar' ? '200' : '3000'}
                                placeholderTextColor={COLORS.TEXT_TERTIARY}
                                keyboardType="numeric"
                                selectionColor={COLORS.PRIMARY}
                            />
                            <Text style={styles.unitSuffix}>{airUnit.toUpperCase()}</Text>
                        </View>
                    </View>
                    <View style={styles.halfInput}>
                        <Text style={styles.subLabel}>End</Text>
                        <View style={styles.inputWrapper}>
                            <Gauge size={18} color={COLORS.PRIMARY} />
                            <TextInput
                                style={styles.input}
                                value={airOut}
                                onChangeText={onAirOutChange}
                                placeholder={airUnit === 'bar' ? '50' : '500'}
                                placeholderTextColor={COLORS.TEXT_TERTIARY}
                                keyboardType="numeric"
                                selectionColor={COLORS.PRIMARY}
                            />
                            <Text style={styles.unitSuffix}>{airUnit.toUpperCase()}</Text>
                        </View>
                    </View>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        // marginBottom: DIMENSIONS.MARGIN_LG,
    },
    row: {
        flexDirection: 'row',
        gap: DIMENSIONS.GAP_MD,
        marginBottom: DIMENSIONS.MARGIN_LG
    },
    halfInput: {
        flex: 1,
    },
    sectionBlock: {
        marginBottom: DIMENSIONS.MARGIN_LG,
    },
    label: {
        fontSize: TYPOGRAPHY.SIZE_MD,
        color: COLORS.TEXT_SECONDARY,
        marginBottom: DIMENSIONS.MARGIN_SM,
        fontWeight: '600',
    },
    subLabel: {
        fontSize: TYPOGRAPHY.SIZE_XS,
        color: COLORS.TEXT_TERTIARY,
        marginBottom: 2,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.SURFACE,
        borderRadius: DIMENSIONS.RADIUS_MD,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        paddingHorizontal: DIMENSIONS.PADDING_MD,
        gap: DIMENSIONS.GAP_SM,
        height: DIMENSIONS.BUTTON_HEIGHT_MD,
    },
    prominentInput: {
        height: 56,
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderColor: 'rgba(255,255,255,0.15)',
    },
    input: {
        flex: 1,
        color: COLORS.TEXT_PRIMARY,
        fontSize: TYPOGRAPHY.SIZE_MD,
        height: '100%',
    },
    timeText: {
        paddingVertical: 12,
        color: COLORS.TEXT_PRIMARY,
    },
    placeholderText: {
        color: COLORS.TEXT_TERTIARY,
    },
    prominentText: {
        fontSize: TYPOGRAPHY.SIZE_LG,
        fontWeight: 'bold',
        color: COLORS.TEXT_PRIMARY,
    },
    unitSuffix: {
        color: COLORS.TEXT_TERTIARY,
        fontSize: TYPOGRAPHY.SIZE_SM,
        fontWeight: '500',
    },
    unitHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: DIMENSIONS.MARGIN_SM,
    },
    unitToggle: {
        flexDirection: 'row',
        backgroundColor: COLORS.SURFACE,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        overflow: 'hidden',
    },
    unitBtn: {
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    unitBtnActive: {
        backgroundColor: COLORS.PRIMARY,
    },
    unitText: {
        fontSize: 12,
        color: COLORS.TEXT_SECONDARY,
        fontWeight: '600',
    },
    unitTextActive: {
        color: '#fff',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    pickerContainer: {
        backgroundColor: COLORS.SURFACE,
        borderRadius: DIMENSIONS.RADIUS_LG,
        padding: DIMENSIONS.PADDING_LG,
        width: '90%',
        maxWidth: 400,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    pickerHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: DIMENSIONS.MARGIN_MD,
        paddingBottom: DIMENSIONS.PADDING_SM,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    },
    pickerTitle: {
        fontSize: TYPOGRAPHY.SIZE_LG,
        fontWeight: '600',
        color: COLORS.TEXT_PRIMARY,
    },
    doneButton: {
        fontSize: TYPOGRAPHY.SIZE_MD,
        fontWeight: '600',
        color: COLORS.PRIMARY,
    },
    dateTimePicker: {
        width: '100%',
        backgroundColor: 'transparent',
    },
});

export default DiveMetricsSection;
