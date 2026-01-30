
import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Keyboard } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZES } from '../../constants/theme';
import {
    Calendar,
    Search,
    MapPin,
    Filter,
    X,
    Check,
    ChevronDown,
    Building2,
    LocateFixed,
    Ticket,
    Clock
} from 'lucide-react-native';

interface HistoryReport {
    id: string;
    title: string;
    type: string;
    generatedBy: string;
    generatedAt: Date;
    status: 'ready' | 'generating' | 'failed';
    size: string;
    format: string;
}

const mockReports: HistoryReport[] = [
    {
        id: 'RPT001',
        title: 'Monthly Uptime Report - December 2024',
        type: 'Uptime Report',
        generatedBy: 'Inspector Rajesh Kumar',
        generatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        status: 'ready',
        size: '2.4 MB',
        format: 'PDF'
    },
    {
        id: 'RPT002',
        title: 'Vendor Performance Analysis - Q4 2024',
        type: 'Performance Metrics',
        generatedBy: 'Admin User',
        generatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        status: 'ready',
        size: '1.8 MB',
        format: 'Excel'
    },
    {
        id: 'RPT003',
        title: 'System Activity Log - Last Week',
        type: 'Activity Log',
        generatedBy: 'Inspector Rajesh Kumar',
        generatedAt: new Date(Date.now() - 10 * 60 * 1000),
        status: 'generating',
        size: '-',
        format: 'CSV'
    },
    {
        id: 'RPT004',
        title: 'SLA Compliance Report - November 2024',
        type: 'SLA Compliance',
        generatedBy: 'Admin User',
        generatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        status: 'failed',
        size: '-',
        format: 'PDF'
    },
    {
        id: 'RPT005',
        title: 'CCTV Health Check - Oct 2024',
        type: 'Health Check',
        generatedBy: 'Admin User',
        generatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        status: 'ready',
        size: '1.1 MB',
        format: 'PDF'
    },
    {
        id: 'RPT006',
        title: 'System Activity Log - Week 45',
        type: 'Activity Log',
        generatedBy: 'Inspector Rajesh Kumar',
        generatedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        status: 'ready',
        size: '3.5 MB',
        format: 'CSV'
    },

    {
        id: 'RPT007',
        title: 'Ticket Closure Rates - Q3 2024',
        type: 'Performance Metrics',
        generatedBy: 'Admin User',
        generatedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
        status: 'ready',
        size: '0.9 MB',
        format: 'Excel'
    },
    {
        id: 'RPT008',
        title: 'Monthly Uptime Report - November 2024',
        type: 'Uptime Report',
        generatedBy: 'Inspector Rajesh Kumar',
        generatedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
        status: 'ready',
        size: '2.1 MB',
        format: 'PDF'
    },
    {
        id: 'RPT009',
        title: 'Vendor Performance Analysis - Q3 2024',
        type: 'Performance Metrics',
        generatedBy: 'Admin User',
        generatedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        status: 'ready',
        size: '1.5 MB',
        format: 'Excel'
    },
    {
        id: 'RPT010',
        title: 'System Activity Log - Month 11',
        type: 'Activity Log',
        generatedBy: 'Inspector Rajesh Kumar',
        generatedAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000),
        status: 'ready',
        size: '4.0 MB',
        format: 'CSV'
    },
    {
        id: 'RPT011',
        title: 'Test Report 11',
        type: 'Test',
        generatedBy: 'Test User',
        generatedAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000),
        status: 'ready',
        size: '0.1 MB',
        format: 'PDF'
    },
    {
        id: 'RPT012',
        title: 'Test Report 12',
        type: 'Test',
        generatedBy: 'Test User',
        generatedAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
        status: 'ready',
        size: '0.2 MB',
        format: 'PDF'
    },
];

