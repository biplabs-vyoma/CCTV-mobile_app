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
    PermissionsAndroid
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
    ChevronDown
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
    const [alertConfig, setAlertConfig] = useState<{
        visible: boolean;
        title: string;
        message: string;
        type: 'success' | 'error' | 'warning' | 'info';
        shouldCloseParent?: boolean;
    }>({
        visible: false,
        title: '',
        message: '',
        type: 'info',
        shouldCloseParent: false
    });
    const [isLoadingTimeline, setIsLoadingTimeline] = useState(true);

    const canManageTicket = [10, 20, 30, 40, 100].includes(Number(user?.user_type_id));
    const isTicketCreator = user?.user_id == ticket.ticket_created_user_id;
    const canFinalClose = isTicketCreator && ticket?.ticket_status == '220';

    console.log("Ticket Data:", ticketComments);

    // Update loading state when ticketComments changes
    useEffect(() => {
        if (ticketComments) {
            setIsLoadingTimeline(false);
        } else {
            setIsLoadingTimeline(true);
        }
    }, [ticketComments]);

    // Mock chat session (simplified from input)
    const mockChatSession: any = {
        id: `chat_${ticket.ticket_id}`,
        // ...other properties mocked
    };
    const mockChatMessages: any[] = [];

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
            Alert.alert('Info', 'No evidence image available.');
            return;
        }

        try {
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
                Alert.alert('Error', response?.message || 'Failed to load evidence image.');
            }
        } catch (e: any) {
            console.error('Exception loading image:', e);
            console.error('Error message:', e?.message);
            console.error('Error stack:', e?.stack);
            Alert.alert('Error', 'Error loading image: ' + (e?.message || 'Unknown error'));
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

    useEffect(() => {
        if (activeTab === 'engineer') {
            getFieldEnginnerByVendor();
        }
        if (activeTab === 'status') {
            // Fetch location and statuses when status tab is opened
            getStatusOptions();
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
            // Request camera permission on Android
            if (Platform.OS === 'android') {
                const hasPermission = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.CAMERA);

                if (!hasPermission) {
                    const granted = await PermissionsAndroid.request(
                        PermissionsAndroid.PERMISSIONS.CAMERA,
                        {
                            title: 'Camera Permission',
                            message: 'App needs camera permission to capture evidence photos.',
                            buttonPositive: 'OK',
                        }
                    );

                    if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
                        toast.error('Camera permission is required');
                        return;
                    }
                }
            }

            // Validate native module
            if (typeof launchCamera !== 'function') {
                Alert.alert('Camera Error', 'Camera module not available. Please restart the app.');
                return;
            }

            // Launch camera
            const result = await launchCamera(options);

            if (result.didCancel) {
                // User cancelled - no action needed
                return;
            } else if (result.errorCode) {
                Alert.alert('Camera Error', result.errorMessage || 'Failed to open camera');
                toast.error('Camera failure: ' + (result.errorMessage || result.errorCode));
            } else if (result.assets && result.assets[0].base64) {
                const base64Data = `data:image/jpeg;base64,${result.assets[0].base64}`;
                setCapturedImage(base64Data);
                toast.success('Photo captured successfully');

                // Capture location after photo is taken
                try {
                    // Request location permission if needed
                    if (Platform.OS === 'android') {
                        const hasLocPermission = await PermissionsAndroid.check(
                            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
                        );

                        if (!hasLocPermission) {
                            const granted = await PermissionsAndroid.request(
                                PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
                                {
                                    title: 'Location Permission',
                                    message: 'App needs location permission to capture coordinates with the photo.',
                                    buttonPositive: 'OK',
                                }
                            );

                            if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
                                console.log('Location permission denied after photo capture');
                                return;
                            }
                        }
                    }

                    // Fetch location
                    Geolocation.getCurrentPosition(
                        (position) => {
                            const { latitude, longitude } = position.coords;
                            setCurrentLocation({
                                latitude: latitude.toString(),
                                longitude: longitude.toString()
                            });
                            toast.info('Location captured with photo');
                        },
                        (error) => {
                            console.log('Location fetch error after photo:', error);
                            // Don't show error toast here as photo was already captured successfully
                        },
                        {
                            enableHighAccuracy: true,
                            timeout: 10000,
                            maximumAge: 0
                        }
                    );
                } catch (locError) {
                    console.log('Location capture exception:', locError);
                    // Photo is already captured, so just log the location error
                }
            } else {
                Alert.alert('Error', 'No image data returned from camera');
            }
        } catch (error: any) {
            Alert.alert('Camera Exception', error?.message || 'Unknown error occurred');
            toast.error('Error opening camera: ' + (error?.message || 'Unknown'));
        }
    };

    const handleUpdateEngineerStatus = async () => {
        // Validation
        if (!selectedStatusId) {
            toast.error('Please select a status');
            return;
        }
        if (!statusComments.trim()) {
            toast.error('Remarks are required');
            return;
        }
        if (!capturedImage) {
            toast.error('Evidence image is required');
            return;
        }

        try {
            console.log('--- Preparing Engineer Status Update (New API) ---');

            // Clean coordinates and convert to Number (Double) for the new SP
            const cleanLongitude = Number(String(currentLocation.longitude || "0.0").replace(/[^\d.-]/g, ''));
            const cleanLatitude = Number(String(currentLocation.latitude || "0.0").replace(/[^\d.-]/g, ''));

            const payload = {
                ticket_id: Number(ticket?.ticket_id),
                status_id: Number(selectedStatusId),
                remarks: statusComments,
                evidence_file_path: capturedImage || "",
                longitude: cleanLongitude,
                latitude: cleanLatitude,
                user_id: Number(user?.user_id),
                user_type_id: Number(user?.user_type_id),
                vendor_id: Number(user?.vendor_id || 0),
            };

            console.log('Final Update Payload (Numbers for Coordinates):', payload);

            const response: any = await callAPIWithEnc(
                'vendor/enginnerUpdateStatusByTicketId',
                'POST',
                payload
            );

            console.log('Update Response:', response);

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
        // Use the new engineer status update API if user is a vendor engineer (40) or manager/admin if preferred
        const isEngineer = [30, 40].includes(Number(user?.user_type_id));

        if (isEngineer) {
            handleUpdateEngineerStatus();
            return;
        }

        // try {
        //     const response: any = await callAPIWithEnc(
        //         'vendor/updateEngineerStatusByTicketId',
        //         'POST',
        //         {
        //             ticket_id: ticket?.ticket_id,
        //             status_id: ticket?.ticket_status
        //                 ? parseInt(ticket?.ticket_status) + 10
        //                 : '',
        //             remarks: statusComments,
        //             rating_id: ticketRating || 0,
        //             user_id: user?.user_id || 0,
        //             user_type_id: user?.user_type_id || 0,
        //         }
        //     );

        //     if (response?.status == 0) {
        //         onUpdate();
        //         toast.success('Ticket has been resolved successfully');
        //         onClose();
        //     } else {
        //         toast.error(response?.message || 'Failed to resolve ticket');
        //     }
        // } catch (e) {
        //     toast.error('Error resolving ticket');
        // }
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
        let Icon = CheckCircle;
        let color = '#9ca3af'; // gray

        if (idx === 0) { Icon = Clock; color = '#9ca3af'; }
        else if (idx === 1) { Icon = Clock; color = '#60a5fa'; } // blue
        else if (idx === 2) { Icon = CheckCircle; color = '#4ade80'; } // green

        return (
            <View key={idx} style={styles.timelineItem}>
                <Icon size={16} color={color} style={{ marginTop: 2 }} />
                <View style={{ marginLeft: 8, flex: 1 }}>
                    <Text style={styles.timelineStatus}>{item?.ticket_status || '-'}</Text>
                    <Text style={styles.timelineDate}>{item?.ticket_status_on_date ? new Date(item.ticket_status_on_date).toLocaleString() : ''}</Text>
                    <Text style={styles.timelineUser}>by {item?.status_by} ({item?.status_by_user_type || '-'})</Text>
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
                    {/* Content */}
                    <View style={styles.content}>
                        {activeTab === 'details' && (
                            <ScrollView style={styles.tabContent}>
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
                                                    style={styles.evidenceButton}
                                                    onPress={getImgAsBase64ByFileName}
                                                >
                                                    <Camera size={14} color="#fff" />
                                                    <Text style={styles.evidenceButtonText}>View Evidence Image</Text>
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
                                    ) : ticketComments?.ticket_comments?.issue_desc ? (
                                        <Text style={styles.descriptionText}>{ticketComments.ticket_comments.issue_desc}</Text>
                                    ) : (
                                        <Text style={styles.emptyText}>No description available</Text>
                                    )}
                                </View>

                                {/* Physical Verification */}
                                {ticketComments?.ticket_comments?.physical_verification_remarks && (
                                    <View>
                                        <Text style={styles.sectionTitle}>Field Engineer/Technician remarks</Text>
                                        <View style={[styles.card, ticketComments?.ticket_comments?.physical_verification_remarks ? { backgroundColor: '#f0fdf4' } : { backgroundColor: '#fefce8' }]}>
                                            {ticketComments?.ticket_comments?.physical_verification_remarks ? (
                                                <>
                                                    <Text style={{ color: '#166534', fontWeight: 'bold' }}>✓ Physical verification completed</Text>
                                                    <Text style={{ color: '#15803d', marginTop: 4 }}>Remarks: {ticketComments?.ticket_comments?.physical_verification_remarks}</Text>
                                                </>
                                            ) : (
                                                <>
                                                    <Text style={{ color: '#854d0e', fontWeight: 'bold' }}>⚠ Physical verification pending</Text>
                                                    <Text style={{ color: '#a16207', marginTop: 4 }}>Ticket creator must physically verify the resolution before final closure.</Text>
                                                </>
                                            )}
                                        </View>
                                    </View>
                                )}

                                {/* Final Closure Remarks */}
                                {ticketComments?.ticket_comments?.final_closure_remarks && (
                                    <View>
                                        <Text style={styles.sectionTitle}>Final Closure Remarks</Text>
                                        <View style={[styles.card, { backgroundColor: '#f9fafb' }]}>
                                            <Text style={styles.descriptionText}>{ticketComments?.ticket_comments?.final_closure_remarks}</Text>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                                                <Text style={styles.metaLabel}>Satisfaction Rating: </Text>
                                                <View style={{ flexDirection: 'row' }}>
                                                    {[1, 2, 3, 4, 5].map((star) => (
                                                        <Text key={star} style={{ fontSize: 16, color: star <= ticketComments?.ticket_comments?.satisfaction_rating ? '#EAB308' : '#D1D5DB' }}>★</Text>
                                                    ))}
                                                </View>
                                                <Text style={{ marginLeft: 4, color: COLORS.textSecondary }}>({ticketComments?.ticket_comments?.satisfaction_rating}/5)</Text>
                                            </View>
                                        </View>
                                    </View>
                                )}
                                <View style={{ height: 40 }} />
                            </ScrollView>
                        )}
                        {activeTab === 'chat' && <ChatInterface />}
                        {activeTab === 'engineer' && (
                            <ScrollView style={styles.tabContent}>
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
                            <ScrollView style={styles.tabContent}>
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
                                            <Text style={styles.inputLabel}>Update Status *</Text>
                                            <TouchableOpacity
                                                style={styles.selectButton}
                                                onPress={() => setIsStatusModalVisible(true)}
                                            >
                                                <Text style={styles.selectButtonText}>
                                                    {statusOptions.find(s => s.status_id == selectedStatusId)?.status_name || 'Select Status'}
                                                </Text>
                                                <ChevronDown size={20} color={COLORS.textSecondary} />
                                            </TouchableOpacity>

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

                                        {/* Location Fields - Auto-fetch current location */}
                                        <View style={styles.locationContainer}>
                                            <Text style={styles.sectionLabel}>Current Location (Auto-captured)</Text>
                                            <View style={styles.locationRow}>
                                                <View style={styles.locationField}>
                                                    <Text style={styles.inputLabel}>Latitude</Text>
                                                    <TextInput
                                                        style={[styles.input, styles.disabledInput]}
                                                        value={currentLocation.latitude}
                                                        editable={false}
                                                        placeholder="Fetching..."
                                                    />
                                                </View>
                                                <View style={styles.locationField}>
                                                    <Text style={styles.inputLabel}>Longitude</Text>
                                                    <TextInput
                                                        style={[styles.input, styles.disabledInput]}
                                                        value={currentLocation.longitude}
                                                        editable={false}
                                                        placeholder="Fetching..."
                                                    />
                                                </View>
                                            </View>
                                        </View>

                                        {/* Image Capture */}
                                        <View style={styles.imageCaptureContainer}>
                                            <Text style={styles.sectionLabel}>Capture Image</Text>
                                            <View style={styles.imageActions}>
                                                <TouchableOpacity
                                                    style={styles.captureButton}
                                                    onPress={handleCaptureImage}
                                                >
                                                    <Camera size={20} color="#fff" />
                                                    <Text style={styles.captureButtonText}>
                                                        {capturedImage ? 'Retake Photo' : 'Take Photo'}
                                                    </Text>
                                                </TouchableOpacity>

                                                {capturedImage && (
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

                                        <Text style={styles.inputLabel}>
                                            {user?.user_type_id == '10' && ticket?.ticket_status == '240' ? 'Final Closure Comments *' : 'Resolution Comments *'}
                                        </Text>
                                        <TextInput
                                            style={styles.textArea}
                                            multiline
                                            numberOfLines={4}
                                            placeholder="Enter comments..."
                                            value={statusComments}
                                            onChangeText={setStatusComments}
                                        />

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
                                                    (!statusComments.trim() && user?.user_type_id == 10 && isPhysicallyVerified
                                                        ? false
                                                        : (user?.user_type_id == 10 && !isPhysicallyVerified)
                                                            ? true
                                                            : !statusComments.trim() && ![20].includes(Number(user?.user_type_id))) && styles.buttonDisabled
                                                ]}
                                                onPress={handleResolveTicket}
                                                disabled={
                                                    !statusComments.trim() && user?.user_type_id == 10 && isPhysicallyVerified
                                                        ? false
                                                        : (user?.user_type_id == 10 && !isPhysicallyVerified)
                                                            ? true
                                                            : !statusComments.trim() && ![20].includes(Number(user?.user_type_id))
                                                }
                                            >
                                                <Text style={styles.buttonText}>
                                                    {user?.user_type_id == '10' && ticket?.ticket_status == '240' ? 'Close Ticket' : 'Resolve Ticket'}
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
                                <View style={{ height: 40 }} />
                            </ScrollView>
                        )}
                    </View>
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
                onClose={() => {
                    setAlertConfig({ ...alertConfig, visible: false });
                    if (alertConfig.shouldCloseParent) {
                        onUpdate();
                        onClose();
                    }
                }}
            />
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
        marginBottom: 12,
    },
    timelineStatus: {
        fontSize: 14,
        color: COLORS?.text || '#000',
        fontWeight: '600',
    },
    timelineDate: {
        fontSize: 12,
        color: COLORS?.textSecondary || '#666',
    },
    timelineUser: {
        fontSize: 12,
        color: COLORS?.textSecondary || '#666',
        fontStyle: 'italic',
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
        backgroundColor: COLORS?.primary || '#2563eb',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 8,
        gap: 8,
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
});
