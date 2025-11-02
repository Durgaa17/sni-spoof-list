// shared/external/check-host-api.js - Check-Host.net API integration
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
            const url = `${this.baseUrl}${endpoint}`;
            
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
                fallback: true // Flag to use fallback method
            };
        }
    }

    formatResults(apiData, testType) {
        // Extract meaningful results from API response
        return {
            success: true,
            testType: testType,
            requestId: apiData.request_id,
            nodes: this.parseNodes(apiData.nodes),
            summary: this.generateSummary(apiData, testType),
            rawData: apiData // Keep raw data for debugging
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
        const nodes = this.parseNodes(apiData.nodes);
        const successfulNodes = nodes.filter(node => node.status === 'success');
        
        return {
            totalNodes: nodes.length,
            successfulNodes: successfulNodes.length,
            successRate: (successfulNodes.length / nodes.length) * 100,
            averageLatency: this.calculateAverageLatency(successfulNodes),
            testType: testType
        };
    }

    calculateAverageLatency(nodes) {
        const latencies = nodes.map(node => node.latency).filter(latency => latency);
        if (latencies.length === 0) return null;
        
        return latencies.reduce((sum, latency) => sum + latency, 0) / latencies.length;
    }
}

// Convenience function for quick testing
export async function quickConnectionTest(server, port) {
    const api = new CheckHostAPI();
    
    const results = {
        ping: await api.testPing(server),
        tcp: await api.testTCP(server, port),
        http: await api.testHTTP(server, port)
    };

    return results;
}
