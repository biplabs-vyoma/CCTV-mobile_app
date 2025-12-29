import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { CheckCircle, AlertTriangle, Info, AlertCircle } from 'lucide-react-native';
import { COLORS, FONT_SIZES, BORDER_RADIUS, SPACING } from '../constants/theme';

export type AlertType = 'success' | 'error' | 'warning' | 'info';

interface CustomAlertProps {
    visible: boolean;
    title: string;
    message: string;
    type?: AlertType;
    onClose: () => void;
    onConfirm?: () => void;
    confirmText?: string;
    cancelText?: string;
}

const { width } = Dimensions.get('window');

export const CustomAlert = ({
    visible,
    title,
    message,
    type = 'info',
    onClose,
    onConfirm,
    confirmText = 'OK',
    cancelText = 'Cancel'
}: CustomAlertProps) => {
    const scaleValue = useRef(new Animated.Value(0)).current;
    const opacityValue = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        console.log("CustomAlert useEffect. Visible:", visible);
        if (visible) {
            Animated.parallel([
                Animated.spring(scaleValue, {
                    toValue: 1,
                    friction: 6,
                    tension: 50,
                    useNativeDriver: true,
                }),
                Animated.timing(opacityValue, {
                    toValue: 1,
                    duration: 250,
                    useNativeDriver: true,
                })
            ]).start();
        } else {
            Animated.timing(opacityValue, {
                toValue: 0,
                duration: 150,
                useNativeDriver: true,
            }).start(() => {
                scaleValue.setValue(0);
            });
        }
    }, [visible]);

    if (!visible) return null;


    const getIcon = () => {
        switch (type) {
            case 'success': return <CheckCircle size={40} color="#4ADE80" strokeWidth={2.5} />;
            case 'error': return <AlertCircle size={40} color="#F87171" strokeWidth={2.5} />;
            case 'warning': return <AlertTriangle size={40} color="#FBBF24" strokeWidth={2.5} />;
            default: return <Info size={40} color="#60A5FA" strokeWidth={2.5} />;
        }
    };

    // Using absolute positioning instead of Modal to guarantee visibility
    return (
        <View style={styles.absoluteContainer} pointerEvents="auto">
            <View style={styles.overlay}>
                <Animated.View style={[
                    styles.alertContainer,
                    {
                        opacity: opacityValue,
                        transform: [{ scale: scaleValue }]
                    }
                ]}>
                    <View style={styles.content}>
                        <View style={[styles.iconWrapper]}>
                            {getIcon()}
                        </View>

                        <Text style={styles.title}>{title}</Text>
                        <Text style={styles.message}>{message}</Text>

                        <View style={styles.buttonContainer}>
                            {onConfirm && (
                                <TouchableOpacity
                                    style={[styles.button, styles.cancelButton]}
                                    onPress={onClose}
                                >
                                    <Text style={styles.cancelButtonText}>{cancelText}</Text>
                                </TouchableOpacity>
                            )}

                            <TouchableOpacity
                                style={[
                                    styles.button,
                                    styles.confirmButton,
                                    { flex: onConfirm ? 1 : 0, minWidth: onConfirm ? 0 : 140 }
                                ]}
                                onPress={() => {
                                    console.log("CustomAlert: Confirm button pressed");
                                    if (onConfirm) onConfirm();
                                    else onClose();
                                }}
                            >
                                <Text style={styles.confirmButtonText}>{confirmText}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Animated.View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    absoluteContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        elevation: 9999,
    },
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)', // Darker dim
        justifyContent: 'center',
        alignItems: 'center',
        padding: SPACING.l,
        zIndex: 9999,
    },
    alertContainer: {
        width: width * 0.85,
        // Glassmorphism inspired dark background
        backgroundColor: '#0f172a', // Slate-900 like color
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        elevation: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
    },
    content: {
        padding: SPACING.xl,
        alignItems: 'center',
    },
    iconWrapper: {
        marginBottom: SPACING.l,
        padding: SPACING.m,
        borderRadius: 50,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    title: {
        fontSize: FONT_SIZES.l,
        fontWeight: '700',
        color: COLORS.textInverse, // White
        marginBottom: SPACING.s,
        textAlign: 'center',
        letterSpacing: 0.5,
    },
    message: {
        fontSize: FONT_SIZES.m,
        color: '#94a3b8', // Slate-400
        textAlign: 'center',
        marginBottom: SPACING.xl,
        lineHeight: 24,
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: SPACING.m,
        width: '100%',
        justifyContent: 'center',
    },
    button: {
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    confirmButton: {
        backgroundColor: COLORS.primary, // Brand Blue
        // Or accent color? Login uses Blue buttons.
        elevation: 4,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    confirmButtonText: {
        color: COLORS.textInverse,
        fontWeight: '600',
        fontSize: FONT_SIZES.m,
    },
    cancelButton: {
        flex: 1,
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    cancelButtonText: {
        color: COLORS.textInverse,
        fontWeight: '500',
        fontSize: FONT_SIZES.m,
    },
});
