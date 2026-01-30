import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthStack } from './AuthStack';
import { TabNavigator } from './TabNavigator';
import { useAuth } from '../context/AuthContext';
import { SplashScreen } from '../screens/splash/SplashScreen';

const Stack = createNativeStackNavigator();

export const RootNavigator = () => {
    const { isAuthenticated } = useAuth();

    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            {isAuthenticated ? (
                <Stack.Screen name="Main" component={TabNavigator} />
            ) : (
                <Stack.Screen name="Auth" component={AuthStack} />
            )}
        </Stack.Navigator>
    );
};
