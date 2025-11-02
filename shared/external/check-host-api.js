// shared/external/check-host-api.js - Real API implementation
import { EXTERNAL_APIS } from './api-config.js';

export class CheckHostAPI {
    constructor() {
        this.baseUrl = EXTERNAL_APIS.CHECK_HOST.BASE_URL;
    }

    async testPing(hostname) {
        return this.makeRequest('ping', { host: hostname });
    }

    async testTCP(hostname, port) {
        return this.makeRequest('tcp', { host: `${hostname}:${port}` });
    }

    async testHTTP(hostname, port = 443) {
        const protocol = port === 443 ? 'https' : 'http';
        return this.makeRequest('http', { 
            host: `${protocol}://${hostname}:${port}` 
        });
    }

    async makeRequest(testType, params) {
        try {
            const endpoint = EXTERNAL_APIS.CHECK_HOST.ENDPOINTS[testType.toUpperCase()];
            if (!endpoint) {
                throw new Error(`Unknown test type: ${testType}`);
            }

            const url = `${this.baseUrl}${endpoint}`;
            
            console.log(`Making Check-Host API request to: ${url}`);
            
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams(params)
            });

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

            const data = await response.json();
            return this.formatResults(data, testType);

        } catch (error) {
            console.error(`Check-Host API ${testType} test failed:`, error);
            return {
                success: false,
                error: error.message,
                fallback: true
            };
        }
    }

    formatResults(apiData, testType) {
        return {
            success: true,
            testType: testType,
            requestId: apiData.request_id,
            nodes: this.parseNodes(apiData.nodes || {}),
            summary: this.generateSummary(apiData, testType)
        };
    }

    parseNodes(nodesData) {
        const results = [];
        
        for (const [nodeId, nodeInfo] of Object.entries(nodesData)) {
            if (nodeInfo && nodeInfo.length > 0) {
                const result = nodeInfo[0];
                results.push({
                    node: nodeId,
                    status: result[0] === '1' ? 'success' : 'failed',
                    latency: result[1] || null,
                    error: result[2] || null
                });
            }
        }
        
        return results;
    }

    generateSummary(apiData, testType) {
        const nodes = this.parseNodes(apiData.nodes || {});
        const successfulNodes = nodes.filter(node => node.status === 'success');
        const latencies = successfulNodes.map(node => node.latency).filter(latency => latency);
        
        return {
            totalNodes: nodes.length,
            successfulNodes: successfulNodes.length,
            successRate: nodes.length > 0 ? (successfulNodes.length / nodes.length) * 100 : 0,
            averageLatency: latencies.length > 0 ? 
                latencies.reduce((sum, latency) => sum + latency, 0) / latencies.length : null,
            testType: testType
        };
    }
}

// Convenience function
export async function quickConnectionTest(server, port) {
    const api = new CheckHostAPI();
    
    try {
        const [ping, tcp, http] = await Promise.all([
            api.testPing(server),
            api.testTCP(server, port),
            api.testHTTP(server, port)
        ]);

        return { ping, tcp, http };
    } catch (error) {
        console.error('Quick connection test failed:', error);
        return {
            ping: { success: false, fallback: true },
            tcp: { success: false, fallback: true },
            http: { success: false, fallback: true }
        };
    }
}
