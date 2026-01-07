import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { COLORS } from '../constants/theme';
import { LayoutDashboard, Video, ClipboardList, Activity, BarChart3 } from 'lucide-react-native';
import { CustomHeader } from '../components/CustomHeader';

// Screens
import { DashboardScreen } from '../screens/dashboard/DashboardScreen';
import { CCTVMonitorScreen } from '../screens/cctv/CCTVMonitorScreen';
import NetworkMonitoringDashboard from '../screens/network/NetworkMonitoringDashboard';
<<<<<<< HEAD
import ReportsScreen from '../screens/reports/ReportsScreen';
import { TicketQueueScreen } from '../screens/dashboard/Placeholders';
=======
import { PerformanceScreen } from '../screens/dashboard/Placeholders';
import { TicketQueueScreen } from '../screens/tickets/TicketQueueScreen';
>>>>>>> d02498a784350a943d02f2b2e84841d6ba264a18

const Tab = createBottomTabNavigator();

export const TabNavigator = () => {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: true,
                header: () => <CustomHeader />,
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
                    else if (route.name === 'Performance') IconComponent = BarChart3;

                    return IconComponent ? <IconComponent color={color} size={size} /> : null;
                },
            })}
        >
            <Tab.Screen name="Dashboard" component={DashboardScreen} />
            <Tab.Screen name="CCTV" component={CCTVMonitorScreen} options={{ title: 'CCTV' }} />
            <Tab.Screen name="Tickets" component={TicketQueueScreen} options={{ title: 'Queue' }} />
            <Tab.Screen name="Network" component={NetworkMonitoringDashboard} options={{ title: 'Network' }} />
            <Tab.Screen name="Performance" component={ReportsScreen} options={{ title: 'Performance' }} />
        </Tab.Navigator>
    );
};
