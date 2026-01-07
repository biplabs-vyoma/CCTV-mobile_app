import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Modal, Text, Dimensions } from 'react-native';
import { Shield } from 'lucide-react-native';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../constants/theme';

interface CustomLoaderProps {
    visible: boolean;
    message?: string;
    overlay?: boolean;
}

const { width } = Dimensions.get('window');

export const CustomLoader = ({ visible, message = 'Loading...', overlay = true }: CustomLoaderProps) => {
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const rotateAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            // Pulse Animation
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1.2,
                        duration: 1000,
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 1000,
                        useNativeDriver: true,
                    }),
                ])
            ).start();

            // Rotation for outer ring (simulated by view)
            Animated.loop(
                Animated.timing(rotateAnim, {
                    toValue: 1,
                    duration: 3000,
                    useNativeDriver: true,
                })
            ).start();
        } else {
            pulseAnim.setValue(1);
            rotateAnim.setValue(0);
        }
    }, [visible]);

    if (!visible) return null;

    const spin = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    const LoaderContent = () => (
        <View style={styles.loaderBox}>
            <View style={styles.iconContainer}>
                {/* Outer Rotating Ring */}
                <Animated.View style={[styles.ring, { transform: [{ rotate: spin }] }]} />

                {/* Pulsing Icon */}
                <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                    <Shield size={48} color={COLORS?.primary || '#2563eb'} fill={COLORS?.surface || '#fff'} strokeWidth={1} />
                </Animated.View>
            </View>
            <Text style={styles.message}>{message}</Text>
        </View>
    );

    if (overlay) {
        return (
            <Modal transparent visible={visible} animationType="fade">
                <View style={styles.overlay}>
                    <LoaderContent />
                </View>
            </Modal>
        );
    }

    return (
        <View style={styles.inlineContainer}>
            <LoaderContent />
        </View>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    inlineContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: SPACING.l,
    },
    loaderBox: {
        width: 160,
        height: 160,
        backgroundColor: COLORS?.surface || '#fff', // Or glass dark 'rgba(15, 23, 42, 0.9)'
        borderRadius: BORDER_RADIUS?.xl || 20,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 10,
        shadowColor: COLORS?.primary || '#2563eb',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
    },
    iconContainer: {
        position: 'relative',
        width: 80,
        height: 80,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.m,
    },
    ring: {
        position: 'absolute',
        width: 70,
        height: 70,
        borderRadius: 35,
        borderWidth: 3,
        borderColor: COLORS.secondary,
        borderTopColor: 'transparent',
        borderRightColor: 'transparent',
    },
    message: {
        fontSize: FONT_SIZES?.s || 14,
        fontWeight: '600',
        color: COLORS?.text || '#000',
        letterSpacing: 1,
    }
});
