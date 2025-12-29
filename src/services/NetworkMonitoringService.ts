import { CCTVDevice } from '../types/cctv';
import { NetworkMonitoringStats, PingResult, Alert, PingConfiguration } from '../types/network';
import PingServiceInstance, { PingService } from './PingService';

export class NetworkMonitoringService {
    private static instance: NetworkMonitoringService;
    private pingService: PingService;
    private monitoringInterval: NodeJS.Timeout | null = null;
    private isMonitoring = false;
    private cameras: CCTVDevice[] = [];
    private onStatusUpdate?: (cameras: CCTVDevice[]) => void;
    private onStatsUpdate?: (stats: NetworkMonitoringStats) => void;
    private onAlertGenerated?: (alert: Alert) => void;

    private constructor() {
        this.pingService = PingServiceInstance;
        this.cameras = [];
    }

    public static getInstance(): NetworkMonitoringService {
        if (!NetworkMonitoringService.instance) {
            NetworkMonitoringService.instance = new NetworkMonitoringService();
        }
        return NetworkMonitoringService.instance;
    }

    /**
     * Initialize monitoring with cameras list
     */
    public initialize(
        cameras: CCTVDevice[],
        callbacks: {
            onStatusUpdate?: (cameras: CCTVDevice[]) => void;
            onStatsUpdate?: (stats: NetworkMonitoringStats) => void;
            onAlertGenerated?: (alert: Alert) => void;
        }
    ): void {
        this.cameras = cameras;
        this.onStatusUpdate = callbacks.onStatusUpdate;
        this.onStatsUpdate = callbacks.onStatsUpdate;
        this.onAlertGenerated = callbacks.onAlertGenerated;
    }

    /**
     * Start continuous monitoring
     */
    public startMonitoring(intervalSeconds: number = 30): void {
        if (this.isMonitoring) {
            console.warn('Monitoring is already running');
            return;
        }

        this.isMonitoring = true;
        console.log(`Starting network monitoring with ${intervalSeconds}s interval`);

        // Initial scan
        this.performScan();

        // Set up recurring scans
        this.monitoringInterval = setInterval(() => {
            this.performScan();
        }, intervalSeconds * 1000);
    }

