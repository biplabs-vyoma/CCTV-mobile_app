import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, TouchableOpacityProps } from 'react-native';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../constants/theme';

interface ButtonProps extends TouchableOpacityProps {
    title: string;
    loading?: boolean;
    variant?: 'primary' | 'secondary' | 'outline';
    textStyle?: any;
}

export const Button: React.FC<ButtonProps> = ({
    title,
    loading,
    variant = 'primary',
    style,
    disabled,
    textStyle,
    ...props
}) => {
    return (
        <TouchableOpacity
            style={[
                styles.button,
                variant === 'outline' && styles.buttonOutline,
                disabled && styles.buttonDisabled,
                style
            ]}
            disabled={disabled || loading}
            {...props}
        >
            {loading ? (
                <ActivityIndicator
                    color={StyleSheet.flatten(textStyle)?.color || COLORS.textInverse}
                />
            ) : (
                <Text style={[
                    styles.text,
                    variant === 'outline' && styles.textOutline,
                    textStyle
                ]}>
                    {title}
                </Text>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        height: 50,
        backgroundColor: 'rgba(255,255,255,0.2)', // From Login design
        borderRadius: BORDER_RADIUS.m,
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonOutline: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: COLORS.textInverse,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    text: {
        color: COLORS.textInverse,
        fontSize: FONT_SIZES.m,
        fontWeight: '600',
    },
    textOutline: {
        color: COLORS.textInverse,
    },
});
