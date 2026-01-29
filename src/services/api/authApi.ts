import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from './config';

/**
 * Encrypts data using the security/encrypt endpoint
 */
export const encryptData = async (data: any): Promise<string> => {
    const response = await fetch(`${BASE_URL}security/encrypt`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });

    const result = await response.json();
    return result.data;
};

/**
 * Decrypts data using the security/decrypt endpoint
 */
export const decryptData = async (data: string): Promise<string> => {
    const raw = JSON.stringify({
        enc_data: data,
    });

    const response = await fetch(`${BASE_URL}security/decrypt`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: raw,
    });

    const result = await response.json();
    return result?.data;
};

/**
 * Generates authentication token using Basic auth
 */
export const generateAuthToken = async (basicAuth: string): Promise<any> => {
    try {
        const requestOptions: RequestInit = {
            method: 'POST',
            headers: {
                accept: '*/*',
                'Content-Type': 'application/json',
                Authorization: `Basic ${basicAuth}`,
            },
        };

        const response = await fetch(
            `${BASE_URL}auth/generateToken`,
            requestOptions
        );
        const data = await response.json();
        await AsyncStorage.setItem('token', data?.data?.access_token || '');
        return data;
    } catch (error: any) {
        console.log(error?.message);
        if(error?.message === "JSON Parse error: Unexpected end of input"){
            throw new Error('Invalid credentials');
        }
        throw new Error('Something went wrong, Please try again.');
    }
};

/**
 * Login API call with encrypted credentials
 */
export const loginApi = async (encData: string): Promise<any> => {
    try {
        const raw = JSON.stringify({
            enc_data: encData,
        });

        const token = await AsyncStorage.getItem('token');

        const requestOptions: RequestInit = {
            method: 'POST',
            headers: {
                accept: '*/*',
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token || ''}`,
            },
            body: raw,
        };

        const response = await fetch(
            `${BASE_URL}user/authentication`,
            requestOptions
        );
        const data = await response.json();
        return data;
    } catch (error: any) {
        throw new Error(
            error?.message || 'Something went wrong, Please try again.'
        );
    }
};

/**
 * Generic API caller with encryption
 */
export const callAPIWithEnc = async (
    endpoint: string,
    method = 'GET',
    body: any = null
): Promise<any> => {
    try {
        const token = await AsyncStorage.getItem('token');
        const headers: Record<string, string> = {
            accept: '*/*',
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token || ''}`,
        };

        const requestOptions: RequestInit = {
            method,
            headers,
        };

        if (body) {
            const encData = await encryptData(body);
            requestOptions.body = JSON.stringify({ enc_data: encData });
        }

        const response = await fetch(`${BASE_URL}${endpoint}`, requestOptions);
        const data = await response.json();
        let decryptedData: any = null;

        console.log("data", data);

        if (data?.data) {
            const decrypted = await decryptData(data.data);
            decryptedData = JSON.parse(decrypted);
        }


        console.log("decryptedData", decryptedData);
        return { ...data, data: decryptedData };
    } catch (error: any) {
        throw new Error(
            error?.message || 'Something went wrong, Please try again.'
        );
    }
};

/**
 * Generic API caller without encryption
 */
export const callAPIWithoutEnc = async (
    endpoint: string,
    method = 'GET',
    body: any = null
): Promise<any> => {
    try {
        const token = await AsyncStorage.getItem('token');
        const headers: Record<string, string> = {
            accept: '*/*',
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token || ''}`,
        };

        const requestOptions: RequestInit = {
            method,
            headers,
        };

        if (body) {
            requestOptions.body = JSON.stringify(body);
        }

        const response = await fetch(`${BASE_URL}${endpoint}`, requestOptions);
        const data = await response.json();

        return data;
    } catch (error: any) {
        throw new Error(
            error?.message || 'Something went wrong, Please try again.'
        );
    }
};