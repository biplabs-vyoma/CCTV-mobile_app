import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { COLORS, SPACING } from '../../constants/theme';
import { fetchDashboardDetails, fetchRecentTickets } from '../../services/api/dashboardApi';
import { callAPIWithEnc } from '../../apis/common/api';
import { DashboardStats, TicketApiResponse } from '../../types/dashboard';

// Icons
import { CheckCircle, ClipboardList, Activity } from 'lucide-react-native';

// Components
import { StatsCard } from '../../components/dashboard/StatsCard';
import { CCTVStatusChart } from '../../components/dashboard/CCTVStatusChart';
import { TicketList } from '../../components/dashboard/TicketList';
import { CustomLoader } from '../../components/CustomLoader';

export const DashboardScreen = () => {
    const navigation = useNavigation<any>();
    const { user } = useAuth();
    const [dashboardData, setDashboardData] = useState<DashboardStats | null>(null);
    const [recentTickets, setRecentTickets] = useState<TicketApiResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const lastNotificationIdRef = React.useRef<string | null>(null);

    const loadData = useCallback(async (showLoader = false) => {
        if (!user) return;
        try {
            if (showLoader && !refreshing) setLoading(true);

            console.log("user", user);

            // Fetch both in parallel
            const [statsData, ticketsData] = await Promise.all([
                fetchDashboardDetails(user?.user_id, user?.user_type_id),
                fetchRecentTickets(user?.user_id, user?.user_type_id)
            ]);



            console.log("statsData", statsData);
            console.log("ticketsData", ticketsData);

            setDashboardData(statsData);
            setRecentTickets(Array.isArray(ticketsData) ? ticketsData : []);

        } catch (error) {
            console.error('Dashboard load error:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [user, refreshing]);

    useFocusEffect(
        useCallback(() => {
            // If we already have data, refresh silently. 
            // If no data (first time), show the loader.
            const shouldShowLoader = !dashboardData;
            loadData(shouldShowLoader);
        }, [loadData, !!dashboardData])
    );

    // Poll for new notifications every 15 seconds
    React.useEffect(() => {
        if (!user) return;

        const checkNotifications = async () => {
            try {
                const response: any = await callAPIWithEnc('vendor/getNotificationDetails', 'POST', {
                    user_id: user?.user_id,
                    user_type_id: user?.user_type_id,
                    vendor_id: user?.vendor_id,
                });

                const data = Array.isArray(response) ? response : (response?.data || []);
                if (data && data.length > 0) {
                    // Find the MAX notification ID to handle unsorted responses
                    const maxId = Math.max(...data.map((item: any) => Number(item.notification_id) || 0));
                    const currentMaxIdStr = String(maxId);

                    if (lastNotificationIdRef.current === null) {
                        lastNotificationIdRef.current = currentMaxIdStr;
                    } else if (maxId > (Number(lastNotificationIdRef.current) || 0)) {
                        console.log("Dashboard: New notification detected (ID " + currentMaxIdStr + "), refreshing data...");
                        lastNotificationIdRef.current = currentMaxIdStr;
                        loadData(false); // Silent refresh
                    }
                }
            } catch (error) {
                // silent
            }
        };

        // Initial check
        checkNotifications();

        const interval = setInterval(checkNotifications, 30000);
        return () => clearInterval(interval);
    }, [user, loadData]);

    const onRefresh = () => {
        setRefreshing(true);
        loadData();
    };

    const isFieldEngineerView = dashboardData && dashboardData.total_assigned_ticket !== undefined && dashboardData.total_assigned_ticket !== null;

    if (loading && !refreshing) {
        return <CustomLoader visible={true} message="Loading Dashboard..." />;
    }

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS?.primary || '#2563eb']} />}
        >
            <View style={styles.grid}>
                <View style={styles.row}>
                    <View style={styles.col}>
                        <StatsCard
                            title="Total Resolved Tickets"
                            value={dashboardData?.total_inprogress_ticket || 0}
                            change="Successfully Resolved"
                            changeType="neutral"
                            icon={Activity}
                            color="green"
                            style={{ flex: 1, marginBottom: 0 }}
                            onPress={() => navigation.navigate('Tickets', { sid: '230', fromDashboard: true, disableStatusFilter: true, timestamp: Date.now() })}
                        />
                    </View>
                    <View style={styles.col}>
                        <StatsCard
                            title="Assigned"
                            value={dashboardData?.total_assigned_ticket || 0}
                            change="Assigned to you"
                            changeType="neutral"
                            icon={ClipboardList}
                            color="blue"
                            style={{ flex: 1, marginBottom: 0 }}
                            onPress={() => navigation.navigate('Tickets', { sid: '220', fromDashboard: true, disableStatusFilter: true, timestamp: Date.now() })}
                        />
                    </View>
                </View>
            </View>

            {/* Charts & Lists */}
            {dashboardData && <CCTVStatusChart stats={dashboardData} />}

            <TicketList tickets={recentTickets} />
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS?.background || '#f1f5f9',
    },
    content: {
        padding: SPACING.m,
        paddingBottom: 40,
    },
    grid: {
        marginBottom: SPACING.m,
    },
    row: {
        flexDirection: 'row',
        gap: SPACING.m,
        marginBottom: SPACING.m,
    },
    col: {
        flex: 1,
    }
});
