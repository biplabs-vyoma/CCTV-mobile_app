import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../../constants/theme';
import { DashboardStats } from '../../types/dashboard';

interface CCTVStatusChartProps {
    stats: DashboardStats;
}

export const CCTVStatusChart: React.FC<CCTVStatusChartProps> = ({ stats }) => {
    const total = stats.total_cctv || 1; // Prevent division by zero
    const onlinePercent = (stats.total_online_cctv / total) * 100;
    const offlinePercent = (stats.total_offline_cctv / total) * 100;
    const maintenancePercent = (stats.open_ticket / total) * 100; // Assuming open_tickets relates to maintenance/issues

    const renderProgressBar = (label: string, count: number, percent: number, color: string) => (
        <View style={styles.progressContainer}>
            <View style={styles.labelRow}>
                <Text style={styles.label}>{label}</Text>
                <Text style={styles.count}>{count} ({percent.toFixed(1)}%)</Text>
            </View>
            <View style={styles.track}>
                <View style={[styles.fill, { width: `${percent}%`, backgroundColor: color }]} />
            </View>
        </View>
    );

    return (
        <View style={styles.card}>
            <Text style={styles.cardTitle}>CCTV Status Distribution</Text>

            <View style={styles.chartContainer}>
                {renderProgressBar('Online', stats.total_online_cctv, onlinePercent, '#22c55e')}
                {renderProgressBar('Offline', stats.total_offline_cctv, offlinePercent, '#ef4444')}
                {renderProgressBar('Maintenance', stats.open_ticket, maintenancePercent, '#eab308')}
            </View>

            <View style={styles.legendContainer}>
                <View style={styles.legendItem}>
                    <View style={[styles.dot, { backgroundColor: '#22c55e' }]} />
                    <Text style={styles.legendText}>Online</Text>
                </View>
                <View style={styles.legendItem}>
                    <View style={[styles.dot, { backgroundColor: '#ef4444' }]} />
                    <Text style={styles.legendText}>Offline</Text>
                </View>
                <View style={styles.legendItem}>
                    <View style={[styles.dot, { backgroundColor: '#eab308' }]} />
                    <Text style={styles.legendText}>Maintenance</Text>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: COLORS.surface,
        borderRadius: BORDER_RADIUS.m,
        padding: SPACING.m,
        marginBottom: SPACING.m,
        borderWidth: 1,
        borderColor: COLORS.border,
        elevation: 2,
    },
    cardTitle: {
        fontSize: FONT_SIZES.m,
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: SPACING.m,
    },
    chartContainer: {
        gap: SPACING.m,
        marginBottom: SPACING.m,
    },
    progressContainer: {
        width: '100%',
    },
    labelRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: SPACING.xs,
    },
    label: {
        fontSize: FONT_SIZES.s,
        fontWeight: '500',
        color: COLORS.textSecondary,
    },
    count: {
        fontSize: FONT_SIZES.s,
        color: COLORS.textSecondary,
    },
    track: {
        height: 8,
        backgroundColor: COLORS.background,
        borderRadius: 4,
        overflow: 'hidden',
    },
    fill: {
        height: '100%',
        borderRadius: 4,
    },
    legendContainer: {
        flexDirection: 'row',
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        paddingTop: SPACING.m,
        gap: SPACING.m,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.xs,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    legendText: {
        fontSize: FONT_SIZES.xs,
        color: COLORS.textSecondary,
    },
});
