import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { COLORS, TYPOGRAPHY, DIMENSIONS } from '@/constants';

interface QRCodeGeneratorProps {
    referralCode: string;
    baseUrl?: string;
    size?: number;
}

export default function QRCodeGenerator({
    referralCode,
    baseUrl = 'https://seavault.app/upgrade',
    size = 200
}: QRCodeGeneratorProps) {
    const value = `${baseUrl}?ref=${referralCode}`;

    return (
        <View style={styles.container}>
            <View style={styles.qrContainer}>
                <QRCode
                    value={value}
                    size={size}
                    color="#000"
                    backgroundColor="#fff"
                />
            </View>
            <Text style={styles.codeText}>Ref Code: {referralCode}</Text>
            <Text style={styles.urlText}>{value}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        padding: DIMENSIONS.PADDING_LG,
    },
    qrContainer: {
        padding: DIMENSIONS.PADDING_MD,
        backgroundColor: '#fff',
        borderRadius: 12,
        marginBottom: DIMENSIONS.MARGIN_MD,
    },
    codeText: {
        fontSize: TYPOGRAPHY.SIZE_XL,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: DIMENSIONS.MARGIN_XS,
    },
    urlText: {
        fontSize: TYPOGRAPHY.SIZE_SM,
        color: '#ccc',
        textAlign: 'center',
    },
});
