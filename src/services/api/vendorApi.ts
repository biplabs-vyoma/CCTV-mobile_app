import { callAPIWithEnc } from './authApi';

/**
 * Fetches ticket report based on date range and location/vendor filters.
 * Based on sp_getDateWiseTicketReport
 */
export const getDateWiseTicketReport = async (payload: {
    region_id: number;
    zone_id: number;
    unit_id: number;
    vendor_id: number;
    start_date: string;
    end_date: string;
}) => {
    try {
        const response = await callAPIWithEnc('vendor/getDateWiseTicketReport', 'POST', payload);
        return response?.data;
    } catch (error) {
        console.error('Error fetching date-wise ticket report:', error);
        throw error;
    }
};

/**
 * Fetches engineer performance report based on vendor and date range.
 * Based on sp_getfieldEnginnerwiseReport
 */
export const getFieldEngineerWiseReport = async (payload: {
    vendor_id: number;
    start_date: string;
    end_date: string;
}) => {
    try {
        const response = await callAPIWithEnc('vendor/getfieldEnginnerwiseReport', 'POST', payload);
        return response?.data;
    } catch (error) {
        console.error('Error fetching field engineer wise report:', error);
        throw error;
    }
};
