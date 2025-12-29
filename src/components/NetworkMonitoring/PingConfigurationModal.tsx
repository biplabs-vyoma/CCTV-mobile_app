
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    Modal,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    ScrollView,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import { PingConfiguration } from '../../types/network';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZES } from '../../constants/theme';
import { X, Settings, Clock, RefreshCw, AlertTriangle, CheckCircle, Info } from 'lucide-react-native';
import PingService from '../../services/PingService';

interface PingConfigurationModalProps {
    visible: boolean;
    onClose: () => void;
    currentConfig: PingConfiguration;
    onSave: (config: PingConfiguration) => void;
}

export const PingConfigurationModal: React.FC<PingConfigurationModalProps> = ({
    visible,
    onClose,
    currentConfig,
    onSave,
}) => {
    // UI state uses seconds for interval, we convert to ms for storage
    const [config, setConfig] = useState<PingConfiguration>(currentConfig);
    const [testResult, setTestResult] = useState<{
        isReachable: boolean;
        responseTime?: number;
        error?: string;
    } | null>(null);
    const [isTestingConnection, setIsTestingConnection] = useState(false);

    useEffect(() => {
        if (visible) {
            setConfig(currentConfig);
            setTestResult(null);
        }
    }, [visible, currentConfig]);

    const handleSave = () => {
        onSave(config);
    };

    const handleTestConnection = async () => {
        setIsTestingConnection(true);
        setTestResult(null);

        try {
            // Test with a sample Public DNS or user's first camera IP if available
            const result = await PingService.testConnectivity('8.8.8.8', 2000);
            setTestResult(result);
        } catch (error) {
            setTestResult({
                isReachable: false,
                error: error instanceof Error ? error.message : 'Test failed'
            });
        } finally {
            setIsTestingConnection(false);
        }
    };

    const updateField = (key: keyof PingConfiguration, value: string) => {
        let numValue = parseInt(value, 10) || 0;

        // Handle interval special case (display in seconds, store in ms)
        if (key === 'interval') {
            // Keep it as raw number here, we'll convert when saving or just store as ms
            // Actually let's store it as ms in state too to keep it consistent with the type
            // But the UI will show val/1000
        }

        setConfig(prev => ({
            ...prev,
            [key]: numValue
        }));
    };

    const intervalSeconds = Math.round(config.interval / 1000);

    return (
        <Modal
            visible={visible}
            animationType="fade"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.keyboardView}
                >
                    <View style={styles.modalContent}>
                        {/* Header */}
                        <View style={styles.header}>
                            <View style={styles.headerTitleRow}>
                                <View style={styles.iconContainer}>
                                    <Settings size={24} color={COLORS.primary} />
                                </View>
                                <View>
                                    <Text style={styles.title}>Ping Configuration</Text>
                                    <Text style={styles.subtitle}>Configure network monitoring settings</Text>
                                </View>
                            </View>
                            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                                <X size={24} color={COLORS.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        {/* Content */}
                        <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
                            <View style={styles.contentInner}>
                                {/* Ping Interval */}
                                <View style={styles.inputSection}>
                                    <View style={styles.labelRow}>
                                        <Clock size={16} color={COLORS.textSecondary} />
                                        <Text style={styles.label}>Ping Interval (seconds)</Text>
                                    </View>
                                    <TextInput
                                        style={styles.input}
                                        keyboardType="numeric"
                                        value={intervalSeconds.toString()}
                                        onChangeText={(val) => setConfig({ ...config, interval: (parseInt(val) || 0) * 1000 })}
                                    />
                                    <Text style={styles.helperText}>How often to ping each camera (10-300 seconds)</Text>
                                </View>

                                {/* Timeout */}
                                <View style={styles.inputSection}>
                                    <View style={styles.labelRow}>
                                        <Clock size={16} color={COLORS.textSecondary} />
                                        <Text style={styles.label}>Timeout (milliseconds)</Text>
                                    </View>
                                    <TextInput
                                        style={styles.input}
                                        keyboardType="numeric"
                                        value={config.timeout.toString()}
                                        onChangeText={(val) => setConfig({ ...config, timeout: parseInt(val) || 0 })}
                                    />
                                    <Text style={styles.helperText}>Maximum time to wait for ping response (1000-30000 ms)</Text>
                                </View>

                                {/* Retry Attempts */}
                                <View style={styles.inputSection}>
                                    <View style={styles.labelRow}>
                                        <RefreshCw size={16} color={COLORS.textSecondary} />
                                        <Text style={styles.label}>Retry Attempts</Text>
                                    </View>
                                    <TextInput
                                        style={styles.input}
                                        keyboardType="numeric"
                                        value={config.retryAttempts.toString()}
                                        onChangeText={(val) => setConfig({ ...config, retryAttempts: parseInt(val) || 0 })}
                                    />
                                    <Text style={styles.helperText}>Number of retry attempts per camera scan (1-10)</Text>
                                </View>

                                {/* Failure Threshold */}
                                <View style={styles.inputSection}>
                                    <View style={styles.labelRow}>
                                        <AlertTriangle size={16} color={COLORS.textSecondary} />
                                        <Text style={styles.label}>Failure Threshold</Text>
                                    </View>
                                    <TextInput
                                        style={styles.input}
                                        keyboardType="numeric"
                                        value={config.failureThreshold.toString()}
                                        onChangeText={(val) => setConfig({ ...config, failureThreshold: parseInt(val) || 0 })}
                                    />
                                    <Text style={styles.helperText}>Consecutive failures before marking camera as offline (1-10)</Text>
                                </View>

                                {/* Test Connection */}
                                <View style={styles.testSection}>
                                    <Text style={styles.testTitle}>Test Connection</Text>
                                    <TouchableOpacity
                                        style={[styles.testButton, isTestingConnection && styles.disabledButton]}
                                        onPress={handleTestConnection}
                                        disabled={isTestingConnection}
                                    >
                                        {isTestingConnection ? (
                                            <ActivityIndicator size="small" color="#fff" />
                                        ) : (
                                            <RefreshCw size={16} color="#fff" />
                                        )}
                                        <Text style={styles.testButtonText}>
                                            {isTestingConnection ? 'Testing...' : 'Test Sample Connection'}
                                        </Text>
                                    </TouchableOpacity>

                                    {testResult && (
                                        <View style={[
                                            styles.testResult,
                                            { backgroundColor: testResult.isReachable ? '#f0fdf4' : '#fef2f2', borderColor: testResult.isReachable ? '#bbf7d0' : '#fecaca' }
                                        ]}>
                                            <View style={styles.testResultHeader}>
                                                {testResult.isReachable ? (
                                                    <CheckCircle size={16} color={COLORS.success} />
                                                ) : (
                                                    <AlertTriangle size={16} color={COLORS.error} />
                                                )}
                                                <Text style={[styles.testResultStatus, { color: testResult.isReachable ? '#166534' : '#991b1b' }]}>
                                                    {testResult.isReachable ? 'Connection successful' : 'Connection failed'}
                                                </Text>
                                            </View>
                                            {testResult.isReachable && testResult.responseTime && (
                                                <Text style={styles.testResultDetail}>Response time: {testResult.responseTime}ms</Text>
                                            )}
                                            {!testResult.isReachable && testResult.error && (
                                                <Text style={styles.testResultDetail}>{testResult.error}</Text>
                                            )}
                                        </View>
                                    )}
                                </View>

                                {/* Summary Box */}
                                <View style={styles.summaryBox}>
                                    <Text style={styles.summaryTitle}>Configuration Summary</Text>
                                    <View style={styles.summaryContent}>
                                        <Text style={styles.summaryText}>• Cameras will be pinged every {intervalSeconds} seconds</Text>
                                        <Text style={styles.summaryText}>• Each ping will timeout after {config.timeout}ms</Text>
                                        <Text style={styles.summaryText}>• Failed pings will be retried {config.retryAttempts} times</Text>
                                        <Text style={styles.summaryText}>• Marked offline after {config.failureThreshold} consecutive failures</Text>
                                    </View>
                                </View>

                                {/* Important Notes */}
                                <View style={styles.notesBox}>
                                    <View style={styles.notesHeader}>
                                        <Info size={18} color="#92400e" />
                                        <Text style={styles.notesTitle}>Important Notes</Text>
                                    </View>
                                    <View style={styles.notesContent}>
                                        <Text style={styles.notesText}>• Lower intervals provide more real-time monitoring but increase network load</Text>
                                        <Text style={styles.notesText}>• Higher timeout values are more reliable but slower to detect failures</Text>
                                        <Text style={styles.notesText}>• Changes take effect on the next cycle</Text>
                                    </View>
                                </View>
                            </View>
                        </ScrollView>

                        {/* Footer Actions */}
                        <View style={styles.footer}>
                            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                                <Text style={styles.saveButtonText}>Save Configuration</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        padding: SPACING.m,
    },
    keyboardView: {
        width: '100%',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: COLORS.surface,
        borderRadius: BORDER_RADIUS.l,
        width: '100%',
        maxHeight: '90%',
        overflow: 'hidden',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        padding: SPACING.l,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    headerTitleRow: {
        flexDirection: 'row',
        gap: SPACING.m,
        flex: 1,
    },
    iconContainer: {
        backgroundColor: '#eff6ff', // blue-50
        padding: SPACING.s,
        borderRadius: BORDER_RADIUS.m,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: FONT_SIZES.l,
        fontWeight: 'bold',
        color: '#111827',
    },
    subtitle: {
        fontSize: FONT_SIZES.xs,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    closeButton: {
        padding: SPACING.xs,
    },
    body: {
        backgroundColor: '#fff',
    },
    contentInner: {
        padding: SPACING.l,
        gap: SPACING.l,
    },
    inputSection: {
        gap: SPACING.s,
    },
    labelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.s,
    },
    label: {
        fontSize: FONT_SIZES.s,
        fontWeight: '600',
        color: '#374151',
    },
    input: {
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: BORDER_RADIUS.m,
        paddingHorizontal: SPACING.m,
        paddingVertical: SPACING.s,
        fontSize: FONT_SIZES.m,
        color: '#111827',
    },
    helperText: {
        fontSize: 12,
        color: COLORS.textSecondary,
    },
    testSection: {
        backgroundColor: '#f9fafb',
        padding: SPACING.m,
        borderRadius: BORDER_RADIUS.m,
        gap: SPACING.m,
    },
    testTitle: {
        fontSize: FONT_SIZES.s,
        fontWeight: 'bold',
        color: '#111827',
    },
    testButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACING.s,
        backgroundColor: COLORS.primary,
        paddingVertical: SPACING.s,
        paddingHorizontal: SPACING.m,
        borderRadius: BORDER_RADIUS.m,
    },
    disabledButton: {
        opacity: 0.7,
    },
    testButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: FONT_SIZES.s,
    },
    testResult: {
        padding: SPACING.s,
        borderRadius: BORDER_RADIUS.m,
        borderWidth: 1,
    },
    testResultHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.xs,
    },
    testResultStatus: {
        fontWeight: '600',
        fontSize: FONT_SIZES.s,
    },
    testResultDetail: {
        fontSize: 12,
        marginLeft: 20,
        marginTop: 2,
        color: '#4b5563',
    },
    summaryBox: {
        backgroundColor: '#eff6ff',
        padding: SPACING.m,
        borderRadius: BORDER_RADIUS.m,
    },
    summaryTitle: {
        fontSize: FONT_SIZES.s,
        fontWeight: 'bold',
        color: '#1e3a8a', // blue-900
        marginBottom: SPACING.s,
    },
    summaryContent: {
        gap: 4,
    },
    summaryText: {
        fontSize: FONT_SIZES.xs,
        color: '#1e40af', // blue-800
    },
    notesBox: {
        backgroundColor: '#fffbeb', // yellow-50
        padding: SPACING.m,
        borderRadius: BORDER_RADIUS.m,
        borderWidth: 1,
        borderColor: '#fef3c7', // yellow-100
    },
    notesHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.s,
        marginBottom: SPACING.s,
    },
    notesTitle: {
        fontSize: FONT_SIZES.s,
        fontWeight: 'bold',
        color: '#92400e', // yellow-800
    },
    notesContent: {
        gap: 4,
    },
    notesText: {
        fontSize: FONT_SIZES.xs,
        color: '#92400e',
    },
    footer: {
        flexDirection: 'row',
        padding: SPACING.l,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        gap: SPACING.m,
    },
    cancelButton: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: SPACING.m,
        backgroundColor: '#f3f4f6',
        borderRadius: BORDER_RADIUS.m,
    },
    cancelButtonText: {
        color: '#374151',
        fontWeight: 'bold',
        fontSize: FONT_SIZES.s,
    },
    saveButton: {
        flex: 2,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: SPACING.m,
        backgroundColor: COLORS.primary,
        borderRadius: BORDER_RADIUS.m,
    },
    saveButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: FONT_SIZES.s,
    },
});
