import { callAPIWithEnc } from './authApi';
import { CCTVDevice } from '../../types/cctv';

export const getCCtvMonitoringList = async (
    statusId: string,
    zoneId: string,
    regionId: string,
    vendorId: string | null,
    userId: number | undefined,
    userTypeId: number | undefined
) => {


    console.log('getCCtvMonitoringList', statusId, zoneId, vendorId, userId, userTypeId);



    return await callAPIWithEnc('user/getCCtvMonitoringList', 'POST', {
        cctv_status_id: statusId,
        zone_id: zoneId,
        region_id: regionId,
        vendor_id: vendorId,
        user_id: userId,
        user_type_id: userTypeId,
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

export const getUnits = async () => {
    return await callAPIWithEnc('master/getUnit', 'POST', {});
};

export const getSubunits = async () => {
    return await callAPIWithEnc('master/getSubunit', 'POST', {});
};

export const getCCTVTypes = async () => {
    return await callAPIWithEnc('master/getCCtvType', 'POST', {});
};