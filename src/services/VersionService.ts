import DeviceInfo from 'react-native-device-info';

interface VersionCheckResult {
    success: boolean;
    error?: string;
    expectedVersion?: string;
}

/**
 * Checks if the current app version is supported.
 * Currently returns success: true as a placeholder.
 */
export const performVersionCheck = async (): Promise<VersionCheckResult> => {
    try {
        const currentVersion = DeviceInfo.getVersion();
        console.log(`[VersionService] Current App Version: ${currentVersion}`);

        // TODO: Integration point for backend version check
        // If(backendVersion > currentVersion) return { success: false, expectedVersion: backendVersion };

        return { success: true };
    } catch (error) {
        console.error("[VersionService] Version check failed", error);
        // In case of error (e.g. offline), we typically allow the user to proceed
        return { success: true };
    }
};
