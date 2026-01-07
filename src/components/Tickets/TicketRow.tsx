import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Calendar, Eye, Activity } from 'lucide-react-native';
import { Ticket } from '../../types/Ticket';
import { COLORS } from '../../constants/theme';

interface TicketRowProps {
    ticket: Ticket;
    onClick?: () => void;
    user_type_id: any;
}

const getStatusColor = (statusId: string) => {
    switch (statusId) {
        case '210': return { bg: '#e0f2fe', text: '#0369a1' }; // Blue
        case '220': return { bg: '#f3e8ff', text: '#7e22ce' }; // Purple
        case '230': return { bg: '#fef9c3', text: '#854d0e' }; // Yellow
        case '240': return { bg: '#dcfce7', text: '#15803d' }; // Green
        default: return { bg: '#f3f4f6', text: '#1f2937' }; // Gray
    }
};

const getPriorityColor = (priorityName: string) => {
    const p = priorityName?.split(' ')[0]?.toLowerCase();
    switch (p) {
        case 'critical': return { bg: '#fee2e2', text: '#991b1b' };
        case 'high': return { bg: '#ffedd5', text: '#9a3412' };
        case 'medium': return { bg: '#fef9c3', text: '#854d0e' };
        default: return { bg: '#f3f4f6', text: '#1f2937' };
    }
};

export const TicketRow: React.FC<TicketRowProps> = ({ ticket, onClick, user_type_id }) => {
    const statusColor = getStatusColor(ticket.ticket_status);
    const priorityColor = getPriorityColor(ticket.severity_name);

    return (
        <TouchableOpacity onPress={onClick} activeOpacity={0.7}>
            <View style={styles.card}>
                <View style={styles.headerRow}>
                    <Text style={styles.ticketId}>{ticket.ticket_number}</Text>
                    <View style={[styles.badge, { backgroundColor: statusColor.bg }]}>
                        <Text style={[styles.badgeText, { color: statusColor.text }]}>
                            {ticket.ticket_status_text}
                        </Text>
                    </View>
                </View>

                <View style={styles.contentRow}>
                    <View style={styles.infoColumn}>
                        <Text style={styles.cctvName}>{ticket.cctv_name}</Text>
                        <Text style={styles.address} numberOfLines={2}>{ticket.cctv_location_address}</Text>
                        <Text style={styles.serial}>{ticket.cctv_serial_number}</Text>
                    </View>
                </View>

                <View style={styles.footerRow}>
                    <View style={[styles.badge, { backgroundColor: priorityColor.bg, marginRight: 8 }]}>
                        <Text style={[styles.badgeText, { color: priorityColor.text }]}>
                            {ticket.severity_name?.split(' ')[0]}
                        </Text>
                    </View>

                    <View style={styles.dateContainer}>
                        <Calendar size={12} color={COLORS?.textSecondary || '#666'} style={{ marginRight: 4 }} />
                        <Text style={styles.dateText}>{ticket.ticket_creaton}</Text>
                    </View>
                </View>

                {ticket.escalationLevel > 0 && (
                    <View style={styles.escalationRow}>
                        <Activity size={12} color="#dc2626" />
                        <Text style={styles.escalationText}>Escalated (Level {ticket.escalationLevel})</Text>
                    </View>
                )}
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: COLORS?.surface || '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
        borderWidth: 1,
        borderColor: COLORS?.border || '#ccc',
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    ticketId: {
        fontSize: 14,
        fontWeight: 'bold',
        color: COLORS?.primary || '#2563eb' || '#000',
        fontFamily: 'monospace',
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    badgeText: {
        fontSize: 10,
        fontWeight: '600',
        textTransform: 'capitalize',
    },
    contentRow: {
        marginBottom: 12,
    },
    infoColumn: {
        flex: 1,
    },
    cctvName: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS?.text || '#000',
        marginBottom: 4,
    },
    address: {
        fontSize: 13,
        color: COLORS?.textSecondary || '#666',
        marginBottom: 2,
    },
    serial: {
        fontSize: 12,
        color: COLORS?.textSecondary || '#666',
        fontFamily: 'monospace',
    },
    footerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
    },
    dateContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 'auto',
    },
    dateText: {
        fontSize: 12,
        color: COLORS?.textSecondary || '#666',
    },
    escalationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
        gap: 4
    },
    escalationText: {
        fontSize: 12,
        color: '#dc2626',
        fontWeight: '500'
    }
});
