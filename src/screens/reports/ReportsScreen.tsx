
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar, ScrollView } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZES } from '../../constants/theme';
import { FileText, Calendar, BarChart3 } from 'lucide-react-native';
import { ReportGenerator } from '../../components/reports/ReportGenerator';
import { ReportHistory } from '../../components/reports/ReportHistory';
import { MISReports } from '../../components/reports/MISReports';

const ReportsScreen = () => {
    const [activeTab, setActiveTab] = useState<'generate' | 'history' | 'mis'>('generate');

    const tabs = [
        { id: 'generate', label: 'Generate', icon: FileText },
        { id: 'history', label: 'History', icon: Calendar },
        { id: 'mis', label: 'MIS Reports', icon: BarChart3 },
    ];

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <View style={styles.header}>
                <Text style={styles.title}>Reports & Analytics</Text>
                <Text style={styles.subtitle}>Generate comprehensive reports and track performance</Text>
            </View>

            <View style={styles.tabsContainer}>
                <View style={styles.tabsWrapper}>
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <TouchableOpacity
                                key={tab.id}
                                style={[styles.tab, isActive && styles.activeTab]}
                                onPress={() => setActiveTab(tab.id as any)}
                            >
                                <Icon size={18} color={isActive ? (COLORS?.primary || '#2563eb') : (COLORS?.textSecondary || '#666')}
                                />
                                <Text style={[styles.tabLabel, isActive && styles.activeTabLabel]}>
                                    {tab.label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </View>

            <View style={styles.content}>
                {activeTab === 'generate' && <ReportGenerator />}
                {activeTab === 'history' && <ReportHistory />}
                {activeTab === 'mis' && <MISReports />}
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    header: {
        padding: SPACING.l,
        backgroundColor: '#fff',
    },
    title: {
        fontSize: FONT_SIZES.xl,
        fontWeight: 'bold',
        color: COLORS?.textPrimary || '#1f2937'
    },
    subtitle: {
        fontSize: FONT_SIZES.s,
        color: COLORS?.textSecondary || '#6b7280',
        marginTop: 4,
    },
    tabsContainer: {
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: COLORS?.border || '#ccc'
    },
    tabsWrapper: {
        flexDirection: 'row',
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACING.xs,
        paddingVertical: SPACING.m,
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    activeTab: {
        borderBottomColor: COLORS?.primary || '#2563eb'
    },
    tabLabel: {
        fontSize: 12, // Slightly smaller to ensure fit
        color: COLORS?.textSecondary || '#6b7280',
        fontWeight: '500',
    },
    activeTabLabel: {
        color: COLORS?.primary || '#2563eb',
        fontWeight: 'bold',
    },
    content: {
        flex: 1,
    },
});

export default ReportsScreen;
