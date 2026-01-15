import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    SafeAreaView,
    RefreshControl,
    Platform,
    PermissionsAndroid,
    Alert
} from 'react-native';
import { TicketList } from '../../components/Tickets/TicketList';
import { TicketFilters } from '../../components/Tickets/TicketFilters';
import { CreateTicketModal } from '../../components/Tickets/CreateTicketModal';
import { TicketDetailsModal } from '../../components/Tickets/TicketDetailsModal';
import { CustomAlert } from '../../components/CustomAlert';

import { Plus, Upload, Download, AlertTriangle, Clock, Activity } from 'lucide-react-native';
import { Ticket } from '../../types/ticket';
import { callAPIWithEnc } from '../../apis/common/api';
import { COLORS } from '../../constants/theme';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';

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
    if (parts.length !== 3) return dateString.trim(); // Fallback if format is unexpected
    return `${parts[2].trim()}-${parts[1].trim()}-${parts[0].trim()}`;
};

const getDateMinusOneMonth = (dateString: string) => {
    if (!dateString) return '';
    try {
        const parts = dateString.split('-');
        if (parts.length !== 3) return dateString;
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1; // JS months are 0-indexed
        const year = parseInt(parts[2], 10);

        const date = new Date(year, month, day);
        date.setMonth(date.getMonth() - 1);

        const d = String(date.getDate()).padStart(2, '0');
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const y = date.getFullYear();
        return `${d}-${m}-${y}`;
    } catch (e) {
        console.error('Error calculating date minus one month:', e);
        return dateString;
    }
};

