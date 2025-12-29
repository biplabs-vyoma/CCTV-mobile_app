import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, AuthState, LoginCredentials } from '../types/auth';
import {
    decryptData,
    encryptData,
    generateAuthToken,
    loginApi,
} from '../services/api/authApi';

interface AuthContextType extends AuthState {
    login: (credentials: LoginCredentials) => Promise<void>;
    logout: () => void;
    register: (data: any) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {
    const [authState, setAuthState] = useState<AuthState>({
        user: null,
        isAuthenticated: false,
        isLoading: true,
        error: null,
    });

    useEffect(() => {
        // Check for stored user data on app startup
        // Check for stored user data on app startup
        const loadStoredUser = async () => {
            // Artificial delay for Splash Screen (2 seconds)
            await new Promise(resolve => setTimeout(resolve, 2000));

            try {
                const storedUser = await AsyncStorage.getItem('user');
                if (storedUser) {
                    const user = JSON.parse(atob(storedUser));
                    setAuthState({
                        user,
                        isAuthenticated: true,
                        isLoading: false,
                        error: null,
                    });
                } else {
                    setAuthState((prev) => ({ ...prev, isLoading: false }));
                }
            } catch (err) {
                console.error('loadStoredUser error:', err);
                await AsyncStorage.removeItem('user');
                setAuthState((prev) => ({ ...prev, isLoading: false }));
            }
        };

        loadStoredUser();
    }, []);

    const login = async (credentials: LoginCredentials) => {
        setAuthState((prev) => ({ ...prev, error: null }));

        try {
            // Step 1: Generate auth token using Basic auth
            const base64Auth = btoa(`${credentials.email}:${credentials.password}`);
            await generateAuthToken(base64Auth);

            // Step 2: Encrypt login credentials
            const enc_data = await encryptData({
                username: credentials.email,
                password: credentials.password,
            });
            console.log('enc_data', enc_data);

            // Step 3: Call login API with encrypted data
            const response = await loginApi(enc_data);
            console.log('response', response);

            // Step 4: Decrypt the response
            const dec_data = await decryptData(response.data);
            console.log('dec_data', dec_data);

            // Step 5: Parse user data
            const user: User = JSON.parse(dec_data);

            if (!user) {
                throw new Error('Invalid credentials');
            }

            // Check for Field Engineer role (user_type_id: 30)
            if (user.user_type_id !== 30) {
                throw new Error('Login with field engineer credentials');
            }

            // Step 6: Store user data in AsyncStorage
            await AsyncStorage.setItem('user', btoa(JSON.stringify(user)));

            setAuthState({
                user: user,
                isAuthenticated: true,
                isLoading: false,
                error: null,
            });
        } catch (err) {
            setAuthState((prev) => ({
                ...prev,
                error: err instanceof Error ? err.message : 'Login failed',
            }));
            throw err;
        }
    };

    const logout = async () => {
        console.log("AuthContext: Logging out...");
        try {
            await AsyncStorage.removeItem('user');
            await AsyncStorage.removeItem('token');
            console.log("AuthContext: AsyncStorage cleared");
        } catch (e) {
            console.error("AuthContext: Error clearing storage", e);
        }

        setAuthState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
        });
        console.log("AuthContext: State updated to unauthenticated");
    };

    const register = async (data: any) => {
        setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));

        try {
            // Simulate API call
            await new Promise((resolve) => setTimeout(resolve, 1500));

            // In a real app, this would create a new user
            const newUser: User = {
                user_id: Date.now(),
                user_type_id: 30, // Default to FE for mock checks
                user_type_name: data.role || 'Field Engineer',
                user_name: data.name,
                user_email_id: data.email,
                user_phone_number: '0000000000',
                user_gender: 'Unknown',
                region_id: 1,
                zone_id: 1,
                zone_name: data.zone || 'Default Zone',
                unit_id: 1,
                unit_name: 'Default Unit',
                subunit_id: 1,
                subunit_name: 'Default Subunit',
                vendor_id: 1,
                vendor_name: 'Default Vendor',
                permissions:
                    data.role === 'client'
                        ? ['create_ticket', 'view_tickets']
                        : ['view_tickets', 'assign_tickets'],
                isActive: true,
                createdAt: new Date(),
            };

            await AsyncStorage.setItem('user', btoa(JSON.stringify(newUser)));
            setAuthState({
                user: newUser,
                isAuthenticated: true,
                isLoading: false,
                error: null,
            });
        } catch (err) {
            setAuthState((prev) => ({
                ...prev,
                isLoading: false,
                error: err instanceof Error ? err.message : 'Registration failed',
            }));
            throw err;
        }
    };

    return (
        <AuthContext.Provider
            value={{
                ...authState,
                login,
                logout,
                register,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
