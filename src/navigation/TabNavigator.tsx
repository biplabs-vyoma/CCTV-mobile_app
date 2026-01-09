import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { COLORS } from '../constants/theme';
import { LayoutDashboard, Video, ClipboardList, Activity, BarChart3, Bell } from 'lucide-react-native';
import { CustomHeader } from '../components/CustomHeader';
import { useAuth } from '../context/AuthContext';
import { callAPIWithEnc } from '../apis/common/api';

// Screens
import { DashboardScreen } from '../screens/dashboard/DashboardScreen';
import { CCTVMonitorScreen } from '../screens/cctv/CCTVMonitorScreen';
import { TicketQueueScreen } from '../screens/tickets/TicketQueueScreen';
import { NotificationScreen } from '../screens/notifications/NotificationScreen';

const Tab = createBottomTabNavigator();

export const TabNavigator = () => {
    // @ts-ignore
    const { user } = useAuth();
    const [unreadCount, setUnreadCount] = useState(0);
    const [activeRouteName, setActiveRouteName] = useState('Dashboard');
    const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

    const fetchUnreadCount = useCallback(async () => {
        if (!user?.user_id) return;

        try {
            const response = await callAPIWithEnc('vendor/getNotificationDetails', 'POST', {
                user_id: user?.user_id,
                user_type_id: user?.user_type_id,
                vendor_id: user?.vendor_id,
            });

            const apiData = Array.isArray(response) ? response : (response as any)?.data || [];
            const unread = apiData.filter((item: any) => item.is_seen === '0').length;
            setUnreadCount(unread);
        } catch (error) {
            console.error('Failed to fetch unread count in TabNavigator:', error);
        }
    }, [user]);

    useEffect(() => {
        // Polling Logic
        const startPolling = () => {
            if (activeRouteName === 'Notifications') {
                if (pollingIntervalRef.current) {
                    clearInterval(pollingIntervalRef.current);
                    pollingIntervalRef.current = null;
                }
                return;
            }

            // Fetch once immediately
            fetchUnreadCount();

            // Then set interval (15 seconds)
            if (!pollingIntervalRef.current) {
                pollingIntervalRef.current = setInterval(fetchUnreadCount, 30000);
            }
        };

        startPolling();

        return () => {
            if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
                pollingIntervalRef.current = null;
            }
        };
    }, [activeRouteName, fetchUnreadCount]);

    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: true,
                header: () => <CustomHeader />,
                tabBarActiveTintColor: (route.name === 'Tickets' && (route.params as any)?.disableStatusFilter)
                    ? (COLORS?.textSecondary || '#64748b')
                    : (COLORS?.primary || '#2563eb'),
                tabBarInactiveTintColor: COLORS?.textSecondary || '#64748b',
                tabBarStyle: {
                    height: 60,
                    paddingBottom: 8,
                    paddingTop: 8,
                    backgroundColor: COLORS?.surface || '#fff',
                    borderTopColor: COLORS?.border || '#ccc',
                },
                tabBarIcon: ({ color, size }) => {
                    let IconComponent;

                    if (route.name === 'Dashboard') IconComponent = LayoutDashboard;
                    else if (route.name === 'CCTV') IconComponent = Video;
                    else if (route.name === 'Tickets') IconComponent = ClipboardList;
                    else if (route.name === 'Notifications') IconComponent = Bell;
                    else if (route.name === 'Network') IconComponent = Activity;
                    else if (route.name === 'Performance') IconComponent = BarChart3;

                    if (route.name === 'Notifications') {
                        return (
                            <View style={styles.iconContainer}>
                                <Bell color={color} size={size} />
                                {unreadCount > 0 && <View style={styles.redDot} />}
                            </View>
                        );
                    }

                    return IconComponent ? <IconComponent color={color} size={size} /> : null;
                },
            })}
        >
            <Tab.Screen
                name="Dashboard"
                component={DashboardScreen}
                listeners={{ focus: () => setActiveRouteName('Dashboard') }}
            />
            <Tab.Screen
                name="CCTV"
                component={CCTVMonitorScreen}
                options={{ title: 'CCTV' }}
                listeners={{ focus: () => setActiveRouteName('CCTV') }}
            />
            <Tab.Screen
                name="Tickets"
                component={TicketQueueScreen}
                options={{ title: 'Queue' }}
                listeners={({ navigation }) => ({
                    tabPress: (e) => {
                        // Reset params when clicking the tab directly
                        e.preventDefault();
                        navigation.navigate('Tickets', { sid: '0', disableStatusFilter: false });
                    },
                    focus: () => setActiveRouteName('Tickets')
                })}
            />
            <Tab.Screen
                name="Notifications"
                component={NotificationScreen}
                options={{ title: 'Alerts' }}
                listeners={{
                    focus: () => {
                        setActiveRouteName('Notifications');
                        setUnreadCount(0); // Optimistically clear red dot when entering
                    }
                }}
            />
        </Tab.Navigator>
    );
};

const styles = StyleSheet.create({
    iconContainer: {
        width: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    redDot: {
        position: 'absolute',
        top: -1,
        right: -1,
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#ef4444',
        borderWidth: 1.5,
        borderColor: '#fff',
    }
});
