import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { COLORS } from '../constants/theme';
import { LayoutDashboard, Video, ClipboardList, Activity, User } from 'lucide-react-native';

// Screens
import { DashboardScreen } from '../screens/dashboard/DashboardScreen';
import { CCTVMonitorScreen, TicketQueueScreen, NetworkMonitorScreen, ProfileScreen } from '../screens/dashboard/Placeholders';

const Tab = createBottomTabNavigator();

export const TabNavigator = () => {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarActiveTintColor: COLORS.secondary,
                tabBarInactiveTintColor: COLORS.textSecondary,
                tabBarStyle: {
                    height: 60,
                    paddingBottom: 8,
                    paddingTop: 8,
                    backgroundColor: COLORS.surface,
                    borderTopColor: COLORS.border,
                },
                tabBarIcon: ({ color, size }) => {
                    let IconComponent;

                    if (route.name === 'Dashboard') IconComponent = LayoutDashboard;
                    else if (route.name === 'CCTV') IconComponent = Video;
                    else if (route.name === 'Tickets') IconComponent = ClipboardList;
                    else if (route.name === 'Network') IconComponent = Activity;
                    else if (route.name === 'Profile') IconComponent = User;

                    return IconComponent ? <IconComponent color={color} size={size} /> : null;
                },
            })}
        >
            <Tab.Screen name="Dashboard" component={DashboardScreen} />
            <Tab.Screen name="CCTV" component={CCTVMonitorScreen} options={{ title: 'CCTV' }} />
            <Tab.Screen name="Tickets" component={TicketQueueScreen} options={{ title: 'Queue' }} />
            <Tab.Screen name="Network" component={NetworkMonitorScreen} options={{ title: 'Network' }} />
            <Tab.Screen name="Profile" component={ProfileScreen} />
        </Tab.Navigator>
    );
};
