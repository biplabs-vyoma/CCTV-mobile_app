import { callAPIWithEnc } from './authApi';
import { CCTVDevice } from '../../types/cctv';

export const getCCtvMonitoringList = async (
    statusId: string,
    zoneId: string,
    regionId: string,
    unitId: string,
    vendorId: string | null,
    userId: number | undefined,
    userTypeId: number | undefined,
    ticketStatusId: string // New parameter
) => {
    return await callAPIWithEnc('user/getCCtvMonitoringList', 'POST', {
        cctv_status_id: statusId,
        zone_id: zoneId,
        region_id: regionId,
        unit_id: unitId,
        vendor_id: vendorId,
        user_id: userId,
        user_type_id: userTypeId,
        ticket_status_id: ticketStatusId,
    });
};

export const saveCCTVDetails = async (cctvData: any) => {
    return await callAPIWithEnc('vendor/saveCCTVDetails', 'POST', cctvData);
};

export const getVendors = async () => {
    return await callAPIWithEnc('master/getVendor', 'POST', {});
};

export const getZones = async (regionId?: string) => {
    return await callAPIWithEnc('master/getZone', 'POST', {
        region_id: regionId || '0'
    });
};

export const getRegions = async () => {
    return await callAPIWithEnc('master/getRegion', 'POST', {});
};

export const getUnits = async (regionId?: string) => {
    return await callAPIWithEnc('master/getUnit', 'POST', {
        region_id: regionId || '0'
    });
};

export const getSubunits = async () => {
    return await callAPIWithEnc('master/getSubUnit', 'POST', {});
};

export const getDiagnosis = async (cctvId: string) => {
    return await callAPIWithEnc('user/getCCtvDiagnosis', 'POST', { cctv_id: cctvId });
};

export const getTicketStatuses = async () => {
    return await callAPIWithEnc('master/getStatusDetails', 'POST', {});
};