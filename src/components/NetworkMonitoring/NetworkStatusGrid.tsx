
import React from 'react';
import { View, Text, StyleSheet, FlatList, Dimensions } from 'react-native';
import { CCTVDevice } from '../../types/cctv';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZES } from '../../constants/theme';
import { Wifi, WifiOff, MapPin, Activity, Clock, Server } from 'lucide-react-native';

interface NetworkStatusGridProps {
    devices: CCTVDevice[];
    onRefresh?: () => void;
    isRefreshing?: boolean;
    ListHeaderComponent?: React.ComponentType<any> | React.ReactElement | null | undefined;
}

export const NetworkStatusGrid: React.FC<NetworkStatusGridProps> = ({
    devices,
    onRefresh,
    isRefreshing,
    ListHeaderComponent
}) => {

    const renderItem = ({ item }: { item: CCTVDevice }) => {
        const isOnline = item.isReachable;
        const statusColor = isOnline ? COLORS.success : COLORS.error;

        let latencyColor = COLORS.textSecondary;
        if (item.pingResponseTime && item.pingResponseTime > 300) latencyColor = COLORS.warning;
        if (item.pingResponseTime && item.pingResponseTime > 1000) latencyColor = COLORS.error;

        // Uptime Progress Bar Calculation
        const uptime = item.up_time || 0;
        const uptimeColor = uptime >= 95 ? COLORS.success : uptime >= 85 ? COLORS.primary : uptime >= 70 ? COLORS.warning : COLORS.error;

        return (
            <View style={styles.card}>
                {/* Header: Name and Status Badge */}
                <View style={styles.cardHeader}>
                    <View style={styles.titleContainer}>
                        <Text style={styles.deviceName} numberOfLines={1}>{item.cctv_name}</Text>
                        <Text style={styles.deviceId}>ID: {item.cctv_serial_number}</Text>
                    </View>
                    <View style={[styles.badge, { backgroundColor: isOnline ? '#dcfce7' : '#fee2e2' }]}>
                        <Text style={[styles.badgeText, { color: statusColor }]}>
                            {isOnline ? 'Online' : 'Offline'}
                        </Text>
                    </View>
                </View>

                {/* Body: Location, IP, Uptime, Last Seen */}
                <View style={styles.cardBody}>
                    <View style={styles.infoRow}>
                        <MapPin size={12} color={COLORS.textSecondary} />
                        <Text style={styles.infoLabel}>Location:</Text>
                        <Text style={styles.infoValue} numberOfLines={1}>{item.cctv_location_address || 'N/A'}</Text>
                    </View>

                    <View style={styles.infoRow}>
                        <Server size={12} color={COLORS.textSecondary} />
                        <Text style={styles.infoLabel}>IP / Port:</Text>
                        <Text style={styles.infoValue}>{item.cctv_ip_port || item.ip_address || 'N/A'}</Text>
                    </View>

                    <View style={styles.infoRow}>
                        <Clock size={12} color={COLORS.textSecondary} />
                        <Text style={styles.infoLabel}>Last Seen:</Text>
                        <Text style={styles.infoValue}>{item.lastSeen ? new Date(item.lastSeen).toLocaleString() : 'N/A'}</Text>
                    </View>

                    {/* Uptime Section with Progress Bar */}
                    <View style={styles.uptimeContainer}>
                        <View style={styles.uptimeHeader}>
                            <Text style={styles.uptimeLabel}>Uptime</Text>
                            <Text style={[styles.uptimeValue, { color: uptimeColor }]}>{uptime}%</Text>
                        </View>
                        <View style={styles.progressBarBg}>
                            <View style={[styles.progressBarFill, { width: `${uptime}%`, backgroundColor: uptimeColor }]} />
                        </View>
                    </View>
                </View>

                {/* Footer: Reachability and Latency */}
                <View style={styles.cardFooter}>
                    <View style={styles.footerItem}>
                        {isOnline ? <Wifi size={14} color={COLORS.success} /> : <WifiOff size={14} color={COLORS.error} />}
                        <Text style={[styles.footerText, { color: statusColor }]}>
                            {isOnline ? 'Reachable' : 'Unreachable'}
                        </Text>
                    </View>

                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <FlatList
                data={devices}
                renderItem={renderItem}
                keyExtractor={(item, index) => `${item.cctv_id || 'camera'}-${index}`}
                contentContainerStyle={styles.listContent}
                refreshing={isRefreshing}
                onRefresh={onRefresh}
                ListHeaderComponent={ListHeaderComponent}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No devices found to monitor.</Text>
                    </View>
                }
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    listContent: {
        padding: SPACING.m,
        paddingBottom: SPACING.xl,
    },
    card: {
        backgroundColor: COLORS.surface,
        borderRadius: BORDER_RADIUS.m,
        marginBottom: SPACING.m,
        padding: SPACING.m,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: SPACING.s,
    },
    titleContainer: {
        flex: 1,
        marginRight: SPACING.s,
    },
    deviceName: {
        fontSize: FONT_SIZES.m,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
    },
    deviceId: {
        fontSize: 10,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    badge: {
        paddingVertical: 2,
        paddingHorizontal: SPACING.s,
        borderRadius: BORDER_RADIUS.full,
    },
    badgeText: {
        fontSize: 10,
        fontWeight: 'bold',
    },
    cardBody: {
        gap: 8,
        paddingVertical: SPACING.s,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: COLORS.border,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.s,
    },
    infoLabel: {
        width: 70,
        fontSize: FONT_SIZES.xs,
        color: COLORS.textSecondary,
    },
    infoValue: {
        flex: 1,
        fontSize: FONT_SIZES.xs,
        color: COLORS.textPrimary,
        fontWeight: '500',
    },
    uptimeContainer: {
        marginTop: SPACING.xs,
    },
    uptimeHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    uptimeLabel: {
        fontSize: 10,
        color: COLORS.textSecondary,
        textTransform: 'uppercase',
        fontWeight: '600',
    },
    uptimeValue: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    progressBarBg: {
        height: 6,
        backgroundColor: '#e2e8f0',
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 3,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: SPACING.s,
    },
    footerItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    footerText: {
        fontSize: 10,
        fontWeight: '600',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: SPACING.xl,
    },
    emptyText: {
        color: COLORS.textSecondary,
        fontSize: FONT_SIZES.m,
    }
});
