import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    ScrollView,
    TextInput,
    ActivityIndicator,
    Alert,
    Switch,
    FlatList,
} from 'react-native';
import { Camera, MapPin, Wifi, Building, X, ChevronDown, Check, Save, AlertCircle } from 'lucide-react-native';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { getCCTVTypes, getRegions, getSubunits, getUnits, getVendors, getZones, saveCCTVDetails } from '../../services/api/cctvApi';

interface AddCameraModalProps {
    onClose: () => void;
    onSubmitSuccess: () => void;
}

export const AddCameraModal: React.FC<AddCameraModalProps> = ({ onClose, onSubmitSuccess }) => {
    const { user } = useAuth();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [activeModal, setActiveModal] = useState<string | null>(null);

    // Dropdown Data
    const [zones, setZones] = useState<any[]>([]);
    const [vendors, setVendors] = useState<any[]>([]);
    const [types, setTypes] = useState<any[]>([]);
    const [regions, setRegions] = useState<any[]>([]);
    const [units, setUnits] = useState<any[]>([]);
    const [subunits, setSubunits] = useState<any[]>([]);

    const [formData, setFormData] = useState({
        cctv_id: '0',
        type_id: '0',
        unit_id: '0',
        subunit_id: '0',
        zone_id: '0',
        region_id: '0',
        latitude: '',
        longitude: '',
        cctv_name: '',
        cctv_description: '',
        health_status: '1',
        vendor_id: '0',
        make_model: '',
        resolution: '0',
        serial_number: '',
        location_address: '',
        ip_address: '',
        ip_port: '',
        installation_date: new Date().toISOString().split('T')[0],
        warranty_expiry_on: new Date().toISOString().split('T')[0],
        is_night_vision: 0,
        is_ptz_capable: 0,
        is_recording_enable: 0,
        rtsp_link: '',
        entry_user_id: '0',
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    const resolutions = ['720p', '1080p', '4K', '8MP'];

    useEffect(() => {
        const fetchMasters = async () => {
            try {
                const [z, v, t, r, u, s] = await Promise.all([
                    getZones(),
                    getVendors(),
                    getCCTVTypes(),
                    getRegions(),
                    getUnits(),
                    getSubunits(),
                ]);
                setZones(z?.data || []);
                setVendors(v?.data || []);
                setTypes(t?.data || []);
                setRegions(r?.data || []);
                setUnits(u?.data || []);
                setSubunits(s?.data || []);
            } catch (e) {
                console.error("Failed to load master data", e);
            }
        };
        fetchMasters();
    }, []);

    const handleChange = (key: string, value: any) => {
        setFormData(prev => ({ ...prev, [key]: value }));
        if (errors[key]) setErrors(prev => ({ ...prev, [key]: '' }));
    };

    const validateForm = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.cctv_name.trim()) newErrors.cctv_name = "Required";
        if (!formData.location_address.trim()) newErrors.location_address = "Required";
        if (formData.subunit_id === '0') newErrors.subunit_id = "Required";
        if (!formData.serial_number.trim()) newErrors.serial_number = "Required";

        // Basic IP check
        const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
        if (formData.ip_address && !ipRegex.test(formData.ip_address)) {
            newErrors.ip_address = "Invalid IP format";
        }

        if (formData.latitude && (parseFloat(formData.latitude) < -90 || parseFloat(formData.latitude) > 90)) {
            newErrors.latitude = "Invalid Lat";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm()) {
            Alert.alert("Validation Error", "Please check the highlighted fields.");
            return;
        }

        setIsSubmitting(true);
        try {
            // @ts-ignore - user might not have vendor_id typed yet
            const finalData = {
                ...formData,
                entry_user_id: user?.user_id,
                // @ts-ignore
                vendor_id: user?.vendor_id || formData.vendor_id,
            };

            const response = await saveCCTVDetails(finalData);
            console.log("Save Response:", response);

            if (response.status == 0) {
                Alert.alert("Success", "Camera added successfully");
                onSubmitSuccess();
                onClose();
            } else {
                Alert.alert("Error", response?.message || "Failed to add camera");
            }
        } catch (error) {
            console.error(error);
            Alert.alert("Error", "Something went wrong saving the camera.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Generic Selection Modal
    const renderSelectionModal = (
        title: string,
        data: any[],
        keyField: string,
        labelField: string,
        onSelect: (val: string) => void
    ) => (
        <Modal visible={activeModal === title} transparent animationType="fade" onRequestClose={() => setActiveModal(null)}>
            <TouchableOpacity style={styles.modalOverlay} onPress={() => setActiveModal(null)}>
                <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>Select {title}</Text>
                    <FlatList
                        data={data}
                        keyExtractor={(item) => item[keyField].toString()}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={styles.optionItem}
                                onPress={() => {
                                    onSelect(item[keyField].toString());
                                    setActiveModal(null);
                                }}
                            >
                                <Text style={styles.optionText}>{item[labelField]}</Text>
                                {((keyField === 'cctv_type_id' && formData.type_id === item[keyField].toString()) ||
                                    (keyField !== 'cctv_type_id' && formData[keyField as keyof typeof formData] === item[keyField].toString())) &&
                                    <Check size={20} color={COLORS.primary} />}
                            </TouchableOpacity>
                        )}
                    />
                </View>
            </TouchableOpacity>
        </Modal>
    );

    // Form Section Header
    const SectionHeader = ({ icon: Icon, title }: { icon: any, title: string }) => (
        <View style={styles.sectionHeader}>
            <Icon size={20} color={COLORS.textPrimary} />
            <Text style={styles.sectionTitle}>{title}</Text>
        </View>
    );

    // Form Field Helper
    const FormField = ({ label, value, onChange, placeholder, error, keyboardType = 'default' }: any) => (
        <View style={styles.fieldContainer}>
            <Text style={styles.label}>{label} {error && '*'}</Text>
            <TextInput
                style={[styles.input, error && styles.inputError]}
                value={value}
                onChangeText={onChange}
                placeholder={placeholder}
                placeholderTextColor={COLORS.textSecondary}
                keyboardType={keyboardType}
            />
            {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
    );

    const DropdownField = ({ label, value, placeholder, onPress, error }: any) => (
        <View style={styles.fieldContainer}>
            <Text style={styles.label}>{label} {error && '*'}</Text>
            <TouchableOpacity style={[styles.input, styles.dropdownInput, error && styles.inputError]} onPress={onPress}>
                <Text style={[styles.inputText, !value && { color: COLORS.textSecondary }]}>
                    {value || placeholder}
                </Text>
                <ChevronDown size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
            {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
    );

    return (
        <Modal visible transparent animationType="slide" onRequestClose={onClose}>
            <View style={styles.container}>
                <View style={styles.modalBg}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                            <View style={styles.iconBox}>
                                <Camera size={24} color={COLORS.primary} />
                            </View>
                            <View>
                                <Text style={styles.title}>Add New Camera</Text>
                                <Text style={styles.subtitle}>Configure a new device</Text>
                            </View>
                        </View>
                        <TouchableOpacity onPress={onClose}>
                            <X size={24} color={COLORS.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.formScroll} contentContainerStyle={{ padding: SPACING.m }}>

                        {/* Basic Info */}
                        <SectionHeader icon={Camera} title="Basic Information" />
                        <FormField
                            label="Camera Name"
                            value={formData.cctv_name}
                            onChange={(t: string) => handleChange('cctv_name', t)}
                            placeholder="e.g. Main Entrance"
                            error={errors.cctv_name}
                        />
                        <FormField
                            label="Model"
                            value={formData.make_model}
                            onChange={(t: string) => handleChange('make_model', t)}
                            placeholder="Device Model"
                        />
                        <FormField
                            label="Serial Number"
                            value={formData.serial_number}
                            onChange={(t: string) => handleChange('serial_number', t)}
                            placeholder="S/N"
                            error={errors.serial_number}
                        />

                        <DropdownField
                            label="CCTV Type"
                            value={types.find(t => t.cctv_type_id.toString() === formData.type_id)?.cctv_name}
                            placeholder="Select Type"
                            onPress={() => setActiveModal('Type')}
                        />

                        {/* Location Info */}
                        <SectionHeader icon={MapPin} title="Location Information" />
                        <FormField
                            label="Address"
                            value={formData.location_address}
                            onChange={(t: string) => handleChange('location_address', t)}
                            placeholder="Full Address"
                            error={errors.location_address}
                        />
                        <DropdownField
                            label="Zone"
                            value={zones.find(z => z.zone_id.toString() === formData.zone_id)?.zone_name}
                            placeholder="Select Zone"
                            onPress={() => setActiveModal('Zone')}
                        />
                        <DropdownField
                            label="Region"
                            value={regions.find(r => r.region_id.toString() === formData.region_id)?.region_name}
                            placeholder="Select Region"
                            onPress={() => setActiveModal('Region')}
                        />
                        <DropdownField
                            label="Sub-Unit (Police Station)"
                            value={subunits.find(s => s.subunit_id.toString() === formData.subunit_id)?.subunit_name}
                            placeholder="Select Station"
                            onPress={() => setActiveModal('SubUnit')}
                            error={errors.subunit_id}
                        />
                        <View style={{ flexDirection: 'row', gap: 10 }}>
                            <View style={{ flex: 1 }}>
                                <FormField
                                    label="Latitude"
                                    value={formData.latitude}
                                    onChange={(t: string) => handleChange('latitude', t)}
                                    placeholder="0.0000"
                                    keyboardType="numeric"
                                    error={errors.latitude}
                                />
                            </View>
                            <View style={{ flex: 1 }}>
                                <FormField
                                    label="Longitude"
                                    value={formData.longitude}
                                    onChange={(t: string) => handleChange('longitude', t)}
                                    placeholder="0.0000"
                                    keyboardType="numeric"
                                />
                            </View>
                        </View>

                        {/* Network Info */}
                        <SectionHeader icon={Wifi} title="Network Configuration" />
                        <FormField
                            label="IP Address"
                            value={formData.ip_address}
                            onChange={(t: string) => handleChange('ip_address', t)}
                            placeholder="192.168.1.100"
                            error={errors.ip_address}
                        />
                        <FormField
                            label="Port"
                            value={formData.ip_port}
                            onChange={(t: string) => handleChange('ip_port', t)}
                            placeholder="80"
                            keyboardType="numeric"
                        />
                        <FormField
                            label="RTSP Link"
                            value={formData.rtsp_link}
                            onChange={(t: string) => handleChange('rtsp_link', t)}
                            placeholder="rtsp://..."
                        />

                        {/* Features Switches */}
                        <View style={styles.featuresContainer}>
                            <Text style={styles.label}>Features</Text>
                            <View style={styles.switchRow}>
                                <Text style={styles.switchLabel}>Night Vision</Text>
                                <Switch
                                    value={formData.is_night_vision === 1}
                                    onValueChange={(v) => handleChange('is_night_vision', v ? 1 : 0)}
                                />
                            </View>
                            <View style={styles.switchRow}>
                                <Text style={styles.switchLabel}>PTZ Capable</Text>
                                <Switch
                                    value={formData.is_ptz_capable === 1}
                                    onValueChange={(v) => handleChange('is_ptz_capable', v ? 1 : 0)}
                                />
                            </View>
                        </View>

                        {/* Warning Box */}
                        <View style={styles.warningBox}>
                            <AlertCircle size={20} color={COLORS.primary} style={{ marginTop: 2 }} />
                            <View style={{ flex: 1 }}>
                                <Text style={styles.warningTitle}>Important Notes</Text>
                                <Text style={styles.warningText}>• Ensure IP is accessible from VPN.</Text>
                                <Text style={styles.warningText}>• Verify credentials before saving.</Text>
                            </View>
                        </View>

                        <View style={{ height: 100 }} />
                    </ScrollView>

                    {/* Footer Actions */}
                    <View style={styles.footer}>
                        <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.submitButton, isSubmitting && { opacity: 0.7 }]}
                            onPress={handleSubmit}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? <ActivityIndicator color="white" /> : <Save size={20} color="white" />}
                            <Text style={styles.submitButtonText}>{isSubmitting ? "Saving..." : "Add Camera"}</Text>
                        </TouchableOpacity>
                    </View>

                </View>

                {/* Modals */}
                {renderSelectionModal('Zone', zones, 'zone_id', 'zone_name', (v) => handleChange('zone_id', v))}
                {renderSelectionModal('Region', regions, 'region_id', 'region_name', (v) => handleChange('region_id', v))}
                {renderSelectionModal('SubUnit', subunits, 'subunit_id', 'subunit_name', (v) => handleChange('subunit_id', v))}
                {renderSelectionModal('Type', types, 'cctv_type_id', 'cctv_name', (v) => handleChange('type_id', v))}

            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalBg: {
        backgroundColor: COLORS.background,
        borderTopLeftRadius: BORDER_RADIUS.l,
        borderTopRightRadius: BORDER_RADIUS.l,
        height: '90%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: SPACING.l,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    iconBox: {
        backgroundColor: '#EFF6FF',
        padding: SPACING.s,
        borderRadius: BORDER_RADIUS.s,
    },
    title: {
        fontSize: FONT_SIZES.l,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
    },
    subtitle: {
        fontSize: FONT_SIZES.s,
        color: COLORS.textSecondary,
    },
    formScroll: {
        flex: 1,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.s,
        marginBottom: SPACING.m,
        marginTop: SPACING.s,
    },
    sectionTitle: {
        fontSize: FONT_SIZES.m,
        fontWeight: '600',
        color: COLORS.textPrimary,
    },
    fieldContainer: {
        marginBottom: SPACING.m,
    },
    label: {
        fontSize: FONT_SIZES.s,
        color: COLORS.textPrimary,
        marginBottom: SPACING.xs,
        fontWeight: '500',
    },
    input: {
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: BORDER_RADIUS.s,
        padding: SPACING.m,
        fontSize: FONT_SIZES.m,
        color: COLORS.textPrimary,
    },
    inputError: {
        borderColor: 'red',
    },
    inputText: {
        fontSize: FONT_SIZES.m,
        color: COLORS.textPrimary,
    },
    errorText: {
        color: 'red',
        fontSize: FONT_SIZES.xs,
        marginTop: 2,
    },
    dropdownInput: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    // Switch
    featuresContainer: {
        backgroundColor: COLORS.cardBackground,
        padding: SPACING.m,
        borderRadius: BORDER_RADIUS.m,
        marginBottom: SPACING.m,
    },
    switchRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.s,
    },
    switchLabel: {
        fontSize: FONT_SIZES.m,
        color: COLORS.textPrimary,
    },
    // Warning
    warningBox: {
        flexDirection: 'row',
        backgroundColor: '#EFF6FF',
        padding: SPACING.m,
        borderRadius: BORDER_RADIUS.m,
        gap: SPACING.s,
        marginBottom: SPACING.l,
    },
    warningTitle: {
        fontWeight: 'bold',
        color: COLORS.primary,
        marginBottom: 2,
    },
    warningText: {
        fontSize: FONT_SIZES.s,
        color: '#1e3a8a',
    },
    // Footer
    footer: {
        flexDirection: 'row',
        padding: SPACING.m,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        gap: SPACING.m,
        backgroundColor: COLORS.cardBackground,
    },
    cancelButton: {
        flex: 1,
        padding: SPACING.m,
        backgroundColor: COLORS.surface,
        borderRadius: BORDER_RADIUS.m,
        alignItems: 'center',
    },
    cancelButtonText: {
        color: COLORS.textPrimary,
        fontWeight: '600',
    },
    submitButton: {
        flex: 1,
        padding: SPACING.m,
        backgroundColor: COLORS.primary,
        borderRadius: BORDER_RADIUS.m,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACING.s,
    },
    submitButtonText: {
        color: COLORS.textInverse,
        fontWeight: '600',
    },
    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: SPACING.m,
    },
    modalContent: {
        backgroundColor: COLORS.cardBackground,
        borderRadius: BORDER_RADIUS.m,
        maxHeight: '70%',
        padding: SPACING.m,
    },
    modalTitle: {
        fontSize: FONT_SIZES.l,
        fontWeight: 'bold',
        marginBottom: SPACING.m,
        textAlign: 'center',
    },
    optionItem: {
        paddingVertical: SPACING.m,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    optionText: {
        fontSize: FONT_SIZES.m,
        color: COLORS.textPrimary,
    },
});
