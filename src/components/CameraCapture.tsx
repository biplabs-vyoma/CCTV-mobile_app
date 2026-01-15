import React, { useRef, useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, ActivityIndicator, Alert, Platform, PermissionsAndroid, Modal } from 'react-native';
import { Camera, useCameraDevice, useCameraPermission } from 'react-native-vision-camera';
import { X, Camera as CameraIcon, CheckCircle } from 'lucide-react-native';
import Geolocation from 'react-native-geolocation-service';

const COLORS = {
    primary: '#2563eb',
    text: '#000',
    textSecondary: '#666',
};

interface CameraCaptureProps {
    onCapture: (base64: string, latitude: string, longitude: string) => void;
    onClose: () => void;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onClose }) => {
    const camera = useRef<Camera>(null);
    const [isCapturing, setIsCapturing] = useState(false);

    // Try to get camera device and permissions
    let device;
    let hasPermission = false;
    let requestPermission = () => { };

    try {
        device = useCameraDevice('back');
        const permissionHook = useCameraPermission();
        hasPermission = permissionHook.hasPermission;
        requestPermission = permissionHook.requestPermission;
    } catch (error) {
        console.error('Camera module not linked:', error);
    }

    // If camera module isn't available (not rebuilt yet)
    if (!device && !hasPermission) {
        return (
            <View style={styles.permissionContainer}>
                <CameraIcon size={64} color={COLORS?.textSecondary || '#666'} />
                <Text style={styles.permissionText}>Camera Not Available</Text>
                <Text style={styles.rebuildText}>
                    The camera module requires a rebuild to work.{'\n\n'}
                    Please stop the app and run:{'\n'}
                    <Text style={{ fontWeight: 'bold' }}>npm run android</Text>
                </Text>
                <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                    <Text style={styles.cancelButtonText}>Close</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const requestLocationPermission = async () => {
        if (Platform.OS === 'android') {
            try {
                // Request both Fine and Coarse location
                const granted = await PermissionsAndroid.requestMultiple([
                    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
                    PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
                ]);

                const isFineGranted = granted[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION] === PermissionsAndroid.RESULTS.GRANTED;
                const isCoarseGranted = granted[PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION] === PermissionsAndroid.RESULTS.GRANTED;

                return isFineGranted || isCoarseGranted;
            } catch (err) {
                console.warn('Location permission error:', err);
                return false;
            }
        }
        return true;
    };

    const takePhoto = async () => {
        if (!camera.current) {
            Alert.alert('Error', 'Camera not ready');
            return;
        }

        setIsCapturing(true);
        try {
            // Request location permission first
            const hasLocationPermission = await requestLocationPermission();

            if (!hasLocationPermission) {
                Alert.alert(
                    'Location Required',
                    'GPS location is mandatory. Photo cannot be saved without location data. Please enable location permission.',
                    [{ text: 'OK' }]
                );
                setIsCapturing(false);
                return;
            }

            // Capture the photo
            const photo = await camera.current.takePhoto({
                flash: 'off',
            });

            // Processing Image
            const RNFS = require('react-native-fs');
            const base64 = await RNFS.readFile(photo.path, 'base64');
            const base64Data = `data:image/jpeg;base64,${base64}`;

            // GPS Retrieval
            // Get current GPS location (MANDATORY) with fallback strategy
            console.log('Attempting to get GPS location with high accuracy (v2)...');

            if (!Geolocation) {
                console.error('Geolocation module is NOT loaded!');
                Alert.alert('System Error', 'Geolocation provider is missing. Please restart the app.');
                setIsCapturing(false);
                return;
            }

            const getGPS = async () => {
                console.log('Step 1: Configuring Geolocation...');
                try {
                    Geolocation.setRNConfiguration({
                        skipPermissionRequests: false,
                        authorizationLevel: 'whenInUse',
                        locationProvider: 'auto',
                    });
                } catch (e) {
                    console.warn('Config failed:', e);
                }

                console.log('Step 2: Starting getCurrentPosition...');
                Geolocation.getCurrentPosition(
                    (position) => {
                        console.log('Step 3: Success! Position received:', JSON.stringify(position));
                        const { latitude, longitude } = position.coords;

                        if (latitude && longitude) {
                            // Call onCapture immediately
                            onCapture(base64Data, latitude.toString(), longitude.toString());
                            onClose();
                        } else {
                            console.error('Step 3 Error: Coordinates are null/undefined');
                            Alert.alert('GPS Error', 'Invalid coordinates received.');
                            setIsCapturing(false);
                        }
                    },
                    (error) => {
                        console.error('Step 3 Error: Position failed', error.code, error.message);
                        let msg = 'Could not get GPS. Please ensure GPS is ON and you are in an open area.';
                        if (error.code === 1) msg = 'Location permission denied.';
                        if (error.code === 2) msg = 'GPS signal not found. Please move to an open area.';
                        if (error.code === 3) msg = 'GPS request timed out.';

                        Alert.alert('GPS Required', msg);
                        setIsCapturing(false);
                    },
                    {
                        enableHighAccuracy: true,
                        timeout: 15000,
                        maximumAge: 10000,
                        forceRequestLocation: true,
                        showLocationDialog: true,
                    }
                );
            };

            getGPS();
        } catch (error: any) {
            console.error('Photo capture error:', error);
            Alert.alert('Capture Error', error?.message || 'Failed to capture photo');
            setIsCapturing(false);
        }
    };

    if (!hasPermission) {
        return (
            <View style={styles.permissionContainer}>
                <CameraIcon size={64} color={COLORS?.textSecondary || '#666'} />
                <Text style={styles.permissionText}>Camera permission required</Text>
                <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
                    <Text style={styles.permissionButtonText}>Grant Permission</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
            </View>
        );
    }

    if (!device) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS?.primary || '#2563eb'} />
                <Text style={styles.loadingText}>Loading camera...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Camera
                ref={camera}
                style={StyleSheet.absoluteFill}
                device={device}
                isActive={true}
                photo={true}
            />

            <View style={styles.topControls}>
                <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                    <X size={24} color="#fff" />
                </TouchableOpacity>
            </View>

            <View style={styles.bottomControls}>
                <TouchableOpacity
                    style={styles.captureButton}
                    onPress={takePhoto}
                    disabled={isCapturing}
                >
                    {isCapturing ? (
                        <ActivityIndicator color="#fff" size="large" />
                    ) : (
                        <View style={styles.captureInner} />
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    permissionContainer: {
        flex: 1,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    permissionText: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS?.text || '#000',
        marginTop: 20,
        marginBottom: 30,
        textAlign: 'center',
    },
    rebuildText: {
        fontSize: 14,
        color: COLORS?.textSecondary || '#666',
        marginBottom: 30,
        textAlign: 'center',
        lineHeight: 22,
        paddingHorizontal: 20,
    },
    permissionButton: {
        backgroundColor: COLORS?.primary || '#2563eb',
        paddingHorizontal: 32,
        paddingVertical: 12,
        borderRadius: 8,
        marginBottom: 12,
    },
    permissionButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    cancelButton: {
        paddingHorizontal: 32,
        paddingVertical: 12,
    },
    cancelButtonText: {
        color: COLORS?.textSecondary || '#666',
        fontSize: 16,
    },
    loadingContainer: {
        flex: 1,
        backgroundColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        color: '#fff',
        marginTop: 12,
        fontSize: 16,
    },
    topControls: {
        position: 'absolute',
        top: 40,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'flex-end',
        paddingHorizontal: 20,
    },
    closeButton: {
        padding: 12,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 25,
    },
    bottomControls: {
        position: 'absolute',
        bottom: 40,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    captureButton: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: 'rgba(255,255,255,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 4,
        borderColor: '#fff',
    },
    captureInner: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#fff',
    },
});