export const TicketQueueScreen: React.FC = () => {
    const auth = useAuth();
    const user = auth?.user;
    const isVendorRestricted = user?.user_type_id == 20 || user?.user_type_id == 30 || user?.user_type_id == 40;
    const navigation = useNavigation();
    const route = useRoute();

    const params = route.params as any;
    const statusID = params?.sid;
    const disableStatusFilter = params?.disableStatusFilter;
    const ticketNumber = params?.ticketNumber;
    const ticketDate = params?.ticketDate;

    console.log('params', params);


    const [activeTab, setActiveTab] = useState<'details' | 'engineer' | 'status' | 'chat'>('details');
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [ticketRecentActivity, setTicketRecentActivity] = useState<any>(null); // Initialize as null or []
    const [ticketDescAndTimelineInfo, setTicketDescAndTimelineInfo] = useState<any>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [alertConfig, setAlertConfig] = useState({
        visible: false,
        title: '',
        message: '',
        type: 'info' as 'info' | 'success' | 'error' | 'warning'
    });

    console.log('ticketRecentActivity', ticketRecentActivity);


    const [filters, setFilters] = useState({
        status_id: '0',
        priority_id: '',
        vendor_id: '0',
        status_name: '',
        priority_name: '',
        vendor_name: '',
        search: '',
        start_date: '',
        end_date: '',
        category_id: '',
        category_name: '',
    });
    const [hasSearched, setHasSearched] = useState(false);



    const fetchGetTicketDetailsListByUser = useCallback(async (overrideFilters?: any, isAutoSearch: boolean = false) => {
        // Check if overrideFilters is a valid filter object and not a React event object
        const isFilterObject = overrideFilters && typeof overrideFilters === 'object' && 'priority_id' in overrideFilters;
        const currentFilters = isFilterObject ? overrideFilters : filters;

        // 1. Validation: Status (Strict Manual)
        if (!isAutoSearch && (!currentFilters.status_id || currentFilters.status_id === '0')) {
            setAlertConfig({
                visible: true,
                title: 'Selection Required',
                message: 'Please select Status.',
                type: 'warning'
            });
            return;
        }

        // 2. Validation: Date Range (Required for all)
        if (!currentFilters.start_date || !currentFilters.end_date) {
            setAlertConfig({
                visible: true,
                title: 'Selection Required',
                message: 'Please select Start Date and End Date.',
                type: 'warning'
            });
            return;
        }

        // 3. Validation: Priority & Category (Strict Manual)
        if (!isAutoSearch) {
            // For Priority/Category, '0' is valid ("All"), so we strictly check for empty string
            if (currentFilters.priority_id === '' || currentFilters.category_id === '') {
                setAlertConfig({
                    visible: true,
                    title: 'Selection Required',
                    message: 'Please select Priority and Category.',
                    type: 'warning'
                });
                return;
            }
        }

        // Validation: Date Logic
        const startDateObj = new Date(convertDMYtoYMD(currentFilters.start_date) || '');
        const endDateObj = new Date(convertDMYtoYMD(currentFilters.end_date) || '');

        if (startDateObj > endDateObj) {
            setAlertConfig({
                visible: true,
                title: 'Invalid Date Range',
                message: 'Start Date cannot be later than End Date.',
                type: 'error'
            });
            return;
        }

        try {
            if (!refreshing) setIsLoading(true);

            const payload = {
                user_id: Number(user?.user_id),
                user_type_id: Number(user?.user_type_id),
                severity_id: currentFilters.priority_id,
                vendor_id: String(user?.vendor_id),
                start_date: currentFilters.start_date,
                end_date: currentFilters.end_date,
                category_id: Number(currentFilters.category_id || 0),
                ticket_status_id: Number(currentFilters.status_id || 0),
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
            setHasSearched(true);
            setRefreshing(false);
        }
    }, [user, filters]);

    useEffect(() => {
        const fromDashboard = params?.fromDashboard;

        if (statusID !== undefined) {
            if (statusID === '0' && !fromDashboard) {
                // Perform a FULL reset when clicking the tab directly
                setFilters({
                    status_id: '0',
                    priority_id: '',
                    vendor_id: isVendorRestricted && user?.vendor_id ? String(user.vendor_id) : '0',
                    status_name: '',
                    priority_name: '',
                    vendor_name: '',
                    search: '',
                    start_date: '',
                    end_date: '',
                    category_id: '',
                    category_name: '',
                });
                setTicketRecentActivity(null);
                setHasSearched(false);
            } else {
                // When coming from stats cards, notifications, or dashboard
                const newFilters = {
                    status_id: statusID || '0',
                    priority_id: fromDashboard ? '' : '0',
                    vendor_id: fromDashboard ? '0' : (isVendorRestricted && user?.vendor_id ? String(user.vendor_id) : '0'),
                    status_name: '',
                    priority_name: '',
                    vendor_name: '',
                    search: fromDashboard ? '' : (ticketNumber || ''),
                    start_date: (fromDashboard || !ticketDate) ? '' : getDateMinusOneMonth(ticketDate),
                    end_date: (fromDashboard || !ticketDate) ? '' : ticketDate,
                    category_id: fromDashboard ? '' : '0',
                    category_name: '',
                };
                setFilters(newFilters);
                setTicketRecentActivity(null);
                setHasSearched(false);

                // Auto-search only if NOT coming from dashboard
                if (!fromDashboard) {
                    fetchGetTicketDetailsListByUser(newFilters, true);
                }
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [statusID, ticketNumber, ticketDate, params?.timestamp, params?.fromDashboard]);

    // REMOVED: Initial fetch on mount useEffect

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


                console.log("getTicketTimelineInfo", response?.data);
                setTicketDescAndTimelineInfo(response?.data);
            } catch (e) {
                console.log(e);
                setTicketDescAndTimelineInfo(null);
            }
        };

        setSelectedTicket(ticket);
        setActiveTab('details'); // Always default to Details tab when opening modal
        setTicketDescAndTimelineInfo(null); // Reset to trigger loading state
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
            {/* {showStats && (
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
            )} */}

            {/* Filters */}
            <TicketFilters
                filters={filters}
                onFilterChange={setFilters}
                onSearch={fetchGetTicketDetailsListByUser}
                onClear={() => {
                    setHasSearched(false);
                    setTicketRecentActivity(null);
                }}
                totalTickets={filteredTickets?.length || 0}
                disableStatusFilter={disableStatusFilter}
            />

            {/* Ticket List with Pull to Refresh */}
            <TicketList
                tickets={filteredTickets}
                onTicketClick={onTicketClick}
                isLoading={isLoading && !refreshing}
                refreshing={refreshing}
                onRefresh={onRefresh}
                hasSearched={hasSearched}
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

            <CustomAlert
                visible={alertConfig.visible}
                title={alertConfig.title}
                message={alertConfig.message}
                type={alertConfig.type}
                onClose={() => setAlertConfig({ ...alertConfig, visible: false })}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS?.background || '#f0f2f5',
    },
    header: {
        padding: 16,
        paddingVertical: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: COLORS?.surface || '#fff',
        borderBottomWidth: 1,
        borderBottomColor: COLORS?.border || '#ccc',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS?.text || '#000',
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    createButton: {
        backgroundColor: COLORS?.primary || '#2563eb',
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