import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, StatusBar, ActivityIndicator, Animated } from 'react-native';
import { COLORS, FONT_SIZES, SPACING } from '../../constants/theme';
import { ShieldCheck } from 'lucide-react-native'; // Assuming Lucide icon for logo

interface SplashScreenProps {
    skipCheck?: boolean; // Prop to disable logic and animation for subsequent loads
}

export const SplashScreen = () => {

    return (
        <View style={styles.container}>
            <StatusBar
                barStyle="light-content"
                backgroundColor="transparent"
                translucent={true}
            />

            <View style={styles.content}>
                <View style={styles.logoContainer}>
                    <ShieldCheck size={72} color={COLORS?.textInverse || '#fff'} />
                    <Text style={styles.title}>CCTV Monitor</Text>
                    <Text style={styles.subtitle}>Kolkata Police</Text>
                </View>
            </View>

            {/* Absolute positioning of loader - no impact on main text layout */}
            <View style={styles.loaderArea}>
                <ActivityIndicator size="large" color={COLORS?.textInverse || '#fff'} />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS?.primary || '#2563eb',
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    logoContainer: {
        alignItems: 'center',
    },
    title: {
        fontSize: FONT_SIZES.xxl,
        fontWeight: 'bold',
        color: COLORS?.textInverse || '#fff',
        marginTop: SPACING.m,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: FONT_SIZES.m,
        color: 'rgba(255,255,255,0.8)',
        marginTop: SPACING.s,
        textAlign: 'center',
    },
    loaderArea: {
        position: 'absolute',
        bottom: 80,
        left: 0,
        right: 0,
        alignItems: 'center',
    }
});
