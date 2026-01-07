import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Shield, LogOut, User as UserIcon } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { useAlert } from '../context/AlertContext';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const CustomHeader = () => {
    const { user, logout } = useAuth();
    const { showAlert } = useAlert();
    const insets = useSafeAreaInsets();

    const handleLogout = () => {
        console.log("CustomHeader: Triggering showAlert");
        showAlert({
            title: "Logout",
            message: "Are you sure you want to logout?",
            type: 'warning',
            confirmText: "Logout",
            cancelText: "Cancel",
            onConfirm: async () => {
                console.log("CustomHeader: Confirmed logout");
                try {
                    await logout();
                } catch (error) {
                    console.error("Logout failed", error);
                }
            }
        });
    };

    console.log("user", user);

    return (
        <View style={[styles.container, { paddingTop: insets.top + SPACING.s }]}>
            <View style={styles.content}>
                {/* Left Side: Branding */}
                <View style={styles.brandContainer}>
                    <View style={styles.logoBox}>
                        <Shield size={24} color={COLORS?.primary || '#2563eb'} fill="none" strokeWidth={2.5} />
                    </View>
                    <View>
                        <Text style={[styles.brandTitle, { color: COLORS?.primary || '#2563eb' }]}>CCTV Monitor</Text>
                        <Text style={styles.brandSubtitle}>Kolkata Police</Text>
                    </View>
                </View>

                {/* Right Side: User Profile & Logout */}
                <View style={styles.rightContainer}>
                    <View style={styles.userInfo}>
                        <Text style={styles.userName}>{user?.user_name?.toUpperCase() || 'User'}</Text>
                        <Text style={styles.userRole}>{user?.user_type_name || 'Engineer'}</Text>
                    </View>

                    <View style={styles.avatarContainer}>
                        <UserIcon size={20} color={COLORS?.primary || '#2563eb'} />
                    </View>

                    <TouchableOpacity
                        style={styles.logoutButton}
                        onPress={() => {
                            console.log("Logout button pressed");
                            handleLogout();
                        }}
                        hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                        accessibilityLabel="Logout"
                    >
                        <LogOut size={20} color={COLORS.textSecondary} />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: COLORS?.surface || '#fff',
        borderBottomWidth: 1,
        borderBottomColor: COLORS?.border || '#ccc',
        paddingHorizontal: SPACING.s,
        paddingBottom: SPACING.m,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    content: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: SPACING.xs,
    },
    brandContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.xs,
    },
    logoBox: {
        width: 40,
        height: 40,
        backgroundColor: COLORS?.background || '#f1f5f9', // Light bg for logo
        borderRadius: BORDER_RADIUS.m,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS?.border || '#ccc',
    },
    brandTitle: {
        fontSize: FONT_SIZES?.m || 16,
        fontWeight: '700',
        color: COLORS?.secondary || '#064e3b', // Deep Green
    },
    brandSubtitle: {
        fontSize: FONT_SIZES.xs,
        color: COLORS.textSecondary,
    },
    rightContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.xs, // Gap between elements
    },
    userInfo: {
        alignItems: 'flex-end',
        marginRight: SPACING.xs,
        display: 'flex', // Visible on larger screens, maybe hide role on very small?
    },
    userName: {
        fontSize: FONT_SIZES.xs,
        fontWeight: '600',
        color: COLORS?.text || '#000',
        marginTop: 7,
    },
    userRole: {
        fontSize: 9,
        color: COLORS?.textSecondary || '#6b7280',
        backgroundColor: '#b3cfe1aa',
        padding: SPACING.xs,
        borderRadius: BORDER_RADIUS.m,
        borderWidth: 1,
        borderColor: COLORS.border,

    },
    avatarContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#e0f2fe', // Light blue bg
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoutButton: {
        padding: SPACING.xs,
        // marginLeft: SPACING.xs,
    }
});
