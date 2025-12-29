import React from 'react';
import { View, Text, StyleSheet, StatusBar } from 'react-native';
import { COLORS, FONT_SIZES, SPACING } from '../../constants/theme';
import { ShieldCheck } from 'lucide-react-native'; // Assuming Lucide icon for logo

export const SplashScreen = () => {

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
            <View style={styles.logoContainer}>
                <ShieldCheck size={64} color={COLORS.textInverse} />
                <Text style={styles.title}>CCTV Monitor</Text>
                <Text style={styles.subtitle}>Kolkata Police</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoContainer: {
        alignItems: 'center',
    },
    title: {
        fontSize: FONT_SIZES.xxl,
        fontWeight: 'bold',
        color: COLORS.textInverse,
        marginTop: SPACING.m,
    },
    subtitle: {
        fontSize: FONT_SIZES.m,
        color: 'rgba(255,255,255,0.8)',
        marginTop: SPACING.s,
    },
});
