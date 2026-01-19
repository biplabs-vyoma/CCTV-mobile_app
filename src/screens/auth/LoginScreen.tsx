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
                title: "Invalid Input",
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
            <StatusBar barStyle="light-content" backgroundColor={COLORS?.loginGradientStart || '#1d4ed8'} />
            <SafeAreaView style={styles.safeArea}>
                {/* Header */}


                <View style={styles.content}>
                    {/* Icon */}
                    <View style={styles.iconContainer}>
                        <Wrench size={32} color={COLORS?.textInverse || '#fff'} />
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
                            placeholderTextColor="#9CA3AF"
                        />

                        <Input
                            label="Password"
                            placeholder="Enter your password"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry={!isPasswordVisible}
                            placeholderTextColor="#9CA3AF"
                            renderRightAccessory={() => (
                                <TouchableOpacity onPress={() => setIsPasswordVisible(!isPasswordVisible)}>
                                    {isPasswordVisible ? (
                                        <EyeOff size={20} color={COLORS?.textInverse || '#fff'} />
                                    ) : (
                                        <Eye size={20} color={COLORS?.textInverse || '#fff'} opacity={0.7} />
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
                            disabled={!email.trim() || !password.trim()}
                            style={[
                                styles.signInButton,
                                (email.trim() && password.trim()) && styles.signInButtonActive
                            ]}
                            textStyle={(email.trim() && password.trim()) && styles.signInTextActive}
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
        backgroundColor: COLORS?.primary || '#2563eb', // Should implement proper gradient if possible, but solid color for now
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
        color: COLORS?.textInverse || '#fff',
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
        color: COLORS?.textInverse || '#fff',
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
        color: COLORS?.textInverse || '#fff',
        fontSize: FONT_SIZES.s,
    },
    signInButton: {
        marginTop: SPACING.s,
    },
    signInButtonActive: {
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    signInTextActive: {
        color: COLORS?.primary || '#2563eb',
        fontWeight: 'bold',
    }
});