    /**
     * Stop monitoring
     */
    public stopMonitoring(): void {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
        }
        this.isMonitoring = false;
        console.log('Network monitoring stopped');
    }

    /**
     * Perform a single scan of all cameras
     */
    public async performScan(): Promise<void> {
        if (this.cameras.length === 0) {
            console.warn('No cameras to monitor');
            return;
        }

        const scanStartTime = Date.now();
        console.log(`Starting scan of ${this.cameras.length} cameras...`);

        try {
            // Ping all cameras concurrently
            const pingResults = await this.pingService.pingMultipleCameras(this.cameras);

            // Update camera statuses
            const updatedCameras = this.updateCameraStatuses(pingResults);

            // Generate alerts for status changes
            this.checkForAlerts(updatedCameras);

            // Calculate and update statistics
            const stats = this.calculateStats(pingResults, scanStartTime);

            // Notify callbacks
            this.onStatusUpdate?.(updatedCameras);
            this.onStatsUpdate?.(stats);

            console.log(`Scan completed in ${stats.scanDuration}ms`);
        } catch (error) {
            console.error('Error during network scan:', error);
        }
    }

    /**
     * Update camera statuses based on ping results
     */
    private updateCameraStatuses(pingResults: PingResult[]): CCTVDevice[] {
        const updatedCameras = this.cameras.map(camera => {
            const pingResult = pingResults.find(result => result.deviceId === parseInt(camera.cctv_id));

            if (!pingResult) {
                return camera;
            }

            const updatedCamera = { ...camera };

            if (pingResult.isReachable) {
                // Camera is reachable
                updatedCamera.cctv_connection_status = camera.cctv_connection_status === '30' ? '30' : '20';
                updatedCamera.lastSeen = pingResult.timestamp.toISOString();
                updatedCamera.lastPingTime = pingResult.timestamp;
                updatedCamera.pingResponseTime = pingResult.responseTime;
                updatedCamera.consecutiveFailures = 0;
                updatedCamera.isReachable = true;

                // Update uptime calculation
                updatedCamera.up_time = this.calculateUptime(updatedCamera);
            } else {
                // Camera is not reachable
                updatedCamera.consecutiveFailures = (camera.consecutiveFailures || 0) + 1;
                updatedCamera.isReachable = false;

                // Mark as offline if failure threshold is reached
                const config = this.pingService.getConfiguration();
                if ((updatedCamera.consecutiveFailures || 0) >= config.failureThreshold) {
                    updatedCamera.cctv_connection_status = '10';
                }

                // Update uptime calculation
                updatedCamera.up_time = this.calculateUptime(updatedCamera);
            }

            return updatedCamera;
        });

        this.cameras = updatedCameras;
        return updatedCameras;
    }

    /**
     * Calculate uptime percentage for a camera
     */
    private calculateUptime(camera: CCTVDevice): number {
        // Simplified uptime calculation
        // In a real implementation, this would use historical data
        const baseUptime = camera.up_time || 95;

        if (camera.isReachable) {
            return Math.min(100, baseUptime + 0.1);
        } else {
            return Math.max(0, baseUptime - 0.5);
        }
    }

    /**
     * Check for alerts based on camera status changes
     */
    private checkForAlerts(cameras: CCTVDevice[]): void {
        cameras.forEach(camera => {
            // Alert for cameras going offline
            if (camera.cctv_connection_status === '10' && (camera.consecutiveFailures || 0) === this.pingService.getConfiguration().failureThreshold) {
                const alert: Alert = {
                    id: `ALT_${Date.now()}_${camera.cctv_id}`,
                    deviceId: parseInt(camera.cctv_id),
                    deviceName: camera.cctv_name,
                    type: 'connectivity_loss',
                    message: `Camera ${camera.cctv_name} has gone offline and is not responding to ping requests.`,
                    timestamp: new Date(),
                    isRead: false,
                    severity: 'critical'
                };

                this.onAlertGenerated?.(alert);
            }

            // Alert for low uptime
            const uptime = camera.up_time || 100;
            if (uptime < 85 && camera.cctv_connection_status === '20') {
                const alert: Alert = {
                    id: `ALT_${Date.now()}_${camera.cctv_id}_UPTIME`,
                    deviceId: parseInt(camera.cctv_id),
                    deviceName: camera.cctv_name,
                    type: 'high_latency', // Using high_latency as a proxy for 'system issue'
                    message: `Camera ${camera.cctv_name} has low uptime (${uptime.toFixed(1)}%). Consider maintenance.`,
                    timestamp: new Date(),
                    isRead: false,
                    severity: 'warning'
                };

                this.onAlertGenerated?.(alert);
            }
        });
    }

    /**
     * Calculate monitoring statistics
     */
    private calculateStats(pingResults: PingResult[], scanStartTime: number): NetworkMonitoringStats {
        const scanDuration = Date.now() - scanStartTime;
        const successfulPings = pingResults.filter(result => result.isReachable).length;
        const failedPings = pingResults.length - successfulPings;

        const responseTimes = pingResults
            .filter(result => result.isReachable && result.responseTime)
            .map(result => result.responseTime!);

        const averageResponseTime = responseTimes.length > 0
            ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
            : 0;

        const onlineDevices = this.cameras.filter(camera => camera.cctv_connection_status === '20').length;
        const offlineDevices = this.cameras.filter(camera => camera.cctv_connection_status === '10').length;

        return {
            totalDevices: this.cameras.length,
            onlineDevices,
            offlineDevices,
            avgLatency: Math.round(averageResponseTime),
            lastScanTime: new Date(),
            scanDuration,
            failedPings,
            successfulPings,
            isScanning: false
        };
    }

    /**
     * Get current monitoring status
     */
    public getMonitoringStatus(): {
        isMonitoring: boolean;
        cameraCount: number;
        lastScanTime?: Date;
    } {
        return {
            isMonitoring: this.isMonitoring,
            cameraCount: this.cameras.length,
            lastScanTime: this.cameras.length > 0 ? this.cameras[0].lastPingTime : undefined
        };
    }

    /**
     * Force immediate scan
     */
    public async forceScan(): Promise<void> {
        console.log('Forcing immediate network scan...');
        await this.performScan();
    }

    /**
     * Get cameras by status
     */
    public getCamerasByStatus(status: '20' | '10' | '30'): CCTVDevice[] {
        return this.cameras.filter(camera => camera.cctv_connection_status === status);
    }

    /**
     * Get network health summary
     */
    public getNetworkHealth(): {
        overallHealth: 'excellent' | 'good' | 'fair' | 'poor';
        onlinePercentage: number;
        averageUptime: number;
        criticalIssues: number;
    } {
        const onlineCount = this.cameras.filter(camera => camera.cctv_connection_status === '20').length;
        const onlinePercentage = this.cameras.length > 0 ? (onlineCount / this.cameras.length) * 100 : 0;

        const averageUptime = this.cameras.length > 0
            ? this.cameras.reduce((sum, camera) => sum + (camera.up_time || 0), 0) / this.cameras.length
            : 0;

        const criticalIssues = this.cameras.filter(camera =>
            camera.cctv_connection_status === '10' || (camera.up_time || 100) < 80
        ).length;

        let overallHealth: 'excellent' | 'good' | 'fair' | 'poor';
        if (onlinePercentage >= 95 && averageUptime >= 95) {
            overallHealth = 'excellent';
        } else if (onlinePercentage >= 85 && averageUptime >= 85) {
            overallHealth = 'good';
        } else if (onlinePercentage >= 70 && averageUptime >= 70) {
            overallHealth = 'fair';
        } else {
            overallHealth = 'poor';
        }

        return {
            overallHealth,
            onlinePercentage: Math.round(onlinePercentage * 10) / 10,
            averageUptime: Math.round(averageUptime * 10) / 10,
            criticalIssues
        };
    }

    // Helper methods from current implementation to maintain compatibility if needed
    public getConfig(): PingConfiguration {
        return this.pingService.getConfiguration();
    }

    public updateConfiguration(newConfig: Partial<PingConfiguration>) {
        this.pingService.updateConfiguration(newConfig);
        if (this.isMonitoring) {
            this.stopMonitoring();
            this.startMonitoring(30); // Use default or previous interval
        }
    }
}

export default NetworkMonitoringService.getInstance();
