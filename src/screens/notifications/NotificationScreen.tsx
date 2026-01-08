import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { Bell, Info, Clock, CheckCircle, Check, CheckCheck } from 'lucide-react-native';
import { COLORS } from '../../constants/theme';
import { callAPIWithEnc } from '../../apis/common/api';
import { useAuth } from '../../context/AuthContext';
import { useNavigation, useIsFocused } from '@react-navigation/native';

// API response structure
interface ApiNotification {
    notification_id: string;
    ntotification_text: string | null;
    status_change_date: string;
    is_seen: string;
    notification_seen_date: string | null;
    ticket_number: string;
}

// UI structure
interface Alert {
    id: string;
    title: string;
    message: string;
    createdAt: Date;
    isRead: boolean;
    isResolved: boolean;
    severity: 'low' | 'medium' | 'high' | 'critical';
    type: string;
    ticketId?: string;
    status_id: string;
    status: string;
    ticket_number: string;
    ticket_date: string;
}

export const NotificationScreen = () => {
    // @ts-ignore
    const { user } = useAuth();
    const navigation = useNavigation();
    const isFocused = useIsFocused();
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [filter, setFilter] = useState<'all' | 'unread'>('all');

    const fetchAlerts = useCallback(async (showLoading = true) => {
        try {
            if (showLoading) setLoading(true);

            const response = await callAPIWithEnc('vendor/getNotificationDetails', 'POST', {
                user_id: user?.user_id,
                user_type_id: user?.user_type_id,
                vendor_id: user?.vendor_id,
            });

            const apiData: ApiNotification[] = Array.isArray(response)
                ? response
                : (response as any)?.data || [];

            const mappedAlerts: Alert[] = apiData
                .filter((item) => {
                    const userTypeId = String(user?.user_type_id || '');
                    if (userTypeId == '20' || userTypeId == '40') {
                        return (
                            item?.ntotification_text?.includes('Open') ||
                            item?.ntotification_text?.includes('In Progress') ||
                            item?.ntotification_text?.includes('Close')
                        );
                    } else if (userTypeId == '30') {
                        return (
                            item?.ntotification_text?.includes('Assigned') ||
                            item?.ntotification_text?.includes('Resloved')
                        );
                    } else if (userTypeId == '10') {
                        return item?.ntotification_text?.includes('Resloved');
                    }
                    return true;
                })
                .map((item) => {
                    const dateStr = item.status_change_date.replace(' ', 'T');

                    let title = 'System Notification';
                    let message = 'New status update available';
                    let severity: Alert['severity'] = 'low';

                    const userTypeId = String(user?.user_type_id || '');
                    if (userTypeId == '20' || userTypeId == '40') {
                        if (item.ntotification_text?.includes('Open')) {
                            title = `New Ticket Created\nTicket no. ${item.ticket_number}`;
                            message = 'Police Officer has opened a ticket.';
                            severity = 'medium';
                        }
                        if (item.ntotification_text?.includes('In Progress')) {
                            title = `Ticket Resolved by field engineer\nTicket No. ${item.ticket_number}`;
                            message = 'Camera has been fixed from field engineer end.';
                            severity = 'low';
                        }
                        if (item.ntotification_text?.includes('Close')) {
                            title = `Ticket Closed\nTicket No. ${item.ticket_number}`;
                            message = 'Police Officer has closed a ticket.';
                            severity = 'critical';
                        }
                    } else if (userTypeId == '30') {
                        if (item.ntotification_text?.includes('Assigned')) {
                            title = `Ticket assigned to you\nTicket No. ${item.ticket_number}`;
                            message = 'Ticket has been assigned to you. Please fix this camera.';
                            severity = 'high';
                        }
                        if (item.ntotification_text?.includes('Resloved')) {
                            title = `Ticket Resolved\nTicket No. ${item.ticket_number}`;
                            message = 'Vendor/Helpdesk has resolved a ticket.';
                            severity = 'low';
                        }
                    } else if (userTypeId == '10') {
                        if (item.ntotification_text?.includes('Resloved')) {
                            title = `Ticket Resolved\nTicket No. ${item.ticket_number}`;
                            message = 'Vendor/Helpdesk has resolved a ticket.';
                            severity = 'low';
                        }
                    } else if (item.ntotification_text) {
                        title = `Ticket Status: ${item.ntotification_text}`;
                        message = `The status has been updated to "${item.ntotification_text}"`;

                        const text = item.ntotification_text.toLowerCase();
                        if (text.includes('assigned')) severity = 'medium';
                        else if (text.includes('progress')) severity = 'high';
                    }

                    return {
                        id: item.notification_id,
                        title,
                        message,
                        createdAt: new Date(dateStr),
                        isRead: item.is_seen === '1',
                        isResolved: false,
                        severity,
                        type: 'status_change',
                        ticketId: undefined,
                        status_id:
                            item.ntotification_text == 'Open'
                                ? '210'
                                : item.ntotification_text == 'Assigned'
                                    ? '220'
                                    : item.ntotification_text == 'In Progress'
                                        ? '230'
                                        : item.ntotification_text == 'Resloved'
                                            ? '240'
                                            : item.ntotification_text == 'Close'
                                                ? '250'
                                                : '0',
                        status: item.ntotification_text || '',
                        ticket_number: item.ticket_number,
                        ticket_date: (() => {
                            const datePart = item.status_change_date.split(' ')[0];
                            const parts = datePart.split('-');
                            if (parts.length === 3) {
                                // Convert YYYY-MM-DD to DD-MM-YYYY
                                return `${parts[2]}-${parts[1]}-${parts[0]}`;
                            }
                            return datePart;
                        })(),
                    };
                });

            mappedAlerts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

            setAlerts(mappedAlerts);
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [user]);

    useEffect(() => {
        if (isFocused) {
            fetchAlerts(true);
        }
    }, [isFocused, fetchAlerts]);

    const notificationSeen = async (alertId: string) => {
        try {
            await callAPIWithEnc('vendor/updatenotificationSeen', 'POST', {
                notification_id: parseInt(alertId),
                user_id: user?.user_id,
                user_type_id: user?.user_type_id,
            });
            // After marking as seen, optionally update local state to avoid refetch
            setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, isRead: true } : a));
        } catch (error) {
            console.error('Failed to mark notification as seen:', error);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchAlerts(false);
    };

    const unreadAlerts = alerts.filter((alert) => !alert.isRead);

    useEffect(() => {
        if (!unreadAlerts || unreadAlerts.length === 0) return;

        const markAllAsSeen = async () => {
            try {
                await Promise.all(
                    unreadAlerts.map(alert => notificationSeen(alert.id))
                );
            } catch (error) {
                console.error("Failed to mark notifications as seen", error);
            }
        };

        markAllAsSeen();
    }, [unreadAlerts]);

    const filteredAlerts = alerts.filter((alert) => {
        if (filter === 'unread') return !alert.isRead;
        return true;
    });

    const getSeverityColor = (severity: string) => {
        const colors = {
            low: { bg: '#f3f4f6', text: '#1f2937', border: '#e5e7eb' },
            medium: { bg: '#dbeafe', text: '#1e40af', border: '#bfdbfe' },
            high: { bg: '#fed7aa', text: '#9a3412', border: '#fdba74' },
            critical: { bg: '#fee2e2', text: '#991b1b', border: '#fecaca' },
        };
        return colors[severity as keyof typeof colors] || colors.low;
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'status_change':
                return Info;
            case 'overdue':
                return Clock;
            default:
                return Bell;
        }
    };

    const formatTime = (date: Date) => {
        if (!date) return '';
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / (1000 * 60));

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        return date.toLocaleDateString();
    };

    const handleAlertPress = async (alert: Alert) => {
        // Mark as seen if unread
        if (!alert.isRead) {
            await notificationSeen(alert.id);
        }

        // Navigate to tickets screen with status filter
        // @ts-ignore
        navigation.navigate('Tickets', {
            sid: alert.status_id,
            ticketNumber: alert.ticket_number,
            ticketDate: alert.ticket_date,
        });
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <Bell size={20} color={COLORS?.primary || '#2563eb'} />
                    <Text style={styles.headerTitle}>Notifications</Text>
                    {unreadAlerts.length > 0 && (
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>{unreadAlerts.length}</Text>
                        </View>
                    )}
                </View>
            </View>

            {/* Filters */}
            <View style={styles.filterContainer}>
                <TouchableOpacity
                    style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
                    onPress={() => setFilter('all')}
                >
                    <Text
                        style={[
                            styles.filterButtonText,
                            filter === 'all' && styles.filterButtonTextActive,
                        ]}
                    >
                        All
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.filterButton, filter === 'unread' && styles.filterButtonActive]}
                    onPress={() => setFilter('unread')}
                >
                    <Text
                        style={[
                            styles.filterButtonText,
                            filter === 'unread' && styles.filterButtonTextActive,
                        ]}
                    >
                        Unread
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Alerts List */}
            <ScrollView
                style={styles.scrollView}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                {loading && !refreshing ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={COLORS?.primary || '#2563eb'} />
                        <Text style={styles.loadingText}>Loading notifications...</Text>
                    </View>
                ) : filteredAlerts.length === 0 ? (
                    <View style={styles.emptyState}>
                        <CheckCircle size={48} color="#10b981" />
                        <Text style={styles.emptyText}>No alerts to show</Text>
                    </View>
                ) : (
                    <View style={styles.alertsList}>
                        {filteredAlerts.map((alert, index) => {
                            const Icon = getTypeIcon(alert.type);
                            const severityColor = getSeverityColor(alert.severity);

                            return (
                                <TouchableOpacity
                                    key={index}
                                    style={[
                                        styles.alertItem,
                                        !alert.isRead && styles.alertItemUnread,
                                        alert.isResolved && styles.alertItemResolved,
                                    ]}
                                    onPress={() => handleAlertPress(alert)}
                                >
                                    <View style={styles.alertContent}>
                                        <View
                                            style={[
                                                styles.iconContainer,
                                                { backgroundColor: severityColor.bg },
                                            ]}
                                        >
                                            <Icon size={16} color={severityColor.text} />
                                        </View>
                                        <View style={styles.alertTextContainer}>
                                            <View style={styles.alertHeader}>
                                                <Text style={styles.alertTitle}>{alert.title}</Text>
                                                <View
                                                    style={[
                                                        styles.statusBadge,
                                                        { backgroundColor: severityColor.bg },
                                                    ]}
                                                >
                                                    <Text
                                                        style={[
                                                            styles.statusBadgeText,
                                                            { color: severityColor.text },
                                                        ]}
                                                    >
                                                        {alert.status}
                                                    </Text>
                                                </View>
                                            </View>
                                            <Text style={styles.alertMessage}>{alert.message}</Text>
                                            <View style={styles.alertFooter}>
                                                <View style={styles.footerLeft}>
                                                    <Text style={styles.alertTime}>
                                                        {formatTime(alert.createdAt)}
                                                    </Text>
                                                    <View style={styles.seenIndicator}>
                                                        {alert.isRead ? (
                                                            <View style={styles.seenStatusBadge}>
                                                                <CheckCheck size={12} color="#38bdf8" />
                                                                <Text style={[styles.seenStatusText, { color: '#6b7280' }]}>Seen</Text>
                                                            </View>
                                                        ) : (
                                                            <View style={styles.seenStatusBadge}>
                                                                <CheckCheck size={12} color="#6b7280" />
                                                                <Text style={[styles.seenStatusText, { color: '#6b7280' }]}>Unread</Text>
                                                            </View>
                                                        )}
                                                    </View>
                                                </View>
                                                {alert.isResolved && (
                                                    <Text style={styles.resolvedText}>Resolved</Text>
                                                )}
                                            </View>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                )}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS?.background || '#f9fafb',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: COLORS?.border || '#e5e7eb',
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS?.text || '#1f2937',
    },
    badge: {
        backgroundColor: '#ef4444',
        borderRadius: 12,
        paddingHorizontal: 8,
        paddingVertical: 2,
        minWidth: 20,
        alignItems: 'center',
    },
    badgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    filterContainer: {
        flexDirection: 'row',
        gap: 8,
        padding: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: COLORS?.border || '#e5e7eb',
    },
    filterButton: {
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 20,
        backgroundColor: '#f3f4f6',
    },
    filterButtonActive: {
        backgroundColor: COLORS?.primary || '#2563eb',
    },
    filterButtonText: {
        fontSize: 14,
        color: '#6b7280',
    },
    filterButtonTextActive: {
        color: '#fff',
        fontWeight: '500',
    },
    scrollView: {
        flex: 1,
    },
    loadingContainer: {
        padding: 32,
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        color: COLORS?.textSecondary || '#6b7280',
    },
    emptyState: {
        padding: 32,
        alignItems: 'center',
    },
    emptyText: {
        marginTop: 12,
        color: COLORS?.textSecondary || '#6b7280',
    },
    alertsList: {
        paddingBottom: 16,
    },
    alertItem: {
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
        padding: 16,
    },
    alertItemUnread: {
        backgroundColor: '#eff6ff',
    },
    alertItemResolved: {
        opacity: 0.6,
    },
    alertContent: {
        flexDirection: 'row',
        gap: 12,
    },
    iconContainer: {
        width: 36,
        height: 36,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    alertTextContainer: {
        flex: 1,
    },
    alertHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 4,
    },
    alertTitle: {
        fontSize: 14,
        fontWeight: '500',
        color: COLORS?.text || '#1f2937',
        flex: 1,
        marginRight: 8,
    },
    alertMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
    },
    statusBadgeText: {
        fontSize: 11,
        fontWeight: '500',
    },
    seenIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    seenStatusBadge: {
        padding: 4,
        borderRadius: 4,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
    },
    seenStatusText: {
        fontSize: 11,
        fontWeight: '500',
    },
    alertMessage: {
        fontSize: 13,
        color: COLORS?.textSecondary || '#6b7280',
        marginTop: 2,
    },
    alertFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 8,
    },
    footerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    alertTime: {
        fontSize: 12,
        color: COLORS?.textSecondary || '#9ca3af',
    },
    resolvedText: {
        fontSize: 12,
        color: '#10b981',
        fontWeight: '500',
    },
});
