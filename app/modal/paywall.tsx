import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import Paywall from '@/components/Paywall';

export default function PaywallModal() {
    const router = useRouter();

    return (
        <View style={styles.container}>
            <Paywall onClose={() => router.back()} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
});
