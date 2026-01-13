import { Search, User, ChevronRight } from 'lucide-react-native';
import React, { useMemo, useCallback, useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    TextInput,
    FlatList,
    ActivityIndicator,
    Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import ScreenHeader from '@/components/ui/ScreenHeader';
import { COLORS, DIMENSIONS, TYPOGRAPHY } from '@/constants';
import { setTempInstructor } from '@/stores/tempSelectionStore';
import { instructors$ } from '@/stores/syncedObservables';
import { observer } from '@legendapp/state/react';

type Instructor = {
    id: string;
    name: string | null;
    user_id: string | null;
    created_at: string;
};

const InstructorPickerScreen = observer(() => {
    const [searchQuery, setSearchQuery] = useState('');
    const insets = useSafeAreaInsets();

    // Get instructors from local store directly
    const instructorsMap = instructors$.get();
    const allInstructors = useMemo(() => Object.values(instructorsMap || {}) as Instructor[], [instructorsMap]);

    // Filter based on search query
    const filteredInstructors = useMemo(() => {
        if (!searchQuery.trim()) return allInstructors;
        const lowerQuery = searchQuery.toLowerCase();
        return allInstructors.filter(inst =>
            inst.name?.toLowerCase().includes(lowerQuery)
        );
    }, [allInstructors, searchQuery]);

    const handleSelect = (instructor: Instructor) => {
        setTempInstructor(instructor.id, instructor.name || 'Unnamed Instructor');
        router.back();
    };

    const renderItem = useCallback(({ item }: { item: Instructor }) => {
        return (
            <TouchableOpacity
                style={styles.item}
                onPress={() => handleSelect(item)}
                activeOpacity={0.7}
            >
                <View style={styles.itemLeft}>
                    <View style={styles.avatarContainer}>
                        <User size={20} color={COLORS.TEXT_TERTIARY} />
                    </View>
                    <View style={styles.info}>
                        <Text style={styles.name}>{item.name || 'Unnamed Instructor'}</Text>
                    </View>
                </View>
                <ChevronRight size={20} color={COLORS.TEXT_TERTIARY} />
            </TouchableOpacity>
        );
    }, []);

    return (
        <View
            style={[
                styles.container,
                {
                    paddingBottom: insets.bottom,
                    paddingLeft: insets.left,
                    paddingTop: insets.top,
                    paddingRight: insets.right,
                },
            ]}
        >
            <ScreenHeader
                title="Select Instructor"
                onBackPress={() => router.back()}
                showBackButton={true}
            />

            <View style={styles.content}>
                <View style={styles.searchContainer}>
                    <View style={styles.searchWrapper}>
                        <Search size={20} color={COLORS.TEXT_TERTIARY} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search instructors..."
                            placeholderTextColor={COLORS.TEXT_TERTIARY}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            autoCapitalize="none"
                            autoCorrect={false}
                            autoFocus={false}
                        />
                    </View>
                </View>

                <FlatList
                    data={filteredInstructors}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                    keyboardShouldPersistTaps="handled"
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyText}>
                                {searchQuery ? 'No instructors match your search' : 'No instructors found'}
                            </Text>
                            <Text style={styles.emptySubtext}>
                                {searchQuery ? 'Try a different name' : 'Your instructor list is empty'}
                            </Text>
                        </View>
                    }
                />
            </View>
        </View>
    );
});

export default InstructorPickerScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.BACKGROUND,
    },
    content: {
        flex: 1,
        paddingTop: DIMENSIONS.SPACE_MD,
    },
    searchContainer: {
        paddingHorizontal: DIMENSIONS.PADDING_HORIZONTAL,
        marginBottom: DIMENSIONS.SPACE_MD,
    },
    searchWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.SURFACE,
        borderRadius: DIMENSIONS.RADIUS_LG,
        paddingHorizontal: DIMENSIONS.SPACE_LG,
        height: 48,
        borderWidth: 1,
        borderColor: COLORS.BORDER_PRIMARY,
        gap: DIMENSIONS.SPACE_SM,
    },
    searchInput: {
        flex: 1,
        fontSize: TYPOGRAPHY.SIZE_MD,
        color: COLORS.TEXT_PRIMARY,
        height: '100%',
    },
    listContent: {
        paddingHorizontal: DIMENSIONS.PADDING_HORIZONTAL,
        paddingBottom: DIMENSIONS.SPACE_LG,
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: COLORS.SURFACE,
        borderRadius: DIMENSIONS.RADIUS_MD,
        padding: DIMENSIONS.SPACE_MD,
        marginBottom: DIMENSIONS.SPACE_SM,
        borderWidth: 1,
        borderColor: COLORS.BORDER_SECONDARY,
    },
    itemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: DIMENSIONS.SPACE_MD,
    },
    avatarContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: COLORS.BACKGROUND,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: COLORS.BORDER_SECONDARY,
    },
    info: {

    },
    name: {
        fontSize: TYPOGRAPHY.SIZE_MD,
        fontWeight: '500',
        color: COLORS.TEXT_PRIMARY,
    },
    emptyState: {
        alignItems: 'center',
        padding: DIMENSIONS.SPACE_XL,
        marginTop: DIMENSIONS.SPACE_XL,
    },
    emptyText: {
        color: COLORS.TEXT_SECONDARY,
        fontSize: TYPOGRAPHY.SIZE_MD,
        fontWeight: '500',
        marginBottom: DIMENSIONS.SPACE_XS,
    },
    emptySubtext: {
        color: COLORS.TEXT_TERTIARY,
        fontSize: TYPOGRAPHY.SIZE_SM,
    },
});
