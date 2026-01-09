import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../../constants/theme';
import { DashboardStats } from '../../types/dashboard';

interface CCTVStatusChartProps {
    stats: DashboardStats;
}

export const CCTVStatusChart: React.FC<CCTVStatusChartProps> = ({ stats }) => {
    // Repurpose: Online as Resolve, Offline as Assigned
    const resolveCount = stats.total_inprogress_ticket || 0;
    const assignedCount = stats.total_assigned_ticket || 0;

    const total = (resolveCount + assignedCount) || 1;

    const resolvePercent = (resolveCount / total) * 100;
    const assignedPercent = (assignedCount / total) * 100;

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
            <Text style={styles.cardTitle}>Ticket Status Distribution</Text>

            <View style={styles.chartContainer}>
                {renderProgressBar('Resolve', resolveCount, resolvePercent, '#22c55e')}
                {renderProgressBar('Assigned', assignedCount, assignedPercent, '#3b82f6')}
            </View>

            <View style={styles.legendContainer}>
                <View style={styles.legendItem}>
                    <View style={[styles.dot, { backgroundColor: '#22c55e' }]} />
                    <Text style={styles.legendText}>Resolve</Text>
                </View>
                <View style={styles.legendItem}>
                    <View style={[styles.dot, { backgroundColor: '#3b82f6' }]} />
                    <Text style={styles.legendText}>Assigned</Text>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: COLORS?.surface || '#fff',
        borderRadius: BORDER_RADIUS.m,
        padding: SPACING.m,
        marginBottom: SPACING.m,
        borderWidth: 1,
        borderColor: COLORS?.border || '#ccc',
        elevation: 2,
    },
    cardTitle: {
        fontSize: FONT_SIZES.m,
        fontWeight: '700',
        color: COLORS?.text || '#000',
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
        backgroundColor: COLORS?.background || '#f1f5f9',
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
        borderTopColor: COLORS?.border || '#ccc',
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
