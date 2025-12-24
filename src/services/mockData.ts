export interface Ticket {
    id: string;
    ticketId: string;
    location: string;
    issue: string;
    priority: 'Low' | 'Medium' | 'High';
    status: 'Open' | 'Assigned' | 'In-Progress' | 'Resolved' | 'Closed';
    date: string;
}

export const MOCK_TICKETS: Ticket[] = [
    {
        id: '1',
        ticketId: '10-20251222155544',
        location: 'ultracamera, kolkata',
        issue: 'Camera Offline',
        priority: 'Low',
        status: 'Open',
        date: '2025-12-24'
    },
    {
        id: '2',
        ticketId: '8-20251219180429',
        location: 'test4camera, kolkata, behala',
        issue: 'Camera Offline',
        priority: 'Medium',
        status: 'In-Progress',
        date: '2025-12-19'
    },
    {
        id: '3',
        ticketId: '7-20251219165814',
        location: 'panorama, park street',
        issue: 'Camera Positioning',
        priority: 'High',
        status: 'Assigned',
        date: '2025-12-19'
    },
    {
        id: '4',
        ticketId: '5-20251215102030',
        location: 'metro entry, esplanade',
        issue: 'Blurry Image',
        priority: 'Medium',
        status: 'Resolved',
        date: '2025-12-15'
    }
];

export const DASHBOARD_STATS = {
    resolved: 0,
    inProgress: 0,
    assigned: 1,
};

export const CHART_DATA = {
    online: 45,
    offline: 10,
    maintenance: 5,
};
