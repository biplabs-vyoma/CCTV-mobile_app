import React, { useState } from 'react';
import { View, Text, StyleSheet, StatusBar, SafeAreaView, TouchableOpacity } from 'react-native';
import { Wrench, Eye, EyeOff, ArrowLeft } from 'lucide-react-native';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../../constants/theme';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { useAuth } from '../../context/AuthContext';
import { useAlert } from '../../context/AlertContext';

export const LoginScreen = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const { login } = useAuth();
    const { showAlert } = useAlert();

    const handleLogin = async () => {
        if (!email || !password) {
            showAlert({
                title: "Error",
                message: "Please enter email and password",
                type: 'error',
                confirmText: "Okay"
            });
            return;
        }

        setIsLoggingIn(true);
        try {
            await login({ email, password });
            // Navigation is handled automatically by AuthContext
        } catch (error) {
            setIsLoggingIn(false);
            showAlert({
                title: "Login Failed",
                message: error instanceof Error ? error.message : "Invalid credentials",
                type: 'error',
                confirmText: "Try Again"
            });
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.loginGradientStart} />
            <SafeAreaView style={styles.safeArea}>
                {/* Header */}


                <View style={styles.content}>
                    {/* Icon */}
                    <View style={styles.iconContainer}>
                        <Wrench size={32} color={COLORS.textInverse} />
                    </View>

                    <Text style={styles.title}>Field Engineer Login</Text>
                    <Text style={styles.subtitle}>On-site maintenance and physical repairs</Text>

                    <View style={styles.form}>
                        <Input
                            label="Email Address"
                            placeholder="Enter your email"
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                        />

                        <Input
                            label="Password"
                            placeholder="Enter your password"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry={!isPasswordVisible}
                            renderRightAccessory={() => (
                                <TouchableOpacity onPress={() => setIsPasswordVisible(!isPasswordVisible)}>
                                    {isPasswordVisible ? (
                                        <EyeOff size={20} color={COLORS.textInverse} />
                                    ) : (
                                        <Eye size={20} color={COLORS.textInverse} opacity={0.7} />
                                    )}
                                </TouchableOpacity>
                            )}
                        />

                        <TouchableOpacity style={styles.forgotPassword}>
                            <Text style={styles.forgotPasswordText}>Forgot password?</Text>
                        </TouchableOpacity>

                        <Button
                            title="Sign In"
                            onPress={handleLogin}
                            loading={isLoggingIn}
                            style={styles.signInButton}
                        />
                    </View>
                </View>
            </SafeAreaView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.primary, // Should implement proper gradient if possible, but solid color for now
    },
    safeArea: {
        flex: 1,
    },
    header: {
        padding: SPACING.m,
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'center', // Centered "Change Role" in design? No its top bar.
        // Actually image shows centered "Change Role" at top with back arrow.
    },
    backText: {
        color: COLORS.textInverse,
        fontSize: FONT_SIZES.m,
        fontWeight: '600',
        marginLeft: SPACING.s,
    },
    content: {
        flex: 1,
        paddingHorizontal: SPACING.l,
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconContainer: {
        width: 64,
        height: 64,
        backgroundColor: '#f97316', // Orange bg
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.l,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
    },
    title: {
        fontSize: FONT_SIZES.xxl,
        fontWeight: 'bold',
        color: COLORS.textInverse,
        marginBottom: SPACING.xs,
    },
    subtitle: {
        fontSize: FONT_SIZES.s,
        color: 'rgba(255,255,255,0.7)',
        marginBottom: SPACING.xxl,
        textAlign: 'center',
    },
    form: {
        width: '100%',
    },
    forgotPassword: {
        alignSelf: 'flex-start',
        marginBottom: SPACING.l,
    },
    forgotPasswordText: {
        color: COLORS.textInverse,
        fontSize: FONT_SIZES.s,
    },
    signInButton: {
        marginTop: SPACING.s,
    }
});
