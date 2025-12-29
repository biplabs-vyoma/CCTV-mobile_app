
import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZES } from '../../constants/theme';
import {
    FileText,
    Download,
    Clock,
    User,
    ChevronLeft,
    ChevronRight,
    AlertCircle
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

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'ready': return { bg: '#e8f5e9', text: '#2e7d32' };
            case 'generating': return { bg: '#e3f2fd', text: '#1565c0' };
            case 'failed': return { bg: '#ffebee', text: '#c62828' };
            default: return { bg: '#f5f5f5', text: '#757575' };
        }
    };

    const renderReportItem = ({ item }: { item: HistoryReport }) => {
        const statusColors = getStatusStyle(item.status);

        return (
            <View style={styles.historyCard}>
                <View style={styles.cardHeader}>
                    <View style={styles.titleSection}>
                        <FileText size={18} color={COLORS.textSecondary} />
                        <View style={styles.titleContainer}>
                            <Text style={styles.reportTitle} numberOfLines={1}>{item.title}</Text>
                            <Text style={styles.reportId}>{item.id}</Text>
                        </View>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: statusColors.bg }]}>
                        <Text style={[styles.statusText, { color: statusColors.text }]}>
                            {item.status === 'ready' ? 'Ready' : item.status === 'generating' ? 'Processing' : 'Failed'}
                        </Text>
                    </View>
                </View>

                <View style={styles.cardDetails}>
                    <View style={styles.detailRow}>
                        <View style={[styles.detailItem, { flex: 1.5 }]}>
                            <User size={14} color={COLORS.textSecondary} />
                            <Text style={styles.detailText}>{item.generatedBy}</Text>
                        </View>
                        <View style={[styles.detailItem, { flex: 1, justifyContent: 'flex-end' }]}>
                            <Clock size={14} color={COLORS.textSecondary} />
                            <Text style={styles.detailText}>{formatDate(item.generatedAt)}</Text>
                        </View>
                    </View>

                    <View style={styles.detailRow}>
                        <View style={styles.detailItem}>
                            <View style={styles.formatTag}>
                                <Text style={styles.formatText}>{item.format}</Text>
                            </View>
                            <Text style={styles.detailText}>{item.size}</Text>
                        </View>

                        {item.status === 'ready' && (
                            <TouchableOpacity style={styles.downloadBtn}>
                                <Download size={16} color={COLORS.primary} />
                                <Text style={styles.downloadText}>Download</Text>
                            </TouchableOpacity>
                        )}
                        {item.status === 'generating' && (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="small" color={COLORS.primary} />
                            </View>
                        )}
                        {item.status === 'failed' && (
                            <TouchableOpacity style={styles.retryBtn}>
                                <AlertCircle size={16} color="#c62828" />
                                <Text style={styles.retryText}>Retry</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.mainHeader}>
                <View>
                    <Text style={styles.title}>Recent Reports</Text>
                    <Text style={styles.subtitle}>Download and manage generated reports</Text>
                </View>
                <View style={styles.countBadge}>
                    <Text style={styles.countText}>{mockReports.length}</Text>
                </View>
            </View>

            <FlatList
                data={paginatedReports}
                renderItem={renderReportItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                ListFooterComponent={() => (
                    totalPages > 1 ? (
                        <View style={styles.pagination}>
                            <View style={styles.pageInfo}>
                                <Text style={styles.pageInfoText}>
                                    Page <Text style={styles.bold}>{currentPage}</Text> of {totalPages}
                                </Text>
                            </View>
                            <View style={styles.paginationControls}>
                                <TouchableOpacity
                                    onPress={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    style={[styles.pageBtn, currentPage === 1 && styles.pageBtnDisabled]}
                                >
                                    <ChevronLeft size={20} color={currentPage === 1 ? COLORS.border : COLORS.textPrimary} />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    style={[styles.pageBtn, currentPage === totalPages && styles.pageBtnDisabled]}
                                >
                                    <ChevronRight size={20} color={currentPage === totalPages ? COLORS.border : COLORS.textPrimary} />
                                </TouchableOpacity>
                            </View>
                        </View>
                    ) : null
                )}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    mainHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: SPACING.l,
        paddingHorizontal: SPACING.l,
        marginTop: SPACING.s,
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
    countBadge: {
        backgroundColor: '#f3f4f6',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    countText: {
        fontSize: 12,
        fontWeight: '600',
        color: COLORS.textSecondary,
    },
    listContent: {
        paddingHorizontal: SPACING.l,
        paddingBottom: SPACING.xl,
        gap: SPACING.m,
    },
    historyCard: {
        backgroundColor: '#fff',
        borderRadius: BORDER_RADIUS.m,
        borderWidth: 1,
        borderColor: COLORS.border,
        padding: SPACING.m,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: SPACING.m,
    },
    titleSection: {
        flexDirection: 'row',
        gap: SPACING.s,
        flex: 1,
    },
    titleContainer: {
        flex: 1,
    },
    reportTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.textPrimary,
    },
    reportId: {
        fontSize: 11,
        color: COLORS.textSecondary,
        marginTop: 2,
        fontFamily: 'monospace',
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        marginLeft: SPACING.s,
    },
    statusText: {
        fontSize: 10,
        fontWeight: 'bold',
    },
    cardDetails: {
        gap: SPACING.s,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: SPACING.l,
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        flex: 1,
    },
    detailText: {
        fontSize: 12,
        color: COLORS.textSecondary,
    },
    formatTag: {
        backgroundColor: '#f3f4f6',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        marginRight: 6,
    },
    formatText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: COLORS.textSecondary,
    },
    downloadBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#eff6ff',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: BORDER_RADIUS.s,
    },
    downloadText: {
        fontSize: 12,
        fontWeight: '600',
        color: COLORS.primary,
    },
    retryBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 6,
    },
    retryText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#c62828',
    },
    loadingContainer: {
        paddingHorizontal: 10,
        paddingVertical: 6,
    },
    pagination: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: SPACING.l,
        paddingTop: SPACING.m,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
    },
    pageInfo: {
        flex: 1,
    },
    pageInfoText: {
        fontSize: 13,
        color: COLORS.textSecondary,
    },
    bold: {
        fontWeight: 'bold',
        color: COLORS.textPrimary,
    },
    paginationControls: {
        flexDirection: 'row',
        gap: SPACING.s,
    },
    pageBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: COLORS.border,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
    },
    pageBtnDisabled: {
        backgroundColor: '#f9fafb',
        borderColor: '#f3f4f6',
    },
});
