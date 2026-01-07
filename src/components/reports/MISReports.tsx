
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, FlatList, ActivityIndicator, Alert } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZES } from '../../constants/theme';
import {
    BarChart3,
    TrendingUp,
    Clock,
    Users,
    AlertTriangle,
    CheckCircle,
    Download,
    ChevronDown,
    X
} from 'lucide-react-native';

export const MISReports: React.FC = () => {
    const [selectedPeriod, setSelectedPeriod] = useState('monthly');
    const [selectedReport, setSelectedReport] = useState('summary');
    const [isPeriodModalVisible, setPeriodModalVisible] = useState(false);

    const reportTypes = [
        { id: 'summary', label: 'Summary', icon: BarChart3 },
        { id: 'performance', label: 'Metrics', icon: TrendingUp },
        { id: 'sla', label: 'SLA', icon: Clock },
        { id: 'engineer', label: 'Engineer', icon: Users },
        { id: 'vendor', label: 'Vendor', icon: CheckCircle },
        { id: 'incidents', label: 'Incidents', icon: AlertTriangle }
    ];

    const periods = [
        { value: 'daily', label: 'Daily' },
        { value: 'weekly', label: 'Weekly' },
        { value: 'monthly', label: 'Monthly' },
        { value: 'quarterly', label: 'Quarterly' },
        { value: 'yearly', label: 'Yearly' }
    ];

    const summaryData = {
        totalTickets: 384,
        resolvedTickets: 339,
        avgResolutionTime: 4.2,
        slaCompliance: 94.8,
        criticalTickets: 8,
        overdueTickets: 12,
        engineerUtilization: 78.5,
        customerSatisfaction: 4.3
    };

    const performanceMetrics = [
        { metric: 'First Call Resolution', value: '87.3%', trend: '+2.1%', isPositive: true },
        { metric: 'Avg Response Time', value: '15.5 min', trend: '-3.2%', isPositive: true },
        { metric: 'Avg Resolution Time', value: '4.2 hrs', trend: '-8.1%', isPositive: true },
        { metric: 'Ticket Escalation Rate', value: '12.4%', trend: '+1.5%', isPositive: false },
        { metric: 'Customer Satisfaction', value: '4.3/5', trend: '+0.2', isPositive: true },
        { metric: 'SLA Breach Rate', value: '5.2%', trend: '-1.8%', isPositive: true }
    ];

    const vendorPerformance = [
        { vendor: 'TechSol Systems', tickets: 156, resolved: 148, avgTime: 3.8, sla: 96.2, rating: 4.8 },
        { vendor: 'SecureVision Ltd', tickets: 134, resolved: 125, avgTime: 4.1, sla: 93.3, rating: 4.6 },
        { vendor: 'CityWatch Pro', tickets: 94, resolved: 86, avgTime: 5.2, sla: 91.5, rating: 4.4 }
    ];

    const engineerStats = [
        { name: 'Rajesh Sharma', tickets: 45, resolved: 43, avgTime: 3.2, rating: 4.9 },
        { name: 'Priya Banerjee', tickets: 38, resolved: 36, avgTime: 3.8, rating: 4.8 },
        { name: 'Amit Kumar', tickets: 32, resolved: 29, avgTime: 4.5, rating: 4.6 }
    ];

    const handleExport = () => {
        const reportLabel = reportTypes.find(r => r.id === selectedReport)?.label;
        const periodLabel = periods.find(p => p.value === selectedPeriod)?.label;
        Alert.alert("Exporting Report", `Generating ${reportLabel} report for ${periodLabel} period...`);
    };

    const renderSummary = () => (
        <View style={styles.detailCard}>
            <Text style={styles.cardTitle}>Executive Summary</Text>

            <View style={styles.summaryGrid}>
                <View style={[styles.summaryItem, { backgroundColor: '#eff6ff' }]}>
                    <Text style={[styles.summaryValue, { color: '#2563eb' }]}>{summaryData.totalTickets}</Text>
                    <Text style={styles.summaryLabel}>Total Tickets</Text>
                </View>
                <View style={[styles.summaryItem, { backgroundColor: '#f0fdf4' }]}>
                    <Text style={[styles.summaryValue, { color: '#16a34a' }]}>{summaryData.resolvedTickets}</Text>
                    <Text style={styles.summaryLabel}>Resolved</Text>
                </View>
                <View style={[styles.summaryItem, { backgroundColor: '#fffbeb' }]}>
                    <Text style={[styles.summaryValue, { color: '#d97706' }]}>{summaryData.avgResolutionTime}h</Text>
                    <Text style={styles.summaryLabel}>Avg Res.</Text>
                </View>
                <View style={[styles.summaryItem, { backgroundColor: '#faf5ff' }]}>
                    <Text style={[styles.summaryValue, { color: '#9333ea' }]}>{summaryData.slaCompliance}%</Text>
                    <Text style={styles.summaryLabel}>SLA Comp.</Text>
                </View>
            </View>

            <View style={styles.metricsSplit}>
                <View style={styles.metricsColumn}>
                    <Text style={styles.columnHeader}>Critical Metrics</Text>
                    <View style={styles.metricRow}>
                        <Text style={styles.metricLabel}>Critical Tickets</Text>
                        <Text style={[styles.metricText, { color: '#dc2626' }]}>{summaryData.criticalTickets}</Text>
                    </View>
                    <View style={styles.metricRow}>
                        <Text style={styles.metricLabel}>Overdue Tickets</Text>
                        <Text style={[styles.metricText, { color: '#ea580c' }]}>{summaryData.overdueTickets}</Text>
                    </View>
                    <View style={styles.metricRow}>
                        <Text style={styles.metricLabel}>Eng. Utilization</Text>
                        <Text style={[styles.metricText, { color: '#2563eb' }]}>{summaryData.engineerUtilization}%</Text>
                    </View>
                </View>
                <View style={[styles.metricsColumn, { borderLeftWidth: 1, borderLeftColor: '#f3f4f6', paddingLeft: SPACING.m }]}>
                    <Text style={styles.columnHeader}>Quality Metrics</Text>
                    <View style={styles.metricRow}>
                        <Text style={styles.metricLabel}>Satisfaction</Text>
                        <Text style={[styles.metricText, { color: '#16a34a' }]}>{summaryData.customerSatisfaction}/5</Text>
                    </View>
                    <View style={styles.metricRow}>
                        <Text style={styles.metricLabel}>First Call Res.</Text>
                        <Text style={[styles.metricText, { color: '#16a34a' }]}>87.3%</Text>
                    </View>
                    <View style={styles.metricRow}>
                        <Text style={styles.metricLabel}>Reopened</Text>
                        <Text style={[styles.metricText, { color: '#d97706' }]}>3.2%</Text>
                    </View>
                </View>
            </View>
        </View>
    );

    const renderPerformance = () => (
        <View style={styles.detailCard}>
            <Text style={styles.cardTitle}>Performance Metrics</Text>
            <View style={styles.perfGrid}>
                {performanceMetrics.map((item, index) => (
                    <View key={index} style={styles.perfItem}>
                        <Text style={styles.perfLabel}>{item.metric}</Text>
                        <View style={styles.perfValueRow}>
                            <Text style={styles.perfValue}>{item.value}</Text>
                            <Text style={[styles.perfTrend, { color: item.isPositive ? '#16a34a' : '#dc2626' }]}>
                                {item.trend}
                            </Text>
                        </View>
                    </View>
                ))}
            </View>
        </View>
    );

    const renderVendor = () => (
        <View style={styles.detailCard}>
            <Text style={styles.cardTitle}>Vendor Analysis</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View>
                    <View style={styles.tableHeader}>
                        <Text style={[styles.headerCell, { width: 120 }]}>Vendor</Text>
                        <Text style={[styles.headerCell, { width: 60 }]}>Tickets</Text>
                        <Text style={[styles.headerCell, { width: 70 }]}>SLA%</Text>
                        <Text style={[styles.headerCell, { width: 60 }]}>Rating</Text>
                    </View>
                    {vendorPerformance.map((v, i) => (
                        <View key={i} style={styles.tableRow}>
                            <Text style={[styles.cellText, { width: 120, fontWeight: '600' }]} numberOfLines={1}>{v.vendor}</Text>
                            <Text style={[styles.cellText, { width: 60 }]}>{v.tickets}</Text>
                            <Text style={[styles.cellText, { width: 70, color: v.sla >= 95 ? '#16a34a' : '#d97706', fontWeight: 'bold' }]}>{v.sla}%</Text>
                            <Text style={[styles.cellText, { width: 60 }]}>{v.rating}/5</Text>
                        </View>
                    ))}
                </View>
            </ScrollView>
        </View>
    );

    const renderEngineer = () => (
        <View style={styles.detailCard}>
            <Text style={styles.cardTitle}>Engineer Performance</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View>
                    <View style={styles.tableHeader}>
                        <Text style={[styles.headerCell, { width: 120 }]}>Engineer</Text>
                        <Text style={[styles.headerCell, { width: 70 }]}>Resolved</Text>
                        <Text style={[styles.headerCell, { width: 70 }]}>Efficiency</Text>
                        <Text style={[styles.headerCell, { width: 60 }]}>Rating</Text>
                    </View>
                    {engineerStats.map((e, i) => (
                        <View key={i} style={styles.tableRow}>
                            <Text style={[styles.cellText, { width: 120, fontWeight: '600' }]} numberOfLines={1}>{e.name}</Text>
                            <Text style={[styles.cellText, { width: 70 }]}>{e.resolved}</Text>
                            <Text style={[styles.cellText, { width: 70, color: (e.resolved / e.tickets) >= 0.9 ? '#16a34a' : '#d97706', fontWeight: 'bold' }]}>
                                {((e.resolved / e.tickets) * 100).toFixed(0)}%
                            </Text>
                            <Text style={[styles.cellText, { width: 60 }]}>{e.rating}/5</Text>
                        </View>
                    ))}
                </View>
            </ScrollView>
        </View>
    );

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Header Area */}
            <View style={styles.header}>
                <View style={styles.headerTitle}>
                    <Text style={styles.title}>MIS Reports</Text>
                    <Text style={styles.subtitle}>Analytics and metrics dashboard</Text>
                </View>
                <View style={styles.headerActions}>
                    <TouchableOpacity
                        style={styles.periodSelector}
                        onPress={() => setPeriodModalVisible(true)}
                    >
                        <Text style={styles.periodText}>{periods.find(p => p.value === selectedPeriod)?.label}</Text>
                        <ChevronDown size={14} color={COLORS.textPrimary} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.exportBtn} onPress={handleExport}>
                        <Download size={18} color="#fff" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Report Type Grid */}
            <View style={styles.typeGrid}>
                {reportTypes.map((type) => {
                    const Icon = type.icon;
                    const isActive = selectedReport === type.id;
                    return (
                        <TouchableOpacity
                            key={type.id}
                            style={[styles.typeItem, isActive && styles.typeItemActive]}
                            onPress={() => setSelectedReport(type.id)}
                        >
                            <View style={[styles.typeIconBox, isActive && styles.typeIconBoxActive]}>
                                <Icon size={22} color={isActive ? (COLORS?.primary || '#2563eb') : (COLORS?.textSecondary || '#666')}
                                />
                            </View>
                            <Text style={[styles.typeLabel, isActive && styles.typeLabelActive]}>{type.label}</Text>
                        </TouchableOpacity>
                    );
                })}
            </View>

            {/* Content Area */}
            {selectedReport === 'summary' && renderSummary()}
            {selectedReport === 'performance' && renderPerformance()}
            {selectedReport === 'vendor' && renderVendor()}
            {selectedReport === 'engineer' && renderEngineer()}
            {(selectedReport === 'sla' || selectedReport === 'incidents') && (
                <View style={styles.placeholderCard}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                    <Text style={styles.placeholderText}>Detailed {selectedReport.toUpperCase()} report coming soon...</Text>
                </View>
            )}

            {/* Period Selection Modal */}
            <Modal
                visible={isPeriodModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setPeriodModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Select Reporting Period</Text>
                            <TouchableOpacity onPress={() => setPeriodModalVisible(false)}>
                                <X size={24} color={COLORS.textPrimary} />
                            </TouchableOpacity>
                        </View>
                        {periods.map((p) => (
                            <TouchableOpacity
                                key={p.value}
                                style={[styles.modalOption, selectedPeriod === p.value && styles.modalOptionActive]}
                                onPress={() => {
                                    setSelectedPeriod(p.value);
                                    setPeriodModalVisible(false);
                                }}
                            >
                                <Text style={[styles.modalOptionText, selectedPeriod === p.value && styles.modalOptionTextActive]}>
                                    {p.label}
                                </Text>
                                {selectedPeriod === p.value && <CheckCircle size={18} color={COLORS.primary} />}
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </Modal>
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
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.l,
    },
    headerTitle: {
        flex: 1,
    },
    title: {
        fontSize: FONT_SIZES.m,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
    },
    subtitle: {
        fontSize: 12,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    headerActions: {
        flexDirection: 'row',
        gap: SPACING.s,
    },
    periodSelector: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#fff',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: BORDER_RADIUS.s,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    periodText: {
        fontSize: 12,
        fontWeight: '600',
        color: COLORS?.textPrimary || '#1f2937',
    },
    exportBtn: {
        backgroundColor: COLORS?.primary || '#2563eb',
        padding: 8,
        borderRadius: BORDER_RADIUS.s,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
    },
    typeGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: SPACING.s,
        marginBottom: SPACING.l,
    },
    typeItem: {
        width: '31%', // Roughly 3 columns
        backgroundColor: '#fff',
        padding: SPACING.m,
        borderRadius: BORDER_RADIUS.m,
        borderWidth: 1,
        borderColor: COLORS?.border || '#e5e7eb',
        alignItems: 'center',
    },
    typeItemActive: {
        borderColor: COLORS?.primary || '#2563eb',
        backgroundColor: '#f0f7ff',
    },
    typeIconBox: {
        width: 44,
        height: 44,
        backgroundColor: '#f8fafc',
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    typeIconBoxActive: {
        backgroundColor: '#fff',
    },
    typeLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: COLORS.textSecondary,
        textAlign: 'center',
    },
    typeLabelActive: {
        color: COLORS.primary,
    },
    detailCard: {
        backgroundColor: '#fff',
        borderRadius: BORDER_RADIUS.m,
        padding: SPACING.m,
        borderWidth: 1,
        borderColor: COLORS.border,
        elevation: 1,
    },
    cardTitle: {
        fontSize: FONT_SIZES.s,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
        marginBottom: SPACING.m,
    },
    summaryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: SPACING.s,
        marginBottom: SPACING.l,
    },
    summaryItem: {
        width: '48%',
        padding: SPACING.m,
        borderRadius: BORDER_RADIUS.s,
        alignItems: 'center',
    },
    summaryValue: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    summaryLabel: {
        fontSize: 10,
        color: COLORS.textSecondary,
        marginTop: 2,
        fontWeight: '600',
    },
    metricsSplit: {
        flexDirection: 'row',
        gap: SPACING.s,
    },
    metricsColumn: {
        flex: 1,
        gap: 8,
    },
    columnHeader: {
        fontSize: 12,
        fontWeight: '600',
        color: COLORS.textPrimary,
        marginBottom: 4,
    },
    metricRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    metricLabel: {
        fontSize: 11,
        color: COLORS.textSecondary,
    },
    metricText: {
        fontSize: 11,
        fontWeight: '700',
    },
    perfGrid: {
        gap: SPACING.s,
    },
    perfItem: {
        padding: SPACING.m,
        backgroundColor: '#f8fafc',
        borderRadius: BORDER_RADIUS.s,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    perfLabel: {
        fontSize: 12,
        color: COLORS.textSecondary,
        marginBottom: 4,
    },
    perfValueRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'baseline',
    },
    perfValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
    },
    perfTrend: {
        fontSize: 12,
        fontWeight: '600',
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#f8fafc',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 4,
        marginBottom: 4,
    },
    headerCell: {
        fontSize: 11,
        fontWeight: 'bold',
        color: COLORS.textSecondary,
    },
    tableRow: {
        flexDirection: 'row',
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    cellText: {
        fontSize: 12,
        color: COLORS.textPrimary,
    },
    placeholderCard: {
        padding: SPACING.xl,
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACING.m,
        backgroundColor: '#fff',
        borderRadius: BORDER_RADIUS.m,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    placeholderText: {
        fontSize: 12,
        color: COLORS.textSecondary,
        textAlign: 'center',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '85%',
        backgroundColor: '#fff',
        borderRadius: BORDER_RADIUS.l,
        padding: SPACING.l,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.l,
    },
    modalTitle: {
        fontSize: FONT_SIZES.m,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
    },
    modalOption: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: SPACING.m,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    modalOptionActive: {
        backgroundColor: '#f0f7ff',
        paddingHorizontal: SPACING.m,
        borderRadius: BORDER_RADIUS.m,
        marginHorizontal: -SPACING.m,
    },
    modalOptionText: {
        fontSize: FONT_SIZES.m,
        color: COLORS.textPrimary,
    },
    modalOptionTextActive: {
        color: COLORS.primary,
        fontWeight: 'bold',
    },
});
