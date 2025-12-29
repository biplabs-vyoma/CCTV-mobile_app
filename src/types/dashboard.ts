export interface DashboardStats {
    total_cctv: number;
    total_online_cctv: number;
    total_offline_cctv: number;
    open_ticket: number;
    sla_compliance: number;
    avg_response_time: number;
    avg_resolution_time: number;
    critical_issue: number;

    // Field Engineer specific
    total_resloved_ticket?: number;
    total_inprogress_ticket?: number;
    total_assigned_ticket?: number;
}

export interface Ticket {
    id: string | number;
    ticket_number: string;
    cctvName: string;
    location: string;
    issueType: string;
    priority: string;
    status: string;
    assignedTo?: string;
    createdAt: Date | string;
    slaBreached?: boolean;
}

export interface TicketApiResponse {
    ticket_id?: string | number;
    id?: string | number;
    ticket_number: string;
    cctv_name: string;
    cctv_location_address: string;
    incident_category_name: string;
    severity_name: string;
    ticket_status_text: string;
    assigned_to: string;
    ticket_creaton: string;
}