export const ReportHistory: React.FC = () => {
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8; // Slightly reduced for mobile screen space
    const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

    React.useEffect(() => {
        const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => setIsKeyboardVisible(true));
        const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => setIsKeyboardVisible(false));

        return () => {
            keyboardDidShowListener.remove();
            keyboardDidHideListener.remove();
        };
    }, []);

    const totalPages = Math.ceil(mockReports.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedReports = mockReports.slice(startIndex, endIndex);

    const handlePageChange = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    const formatDate = (date: Date) => {
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));

        if (hours < 1) {
            const minutes = Math.floor(diff / (1000 * 60));
            return `${minutes} min ago`;
        }
        if (hours < 24) {
            return `${hours} hr ago`;
        }
        const days = Math.floor(hours / 24);
        return `${days} d ago`;
    };

    const handleSelectDRO = (id: string, name: string) => {
        setFormData(prev => ({
            ...prev,
            region_id: id,
            region_name: id === "0" ? "Select DRO" : name,
            zone_id: "0",
            unit_id: "0"
        }));
        setActiveModal(null);
    };

    const renderDropdownModal = (
        title: string,
        data: any[],
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
                        data={[{ id: '0', name: `All ${title}s` }, ...data]}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={[
                                    styles.optionItem,
                                    currentValue === item.id && styles.selectedOption
                                ]}
                                onPress={() => onSelect(item.id, item.name)}
                            >
                                <Text style={[
                                    styles.optionText,
                                    currentValue === item.id && styles.selectedOptionText
                                ]}>
                                    {item.name}
                                </Text>
                                {currentValue === item.id && (
                                    <Check size={20} color={COLORS?.primary || '#2563eb'} />
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
            <ScrollView style={styles.scrollContent}>
                {/* Advanced Filter Card */}
                <View style={styles.filterCard}>
                    <View style={styles.filterHeader}>
                        <Search size={20} color={COLORS?.primary || '#2563eb'} />
                        <Text style={styles.filterTitle}>Advanced Filter</Text>
                    </View>

                    <FlatList
                        data={paginatedReports}
                        renderItem={renderReportItem}
                        keyExtractor={item => item.id}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                        ListFooterComponent={() => (
                            totalPages > 1 && !isKeyboardVisible ? (
                                <View style={styles.pagination}>
                                    <View style={styles.pageInfo}>
                                        <Text style={styles.pageInfoText}>
                                            Page <Text style={styles.bold}>{currentPage}</Text> of {totalPages}
                                        </Text>
                                        {fetchingMaster ? (
                                            <ActivityIndicator size="small" color={COLORS.primary} />
                                        ) : (
                                            <ChevronDown size={20} color={COLORS.textSecondary} />
                                        )}
                                    </View>
                                </View>
                            ) : null
                        )}
                    />

                    {/* Other filters (Placeholders for now) */}
                    <View style={styles.filterItem}>
                        <Text style={styles.filterLabel}>Police Station</Text>
                        <View style={[styles.selectButton, styles.disabledButton]}>
                            <Text style={styles.placeholderText}>Select Station</Text>
                            <ChevronDown size={20} color="#cbd5e1" />
                        </View>
                    </View>
                </View>

                {/* Date Filters */}
                <View style={styles.dateRow}>
                    <View style={[styles.filterItem, { flex: 1 }]}>
                        <Text style={styles.filterLabel}>Start Date</Text>
                        <View style={styles.dateInput}>
                            <Calendar size={16} color={COLORS.primary} />
                            <Text style={styles.dateText}>{formData.start_date}</Text>
                        </View>
                    </View>
                    <View style={[styles.filterItem, { flex: 1 }]}>
                        <Text style={styles.filterLabel}>End Date</Text>
                        <View style={styles.dateInput}>
                            <Calendar size={16} color={COLORS.primary} />
                            <Text style={styles.dateText}>{formData.end_date}</Text>
                        </View>
                    </View>
                </View>

                <TouchableOpacity
                    style={styles.generateButton}
                    activeOpacity={0.8}
                >
                    <Search size={18} color="#fff" />
                    <Text style={styles.generateButtonText}>Generate Report</Text>
                </TouchableOpacity>
        </View>

                {/* Info Message */ }
    <View style={styles.infoMessage}>
        <Text style={styles.infoText}>
            Select a DRO and click Generate Report to view history.
        </Text>
    </View>
            </ScrollView >

    {/* Modals */ }
{ renderDropdownModal('DRO', regionOptions, formData.region_id, (id, name) => handleSelectDRO(id, name)) }
        </View >
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    scrollContent: {
        flex: 1,
        padding: SPACING.m,
    },
    filterCard: {
        backgroundColor: '#fff',
        borderRadius: BORDER_RADIUS.m,
        padding: SPACING.m,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    filterHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.s,
        marginBottom: SPACING.m,
    },
    filterTitle: {
        fontSize: FONT_SIZES.m,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    filterGrid: {
        gap: SPACING.m,
    },
    filterItem: {
        gap: 4,
    },
    filterLabel: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#64748b',
        textTransform: 'uppercase',
    },
    selectButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 44,
        paddingHorizontal: SPACING.m,
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: BORDER_RADIUS.s,
        backgroundColor: '#fff',
    },
    selectButtonText: {
        fontSize: 14,
        color: '#1e293b',
    },
    placeholderText: {
        color: '#94a3b8',
    },
    disabledButton: {
        backgroundColor: '#f1f5f9',
        borderColor: '#e2e8f0',
    },
    dateRow: {
        flexDirection: 'row',
        gap: SPACING.m,
        marginTop: SPACING.m,
    },
    dateInput: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.s,
        height: 44,
        paddingHorizontal: SPACING.m,
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: BORDER_RADIUS.s,
        backgroundColor: '#fff',
    },
    dateText: {
        fontSize: 14,
        color: '#1e293b',
    },
    generateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACING.s,
        backgroundColor: COLORS?.primary || '#2563eb',
        height: 48,
        borderRadius: BORDER_RADIUS.s,
        marginTop: SPACING.l,
    },
    generateButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    infoMessage: {
        marginTop: SPACING.xl,
        alignItems: 'center',
        padding: SPACING.xl,
    },
    infoText: {
        fontSize: 14,
        color: '#64748b',
        textAlign: 'center',
        fontStyle: 'italic',
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: SPACING.l,
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: BORDER_RADIUS.m,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: SPACING.m,
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    optionItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: SPACING.m,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    selectedOption: {
        backgroundColor: '#eff6ff',
    },
    optionText: {
        fontSize: 16,
        color: '#334155',
    },
    selectedOptionText: {
        color: COLORS?.primary || '#2563eb',
        fontWeight: 'bold',
    },
});
