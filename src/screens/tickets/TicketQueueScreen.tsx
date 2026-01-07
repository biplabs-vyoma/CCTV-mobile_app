import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, RefreshControl } from 'react-native';
import { TicketList } from '../../components/Tickets/TicketList';
import { TicketFilters } from '../../components/Tickets/TicketFilters';
import { CreateTicketModal } from '../../components/Tickets/CreateTicketModal';
import { TicketDetailsModal } from '../../components/Tickets/TicketDetailsModal';

import { useAuth } from '../../context/AuthContext';
import { Plus, Upload, Download, AlertTriangle, Clock, Activity } from 'lucide-react-native';
import { Ticket } from '../../types/ticket';
import { callAPIWithEnc } from '../../apis/common/api';
import { COLORS } from '../../constants/theme';
import { useNavigation, useRoute } from '@react-navigation/native';

const getTodayDateDMY = () => {
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = today.getFullYear();
    return `${day}-${month}-${year}`;
};

const convertDMYtoYMD = (dateString: string) => {
    if (!dateString) return null;
    const parts = dateString.split('-');
    if (parts.length !== 3) return dateString; // Fallback if format is unexpected
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
};

export const TicketQueueScreen: React.FC = () => {
    // @ts-ignore
    const { user } = useAuth();
    const navigation = useNavigation();
    const route = useRoute();

    // @ts-ignore
    const statusID = route.params?.sid;

    const [activeTab, setActiveTab] = useState<'details' | 'engineer' | 'status' | 'chat'>('details');
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [ticketRecentActivity, setTicketRecentActivity] = useState<any>(null); // Initialize as null or []
    const [ticketDescAndTimelineInfo, setTicketDescAndTimelineInfo] = useState<any>(null);
    const [refreshing, setRefreshing] = useState(false);

    const [filters, setFilters] = useState({
        status_id: '0',
        priority_id: '0',
        vendor_id: '0',
        status_name: '',
        priority_name: '',
        vendor_id: '',
        search: '',
        start_date: '',
        end_date: '',
    });

    const fetchGetTicketDetailsListByUser = useCallback(async () => {
        try {
            if (!refreshing) setIsLoading(true);

            const payload = {
                user_id: Number(user?.user_id),
                user_type_id: Number(user?.user_type_id),
                status_id: filters.status_id,
                priority_id: filters.priority_id,
                vendor_id: filters.vendor_id,
                start_date: filters.start_date,
                end_date: filters.end_date,
            };

            console.log('Payload:', JSON.stringify(payload, null, 2));

            const response = await callAPIWithEnc(
                'user/getTicketDetailsListByUser',
                'POST',
                payload
            );

            console.log('=== API RESPONSE ===');
            console.log('Status:', response?.status);
            console.log('Message:', response?.message);
            console.log('Data:', JSON.stringify(response?.data, null, 2));

            let rawData = response?.data;
            if (typeof rawData === "string") {
                try {
                    rawData = JSON.parse(rawData);
                } catch (e) {
                    console.error("Failed to parse ticket data:", e);
                    rawData = null;
                }
            }

            console.log('Parsed Tickets Count:', rawData?.length || 0);
            setTicketRecentActivity(rawData || []);

        } catch (error) {
            console.error('API Error:', error);
            setTicketRecentActivity([]);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    }, [user, filters]);

    useEffect(() => {
        if (statusID && statusID !== filters.status_id) {
            setFilters((prevFilters) => ({
                ...prevFilters,
                status_id: statusID,
            }));
        }
    }, [statusID]);

    useEffect(() => {
        // Initial fetch on mount
        fetchGetTicketDetailsListByUser();
    }, []); // Empty dependency pattern for initial load only

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchGetTicketDetailsListByUser();
    }, [fetchGetTicketDetailsListByUser]);

    const filteredTickets = useMemo(() => {
        const list = ticketRecentActivity || [];

        // Don't show any tickets if no status is selected
        if (!filters.status_id || filters.status_id === '0') {
            return [];
        }

        return list.filter((ticket: any) => {
            // Handle key name from payload: ticket_status
            if (filters.status_id !== '0' && String(ticket.ticket_status) !== String(filters.status_id))
                return false;

            // Handle key name from payload: severity_id
            if (filters.priority_id !== '0' && String(ticket.severity_id) !== String(filters.priority_id))
                return false;
            if (filters.search) {
                const searchLower = filters.search.toLowerCase();
                const ticketNo = (ticket.ticket_number || "").toLowerCase();
                const cctvName = (ticket.cctv_name || "").toLowerCase();
                if (!ticketNo.includes(searchLower) && !cctvName.includes(searchLower))
                    return false;
            }
            return true;
        });
    }, [ticketRecentActivity, filters]);

    const handleUpdateTicket = () => {
        fetchGetTicketDetailsListByUser();
    };

    const stats = useMemo(() => {
        const list = ticketRecentActivity || [];
        // Helper to safely access severity_id/ticket_status if API differs
        return {
            criticalTickets: list.filter(
                (t: any) => String(t?.severity_id) === '4' && String(t.ticket_status) !== '10'
            ).length,
            totalTicketsCount: list.length,
            overdueTickets: list.filter(
                (t: any) => t?.slaBreached && String(t.ticket_status) !== '10'
            ).length,
            unassignedTickets: list.filter(
                (t: any) => String(t?.ticket_status) === '20'
            ).length,
        };
    }, [ticketRecentActivity]);

    console.log('Calculated Stats:', stats);

    const { criticalTickets, totalTicketsCount, overdueTickets, unassignedTickets } = stats;

    const getPageTitle = () => {
        switch (user?.user_type_id) {
            case 10: return 'My Tickets';
            case 40: return 'Ticket Queue';
            default: return 'All Tickets';
        }
    };

    const onTicketClick = (ticket: Ticket) => {
        const getTicketTimelineInfo = async () => {
            try {
                const response = await callAPIWithEnc(
                    `user/getTicketTimelineInfo`,
                    'POST',
                    {
                        ticket_id: Number(ticket?.ticket_id),
                        user_id: Number(user?.user_id),
                        user_type_id: Number(user?.user_type_id),
                    }
                );
                setTicketDescAndTimelineInfo(response?.data);
            } catch (e) { console.log(e); }
        };

        setSelectedTicket(ticket);
        getTicketTimelineInfo();
    };

    const showStats = user?.user_type_id === 20 || user?.user_type_id === 100 || user?.user_type_id === 40;

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.headerTitle}>{getPageTitle()}</Text>
                </View>
                <View style={styles.actionButtons}>
                    {user?.user_type_id === 10 && (
                        <TouchableOpacity
                            onPress={() => setShowCreateModal(true)}
                            style={styles.createButton}
                        >
                            <Plus color="#FFF" size={20} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Stats Cards */}
            {showStats && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsRow} contentContainerStyle={{ paddingHorizontal: 16 }}>
                    <View style={[styles.statCard, { backgroundColor: '#f0f9ff', borderColor: '#e0f2fe' }]}>
                        <View style={styles.statIconContainer}>
                            <Activity size={24} color="#0284c7" />
                        </View>
                        <Text style={[styles.statValue, { color: '#0284c7' }]}>{totalTicketsCount}</Text>
                        <Text style={[styles.statLabel, { color: '#0369a1' }]}>Total</Text>
                    </View>

                    <View style={[styles.statCard, { backgroundColor: '#fef2f2', borderColor: '#fee2e2' }]}>
                        <View style={styles.statIconContainer}>
                            <AlertTriangle size={24} color="#dc2626" />
                        </View>
                        <Text style={[styles.statValue, { color: '#dc2626' }]}>{criticalTickets}</Text>
                        <Text style={[styles.statLabel, { color: '#991b1b' }]}>Critical</Text>
                    </View>

                    <View style={[styles.statCard, { backgroundColor: '#fff7ed', borderColor: '#ffedd5' }]}>
                        <View style={styles.statIconContainer}>
                            <Clock size={24} color="#ea580c" />
                        </View>
                        <Text style={[styles.statValue, { color: '#ea580c' }]}>{overdueTickets}</Text>
                        <Text style={[styles.statLabel, { color: '#9a3412' }]}>Overdue</Text>
                    </View>

                    <View style={[styles.statCard, { backgroundColor: '#fefce8', borderColor: '#fef9c3' }]}>
                        <View style={styles.statIconContainer}>
                            <Activity size={24} color="#ca8a04" />
                        </View>
                        <Text style={[styles.statValue, { color: '#ca8a04' }]}>{unassignedTickets}</Text>
                        <Text style={[styles.statLabel, { color: '#854d0e' }]}>Unassigned</Text>
                    </View>
                </ScrollView>
            )}

            {/* Filters */}
            <TicketFilters
                filters={filters}
                onFilterChange={setFilters}
                onSearch={fetchGetTicketDetailsListByUser}
                totalTickets={filteredTickets?.length || 0}
            />

            {/* Ticket List with Pull to Refresh */}
            <TicketList
                tickets={filteredTickets}
                onTicketClick={onTicketClick}
                isLoading={isLoading && !refreshing}
                refreshing={refreshing}
                onRefresh={onRefresh}
            />

            {showCreateModal && (
                <CreateTicketModal
                    onClose={() => setShowCreateModal(false)}
                    onSubmit={(newTicket: any) => {
                        setTickets([newTicket, ...tickets]); // Optimistic update
                        setShowCreateModal(false);
                        onRefresh();
                    }}
                />
            )}

            {selectedTicket && (
                <TicketDetailsModal
                    ticket={selectedTicket}
                    onClose={() => setSelectedTicket(null)}
                    onUpdate={handleUpdateTicket}
                    userRole={user?.user_type_name || 'client'}
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    ticketComments={ticketDescAndTimelineInfo}
                />
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        padding: 16,
        paddingVertical: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    createButton: {
        backgroundColor: COLORS.primary,
        padding: 8,
        borderRadius: 8,
    },
    scrollContent: {
        flexGrow: 1,
    },
    statsRow: {
        marginVertical: 16,
    },
    statCard: {
        width: 120,
        padding: 12,
        borderRadius: 12,
        marginRight: 12,
        borderWidth: 1,
        alignItems: 'flex-start',
    },
    statIconContainer: {
        marginBottom: 8,
    },
    statValue: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 2,
    },
    statLabel: {
        fontSize: 12,
        fontWeight: '500',
    },
    contentSection: {
        flex: 1,
    }
});
