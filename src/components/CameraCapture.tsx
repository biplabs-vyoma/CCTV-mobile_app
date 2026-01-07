import React, { useRef, useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, ActivityIndicator, Alert, Platform, PermissionsAndroid } from 'react-native';
import { Camera, useCameraDevice, useCameraPermission } from 'react-native-vision-camera';
import { X, Camera as CameraIcon } from 'lucide-react-native';
import Geolocation from '@react-native-community/geolocation';

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
                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
                    {
                        title: 'Location Permission Required',
                        message: 'GPS location is required to save photos. Please enable location access.',
                        buttonNegative: 'Cancel',
                        buttonPositive: 'OK',
                    }
                );
                return granted === PermissionsAndroid.RESULTS.GRANTED;
            } catch (err) {
                console.warn('Location permission error:', err);
                return false;
            }
        }
        return true; // iOS handles permissions differently
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

            // Read file and convert to base64
            const RNFS = require('react-native-fs');
            const base64 = await RNFS.readFile(photo.path, 'base64');
            const base64Data = `data:image/jpeg;base64,${base64}`;

            // Get current GPS location (MANDATORY) with fallback strategy
            console.log('Attempting to get GPS location with high accuracy...');

            const getLocationWithFallback = () => {
                // First attempt: High accuracy with shorter timeout
                Geolocation.getCurrentPosition(
                    (position) => {
                        console.log('GPS position received (high accuracy):', position);
                        const latitude = position.coords.latitude.toString();
                        const longitude = position.coords.longitude.toString();
                        console.log('GPS captured - Lat:', latitude, 'Long:', longitude);

                        // Only save if we have valid coordinates
                        if (latitude && longitude && latitude !== '0' && longitude !== '0') {
                            console.log('Valid GPS coordinates, saving photo...');
                            onCapture(base64Data, latitude, longitude);
                            onClose();
                        } else {
                            console.error('Invalid GPS coordinates received:', latitude, longitude);
                            Alert.alert(
                                'GPS Error',
                                'Could not get valid GPS coordinates. Photo cannot be saved.',
                                [{ text: 'OK' }]
                            );
                            setIsCapturing(false);
                        }
                    },
                    (error) => {
                        console.log('High accuracy GPS failed, trying lower accuracy fallback...');
                        console.error('High accuracy error:', error.code, error.message);

                        // Fallback: Try with lower accuracy (faster)
                        Geolocation.getCurrentPosition(
                            (position) => {
                                console.log('GPS position received (lower accuracy):', position);
                                const latitude = position.coords.latitude.toString();
                                const longitude = position.coords.longitude.toString();
                                console.log('GPS captured (fallback) - Lat:', latitude, 'Long:', longitude);

                                // Only save if we have valid coordinates
                                if (latitude && longitude && latitude !== '0' && longitude !== '0') {
                                    console.log('Valid GPS coordinates from fallback, saving photo...');
                                    onCapture(base64Data, latitude, longitude);
                                    onClose();
                                } else {
                                    console.error('Invalid GPS coordinates from fallback:', latitude, longitude);
                                    Alert.alert(
                                        'GPS Error',
                                        'Could not get valid GPS coordinates. Photo cannot be saved.',
                                        [{ text: 'OK' }]
                                    );
                                    setIsCapturing(false);
                                }
                            },
                            (fallbackError) => {
                                console.error('Fallback GPS also failed');
                                console.error('GPS error code:', fallbackError.code);
                                console.error('GPS error message:', fallbackError.message);
                                console.error('GPS full error:', JSON.stringify(fallbackError));
                                setIsCapturing(false);

                                let errorMessage = 'Could not get GPS location. ';
                                if (fallbackError.code === 1) {
                                    errorMessage += 'Location permission denied.';
                                } else if (fallbackError.code === 2) {
                                    errorMessage += 'Location unavailable. Please ensure GPS is enabled.';
                                } else if (fallbackError.code === 3) {
                                    errorMessage += 'Location request timed out. Please try again in an area with better GPS signal.';
                                } else {
                                    errorMessage += fallbackError.message || 'Unknown error.';
                                }

                                // Show error - photo will NOT be saved
                                Alert.alert(
                                    'GPS Required',
                                    errorMessage + ' Photo cannot be saved without GPS data.',
                                    [{ text: 'OK' }]
                                );
                            },
                            {
                                enableHighAccuracy: false,  // Lower accuracy, faster
                                timeout: 10000,  // 10 seconds
                                maximumAge: 5000   // Can use recent cached location
                            }
                        );
                    },
                    {
                        enableHighAccuracy: true,  // Try high accuracy first
                        timeout: 8000,  // 8 seconds for first attempt
                        maximumAge: 0   // Don't use cached location for first attempt
                    }
                );
            };

            getLocationWithFallback();
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
