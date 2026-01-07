// Ticket type definitions
export interface Ticket {
    ticket_id: string;
    ticket_number: string;
    ticket_status: string; // '210', '220', etc.
    ticket_status_text: string;
    severity_name: string;
    cctv_name: string;
    cctv_location_address: string;
    cctv_serial_number: string;
    ticket_creaton: string; // Keep the typo as it matches API response
    escalationLevel: number;
    incident_category_name?: string;
    assigned_to?: string;
    ticket_image1?: string;
    ticket_created_user_id?: string | number;
    vendor_name?: string;
}

export interface Engineer {
    field_enginner_id: string;
    field_enginner_fullname: string;
    vendor_name: string;
    unit_name: string;
    zone_name: string;
    phone_number: string;
    email: string;
    total_active_ticket: number;
    total_assigned_ticket: number;
}

export interface ChatMessage {
    id: string;
    text: string;
    sender: string;
    timestamp: string;
}

export interface ChatSession {
    id: string;
    ticketId: string;
    messages: ChatMessage[];
}
