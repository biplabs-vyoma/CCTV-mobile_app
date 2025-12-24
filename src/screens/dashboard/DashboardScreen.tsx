import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Shield, Activity, ClipboardList, CheckCircle } from 'lucide-react-native';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../../constants/theme';
import { ApiService } from '../../services/ApiService';
import { Ticket } from '../../services/mockData';

const StatCard = ({ title, value, subtext, icon, color }: any) => (
    <View style={styles.statCard}>
        <View style={styles.statHeader}>
            <View>
                <Text style={styles.statValue}>{value}</Text>
                <Text style={styles.statTitle}>{title}</Text>
            </View>
            <View style={[styles.iconBox, { backgroundColor: color + '20' }]}>
                {icon}
            </View>
        </View>
        <Text style={[styles.statSubtext, { color }]}>{subtext}</Text>
    </View>
);

const TicketItem = ({ ticket }: { ticket: Ticket }) => (
    <View style={styles.ticketItem}>
        <View style={styles.ticketHeader}>
            <Text style={styles.ticketId}>{ticket.ticketId}</Text>
            <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(ticket.priority) }]}>
                <Text style={styles.priorityText}>{ticket.priority}</Text>
            </View>
        </View>
        <Text style={styles.ticketLocation}>{ticket.location}</Text>
        <Text style={styles.ticketIssue}>{ticket.issue}</Text>
        <Text style={styles.ticketDate}>{ticket.date}</Text>
    </View>
);

const getPriorityColor = (priority: string) => {
    switch (priority) {
        case 'High': return '#ef4444';
        case 'Medium': return '#f59e0b';
        case 'Low': return '#22c55e';
        default: return COLORS.textSecondary;
    }
}

export const DashboardScreen = () => {
    const [stats, setStats] = useState<any>(null);
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [refreshing, setRefreshing] = useState(false);

    const fetchData = async () => {
        const s = await ApiService.fetchDashboardStats();
        const t = await ApiService.fetchTickets();
        setStats(s);
        setTickets(t as Ticket[]);
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchData();
        setRefreshing(false);
    }

    useEffect(() => {
        fetchData();
    }, []);

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                <View style={styles.header}>
                    <View>
                        <Text style={styles.welcomeText}>CCTV Monitor</Text>
                        <Text style={styles.roleText}>Field Engineer</Text>
                    </View>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>P</Text>
                    </View>
                </View>

                {stats && (
                    <View style={styles.statsContainer}>
                        <StatCard
                            title="Resolved"
                            value={stats.resolved}
                            subtext="Successfully closed"
                            icon={<CheckCircle size={24} color={COLORS.success} />}
                            color={COLORS.success}
                        />
                        <StatCard
                            title="In-Progress"
                            value={stats.inProgress}
                            subtext="Currently active"
                            icon={<Activity size={24} color={COLORS.warning} />}
                            color={COLORS.warning}
                        />
                        <StatCard
                            title="Assigned"
                            value={stats.assigned}
                            subtext="Assigned to you"
                            icon={<ClipboardList size={24} color={COLORS.primary} />}
                            color={COLORS.primary}
                        />
                    </View>
                )}

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Recent Ticket Activity</Text>
                    {tickets.map(ticket => (
                        <TicketItem key={ticket.id} ticket={ticket} />
                    ))}
                </View>

                <View style={{ height: 20 }} />
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    scrollContent: {
        padding: SPACING.m,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.l,
    },
    welcomeText: {
        fontSize: FONT_SIZES.xl,
        fontWeight: 'bold',
        color: COLORS.secondary,
    },
    roleText: {
        fontSize: FONT_SIZES.s,
        color: COLORS.primary,
        fontWeight: '600',
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.primary + '20',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        color: COLORS.primary,
        fontWeight: 'bold',
        fontSize: FONT_SIZES.l,
    },
    statsContainer: {
        marginBottom: SPACING.l,
        gap: SPACING.m,
    },
    statCard: {
        backgroundColor: COLORS.surface,
        borderRadius: BORDER_RADIUS.m,
        padding: SPACING.m,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    statHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: SPACING.s,
    },
    statValue: {
        fontSize: FONT_SIZES.xxl,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    statTitle: {
        fontSize: FONT_SIZES.s,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    statSubtext: {
        fontSize: FONT_SIZES.xs,
    },
    section: {
        marginTop: SPACING.m,
    },
    sectionTitle: {
        fontSize: FONT_SIZES.l,
        fontWeight: 'bold',
        color: COLORS.secondary,
        marginBottom: SPACING.m,
    },
    ticketItem: {
        backgroundColor: COLORS.surface,
        borderRadius: BORDER_RADIUS.m,
        padding: SPACING.m,
        marginBottom: SPACING.s,
        borderLeftWidth: 4,
        borderLeftColor: COLORS.primary,
    },
    ticketHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.xs,
    },
    ticketId: {
        fontWeight: 'bold',
        color: COLORS.text,
    },
    priorityBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
    },
    priorityText: {
        color: 'white',
        fontSize: 10,
        fontWeight: 'bold',
    },
    ticketLocation: {
        fontSize: FONT_SIZES.m,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: 2,
    },
    ticketIssue: {
        fontSize: FONT_SIZES.s,
        color: COLORS.textSecondary,
    },
    ticketDate: {
        fontSize: FONT_SIZES.xs,
        color: COLORS.textSecondary,
        marginTop: SPACING.s,
        textAlign: 'right',
    }
});
