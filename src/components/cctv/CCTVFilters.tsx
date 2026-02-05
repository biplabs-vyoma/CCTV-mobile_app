import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    Modal,
    FlatList,
    ActivityIndicator,
} from 'react-native';
import { Search, Filter, X, ChevronDown, Check } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../../constants/theme';
import { getVendors, getZones, getRegions, getUnits } from '../../services/api/cctvApi';
import { User } from '../../types/auth';
import { Vendor, Zone } from '../../types/cctv';

interface CCTVFiltersProps {
    filters: {
        status: string;
        zone: string;
        region: string;
        region_name: string;
        vendor: string;
        status_name: string;
        zone_name: string;
        vendor_name: string;
        search: string;
        unit: string;
        unit_name: string;
        ticket_status: string;
        ticket_status_name: string;
        camera_name: string;
        serial_number: string;
        ip_address: string;
    };
    onFilterChange: (filters: any) => void;
    onSearch: () => void;
    onClear?: () => void;
    totalCameras: number;
    user: User | null;
    lockVendor?: boolean;
}

const FilterModalContent = ({ title, data, keyField, labelField, currentValue, isLoading, onSelect, onClose }: any) => {
    const [searchTerm, setSearchTerm] = useState('');
    const insets = useSafeAreaInsets();

    const filteredData = data.filter((item: any) =>
        item[labelField]?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <View style={[styles.modalContent, { paddingBottom: Math.max(insets.bottom, 20) }]}>
            <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select {title}</Text>
                <TouchableOpacity onPress={onClose}>
                    <X size={24} color={COLORS.textPrimary} />
                </TouchableOpacity>
            </View>

            <View style={styles.modalSearchContainer}>
                <Search size={18} color={COLORS.textSecondary} />
                <TextInput
                    style={styles.modalSearchInput}
                    placeholder={`Search ${title}...`}
                    placeholderTextColor={COLORS.textSecondary}
                    value={searchTerm}
                    onChangeText={setSearchTerm}
                />
            </View>

            {isLoading ? (
                <View style={styles.loaderContainer}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                    <Text style={styles.loaderText}>Loading {title}...</Text>
                </View>
            ) : (
                <FlatList
                    data={[{ [keyField]: '0', [labelField]: `All ${title}s` }, ...filteredData]}
                    keyExtractor={(item) => item[keyField].toString()}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={[
                                styles.optionItem,
                                currentValue === item[keyField].toString() && styles.selectedOption
                            ]}
                            onPress={() => onSelect(item[keyField].toString(), item[labelField])}
                        >
                            <Text style={[
                                styles.optionText,
                                currentValue === item[keyField].toString() && styles.selectedOptionText
                            ]}>
                                {item[labelField]}
                            </Text>
                            {currentValue === item[keyField].toString() && (
                                <Check size={20} color={COLORS.primary} />
                            )}
                        </TouchableOpacity>
                    )}
                />
            )}
        </View>
    );
};

