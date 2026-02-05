import DeviceInfo from 'react-native-device-info';
import { callAPIWithEnc } from '../apis/common/api';

export interface VersionCheckResult {
    success: boolean;
    updateRequired: boolean;
    expectedVersion?: string;
    error?: string;
}

/**
 * Performs a mandatory app version check against the server.
 * This is a standalone service function intended for use during app initialization.
 */
export const performVersionCheck = async (): Promise<VersionCheckResult> => {
    try {
        console.log('=== Global Version Check Started ===');
        const currentVersion = DeviceInfo.getVersion();
        const packageName = DeviceInfo.getBundleId();

        const response: any = await callAPIWithEnc(
            'user/getapkversion',
            'POST',
            {
                package_name: String(packageName),
                apk_version: String(currentVersion),
            },
            false // No token required for version check
        );

        console.log('Version Service Response:', response);

        if (response?.status === 0) {
            return {
                success: true,
                updateRequired: false
            };
        } else {
            return {
                success: false,
                updateRequired: true,
                expectedVersion: response?.version || 'new version'
            };
        }
    } catch (error) {
        console.error('Version Service Error:', error);
        return {
            success: false,
            updateRequired: false,
            error: 'Unable to verify app version. Please check your network connection.'
        };
    }
};
