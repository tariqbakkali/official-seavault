import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Modal,
    Alert,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { X, Camera, Calendar } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { CertificationAgency, CertificationInput, getAgencyInfo, addCertification, uploadCardImage } from '@/services/certificationService';
import { TYPOGRAPHY, DIMENSIONS } from '@/constants';
import { supabase } from '@/services/supabase';

interface CertificationUploadModalProps {
    visible: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const AGENCIES: CertificationAgency[] = ['PADI', 'SSI', 'NAUI', 'SDI', 'BSAC', 'CMAS', 'Other'];

const CertificationUploadModal: React.FC<CertificationUploadModalProps> = ({
    visible,
    onClose,
    onSuccess,
}) => {
    const [selectedAgency, setSelectedAgency] = useState<CertificationAgency>('PADI');
    const [level, setLevel] = useState('');
    const [certNumber, setCertNumber] = useState('');
    const [issuedAt, setIssuedAt] = useState<Date | null>(null);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [frontImage, setFrontImage] = useState<string | null>(null);
    const [backImage, setBackImage] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const resetForm = () => {
        setSelectedAgency('PADI');
        setLevel('');
        setCertNumber('');
        setIssuedAt(null);
        setFrontImage(null);
        setBackImage(null);
    };

    const pickImage = async (side: 'front' | 'back') => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Required', 'Please grant permission to access your photos.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: 'images',
            allowsEditing: true,
            aspect: [1.58, 1], // Credit card ratio
            quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
            if (side === 'front') {
                setFrontImage(result.assets[0].uri);
            } else {
                setBackImage(result.assets[0].uri);
            }
        }
    };

    const handleSubmit = async () => {
        if (!level.trim()) {
            Alert.alert('Required', 'Please enter your certification level.');
            return;
        }

        setIsSubmitting(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            // Create the certification record
            const certInput: CertificationInput = {
                agency: selectedAgency,
                level: level.trim(),
                certification_number: certNumber.trim() || undefined,
                issued_at: issuedAt?.toISOString().split('T')[0],
            };

            const newCert = await addCertification(user.id, certInput);

            // Upload images if provided
            if (frontImage) {
                await uploadCardImage(user.id, newCert.id, 'front', frontImage);
            }
            if (backImage) {
                await uploadCardImage(user.id, newCert.id, 'back', backImage);
            }

            resetForm();
            onSuccess();
            onClose();
        } catch (error: any) {
            console.error('Error adding certification:', error);
            Alert.alert('Error', error.message || 'Failed to add certification.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.overlay}
            >
                <View style={styles.modalContainer}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>Add Certification</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <X size={24} color="#fff" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                        {/* Agency Selector */}
                        <Text style={styles.label}>Certification Agency</Text>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            style={styles.agencySelector}
                        >
                            {AGENCIES.map((agency) => {
                                const info = getAgencyInfo(agency);
                                const isSelected = selectedAgency === agency;
                                return (
                                    <TouchableOpacity
                                        key={agency}
                                        style={[
                                            styles.agencyChip,
                                            { borderColor: info.color },
                                            isSelected && { backgroundColor: info.color },
                                        ]}
                                        onPress={() => setSelectedAgency(agency)}
                                    >
                                        <Text
                                            style={[
                                                styles.agencyChipText,
                                                isSelected && styles.agencyChipTextSelected,
                                            ]}
                                        >
                                            {info.name}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>

                        {/* Level Input */}
                        <Text style={styles.label}>Certification Level</Text>
                        <TextInput
                            style={styles.input}
                            value={level}
                            onChangeText={setLevel}
                            placeholder="e.g., Open Water, Advanced, Rescue Diver"
                            placeholderTextColor="#666"
                        />

                        {/* Cert Number Input */}
                        <Text style={styles.label}>Certification Number (Optional)</Text>
                        <TextInput
                            style={styles.input}
                            value={certNumber}
                            onChangeText={setCertNumber}
                            placeholder="Your card number"
                            placeholderTextColor="#666"
                        />

                        {/* Issue Date */}
                        <Text style={styles.label}>Issue Date (Optional)</Text>
                        <TouchableOpacity
                            style={styles.dateButton}
                            onPress={() => setShowDatePicker(true)}
                        >
                            <Calendar size={20} color="#666" />
                            <Text style={styles.dateText}>
                                {issuedAt ? issuedAt.toLocaleDateString() : 'Select date'}
                            </Text>
                        </TouchableOpacity>

                        {showDatePicker && (
                            <DateTimePicker
                                value={issuedAt || new Date()}
                                mode="date"
                                display="spinner"
                                onChange={(event, date) => {
                                    setShowDatePicker(false);
                                    if (date) setIssuedAt(date);
                                }}
                                maximumDate={new Date()}
                            />
                        )}

                        {/* Card Images */}
                        <Text style={styles.label}>Card Images (Optional)</Text>
                        <View style={styles.imageButtons}>
                            <TouchableOpacity
                                style={[styles.imageButton, frontImage && styles.imageButtonActive]}
                                onPress={() => pickImage('front')}
                            >
                                <Camera size={24} color={frontImage ? '#4CAF50' : '#666'} />
                                <Text style={[styles.imageButtonText, frontImage && styles.imageButtonTextActive]}>
                                    {frontImage ? 'Front ✓' : 'Front'}
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.imageButton, backImage && styles.imageButtonActive]}
                                onPress={() => pickImage('back')}
                            >
                                <Camera size={24} color={backImage ? '#4CAF50' : '#666'} />
                                <Text style={[styles.imageButtonText, backImage && styles.imageButtonTextActive]}>
                                    {backImage ? 'Back ✓' : 'Back'}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* Submit Button */}
                        <TouchableOpacity
                            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
                            onPress={handleSubmit}
                            disabled={isSubmitting}
                        >
                            <Text style={styles.submitButtonText}>
                                {isSubmitting ? 'Adding...' : 'Add Certification'}
                            </Text>
                        </TouchableOpacity>
                    </ScrollView>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        backgroundColor: '#1a1a1a',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '90%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: DIMENSIONS.PADDING_LG,
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    headerTitle: {
        fontSize: TYPOGRAPHY.SIZE_XXL,
        fontWeight: 'bold',
        color: '#fff',
    },
    closeButton: {
        padding: DIMENSIONS.PADDING_SM,
    },
    content: {
        padding: DIMENSIONS.PADDING_LG,
    },
    label: {
        fontSize: TYPOGRAPHY.SIZE_MD,
        fontWeight: '600',
        color: '#999',
        marginBottom: DIMENSIONS.MARGIN_SM,
        marginTop: DIMENSIONS.MARGIN_LG,
    },
    input: {
        backgroundColor: '#2a2a2a',
        borderRadius: 12,
        padding: DIMENSIONS.PADDING_LG,
        fontSize: TYPOGRAPHY.SIZE_LG,
        color: '#fff',
        borderWidth: 1,
        borderColor: '#333',
    },
    agencySelector: {
        flexDirection: 'row',
    },
    agencyChip: {
        paddingHorizontal: DIMENSIONS.PADDING_LG,
        paddingVertical: DIMENSIONS.PADDING_MD,
        borderRadius: 20,
        borderWidth: 2,
        marginRight: DIMENSIONS.MARGIN_SM,
    },
    agencyChipText: {
        fontSize: TYPOGRAPHY.SIZE_MD,
        fontWeight: '600',
        color: '#fff',
    },
    agencyChipTextSelected: {
        color: '#fff',
    },
    dateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#2a2a2a',
        borderRadius: 12,
        padding: DIMENSIONS.PADDING_LG,
        gap: DIMENSIONS.GAP_MD,
        borderWidth: 1,
        borderColor: '#333',
    },
    dateText: {
        fontSize: TYPOGRAPHY.SIZE_LG,
        color: '#fff',
    },
    imageButtons: {
        flexDirection: 'row',
        gap: DIMENSIONS.GAP_LG,
    },
    imageButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#2a2a2a',
        borderRadius: 12,
        padding: DIMENSIONS.PADDING_LG,
        gap: DIMENSIONS.GAP_SM,
        borderWidth: 1,
        borderColor: '#333',
    },
    imageButtonActive: {
        borderColor: '#4CAF50',
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
    },
    imageButtonText: {
        fontSize: TYPOGRAPHY.SIZE_MD,
        fontWeight: '600',
        color: '#666',
    },
    imageButtonTextActive: {
        color: '#4CAF50',
    },
    submitButton: {
        backgroundColor: '#007AFF',
        borderRadius: 12,
        padding: DIMENSIONS.PADDING_LG,
        alignItems: 'center',
        marginTop: DIMENSIONS.MARGIN_XL,
        marginBottom: DIMENSIONS.MARGIN_XL * 2,
    },
    submitButtonDisabled: {
        opacity: 0.6,
    },
    submitButtonText: {
        fontSize: TYPOGRAPHY.SIZE_LG,
        fontWeight: '600',
        color: '#fff',
    },
});

export default CertificationUploadModal;
