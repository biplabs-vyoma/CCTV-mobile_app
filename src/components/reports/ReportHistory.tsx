
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Modal,
    FlatList,
    ActivityIndicator,
    TextInput
} from 'react-native';
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
import { callAPIWithEnc } from '../../apis/common/api';
import { useAuth } from '../../context/AuthContext';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZES } from '../../constants/theme';

export const ReportHistory: React.FC = () => {
    // @ts-ignore
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [fetchingMaster, setFetchingMaster] = useState(false);

    // Master Data
    const [regionOptions, setRegionOptions] = useState<any[]>([]);
    const [activeModal, setActiveModal] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        region_id: "0",
        region_name: "Select DRO",
        zone_id: "0",
        unit_id: "0",
        vendor_id: "0",
        start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        end_date: new Date().toISOString().split('T')[0]
    });

    // Fetch DRO (Region) Options
    useEffect(() => {
        const getRegionOptions = async () => {
            setFetchingMaster(true);
            try {
                const response = await callAPIWithEnc("master/getRegion", "POST", {});
                if (response?.data) {
                    setRegionOptions(response.data.map((r: any) => ({
                        id: r.region_id.toString(),
                        name: r.region_name
                    })));
                }
            } catch (err) {
                console.error("Failed to fetch regions:", err);
            } finally {
                setFetchingMaster(false);
            }
        };
        getRegionOptions();
    }, []);

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

                    <View style={styles.filterGrid}>
                        {/* DRO / Region Filter */}
                        <View style={styles.filterItem}>
                            <Text style={styles.filterLabel}>DRO</Text>
                            <TouchableOpacity
                                style={styles.selectButton}
                                onPress={() => setActiveModal('DRO')}
                            >
                                <Text style={[
                                    styles.selectButtonText,
                                    formData.region_id === "0" && styles.placeholderText
                                ]}>
                                    {formData.region_name}
                                </Text>
                                {fetchingMaster ? (
                                    <ActivityIndicator size="small" color={COLORS.primary} />
                                ) : (
                                    <ChevronDown size={20} color={COLORS.textSecondary} />
                                )}
                            </TouchableOpacity>
                        </View>

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

                {/* Info Message */}
                <View style={styles.infoMessage}>
                    <Text style={styles.infoText}>
                        Select a DRO and click Generate Report to view history.
                    </Text>
                </View>
            </ScrollView>

            {/* Modals */}
            {renderDropdownModal('DRO', regionOptions, formData.region_id, (id, name) => handleSelectDRO(id, name))}
        </View>
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