export const CCTVFilters: React.FC<CCTVFiltersProps> = ({
    filters,
    onFilterChange,
    onSearch,
    onClear,
    totalCameras,
    user,
    lockVendor = false,
}) => {
    const [vendors, setVendors] = useState<Vendor[]>([]);
    const [zones, setZones] = useState<Zone[]>([]);
    const [regions, setRegions] = useState<any[]>([]);
    const [units, setUnits] = useState<any[]>([]);

    const [isLoadingVendors, setIsLoadingVendors] = useState(false);
    const [isLoadingRegions, setIsLoadingRegions] = useState(false);
    const [isLoadingZones, setIsLoadingZones] = useState(false);
    const [isLoadingUnits, setIsLoadingUnits] = useState(false);

    const [activeModal, setActiveModal] = useState<string | null>(null);

    const liveStatuses = [
        { status_id: '10', status_name: 'Offline' },
        { status_id: '20', status_name: 'Online' },
        { status_id: '30', status_name: 'Maintenance' },
    ];

    useEffect(() => {
        const fetchOptions = async () => {
            try {
                setIsLoadingVendors(true);
                setIsLoadingRegions(true);
                const [vendorData, regionData] = await Promise.all([
                    getVendors(),
                    getRegions(),
                ]);
                setVendors(vendorData?.data || []);
                setRegions(regionData?.data || []);
            } catch (error) {
                console.error("Failed to load initial filter options", error);
            } finally {
                setIsLoadingVendors(false);
                setIsLoadingRegions(false);
            }
        };
        fetchOptions();
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            if (filters.region === '0') {
                setZones([]);
                setUnits([]);
                return;
            }
            try {
                setIsLoadingZones(true);
                setIsLoadingUnits(true);
                const [zoneData, unitData] = await Promise.all([
                    getZones(filters.region),
                    getUnits(filters.region)
                ]);
                setZones(zoneData?.data || []);
                setUnits(unitData?.data || []);
            } catch (error) {
                console.error("Failed to fetch dependent filters", error);
            } finally {
                setIsLoadingZones(false);
                setIsLoadingUnits(false);
            }
        };
        fetchData();
    }, [filters.region]);

    const handleFilterUpdate = (key: string, value: string, name?: string) => {
        if (key === 'vendor' && lockVendor) return;
        const newFilters = { ...filters, [key]: value };

        if (key === 'vendor') newFilters.vendor_name = name || '';
        if (key === 'region') {
            newFilters.region_name = name || '';
            newFilters.zone = '';
            newFilters.zone_name = '';
            newFilters.unit = '';
            newFilters.unit_name = '';
        }
        if (key === 'zone') newFilters.zone_name = name || '';
        if (key === 'unit') newFilters.unit_name = name || '';
        if (key === 'status') newFilters.status_name = name || '';
        if (key === 'ticket_status') newFilters.ticket_status_name = name || '';

        onFilterChange(newFilters);
        setActiveModal(null);
    };

    const clearFilters = () => {
        onFilterChange({
            status: '0',
            zone: '',
            region: '',
            vendor: lockVendor ? filters.vendor : '',
            status_name: 'All Statuses',
            zone_name: '',
            region_name: '',
            vendor_name: lockVendor ? filters.vendor_name : '',
            unit: '',
            unit_name: '',
            search: '',
            ticket_status: '0',
            ticket_status_name: '',
            camera_name: '',
            serial_number: '',
            ip_address: '',
        });
        if (onClear) onClear();
    };

    const isZoneDisabled = filters.region === '';

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.headerTitleRow}>
                    <Filter size={20} color={COLORS.textSecondary} />
                    <Text style={styles.headerTitle}>Monitoring Filters</Text>
                </View>
                <TouchableOpacity onPress={clearFilters}>
                    <Text style={styles.clearText}>Clear All</Text>
                </TouchableOpacity>
            </View>

            {/* Filter Group: Row 1 - Status & DRO */}
            <View style={styles.filtersContainer}>
                <TouchableOpacity
                    style={[styles.filterChip, filters.status !== '' && styles.activeFilterChip]}
                    onPress={() => setActiveModal('Live Status')}
                >
                    <Text style={[styles.filterChipText, filters.status !== '' && styles.activeFilterChipText]}>
                        {filters.status_name || 'Status'}
                    </Text>
                    <ChevronDown size={14} color={filters.status !== '' ? COLORS.primary : COLORS.textSecondary} />
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.filterChip, filters.region !== '' && styles.activeFilterChip]}
                    onPress={() => setActiveModal('DRO')}
                >
                    <Text style={[styles.filterChipText, filters.region !== '' && styles.activeFilterChipText]}>
                        {filters.region_name || 'DRO'}
                    </Text>
                    <ChevronDown size={14} color={filters.region !== '' ? COLORS.primary : COLORS.textSecondary} />
                </TouchableOpacity>
            </View>

            {/* Filter Group: Row 2 - PS & TG */}
            <View style={[styles.filtersContainer, { marginTop: SPACING.xs }]}>
                <TouchableOpacity
                    style={[
                        styles.filterChip,
                        filters.zone !== '' && styles.activeFilterChip,
                        isZoneDisabled && styles.disabledFilterChip
                    ]}
                    onPress={() => !isZoneDisabled && setActiveModal('Police Station')}
                    disabled={isZoneDisabled}
                >
                    <Text style={[
                        styles.filterChipText,
                        filters.zone !== '' && styles.activeFilterChipText,
                        isZoneDisabled && styles.disabledFilterChipText
                    ]}>
                        {filters.zone_name || 'Police Station'}
                    </Text>
                    <ChevronDown size={14} color={isZoneDisabled ? COLORS.textSecondary : (filters.zone !== '' ? COLORS.primary : COLORS.textSecondary)} />
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.filterChip, filters.unit !== '' && styles.activeFilterChip]}
                    onPress={() => setActiveModal('Traffic Guard')}
                >
                    <Text style={[styles.filterChipText, filters.unit !== '' && styles.activeFilterChipText]}>
                        {filters.unit_name || 'Traffic Guard'}
                    </Text>
                    <ChevronDown size={14} color={filters.unit !== '' ? COLORS.primary : COLORS.textSecondary} />
                </TouchableOpacity>
            </View>

            {/* Filter Group: Row 3 - Vendor */}
            <View style={[styles.filtersContainer, { marginTop: SPACING.xs }]}>
                <TouchableOpacity
                    style={[styles.filterChip, styles.fullWidthChip, filters.vendor !== '' && styles.activeFilterChip, lockVendor && styles.lockedFilterChip]}
                    onPress={() => !lockVendor && setActiveModal('Vendor')}
                    disabled={lockVendor}
                >
                    <Text style={[styles.filterChipText, filters.vendor !== '' && styles.activeFilterChipText, lockVendor && styles.lockedFilterChipText]}>
                        {filters.vendor_name || 'Vendor'}
                    </Text>
                    {!lockVendor && <ChevronDown size={14} color={filters.vendor !== '' ? COLORS.primary : COLORS.textSecondary} />}
                </TouchableOpacity>
            </View>

            {/* Filter Group: Row 4 - Camera & Serial */}
            <View style={[styles.inputsRow, { marginTop: SPACING.xs }]}>
                <TextInput
                    style={[styles.detailInput, { flex: 1.5 }]}
                    placeholder="Ex: Main Gate..."
                    placeholderTextColor={COLORS.textSecondary}
                    value={filters.camera_name}
                    onChangeText={(text) => onFilterChange({ ...filters, camera_name: text })}
                />
                <TextInput
                    style={styles.detailInput}
                    placeholder="Ex: SN001..."
                    placeholderTextColor={COLORS.textSecondary}
                    value={filters.serial_number}
                    onChangeText={(text) => onFilterChange({ ...filters, serial_number: text })}
                />
            </View>

            {/* Row 5: IP + Search */}
            <View style={[styles.inputsRow, { marginTop: SPACING.xs }]}>
                <TextInput
                    style={[styles.detailInput, { flex: 2 }]}
                    placeholder="Ex: 192.168.1.1..."
                    placeholderTextColor={COLORS.textSecondary}
                    value={filters.ip_address}
                    keyboardType="numeric"
                    onChangeText={(text) => onFilterChange({ ...filters, ip_address: text })}
                />
                <TouchableOpacity style={[styles.searchButton, { flex: 1, marginTop: 0 }]} onPress={onSearch}>
                    <Search size={16} color="white" />
                    <Text style={[styles.searchButtonText, { fontSize: 13 }]}>Search</Text>
                </TouchableOpacity>
            </View>

            {/* Modals */}
            <Modal visible={activeModal !== null} transparent animationType="fade" onRequestClose={() => setActiveModal(null)}>
                <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setActiveModal(null)}>
                    {activeModal === 'Live Status' && (
                        <FilterModalContent
                            title="Live Status"
                            data={liveStatuses}
                            keyField="status_id"
                            labelField="status_name"
                            currentValue={filters.status}
                            onSelect={(id: any, name: any) => handleFilterUpdate('status', id, name)}
                            onClose={() => setActiveModal(null)}
                        />
                    )}
                    {activeModal === 'DRO' && (
                        <FilterModalContent
                            title="DRO"
                            data={regions}
                            keyField="region_id"
                            labelField="region_name"
                            currentValue={filters.region}
                            isLoading={isLoadingRegions}
                            onSelect={(id: any, name: any) => handleFilterUpdate('region', id, name)}
                            onClose={() => setActiveModal(null)}
                        />
                    )}
                    {activeModal === 'Police Station' && (
                        <FilterModalContent
                            title="Police Station"
                            data={zones}
                            keyField="zone_id"
                            labelField="zone_name"
                            currentValue={filters.zone}
                            isLoading={isLoadingZones}
                            onSelect={(id: any, name: any) => handleFilterUpdate('zone', id, name)}
                            onClose={() => setActiveModal(null)}
                        />
                    )}
                    {activeModal === 'Traffic Guard' && (
                        <FilterModalContent
                            title="Traffic Guard"
                            data={units}
                            keyField="unit_id"
                            labelField="unit_name"
                            currentValue={filters.unit}
                            isLoading={isLoadingUnits}
                            onSelect={(id: any, name: any) => handleFilterUpdate('unit', id, name)}
                            onClose={() => setActiveModal(null)}
                        />
                    )}
                    {activeModal === 'Vendor' && (
                        <FilterModalContent
                            title="Vendor"
                            data={vendors}
                            keyField="vendor_id"
                            labelField="vendor_name"
                            currentValue={filters.vendor}
                            isLoading={isLoadingVendors}
                            onSelect={(id: any, name: any) => handleFilterUpdate('vendor', id, name)}
                            onClose={() => setActiveModal(null)}
                        />
                    )}
                </TouchableOpacity>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: COLORS.cardBackground,
        padding: SPACING.s,
        borderRadius: BORDER_RADIUS.m,
        marginBottom: SPACING.s,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.m,
    },
    headerTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.s,
    },
    headerTitle: {
        fontSize: FONT_SIZES.m,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
    },
    clearText: {
        fontSize: FONT_SIZES.s,
        color: COLORS.primary,
        fontWeight: '600',
    },
    filtersContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: SPACING.s,
    },
    filterChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.background,
        paddingHorizontal: SPACING.s,
        paddingVertical: 8,
        borderRadius: BORDER_RADIUS.s,
        borderWidth: 1,
        borderColor: COLORS.border,
        gap: 6,
        minWidth: '48%',
        height: 38,
    },
    fullWidthChip: {
        minWidth: '100%',
    },
    activeFilterChip: {
        borderColor: COLORS.primary,
        backgroundColor: '#EFF6FF',
    },
    filterChipText: {
        fontSize: 13,
        color: COLORS.textSecondary,
        flex: 1,
    },
    activeFilterChipText: {
        color: COLORS.primary,
        fontWeight: '600',
    },
    disabledFilterChip: {
        backgroundColor: '#f9fafb',
        opacity: 0.5,
    },
    disabledFilterChipText: {
        color: '#9ca3af',
    },
    lockedFilterChip: {
        backgroundColor: '#f3f4f6',
        opacity: 0.8,
    },
    lockedFilterChipText: {
        color: '#6b7280',
    },
    inputsRow: {
        flexDirection: 'row',
        gap: SPACING.s,
        marginTop: SPACING.s,
    },
    detailInput: {
        flex: 1,
        height: 38,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: BORDER_RADIUS.s,
        paddingHorizontal: SPACING.s,
        color: COLORS.textPrimary,
        backgroundColor: COLORS.background,
        fontSize: 13,
    },
    searchButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.primary,
        marginTop: SPACING.s,
        paddingVertical: 8,
        borderRadius: BORDER_RADIUS.s,
        gap: SPACING.s,
        height: 38,
    },
    searchButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: FONT_SIZES.m,
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: COLORS.cardBackground,
        borderTopLeftRadius: BORDER_RADIUS.l,
        borderTopRightRadius: BORDER_RADIUS.l,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: SPACING.m,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    modalTitle: {
        fontSize: FONT_SIZES.l,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
    },
    modalSearchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SPACING.m,
        paddingVertical: SPACING.s,
        backgroundColor: COLORS.background,
        margin: SPACING.m,
        borderRadius: BORDER_RADIUS.s,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    modalSearchInput: {
        flex: 1,
        height: 40,
        marginLeft: SPACING.s,
        color: COLORS.textPrimary,
    },
    optionItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: SPACING.m,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    selectedOption: {
        backgroundColor: '#EFF6FF',
    },
    optionText: {
        fontSize: FONT_SIZES.m,
        color: COLORS.textPrimary,
    },
    selectedOptionText: {
        color: COLORS.primary,
        fontWeight: 'bold',
    },
    loaderContainer: {
        padding: SPACING.xl,
        alignItems: 'center',
    },
    loaderText: {
        marginTop: SPACING.m,
        color: COLORS.textSecondary,
    },
});