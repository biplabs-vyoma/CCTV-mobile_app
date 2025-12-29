import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { COLORS, SPACING } from '../../constants/theme';
import { fetchDashboardDetails, fetchRecentTickets } from '../../services/api/dashboardApi';
import { DashboardStats, TicketApiResponse } from '../../types/dashboard';

// Icons
import { CheckCircle,  ClipboardList, Activity } from 'lucide-react-native';

// Components
import { StatsCard } from '../../components/dashboard/StatsCard';
import { CCTVStatusChart } from '../../components/dashboard/CCTVStatusChart';
import { TicketList } from '../../components/dashboard/TicketList';
import { CustomLoader } from '../../components/CustomLoader';

export const DashboardScreen = () => {
    const { user } = useAuth();
    const [dashboardData, setDashboardData] = useState<DashboardStats | null>(null);
    const [recentTickets, setRecentTickets] = useState<TicketApiResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadData = useCallback(async () => {
        if (!user) return;
        try {
            // If refreshing, don't show full screen loader
            if (!refreshing) setLoading(true);

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

    useEffect(() => {
        loadData();
    }, []);

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
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
        >
            <View style={styles.grid}>
                <>
                        <StatsCard
                            title="Total Resolved"
                            value={dashboardData?.total_resloved_ticket || 0}
                            change="Successfully closed"
                            changeType="positive"
                            icon={CheckCircle}
                            color="green"
                        />
                        <StatsCard
                            title="In-Progress"
                            value={dashboardData?.total_inprogress_ticket || 0}
                            change="Currently active"
                            changeType="neutral"
                            icon={Activity}
                            color="orange"
                        />
                        <StatsCard
                            title="Assigned"
                            value={dashboardData?.total_assigned_ticket || 0}
                            change="Assigned to you"
                            changeType="neutral"
                            icon={ClipboardList}
                            color="blue"
                        />
                    </>
                
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
        backgroundColor: COLORS.background,
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
