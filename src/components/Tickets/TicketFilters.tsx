import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, FlatList, StyleSheet, ScrollView } from 'react-native';
import { Search, Filter, ChevronDown, X, ChevronLeft, ChevronRight } from 'lucide-react-native';
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
    };
    onFilterChange: (filters: any) => void;
    onSearch: () => void;
    totalTickets: number;
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
}: any) => {
    const [modalVisible, setModalVisible] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const safeOptions = Array.isArray(options) ? options : [];
    const fullOptions = [{ [valueKey]: allOptionValue, [labelKey]: allOptionLabel }, ...safeOptions];

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

    if (disabled) return null;

    return (
        <View style={styles.selectContainer}>
            <TouchableOpacity
                style={[styles.selectButton, disabled && styles.disabledButton]}
                onPress={() => !disabled && setModalVisible(true)}
                disabled={disabled}
                activeOpacity={0.7}
            >
                <Text style={styles.selectButtonText} numberOfLines={1}>{displayLabel}</Text>
                <ChevronDown size={16} color={COLORS.textSecondary} />
            </TouchableOpacity>

            <Modal
                visible={modalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{placeholder}</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                                <X size={24} color={COLORS.text} />
                            </TouchableOpacity>
                        </View>

                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search..."
                            placeholderTextColor={COLORS.textSecondary}
                            value={searchTerm}
                            onChangeText={setSearchTerm}
                        />

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
                            ListEmptyComponent={<Text style={{ padding: 20, textAlign: 'center', color: COLORS.textSecondary }}>No options found</Text>}
                        />
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const CustomDatePicker = ({ value, onChange, placeholder }: any) => {
    const [modalVisible, setModalVisible] = useState(false);

    // Parse current value or use today
    const parseFormattedDate = (dateStr: string) => {
        if (!dateStr) return new Date();
        const parts = dateStr.split('-');
        if (parts.length !== 3) return new Date();
        return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
    };

    const initialDate = parseFormattedDate(value);
    const [viewDate, setViewDate] = useState(initialDate); // Date for calendar navigation
    const selectedDate = initialDate;

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

        const calendarDays = [];
        // Fill empty slots for previous month's end
        for (let i = 0; i < firstDay; i++) {
            calendarDays.push(null);
        }
        // Fill current month's days
        for (let i = 1; i <= daysInMonth; i++) {
            calendarDays.push(i);
        }
        return calendarDays;
    };

    const changeMonth = (offset: number) => {
        const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + offset, 1);
        setViewDate(newDate);
    };

    const handleSelectDay = (day: number | null) => {
        if (!day) return;
        const year = viewDate.getFullYear();
        const month = viewDate.getMonth();
        const formattedDate = `${String(day).padStart(2, '0')}-${String(month + 1).padStart(2, '0')}-${year}`;
        onChange(formattedDate);
        setModalVisible(false);
    };

    const isSelected = (day: number) => {
        return selectedDate.getDate() === day &&
            selectedDate.getMonth() === viewDate.getMonth() &&
            selectedDate.getFullYear() === viewDate.getFullYear();
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
                <Text style={[styles.dateInputText, !value && { color: COLORS.textSecondary }]}>
                    {value || placeholder}
                </Text>
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
                                <ChevronLeft size={24} color={COLORS.primary} />
                            </TouchableOpacity>
                            <Text style={styles.monthYearText}>
                                {months[viewDate.getMonth()]} {viewDate.getFullYear()}
                            </Text>
                            <TouchableOpacity onPress={() => changeMonth(1)}>
                                <ChevronRight size={24} color={COLORS.primary} />
                            </TouchableOpacity>
                        </View>

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
                                        (day && isSelected(day)) ? styles.selectedDayButton : null
                                    ]}
                                    onPress={() => handleSelectDay(day)}
                                    disabled={!day}
                                >
                                    <Text style={[
                                        styles.dayText,
                                        !day ? { opacity: 0 } : null,
                                        (day && isSelected(day)) ? styles.selectedDayText : null
                                    ]}>
                                        {day}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={() => setModalVisible(false)}
                        >
                            <Text style={styles.closeButtonText}>Cancel</Text>
                        </TouchableOpacity>
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
    totalTickets,
}) => {
    const [vendors, setVendors] = useState<Array<any>>([]);
    const [statuses, setStatuses] = useState<Array<any>>([]);
    // @ts-ignore
    const { user } = useAuth();

    const isVendorRestricted = user?.user_type_id == 20 || user?.user_type_id == 30 || user?.user_type_id == 40;

    useEffect(() => {
        const getVendorOptions = async () => {
            try {
                const response: any = await callAPIWithEnc('master/getVendor', 'POST', {});
                setVendors(response?.data || []);
            } catch (e) {
                console.log('Error fetching vendors', e);
            }
        };
        const getStatusOptions = async () => {
            try {
                const response: any = await callAPIWithEnc('master/getStatusDetails', 'POST', {});
                const allStatuses = response?.data || [];
                // Filter to only include Assigned (220) and In Progress (230)
                const filteredStatuses = allStatuses.filter((s: any) => s.status_id == '220' || s.status_id == '230');
                setStatuses(filteredStatuses);
            } catch (e) {
                console.log('Error fetching statuses', e);
            }
        };
        getVendorOptions();
        getStatusOptions();
    }, []);

    useEffect(() => {
        if (isVendorRestricted && user?.vendor_id) {
            const vendor = vendors.find((v) => v.vendor_id == user.vendor_id);
            if (vendor && filters.vendor_id !== String(user.vendor_id)) {
                onFilterChange({
                    ...filters,
                    vendor_id: String(user.vendor_id),
                    vendor_name: vendor.vendor_name || '',
                });
            }
        }
    }, [vendors, user?.vendor_id, isVendorRestricted]);

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
            if (value === '0') {
                onFilterChange({ ...filters, status_id: '0', status_name: '' });
            } else {
                const status = statuses.find((s) => s.status_id == value);
                onFilterChange({
                    ...filters,
                    status_id: status?.status_id || '',
                    status_name: status?.status_name || '',
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
                    allOptionLabel="Select Status"
                    allOptionValue=""
                    placeholder="Select Status"
                />
            </View>

            {/* Row 2: Search Input */}
            <View style={styles.searchContainer}>
                <Search size={18} color={COLORS.textSecondary} style={styles.searchIcon} />
                <TextInput
                    style={styles.input}
                    placeholder="Search tickets..."
                    placeholderTextColor={COLORS.textSecondary}
                    value={filters.search}
                    onChangeText={(text) => handleFilterUpdate('search', text)}
                />
            </View>

            {/* Row 2.5: Date Filters */}
            <View style={styles.dateRow}>
                <View style={styles.dateInputWrapper}>
                    <Text style={styles.dateLabel}>Start Date</Text>
                    <CustomDatePicker
                        value={filters.start_date}
                        onChange={(text: string) => handleFilterUpdate('start_date', text)}
                        placeholder="Select Date"
                    />
                </View>
                <View style={styles.dateInputWrapper}>
                    <Text style={styles.dateLabel}>End Date</Text>
                    <CustomDatePicker
                        value={filters.end_date}
                        onChange={(text: string) => handleFilterUpdate('end_date', text)}
                        placeholder="Select Date"
                    />
                </View>
            </View>

            {/* Row 3: Priority, Vendor, Clear, and User Info in ONE row */}
            <View style={styles.bottomRow}>
                <View style={[styles.filterWrapper, { flex: 1.4 }]}>
                    <SearchableSelect
                        options={priorities}
                        value={filters.priority_id || '0'}
                        onChange={(value: string) => handleFilterUpdate('priority', value)}
                        labelKey="priority_name"
                        valueKey="priority_id"
                        allOptionLabel="All Priorities"
                        placeholder="Priority"
                    />
                </View>

                {!isVendorRestricted && (
                    <View style={styles.filterWrapper}>
                        <SearchableSelect
                            options={vendors}
                            value={filters.vendor_id || '0'}
                            onChange={(value: string) => handleFilterUpdate('vendor', value)}
                            labelKey="vendor_name"
                            valueKey="vendor_id"
                            allOptionLabel="All Vendors"
                            placeholder="Vendor"
                            disabled={isVendorRestricted}
                        />
                    </View>
                )}

                <TouchableOpacity
                    style={[styles.searchButton, { flex: 0.8 }]}
                    onPress={onSearch}
                >
                    <Text style={styles.searchButtonText}>Search</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.actionButton, { flex: 0.8 }]}
                    onPress={() => {
                        onFilterChange({
                            search: '',
                            status_id: '',
                            status_name: '',
                            priority_id: '0',
                            priority_name: '',
                            vendor_id: isVendorRestricted && user?.vendor_id ? String(user.vendor_id) : '0',
                            vendor_name: '',
                            start_date: '',
                            end_date: '',
                        });
                    }}
                >
                    <Text style={styles.actionButtonText}>Clear</Text>
                </TouchableOpacity>

                {/* <View style={[styles.userInfoBox, { flex: 0.8 }]}>
                    <Text style={styles.userInfoText} numberOfLines={1}>
                        {isVendorRestricted ? user?.vendor_name : user?.user_name || 'User'}
                    </Text>
                </View> */}
            </View>

            <Text style={styles.statsText}>Showing {totalTickets} tickets</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 16,
        backgroundColor: COLORS.surface,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    fullWidthRow: {
        marginBottom: 12,
    },
    bottomRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 50,
    },
    filterWrapper: {
        flex: 1,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.background,
        borderRadius: 8,
        paddingHorizontal: 12,
        height: 50,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    searchIcon: {
        marginRight: 8,
    },
    input: {
        flex: 1,
        fontSize: 15,
        color: COLORS.text,
        height: '100%',
    },
    statsText: {
        marginTop: 12,
        fontSize: 12,
        color: COLORS.textSecondary,
    },
    // Select styles
    selectContainer: {
        // marginRight: 8, // Handled by gap
    },
    selectButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        justifyContent: 'space-between',
        height: 44,
    },
    disabledButton: {
        opacity: 0.5,
        backgroundColor: COLORS.background,
    },
    selectButtonText: {
        fontSize: 13,
        color: COLORS.text,
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
        backgroundColor: COLORS.primary,
        height: 44,
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
        backgroundColor: COLORS.primary + '15', // Light blue background
        borderWidth: 1,
        borderColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        height: 44,
    },
    userInfoText: {
        fontSize: 13,
        color: COLORS.primary,
        fontWeight: '700',
    },
    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: COLORS.surface,
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
        color: COLORS.text,
    },
    searchInput: {
        backgroundColor: COLORS.background,
        borderRadius: 8,
        padding: 12,
        marginBottom: 16,
        fontSize: 16,
        color: COLORS.text,
    },
    optionItem: {
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    selectedOption: {
        backgroundColor: COLORS.background + '40', // slightly darker
    },
    optionText: {
        fontSize: 16,
        color: COLORS.text,
    },
    selectedOptionText: {
        color: COLORS.primary,
        fontWeight: '600',
    },
    datePickerContainer: {
        flex: 1,
    },
    dateRow: {
        flexDirection: 'row',
        gap: 8,
    },
    dateInputWrapper: {
        flex: 1,
    },
    dateLabel: {
        fontSize: 10,
        color: COLORS.textSecondary,
        marginBottom: 4,
        marginLeft: 4,
    },
    dateInput: {
        backgroundColor: COLORS.background,
        borderRadius: 8,
        paddingHorizontal: 12,
        height: 40,
        borderWidth: 1,
        borderColor: COLORS.border,
        justifyContent: 'center',
    },
    dateInputText: {
        fontSize: 13,
        color: COLORS.text,
    },
    centeredModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    calendarModalContent: {
        backgroundColor: COLORS.surface,
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
        color: COLORS.text,
    },
    weekDaysRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 10,
    },
    weekDayText: {
        fontSize: 12,
        fontWeight: '600',
        color: COLORS.textSecondary,
        width: 40,
        textAlign: 'center',
    },
    daysGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-around',
    },
    dayButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginVertical: 2,
        borderRadius: 20,
    },
    selectedDayButton: {
        backgroundColor: COLORS.primary,
    },
    dayText: {
        fontSize: 14,
        color: COLORS.text,
    },
    selectedDayText: {
        color: '#fff',
        fontWeight: '700',
    },
    closeButton: {
        marginTop: 20,
        paddingVertical: 12,
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
    },
    closeButtonText: {
        color: COLORS.textSecondary,
        fontSize: 15,
        fontWeight: '600',
    },
});
