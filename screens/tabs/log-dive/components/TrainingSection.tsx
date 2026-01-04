import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, DIMENSIONS, TYPOGRAPHY } from '@/constants';
import { Check, ChevronDown } from 'lucide-react-native';

interface TrainingSectionProps {
    courseType: string | null;
    completedSkills: Record<string, boolean>;
    onCourseTypeChange: (course: string) => void;
    onSkillToggle: (skill: string) => void;
}

const COURSES = [
    { id: 'open_water', label: 'Open Water Diver' },
    { id: 'advanced_open_water', label: 'Advanced Open Water' },
    // Add more as needed
];

const SKILLS = {
    'open_water': [
        'Regulator Recovery',
        'Mask Clear (Partial)',
        'Mask Clear (Full)',
        'Buoyancy Check',
        'Controlled Emergency Swimming Ascent',
        'Alternate Air Source Ascent',
        'Hovering',
        'Equipment Assembly',
    ],
    'advanced_open_water': [
        'Deep Dive',
        'Navigation Dive',
        'Peak Performance Buoyancy',
        'Night Dive',
        'Wreck Dive (optional)',
        'Search & Recovery (optional)',
    ]
};

const TrainingSection: React.FC<TrainingSectionProps> = ({
    courseType,
    completedSkills,
    onCourseTypeChange,
    onSkillToggle,
}) => {
    const currentSkills = courseType ? (SKILLS as any)[courseType] || [] : [];

    return (
        <View style={styles.container}>
            <Text style={styles.label}>Training Details</Text>

            {/* Course Selection */}
            <View style={styles.courseContainer}>
                <Text style={styles.subLabel}>Course</Text>
                <View style={styles.courseOptions}>
                    {COURSES.map(course => (
                        <TouchableOpacity
                            key={course.id}
                            style={[
                                styles.courseCard,
                                courseType === course.id && styles.courseCardSelected
                            ]}
                            onPress={() => onCourseTypeChange(course.id)}
                        >
                            <Text style={[
                                styles.courseText,
                                courseType === course.id && styles.courseTextSelected
                            ]}>{course.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Skills Selection */}
            {courseType && currentSkills.length > 0 && (
                <View style={styles.skillsContainer}>
                    <Text style={styles.subLabel}>Skills Completed</Text>
                    <View style={styles.skillsGrid}>
                        {currentSkills.map((skill: string) => {
                            const isSelected = !!completedSkills[skill];
                            return (
                                <TouchableOpacity
                                    key={skill}
                                    style={[
                                        styles.skillItem,
                                        isSelected && styles.skillItemSelected
                                    ]}
                                    onPress={() => onSkillToggle(skill)}
                                >
                                    <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                                        {isSelected && <Check size={12} color="#fff" />}
                                    </View>
                                    <Text style={[styles.skillText, isSelected && styles.skillTextSelected]}>
                                        {skill}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>
            )}
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
        marginBottom: DIMENSIONS.MARGIN_MD,
        fontWeight: '600',
    },
    subLabel: {
        fontSize: TYPOGRAPHY.SIZE_SM,
        color: COLORS.TEXT_TERTIARY,
        marginBottom: DIMENSIONS.MARGIN_SM,
    },
    courseContainer: {
        marginBottom: DIMENSIONS.MARGIN_LG,
    },
    courseOptions: {
        gap: DIMENSIONS.GAP_SM,
    },
    courseCard: {
        backgroundColor: COLORS.SURFACE,
        padding: DIMENSIONS.PADDING_MD,
        borderRadius: DIMENSIONS.RADIUS_MD,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    courseCardSelected: {
        borderColor: COLORS.PRIMARY,
        backgroundColor: 'rgba(57, 181, 74, 0.1)', // Primary with opacity
    },
    courseText: {
        color: COLORS.TEXT_PRIMARY,
        fontSize: TYPOGRAPHY.SIZE_MD,
    },
    courseTextSelected: {
        color: COLORS.PRIMARY,
        fontWeight: 'bold',
    },
    skillsContainer: {
        gap: DIMENSIONS.GAP_SM,
    },
    skillsGrid: {
        gap: DIMENSIONS.GAP_SM,
    },
    skillItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.SURFACE,
        padding: DIMENSIONS.PADDING_MD,
        borderRadius: DIMENSIONS.RADIUS_MD,
        gap: DIMENSIONS.GAP_MD,
    },
    skillItemSelected: {
        backgroundColor: '#2A2A2A',
    },
    checkbox: {
        width: 20,
        height: 20,
        borderRadius: 4,
        borderWidth: 2,
        borderColor: COLORS.TEXT_SECONDARY,
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkboxSelected: {
        borderColor: COLORS.PRIMARY,
        backgroundColor: COLORS.PRIMARY,
    },
    skillText: {
        color: COLORS.TEXT_SECONDARY,
        fontSize: TYPOGRAPHY.SIZE_MD,
    },
    skillTextSelected: {
        color: COLORS.TEXT_PRIMARY,
    }
});

export default TrainingSection;
