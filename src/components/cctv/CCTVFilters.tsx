import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    Modal,
    FlatList,
    ScrollView,
} from 'react-native';
import { Search, Filter, X, ChevronDown, Check } from 'lucide-react-native';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../../constants/theme';
import { getVendors, getZones } from '../../services/api/cctvApi';
import { User } from '../../types/auth'; // Using auth user type
import { Vendor, Zone } from '../../types/cctv';

interface CCTVFiltersProps {
    filters: {
        status: string;
        zone: string;
        vendor: string;
        status_name: string;
        zone_name: string;
        vendor_name: string;
        search: string;
    };
    onFilterChange: (filters: any) => void;
    totalCameras: number;
    user: User | null;
    hideSearch?: boolean;
}

export const CCTVFilters: React.FC<CCTVFiltersProps> = ({
    filters,
    onFilterChange,
    totalCameras,
    user,
    hideSearch = false,
}) => {
    const [vendors, setVendors] = useState<Vendor[]>([]);
    const [zones, setZones] = useState<Zone[]>([]);
    const [activeModal, setActiveModal] = useState<string | null>(null);

    const statuses = [
        { status_id: '10', status_name: 'Offline' },
        { status_id: '20', status_name: 'Online' },
        { status_id: '30', status_name: 'Maintenance' },
    ];

    useEffect(() => {
        const fetchOptions = async () => {
            try {
                const vendorData = await getVendors();
                const zoneData = await getZones();
                setVendors(vendorData?.data || []);
                setZones(zoneData?.data || []);
            } catch (error) {
                console.error("Failed to load filter options", error);
            }
        };
        fetchOptions();
    }, []);

    const handleFilterUpdate = (key: string, value: string, name?: string) => {
        const newFilters = { ...filters, [key]: value };

        if (key === 'vendor') newFilters.vendor_name = name || '';
        if (key === 'zone') newFilters.zone_name = name || '';
        if (key === 'status') newFilters.status_name = name || '';

        onFilterChange(newFilters);
        setActiveModal(null);
    };

    const clearFilters = () => {
        onFilterChange({
            status: '0',
            zone: '0',
            vendor: '0',
            status_name: '',
            zone_name: '',
            vendor_name: '',
            search: '',
        });
    };

    const renderDropdownModal = (
        title: string,
        data: any[],
        keyField: string,
        labelField: string,
        currentValue: string,
        onSelect: (id: string, name: string) => void
    ) => (
        <Modal
            visible={activeModal === title}
            transparent
            animationType="fade"
            onRequestClose={() => setActiveModal(null)}
        >
            <TouchableOpacity
                style={styles.modalOverlay}
                activeOpacity={1}
                onPress={() => setActiveModal(null)}
            >
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Select {title}</Text>
                        <TouchableOpacity onPress={() => setActiveModal(null)}>
                            <X size={24} color={COLORS.textPrimary} />
                        </TouchableOpacity>
                    </View>
                    <FlatList
                        data={[{ [keyField]: '0', [labelField]: `All ${title}s` }, ...data]}
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
                                    <Check size={20} color={COLORS?.primary || '#2563eb'}
                                    />
                                )}
                            </TouchableOpacity>
                        )}
                    />
                </View>
            </TouchableOpacity>
        </Modal>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.headerTitleRow}>
                    <Filter size={20} color={COLORS?.textSecondary || '#666'} />
                    <Text style={styles.headerTitle}>Filters</Text>
                </View>
                <TouchableOpacity onPress={clearFilters}>
                    <Text style={styles.clearText}>Clear All</Text>
                </TouchableOpacity>
            </View>

            {/* Search Bar */}
            {!hideSearch && (
                <View style={styles.searchContainer}>
                    <Search size={20} color={COLORS?.textSecondary || '#666'} style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search by name or location..."
                        placeholderTextColor={COLORS?.textSecondary || '#666'}
                        value={filters.search}
                        onChangeText={(text) => handleFilterUpdate('search', text)}
                    />
                </View>
            )}

            {/* Filter Chips / Dropdowns */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll}>
                {/* Status Filter */}
                <TouchableOpacity
                    style={[styles.filterChip, filters.status !== '0' && styles.activeFilterChip]}
                    onPress={() => setActiveModal('Status')}
                >
                    <Text style={[styles.filterChipText, filters.status !== '0' && styles.activeFilterChipText]}>
                        {filters.status === '0' ? 'Status' : filters.status_name || 'Status'}
                    </Text>
                    <ChevronDown size={16} color={filters.status !== '0' ? COLORS.primary : COLORS.textSecondary} />
                </TouchableOpacity>

                {/* Zone Filter */}
                <TouchableOpacity
                    style={[styles.filterChip, filters.zone !== '0' && styles.activeFilterChip]}
                    onPress={() => setActiveModal('Zone')}
                >
                    <Text style={[styles.filterChipText, filters.zone !== '0' && styles.activeFilterChipText]}>
                        {filters.zone === '0' ? 'Zone' : filters.zone_name || 'Zone'}
                    </Text>
                    <ChevronDown size={16} color={filters.zone !== '0' ? COLORS.primary : COLORS.textSecondary} />
                </TouchableOpacity>

                {/* Vendor Filter - Only mock if admin, otherwise locked or hidden logic handled by parent */}
                <TouchableOpacity
                    style={[styles.filterChip, filters.vendor !== '0' && styles.activeFilterChip]}
                    onPress={() => setActiveModal('Vendor')}
                >
                    <Text style={[styles.filterChipText, filters.vendor !== '0' && styles.activeFilterChipText]}>
                        {filters.vendor === '0' ? 'Vendor' : filters.vendor_name || 'Vendor'}
                    </Text>
                    <ChevronDown size={16} color={filters.vendor !== '0' ? COLORS.primary : COLORS.textSecondary} />
                </TouchableOpacity>
            </ScrollView>

            {/* Modals */}
            {renderDropdownModal('Status', statuses, 'status_id', 'status_name', filters.status, (id, name) => handleFilterUpdate('status', id, name))}
            {renderDropdownModal('Zone', zones, 'zone_id', 'zone_name', filters.zone, (id, name) => handleFilterUpdate('zone', id, name))}
            {renderDropdownModal('Vendor', vendors, 'vendor_id', 'vendor_name', filters.vendor, (id, name) => handleFilterUpdate('vendor', id, name))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: COLORS.cardBackground,
        padding: SPACING.m,
        borderRadius: BORDER_RADIUS.m,
        marginBottom: SPACING.m,
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
        fontWeight: '600',
        color: COLORS.textPrimary,
    },
    clearText: {
        fontSize: FONT_SIZES.s,
        color: COLORS.primary,
        fontWeight: '500',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.background,
        borderRadius: BORDER_RADIUS.s,
        paddingHorizontal: SPACING.m,
        marginBottom: SPACING.m,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    searchIcon: {
        marginRight: SPACING.s,
    },
    searchInput: {
        flex: 1,
        height: 40,
        color: COLORS.textPrimary,
    },
    filtersScroll: {
        flexDirection: 'row',
    },
    filterChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.background,
        paddingHorizontal: SPACING.m,
        paddingVertical: SPACING.s,
        borderRadius: BORDER_RADIUS.l,
        borderWidth: 1,
        borderColor: COLORS.border,
        marginRight: SPACING.s,
        gap: SPACING.xs,
    },
    activeFilterChip: {
        borderColor: COLORS.primary,
        backgroundColor: '#EFF6FF', // Light blue tint
    },
    filterChipText: {
        fontSize: FONT_SIZES.s,
        color: COLORS.textSecondary,
    },
    activeFilterChipText: {
        color: COLORS.primary,
        fontWeight: '500',
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: SPACING.l,
    },
    modalContent: {
        backgroundColor: COLORS.cardBackground,
        borderRadius: BORDER_RADIUS.m,
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
        fontWeight: '600',
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
        fontWeight: '600',
    },
});
