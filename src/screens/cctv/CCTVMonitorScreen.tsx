import React, { useEffect, useState, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Alert,
    RefreshControl,
    ActivityIndicator,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { CCTVDevice } from '../../types/cctv';
import { getCCtvMonitoringList } from '../../services/api/cctvApi';
import { CCTVFilters } from '../../components/cctv/CCTVFilters';
import { AddCameraModal } from '../../components/cctv/AddCameraModal';
import { NetworkDiagnosticsModal } from '../../components/cctv/NetworkDiagnosticsModal';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../../constants/theme';
import { Plus, Activity, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react-native';

export const CCTVMonitorScreen = () => {
    const { user } = useAuth();
    const [cctvsData, setCCTVsData] = useState<CCTVDevice[] | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    // Modals
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedCameraForDiagnostics, setSelectedCameraForDiagnostics] = useState<CCTVDevice | null>(null);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const [filters, setFilters] = useState({
        status: '0',
        zone: '0',
        vendor: '0',
        status_name: '',
        zone_name: '',
        vendor_name: '',
        search: '',
    });

    // Permissions
    const canAddCamera = user?.user_type_id?.toString() === '20'; // Vendor Admin
    const canRunDiagnostics = [100, 20, 40].includes(Number(user?.user_type_id));

    const fetchData = async () => {
        setIsLoading(true);
        try {
            // Apply vendor lock if vendor user
            const effectiveVendorId = user?.vendor_id || filters.vendor;

            const response = await getCCtvMonitoringList(
                filters.status,
                filters.zone,
                effectiveVendorId ? effectiveVendorId.toString() : null,
                user?.user_id,
                user?.user_type_id
            );
            setCCTVsData(response?.data || []);
        } catch (error) {
            console.error(error);
            Alert.alert("Error", "Failed to fetch CCTV list");
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [filters.status, filters.zone, filters.vendor]); // Refetch on core API filters

    // Local Filtering (Search + complex logic)
    const filteredData = useMemo(() => {
        if (!cctvsData) return null;
        let result = [...cctvsData];

        // 1. Search Filter
        if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            result = result.filter(c =>
                c.cctv_name?.toLowerCase().includes(searchLower) ||
                c.cctv_location_address?.toLowerCase().includes(searchLower)
            );
        }

        // 2. Vendor Name Filter (if not locked by API)
        if (!user?.vendor_id && filters.vendor !== '0' && filters.vendor_name) {
            result = result.filter(c => c.cctv_vendor_name === filters.vendor_name);
        }

        return result;
    }, [cctvsData, filters.search, filters.vendor_name, user?.vendor_id, filters.vendor]);

    // Reset pagination on filter change
    useEffect(() => {
        setCurrentPage(1);
    }, [filters.search, filters.vendor_name, filters.status, filters.zone, filters.vendor]);


    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    // Pagination Logic
    const totalPages = useMemo(() => Math.ceil((filteredData?.length || 0) / itemsPerPage), [filteredData?.length]);
    const paginatedData = useMemo(() => (filteredData || []).slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage), [filteredData, currentPage]);

    const handlePageChange = (page: number) => {
        if (page >= 1 && page <= totalPages) setCurrentPage(page);
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case '20': return <View style={[styles.badge, styles.badgeSuccess]}><Text style={styles.badgeTextSuccess}>Online</Text></View>;
            case '10': return <View style={[styles.badge, styles.badgeError]}><Text style={styles.badgeTextError}>Offline</Text></View>;
            case '30': return <View style={[styles.badge, styles.badgeWarning]}><Text style={styles.badgeTextWarning}>Maintenance</Text></View>;
            default: return <View style={[styles.badge, styles.badgeDefault]}><Text style={styles.badgeTextDefault}>N/A</Text></View>;
        }
    };

    const renderItem = ({ item }: { item: CCTVDevice }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={styles.cardTitleContainer}>
                    <Text style={styles.cardTitle} numberOfLines={1}>{item.cctv_name}</Text>
                    <Text style={styles.cardSubtitle}>{item.cctv_serial_number}</Text>
                </View>
                {getStatusBadge(item.cctv_connection_status)}
            </View>

            <View style={styles.cardBody}>
                <View style={styles.infoRow}><Text style={styles.label}>Location:</Text><Text style={[styles.value]} numberOfLines={1}>{item.cctv_location_address}</Text></View>
                <View style={styles.infoRow}><Text style={styles.label}>Zone:</Text><Text style={[styles.value]}>{item.cctv_zone_name}</Text></View>
                <View style={styles.infoRow}><Text style={styles.label}>Police Station:</Text><Text style={[styles.value]}>{item.cctv_subunit_name}</Text></View>
                <View style={styles.infoRow}><Text style={styles.label}>Vendor:</Text><Text style={[styles.value]}>{item.cctv_vendor_name}</Text></View>
                <View style={styles.infoRow}><Text style={styles.label}>Last Seen:</Text><Text style={[styles.value]}>{item.lastSeen || 'N/A'}</Text></View>
                <View style={styles.infoRow}><Text style={styles.label}>IP:Port:</Text><Text style={[styles.value]}>{item.cctv_ip_port || 'N/A'}</Text></View>
                <View style={styles.infoRow}><Text style={styles.label}>Uptime:</Text><Text style={[styles.value,]}>{item.up_time ? `${item.up_time}%` : 'N/A'}</Text></View>
            </View>
            {
                canRunDiagnostics && (
                    <View style={styles.cardFooter}>
                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => setSelectedCameraForDiagnostics(item)}
                        >
                            <Activity size={16} color={COLORS.primary} />
                            <Text style={styles.actionButtonText}>Diagnostics</Text>
                        </TouchableOpacity>
                    </View>
                )
            }
        </View >
    );

    return (
        <View style={styles.container}>
            {/* Header / Stats */}
            <View style={styles.topBar}>
                <View>
                    <Text style={styles.screenTitle}>CCTV Monitoring</Text>
                    {/* <Text style={styles.screenSubtitle}>Monitor and manage all CCTV devices across Kolkata</Text> */}
                </View>
                {canAddCamera && (
                    <TouchableOpacity style={styles.addButton} onPress={() => setShowAddModal(true)}>
                        <Plus size={20} color="white" />
                        <Text style={styles.addButtonText}>Add Camera</Text>
                    </TouchableOpacity>
                )}
            </View>

            <CCTVFilters
                filters={filters}
                onFilterChange={setFilters}
                totalCameras={filteredData?.length || 0}
                user={user}
            />

            {isLoading && !refreshing ? (
                <View style={styles.centerContainer}><ActivityIndicator size="large" color={COLORS.primary} /></View>
            ) : (
                <FlatList
                    data={paginatedData}
                    renderItem={renderItem}
                    keyExtractor={(item, index) => item.cctv_id ? item.cctv_id.toString() : index.toString()}
                    contentContainerStyle={styles.listContent}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                    ListEmptyComponent={
                        !isLoading ? (
                            <View style={styles.emptyState}>
                                <AlertCircle size={48} color={COLORS.textSecondary} />
                                <Text style={styles.emptyText}>
                                    {cctvsData === null ? 'Loading data...' : 'No cameras found'}
                                </Text>
                            </View>
                        ) : null
                    }
                />
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <View style={styles.pagination}>
                    <TouchableOpacity
                        disabled={currentPage === 1}
                        onPress={() => handlePageChange(currentPage - 1)}
                        style={[styles.pageButton, currentPage === 1 && styles.pageButtonDisabled]}
                    >
                        <ChevronLeft size={20} color={currentPage === 1 ? (COLORS?.textSecondary || '#666') : (COLORS?.primary || '#2563eb')}
                        />
                    </TouchableOpacity>
                    <Text style={styles.pageText}>Page {currentPage} of {totalPages}</Text>
                    <TouchableOpacity
                        disabled={currentPage === totalPages}
                        onPress={() => handlePageChange(currentPage + 1)}
                        style={[styles.pageButton, currentPage === totalPages && styles.pageButtonDisabled]}
                    >
                        <ChevronRight size={20} color={currentPage === totalPages ? (COLORS?.textSecondary || '#666') : (COLORS?.primary || '#2563eb')}
                        />
                    </TouchableOpacity>
                </View>
            )}

            {/* Modals */}
            {showAddModal && (
                <AddCameraModal
                    onClose={() => setShowAddModal(false)}
                    onSubmitSuccess={onRefresh}
                />
            )}

            {selectedCameraForDiagnostics && (
                <NetworkDiagnosticsModal
                    camera={selectedCameraForDiagnostics}
                    onClose={() => setSelectedCameraForDiagnostics(null)}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS?.background || '#f1f5f9'
    },
    topBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: SPACING.m,
        backgroundColor: COLORS?.surface || '#ffffff',
    },
    screenTitle: {
        fontSize: FONT_SIZES.l,
        fontWeight: 'bold',
        color: COLORS?.textPrimary || '#1f2937',
    },
    screenSubtitle: {
        fontSize: FONT_SIZES.s,
        color: COLORS?.textSecondary || '#6b7280',
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS?.primary || '#2563eb',
        paddingHorizontal: SPACING.m,
        paddingVertical: SPACING.s,
        borderRadius: BORDER_RADIUS.m,
        gap: SPACING.s,
    },
    addButtonText: {
        color: COLORS?.textInverse || '#ffffff',
        fontWeight: '600',
        fontSize: FONT_SIZES.s,
    },
    listContent: {
        padding: SPACING.m,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    // Card Styles
    card: {
        backgroundColor: COLORS?.cardBackground || '#ffffff',
        padding: SPACING.m,
        borderRadius: BORDER_RADIUS.m,
        marginBottom: SPACING.m,
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
    cardTitleContainer: {
        flex: 1,
        marginRight: SPACING.s,
    },
    cardTitle: {
        fontSize: FONT_SIZES.m,
        fontWeight: '600',
        color: COLORS?.textPrimary || '#1f2937',
    },
    cardSubtitle: {
        fontSize: FONT_SIZES.xs,
        color: COLORS?.textSecondary || '#6b7280',
    },
    cardBody: {
        gap: 4,
        marginBottom: SPACING.s,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    label: {
        fontSize: FONT_SIZES.s,
        color: COLORS?.textSecondary || '#6b7280',
        width: 80,
    },
    value: {
        flex: 1,
        fontSize: FONT_SIZES.s,
        color: COLORS?.textPrimary || '#1f2937',
        fontWeight: '500',
        textAlign: 'right',
        marginLeft: SPACING.s,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        borderTopWidth: 1,
        borderTopColor: COLORS?.border || '#e5e7eb',
        paddingTop: SPACING.s,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EFF6FF',
        paddingHorizontal: SPACING.m,
        paddingVertical: 6,
        borderRadius: BORDER_RADIUS.s,
        gap: SPACING.xs,
    },
    actionButtonText: {
        fontSize: FONT_SIZES.xs,
        color: COLORS?.primary || '#2563eb',
        fontWeight: '600',
    },
    // Badge
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    badgeSuccess: { backgroundColor: '#DCFCE7' },
    badgeError: { backgroundColor: '#FEE2E2' },
    badgeWarning: { backgroundColor: '#FEF3C7' },
    badgeDefault: { backgroundColor: '#F3F4F6' },
    badgeTextSuccess: { color: '#166534', fontSize: 10, fontWeight: 'bold' },
    badgeTextError: { color: '#991B1B', fontSize: 10, fontWeight: 'bold' },
    badgeTextWarning: { color: '#92400E', fontSize: 10, fontWeight: 'bold' },
    badgeTextDefault: { color: '#374151', fontSize: 10, fontWeight: 'bold' },
    // Pagination
    pagination: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: SPACING.m,
        backgroundColor: COLORS.surface,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
    },
    pageButton: {
        padding: SPACING.s,
        borderRadius: BORDER_RADIUS.s,
        backgroundColor: '#F3F4F6',
    },
    pageButtonDisabled: {
        opacity: 0.5,
    },
    pageText: {
        fontSize: FONT_SIZES.s,
        color: COLORS.textPrimary,
        fontWeight: '500',
    },
    emptyState: {
        alignItems: 'center',
        padding: SPACING.xl,
        marginTop: SPACING.xl,
    },
    emptyText: {
        marginTop: SPACING.m,
        fontSize: FONT_SIZES.m,
        color: COLORS.textSecondary,
    },
});
