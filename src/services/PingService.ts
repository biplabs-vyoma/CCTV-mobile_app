
import { CCTVDevice } from '../types/cctv';
import { PingResult, PingConfiguration } from '../types/network';

export class PingService {
    private static instance: PingService;
    private config: PingConfiguration = {
        interval: 30000,
        timeout: 5000,
        retryAttempts: 3,
        failureThreshold: 3,
        batchSize: 5
    };

    private constructor() { }

    public async testConnectivity(address: string, timeout: number = 2000): Promise<{ isReachable: boolean; responseTime?: number; error?: string }> {
        const result = await this.pingAddress(address, timeout);
        return {
            isReachable: result.isReachable,
            responseTime: result.latency,
            error: result.isReachable ? undefined : 'Request timed out'
        };
    }

    public static getInstance(): PingService {
        if (!PingService.instance) {
            PingService.instance = new PingService();
        }
        return PingService.instance;
    }

    public getConfiguration(): PingConfiguration {
        return this.config;
    }

    public updateConfiguration(newConfig: Partial<PingConfiguration>) {
        this.config = { ...this.config, ...newConfig };
    }

    /**
     * Simulates a ping to a device with retries.
     */
    public async ping(device: CCTVDevice, timeout: number = 5000): Promise<PingResult> {
        let attempts = 0;
        const maxAttempts = this.config.retryAttempts || 1;

        while (attempts < maxAttempts) {
            attempts++;
            const result = await this.performSinglePing(device, timeout);
            if (result.isReachable || attempts >= maxAttempts) {
                return result;
            }
            // Small delay between retries
            await new Promise(r => setTimeout(r, 100));
        }

        return {
            deviceId: parseInt(device.cctv_id),
            isReachable: false,
            responseTime: 0,
            timestamp: new Date(),
            error: 'Request timed out after retries'
        };
    }

    private performSinglePing(device: CCTVDevice, timeout: number): Promise<PingResult> {
        return new Promise((resolve) => {
            const startTime = Date.now();
            const delay = Math.random() * 500 + 20;
            const shouldFail = device.cctv_connection_status === '10'
                ? Math.random() > 0.1
                : Math.random() > 0.95;

            setTimeout(() => {
                const endTime = Date.now();
                const responseTime = endTime - startTime;

                if (shouldFail) {
                    resolve({
                        deviceId: parseInt(device.cctv_id),
                        isReachable: false,
                        responseTime: 0,
                        timestamp: new Date(),
                        error: 'Request timed out'
                    });
                } else {
                    resolve({
                        deviceId: parseInt(device.cctv_id),
                        isReachable: true,
                        responseTime: responseTime,
                        timestamp: new Date()
                    });
                }
            }, Math.min(delay, timeout));
        });
    }

    /**
     * Pings multiple cameras concurrently.
     */
    public async pingMultipleCameras(cameras: CCTVDevice[]): Promise<PingResult[]> {
        const promises = cameras.map(camera => this.ping(camera, this.config.timeout));
        return Promise.all(promises);
    }

    public async pingAddress(address: string, timeout: number = 2000): Promise<{ isReachable: boolean; latency: number }> {
        return new Promise((resolve) => {
            const startTime = Date.now();
            const delay = Math.random() * 300 + 20;
            const shouldFail = Math.random() > 0.9;

            setTimeout(() => {
                if (shouldFail) {
                    resolve({ isReachable: false, latency: 0 });
                } else {
                    resolve({ isReachable: true, latency: Date.now() - startTime });
                }
            }, Math.min(delay, timeout));
        });
    }
}

export default PingService.getInstance();
