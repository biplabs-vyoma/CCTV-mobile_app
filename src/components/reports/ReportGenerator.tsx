
import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    TextInput,
    ActivityIndicator,
    Alert,
    Modal,
    FlatList
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZES } from '../../constants/theme';
import {
    FileText,
    Calendar as CalendarIcon,
    MapPin,
    Building,
    Users,
    Download,
    Check,
    X,
    ChevronDown
} from 'lucide-react-native';

interface ReportFormData {
    type: 'uptime' | 'downtime' | 'activity' | 'performance' | 'sla';
    dateRange: {
        start: string;
        end: string;
    };
    filters: {
        zones: string[];
        policeStations: string[];
        vendors: string[];
    };
    format: 'pdf' | 'excel' | 'csv';
}

export const ReportGenerator: React.FC = () => {
    const [formData, setFormData] = useState<ReportFormData>({
        type: 'uptime',
        dateRange: {
            start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            end: new Date().toISOString().split('T')[0]
        },
        filters: {
            zones: [],
            policeStations: [],
            vendors: []
        },
        format: 'pdf'
    });

    const [isGenerating, setIsGenerating] = useState(false);
    const [activeModal, setActiveModal] = useState<string | null>(null);
    const [dateTarget, setDateTarget] = useState<'start' | 'end' | null>(null);
    const [calendarView, setCalendarView] = useState<'date' | 'month' | 'year'>('date');

    const reportTypes = [
        {
            value: 'uptime',
            label: 'Uptime Report',
            description: 'CCTV availability and operational status over time'
        },
        {
            value: 'downtime',
            label: 'Downtime Analysis',
            description: 'Detailed analysis of camera outages and issues'
        },
        {
            value: 'activity',
            label: 'Activity Log',
            description: 'User actions, logins, and system events'
        },
        {
            value: 'performance',
            label: 'Performance Metrics',
            description: 'Response times, resolution rates, and KPIs'
        },
        {
            value: 'sla',
            label: 'SLA Compliance',
            description: 'Service level agreement adherence by vendors'
        }
    ];

    const zones = ['Central', 'North', 'South', 'East', 'West'];
    const policeStations = ['Park Street PS', 'Burrabazar PS', 'Bidhannagar PS', 'New Market PS', 'Jadavpur PS'];
    const vendors = ['TechSol Systems', 'SecureVision Ltd', 'CityWatch Pro'];

    const handleGenerateReport = async () => {
        setIsGenerating(true);

        // Simulate report generation
        await new Promise(resolve => setTimeout(resolve, 3000));

        setIsGenerating(false);

        const currentType = reportTypes.find(t => t.value === formData.type);
        Alert.alert(
            "Report Generated",
            `${currentType?.label} generated successfully in ${formData.format.toUpperCase()} format!`
        );
    };

    const handleFilterChange = (filterType: keyof ReportFormData['filters'], value: string) => {
        setFormData(prev => ({
            ...prev,
            filters: {
                ...prev.filters,
                [filterType]: prev.filters[filterType].includes(value)
                    ? prev.filters[filterType].filter(item => item !== value)
                    : [...prev.filters[filterType], value]
            }
        }));
    };

    const toggleSelectItem = (type: string, value: string) => {
        if (type === 'zones') handleFilterChange('zones', value);
        if (type === 'stations') handleFilterChange('policeStations', value);
        if (type === 'vendors') handleFilterChange('vendors', value);
    };

    const renderDropdownModal = (
        title: string,
        data: string[],
        selectedItems: string[],
        onSelect: (value: string) => void
    ) => (
        <Modal
            visible={activeModal === title}
            transparent
            animationType="fade"
            onRequestClose={() => setActiveModal(null)}
        >
            <View
                style={styles.modalOverlay}
            >
                <View style={[styles.modalContent, { paddingBottom: Math.max(useSafeAreaInsets().bottom, 20) }]}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Select {title}</Text>
                        <TouchableOpacity onPress={() => setActiveModal(null)}>
                            <X size={24} color={COLORS.textPrimary} />
                        </TouchableOpacity>
                    </View>
                    <FlatList
                        data={data}
                        keyExtractor={(item) => item}
                        renderItem={({ item }) => {
                            const isSelected = selectedItems.includes(item);
                            return (
                                <TouchableOpacity
                                    style={[styles.optionItem, isSelected && styles.selectedOption]}
                                    onPress={() => onSelect(item)}
                                >
                                    <View style={styles.optionContent}>
                                        <View style={[styles.checkbox, isSelected && styles.checkboxChecked]}>
                                            {isSelected && <Check size={12} color="#fff" strokeWidth={3} />}
                                        </View>
                                        <Text style={[styles.optionText, isSelected && styles.selectedOptionText]}>
                                            {item}
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            );
                        }}
                    />
                    <TouchableOpacity style={styles.doneButton} onPress={() => setActiveModal(null)}>
                        <Text style={styles.doneButtonText}>Done</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );

    // Calendar State
    const [viewDate, setViewDate] = useState(new Date());

    const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

    const renderCalendarModal = () => {
        const year = viewDate.getFullYear();
        const month = viewDate.getMonth();

        const changeMonth = (offset: number) => {
            const newDate = new Date(viewDate);
            newDate.setMonth(newDate.getMonth() + offset);
            setViewDate(newDate);
        };

        const selectMonth = (m: number) => {
            const newDate = new Date(viewDate);
            newDate.setMonth(m);
            setViewDate(newDate);
            setCalendarView('date');
        };

        const selectYear = (y: number) => {
            const newDate = new Date(viewDate);
            newDate.setFullYear(y);
            setViewDate(newDate);
            setCalendarView('date');
        };

        const renderDateView = () => {
            const daysInMonth = getDaysInMonth(year, month);
            const firstDay = getFirstDayOfMonth(year, month);
            const days = [];

            for (let i = 0; i < firstDay; i++) {
                days.push(<View key={`pad-${i}`} style={styles.calendarDayEmpty} />);
            }

            const selectedDateStr = dateTarget === 'start' ? formData.dateRange.start : formData.dateRange.end;

            for (let i = 1; i <= daysInMonth; i++) {
                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
                const isSelected = selectedDateStr === dateStr;
                const isToday = new Date().toISOString().split('T')[0] === dateStr;

                // Validation Logic: End date cannot be before Start date
                let isDisabled = false;
                if (dateTarget === 'end' && formData.dateRange.start) {
                    isDisabled = dateStr < formData.dateRange.start;
                }

                days.push(
                    <TouchableOpacity
                        key={i}
                        disabled={isDisabled}
                        style={[
                            styles.calendarDay,
                            isSelected && styles.calendarDaySelected,
                            isToday && !isSelected && styles.calendarDayToday,
                            isDisabled && styles.calendarDayDisabled
                        ]}
                        onPress={() => {
                            setFormData(prev => {
                                const newData = { ...prev, dateRange: { ...prev.dateRange, [dateTarget!]: dateStr } };
                                // If start date is moved past end date, reset end date? 
                                // Or just allow user to pick. User specifically asked about End date surpassing Start.
                                return newData;
                            });
                            setActiveModal(null);
                        }}
                    >
                        <Text style={[
                            styles.calendarDayText,
                            isSelected && styles.calendarDayTextSelected,
                            isToday && !isSelected && styles.calendarDayTextToday,
                            isDisabled && styles.calendarDayTextDisabled
                        ]}>
                            {i}
                        </Text>
                    </TouchableOpacity>
                );
            }

            return (
                <>
                    <View style={styles.weekDaysRow}>
                        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                            <Text key={d} style={styles.weekDayText}>{d}</Text>
                        ))}
                    </View>
                    <View style={styles.calendarGrid}>
                        {days}
                    </View>
                </>
            );
        };

        const renderMonthView = () => {
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            return (
                <View style={[styles.calendarGrid, { paddingVertical: SPACING.m }]}>
                    {months.map((m, index) => (
                        <TouchableOpacity
                            key={m}
                            style={[styles.selectorItem, month === index && styles.selectorItemActive]}
                            onPress={() => selectMonth(index)}
                        >
                            <Text style={[styles.selectorText, month === index && styles.selectorTextActive]}>{m}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            );
        };

        const renderYearView = () => {
            const years = [];
            const currentYear = new Date().getFullYear();
            for (let i = currentYear - 10; i <= currentYear + 10; i++) {
                years.push(i);
            }
            return (
                <View style={[styles.calendarGrid, { paddingVertical: SPACING.m }]}>
                    {years.map(y => (
                        <TouchableOpacity
                            key={y}
                            style={[styles.selectorItem, year === y && styles.selectorItemActive]}
                            onPress={() => selectYear(y)}
                        >
                            <Text style={[styles.selectorText, year === y && styles.selectorTextActive]}>{y}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            );
        };

        const monthName = viewDate.toLocaleString('default', { month: 'long' });

        return (
            <Modal
                visible={activeModal === 'Calendar'}
                transparent
                animationType="fade"
                onRequestClose={() => { setActiveModal(null); setCalendarView('date'); }}
            >
                <View
                    style={styles.modalOverlay}
                >
                    <View style={styles.calendarModalContent}>
                        <View style={styles.calendarHeader}>
                            {calendarView === 'date' ? (
                                <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.monthNavBtn}>
                                    <ChevronDown size={20} color={COLORS.textPrimary} style={{ transform: [{ rotate: '90deg' }] }} />
                                </TouchableOpacity>
                            ) : <View style={{ width: 32 }} />}

                            <View style={styles.calendarTitleGroup}>
                                <TouchableOpacity
                                    style={styles.calendarTitleContainer}
                                    onPress={() => setCalendarView(calendarView === 'month' ? 'date' : 'month')}
                                >
                                    <Text style={styles.calendarTitle} numberOfLines={1}>{monthName}</Text>
                                    <ChevronDown size={12} color={COLORS.textPrimary} />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.calendarTitleContainer}
                                    onPress={() => setCalendarView(calendarView === 'year' ? 'date' : 'year')}
                                >
                                    <Text style={styles.calendarTitle} numberOfLines={1}>{year}</Text>
                                    <ChevronDown size={12} color={COLORS.textPrimary} />
                                </TouchableOpacity>
                            </View>

                            {calendarView === 'date' ? (
                                <TouchableOpacity onPress={() => changeMonth(1)} style={styles.monthNavBtn}>
                                    <ChevronDown size={20} color={COLORS.textPrimary} style={{ transform: [{ rotate: '-90deg' }] }} />
                                </TouchableOpacity>
                            ) : <View style={{ width: 32 }} />}
                        </View>

                        {calendarView === 'date' && renderDateView()}
                        {calendarView === 'month' && renderMonthView()}
                        {calendarView === 'year' && renderYearView()}

                        <View style={styles.calendarFooter}>
                            <TouchableOpacity
                                style={[styles.shortcutBtn, (dateTarget === 'end' && new Date().toISOString().split('T')[0] < formData.dateRange.start) && styles.disabledButton]}
                                onPress={() => {
                                    const d = new Date().toISOString().split('T')[0];
                                    if (dateTarget === 'end' && d < formData.dateRange.start) {
                                        Alert.alert("Invalid Selection", "End date cannot be before Start date.");
                                        return;
                                    }
                                    setFormData(prev => ({ ...prev, dateRange: { ...prev.dateRange, [dateTarget!]: d } }));
                                    setActiveModal(null);
                                    setCalendarView('date');
                                }}
                            >
                                <Text style={styles.shortcutText}>Today</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.cancelLink}
                                onPress={() => { setActiveModal(null); setCalendarView('date'); }}
                            >
                                <Text style={styles.cancelLinkText}>Close</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        );
    };

    const RadioButton = ({ selected, label, onPress }: { selected: boolean, label: string, onPress: () => void }) => (
        <TouchableOpacity style={styles.radioContainer} onPress={onPress}>
            <View style={[styles.radio, selected && styles.radioSelected]}>
                {selected && <View style={styles.radioInner} />}
            </View>
            <Text style={styles.radioLabel}>{label}</Text>
        </TouchableOpacity>
    );

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Report Type Selection */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Select Report Type</Text>
                <View style={styles.typesGrid}>
                    {reportTypes.map((type) => {
                        const isSelected = formData.type === type.value;
                        return (
                            <TouchableOpacity
                                key={type.value}
                                onPress={() => setFormData(prev => ({ ...prev, type: type.value as any }))}
                                style={[styles.typeCard, isSelected && styles.typeCardActive]}
                            >
                                <View style={styles.typeHeader}>
                                    <FileText
                                        size={20}
                                        color={isSelected ? (COLORS?.primary || '#2563eb') : (COLORS?.textSecondary || '#666')}
                                        style={styles.typeIcon}
                                    />
                                    <View style={styles.typeTextContainer}>
                                        <Text style={[styles.typeLabel, isSelected && styles.typeLabelActive]}>{type.label}</Text>
                                        <Text style={styles.typeDescription}>{type.description}</Text>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </View>

            {/* Date Range */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Date Range</Text>
                <View style={styles.dateRangeRow}>
                    <TouchableOpacity
                        style={styles.dateInputContainer}
                        onPress={() => { setDateTarget('start'); setActiveModal('Calendar'); }}
                    >
                        <Text style={styles.inputLabel}>Start Date</Text>
                        <View style={styles.inputWrapper}>
                            <CalendarIcon size={18} color={COLORS.textSecondary} style={styles.inputIcon} />
                            <Text style={styles.dateText}>{formData.dateRange.start}</Text>
                        </View>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.dateInputContainer}
                        onPress={() => { setDateTarget('end'); setActiveModal('Calendar'); }}
                    >
                        <Text style={styles.inputLabel}>End Date</Text>
                        <View style={styles.inputWrapper}>
                            <CalendarIcon size={18} color={COLORS.textSecondary} style={styles.inputIcon} />
                            <Text style={styles.dateText}>{formData.dateRange.end}</Text>
                        </View>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Filters */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Filters</Text>
                <View style={styles.filtersVerticalGrid}>
                    {/* Zones Dropdown */}
                    <View style={styles.filterField}>
                        <View style={styles.filterTitleRow}>
                            <MapPin size={16} color={COLORS.textSecondary} />
                            <Text style={styles.filterGroupName}>Zones</Text>
                        </View>
                        <TouchableOpacity style={styles.dropdownTrigger} onPress={() => setActiveModal('Zones')}>
                            <Text style={styles.dropdownValue} numberOfLines={1}>
                                {formData.filters.zones.length > 0 ? formData.filters.zones.join(', ') : 'All Zones'}
                            </Text>
                            <ChevronDown size={20} color={COLORS.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    {/* Police Stations Dropdown */}
                    <View style={styles.filterField}>
                        <View style={styles.filterTitleRow}>
                            <Building size={16} color={COLORS.textSecondary} />
                            <Text style={styles.filterGroupName}>Police Stations</Text>
                        </View>
                        <TouchableOpacity style={styles.dropdownTrigger} onPress={() => setActiveModal('Stations')}>
                            <Text style={styles.dropdownValue} numberOfLines={1}>
                                {formData.filters.policeStations.length > 0 ? formData.filters.policeStations.join(', ') : 'All Stations'}
                            </Text>
                            <ChevronDown size={20} color={COLORS.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    {/* Vendors Dropdown */}
                    <View style={styles.filterField}>
                        <View style={styles.filterTitleRow}>
                            <Users size={16} color={COLORS.textSecondary} />
                            <Text style={styles.filterGroupName}>Vendors</Text>
                        </View>
                        <TouchableOpacity style={styles.dropdownTrigger} onPress={() => setActiveModal('Vendors')}>
                            <Text style={styles.dropdownValue} numberOfLines={1}>
                                {formData.filters.vendors.length > 0 ? formData.filters.vendors.join(', ') : 'All Vendors'}
                            </Text>
                            <ChevronDown size={20} color={COLORS.textSecondary} />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            {/* Output Format */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Output Format</Text>
                <View style={styles.radioGroup}>
                    <RadioButton
                        label="PDF Document"
                        selected={formData.format === 'pdf'}
                        onPress={() => setFormData(prev => ({ ...prev, format: 'pdf' }))}
                    />
                    <RadioButton
                        label="Excel Spreadsheet"
                        selected={formData.format === 'excel'}
                        onPress={() => setFormData(prev => ({ ...prev, format: 'excel' }))}
                    />
                    <RadioButton
                        label="CSV File"
                        selected={formData.format === 'csv'}
                        onPress={() => setFormData(prev => ({ ...prev, format: 'csv' }))}
                    />
                </View>
            </View>

            {/* Generate Button */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.generateButton, isGenerating && styles.disabledButton]}
                    onPress={handleGenerateReport}
                    disabled={isGenerating}
                >
                    {isGenerating ? (
                        <>
                            <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />
                            <Text style={styles.generateButtonText}>Generating Report...</Text>
                        </>
                    ) : (
                        <>
                            <Download size={18} color="#fff" style={{ marginRight: 8 }} />
                            <Text style={styles.generateButtonText}>Generate Report</Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>

            {/* Modals */}
            {renderDropdownModal('Zones', zones, formData.filters.zones, (val) => toggleSelectItem('zones', val))}
            {renderDropdownModal('Stations', policeStations, formData.filters.policeStations, (val) => toggleSelectItem('stations', val))}
            {renderDropdownModal('Vendors', vendors, formData.filters.vendors, (val) => toggleSelectItem('vendors', val))}
            {renderCalendarModal()}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        padding: SPACING.l,
        paddingBottom: SPACING.xl,
    },
    section: {
        marginBottom: SPACING.xl,
    },
    sectionTitle: {
        fontSize: FONT_SIZES.m,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
        marginBottom: SPACING.m,
    },
    typesGrid: {
        gap: SPACING.m,
    },
    typeCard: {
        backgroundColor: '#fff',
        borderRadius: BORDER_RADIUS.m,
        padding: SPACING.m,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    typeCardActive: {
        borderColor: COLORS.primary,
        backgroundColor: '#eff6ff',
    },
    typeHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: SPACING.m,
    },
    typeIcon: {
        marginTop: 2,
    },
    typeTextContainer: {
        flex: 1,
    },
    typeLabel: {
        fontSize: FONT_SIZES.s,
        fontWeight: '600',
        color: COLORS.textPrimary,
    },
    typeLabelActive: {
        color: COLORS.primary,
    },
    typeDescription: {
        fontSize: 12,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    dateRangeRow: {
        flexDirection: 'row',
        gap: SPACING.m,
    },
    dateInputContainer: {
        flex: 1,
    },
    inputLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: COLORS.textSecondary,
        marginBottom: 6,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: BORDER_RADIUS.m,
        backgroundColor: '#fff',
        paddingHorizontal: SPACING.s,
        height: 40,
    },
    inputIcon: {
        marginRight: SPACING.xs,
    },
    dateText: {
        fontSize: 14,
        color: COLORS.textPrimary,
    },
    filtersVerticalGrid: {
        gap: SPACING.m,
    },
    filterField: {
        gap: 6,
    },
    filterTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.xs,
    },
    filterGroupName: {
        fontSize: 12,
        fontWeight: '600',
        color: COLORS.textSecondary,
    },
    dropdownTrigger: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#fff',
        borderRadius: BORDER_RADIUS.m,
        paddingHorizontal: SPACING.m,
        height: 48,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    dropdownValue: {
        flex: 1,
        fontSize: 14,
        color: COLORS.textPrimary,
        marginRight: SPACING.s,
    },
    radioGroup: {
        gap: SPACING.m,
    },
    radioContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.s,
    },
    radio: {
        width: 18,
        height: 18,
        borderRadius: 9,
        borderWidth: 1,
        borderColor: COLORS.border,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
    },
    radioSelected: {
        borderColor: COLORS.primary,
    },
    radioInner: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: COLORS.primary,
    },
    radioLabel: {
        fontSize: 14,
        color: COLORS.textPrimary,
    },
    footer: {
        paddingTop: SPACING.l,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
    },
    generateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.primary,
        paddingVertical: SPACING.m,
        borderRadius: BORDER_RADIUS.m,
    },
    disabledButton: {
        opacity: 0.6,
    },
    generateButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: FONT_SIZES.m,
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: SPACING.l,
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: BORDER_RADIUS.l,
        width: '90%',
        alignSelf: 'center',
        maxHeight: '80%',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: SPACING.l,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    modalTitle: {
        fontSize: FONT_SIZES.l,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
    },
    optionItem: {
        padding: SPACING.m,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    optionContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.m,
    },
    checkbox: {
        width: 20,
        height: 20,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: COLORS.border,
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkboxChecked: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    selectedOption: {
        backgroundColor: '#f8fafc',
    },
    optionText: {
        fontSize: FONT_SIZES.m,
        color: COLORS.textPrimary,
    },
    selectedOptionText: {
        color: COLORS.primary,
        fontWeight: '600',
    },
    doneButton: {
        backgroundColor: COLORS.primary,
        padding: SPACING.m,
        alignItems: 'center',
        borderBottomLeftRadius: BORDER_RADIUS.l,
        borderBottomRightRadius: BORDER_RADIUS.l,
    },
    doneButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: FONT_SIZES.m,
    },
    // Calendar Styles
    calendarModalContent: {
        backgroundColor: '#fff',
        borderRadius: BORDER_RADIUS.l,
        width: '90%',
        alignSelf: 'center',
        padding: SPACING.m,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
    },
    calendarHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.m,
        paddingHorizontal: 2,
    },
    calendarTitleGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        flex: 1,
    },
    calendarTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
        marginRight: 2,
    },
    calendarTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SPACING.s,
        paddingVertical: 4,
        backgroundColor: '#f3f4f6',
        borderRadius: BORDER_RADIUS.s,
        flexShrink: 1, // Allow it to shrink if needed
    },
    selectorItem: {
        width: '33.33%',
        paddingVertical: SPACING.m,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: BORDER_RADIUS.m,
    },
    selectorItemActive: {
        backgroundColor: COLORS.primary,
    },
    selectorText: {
        fontSize: 14,
        color: COLORS.textPrimary,
    },
    selectorTextActive: {
        color: '#fff',
        fontWeight: 'bold',
    },
    monthNavBtn: {
        padding: 6, // Smaller padding
        backgroundColor: '#f3f4f6',
        borderRadius: BORDER_RADIUS.s,
    },
    weekDaysRow: {
        flexDirection: 'row',
        marginBottom: SPACING.s,
    },
    weekDayText: {
        flex: 1,
        textAlign: 'center',
        fontSize: 12,
        fontWeight: 'bold',
        color: COLORS.textSecondary,
    },
    calendarGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    calendarDay: {
        width: '14.28%',
        aspectRatio: 1,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: BORDER_RADIUS.s,
    },
    calendarDayEmpty: {
        width: '14.28%',
        aspectRatio: 1,
    },
    calendarDaySelected: {
        backgroundColor: COLORS.primary,
    },
    calendarDayToday: {
        backgroundColor: '#eff6ff',
        borderWidth: 1,
        borderColor: COLORS.primary,
    },
    calendarDayText: {
        fontSize: 14,
        color: COLORS.textPrimary,
    },
    calendarDayTextSelected: {
        color: '#fff',
        fontWeight: 'bold',
    },
    calendarDayTextToday: {
        color: COLORS.primary,
        fontWeight: 'bold',
    },
    calendarDayDisabled: {
        opacity: 0.3,
    },
    calendarDayTextDisabled: {
        color: COLORS.textSecondary,
        textDecorationLine: 'line-through',
    },
    calendarFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: SPACING.m,
        paddingTop: SPACING.m,
        paddingHorizontal: SPACING.s,
        borderTopWidth: 1,
        borderTopColor: '#f3f4f6',
        gap: SPACING.m,
    },
    cancelLink: {
        padding: SPACING.s,
    },
    cancelLinkText: {
        color: COLORS.textSecondary,
        fontWeight: '600',
    },
    shortcutBtn: {
        backgroundColor: '#eff6ff',
        paddingHorizontal: SPACING.m,
        paddingVertical: SPACING.s,
        borderRadius: BORDER_RADIUS.m,
    },
    shortcutText: {
        fontSize: 12,
        color: COLORS.primary,
        fontWeight: '600',
    },
});
