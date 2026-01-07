import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    ScrollView,
    TextInput,
    ActivityIndicator,
} from 'react-native';
import { X, Activity, Wifi, Route, Play, Copy, Download, RefreshCw, AlertTriangle, CheckCircle, Clock } from 'lucide-react-native';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../../constants/theme';
import { CCTVDevice, NetworkDiagnosticResult } from '../../types/cctv';
import { RealNetworkService } from '../../services/RealNetworkService';

interface NetworkDiagnosticsModalProps {
    camera: CCTVDevice;
    onClose: () => void;
}

export const NetworkDiagnosticsModal: React.FC<NetworkDiagnosticsModalProps> = ({
    camera,
    onClose,
}) => {
    const [activeTab, setActiveTab] = useState<'ping' | 'connectivity' | 'traceroute'>('ping');
    const [diagnostics, setDiagnostics] = useState<Record<string, NetworkDiagnosticResult>>({
        ping: { command: 'ping', status: 'idle', output: [] },
        connectivity: { command: 'connectivity', status: 'idle', output: [] },
        traceroute: { command: 'traceroute', status: 'idle', output: [] },
    });

    const [pingCount, setPingCount] = useState('4');
    const [pingTimeout, setPingTimeout] = useState('5000');

    const networkService = RealNetworkService.getInstance();

    const runDiagnostic = async (type: 'ping' | 'connectivity' | 'traceroute') => {
        const startTime = new Date();

        setDiagnostics(prev => ({
            ...prev,
            [type]: {
                ...prev[type],
                status: 'running',
                startTime,
                output: [],
            },
        }));

        try {
            let result: string[] = [];

            switch (type) {
                case 'ping':
                    result = await networkService.ping(camera.cctv_ip_port || camera.ip_address, parseInt(pingCount), parseInt(pingTimeout));
                    break;
                case 'connectivity':
                    // Split ip:port if cctv_ip_port exists
                    const [ip, port] = (camera.cctv_ip_port || camera.ip_address || '').split(':');
                    result = await networkService.testConnectivity(ip || camera.ip_address, port || camera.ip_port);
                    break;
                case 'traceroute':
                    result = await networkService.traceroute(camera.cctv_ip_port?.split(':')[0] || camera.ip_address);
                    break;
            }

            const endTime = new Date();
            const duration = endTime.getTime() - startTime.getTime();

            setDiagnostics(prev => ({
                ...prev,
                [type]: {
                    ...prev[type],
                    status: 'success',
                    output: result,
                    endTime,
                    duration,
                },
            }));
        } catch (error) {
            const endTime = new Date();
            const duration = endTime.getTime() - startTime.getTime();
            setDiagnostics(prev => ({
                ...prev,
                [type]: {
                    ...prev[type],
                    status: 'failed',
                    output: [`Error: ${error instanceof Error ? error.message : 'Unknown error'}`],
                    endTime,
                    duration,
                },
            }));
        }
    };
    const getStatusIcon = (status: NetworkDiagnosticResult['status']) => {
        switch (status) {
            case 'running':
                return <ActivityIndicator size="small" color={COLORS.primary} />;
            case 'success':
                return <CheckCircle size={16} color="green" />;
            case 'failed':
                return <AlertTriangle size={16} color="red" />;
            default:
                return <Clock size={16} color={COLORS.textSecondary} />;
        }
    };
    const renderTabButton = (id: 'ping' | 'connectivity' | 'traceroute', label: string, Icon: any) => (
        <TouchableOpacity
            style={[styles.tabButton, activeTab === id && styles.activeTabButton]}
            onPress={() => setActiveTab(id)}
        >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Icon size={16} color={activeTab === id ? COLORS.primary : COLORS.textSecondary} />
                <Text style={[styles.tabText, activeTab === id && styles.activeTabText]}>{label}</Text>
            </View>
            {getStatusIcon(diagnostics[id].status)}
        </TouchableOpacity>
    );

    return (
        <Modal visible transparent animationType="slide" onRequestClose={onClose}>
            <View style={styles.container}>
                <View style={styles.modal}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View>
                            <Text style={styles.title}>Network Diagnostics</Text>
                            <Text style={styles.subtitle}>{camera.cctv_name} ({camera.cctv_ip_port || camera.ip_address})</Text>
                        </View>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <X size={24} color={COLORS.textPrimary} />
                        </TouchableOpacity>
                    </View>

                    {/* Tabs */}
                    <View style={styles.tabs}>
                        {renderTabButton('ping', 'Ping Test', Activity)}
                        {renderTabButton('connectivity', 'Port Check', Wifi)}
                        {renderTabButton('traceroute', 'Trace Route', Route)}
                    </View>

                    {/* Content */}
                    <View style={styles.content}>
                        {activeTab === 'ping' && (
                            <View style={styles.controls}>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>Count</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={pingCount}
                                        onChangeText={setPingCount}
                                        keyboardType="numeric"
                                    />
                                </View>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>Timeout (ms)</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={pingTimeout}
                                        onChangeText={setPingTimeout}
                                        keyboardType="numeric"
                                    />
                                </View>
                                <TouchableOpacity
                                    style={styles.runButton}
                                    onPress={() => runDiagnostic('ping')}
                                    disabled={diagnostics.ping.status === 'running'}
                                >
                                    <Play size={16} color="white" />
                                    <Text style={styles.runButtonText}>Run</Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        {(activeTab === 'connectivity' || activeTab === 'traceroute') && (
                            <View style={styles.controls}>
                                <TouchableOpacity
                                    style={styles.runButton}
                                    onPress={() => runDiagnostic(activeTab)}
                                    disabled={diagnostics[activeTab].status === 'running'}
                                >
                                    <Play size={16} color="white" />
                                    <Text style={styles.runButtonText}>Run {activeTab === 'connectivity' ? 'Connectivity' : 'Traceroute'}</Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        {/* Terminal Output */}
                        <View style={styles.terminal}>
                            <View style={styles.terminalHeader}>
                                <Text style={styles.terminalTitle}>Output</Text>
                                {/* Simulating Copy/Download buttons (visual only for now) */}
                                <View style={{ flexDirection: 'row', gap: 10 }}>
                                    <Copy size={16} color={COLORS.textSecondary} />
                                    <Download size={16} color={COLORS.textSecondary} />
                                </View>
                            </View>
                            <ScrollView style={styles.terminalScroll}>
                                {diagnostics[activeTab].output.length > 0 ? (
                                    diagnostics[activeTab].output.map((line, index) => (
                                        <Text key={index} style={styles.terminalText}>{line}</Text>
                                    ))
                                ) : (
                                    <Text style={styles.terminalPlaceholder}>
                                        {diagnostics[activeTab].status === 'idle'
                                            ? 'Click run to start diagnostics...'
                                            : diagnostics[activeTab].status === 'running'
                                                ? 'Running...'
                                                : 'No output'}
                                    </Text>
                                )}
                            </ScrollView>
                        </View>

                        {diagnostics[activeTab].duration && (
                            <Text style={styles.durationText}>Completed in {diagnostics[activeTab].duration}ms</Text>
                        )}
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: SPACING.m,
    },
    modal: {
        backgroundColor: COLORS.cardBackground,
        borderRadius: BORDER_RADIUS.l,
        maxHeight: '90%',
        overflow: 'hidden',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: SPACING.l,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    title: {
        fontSize: FONT_SIZES.l,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
    },
    subtitle: {
        fontSize: FONT_SIZES.s,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    closeButton: {
        padding: SPACING.s,
    },
    tabs: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    tabButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: SPACING.m,
        backgroundColor: COLORS.background,
    },
    activeTabButton: {
        backgroundColor: '#EFF6FF',
        borderBottomWidth: 2,
        borderBottomColor: COLORS.primary,
    },
    tabText: {
        fontSize: FONT_SIZES.s,
        color: COLORS.textSecondary,
        fontWeight: '500',
    },
    activeTabText: {
        color: COLORS.primary,
        fontWeight: '600',
    },
    content: {
        padding: SPACING.l,
    },
    controls: {
        flexDirection: 'row',
        gap: SPACING.m,
        marginBottom: SPACING.l,
        alignItems: 'flex-end',
    },
    inputGroup: {
        flex: 1,
    },
    label: {
        fontSize: FONT_SIZES.xs,
        color: COLORS.textSecondary,
        marginBottom: SPACING.xs,
    },
    input: {
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: BORDER_RADIUS.s,
        padding: SPACING.s,
        color: COLORS.textPrimary,
    },
    runButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.s,
        backgroundColor: COLORS.primary,
        paddingVertical: SPACING.s,
        paddingHorizontal: SPACING.l,
        borderRadius: BORDER_RADIUS.s,
        height: 42,
    },
    runButtonText: {
        color: COLORS.textInverse,
        fontWeight: '600',
    },
    terminal: {
        backgroundColor: '#1E1E1E',
        borderRadius: BORDER_RADIUS.m,
        height: 300,
        padding: SPACING.m,
    },
    terminalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: SPACING.s,
        borderBottomWidth: 1,
        borderBottomColor: '#333',
        paddingBottom: SPACING.xs,
    },
    terminalTitle: {
        color: '#ccc',
        fontSize: FONT_SIZES.xs,
        fontWeight: '600',
    },
    terminalScroll: {
        flex: 1,
    },
    terminalText: {
        color: '#4ADE80', // Green terminal text
        fontFamily: 'monospace', // Note: Android might stick to default monospace
        fontSize: FONT_SIZES.s,
        marginBottom: 2,
    },
    terminalPlaceholder: {
        color: '#666',
        fontStyle: 'italic',
    },
    durationText: {
        marginTop: SPACING.s,
        fontSize: FONT_SIZES.xs,
        color: COLORS.textSecondary,
        textAlign: 'right',
    },
});
