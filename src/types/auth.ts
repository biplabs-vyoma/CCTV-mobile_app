export interface User {
    user_id: number;
    user_type_id: number;
    user_type_name: string;
    user_name: string;
    user_email_id: string;
    user_phone_number: string;
    user_gender: string;
    region_id: number;
    zone_id: number;
    zone_name: string;
    unit_id: number;
    unit_name: string;
    subunit_id: number;
    subunit_name: string;
    vendor_id: number;
    vendor_name: string;
    // Keeping these as optional/legacy until confirmed cleanup
    permissions?: string[];
    isActive?: boolean;
    createdAt?: Date;
}

export interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
}

export interface LoginCredentials {
    email: string;
    password: string;
}
