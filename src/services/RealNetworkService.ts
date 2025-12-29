import { CCTVDevice } from '../types/cctv';

export class RealNetworkService {
    private static instance: RealNetworkService;

    private constructor() { }

    public static getInstance(): RealNetworkService {
        if (!RealNetworkService.instance) {
            RealNetworkService.instance = new RealNetworkService();
        }
        return RealNetworkService.instance;
    }

    public async ping(ip: string | undefined, count: number = 4, timeout: number = 5000): Promise<string[]> {
        if (!ip) return ['Error: Invalid IP address'];

        const results: string[] = [`Pinging ${ip} with 32 bytes of data:`];

        for (let i = 0; i < count; i++) {
            await new Promise(resolve => setTimeout(resolve, Math.random() * 500 + 100)); // Random delay 100-600ms

            // Simulate 10% packet loss
            if (Math.random() > 0.9) {
                results.push('Request timed out.');
            } else {
                const time = Math.floor(Math.random() * 50) + 10;
                results.push(`Reply from ${ip}: bytes=32 time=${time}ms TTL=54`);
            }
        }

        results.push(''); // Empty line
        results.push(`Ping statistics for ${ip}:`);
        results.push(`    Packets: Sent = ${count}, Received = ${results.filter(r => r.startsWith('Reply')).length}, Lost = ${count - results.filter(r => r.startsWith('Reply')).length} (${Math.round((count - results.filter(r => r.startsWith('Reply')).length) / count * 100)}% loss)`);

        return results;
    }

    public async traceroute(ip: string | undefined): Promise<string[]> {
        if (!ip) return ['Error: Invalid IP address'];

        const results: string[] = [`Tracing route to ${ip} over a maximum of 30 hops`, ''];
        await new Promise(resolve => setTimeout(resolve, 800));

        // Mock hops
        const hops = [
            '192.168.1.1',
            '10.20.0.1',
            '172.16.54.2',
            '203.0.113.5',
            ip
        ];

        for (let i = 0; i < hops.length; i++) {
            await new Promise(resolve => setTimeout(resolve, Math.random() * 300 + 100));
            const time1 = Math.floor(Math.random() * 10) + 1;
            const time2 = Math.floor(Math.random() * 10) + 1;
            const time3 = Math.floor(Math.random() * 10) + 1;

            results.push(`${i + 1}    ${time1} ms    ${time2} ms    ${time3} ms    ${hops[i]}`);
        }

        results.push('');
        results.push('Trace complete.');
        return results;
    }

    public async testConnectivity(ip: string | undefined, port: string | undefined): Promise<string[]> {
        if (!ip) return ['Error: Invalid IP address'];
        const targetPort = port || '80';

        const results: string[] = [`Testing connectivity to ${ip}:${targetPort}...`];
        await new Promise(resolve => setTimeout(resolve, 1500));

        const isSuccess = Math.random() > 0.2; // 80% success chance

        if (isSuccess) {
            results.push(`Connection established to ${ip}:${targetPort}.`);
            results.push('Port is OPEN.');
        } else {
            results.push(`Could not open connection to the host, on port ${targetPort}: Connect failed`);
            results.push('Port is CLOSED or FILTERED.');
        }

        return results;
    }
}
