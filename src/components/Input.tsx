import React from 'react';
import { View, TextInput, Text, StyleSheet, TextInputProps } from 'react-native';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../constants/theme';

interface InputProps extends TextInputProps {
    label: string;
    error?: string;
    renderRightAccessory?: () => React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
    label,
    error,
    renderRightAccessory,
    style,
    ...props
}) => {
    return (
        <View style={styles.container}>
            <Text style={styles.label}>{label}</Text>
            <View style={[styles.inputContainer, error && styles.inputError]}>
                <TextInput
                    style={[styles.input, style]}
                    placeholderTextColor={COLORS.textSecondary}
                    {...props}
                />
                {renderRightAccessory && (
                    <View style={styles.rightAccessory}>
                        {renderRightAccessory()}
                    </View>
                )}
            </View>
            {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: SPACING.m,
    },
    label: {
        fontSize: FONT_SIZES.s,
        color: COLORS.textInverse, // Assuming used on dark blue Login bg mostly, or handled via props? 
        // Wait, the design has white text labels on blue BG.
        // Making it adaptable:
        fontWeight: '600',
        marginBottom: SPACING.s,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.1)', // semi-transparent for login
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: BORDER_RADIUS.m,
        height: 50,
        paddingHorizontal: SPACING.m,
    },
    input: {
        flex: 1,
        color: COLORS.textInverse,
        fontSize: FONT_SIZES.m,
    },
    inputError: {
        borderColor: COLORS.error,
    },
    rightAccessory: {
        marginLeft: SPACING.s,
    },
    errorText: {
        color: COLORS.error,
        fontSize: FONT_SIZES.xs,
        marginTop: SPACING.xs,
    },
});
