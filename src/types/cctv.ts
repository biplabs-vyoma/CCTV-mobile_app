export interface CCTVDevice {
    cctv_id: string;
    cctv_name: string;
    cctv_serial_number: string;
    cctv_location_address: string;
    cctv_zone_name: string;
    cctv_subunit_name: string;
    cctv_vendor_name: string;
    cctv_connection_status: '10' | '20' | '30'; // 10: offline, 20: online, 30: maintenance
    lastSeen?: string; // ISO Date string
    cctv_ip_port?: string;
    up_time?: number;
    // Additional fields for completeness based on API/Modal
    type_id?: string;
    unit_id?: string;
    subunit_id?: string;
    zone_id?: string;
    region_id?: string;
    latitude?: string;
    longitude?: string;
    cctv_description?: string;
    vendor_id?: string;
    make_model?: string;
    resolution?: string;
    ip_address?: string;
    ip_port?: string;
    installation_date?: string;
    warranty_expiry_on?: string;
    is_night_vision?: number;
    is_ptz_capable?: number;
    is_recording_enable?: number;
    rtsp_link?: string;

    // Network Monitoring Fields
    isReachable?: boolean;
    lastPingTime?: Date;
    pingResponseTime?: number; // ms
    consecutiveFailures?: number;
}

export interface NetworkDiagnosticResult {
    command: 'ping' | 'traceroute' | 'connectivity';
    status: 'running' | 'success' | 'failed' | 'idle';
    output: string[];
    startTime?: Date;
    endTime?: Date;
    duration?: number;
    error?: string;
}

export interface Vendor {
    vendor_id: string;
    vendor_name: string;
}

export interface Zone {
    zone_id: string;
    zone_name: string;
}

export interface Region {
    region_id: string;
    region_name: string;
}

export interface Unit {
    unit_id: string;
    unit_name: string;
}

export interface Subunit {
    subunit_id: string;
    subunit_name: string;
}

export interface CCTVType {
    cctv_type_id: string;
    cctv_name: string;
}
