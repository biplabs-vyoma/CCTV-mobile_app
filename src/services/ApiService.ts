import { MOCK_TICKETS, DASHBOARD_STATS, CHART_DATA } from './mockData';

const DELAY = 1000; // 1 second simulated delay

export const ApiService = {
    login: async (email: string, password: string) => {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                if (email && password) {
                    resolve({
                        user: {
                            name: 'Panoramaeng',
                            role: 'Field Engineer',
                            email: email
                        },
                        token: 'dummy-jwt-token'
                    });
                } else {
                    reject(new Error('Invalid credentials'));
                }
            }, DELAY);
        });
    },

    fetchDashboardStats: async () => {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(DASHBOARD_STATS);
            }, DELAY);
        });
    },

    fetchTickets: async () => {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(MOCK_TICKETS);
            }, DELAY);
        });
    },

    fetchChartData: async () => {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(CHART_DATA);
            }, DELAY);
        });
    }
};
