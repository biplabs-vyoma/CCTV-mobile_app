import { callAPIWithEnc } from './authApi';

export const fetchDashboardDetails = async (userId: string | number, userTypeId: string | number) => {
    try {
        const payload = {
            user_id: userId,
            user_type_id: userTypeId,
        };


        const response = await callAPIWithEnc('user/getDashBoardDetails', 'POST', payload);

        console.log("response", response);

        let parsedResult = response?.data;
        if (typeof parsedResult === 'string') {
            try {
                parsedResult = JSON.parse(parsedResult);
            } catch (e) {
                console.error('Failed to parse dashboard JSON string', e);
            }
        }

        console.log("parsedResult", parsedResult);
        return parsedResult;
    } catch (error) {
        throw error;
    }
};

export const fetchRecentTickets = async (userId: string | number, userTypeId: string | number) => {
    try {
        const payload = {
            user_id: userId,
            user_type_id: userTypeId,
        };
        const response = await callAPIWithEnc('user/getTicketRecentActivity', 'POST', payload);

        let parsedResult = response?.data;
        if (typeof parsedResult === 'string') {
            try {
                parsedResult = JSON.parse(parsedResult);
            } catch (e) {
                console.error('Failed to parse recent tickets JSON string', e);
            }
        }

        console.log("parsedResult", parsedResult);


        return parsedResult;
    } catch (error) {
        throw error;
    }
};
