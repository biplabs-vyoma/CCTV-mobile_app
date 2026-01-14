import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../../services/api/config'; // Assuming config exists or I'll define it/import from env


console.log('BASE_URL', BASE_URL);
// Fallback if BASE_URL is not defined in config
const API_URL = BASE_URL || 'https://api.example.com/';

export const encryptData = async (data: any) => {
    try {
        const url = `${API_URL}security/encrypt`;
        console.log(`[ENCRYPT_CALL] ${url}`);
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Encryption failed with status ${response.status}:`, errorText.slice(0, 200));
            return null;
        }

        const result = await response.json();
        return result.data;
    } catch (error) {
        console.error('Encryption error:', error);
        return null;
    }
};

export const decryptData = async (data: string) => {
    try {
        const url = `${API_URL}security/decrypt`;
        const raw = JSON.stringify({
            enc_data: data,
        });

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: raw,
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Decryption failed with status ${response.status}:`, errorText.slice(0, 200));
            return null;
        }

        const result = await response.json();
        return result?.data;
    } catch (error) {
        console.error('Decryption error:', error);
        return null;
    }
};

export const callAPIWithEnc: any = async (
    endpoint: string,
    method = 'GET',
    body: any = null
) => {
    try {
        console.log(`[API_CALL] ${method} ${API_URL}`);
        const token = await AsyncStorage.getItem('token');
        const headers: any = {
            accept: '*/*',
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token || ''}`,
        };
        const requestOptions: any = {
            method,
            headers,
        };
        if (body) {
            console.log(`[API_PAYLOAD_RAW]`, body);
            const encData = await encryptData(body);
            requestOptions.body = JSON.stringify({ enc_data: encData });
            console.log(`[API_PAYLOAD_ENCRYPTED]`, requestOptions.body);
        }
        const response: any = await fetch(`${API_URL}${endpoint}`, requestOptions);
        const data = await response.json();
        console.log(`[API_RESPONSE_RAW]`, data);

        let decryptedData: any = null;

        if (data?.data) {
            const decrypted = await decryptData(data.data);
            if (decrypted) {
                console.log(`[API_RESPONSE_DECRYPTED_RAW]`, decrypted);
                try {
                    decryptedData = JSON.parse(decrypted);
                    console.log(`[API_RESPONSE_DECRYPTED_JSON]`, decryptedData);
                } catch (e) {
                    decryptedData = decrypted;
                }
            }
        }
        return { ...data, data: decryptedData };
    } catch (error: any) {
        console.error(`[API_ERROR] ${endpoint}`, error);
        throw new Error(
            error?.message || 'Something went wrong, Please try again.'
        );
    }
};

// API call without encryption - for endpoints that return plain data (like images)
export const callAPIWithoutEnc: any = async (
    endpoint: string,
    method = 'GET',
    body: any = null
) => {
    try {
        console.log(`[API_CALL_PLAIN] ${method} ${endpoint}`);
        const token = await AsyncStorage.getItem('token');
        const headers: any = {
            accept: '*/*',
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token || ''}`,
        };
        const requestOptions: any = {
            method,
            headers,
        };
        if (body) {
            console.log(`[API_PAYLOAD_PLAIN]`, body);
            requestOptions.body = JSON.stringify(body);
        }
        const response: any = await fetch(`${API_URL}${endpoint}`, requestOptions);
        const data = await response.json();
        console.log(`[API_RESPONSE_PLAIN]`, data);

        // Return data as-is without decryption
        return data;
    } catch (error: any) {
        console.error(`[API_ERROR_PLAIN] ${endpoint}`, error);
        throw new Error(
            error?.message || 'Something went wrong, Please try again.'
        );
    }
};
