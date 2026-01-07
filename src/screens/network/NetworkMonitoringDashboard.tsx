
import React, { useState, useEffect, useCallback, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert as RNAlert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../../constants/theme';
import { Settings, Play, Square, RefreshCw, BarChart2, CheckCircle, TrendingUp, Activity, TrendingDown, Wifi, WifiOff, Zap, AlertTriangle } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { getCCtvMonitoringList } from '../../services/api/cctvApi';
import NetworkMonitoringService from '../../services/NetworkMonitoringService';
import { NetworkStatusGrid } from '../../components/NetworkMonitoring/NetworkStatusGrid';
import { CCTVFilters } from '../../components/cctv/CCTVFilters';
import { PingConfigurationModal } from '../../components/NetworkMonitoring/PingConfigurationModal';
import { CCTVDevice } from '../../types/cctv';
import { NetworkMonitoringStats, PingConfiguration, Alert } from '../../types/network';

const NetworkMonitoringDashboard = () => {
    // Context & State
    const { user } = useAuth();
    const [devices, setDevices] = useState<CCTVDevice[]>([]);
    const [stats, setStats] = useState<NetworkMonitoringStats | null>(null);
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [isMonitoring, setIsMonitoring] = useState(false);
    const [configModalVisible, setConfigModalVisible] = useState(false);
    const [loading, setLoading] = useState(false);

    const [filters, setFilters] = useState({
        status: "0",
        zone: "0",
        vendor: "0",
        status_name: "",
        zone_name: "",
        vendor_name: "",
        search: "",
    });

    const monitoringService = NetworkMonitoringService;

    // Initial Fetch & Monitoring Setup
    const fetchDevices = useCallback(async () => {
        if (loading) return;
        setLoading(true);
        try {
            const effectiveVendorId = user?.user_type_id === 2 ? user?.vendor_id : filters.vendor;
            const response = await getCCtvMonitoringList(
                filters.status,
                filters.zone,
                effectiveVendorId ? effectiveVendorId.toString() : null,
                user?.user_id,
                user?.user_type_id
            );

            if (response && response.data) {
                const refreshedDevices = response.data.map((d: CCTVDevice) => ({
                    ...d,
                    isReachable: d.cctv_connection_status === '20'
                }));
                setDevices(refreshedDevices);

                // (Re)Initialize service with new devices
                monitoringService.initialize(refreshedDevices, {
                    onStatusUpdate: (updated) => setDevices([...updated]),
                    onStatsUpdate: (newStats) => setStats(newStats),
                    onAlertGenerated: (alert) => setAlerts(prev => [alert, ...prev])
                });
            }
        } catch (error) {
            console.error('Error fetching devices:', error);
            RNAlert.alert('Error', 'Failed to load devices for monitoring.');
        } finally {
            setLoading(false);
        }
    }, [user, filters, loading]);

    useEffect(() => {
        if (user) {
            fetchDevices();
        }
    }, [user, filters.status, filters.zone, filters.vendor]);

    // cleanup on unmount
    useEffect(() => {
        return () => {
            monitoringService.stopMonitoring();
        };
    }, []);

    const toggleMonitoring = () => {
        if (isMonitoring) {
            monitoringService.stopMonitoring();
            setIsMonitoring(false);
        } else {
            monitoringService.startMonitoring(30); // 30 second interval
            setIsMonitoring(true);
        }
    };

    const handleForceScan = async () => {
        await monitoringService.forceScan();
    };

    const handleSaveConfig = (newConfig: PingConfiguration) => {
        monitoringService.updateConfiguration(newConfig);
    };

    // Derived Stats using service method with safety fallback
    const networkHealth = monitoringService ? monitoringService.getNetworkHealth() : {
        overallHealth: 'poor',
        onlinePercentage: 0,
        averageUptime: 0,
        criticalIssues: 0
    };

    const getHealthColor = (health: string) => {
        switch (health) {
            case 'excellent': return COLORS.success;
            case 'good': return COLORS.primary;
            case 'fair': return COLORS.warning;
            case 'poor': return COLORS.error;
            default: return COLORS.textSecondary;
        }
    };

    const formatTimeAgo = (date: Date | null) => {
        if (!date) return 'Never';
        const now = new Date();
        const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
        if (diff < 60) return `${diff}s ago`;
        const mins = Math.floor(diff / 60);
        if (mins < 60) return `${mins}m ago`;
        const hours = Math.floor(mins / 60);
        return `${hours}h ago`;
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            {loading && devices.length === 0 && (
                <View style={styles.loaderContainer}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            )}
            <View style={{ flex: 1 }}>
                <NetworkStatusGrid
                    devices={devices}
                    onRefresh={fetchDevices}
                    isRefreshing={loading}
                    ListHeaderComponent={
                        <View style={styles.headerWrapper}>
                            {/* Header */}
                            <View style={styles.header}>
                                <View>
                                    <Text style={styles.headerTitle}>Network Monitoring</Text>
                                    <Text style={styles.headerSubtitle}>Real-time Connectivity Monitoring</Text>
                                </View>
                                <View style={styles.headerButtons}>
                                    <TouchableOpacity onPress={() => setConfigModalVisible(true)} style={styles.configButton}>
                                        <Settings size={20} color={COLORS.textSecondary} />
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.forceScanButton, !isMonitoring && styles.disabledButton]}
                                        onPress={handleForceScan}
                                        disabled={!isMonitoring}
                                    >
                                        <RefreshCw size={18} color={isMonitoring ? COLORS.primary : COLORS.textSecondary} />
                                    </TouchableOpacity>
                                </View>
                            </View>


                            {/* Main Controls - Start/Stop */}
                            <View style={styles.mainControls}>
                                <TouchableOpacity
                                    style={[styles.mainControlButton, isMonitoring ? styles.stopButton : styles.startButton]}
                                    onPress={toggleMonitoring}
                                >
                                    {isMonitoring ? <WifiOff size={20} color="#fff" /> : <Wifi size={20} color="#fff" />}
                                    <Text style={styles.mainControlText}>
                                        {isMonitoring ? 'Stop Monitoring' : 'Start Monitoring'}
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            {/* Status Cards (Top 4) */}
                            <View style={styles.statsGrid}>
                                {/* Network Health */}
                                <View style={styles.card}>
                                    <View style={styles.cardHeader}>
                                        <View>
                                            <Text style={styles.cardTitle}>Network Health</Text>
                                            <Text style={[styles.cardValue, { color: getHealthColor(networkHealth.overallHealth), textTransform: 'capitalize' }]}>
                                                {networkHealth.overallHealth}
                                            </Text>
                                            <Text style={styles.cardSubtext}>{networkHealth.onlinePercentage}% online</Text>
                                        </View>
                                        <View style={[styles.iconBox, { backgroundColor: getHealthColor(networkHealth.overallHealth) + '20' }]}>
                                            {networkHealth.overallHealth === 'excellent' ? <CheckCircle size={24} color={COLORS.success} /> :
                                                networkHealth.overallHealth === 'good' ? <TrendingUp size={24} color={COLORS.primary} /> :
                                                    networkHealth.overallHealth === 'fair' ? <Activity size={24} color={COLORS?.warning || '#eab308'}
                                                    /> :
                                                        <TrendingDown size={24} color={COLORS.error} />}
                                        </View>
                                    </View>
                                </View>

                                {/* Online Cameras */}
                                <View style={styles.card}>
                                    <View style={styles.cardHeader}>
                                        <View>
                                            <Text style={styles.cardTitle}>Online Cameras</Text>
                                            <Text style={[styles.cardValue, { color: COLORS.success }]}>
                                                {devices.filter(c => c.cctv_connection_status === '20').length}
                                            </Text>
                                            <Text style={styles.cardSubtext}>of {devices.length} total</Text>
                                        </View>
                                        <View style={[styles.iconBox, { backgroundColor: '#dcfce7' }]}>
                                            <Wifi size={24} color={COLORS.success} />
                                        </View>
                                    </View>
                                </View>

                                {/* Offline Cameras */}
                                <View style={styles.card}>
                                    <View style={styles.cardHeader}>
                                        <View>
                                            <Text style={styles.cardTitle}>Offline Cameras</Text>
                                            <Text style={[styles.cardValue, { color: COLORS.error }]}>
                                                {devices.filter(c => c.cctv_connection_status === '10').length}
                                            </Text>
                                            <Text style={styles.cardSubtext}>Need attention</Text>
                                        </View>
                                        <View style={[styles.iconBox, { backgroundColor: '#fee2e2' }]}>
                                            <WifiOff size={24} color={COLORS.error} />
                                        </View>
                                    </View>
                                </View>

                                {/* Avg Response */}
                                <View style={styles.card}>
                                    <View style={styles.cardHeader}>
                                        <View>
                                            <Text style={styles.cardTitle}>Avg Response</Text>
                                            <Text style={[styles.cardValue, { color: COLORS.primary }]}>{stats?.avgLatency || 0}ms</Text>
                                            <Text style={styles.cardSubtext}>Scan: {formatTimeAgo(stats?.lastScanTime || null)}</Text>
                                        </View>
                                        <View style={[styles.iconBox, { backgroundColor: '#dbeafe' }]}>
                                            <Zap size={24} color={COLORS.primary} />
                                        </View>
                                    </View>
                                </View>
                            </View>

                            {/* Monitoring Status Section */}
                            <View style={styles.sectionContainer}>
                                <View style={styles.sectionHeader}>
                                    <Text style={styles.sectionTitle}>Monitoring Status</Text>
                                    <View style={styles.statusBadge}>
                                        <View style={[styles.statusDot, { backgroundColor: isMonitoring ? COLORS.success : COLORS.textSecondary }]} />
                                        <Text style={styles.statusText}>{isMonitoring ? 'Active' : 'Inactive'}</Text>
                                    </View>
                                </View>

                                {stats && (
                                    <View style={styles.monitoringStatsGrid}>
                                        <View style={styles.monitoringStatItem}>
                                            <Text style={styles.monitoringStatValue}>{stats.totalDevices}</Text>
                                            <Text style={styles.monitoringStatLabel}>Total Cameras</Text>
                                        </View>
                                        <View style={styles.monitoringStatItem}>
                                            <Text style={[styles.monitoringStatValue, { color: COLORS.success }]}>{stats.successfulPings}</Text>
                                            <Text style={styles.monitoringStatLabel}>Successful</Text>
                                        </View>
                                        <View style={styles.monitoringStatItem}>
                                            <Text style={[styles.monitoringStatValue, { color: COLORS.error }]}>{stats.failedPings}</Text>
                                            <Text style={styles.monitoringStatLabel}>Failed</Text>
                                        </View>
                                        <View style={styles.monitoringStatItem}>
                                            <Text style={[styles.monitoringStatValue, { color: COLORS.primary }]}>{stats.scanDuration}ms</Text>
                                            <Text style={styles.monitoringStatLabel}>Duration</Text>
                                        </View>
                                    </View>
                                )}
                            </View>

                            {/* Filters Section */}
                            <View style={styles.filterSection}>
                                <CCTVFilters
                                    filters={filters}
                                    onFilterChange={setFilters}
                                    totalCameras={devices.length}
                                    user={user}
                                    hideSearch={true}
                                />
                            </View>

                            {/* Recent Alerts Section */}
                            {alerts.length > 0 && (
                                <View style={styles.sectionContainer}>
                                    <Text style={styles.sectionTitle}>Recent Network Alerts</Text>
                                    <View style={styles.alertsList}>
                                        {alerts.slice(0, 5).map((alert) => (
                                            <View key={alert.id} style={styles.alertItem}>
                                                <AlertTriangle size={20} color={alert.severity === 'critical' ? COLORS.error : COLORS.warning} style={{ marginTop: 2 }} />
                                                <View style={styles.alertContent}>
                                                    <Text style={styles.alertTitle}>{alert.deviceName}</Text>
                                                    <Text style={styles.alertMessage}>{alert.message}</Text>
                                                    <Text style={styles.alertTime}>{alert.timestamp.toLocaleTimeString()}</Text>
                                                </View>
                                            </View>
                                        ))}
                                    </View>
                                </View>
                            )}
                        </View>
                    }
                />

                {/* Config Modal */}
                <PingConfigurationModal
                    visible={configModalVisible}
                    onClose={() => setConfigModalVisible(false)}
                    currentConfig={NetworkMonitoringService.getConfig()}
                    onSave={handleSaveConfig}
                />
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    headerWrapper: {
        marginTop: -SPACING.m,
        marginHorizontal: -SPACING.m,
        marginBottom: SPACING.m,
    },
    header: {
        padding: SPACING.m,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        borderBottomWidth: 1,
        borderBottomColor: COLORS?.border || '#ccc'
    },
    headerTitle: {
        fontSize: FONT_SIZES.l,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
    },
    headerSubtitle: {
        fontSize: FONT_SIZES.xs,
        color: COLORS.textSecondary,
    },
    headerButtons: {
        flexDirection: 'row',
        gap: SPACING.s,
    },
    configButton: {
        padding: SPACING.s,
        backgroundColor: COLORS.background,
        borderRadius: BORDER_RADIUS.m,
        borderWidth: 1,
        borderColor: COLORS?.border || '#ccc'
    },
    forceScanButton: {
        padding: SPACING.s,
        backgroundColor: '#eff6ff', // blue-50
        borderRadius: BORDER_RADIUS.m,
        borderWidth: 1,
        borderColor: '#bfdbfe', // blue-200
    },
    disabledButton: {
        opacity: 0.5,
    },
    mainControls: {
        padding: SPACING.m,
        paddingBottom: 0,
    },
    filterSection: {
        paddingHorizontal: SPACING.m,
        marginTop: SPACING.m,
    },
    mainControlButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: SPACING.m,
        borderRadius: BORDER_RADIUS.m,
        gap: SPACING.s,
    },
    startButton: {
        backgroundColor: COLORS.success,
    },
    stopButton: {
        backgroundColor: COLORS?.primary || '#2563eb'
    },
    mainControlText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: FONT_SIZES.m,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        padding: SPACING.m,
        gap: SPACING.m,
    },
    card: {
        width: '47%',
        backgroundColor: COLORS.surface,
        padding: SPACING.m,
        borderRadius: BORDER_RADIUS.m,
        elevation: 1,
        marginBottom: SPACING.xs,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    cardTitle: {
        fontSize: 10, // Small label
        fontWeight: '600',
        color: COLORS.textSecondary,
        marginBottom: 4,
    },
    cardValue: {
        fontSize: FONT_SIZES.l,
        fontWeight: 'bold',
        marginBottom: 2,
    },
    cardSubtext: {
        fontSize: 10,
        color: COLORS.textSecondary,
    },
    iconBox: {
        padding: 8,
        borderRadius: BORDER_RADIUS.m,
    },
    sectionContainer: {
        backgroundColor: COLORS.surface,
        marginHorizontal: SPACING.m,
        marginBottom: SPACING.m,
        borderRadius: BORDER_RADIUS.m,
        padding: SPACING.m,
        elevation: 1,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.m,
    },
    sectionTitle: {
        fontSize: FONT_SIZES.m,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.xs,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    statusText: {
        fontSize: FONT_SIZES.s,
        color: COLORS.textSecondary,
    },
    monitoringStatsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    monitoringStatItem: {
        alignItems: 'center',
        flex: 1,
    },
    monitoringStatValue: {
        fontSize: FONT_SIZES.l,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
        marginBottom: 2,
    },
    monitoringStatLabel: {
        fontSize: 10,
        color: COLORS.textSecondary,
    },
    alertsList: {
        gap: SPACING.s,
    },
    alertItem: {
        flexDirection: 'row',
        gap: SPACING.s,
        padding: SPACING.s,
        backgroundColor: COLORS.background,
        borderRadius: BORDER_RADIUS.s,
    },
    alertContent: {
        flex: 1,
    },
    alertTitle: {
        fontSize: FONT_SIZES.s,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
    },
    alertMessage: {
        fontSize: FONT_SIZES.s,
        color: COLORS.textSecondary,
    },
    alertTime: {
        fontSize: 10,
        color: COLORS.textSecondary,
        marginTop: 4,
    },
    loaderContainer: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.7)',
        zIndex: 10,
    }
});

export default NetworkMonitoringDashboard;
