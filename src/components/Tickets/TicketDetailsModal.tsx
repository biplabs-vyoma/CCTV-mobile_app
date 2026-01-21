import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    Modal,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    TextInput,
    Image,
    Alert,
    ActivityIndicator,
    Linking,
    Platform,
    PermissionsAndroid,
    KeyboardAvoidingView
} from 'react-native';
import { launchCamera } from 'react-native-image-picker';
import Geolocation from 'react-native-geolocation-service';
import {
    X,
    Clock,
    User,
    MessageCircle,
    AlertTriangle,
    CheckCircle,
    Settings,
    Phone,
    Mail,
    Camera,
    Star,
    Check,
    ChevronDown,
    MapPin
} from 'lucide-react-native';
import { Ticket, Engineer, ChatMessage, ChatSession } from '../../types/ticket';
import { ChatInterface } from '../Chat/ChatInterface';
import { FinalClosureModal } from './FinalClosureModal';
import { useAuth } from '../../context/AuthContext';
import { callAPIWithEnc, callAPIWithoutEnc } from '../../apis/common/api';
import { COLORS } from '../../constants/theme';
import { CustomAlert } from '../CustomAlert';

// Toast Polyfill
const toast = {
    success: (msg: string) => Alert.alert('Success', msg),
    error: (msg: string) => Alert.alert('Error', msg),
    info: (msg: string) => Alert.alert('Info', msg),
};

interface TicketDetailsModalProps {
    ticket: Ticket;
    onClose: () => void;
    onUpdate: () => void;
    userRole: string;
    activeTab: 'details' | 'engineer' | 'status' | 'chat';
    setActiveTab: (tab: 'details' | 'engineer' | 'status' | 'chat') => void;
    ticketComments: any;
}

