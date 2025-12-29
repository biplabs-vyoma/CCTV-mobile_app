
export interface NetworkMonitoringStats {
    totalDevices: number;
    onlineDevices: number;
    offlineDevices: number;
    avgLatency: number;
    lastScanTime: Date | null;
    isScanning: boolean;
    successfulPings: number;
    failedPings: number;
    scanDuration: number;
}

export interface PingConfiguration {
    interval: number;          // milliseconds
    timeout: number;           // milliseconds
    retryAttempts: number;     // number of retries per ping
    failureThreshold: number;  // consecutive failures before marking offline
    batchSize: number;         // number of concurrent pings
}

export interface PingResult {
    deviceId: number;
    isReachable: boolean;
    responseTime: number;  // milliseconds
    timestamp: Date;
    error?: string;
}

export interface Alert {
    id: string;
    deviceId: number;
    deviceName: string;
    type: 'layout_change' | 'connectivity_loss' | 'high_latency';
    message: string;
    timestamp: Date;
    isRead: boolean;
    severity: 'info' | 'warning' | 'critical';
}
