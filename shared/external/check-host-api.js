// shared/external/check-host-api.js - CORRECTED API IMPLEMENTATION
import { EXTERNAL_APIS } from './api-config.js';

export class CheckHostAPI {
    constructor() {
        this.baseUrl = EXTERNAL_APIS.CHECK_HOST.BASE_URL;
    }

    async testPing(hostname, maxNodes = 3) {
        return this.makeRequest('ping', { host: hostname, max_nodes: maxNodes });
    }

    async testTCP(hostname, port, maxNodes = 3) {
        const host = `${hostname}:${port}`;
        return this.makeRequest('tcp', { host, max_nodes: maxNodes });
    }

    async testHTTP(hostname, port = 443, maxNodes = 3) {
        const protocol = port === 443 ? 'https' : 'http';
        const host = `${protocol}://${hostname}:${port}`;
        return this.makeRequest('http', { host, max_nodes: maxNodes });
    }

    async makeRequest(checkType, params) {
        try {
            const endpoint = `/check-${checkType}`;
            const queryParams = new URLSearchParams(params).toString();
            const url = `${this.baseUrl}${endpoint}?${queryParams}`;
            
            console.log(`Making API request to: ${url}`);
            
            const response = await fetch(url, {
                method: 'GET', // ✅ CORRECT: Use GET not POST
                headers: {
                    'Accept': 'application/json', // ✅ CORRECT: Use Accept header
                }
            });

            if (!response.ok) {
                throw new Error(`API error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            
            if (!data.ok) {
                throw new Error(`API returned error: ${JSON.stringify(data)}`);
            }

            // Wait for results to be ready and fetch them
            return await this.getCheckResults(data.request_id, checkType);

        } catch (error) {
            console.error(`Check-Host API ${checkType} test failed:`, error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async getCheckResults(requestId, checkType, maxRetries = 10) {
        // Wait a bit for results to be ready
        await this.delay(2000);
        
        for (let i = 0; i < maxRetries; i++) {
            try {
                const resultsUrl = `${this.baseUrl}/check-result/${requestId}`;
                console.log(`Fetching results from: ${resultsUrl}`);
                
                const response = await fetch(resultsUrl, {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                    }
                });

                if (!response.ok) {
                    throw new Error(`Results API error: ${response.status}`);
                }

                const resultsData = await response.json();
                
                // Check if results are ready (not all null)
                const hasResults = Object.values(resultsData).some(result => result !== null && result !== undefined);
                
                if (hasResults) {
                    return this.formatResults(resultsData, checkType, requestId);
                }
                
                // Wait before retrying
                await this.delay(1000);
                
            } catch (error) {
                console.log(`Retry ${i + 1} failed:`, error.message);
                await this.delay(1000);
            }
        }
        
        throw new Error('Timeout waiting for check results');
    }

    formatResults(resultsData, checkType, requestId) {
        const nodes = this.parseNodes(resultsData, checkType);
        const successfulNodes = nodes.filter(node => node.status === 'success');
        const latencies = successfulNodes.map(node => node.latency).filter(latency => latency !== null);
        
        return {
            success: true,
            testType: checkType,
            requestId: requestId,
            nodes: nodes,
            summary: {
                totalNodes: nodes.length,
                successfulNodes: successfulNodes.length,
                successRate: nodes.length > 0 ? (successfulNodes.length / nodes.length) * 100 : 0,
                averageLatency: latencies.length > 0 ? 
                    latencies.reduce((sum, latency) => sum + latency, 0) / latencies.length : null
            }
        };
    }

    parseNodes(resultsData, checkType) {
        const nodes = [];
        
        for (const [nodeId, nodeResult] of Object.entries(resultsData)) {
            if (nodeResult === null || nodeResult === undefined) {
                // Node still processing or failed
                nodes.push({
                    node: nodeId,
                    status: 'processing',
                    latency: null,
                    error: 'Check in progress or failed'
                });
                continue;
            }
            
            let status = 'failed';
            let latency = null;
            let error = null;
            
            switch (checkType) {
                case 'ping':
                    // Ping results: [["OK", 0.044, "IP"], ["TIMEOUT", 3.005], ...]
                    if (Array.isArray(nodeResult) && nodeResult.length > 0) {
                        const firstResult = nodeResult[0];
                        if (Array.isArray(firstResult)) {
                            const successfulPings = firstResult.filter(ping => ping[0] === 'OK');
                            if (successfulPings.length > 0) {
                                status = 'success';
                                // Use latency from first successful ping
                                latency = successfulPings[0][1] * 1000; // Convert to milliseconds
                            } else {
                                error = 'All pings failed';
                            }
                        }
                    }
                    break;
                    
                case 'tcp':
                    // TCP results: [{"time": 0.03, "address": "IP"}]
                    if (Array.isArray(nodeResult) && nodeResult.length > 0) {
                        const result = nodeResult[0];
                        if (result && result.time !== undefined) {
                            status = 'success';
                            latency = result.time * 1000; // Convert to milliseconds
                        } else if (result && result.error) {
                            error = result.error;
                        }
                    }
                    break;
                    
                case 'http':
                    // HTTP results: [[1, 0.13, "OK", "200", "IP"]]
                    if (Array.isArray(nodeResult) && nodeResult.length > 0) {
                        const result = nodeResult[0];
                        if (Array.isArray(result) && result[0] === 1) { // 1 = success
                            status = 'success';
                            latency = result[1] * 1000; // Convert to milliseconds
                        } else if (Array.isArray(result)) {
                            error = result[2] || 'HTTP request failed';
                        }
                    }
                    break;
            }
            
            nodes.push({
                node: nodeId,
                status: status,
                latency: latency,
                error: error
            });
        }
        
        return nodes;
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Simplified connection test
export async function quickConnectionTest(server, port) {
    const api = new CheckHostAPI();
    
    try {
        console.log(`Testing connection to ${server}:${port}`);
        
        const [ping, tcp] = await Promise.all([
            api.testPing(server, 2), // Use fewer nodes for faster results
            api.testTCP(server, port, 2)
        ]);

        return { ping, tcp };
        
    } catch (error) {
        console.error('Quick connection test failed:', error);
        return {
            ping: { success: false, error: error.message },
            tcp: { success: false, error: error.message }
        };
    }
}

// Test function to verify API is working
export async function testAPI() {
    const api = new CheckHostAPI();
    
    console.log('Testing Check-Host.net API...');
    
    try {
        // Test with a known good server
        const pingResult = await api.testPing('google.com', 1);
        const tcpResult = await api.testTCP('google.com', 80, 1);
        
        console.log('Ping test:', pingResult.success ? '✅ SUCCESS' : '❌ FAILED');
        console.log('TCP test:', tcpResult.success ? '✅ SUCCESS' : '❌ FAILED');
        
        return {
            ping: pingResult,
            tcp: tcpResult,
            apiWorking: pingResult.success || tcpResult.success
        };
        
    } catch (error) {
        console.error('API test failed:', error);
        return {
            apiWorking: false,
            error: error.message
        };
    }
}