export const TicketDetailsModal: React.FC<TicketDetailsModalProps> = ({
    ticket,
    onClose,
    onUpdate,
    activeTab,
    setActiveTab,
    ticketComments,
}) => {
    // @ts-ignore
    const { user } = useAuth();
    const [selectedEngineerId, setSelectedEngineerId] = useState('');
    const [statusComments, setStatusComments] = useState('');
    const [isPhysicallyVerified, setIsPhysicallyVerified] = useState(false);
    const [ticketRating, setTicketRating] = useState(0);
    const [showFinalClosure, setShowFinalClosure] = useState(false);
    const [availableEngineers, setAvailableEngineers] = useState<Engineer[]>([]);
    const [evidenceImage, setEvidenceImage] = useState<string | null>(null);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [showImageModal, setShowImageModal] = useState(false);
    const [showCapturedImageModal, setShowCapturedImageModal] = useState(false);
    const [currentLocation, setCurrentLocation] = useState({ latitude: '', longitude: '' });
    const [statusOptions, setStatusOptions] = useState<any[]>([]);
    const [selectedStatusId, setSelectedStatusId] = useState('');
    const [isStatusModalVisible, setIsStatusModalVisible] = useState(false);

    // Resolution Category State
    const [resolutionCategories, setResolutionCategories] = useState<any[]>([]);
    const [selectedResolutionCategoryId, setSelectedResolutionCategoryId] = useState('');
    const [isResolutionCategoryModalVisible, setIsResolutionCategoryModalVisible] = useState(false);
    const [selectedResolutionCategoryName, setSelectedResolutionCategoryName] = useState('');
    const [isLoadingResolutionCategories, setIsLoadingResolutionCategories] = useState(false);

    // Sub Resolution Category State
    const [subResolutionCategories, setSubResolutionCategories] = useState<any[]>([]);
    const [selectedSubResolutionCategoryId, setSelectedSubResolutionCategoryId] = useState('');
    const [isSubResolutionCategoryModalVisible, setIsSubResolutionCategoryModalVisible] = useState(false);
    const [selectedSubResolutionCategoryName, setSelectedSubResolutionCategoryName] = useState('');
    const [isLoadingSubResolutionCategories, setIsLoadingSubResolutionCategories] = useState(false);

    const [showCamera, setShowCamera] = useState(false);
    const [alertConfig, setAlertConfig] = useState<{
        visible: boolean;
        title: string;
        message: string;
        type: 'success' | 'error' | 'warning' | 'info';
        shouldCloseParent?: boolean;
        onConfirm?: () => void;
        confirmText?: string;
        cancelText?: string;
    }>({
        visible: false,
        title: '',
        message: '',
        type: 'info',
        shouldCloseParent: false
    });

    const [isLoadingTimeline, setIsLoadingTimeline] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false); // New State for Full Screen Loader
    const [isCapturingImage, setIsCapturingImage] = useState(false); // New State for Image Capture Loader
    const [isFetchingEvidence, setIsFetchingEvidence] = useState(false);
    const [isFetchingEngEvidence, setIsFetchingEngEvidence] = useState(false);
    const [loadingEvidenceFilename, setLoadingEvidenceFilename] = useState<string | null>(null);

    const canManageTicket = [10, 20, 30, 40, 100].includes(Number(user?.user_type_id));
    const isTicketCreator = user?.user_id == ticket.ticket_created_user_id;
    const canFinalClose = isTicketCreator && ticket?.ticket_status == '220';

    console.log("Ticket Data:", ticketComments);
    console.log("Ticket:", ticket);

    // Update loading state when ticketComments changes
    useEffect(() => {
        if (ticketComments) {
            setIsLoadingTimeline(false);
        } else {
            setIsLoadingTimeline(true);
        }
    }, [ticketComments]);

    // // Mock chat session (simplified from input)
    // const mockChatSession: any = {
    //     id: `chat_${ticket.ticket_id}`,
    //     // ...other properties mocked
    // };
    // const mockChatMessages: any[] = [];

    const getFieldEnginnerByVendor = async () => {
        try {
            const engineers = await callAPIWithEnc(
                'vendor/getFieldEnginnerByVendor',
                'POST',
                {
                    unit_id: user?.unit_id || 0,
                    subunit_id: user?.subunit_id || 0,
                    region_id: user?.region_id || 0,
                    zone_id: user?.zone_id || 0,
                    entry_user_id: user?.user_id || 0,
                    entry_user_type_id: user?.user_type_id || 0,
                }
            );
            console.log("Raw Engineer Data:", engineers);
            let rawData = engineers?.data;
            if (typeof rawData === "string") {
                try {
                    rawData = JSON.parse(rawData);
                } catch (e) {
                    console.error("Failed to parse engineers data:", e);
                    rawData = [];
                }
            }
            console.log("Parsed Engineer Data:", rawData);
            setAvailableEngineers(rawData || []);
        } catch (e) {
            console.log('Error fetching engineers', e);
        }
    };

    const handleAssignEngineer = async () => {
        try {
            const response = await callAPIWithEnc(
                'vendor/assignFieldEngineer',
                'POST',
                {
                    ticket_assign_id: 0,
                    ticket_id: ticket?.ticket_id,
                    assign_user_id: selectedEngineerId,
                    entry_user_id: user?.user_id || 0,
                }
            );

            if (response?.status == 0) {
                onUpdate();
                toast.success('Engineer assigned successfully');
            } else {
                toast.error(response?.message || 'Failed to assign engineer');
            }
        } catch (e) {
            toast.error('Error assigning engineer');
        }
    };

    const getImgAsBase64ByFileName = async () => {
        console.log('=== Evidence Image Loading ===');
        console.log('ticket_image1:', ticket?.ticket_image1);

        if (!ticket?.ticket_image1) {
            setAlertConfig({
                visible: true,
                title: 'Info',
                message: 'No evidence image available.',
                type: 'info',
                shouldCloseParent: false
            });
            return;
        }

        try {
            setIsFetchingEvidence(true);
            console.log('Calling API with filename:', ticket?.ticket_image1);

            const response: any = await callAPIWithoutEnc(
                'user/getImgAsBase64ByFileName',
                'POST',
                {
                    filename: ticket?.ticket_image1,
                }
            );

            console.log('API Response:', {
                status: response?.status,
                hasData: !!response?.data,
                dataType: typeof response?.data,
                dataLength: response?.data?.length,
                message: response?.message
            });

            const base64Image = response?.data;
            if (base64Image) {
                console.log('Setting evidence image, length:', base64Image.length);
                setEvidenceImage(base64Image);
                setShowImageModal(true);
            } else {
                console.error('No base64 data in response');
                setAlertConfig({
                    visible: true,
                    title: 'Error',
                    message: response?.message || 'Failed to load evidence image.',
                    type: 'error',
                    shouldCloseParent: false
                });
            }
        } catch (e: any) {
            console.error('Exception loading image:', e);
            console.error('Error message:', e?.message);
            console.error('Error stack:', e?.stack);
            setAlertConfig({
                visible: true,
                title: 'Error',
                message: 'Error loading image: ' + (e?.message || 'Unknown error'),
                type: 'error',
                shouldCloseParent: false
            });
        } finally {
            setIsFetchingEvidence(false);
        }
    };

    const getEngineerEvidenceImage = async (filenameOverride?: string) => {
        const filename = filenameOverride || ticket?.enginner_evidence_path;

        if (!filename) {
            setAlertConfig({
                visible: true,
                title: 'Info',
                message: 'No engineer evidence image available.',
                type: 'info',
                shouldCloseParent: false
            });
            return;
        }

        try {
            if (filenameOverride) {
                setLoadingEvidenceFilename(filename);
            } else {
                setIsFetchingEngEvidence(true);
            }
            console.log('Calling API with filename:', filename);

            const response: any = await callAPIWithoutEnc(
                'user/getImgAsBase64ByFileName',
                'POST',
                {
                    filename: filename,
                }
            );

            const base64Image = response?.data;
            if (base64Image) {
                setEvidenceImage(base64Image);
                setShowImageModal(true);
            } else {
                setAlertConfig({
                    visible: true,
                    title: 'Error',
                    message: response?.message || 'Failed to load evidence image.',
                    type: 'error',
                    shouldCloseParent: false
                });
            }
        } catch (e: any) {
            console.error('Exception loading image:', e);
        } finally {
            setLoadingEvidenceFilename(null);
            setIsFetchingEngEvidence(false);
        }
    };

    const openMap = (lat: string, lng: string) => {
        const scheme = Platform.select({ ios: 'maps:0,0?q=', android: 'geo:0,0?q=' });
        const latLng = `${lat},${lng}`;
        const label = 'Ticket Location';
        const url = Platform.select({
            ios: `${scheme}${label}@${latLng}`,
            android: `${scheme}${latLng}(${label})`
        });

        if (url) {
            Linking.openURL(url);
        }
    };

    const getStatusOptions = async () => {
        try {
            console.log('--- Fetching Status Options ---');
            const response: any = await callAPIWithEnc('master/getStatusDetails', 'POST', {});
            console.log('Status API Response:', response);
            const allStatuses = response?.data || [];
            const filteredStatuses = allStatuses.filter((s: any) => s.status_id != ticket.ticket_status);
            console.log('Filtered Statuses:', filteredStatuses);
            setStatusOptions(filteredStatuses);
        } catch (e) {
            console.log('Error fetching status options:', e);
        }
    };

    const getResolutionCategories = async () => {
        try {
            setIsLoadingResolutionCategories(true);
            console.log('--- Fetching Resolution Categories ---');
            const response: any = await callAPIWithEnc('vendor/getResolutionCategory', 'POST', {});
            console.log('Resolution Categories API Response:', response);

            if (response?.status === 0 && Array.isArray(response?.data)) {
                setResolutionCategories(response.data);
            } else {
                console.warn('Invalid resolution category response', response);
                setResolutionCategories([]);
            }
        } catch (e) {
            console.error('Error fetching resolution categories:', e);
            setResolutionCategories([]);
            toast.error('Failed to load resolution categories');
        } finally {
            setIsLoadingResolutionCategories(false);
        }
    };

    const getSubResolutionCategories = async (categoryId: string) => {
        try {
            setIsLoadingSubResolutionCategories(true);
            setSubResolutionCategories([]); // Clear previous
            console.log('--- Fetching Sub Resolution Categories for ID:', categoryId);

            const payload = { category_id: categoryId };
            const response: any = await callAPIWithEnc('vendor/getResolutionCategoryByCategoryID', 'POST', payload);
            console.log('Sub Resolution Categories API Response:', response);

            if (response?.status === 0 && Array.isArray(response?.data)) {
                setSubResolutionCategories(response.data);
            } else {
                console.log('No sub-categories found or invalid response', response);
                setSubResolutionCategories([]);
            }
        } catch (e) {
            console.error('Error fetching sub resolution categories:', e);
            setSubResolutionCategories([]);
        } finally {
            setIsLoadingSubResolutionCategories(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'engineer') {
            getFieldEnginnerByVendor();
        }
        if (activeTab === 'status') {
            getStatusOptions();
            getResolutionCategories();
        }
    }, [activeTab]);

    const fetchCurrentLocation = async () => {
        try {
            setCurrentLocation({ latitude: 'Fetching...', longitude: 'Fetching...' });

            // Request location permission on Android
            if (Platform.OS === 'android') {
                const hasPermission = await PermissionsAndroid.check(
                    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
                );

                if (!hasPermission) {
                    const granted = await PermissionsAndroid.request(
                        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
                        {
                            title: 'Location Permission',
                            message: 'App needs location permission to capture current coordinates.',
                            buttonPositive: 'OK',
                        }
                    );

                    if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
                        toast.error('Location permission is required');
                        return;
                    }
                }
            }

            // Get current position
            Geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    setCurrentLocation({
                        latitude: latitude.toString(),
                        longitude: longitude.toString()
                    });
                    toast.success('Location captured successfully');
                },
                (error) => {
                    console.log('Location Error:', error);
                    toast.error('Could not fetch location: ' + (error.message || 'Unknown error'));
                    // Fallback to previous location if available
                    if (currentLocation.latitude === 'Fetching...') {
                        setCurrentLocation({ latitude: '', longitude: '' });
                    }
                },
                {
                    enableHighAccuracy: true,
                    timeout: 15000,
                    maximumAge: 0
                }
            );
        } catch (error: any) {
            console.log('Location Exception:', error);
            toast.error('Location error: ' + (error?.message || 'Unknown'));
        }
    };


    // Helper function to get location as a Promise (Strict Check)
    const getLocationPromise = () => {
        return new Promise<Geolocation.GeoPosition>((resolve, reject) => {
            Geolocation.getCurrentPosition(
                (position) => resolve(position),
                (error) => reject(error),
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0,
                    forceRequestLocation: true
                }
            );
        });
    };

    const handleCaptureImage = async () => {
        const options: any = {
            mediaType: 'photo',
            includeBase64: true,
            quality: 0.7,
            maxWidth: 1024,
            maxHeight: 1024,
            saveToPhotos: false,
        };

        try {
            setIsCapturingImage(true);
            // 1. Check Permissions on Android
            if (Platform.OS === 'android') {
                const hasPermission = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
                const hasCameraPermission = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.CAMERA);

                if (!hasPermission || !hasCameraPermission) {
                    const grantedLoc = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
                    const grantedCam = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.CAMERA);

                    if (grantedLoc !== PermissionsAndroid.RESULTS.GRANTED || grantedCam !== PermissionsAndroid.RESULTS.GRANTED) {
                        toast.error('Location and Camera permissions are required');
                        return;
                    }
                }
            }

            // 2. PRE-CHECK: Check if Location Service (GPS) is ON before opening camera
            try {
                // Toast to inform user we are checking GPS
                // toast.info('Verifying GPS status...'); 
                await getLocationPromise();
            } catch (error: any) {
                setAlertConfig({
                    visible: true,
                    title: 'Location Required',
                    message: 'Your Device Location (GPS) is OFF. You must turn it ON to capture evidence.',
                    type: 'warning',
                    confirmText: 'Open Settings',
                    cancelText: 'Cancel',
                    onConfirm: () => {
                        setAlertConfig({ ...alertConfig, visible: false, onConfirm: undefined });
                        Platform.OS === 'ios'
                            ? Linking.openURL('app-settings:')
                            : Linking.sendIntent('android.settings.LOCATION_SOURCE_SETTINGS');
                    }
                });
                return;
            }

            if (typeof launchCamera !== 'function') return;
            const result = await launchCamera(options);

            if (result.didCancel) {
                setIsCapturingImage(false);
                return;
            } else if (result.errorCode) {
                setIsCapturingImage(false);
                setAlertConfig({
                    visible: true,
                    title: 'Camera Error',
                    message: result.errorMessage || 'Failed to open camera',
                    type: 'error',
                    shouldCloseParent: false
                });
            } else if (result.assets && result.assets[0].base64) {
                try {
                    const position = await getLocationPromise();

                    // If successful, save data
                    const { latitude, longitude } = position.coords;

                    const base64Data = `data:image/jpeg;base64,${result.assets[0].base64}`;

                    console.log("\n\n========== COPY BELOW STRING AND PASTE IN CHROME ==========\n");
                    console.log(base64Data);
                    console.log("\n===========================================================\n\n");

                    setCapturedImage(base64Data);

                    setCurrentLocation({
                        latitude: latitude.toString(),
                        longitude: longitude.toString()
                    });

                    // toast.success('Evidence captured successfully with location');

                } catch (locError) {
                    // Location was turned off DURING capture
                    setCapturedImage(null); // Discard the image
                    setCurrentLocation({ latitude: '', longitude: '' });

                    setAlertConfig({
                        visible: true,
                        title: 'Capture Failed',
                        message: 'Location services were turned OFF during the process. The image has been discarded. Please keep GPS ON and try again.',
                        type: 'error',
                        shouldCloseParent: false
                    });
                }
            }
        } catch (error: any) {
            console.error(error);
            setAlertConfig({
                visible: true,
                title: 'Error',
                message: 'An unexpected error occurred: ' + (error?.message || 'Unknown'),
                type: 'error',
                shouldCloseParent: false
            });
        } finally {
            setIsCapturingImage(false);
        }
    };

    const handleUpdateEngineerStatus = async () => {
        // Validation
        if (!selectedResolutionCategoryId && ![20].includes(Number(user?.user_type_id))) {
            setAlertConfig({
                visible: true,
                title: 'Update Failed',
                message: 'Please select a resolution category',
                type: 'error',
                shouldCloseParent: false
            });
            return;
        }

        if (selectedResolutionCategoryName === 'Others' && !statusComments.trim()) {
            setAlertConfig({
                visible: true,
                title: 'Update Failed',
                message: 'Remarks are required for "Others" category',
                type: 'error',
                shouldCloseParent: false
            });
            return;
        }

        if (!capturedImage) {
            setAlertConfig({
                visible: true,
                title: 'Update Failed',
                message: 'Evidence image is required',
                type: 'error',
                shouldCloseParent: false
            });
            return;
        }

        // LOADER START
        setIsSubmitting(true);

        try {
            console.log('--- Preparing Engineer Status Update (New API) ---');

            const cleanLongitude = Number(String(currentLocation.longitude || "0.0").replace(/[^\d.-]/g, ''));
            const cleanLatitude = Number(String(currentLocation.latitude || "0.0").replace(/[^\d.-]/g, ''));

            const payload = {
                ticket_id: Number(ticket?.ticket_id),
                status_id: 230,
                remarks: statusComments,
                evidence_file_path: capturedImage || "",
                longitude: cleanLongitude,
                latitude: cleanLatitude,
                user_id: Number(user?.user_id),
                user_type_id: Number(user?.user_type_id),
                vendor_id: Number(user?.vendor_id || 0),
            };

            const response: any = await callAPIWithEnc(
                'vendor/enginnerUpdateStatusByTicketId',
                'POST',
                payload
            );

            // LOADER STOP (Response aane ke baad)
            setIsSubmitting(false);

            if (response?.status == 0) {
                setAlertConfig({
                    visible: true,
                    title: 'Update Successful',
                    message: 'Ticket status has been updated successfully.',
                    type: 'success',
                    shouldCloseParent: true
                });
            }
            else {
                setAlertConfig({
                    visible: true,
                    title: 'Update Failed',
                    message: response?.message || 'Failed to update status',
                    type: 'error',
                    shouldCloseParent: false
                });
            }
        } catch (e) {
            console.error(e);
            // LOADER STOP (Error aane par bhi)
            setIsSubmitting(false);

            setAlertConfig({
                visible: true,
                title: 'Error',
                message: 'An error occurred while updating status',
                type: 'error',
                shouldCloseParent: false
            });
        }
    };

    const handleResolveTicket = async () => {
        const userTypeId = Number(user?.user_type_id);
        const isEngineer = [30, 40].includes(userTypeId);
        const isClient = userTypeId == 10;

        if (isEngineer) {
            handleUpdateEngineerStatus();
            return;
        }

        if (isClient && ticket?.ticket_status == '240') {
            // Client Closing Ticket
            if (!isPhysicallyVerified) {
                toast.error('Physical verification is required to close the ticket');
                return;
            }
            if (selectedResolutionCategoryName === 'Others' && !statusComments.trim()) {
                toast.error('Closure comments are required');
                return;
            }

            // Trigger Final Closure logic
            setShowFinalClosure(true);
            return;
        }
    };

    const handleFinalClosure = (ticketId: string, closureData: any) => {
        onUpdate();
    };

    const getStatusColor = (status: any) => {
        const s = String(status);
        switch (s) {
            case '210': return { bg: '#eff6ff', text: '#1e40af' }; // blue
            case '220': return { bg: '#faf5ff', text: '#6b21a8' }; // purple
            case '230': return { bg: '#fefce8', text: '#854d0e' }; // yellow
            case '240': return { bg: '#dcfce7', text: '#166534' }; // green
            case '250': return { bg: '#f3f4f6', text: '#1f2937' }; // gray
            default: return { bg: '#f3f4f6', text: '#1f2937' };
        }
    };

    const getPriorityColor = (priority: string) => {
        const p = priority?.toLowerCase() || '';
        if (p.includes('critical')) return { bg: '#fee2e2', text: '#991b1b' };
        if (p.includes('high')) return { bg: '#ffedd5', text: '#9a3412' };
        if (p.includes('medium')) return { bg: '#fef9c3', text: '#854d0e' };
        return { bg: '#f3f4f6', text: '#1f2937' };
    };

    const renderTimelineItem = (item: any, idx: number) => {
        let IconComponent = CheckCircle;
        let color = '#9ca3af'; // gray

        // Basic status mapping - can be expanded
        if (idx === 0) { IconComponent = Clock; color = COLORS?.primary || '#2563eb'; }
        else if (item?.ticket_status?.toLowerCase().includes('open')) { IconComponent = AlertTriangle; color = '#ef4444'; }
        else if (item?.ticket_status?.toLowerCase().includes('resolved')) { IconComponent = CheckCircle; color = '#10b981'; }

        const isLast = idx === (ticketComments?.length - 1);

        return (
            <View key={idx} style={styles.timelineItem}>
                <View style={styles.timelineLeftColumn}>
                    <View style={[styles.timelineIconWrapper, { backgroundColor: color + '15' }]}>
                        <IconComponent size={14} color={color} />
                    </View>
                    {!isLast && <View style={styles.timelineLine} />}
                </View>

                <View style={styles.timelineRightColumn}>
                    <View style={styles.timelineHeader}>
                        <Text style={[styles.timelineStatus, { color: color }]}>{item?.ticket_status || '-'}</Text>
                        <Text style={styles.timelineDate}>
                            {item?.ticket_status_on_date ? new Date(item.ticket_status_on_date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : ''}
                        </Text>
                    </View>

                    <Text style={styles.timelineUser}>
                        <User size={12} color={COLORS.textSecondary} /> {item?.status_by} • <Text style={{ fontWeight: '600' }}>{item?.status_by_user_type || '-'}</Text>
                    </Text>

                    {item?.remarks && item?.remarks.trim() !== "" && (
                        <View style={styles.timelineRemarksContainer}>
                            <MessageCircle size={14} color={COLORS.textSecondary} style={{ marginTop: 2 }} />
                            <Text style={styles.timelineRemarksText}>{item.remarks}</Text>
                        </View>
                    )}
                </View>
            </View>
        );
    };


    return (
        <Modal visible={true} transparent animationType="slide" onRequestClose={onClose}>
            <View style={styles.overlay}>
                <View style={styles.container}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View>
                            <Text style={styles.title}>Ticket Details</Text>
                            <Text style={styles.subtitle}>{ticket?.ticket_number}</Text>
                        </View>
                        <View style={{ flexDirection: 'row', gap: 10 }}>
                            {canFinalClose && (
                                <TouchableOpacity
                                    style={styles.successButton}
                                    onPress={() => setShowFinalClosure(true)}
                                >
                                    <CheckCircle size={16} color="#fff" />
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                                <X size={24} color={COLORS.text} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Navigation */}
                    <View style={styles.navContainer}>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            <TouchableOpacity onPress={() => setActiveTab('details')} style={[styles.navTab, activeTab === 'details' && styles.navTabActive]}>
                                <Text style={[styles.navText, activeTab === 'details' && styles.navTextActive]}>Details</Text>
                            </TouchableOpacity>
                            {/* <TouchableOpacity onPress={() => setActiveTab('chat')} style={[styles.navTab, activeTab === 'chat' && styles.navTabActive]}>
                                <Text style={[styles.navText, activeTab === 'chat' && styles.navTextActive]}>Chat</Text>
                             </TouchableOpacity> */}
                            {canManageTicket && ticket?.ticket_status <= '210' && user?.user_type_id != 10 && (
                                <TouchableOpacity onPress={() => setActiveTab('engineer')} style={[styles.navTab, activeTab === 'engineer' && styles.navTabActive]}>
                                    <Text style={[styles.navText, activeTab === 'engineer' && styles.navTextActive]}>Engineer</Text>
                                </TouchableOpacity>
                            )}
                            {canManageTicket && ticket?.ticket_status >= '220' && (
                                <TouchableOpacity onPress={() => setActiveTab('status')} style={[styles.navTab, activeTab === 'status' && styles.navTabActive]}>
                                    <Text style={[styles.navText, activeTab === 'status' && styles.navTextActive]}>Status</Text>
                                </TouchableOpacity>
                            )}
                        </ScrollView>
                    </View>

                    {/* Content */}
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        style={{ flex: 1 }}
                    >
                        <View style={styles.content}>
                            {activeTab === 'details' && (
                                <ScrollView
                                    style={styles.tabContent}
                                    contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}
                                >
                                    {/* Basic Info */}
                                    <Text style={styles.sectionTitle}>Ticket Information</Text>
                                    <View style={styles.card}>
                                        <View style={styles.infoRow}>
                                            <Camera size={20} color={COLORS.textSecondary} />
                                            <View style={{ marginLeft: 10 }}>
                                                <Text style={styles.infoTitle}>{ticket?.cctv_name}</Text>
                                                <Text style={styles.infoText}>{ticket?.cctv_location_address}</Text>
                                                <Text style={styles.infoSubText}>{ticket?.cctv_serial_number}</Text>

                                                {/* Evidence Image Button */}
                                                {ticket?.ticket_image1 && (
                                                    <TouchableOpacity
                                                        style={[styles.evidenceButton, isFetchingEvidence && styles.buttonDisabled]}
                                                        onPress={getImgAsBase64ByFileName}
                                                        disabled={isFetchingEvidence}
                                                    >
                                                        {isFetchingEvidence ? (
                                                            <ActivityIndicator size="small" color="#fff" />
                                                        ) : (
                                                            <Camera size={14} color="#fff" />
                                                        )}
                                                        <Text style={styles.evidenceButtonText}>
                                                            {isFetchingEvidence ? 'Please wait...' : 'View Evidence Image'}
                                                        </Text>
                                                    </TouchableOpacity>
                                                )}
                                            </View>
                                        </View>

                                        <View style={styles.divider} />

                                        <View style={styles.metaRow}>
                                            <View>
                                                <Text style={styles.metaLabel}>Issue Type</Text>
                                                <Text style={styles.metaValue}>{ticket.incident_category_name?.replace('_', ' ')}</Text>
                                            </View>
                                            <View style={{ flexDirection: 'row', gap: 10 }}>
                                                <View>
                                                    <Text style={styles.metaLabel}>Priority</Text>
                                                    <View style={[styles.badge, { backgroundColor: getPriorityColor(ticket?.severity_name).bg }]}>
                                                        <Text style={[styles.badgeText, { color: getPriorityColor(ticket?.severity_name).text }]}>{ticket?.severity_name?.split(' ')[0]}</Text>
                                                    </View>
                                                </View>
                                                <View>
                                                    <Text style={styles.metaLabel}>Status</Text>
                                                    <View style={[styles.badge, { backgroundColor: getStatusColor(ticket?.ticket_status).bg }]}>
                                                        <Text style={[styles.badgeText, { color: getStatusColor(ticket?.ticket_status).text }]}>{ticket?.ticket_status_text?.replace('_', ' ')}</Text>
                                                    </View>
                                                </View>
                                            </View>
                                        </View>
                                    </View>

                                    {/* Timeline */}
                                    <Text style={styles.sectionTitle}>Timeline</Text>
                                    <View style={styles.card}>
                                        {isLoadingTimeline ? (
                                            <View style={styles.loaderContainer}>
                                                <ActivityIndicator size="small" color={COLORS?.primary || '#2563eb'} />
                                                <Text style={styles.loaderText}>Loading timeline...</Text>
                                            </View>
                                        ) : ticketComments?.timeline_details?.length > 0 ? (
                                            ticketComments.timeline_details.map((item: any, idx: number) => renderTimelineItem(item, idx))
                                        ) : (
                                            <Text style={styles.emptyText}>No timeline data available</Text>
                                        )}
                                    </View>

                                    {/* Description */}
                                    <Text style={styles.sectionTitle}>Issue Description</Text>
                                    <View style={[styles.card, { backgroundColor: '#f9fafb' }]}>
                                        {isLoadingTimeline ? (
                                            <View style={styles.loaderContainer}>
                                                <ActivityIndicator size="small" color={COLORS?.primary || '#2563eb'} />
                                                <Text style={styles.loaderText}>Loading description...</Text>
                                            </View>
                                        ) : ticket?.issue_desc ? (
                                            <Text style={styles.descriptionText}>{ticket?.issue_desc}</Text>
                                        ) : (
                                            <Text style={styles.emptyText}>No description available</Text>
                                        )}
                                    </View>

                                    {/* Field Engineer Verification Section */}
                                    {ticket?.ticket_status > '220' && (
                                        <View style={{ marginTop: 16 }}>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 }}>
                                                <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>Field Engineer Verification</Text>
                                            </View>

                                            {(!ticketComments?.ticket_comments || ticketComments?.ticket_comments.length === 0) ? (
                                                <View style={[styles.card, { backgroundColor: '#fefce8', borderStyle: 'dashed', borderColor: '#eab308' }]}>
                                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                                        <AlertTriangle size={16} color="#854d0e" />
                                                        <Text style={{ color: '#854d0e', fontWeight: 'bold' }}>Physical verification pending</Text>
                                                    </View>
                                                    <Text style={{ color: '#a16207', fontSize: 13 }}>Ticket creator must physically verify the resolution before final closure.</Text>
                                                </View>
                                            ) : (
                                                ticketComments?.ticket_comments?.map((item: any, index: number) => (
                                                    <View key={index} style={[styles.card, { backgroundColor: '#fff', marginBottom: 16, borderLeftWidth: 4, borderLeftColor: '#10b981' }]}>
                                                        {/* Header Row */}
                                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6', paddingBottom: 8 }}>
                                                            <View style={{ backgroundColor: '#f0fdf4', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 }}>
                                                                <Text style={{ color: '#166534', fontWeight: '700', fontSize: 12 }}>VERIFICATION #{index + 1}</Text>
                                                            </View>
                                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                                                <Clock size={12} color="#6b7280" />
                                                                <Text style={{ color: '#6b7280', fontSize: 11 }}>{item.document_capture_time || item.document_create_on || item.inprogress_date}</Text>
                                                            </View>
                                                        </View>

                                                        {/* Engineer Info */}
                                                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 }}>
                                                            <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center' }}>
                                                                <User size={14} color="#6b7280" />
                                                            </View>
                                                            <Text style={{ color: '#374151', fontSize: 14, fontWeight: '600' }}>{item.enginner_name || item.document_captuer_enginner_name || 'Field Engineer'}</Text>
                                                        </View>

                                                        {/* Remarks */}
                                                        <View style={{ backgroundColor: '#f9fafb', padding: 10, borderRadius: 8, marginBottom: 14 }}>
                                                            <Text style={{ color: '#4b5563', fontSize: 13, lineHeight: 18 }}>
                                                                {item.physical_verification_remarks || 'No remarks provided.'}
                                                            </Text>
                                                        </View>

                                                        {/* Action Buttons Row */}
                                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                                            {item.document_path ? (
                                                                <TouchableOpacity
                                                                    style={[
                                                                        styles.evidenceButton,
                                                                        { flex: 1, marginTop: 0, height: 44, borderRadius: 8 },
                                                                        loadingEvidenceFilename === item.document_path && { opacity: 0.8, backgroundColor: '#3b82f6' }
                                                                    ]}
                                                                    onPress={() => getEngineerEvidenceImage(item.document_path)}
                                                                    disabled={loadingEvidenceFilename === item.document_path}
                                                                >
                                                                    {loadingEvidenceFilename === item.document_path ? (
                                                                        <ActivityIndicator size="small" color="#fff" />
                                                                    ) : (
                                                                        <Camera size={16} color="#fff" />
                                                                    )}
                                                                    <Text style={[styles.evidenceButtonText, { fontSize: 14, marginLeft: 8 }]}>
                                                                        {loadingEvidenceFilename === item.document_path ? 'Please wait...' : 'View Evidence'}
                                                                    </Text>
                                                                </TouchableOpacity>
                                                            ) : (
                                                                <View style={{ flex: 1, height: 44, borderRadius: 8, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6 }}>
                                                                    <Camera size={14} color="#9ca3af" />
                                                                    <Text style={{ color: '#9ca3af', fontSize: 13 }}>No Image</Text>
                                                                </View>
                                                            )}

                                                            {item.latitude && item.longitude && (
                                                                <TouchableOpacity
                                                                    style={{
                                                                        width: 44,
                                                                        height: 44,
                                                                        backgroundColor: '#fff',
                                                                        borderRadius: 8,
                                                                        justifyContent: 'center',
                                                                        alignItems: 'center',
                                                                        borderWidth: 1,
                                                                        borderColor: '#10b981'
                                                                    }}
                                                                    onPress={() => openMap(String(item.latitude), String(item.longitude))}
                                                                >
                                                                    <MapPin size={22} color="#10b981" />
                                                                </TouchableOpacity>
                                                            )}
                                                        </View>
                                                    </View>
                                                ))
                                            )}
                                        </View>
                                    )}

                                    {/* Final Closure Remarks */}
                                    {ticketComments?.final_closure_remarks && (
                                        <View>
                                            <Text style={styles.sectionTitle}>Final Closure Remarks</Text>
                                            <View style={[styles.card, { backgroundColor: '#f9fafb' }]}>
                                                <Text style={styles.descriptionText}>{ticketComments?.final_closure_remarks}</Text>
                                                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                                                    <Text style={styles.metaLabel}>Satisfaction Rating: </Text>
                                                    <View style={{ flexDirection: 'row' }}>
                                                        {[1, 2, 3, 4, 5].map((star) => (
                                                            <Text key={star} style={{ fontSize: 16, color: star <= (ticketComments?.satisfaction_rating || 0) ? '#EAB308' : '#D1D5DB' }}>★</Text>
                                                        ))}
                                                    </View>
                                                    <Text style={{ marginLeft: 4, color: COLORS.textSecondary }}>({ticketComments?.satisfaction_rating || 0}/5)</Text>
                                                </View>
                                            </View>
                                        </View>
                                    )}

                                </ScrollView>
                            )}
                            {activeTab === 'chat' && <ChatInterface />}
                            {activeTab === 'engineer' && (
                                <ScrollView
                                    style={styles.tabContent}
                                    contentContainerStyle={{ flexGrow: 1, paddingBottom: 60 }}
                                >
                                    <Text style={styles.sectionTitle}>Engineer Assignment</Text>
                                    {availableEngineers?.length === 0 ? (
                                        <View style={styles.emptyState}>
                                            <Text style={{ color: COLORS.textSecondary }}>No available engineers for {ticket.vendor_name || 'Vendor'}</Text>
                                        </View>
                                    ) : (
                                        <View>
                                            {availableEngineers?.map((engineer) => (
                                                <TouchableOpacity
                                                    key={engineer.field_enginner_id}
                                                    style={[styles.engineerCard, selectedEngineerId == engineer.field_enginner_id && styles.engineerCardSelected]}
                                                    onPress={() => setSelectedEngineerId(engineer.field_enginner_id)}
                                                >
                                                    <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                                                        <View style={styles.radioOuter}>
                                                            {selectedEngineerId == engineer.field_enginner_id && <View style={styles.radioInner} />}
                                                        </View>
                                                        <View style={{ flex: 1, marginLeft: 12 }}>
                                                            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                                                <Text style={styles.engineerName}>{engineer.field_enginner_fullname}</Text>
                                                                <Text style={styles.engineerVendor}>{engineer.vendor_name}</Text>
                                                            </View>

                                                            <View style={styles.engineerMetaRow}>
                                                                <Text style={styles.engineerMeta}>Unit: {engineer.unit_name}</Text>
                                                                <Text style={styles.engineerMeta}>Zone: {engineer.zone_name}</Text>
                                                            </View>

                                                            <View style={styles.engineerContactRow}>
                                                                <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 12 }}>
                                                                    <Phone size={12} color={COLORS.textSecondary} />
                                                                    <Text style={styles.contactText}>{engineer.phone_number}</Text>
                                                                </View>
                                                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                                    <Mail size={12} color={COLORS.textSecondary} />
                                                                    <Text style={styles.contactText}>{engineer.email}</Text>
                                                                </View>
                                                            </View>

                                                            <Text style={[styles.engineerMeta, { marginTop: 4 }]}>
                                                                Load: {engineer.total_active_ticket}/{engineer.total_assigned_ticket}
                                                            </Text>
                                                        </View>
                                                    </View>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    )}

                                    <TouchableOpacity
                                        style={[styles.primaryButton, { marginTop: 16 }, !selectedEngineerId && styles.buttonDisabled]}
                                        onPress={handleAssignEngineer}
                                        disabled={!selectedEngineerId}
                                    >
                                        <Text style={styles.buttonText}>Assign Engineer</Text>
                                    </TouchableOpacity>
                                    <View style={{ height: 40 }} />
                                </ScrollView>
                            )}
                            {activeTab === 'status' && (
                                <ScrollView
                                    style={styles.tabContent}
                                    contentContainerStyle={{ flexGrow: 1, paddingBottom: 60 }}
                                    showsVerticalScrollIndicator={false}>
                                    <Text style={styles.sectionTitle}>Status Management</Text>
                                    {/* Logic simplified from original code for brevity but keeping structure */}
                                    {(user?.user_type_id == '10' && ticket?.ticket_status == '240' && ticket?.ticket_created_user_id == user?.user_id) ||
                                        (user?.user_type_id == '20' && (ticket?.ticket_status == '210' || ticket?.ticket_status == '230')) ||
                                        (user?.user_type_id == '30' && ticket?.ticket_status == '220') ||
                                        (user?.user_type_id == '40' && ticket?.ticket_status == '230') ? (
                                        <View>
                                            <View style={[styles.card, { backgroundColor: '#f9fafb' }]}>
                                                <Text style={styles.infoTitle}>{ticket.cctv_name}</Text>
                                                <Text style={styles.infoText}>{ticket.incident_category_name}</Text>
                                                <View style={[styles.badge, { backgroundColor: getStatusColor(ticket.ticket_status).bg, alignSelf: 'flex-start', marginTop: 8 }]}>
                                                    <Text style={[styles.badgeText, { color: getStatusColor(ticket.ticket_status).text }]}>{ticket.ticket_status_text}</Text>
                                                </View>
                                            </View>

                                            {/* Physical Verification Checkbox for User 10 */}
                                            {user?.user_type_id == '10' && ticket?.ticket_status == '240' && (
                                                <View style={[styles.card, { backgroundColor: '#eff6ff', borderColor: '#bfdbfe', borderWidth: 1 }]}>
                                                    <View style={{ flexDirection: 'row' }}>
                                                        <AlertTriangle size={20} color="#2563eb" />
                                                        <View style={{ flex: 1, marginLeft: 10 }}>
                                                            <Text style={{ color: '#1e3a8a', fontWeight: 'bold' }}>Physical Verification Required</Text>
                                                            <Text style={{ color: '#1e40af', marginTop: 4, fontSize: 12 }}>You must physically verify the resolution.</Text>

                                                            <TouchableOpacity
                                                                style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12 }}
                                                                onPress={() => setIsPhysicallyVerified(!isPhysicallyVerified)}
                                                            >
                                                                <View style={[styles.checkbox, isPhysicallyVerified && styles.checkboxChecked]}>
                                                                    {isPhysicallyVerified && <Check size={14} color="#fff" />}
                                                                </View>
                                                                <Text style={{ marginLeft: 8, color: '#1e3a8a', fontWeight: '600' }}>I have physically verified</Text>
                                                            </TouchableOpacity>
                                                        </View>
                                                    </View>
                                                </View>
                                            )}

                                            {/* Status Selection Dropdown */}
                                            <View style={{ marginBottom: 16 }}>


                                                {/* Status Modal */}
                                                <Modal visible={isStatusModalVisible} transparent animationType="slide">
                                                    <View style={styles.modalOverlay}>
                                                        <View style={styles.modalContent}>
                                                            <View style={styles.modalHeader}>
                                                                <Text style={styles.modalTitle}>Select New Status</Text>
                                                                <TouchableOpacity onPress={() => setIsStatusModalVisible(false)}>
                                                                    <X size={24} color={COLORS.text} />
                                                                </TouchableOpacity>
                                                            </View>
                                                            <ScrollView>
                                                                {statusOptions.map((status) => (
                                                                    <TouchableOpacity
                                                                        key={status.status_id}
                                                                        style={[
                                                                            styles.optionItem,
                                                                            selectedStatusId == status.status_id && styles.selectedOption
                                                                        ]}
                                                                        onPress={() => {
                                                                            setSelectedStatusId(status.status_id);
                                                                            setIsStatusModalVisible(false);
                                                                        }}
                                                                    >
                                                                        <Text style={[
                                                                            styles.optionText,
                                                                            selectedStatusId == status.status_id && styles.selectedOptionText
                                                                        ]}>
                                                                            {status.status_name}
                                                                        </Text>
                                                                    </TouchableOpacity>
                                                                ))}
                                                            </ScrollView>
                                                        </View>
                                                    </View>
                                                </Modal>
                                            </View>

                                            {/* Location Fields - Captured from photo */}
                                            <View style={styles.locationContainer}>
                                                <Text style={styles.sectionLabel}>GPS Location (Captured from Photo)</Text>
                                                <View style={styles.locationRow}>
                                                    <View style={styles.locationField}>
                                                        <Text style={styles.inputLabel}>Latitude</Text>
                                                        <View style={{ position: 'relative', justifyContent: 'center' }}>
                                                            <TextInput
                                                                style={[styles.input, styles.disabledInput]}
                                                                value={isCapturingImage ? 'Fetching...' : currentLocation.latitude}
                                                                editable={false}
                                                                placeholder="latitude"
                                                                placeholderTextColor="#9ca3af"
                                                            />
                                                            {isCapturingImage && (
                                                                <ActivityIndicator
                                                                    size="small"
                                                                    color={COLORS.primary}
                                                                    style={{ position: 'absolute', right: 10 }}
                                                                />
                                                            )}
                                                        </View>
                                                    </View>
                                                    <View style={styles.locationField}>
                                                        <Text style={styles.inputLabel}>Longitude</Text>
                                                        <View style={{ position: 'relative', justifyContent: 'center' }}>
                                                            <TextInput
                                                                style={[styles.input, styles.disabledInput]}
                                                                value={isCapturingImage ? 'Fetching...' : currentLocation.longitude}
                                                                editable={false}
                                                                placeholder="longitude"
                                                                placeholderTextColor="#9ca3af"
                                                            />
                                                            {isCapturingImage && (
                                                                <ActivityIndicator
                                                                    size="small"
                                                                    color={COLORS.primary}
                                                                    style={{ position: 'absolute', right: 10 }}
                                                                />
                                                            )}
                                                        </View>
                                                    </View>
                                                </View>
                                            </View>

                                            {/* Image Capture */}
                                            <View style={styles.imageCaptureContainer}>
                                                <Text style={styles.sectionLabel}>Capture Image</Text>
                                                <View style={styles.imageActions}>
                                                    <TouchableOpacity
                                                        style={[styles.captureButton, isCapturingImage && styles.buttonDisabled]}
                                                        onPress={handleCaptureImage}
                                                        disabled={isCapturingImage}
                                                    >
                                                        {isCapturingImage ? (
                                                            <ActivityIndicator size="small" color="#fff" />
                                                        ) : (
                                                            <>
                                                                <Camera size={20} color="#fff" />
                                                                <Text style={styles.captureButtonText}>
                                                                    {capturedImage ? 'Retake Photo' : 'Take Photo'}
                                                                </Text>
                                                            </>
                                                        )}
                                                    </TouchableOpacity>

                                                    {capturedImage && !isCapturingImage && (
                                                        <TouchableOpacity
                                                            style={styles.viewImageButton}
                                                            onPress={() => setShowCapturedImageModal(true)}
                                                        >
                                                            <Text style={styles.viewImageButtonText}>View Image</Text>
                                                        </TouchableOpacity>
                                                    )}
                                                </View>
                                                {capturedImage && (
                                                    <TouchableOpacity
                                                        style={styles.imagePreview}
                                                        onPress={() => setShowCapturedImageModal(true)}
                                                    >
                                                        <Image
                                                            source={{ uri: capturedImage }}
                                                            style={styles.thumbnailImage}
                                                            resizeMode="cover"
                                                        />
                                                    </TouchableOpacity>
                                                )}
                                            </View>

                                            {/* Resolution Category Dropdown */}
                                            <View style={{ marginBottom: 16 }}>
                                                <Text style={styles.inputLabel}>Resolution Category</Text>
                                                <TouchableOpacity
                                                    style={styles.selectButton}
                                                    onPress={() => setIsResolutionCategoryModalVisible(true)}
                                                >
                                                    <Text style={{ color: selectedResolutionCategoryId ? COLORS.text : COLORS.textSecondary }}>
                                                        {selectedResolutionCategoryName || 'Select Resolution Category'}
                                                    </Text>
                                                    <ChevronDown size={20} color={COLORS.textSecondary} />
                                                </TouchableOpacity>

                                                {/* Resolution Category Modal */}
                                                <Modal visible={isResolutionCategoryModalVisible} transparent animationType="slide">
                                                    <View style={styles.modalOverlay}>
                                                        <View style={styles.modalContent}>
                                                            <View style={styles.modalHeader}>
                                                                <Text style={styles.modalTitle}>Select Resolution Category</Text>
                                                                <TouchableOpacity onPress={() => setIsResolutionCategoryModalVisible(false)}>
                                                                    <X size={24} color={COLORS.text} />
                                                                </TouchableOpacity>
                                                            </View>

                                                            {isLoadingResolutionCategories ? (
                                                                <View style={{ padding: 20, alignItems: 'center' }}>
                                                                    <ActivityIndicator size="large" color={COLORS.primary} />
                                                                    <Text style={{ marginTop: 10, color: COLORS.textSecondary }}>Loading categories...</Text>
                                                                </View>
                                                            ) : (
                                                                <ScrollView>
                                                                    {resolutionCategories.map((category) => (
                                                                        <TouchableOpacity
                                                                            key={category.resolution_category_id}
                                                                            style={[
                                                                                styles.optionItem,
                                                                                selectedResolutionCategoryId == category.resolution_category_id && styles.selectedOption
                                                                            ]}
                                                                            onPress={() => {
                                                                                setSelectedResolutionCategoryId(category.resolution_category_id);
                                                                                setSelectedResolutionCategoryName(category.resolution_category_text);
                                                                                setIsResolutionCategoryModalVisible(false);

                                                                                // Reset sub-category selection first
                                                                                setSelectedSubResolutionCategoryId('');
                                                                                setSelectedSubResolutionCategoryName('');
                                                                                setStatusComments('');

                                                                                // Fetch sub-categories only if NOT 'Others'
                                                                                if (category.resolution_category_text === 'Others') {
                                                                                    setSubResolutionCategories([]);
                                                                                } else {
                                                                                    getSubResolutionCategories(category.resolution_category_id);
                                                                                }
                                                                            }}
                                                                        >
                                                                            <Text style={[
                                                                                styles.optionText,
                                                                                selectedResolutionCategoryId == category.resolution_category_id && styles.selectedOptionText
                                                                            ]}>
                                                                                {category.resolution_category_text}
                                                                            </Text>
                                                                        </TouchableOpacity>
                                                                    ))}
                                                                </ScrollView>
                                                            )}
                                                        </View>
                                                    </View>
                                                </Modal>
                                            </View>

                                            {/* Sub-Resolution Category Dropdown */}
                                            <View style={{ marginBottom: 16 }}>
                                                <Text style={styles.inputLabel}>Sub Resolution Category</Text>
                                                <TouchableOpacity
                                                    style={[
                                                        styles.selectButton,
                                                        (!selectedResolutionCategoryId || selectedResolutionCategoryName === 'Others') && { opacity: 0.5, backgroundColor: '#F3F4F6' }
                                                    ]}
                                                    onPress={() => setIsSubResolutionCategoryModalVisible(true)}
                                                    disabled={!selectedResolutionCategoryId || isLoadingSubResolutionCategories || selectedResolutionCategoryName === 'Others'}
                                                >
                                                    {isLoadingSubResolutionCategories ? (
                                                        <ActivityIndicator size="small" color={COLORS.primary} />
                                                    ) : (
                                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                                                            <Text style={{ color: selectedSubResolutionCategoryId ? COLORS.text : COLORS.textSecondary }}>
                                                                {selectedSubResolutionCategoryName || 'Select Sub Category'}
                                                            </Text>
                                                            <ChevronDown size={20} color={COLORS.textSecondary} />
                                                        </View>
                                                    )}
                                                </TouchableOpacity>

                                                <Modal visible={isSubResolutionCategoryModalVisible} transparent animationType="slide">
                                                    <View style={styles.modalOverlay}>
                                                        <View style={styles.modalContent}>
                                                            <View style={styles.modalHeader}>
                                                                <Text style={styles.modalTitle}>Select Sub Category</Text>
                                                                <TouchableOpacity onPress={() => setIsSubResolutionCategoryModalVisible(false)}>
                                                                    <X size={24} color={COLORS.text} />
                                                                </TouchableOpacity>
                                                            </View>

                                                            {subResolutionCategories.length > 0 ? (
                                                                <ScrollView>
                                                                    {subResolutionCategories.map((sub) => (
                                                                        <TouchableOpacity
                                                                            key={sub.resolution_sub_category_id}
                                                                            style={[
                                                                                styles.optionItem,
                                                                                selectedSubResolutionCategoryId == sub.resolution_sub_category_id && styles.selectedOption
                                                                            ]}
                                                                            onPress={() => {
                                                                                setSelectedSubResolutionCategoryId(sub.resolution_sub_category_id);
                                                                                setSelectedSubResolutionCategoryName(sub.resolution_sub_category_text);
                                                                                setStatusComments(sub.resolution_sub_category_text);
                                                                                setIsSubResolutionCategoryModalVisible(false);
                                                                            }}
                                                                        >
                                                                            <Text style={[
                                                                                styles.optionText,
                                                                                selectedSubResolutionCategoryId == sub.resolution_sub_category_id && styles.selectedOptionText
                                                                            ]}>
                                                                                {sub.resolution_sub_category_text}
                                                                            </Text>
                                                                        </TouchableOpacity>
                                                                    ))}
                                                                </ScrollView>
                                                            ) : (
                                                                <View style={{ padding: 20, alignItems: 'center' }}>
                                                                    <Text style={{ color: COLORS.textSecondary }}>No sub-categories available</Text>
                                                                </View>
                                                            )}
                                                        </View>
                                                    </View>
                                                </Modal>
                                            </View>

                                            {/* Conditionally render comments only for 'Others' */}
                                            {(selectedResolutionCategoryName === 'Others' || (selectedResolutionCategoryName && selectedSubResolutionCategoryId)) && (
                                                <>
                                                    <Text style={styles.inputLabel}>
                                                        {user?.user_type_id == '10' && ticket?.ticket_status == '240' ? 'Final Closure Comments *' : 'Resolution Comments *'}
                                                    </Text>
                                                    <TextInput
                                                        style={[styles.textArea, selectedResolutionCategoryName !== 'Others' && { backgroundColor: '#F3F4F6' }]}
                                                        multiline
                                                        numberOfLines={4}
                                                        placeholder={selectedResolutionCategoryName === 'Others' ? "Enter comments..." : ""}
                                                        value={statusComments}
                                                        onChangeText={setStatusComments}
                                                        editable={selectedResolutionCategoryName === 'Others'}
                                                    />
                                                </>
                                            )}

                                            {/* Rating for User 10 */}
                                            {user?.user_type_id == '10' && ticket?.ticket_status == '240' && (
                                                <View style={{ marginTop: 16 }}>
                                                    <Text style={styles.inputLabel}>Rate Resolution Quality</Text>
                                                    <View style={{ flexDirection: 'row', gap: 10 }}>
                                                        {[1, 2, 3, 4, 5].map(r => (
                                                            <TouchableOpacity key={r} onPress={() => setTicketRating(r)}>
                                                                <Star size={32} color={r <= ticketRating ? '#EAB308' : '#D1D5DB'} fill={r <= ticketRating ? '#EAB308' : 'none'} />
                                                            </TouchableOpacity>
                                                        ))}
                                                    </View>
                                                </View>
                                            )}

                                            <View style={{ flexDirection: 'row', gap: 10, marginTop: 24 }}>
                                                <TouchableOpacity style={styles.secondaryButton} onPress={onClose}>
                                                    <Text style={styles.buttonTextSecondary}>Cancel</Text>
                                                </TouchableOpacity>
                                                <TouchableOpacity
                                                    style={[
                                                        styles.primaryButton,
                                                        { flex: 1 },
                                                        ((user?.user_type_id == '10')
                                                            ? (!isPhysicallyVerified || (selectedResolutionCategoryName === 'Others' && !statusComments.trim()))
                                                            : ((selectedResolutionCategoryName === 'Others' && !statusComments.trim()) ||
                                                                (!selectedResolutionCategoryId && ![20].includes(Number(user?.user_type_id))))
                                                        ) && styles.buttonDisabled
                                                    ]}
                                                    onPress={handleResolveTicket}
                                                    disabled={
                                                        (user?.user_type_id == '10')
                                                            ? (!isPhysicallyVerified || (selectedResolutionCategoryName === 'Others' && !statusComments.trim()))
                                                            : ((selectedResolutionCategoryName === 'Others' && !statusComments.trim()) ||
                                                                (!selectedResolutionCategoryId && ![20].includes(Number(user?.user_type_id))))
                                                    }
                                                >
                                                    <Text style={styles.buttonText}>
                                                        {user?.user_type_id == '10' && ticket?.ticket_status == '240' ? 'Close Ticket' : 'Submit'}
                                                    </Text>
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    ) : (
                                        <View style={styles.lockedState}>
                                            <Clock size={40} color={COLORS.textSecondary} />
                                            <Text style={{ color: COLORS.textSecondary, marginTop: 10 }}>
                                                Status management is not available for this ticket state.
                                            </Text>
                                        </View>
                                    )}
                                    {/* <View style={{ height: 40 }} /> */}
                                </ScrollView>
                            )}
                        </View>
                    </KeyboardAvoidingView>
                </View>
            </View>

            {/* Final Closure Modal */}
            {showFinalClosure && (
                <FinalClosureModal
                    ticket={ticket}
                    onClose={() => setShowFinalClosure(false)}
                    onFinalClosure={handleFinalClosure}
                />
            )}

            {/* Full Screen Loading Modal */}
            <Modal
                transparent={true}
                animationType="fade"
                visible={isSubmitting}
                onRequestClose={() => { }} // Empty function prevents closing by back button
            >
                <View style={styles.loaderOverlay}>
                    <View style={styles.loaderBox}>
                        <ActivityIndicator size="large" color={COLORS.primary || '#2563eb'} />
                        <Text style={styles.loaderTextMain}>Processing...</Text>
                        <Text style={styles.loaderTextSub}>Please wait while we update the ticket.</Text>
                    </View>
                </View>
            </Modal>

            {/* Image Preview Modals */}
            <Modal visible={showImageModal} transparent animationType="fade" onRequestClose={() => setShowImageModal(false)}>
                <View style={styles.imageModalOverlay}>
                    <TouchableOpacity style={styles.imageModalClose} onPress={() => setShowImageModal(false)}>
                        <X size={30} color="#fff" />
                    </TouchableOpacity>
                    {evidenceImage ? (
                        <Image
                            source={{ uri: evidenceImage.startsWith('data:') ? evidenceImage : `data:image/jpeg;base64,${evidenceImage}` }}
                            style={styles.fullImage}
                            resizeMode="contain"
                        />
                    ) : (
                        <Text style={{ color: '#fff' }}>Failed to load image</Text>
                    )}
                </View>
            </Modal>

            <Modal visible={showCapturedImageModal} transparent animationType="fade" onRequestClose={() => setShowCapturedImageModal(false)}>
                <View style={styles.imageModalOverlay}>
                    <TouchableOpacity style={styles.imageModalClose} onPress={() => setShowCapturedImageModal(false)}>
                        <X size={30} color="#fff" />
                    </TouchableOpacity>
                    {capturedImage ? (
                        <Image
                            source={{ uri: capturedImage }}
                            style={styles.fullImage}
                            resizeMode="contain"
                        />
                    ) : (
                        <Text style={{ color: '#fff' }}>No image captured</Text>
                    )}
                </View>
            </Modal>

            {/* Custom Dialog / Alert */}
            <CustomAlert
                visible={alertConfig.visible}
                title={alertConfig.title}
                message={alertConfig.message}
                type={alertConfig.type}
                confirmText={alertConfig.confirmText}
                cancelText={alertConfig.cancelText}
                onConfirm={alertConfig.onConfirm}
                onClose={() => {
                    setAlertConfig({ ...alertConfig, visible: false, onConfirm: undefined });
                    if (alertConfig.shouldCloseParent) {
                        onUpdate();
                        onClose();
                    }
                }}
            />

            {/* Camera Modal */}
            {/* {showCamera && (
                <Modal visible={true} animationType="slide" statusBarTranslucent>
                    <CameraCapture
                        onCapture={handleCameraCapture}
                        onClose={() => setShowCamera(false)}
                    />
                </Modal>
            )} */}
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    container: {
        backgroundColor: COLORS?.surface || '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        height: '92%',
        padding: 20,
        paddingBottom: 0,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS?.text || '#000',
    },
    subtitle: {
        fontSize: 14,
        color: COLORS?.textSecondary || '#666',
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    },
    selectButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#f9fafb',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 8,
        padding: 12,
        height: 50,
    },
    selectButtonText: {
        fontSize: 16,
        color: COLORS?.text || '#000',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '70%',
        padding: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS?.text || '#000',
    },
    optionItem: {
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    selectedOption: {
        backgroundColor: '#f0f9ff',
    },
    optionText: {
        fontSize: 16,
        color: COLORS?.text || '#000',
    },
    selectedOptionText: {
        color: COLORS?.primary || '#2563eb',
        fontWeight: 'bold',
    },
    successButton: {
        backgroundColor: COLORS?.success || '#22c55e',
        borderRadius: 8,
        padding: 8,
    },
    closeButton: {
        padding: 4,
    },
    navContainer: {
        borderBottomWidth: 1,
        borderBottomColor: COLORS?.border || '#ccc',
        marginBottom: 16,
        flexDirection: 'row',
    },
    navTab: {
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    navTabActive: {
        borderBottomColor: COLORS?.primary || '#2563eb',
    },
    navText: {
        fontSize: 14,
        color: COLORS?.textSecondary || '#666',
        fontWeight: '600',
    },
    navTextActive: {
        color: COLORS?.primary || '#2563eb',
    },
    content: {
        flex: 1,
    },
    tabContent: {
        flex: 1,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS?.text || '#000',
        marginTop: 16,
        marginBottom: 8,
    },
    card: {
        backgroundColor: COLORS?.background || '#f1f5f9',
        borderRadius: 12,
        padding: 12,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: COLORS?.border || '#ccc',
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    infoTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS?.text || '#000',
    },
    infoText: {
        fontSize: 14,
        color: COLORS?.text || '#000',
        marginTop: 2,
    },
    infoSubText: {
        fontSize: 12,
        color: COLORS?.textSecondary || '#666',
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
        marginTop: 2,
    },
    evidenceButton: {
        flexDirection: 'row',
        backgroundColor: '#6366f1', // Indigo
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 6,
        alignItems: 'center',
        marginTop: 8,
        alignSelf: 'flex-start',
        gap: 6
    },
    evidenceButtonText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    divider: {
        height: 1,
        backgroundColor: COLORS?.border || '#ccc',
        marginVertical: 12,
    },
    metaRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    metaLabel: {
        fontSize: 12,
        color: COLORS?.textSecondary || '#666',
        fontWeight: '600',
    },
    metaValue: {
        fontSize: 14,
        color: COLORS?.text || '#000',
        marginTop: 2,
        textTransform: 'capitalize',
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
        marginTop: 2,
    },
    badgeText: {
        fontSize: 10,
        fontWeight: '700',
        textTransform: 'capitalize',
    },
    timelineItem: {
        flexDirection: 'row',
        minHeight: 70,
    },
    timelineLeftColumn: {
        alignItems: 'center',
        width: 30,
    },
    timelineIconWrapper: {
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1,
    },
    timelineLine: {
        flex: 1,
        width: 2,
        backgroundColor: '#e2e8f0',
        marginVertical: 4,
    },
    timelineRightColumn: {
        flex: 1,
        paddingLeft: 12,
        paddingBottom: 20,
    },
    timelineHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    timelineStatus: {
        fontSize: 15,
        fontWeight: '700',
    },
    timelineDate: {
        fontSize: 11,
        color: COLORS?.textSecondary || '#64748b',
    },
    timelineUser: {
        fontSize: 12,
        color: COLORS?.textSecondary || '#64748b',
        marginBottom: 8,
        flexDirection: 'row',
        alignItems: 'center',
    },
    timelineRemarksContainer: {
        flexDirection: 'row',
        backgroundColor: '#f8fafc',
        padding: 10,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        gap: 8,
    },
    timelineRemarksText: {
        fontSize: 13,
        color: COLORS?.text || '#1e293b',
        flex: 1,
        lineHeight: 18,
    },
    descriptionText: {
        color: COLORS?.text || '#000',
        lineHeight: 20,
    },
    // Engineer Tab
    emptyState: {
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    engineerCard: {
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS?.border || '#ccc',
        marginBottom: 8,
        backgroundColor: COLORS?.surface || '#fff',
    },
    engineerCardSelected: {
        borderColor: COLORS?.primary || '#2563eb',
        backgroundColor: '#eff6ff',
    },
    radioOuter: {
        width: 18,
        height: 18,
        borderRadius: 9,
        borderWidth: 2,
        borderColor: COLORS.textSecondary,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 2,
    },
    radioInner: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: COLORS?.primary || '#2563eb',
    },
    engineerName: {
        fontWeight: '600',
        color: COLORS?.text || '#000',
    },
    engineerVendor: {
        fontSize: 12,
        color: COLORS?.textSecondary || '#666',
    },
    engineerMetaRow: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 4,
    },
    engineerMeta: {
        fontSize: 12,
        color: COLORS?.textSecondary || '#666',
    },
    engineerContactRow: {
        marginTop: 4,
        flexDirection: 'row',
    },
    contactText: {
        fontSize: 12,
        color: COLORS?.textSecondary || '#666',
        marginLeft: 4,
    },
    primaryButton: {
        backgroundColor: COLORS?.primary || '#2563eb',
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 16,
    },
    buttonDisabled: {
        opacity: 0.5,
    },
    // Status Tab
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS?.text || '#000',
        marginTop: 12,
        marginBottom: 8,
    },
    textArea: {
        borderWidth: 1,
        borderColor: COLORS?.border || '#ccc',
        borderRadius: 8,
        padding: 12,
        height: 100,
        textAlignVertical: 'top',
        color: COLORS?.text || '#000',
        backgroundColor: COLORS?.background || '#f1f5f9',
    },
    checkbox: {
        width: 20,
        height: 20,
        borderRadius: 4,
        borderWidth: 2,
        borderColor: COLORS.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkboxChecked: {
        backgroundColor: COLORS?.primary || '#2563eb',
    },
    lockedState: {
        alignItems: 'center',
        padding: 20,
    },
    secondaryButton: {
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 8,
        backgroundColor: COLORS?.background || '#f1f5f9',
        borderWidth: 1,
        borderColor: COLORS?.border || '#ccc',
    },
    buttonTextSecondary: {
        color: COLORS?.text || '#000',
        fontWeight: '600',
        fontSize: 16,
    },
    imageModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.9)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    imageModalClose: {
        position: 'absolute',
        top: 40,
        right: 20,
        zIndex: 1,
    },
    fullImage: {
        width: '100%',
        height: '80%',
    },
    // New Styles for Location and Image Capture
    locationContainer: {
        marginTop: 16,
        padding: 12,
        backgroundColor: '#f8fafc',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    sectionLabel: {
        fontSize: 14,
        fontWeight: '700',
        color: COLORS?.primary || '#2563eb',
        marginBottom: 8,
    },
    locationRow: {
        flexDirection: 'row',
        gap: 12,
    },
    locationField: {
        flex: 1,
    },
    disabledInput: {
        backgroundColor: '#f1f5f9',
        color: COLORS?.textSecondary || '#666',
        fontWeight: '600',
    },
    input: {
        borderWidth: 1,
        borderColor: COLORS?.border || '#ccc',
        borderRadius: 8,
        padding: 10,
        color: COLORS?.text || '#000',
        fontSize: 14,
        height: 44,
    },
    imageCaptureContainer: {
        marginTop: 16,
        padding: 12,
        backgroundColor: '#f8fafc',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        marginBottom: 8,
    },
    imageActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    captureButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS?.primary || '#2563eb',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 8,
        gap: 8,
        minWidth: 140,
    },
    captureButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    viewImageButton: {
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: COLORS.primary,
    },
    viewImageButtonText: {
        color: COLORS?.primary || '#2563eb',
        fontSize: 14,
        fontWeight: '600',
    },
    imagePreview: {
        marginTop: 12,
        borderRadius: 8,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: COLORS?.border || '#ccc',
        alignSelf: 'flex-start',
    },
    thumbnailImage: {
        width: 100,
        height: 100,
    },
    loaderContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 20,
        gap: 10,
    },
    loaderText: {
        fontSize: 14,
        color: COLORS?.textSecondary || '#666',
        marginLeft: 8,
    },
    emptyText: {
        fontSize: 14,
        color: COLORS?.textSecondary || '#666',
        textAlign: 'center',
        paddingVertical: 16,
        fontStyle: 'italic',
    },
    // Loader Styles
    loaderOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)', // Semi-transparent black
        justifyContent: 'center',
        alignItems: 'center',
    },
    loaderBox: {
        backgroundColor: '#fff',
        padding: 24,
        borderRadius: 16,
        alignItems: 'center',
        width: '80%',
        maxWidth: 300,
        elevation: 5, // Android shadow
        shadowColor: '#000', // iOS shadow
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    loaderTextMain: {
        marginTop: 16,
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    loaderTextSub: {
        marginTop: 8,
        fontSize: 14,
        color: COLORS.textSecondary,
        textAlign: 'center',
    },
});