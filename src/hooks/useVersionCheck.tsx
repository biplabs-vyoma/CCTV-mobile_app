import { useEffect, useState } from 'react';
import { BackHandler } from 'react-native';
import DeviceInfo from 'react-native-device-info';
import { callAPIWithEnc } from '../apis/common/api';

interface VersionCheckResult {
    isChecking: boolean;
    showAlert: boolean;
    alertMessage: string;
    handleExit: () => void;
}

export const useVersionCheck = (): VersionCheckResult => {
    const [isChecking, setIsChecking] = useState(true);
    const [showAlert, setShowAlert] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');

    useEffect(() => {
        checkVersion();
    }, []);

    const checkVersion = async () => {
        try {
            console.log('=== Version Check Started ===');

            // Get current app version from device
            const currentVersion = DeviceInfo.getVersion();
            const packageName = DeviceInfo.getBundleId();

            console.log('Current Version:', currentVersion);
            console.log('Package Name:', packageName);

            // Call API to get expected version
            // Replace 'master/getAppVersion' with your actual API endpoint
            const response: any = await callAPIWithEnc('master/getAppVersion', 'POST', {
                package_name: packageName,
                version: currentVersion,
            });

            console.log('API Response:', response);

            if (response?.status === 0 && response?.data) {
                const expectedVersion = response.data.version;
                const expectedPackage = response.data.package_name;

                console.log('Expected Version:', expectedVersion);
                console.log('Expected Package:', expectedPackage);

                // Compare versions
                if (currentVersion !== expectedVersion || packageName !== expectedPackage) {
                    console.log('❌ Version Mismatch!');
                    setAlertMessage(
                        `Your app version (${currentVersion}) is outdated. Please update to version ${expectedVersion} to continue.`
                    );
                    setShowAlert(true);
                    setIsChecking(false);
                    return;
                }

                console.log('✅ Version Match - Proceeding to app');
            }

            setIsChecking(false);
        } catch (error) {
            console.error('Version Check Error:', error);
            // On error, allow app to proceed (optional: you can show error alert instead)
            setIsChecking(false);
        }
    };

    const handleExit = () => {
        console.log('Exiting app due to version mismatch...');
        BackHandler.exitApp();
    };

    return {
        isChecking,
        showAlert,
        alertMessage,
        handleExit,
    };
};

export const exitApp = () => {
    BackHandler.exitApp();
};
