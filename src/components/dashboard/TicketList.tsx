import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Clock, AlertCircle, User as UserIcon } from 'lucide-react-native';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../../constants/theme';
import { TicketApiResponse, Ticket } from '../../types/dashboard';

interface TicketListProps {
    tickets: TicketApiResponse[];
}

const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
        case 'open': return { bg: '#fee2e2', text: '#991b1b' };
        case 'assigned': return { bg: '#fef9c3', text: '#854d0e' };
        case 'in_progress': return { bg: '#dbeafe', text: '#1e40af' };
        case 'resolved': return { bg: '#dcfce7', text: '#166534' };
        default: return { bg: '#f3f4f6', text: '#374151' };
    }
};

const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase().split(" ")[0]) {
        case 'low': return { bg: '#f3f4f6', text: '#374151' };
        case 'medium': return { bg: '#fef9c3', text: '#854d0e' };
        case 'high': return { bg: '#ffedd5', text: '#9a3412' };
        case 'critical': return { bg: '#fee2e2', text: '#991b1b' };
        default: return { bg: '#f3f4f6', text: '#374151' };
    }
};

const formatTime = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) return `${hours}h ${minutes % 60}m ago`;
    return `${minutes}m ago`;
};

export const TicketList: React.FC<TicketListProps> = ({ tickets }) => {
    if (!tickets || tickets.length === 0) {
        return (
            <View style={styles.card}>
                <Text style={styles.cardTitle}>Recent Ticket Activity</Text>
                <Text style={styles.emptyText}>No recent tickets found.</Text>
            </View>
        );
    }

    return (
        <View style={styles.card}>
            <Text style={styles.cardTitle}>Recent Ticket Activity</Text>

            <View style={styles.listContainer}>
                {tickets.map((t, index) => {
                    const statusStyle = getStatusColor(t.ticket_status_text || '-');
                    const priorityStyle = getPriorityColor(t.severity_name || '-');
                    const isLast = index === tickets.length - 1;

                    return (
                        <View key={t.id || t.ticket_id || index} style={[styles.ticketItem, !isLast && styles.borderBottom]}>
                            {/* Top Row: ID, Priority, Status */}
                            <View style={styles.row}>
                                <View style={styles.idContainer}>
                                    <Text style={styles.ticketId}>{t.ticket_number}</Text>
                                </View>
                                <View style={styles.badges}>
                                    <View style={[styles.badge, { backgroundColor: priorityStyle.bg }]}>
                                        <Text style={[styles.badgeText, { color: priorityStyle.text }]}>
                                            {t.severity_name?.split(" ")[0] || '-'}
                                        </Text>
                                    </View>
                                    <View style={[styles.badge, { backgroundColor: statusStyle.bg }]}>
                                        <Text style={[styles.badgeText, { color: statusStyle.text }]}>
                                            {t.ticket_status_text?.replace('_', ' ') || '-'}
                                        </Text>
                                    </View>
                                </View>
                            </View>

                            {/* Main Content: Location, Issue */}
                            <View style={styles.content}>
                                <Text style={styles.cctvName}>{t.cctv_name}</Text>
                                <Text style={styles.location}>{t.cctv_location_address}</Text>
                                <Text style={styles.issue}>{t.incident_category_name?.replace('_', ' ')}</Text>
                            </View>

                            {/* Footer: Assigned To, Time */}
                            <View style={styles.footer}>
                                <View style={styles.footerItem}>
                                    <UserIcon size={14} color={COLORS.textSecondary} />
                                    <Text style={styles.footerText}>{t.assigned_to || 'Unassigned'}</Text>
                                </View>
                                <View style={styles.footerItem}>
                                    <Clock size={14} color={COLORS.textSecondary} />
                                    <Text style={styles.footerText}>{formatTime(t.ticket_creaton)}</Text>
                                </View>
                            </View>
                        </View>
                    );
                })}
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
        color: COLORS.text,
        marginBottom: SPACING.m,
    },
    emptyText: {
        color: COLORS.textSecondary,
        fontStyle: 'italic',
        textAlign: 'center',
        padding: SPACING.m,
    },
    listContainer: {
        gap: SPACING.m,
    },
    ticketItem: {
        paddingBottom: SPACING.m,
    },
    borderBottom: {
        borderBottomWidth: 1,
        borderBottomColor: COLORS?.border || '#ccc',
        marginBottom: SPACING.s,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.xs,
    },
    idContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    ticketId: {
        fontFamily: 'monospace',
        fontSize: FONT_SIZES.xs,
        fontWeight: '600',
        color: COLORS.text,
    },
    badges: {
        flexDirection: 'row',
        gap: SPACING.xs,
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
    },
    badgeText: {
        fontSize: 10,
        fontWeight: '600',
        textTransform: 'capitalize',
    },
    content: {
        marginBottom: SPACING.s,
    },
    cctvName: {
        fontSize: FONT_SIZES.s,
        fontWeight: '600',
        color: COLORS.text,
    },
    location: {
        fontSize: FONT_SIZES.xs,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    issue: {
        fontSize: FONT_SIZES.xs,
        color: COLORS.text,
        marginTop: 4,
        fontStyle: 'italic',
    },
    footer: {
        flexDirection: 'row',
        gap: SPACING.m,
    },
    footerItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    footerText: {
        fontSize: FONT_SIZES.xs,
        color: COLORS.textSecondary,
    },
});
