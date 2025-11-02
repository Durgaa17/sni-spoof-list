// shared/external/check-host-api.js - CORRECT URLS
import { EXTERNAL_APIS } from './api-config.js';

export class CheckHostAPI {
    constructor() {
        this.baseUrl = EXTERNAL_APIS.CHECK_HOST.BASE_URL;
    }

    async testPing(hostname, maxNodes = 2) {
        // ✅ CORRECT: host=hostname (no port for ping)
        const params = { host: hostname, max_nodes: maxNodes };
        return this.makeRequest('ping', params);
    }

    async testTCP(hostname, port, maxNodes = 2) {
        // ✅ CORRECT: host=hostname:port
        const params = { host: `${hostname}:${port}`, max_nodes: maxNodes };
        return this.makeRequest('tcp', params);
    }

    async testHTTP(hostname, port = 443, maxNodes = 2) {
        // ✅ CORRECT: host=https://hostname:port or http://hostname:port
        const protocol = port === 443 ? 'https' : 'http';
        const params = { host: `${protocol}://${hostname}:${port}`, max_nodes: maxNodes };
        return this.makeRequest('http', params);
    }

    async makeRequest(checkType, params) {
        try {
            // ✅ CORRECT: Build URL with query parameters
            const endpoint = `/check-${checkType}`;
            const queryString = new URLSearchParams(params).toString();
            const url = `${this.baseUrl}${endpoint}?${queryString}`;
            
            console.log(`🌐 Making API request: ${url}`);
            
            const response = await fetch(url, {
                method: 'GET', // ✅ CORRECT: GET request
                headers: {
                    'Accept': 'application/json', // ✅ CORRECT: Accept header
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            
            if (data.ok !== 1) {
                throw new Error(`API error: ${JSON.stringify(data)}`);
            }

            console.log(`✅ Request created: ${data.request_id}`);
            
            // Wait and get results
            return await this.getCheckResults(data.request_id, checkType);

        } catch (error) {
            console.error(`❌ API ${checkType} test failed:`, error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async getCheckResults(requestId, checkType, maxRetries = 8) {
        console.log(`⏳ Waiting for results: ${requestId}`);
        
        // Wait for initial processing
        await this.delay(2000);
        
        for (let i = 0; i < maxRetries; i++) {
            try {
                const resultsUrl = `${this.baseUrl}/check-result/${requestId}`;
                console.log(`🔍 Checking results (attempt ${i + 1}): ${resultsUrl}`);
                
                const response = await fetch(resultsUrl, {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                    }
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }

                const resultsData = await response.json();
                
                // Check if we have any non-null results
                const hasValidResults = Object.values(resultsData).some(
                    result => result !== null && result !== undefined
                );
                
                if (hasValidResults) {
                    console.log(`✅ Got results for ${requestId}`);
                    return this.formatResults(resultsData, checkType, requestId);
                }
                
                console.log(`⏳ Results not ready, waiting... (${i + 1}/${maxRetries})`);
                await this.delay(1500);
                
            } catch (error) {
                console.log(`⚠️ Retry ${i + 1} failed:`, error.message);
                await this.delay(1500);
            }
        }
        
        throw new Error(`Timeout: No results after ${maxRetries} retries`);
    }

    formatResults(resultsData, checkType, requestId) {
        const nodes = this.parseNodes(resultsData, checkType);
        const successfulNodes = nodes.filter(node => node.status === 'success');
        const latencies = successfulNodes.map(node => node.latency).filter(latency => latency !== null);
        
        const summary = {
            totalNodes: nodes.length,
            successfulNodes: successfulNodes.length,
            successRate: nodes.length > 0 ? Math.round((successfulNodes.length / nodes.length) * 100) : 0,
            averageLatency: latencies.length > 0 ? 
                Math.round(latencies.reduce((sum, latency) => sum + latency, 0) / latencies.length) : null
        };

        return {
            success: true,
            testType: checkType,
            requestId: requestId,
            nodes: nodes,
            summary: summary
        };
    }

    parseNodes(resultsData, checkType) {
        const nodes = [];
        
        for (const [nodeId, nodeResult] of Object.entries(resultsData)) {
            const nodeInfo = {
                node: nodeId,
                status: 'unknown',
                latency: null,
                error: null
            };
            
            if (nodeResult === null) {
                nodeInfo.status = 'processing';
                nodeInfo.error = 'Check in progress';
                nodes.push(nodeInfo);
                continue;
            }
            
            if (nodeResult === undefined) {
                nodeInfo.status = 'failed';
                nodeInfo.error = 'No result data';
                nodes.push(nodeInfo);
                continue;
            }
            
            // Parse based on check type
            switch (checkType) {
                case 'ping':
                    this.parsePingResult(nodeInfo, nodeResult);
                    break;
                case 'tcp':
                    this.parseTcpResult(nodeInfo, nodeResult);
                    break;
                case 'http':
                    this.parseHttpResult(nodeInfo, nodeResult);
                    break;
            }
            
            nodes.push(nodeInfo);
        }
        
        return nodes;
    }

    parsePingResult(nodeInfo, nodeResult) {
        // Ping format: [["OK", 0.044, "IP"], ["TIMEOUT", 3.005], ...]
        if (Array.isArray(nodeResult) && nodeResult.length > 0) {
            const pingResults = nodeResult[0];
            if (Array.isArray(pingResults)) {
                const successfulPings = pingResults.filter(ping => 
                    Array.isArray(ping) && ping[0] === 'OK'
                );
                
                if (successfulPings.length > 0) {
                    nodeInfo.status = 'success';
                    nodeInfo.latency = successfulPings[0][1] * 1000; // Convert to ms
                } else {
                    nodeInfo.status = 'failed';
                    nodeInfo.error = 'All pings failed';
                }
            }
        }
    }

    parseTcpResult(nodeInfo, nodeResult) {
        // TCP format: [{"time": 0.03, "address": "IP"}]
        if (Array.isArray(nodeResult) && nodeResult.length > 0) {
            const tcpResult = nodeResult[0];
            if (tcpResult && typeof tcpResult === 'object') {
                if (tcpResult.time !== undefined) {
                    nodeInfo.status = 'success';
                    nodeInfo.latency = tcpResult.time * 1000; // Convert to ms
                } else if (tcpResult.error) {
                    nodeInfo.status = 'failed';
                    nodeInfo.error = tcpResult.error;
                }
            }
        }
    }

    parseHttpResult(nodeInfo, nodeResult) {
        // HTTP format: [[1, 0.13, "OK", "200", "IP"]]
        if (Array.isArray(nodeResult) && nodeResult.length > 0) {
            const httpResult = nodeResult[0];
            if (Array.isArray(httpResult)) {
                if (httpResult[0] === 1) { // 1 = success
                    nodeInfo.status = 'success';
                    nodeInfo.latency = httpResult[1] * 1000; // Convert to ms
                } else {
                    nodeInfo.status = 'failed';
                    nodeInfo.error = httpResult[2] || 'HTTP request failed';
                }
            }
        }
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Test function with exact URLs
export async function testExactURLs() {
    const testUrls = [
        'https://check-host.net/check-ping?host=google.com&max_nodes=1',
        'https://check-host.net/check-tcp?host=google.com:80&max_nodes=1',
        'https://check-host.net/check-http?host=https://google.com&max_nodes=1'
    ];
    
    console.log('🧪 Testing exact URLs from documentation:');
    
    for (const url of testUrls) {
        try {
            console.log(`🔗 Testing: ${url}`);
            const response = await fetch(url, {
                headers: { 'Accept': 'application/json' }
            });
            
            if (response.ok) {
                const data = await response.json();
                console.log(`✅ SUCCESS: ${data.request_id}`);
            } else {
                console.log(`❌ FAILED: HTTP ${response.status}`);
            }
        } catch (error) {
            console.log(`❌ ERROR: ${error.message}`);
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
}

export async function quickConnectionTest(server, port) {
    const api = new CheckHostAPI();
    
    try {
        console.log(`🚀 Testing ${server}:${port}`);
        
        const [ping, tcp] = await Promise.all([
            api.testPing(server, 2),
            api.testTCP(server, port, 2)
        ]);

        return { ping, tcp };
        
    } catch (error) {
        console.error('❌ Connection test failed:', error);
        return {
            ping: { success: false, error: error.message },
            tcp: { success: false, error: error.message }
        };
    }
}
