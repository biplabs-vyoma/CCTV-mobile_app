import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, FlatList, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Search, Filter, ChevronDown, X, ChevronLeft, ChevronRight, Clock } from 'lucide-react-native';
import { callAPIWithEnc } from '../../apis/common/api';
import { useAuth } from '../../context/AuthContext';
import { COLORS } from '../../constants/theme';

interface TicketFiltersProps {
    filters: {
        status_id: string;
        priority_id: string;
        vendor_id: string;
        status_name: string;
        priority_name: string;
        vendor_name: string;
        search: string;
        start_date: string;
        end_date: string;
        category_id: string;
        category_name: string;
        dro_id: string;
        dro_name: string;
    };
    onFilterChange: (filters: any) => void;
    onSearch: () => void;
    onClear?: () => void;
    totalTickets: number;
    disableStatusFilter?: boolean;
}

const SearchableSelect = ({
    options,
    value,
    onChange,
    allOptionLabel = 'All',
    allOptionValue = '0',
    labelKey,
    valueKey,
    placeholder,
    disabled = false,
    showAllOption = true,
    isLoading = false,
}: any) => {
    const [modalVisible, setModalVisible] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const safeOptions = Array.isArray(options) ? options : [];
    const fullOptions = showAllOption
        ? [{ [valueKey]: allOptionValue, [labelKey]: allOptionLabel }, ...safeOptions]
        : safeOptions;

    const filteredOptions = fullOptions.filter((option) =>
        option[labelKey]?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const selectedOption = fullOptions.find((option) => option[valueKey] == value);
    const displayLabel = selectedOption?.[labelKey] || placeholder;

    const handleSelect = (optionValue: string) => {
        onChange(optionValue);
        setModalVisible(false);
        setSearchTerm('');
    };

    // Removed early null return so field remains visible but disabled

    return (
        <View style={styles.selectContainer}>
            <TouchableOpacity
                style={[styles.selectButton, disabled && styles.disabledButton]}
                onPress={() => !disabled && setModalVisible(true)}
                disabled={disabled}
                activeOpacity={0.7}
            >
                <Text style={styles.selectButtonText} numberOfLines={1}>{displayLabel}</Text>
                <ChevronDown size={16} color={COLORS?.textSecondary || '#666'} />
            </TouchableOpacity>

            <Modal
                visible={modalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { paddingBottom: Math.max(useSafeAreaInsets().bottom, 16) }]}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{placeholder}</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                                <X size={24} color={COLORS?.text || '#000'} />
                            </TouchableOpacity>
                        </View>

                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search..."
                            placeholderTextColor={COLORS?.textSecondary || '#666'}
                            value={searchTerm}
                            onChangeText={setSearchTerm}
                        />

                        {isLoading ? (
                            <View style={{ padding: 40, alignItems: 'center', justifyContent: 'center' }}>
                                <ActivityIndicator size="large" color={COLORS.primary || '#2563eb'} />
                                <Text style={{ marginTop: 12, color: COLORS.textSecondary }}>Loading {placeholder}...</Text>
                            </View>
                        ) : (
                            <FlatList
                                data={filteredOptions}
                                keyExtractor={(item) => item[valueKey]?.toString() || Math.random().toString()}
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        style={[
                                            styles.optionItem,
                                            item[valueKey] == value && styles.selectedOption
                                        ]}
                                        onPress={() => handleSelect(item[valueKey])}
                                    >
                                        <Text style={[
                                            styles.optionText,
                                            item[valueKey] == value && styles.selectedOptionText
                                        ]}>
                                            {item[labelKey]}
                                        </Text>
                                    </TouchableOpacity>
                                )}
                                ListEmptyComponent={<Text style={{ padding: 20, textAlign: 'center', color: COLORS?.textSecondary || '#666' }}>No options found</Text>}
                            />
                        )}
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const CustomDatePicker = ({ value, onChange, placeholder, minDate, maxDate }: any) => {
    const [modalVisible, setModalVisible] = useState(false);

    // Parse current value or use today
    const parseFormattedDate = (dateStr: string) => {
        if (!dateStr) return new Date();
        const parts = dateStr.split('-');
        if (parts.length === 3) {
            // dd-mm-yyyy
            return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
        }
        return new Date();
    };

    const [viewDate, setViewDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(parseFormattedDate(value));
    const [showMonthPicker, setShowMonthPicker] = useState(false);
    const [showYearPicker, setShowYearPicker] = useState(false);

    // Sync internal state when value prop changes externally
    useEffect(() => {
        const newDate = parseFormattedDate(value);
        setSelectedDate(newDate);
        setViewDate(newDate);
    }, [value]);

    // Generate years for picker (10 years back and forth)
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 21 }, (_, i) => currentYear - 10 + i);
    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const getDaysInMonth = (year: number, month: number) => {
        return new Date(year, month + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (year: number, month: number) => {
        return new Date(year, month, 1).getDay();
    };

    const generateCalendar = () => {
        const year = viewDate.getFullYear();
        const month = viewDate.getMonth();
        const daysInMonth = getDaysInMonth(year, month);
        const firstDay = getFirstDayOfMonth(year, month);
        const days: (number | null)[] = [];

        // Add empty slots for days before start of month
        for (let i = 0; i < firstDay; i++) {
            days.push(null);
        }

        // Add days of month
        for (let i = 1; i <= daysInMonth; i++) {
            days.push(i);
        }

        return days;
    };

    const changeMonth = (offset: number) => {
        const newDate = new Date(viewDate);
        newDate.setMonth(newDate.getMonth() + offset);
        setViewDate(newDate);
    };

    const handleSelectMonth = (monthIndex: number) => {
        const newDate = new Date(viewDate);
        newDate.setMonth(monthIndex);
        setViewDate(newDate);
        setShowMonthPicker(false);
    };

    const handleSelectYear = (year: number) => {
        const newDate = new Date(viewDate);
        newDate.setFullYear(year);
        setViewDate(newDate);
        setShowYearPicker(false);
    };

    const handleSelectDay = (day: number | null) => {
        if (!day) return;

        const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
        const today = new Date();

        // Reset time parts for accurate comparison
        newDate.setHours(0, 0, 0, 0);

        // Check if day is disabled
        if (isDayDisabled(day)) return;

        setSelectedDate(newDate);
        const formattedDate = `${String(day).padStart(2, '0')}-${String(viewDate.getMonth() + 1).padStart(2, '0')}-${viewDate.getFullYear()}`;
        onChange(formattedDate);
        setModalVisible(false);
    };

    const isSelected = (day: number) => {
        /*
        const d = selectedDate;
        return d && d.getDate() === day && 
               d.getMonth() === viewDate.getMonth() && 
               d.getFullYear() === viewDate.getFullYear();
        */
        // Simple string comparison for prop value
        if (!value) return false;
        const parts = value.split('-');
        if (parts.length !== 3) return false;
        return parseInt(parts[0]) === day &&
            parseInt(parts[1]) - 1 === viewDate.getMonth() &&
            parseInt(parts[2]) === viewDate.getFullYear();
    };

    const isDayDisabled = (day: number | null) => {
        if (!day) return true;

        const dateToCheck = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
        dateToCheck.setHours(0, 0, 0, 0);

        if (minDate) {
            const minParts = minDate.split('-');
            if (minParts.length === 3) {
                const minD = new Date(parseInt(minParts[2]), parseInt(minParts[1]) - 1, parseInt(minParts[0]));
                minD.setHours(0, 0, 0, 0);
                if (dateToCheck < minD) return true;
            }
        }

        if (maxDate) {
            const maxParts = maxDate.split('-');
            if (maxParts.length === 3) {
                const maxD = new Date(parseInt(maxParts[2]), parseInt(maxParts[1]) - 1, parseInt(maxParts[0]));
                maxD.setHours(0, 0, 0, 0);
                if (dateToCheck > maxD) return true;
            }
        }

        return false;
    };

    const handleToday = () => {
        const today = new Date();
        setViewDate(today);
        setSelectedDate(today);

        const formattedDate = `${String(today.getDate()).padStart(2, '0')}-${String(today.getMonth() + 1).padStart(2, '0')}-${today.getFullYear()}`;
        onChange(formattedDate);
        setModalVisible(false);
    };

    const calendarDays = generateCalendar();
    const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

    return (
        <View style={styles.datePickerContainer}>
            <TouchableOpacity
                style={styles.dateInput}
                onPress={() => {
                    setViewDate(selectedDate);
                    setModalVisible(true);
                }}
                activeOpacity={0.7}
            >
                <Text style={[styles.dateInputText, !value && { color: COLORS?.textSecondary || '#666' }]}>
                    {value || placeholder}
                </Text>
                <Clock size={16} color={COLORS?.textSecondary || '#666'} />
            </TouchableOpacity>

            <Modal
                visible={modalVisible}
                animationType="fade"
                transparent={true}
                onRequestClose={() => setModalVisible(false)}
            >
                <TouchableOpacity
                    style={styles.centeredModalOverlay}
                    activeOpacity={1}
                    onPress={() => setModalVisible(false)}
                >
                    <TouchableOpacity
                        activeOpacity={1}
                        style={styles.calendarModalContent}
                    >
                        <View style={styles.calendarHeader}>
                            <TouchableOpacity onPress={() => changeMonth(-1)}>
                                <ChevronLeft size={24} color={COLORS?.primary || '#2563eb'} />
                            </TouchableOpacity>
                            <View style={{ alignItems: 'center' }}>
                                <TouchableOpacity onPress={() => setShowMonthPicker(!showMonthPicker)}>
                                    <Text style={styles.monthYearText}>
                                        {months[viewDate.getMonth()]} {viewDate.getFullYear()}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                            <TouchableOpacity onPress={() => changeMonth(1)}>
                                <ChevronRight size={24} color={COLORS?.primary || '#2563eb'} />
                            </TouchableOpacity>
                        </View>

                        {showMonthPicker ? (
                            <ScrollView contentContainerStyle={styles.selectionGrid}>
                                {months.map((m, idx) => (
                                    <TouchableOpacity
                                        key={m}
                                        style={[
                                            styles.selectionItem,
                                            viewDate.getMonth() === idx && styles.activeSelectionItem
                                        ]}
                                        onPress={() => handleSelectMonth(idx)}
                                    >
                                        <Text style={[
                                            styles.selectionText,
                                            viewDate.getMonth() === idx && styles.activeSelectionText
                                        ]}>{m}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        ) : showYearPicker ? (
                            <ScrollView contentContainerStyle={styles.selectionGrid}>
                                {years.map(y => (
                                    <TouchableOpacity
                                        key={y}
                                        style={[
                                            styles.selectionItem,
                                            viewDate.getFullYear() === y && styles.activeSelectionItem
                                        ]}
                                        onPress={() => handleSelectYear(y)}
                                    >
                                        <Text style={[
                                            styles.selectionText,
                                            viewDate.getFullYear() === y && styles.activeSelectionText
                                        ]}>{y}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        ) : (
                            <>
                                <View style={styles.weekDaysRow}>
                                    {weekDays.map(d => (
                                        <Text key={d} style={styles.weekDayText}>{d}</Text>
                                    ))}
                                </View>

                                <View style={styles.daysGrid}>
                                    {calendarDays.map((day, idx) => (
                                        <TouchableOpacity
                                            key={idx}
                                            style={[
                                                styles.dayButton,
                                                (day && isSelected(day)) ? styles.selectedDayButton : null,
                                                (day && isDayDisabled(day)) ? styles.disabledDayButton : null
                                            ]}
                                            onPress={() => handleSelectDay(day)}
                                            disabled={!day || isDayDisabled(day)}
                                        >
                                            <Text style={[
                                                styles.dayText,
                                                !day ? { opacity: 0 } : null,
                                                (day && isSelected(day)) ? styles.selectedDayText : null,
                                                (day && isDayDisabled(day)) ? styles.disabledDayText : null
                                            ]}>
                                                {day}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </>
                        )}

                        <View style={styles.calendarFooter}>
                            <TouchableOpacity
                                style={styles.todayButton}
                                onPress={handleToday}
                            >
                                <Text style={styles.todayButtonText}>Today</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.closeButton}
                                onPress={() => setModalVisible(false)}
                            >
                                <Text style={styles.closeButtonText}>Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>
        </View>
    );
};

export const TicketFilters: React.FC<TicketFiltersProps> = ({
    filters,
    onFilterChange,
    onSearch,
    onClear,
    totalTickets,
    disableStatusFilter,
}) => {
    const [vendors, setVendors] = useState<Array<any>>([]);
    const [statuses, setStatuses] = useState<Array<any>>([]);
    const [categories, setCategories] = useState<Array<any>>([]);
    const [dros, setDros] = useState<Array<any>>([]);
    const [isLoadingVendors, setIsLoadingVendors] = useState(false);
    const [isLoadingStatuses, setIsLoadingStatuses] = useState(false);
    const [isLoadingCategories, setIsLoadingCategories] = useState(false);
    const [isLoadingDros, setIsLoadingDros] = useState(false);
    // @ts-ignore
    const { user } = useAuth();

    const isVendorRestricted = user?.user_type_id == 20 || user?.user_type_id == 30 || user?.user_type_id == 40;

    useEffect(() => {
        const getVendorOptions = async () => {
            try {
                setIsLoadingVendors(true);
                const response: any = await callAPIWithEnc('master/getVendor', 'POST', {});
                setVendors(response?.data || []);
            } catch (e) {
                console.log('Error fetching vendors', e);
            } finally {
                setIsLoadingVendors(false);
            }
        };
        const getStatusOptions = async () => {
            try {
                setIsLoadingStatuses(true);
                const response: any = await callAPIWithEnc('master/getStatusDetails', 'POST', {});
                const allStatuses = response?.data || [];
                // Filter to only include Assigned (220) and In Progress (230)
                const filteredStatuses = allStatuses.filter((s: any) => s.status_id == '220' || s.status_id == '230' || s.status_id == '240');
                console.log('Filtered statuses:', filteredStatuses);
                setStatuses(filteredStatuses);
            } catch (e) {
                console.log('Error fetching statuses', e);
            } finally {
                setIsLoadingStatuses(false);
            }
        };
        const getCategoryOptions = async () => {
            try {
                setIsLoadingCategories(true);
                const response: any = await callAPIWithEnc('master/getIncidentCategoryDetails', 'POST', {});
                setCategories(response?.data || []);
            } catch (e) {
                console.log('Error fetching categories', e);
            } finally {
                setIsLoadingCategories(false);
            }
        };
        const getDROOptions = async () => {
            try {
                setIsLoadingDros(true);
                const response: any = await callAPIWithEnc('master/getRegion', 'POST', {});
                setDros(response?.data || []);
            } catch (e) {
                console.log('Error fetching DROs', e);
            } finally {
                setIsLoadingDros(false);
            }
        };
        getVendorOptions();
        getStatusOptions();
        getCategoryOptions();
        getDROOptions();
    }, []);

    useEffect(() => {
        // Sync vendor name if ID is set but name is missing or mismatched
        if (filters.vendor_id && filters.vendor_id !== '0') {
            const vendor = vendors.find((v) => v.vendor_id == filters.vendor_id);
            if (vendor && (!filters.vendor_name || filters.vendor_name !== vendor.vendor_name)) {
                onFilterChange({
                    ...filters,
                    vendor_name: vendor.vendor_name || '',
                });
            }
        } else if (user?.vendor_id && String(user.vendor_id) !== '0') {
            // Fallback: If user has vendor ID but filter is not set, force set it
            const vendor = vendors.find((v) => v.vendor_id == user.vendor_id);
            if (vendor && filters.vendor_id !== String(user.vendor_id)) {
                onFilterChange({
                    ...filters,
                    vendor_id: String(user.vendor_id),
                    vendor_name: vendor.vendor_name || '',
                });
            }
        }
    }, [vendors, filters.vendor_id, user?.vendor_id]);

    const priorities = [
        { priority_id: '1', priority_name: 'low' },
        { priority_id: '2', priority_name: 'medium' },
        { priority_id: '3', priority_name: 'high' },
        { priority_id: '4', priority_name: 'critical' },
    ];

    const handleFilterUpdate = (key: string, value: string) => {
        console.log(`--- Filter Updating: ${key} -> ${value} ---`);
        if (key === 'vendor') {
            if (isVendorRestricted && value !== filters.vendor_id) {
                return;
            }
            if (value == '0') {
                onFilterChange({ ...filters, vendor_id: '0', vendor_name: '' });
            } else {
                const vendor = vendors.find((v) => v.vendor_id == value);
                onFilterChange({
                    ...filters,
                    vendor_id: vendor?.vendor_id || '',
                    vendor_name: vendor?.vendor_name || '',
                });
            }
        } else if (key === 'priority') {
            if (value == '0') {
                onFilterChange({ ...filters, priority_id: '0', priority_name: '' });
            } else {
                const priority = priorities.find((p) => p.priority_id == value);
                onFilterChange({
                    ...filters,
                    priority_id: priority?.priority_id || '',
                    priority_name: priority?.priority_name || '',
                });
            }
        } else if (key === 'status') {
            if (value == '0') {
                onFilterChange({ ...filters, status_id: '0', status_name: '' });
            } else {
                const status = statuses.find((s) => s.status_id == value);
                onFilterChange({
                    ...filters,
                    status_id: status?.status_id || '',
                    status_name: status?.status_name || '',
                });
            }
        } else if (key === 'category') {
            if (value === '0') {
                onFilterChange({ ...filters, category_id: '0', category_name: '' });
            } else {
                const category = categories.find((c) => c.incident_category_id == value);
                onFilterChange({
                    ...filters,
                    category_id: category?.incident_category_id || '',
                    category_name: category?.incident_category_name || '',
                });
            }
        } else if (key === 'dro') {
            if (value === '0') {
                onFilterChange({ ...filters, dro_id: '0', dro_name: '' });
            } else {
                const dro = dros.find((d) => d.region_id == value);
                onFilterChange({
                    ...filters,
                    dro_id: dro?.region_id || '',
                    dro_name: dro?.region_name || '',
                });
            }
        } else {
            onFilterChange({ ...filters, [key]: value });
        }
    };

    return (
        <View style={styles.container}>
            {/* Row 1: Status Filter (Full Width) */}
            <View style={styles.fullWidthRow}>
                <SearchableSelect
                    options={statuses}
                    value={filters.status_id || ''}
                    onChange={(value: string) => handleFilterUpdate('status', value)}
                    labelKey="status_name"
                    valueKey="status_id"
                    placeholder="Select Status"
                    disabled={disableStatusFilter}
                    showAllOption={false}
                    isLoading={isLoadingStatuses}
                />
            </View>

            {/* Row 2: Search Input */}
            <View style={styles.searchContainer}>
                <Search size={18} color={COLORS?.textSecondary || '#666'} style={styles.searchIcon} />
                <TextInput
                    style={styles.input}
                    placeholder="Search tickets no or camera name"
                    placeholderTextColor={COLORS?.textSecondary || '#666'}
                    value={filters.search}
                    onChangeText={(text) => handleFilterUpdate('search', text)}
                />
            </View>

            {/* Row 2.5: Date Filters */}
            <View style={styles.dateRow}>
                <View style={styles.dateField}>
                    <Text style={styles.fieldLabel}>Start Date</Text>
                    <CustomDatePicker
                        value={filters.start_date}
                        onChange={(val: string) => onFilterChange({ ...filters, start_date: val })}
                        placeholder="Select start date"
                        maxDate={filters.end_date}
                    />
                </View>
                <View style={styles.dateField}>
                    <Text style={styles.fieldLabel}>End Date</Text>
                    <CustomDatePicker
                        value={filters.end_date}
                        onChange={(val: string) => onFilterChange({ ...filters, end_date: val })}
                        placeholder="Select end date"
                        minDate={filters.start_date}
                    />
                </View>
            </View>

            {/* Row 3: Priority & Category */}
            <View style={styles.row}>
                <View style={styles.filterWrapper}>
                    <SearchableSelect
                        options={priorities}
                        value={filters.priority_id}
                        onChange={(value: string) => handleFilterUpdate('priority', value)}
                        labelKey="priority_name"
                        valueKey="priority_id"
                        allOptionLabel="All Priorities"
                        placeholder="Select Priority"
                    />
                </View>

                <View style={styles.filterWrapper}>
                    <SearchableSelect
                        options={vendors}
                        value={filters.vendor_id}
                        onChange={(value: string) => handleFilterUpdate('vendor', value)}
                        labelKey="vendor_name"
                        valueKey="vendor_id"
                        allOptionLabel="All Vendors"
                        placeholder="Select Vendor"
                        disabled={isVendorRestricted}
                        isLoading={isLoadingVendors}
                    />
                </View>
            </View>

            {/* Row 4: Category & DRO */}
            <View style={styles.row}>
                <View style={styles.filterWrapper}>
                    <SearchableSelect
                        options={categories}
                        value={filters.category_id}
                        onChange={(value: string) => handleFilterUpdate('category', value)}
                        labelKey="incident_category_name"
                        valueKey="incident_category_id"
                        allOptionLabel="All Categories"
                        placeholder="Select Category"
                        isLoading={isLoadingCategories}
                    />
                </View>

                <View style={styles.filterWrapper}>
                    <SearchableSelect
                        options={dros}
                        value={filters.dro_id}
                        onChange={(value: string) => handleFilterUpdate('dro', value)}
                        labelKey="region_name"
                        valueKey="region_id"
                        allOptionLabel="All DRO/Regions"
                        placeholder="Select DRO/Region"
                        isLoading={isLoadingDros}
                    />
                </View>
            </View>

            {/* Row 5: Action Buttons */}
            <View style={styles.actionRow}>
                <TouchableOpacity
                    style={[
                        styles.searchButton,
                        (!filters.start_date || !filters.end_date) && styles.disabledSearchButton
                    ]}
                    onPress={() => onSearch()}
                    disabled={!filters.start_date || !filters.end_date}
                >
                    <Text style={styles.searchButtonText}>Search</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => {
                        onFilterChange({
                            ...filters,
                            search: '',
                            priority_id: '',
                            priority_name: '',
                            // status_id: filters.status_id, // Keep current status
                            // status_name: filters.status_name, // Keep current status
                            vendor_id: filters.vendor_id,
                            vendor_name: filters.vendor_name,
                            start_date: '',
                            end_date: '',
                            category_id: '',
                            category_name: '',
                            dro_id: '',
                            dro_name: '',
                        });
                        if (onClear) onClear();
                    }}
                >
                    <Text style={styles.actionButtonText}>Clear</Text>
                </TouchableOpacity>
            </View>

            <Text style={styles.statsText}>Showing {totalTickets} tickets</Text>
        </View >
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 16,
        backgroundColor: COLORS?.surface || '#fff',
        borderBottomWidth: 1,
        borderBottomColor: COLORS?.border || '#ccc',
    },
    fullWidthRow: {
        marginBottom: 12,
    },
    row: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 12,
    },
    actionRow: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 4,
    },
    filterWrapper: {
        flex: 1,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS?.background || '#f1f5f9',
        borderRadius: 8,
        paddingHorizontal: 12,
        height: 50,
        borderWidth: 1,
        borderColor: COLORS?.border || '#ccc',
        marginBottom: 12,
    },
    searchIcon: {
        marginRight: 8,
    },
    input: {
        flex: 1,
        fontSize: 15,
        color: COLORS?.text || '#000',
        height: '100%',
    },
    statsText: {
        marginTop: 12,
        fontSize: 12,
        color: COLORS?.textSecondary || '#666',
    },
    // Select styles
    selectContainer: {
        // marginRight: 8, // Handled by gap
    },
    selectButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS?.surface || '#fff',
        borderWidth: 1,
        borderColor: COLORS?.border || '#ccc',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        justifyContent: 'space-between',
        height: 44,
    },
    disabledButton: {
        opacity: 0.5,
        backgroundColor: COLORS?.background || '#f1f5f9',
    },
    selectButtonText: {
        fontSize: 13,
        color: COLORS?.text || '#000',
        marginRight: 8,
        flex: 1,
    },
    actionButton: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        backgroundColor: '#fee2e2',
        height: 44,
    },
    actionButtonText: {
        fontSize: 13,
        color: '#dc2626',
        fontWeight: '600',
    },
    searchButton: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        backgroundColor: COLORS?.primary || '#2563eb',
        height: 44,
    },
    disabledSearchButton: {
        opacity: 0.5,
        backgroundColor: '#94a3b8',
    },
    searchButtonText: {
        fontSize: 13,
        color: '#fff',
        fontWeight: '600',
    },
    userInfoBox: {
        flex: 1,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        backgroundColor: (COLORS?.primary || '#2563eb') + '15', // Light blue background
        borderWidth: 1,
        borderColor: COLORS?.primary || '#2563eb' || '#2563eb',
        justifyContent: 'center',
        alignItems: 'center',
        height: 44,
    },
    userInfoText: {
        fontSize: 13,
        color: COLORS?.primary || '#2563eb',
        fontWeight: '700',
    },
    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: COLORS?.surface || '#fff',
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        maxHeight: '80%',
        padding: 16,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS?.text || '#000',
    },
    searchInput: {
        backgroundColor: COLORS?.background || '#f1f5f9',
        borderRadius: 8,
        padding: 12,
        marginBottom: 16,
        fontSize: 16,
        color: COLORS?.text || '#000',
    },
    optionItem: {
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: COLORS?.border || '#ccc',
    },
    selectedOption: {
        backgroundColor: (COLORS?.background || '#f1f5f9') + '40', // slightly darker
    },
    optionText: {
        fontSize: 16,
        color: COLORS?.text || '#000',
    },
    selectedOptionText: {
        color: COLORS?.primary || '#2563eb',
        fontWeight: '600',
    },
    datePickerContainer: {
        width: '100%',
    },
    dateRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 12,
    },
    dateInputWrapper: {
        flex: 1,
    },
    dateLabel: {
        fontSize: 10,
        color: COLORS?.textSecondary || '#666',
        marginBottom: 4,
        marginLeft: 4,
    },
    dateField: {
        flex: 1,
    },
    fieldLabel: {
        fontSize: 10,
        color: COLORS?.textSecondary || '#666',
        marginBottom: 4,
        marginLeft: 4,
    },
    dateInput: {
        backgroundColor: COLORS?.background || '#f1f5f9',
        borderRadius: 8,
        paddingHorizontal: 12,
        height: 40,
        borderWidth: 1,
        borderColor: COLORS?.border || '#ccc',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    dateInputText: {
        fontSize: 13,
        color: COLORS?.text || '#000',
    },
    centeredModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    calendarModalContent: {
        backgroundColor: COLORS?.surface || '#fff',
        borderRadius: 20,
        padding: 20,
        width: '90%',
        maxWidth: 350,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
        elevation: 10,
    },
    calendarHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    monthYearText: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS?.text || '#000',
    },
    weekDaysRow: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        marginBottom: 10,
    },
    weekDayText: {
        fontSize: 12,
        fontWeight: '600',
        color: COLORS?.textSecondary || '#666',
        width: '14.28%',
        textAlign: 'center',
    },
    daysGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'flex-start',
    },
    dayButton: {
        width: '14.28%',
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginVertical: 2,
    },
    selectedDayButton: {
        backgroundColor: COLORS?.primary || '#2563eb',
        borderRadius: 20,
        // Make sure it looks like a circle even with percentage container
        maxWidth: 40,
        alignSelf: 'center',
    },
    dayText: {
        fontSize: 14,
        color: COLORS?.text || '#000',
    },
    selectedDayText: {
        color: '#fff',
        fontWeight: '700',
    },
    disabledDayButton: {
        backgroundColor: 'transparent',
        opacity: 0.3,
    },
    disabledDayText: {
        color: COLORS?.textSecondary || '#666',
        textDecorationLine: 'line-through',
    },
    headerSelectionRow: {
        flexDirection: 'row',
        gap: 8,
        alignItems: 'center',
    },
    selectionGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-around',
        paddingVertical: 10,
    },
    selectionItem: {
        width: '30%',
        paddingVertical: 12,
        alignItems: 'center',
        marginVertical: 4,
        borderRadius: 8,
        backgroundColor: COLORS?.background || '#f1f5f9',
    },
    activeSelectionItem: {
        backgroundColor: COLORS?.primary || '#2563eb',
    },
    selectionText: {
        fontSize: 14,
        color: COLORS?.text || '#000',
    },
    activeSelectionText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    calendarFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 20,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: COLORS?.border || '#ccc',
    },
    todayButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
        backgroundColor: (COLORS?.primary || '#2563eb') + '15',
    },
    todayButtonText: {
        color: COLORS?.primary || '#2563eb',
        fontSize: 14,
        fontWeight: '600',
    },
    closeButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
    },
    closeButtonText: {
        color: COLORS?.textSecondary || '#666',
        fontSize: 14,
        fontWeight: '600',
    },
});