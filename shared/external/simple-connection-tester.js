// shared/external/simple-connection-tester.js - Browser-friendly connection testing
export class SimpleConnectionTester {
    constructor() {
        this.timeout = 8000; // 8 second timeout
    }

    async testServerConnectivity(server, port, protocol = 'https') {
        const results = {
            reachable: false,
            latency: null,
            error: null,
            protocol: protocol,
            timestamp: new Date().toISOString(),
            method: 'direct_fetch'
        };

        try {
            const testUrl = `${protocol}://${server}:${port}`;
            console.log(`🔗 Testing: ${testUrl}`);
            
            const startTime = performance.now();
            
            // Use AbortController for timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.timeout);
            
            const response = await fetch(testUrl, {
                method: 'GET',
                mode: 'no-cors', // Don't worry about CORS errors
                cache: 'no-cache',
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            results.latency = Math.round(performance.now() - startTime);
            results.reachable = true;
            results.status = 'success';
            results.details = `Connected in ${results.latency}ms`;
            
        } catch (error) {
            results.error = this.analyzeError(error, server, port);
            results.reachable = false;
            results.status = 'failed';
        }

        return results;
    }

    analyzeError(error, server, port) {
        const errorMsg = error.message.toLowerCase();
        
        if (error.name === 'AbortError') {
            return `Timeout after ${this.timeout}ms - server may be slow or blocking requests`;
        }
        
        if (errorMsg.includes('failed to fetch') || errorMsg.includes('network error')) {
            return `Network error - server ${server}:${port} may be down or unreachable`;
        }
        
        if (errorMsg.includes('cors') || errorMsg.includes('cross-origin')) {
            return `Server is reachable but blocked by CORS policy (this is normal)`;
        }
        
        if (errorMsg.includes('ssl') || errorMsg.includes('certificate')) {
            return `SSL/TLS certificate error - server may have invalid certificate`;
        }
        
        return `Connection failed: ${error.message}`;
    }

    async testMultipleProtocols(server, port) {
        console.log(`🔄 Testing ${server}:${port} with multiple protocols...`);
        
        const protocols = ['https', 'http'];
        const results = [];
        
        for (const protocol of protocols) {
            const result = await this.testServerConnectivity(server, port, protocol);
            results.push(result);
            
            // If one protocol works, no need to test others
            if (result.reachable) {
                console.log(`✅ Found working protocol: ${protocol}`);
                break;
            }
            
            // Small delay between tests
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        return results;
    }

    async quickConnectionTest(server, port) {
        console.log(`🚀 Quick connection test: ${server}:${port}`);
        
        try {
            // Test multiple protocols
            const protocolTests = await this.testMultipleProtocols(server, port);
            
            // Find the first successful test
            const successfulTest = protocolTests.find(test => test.reachable);
            const allTestsFailed = protocolTests.every(test => !test.reachable);
            
            const summary = {
                server: server,
                port: port,
                reachable: !!successfulTest,
                workingProtocol: successfulTest?.protocol || null,
                latency: successfulTest?.latency || null,
                timestamp: new Date().toISOString(),
                details: this.generateSummaryDetails(protocolTests)
            };
            
            return {
                protocolTests: protocolTests,
                summary: summary,
                overall: successfulTest ? 'healthy' : 'unreachable'
            };
            
        } catch (error) {
            console.error('Quick connection test failed:', error);
            return {
                protocolTests: [],
                summary: {
                    server: server,
                    port: port,
                    reachable: false,
                    error: error.message,
                    timestamp: new Date().toISOString()
                },
                overall: 'error'
            };
        }
    }

    generateSummaryDetails(protocolTests) {
        const successful = protocolTests.filter(test => test.reachable);
        const failed = protocolTests.filter(test => !test.reachable);
        
        if (successful.length > 0) {
            const bestTest = successful[0];
            return `Server is reachable via ${bestTest.protocol.toUpperCase()} (${bestTest.latency}ms)`;
        }
        
        if (failed.length > 0) {
            const errors = failed.map(test => test.error).filter(Boolean);
            if (errors.length > 0) {
                return `Connection failed: ${errors[0]}`;
            }
        }
        
        return 'Unable to establish connection with server';
    }
}

// Main export function
export async function quickConnectionTest(server, port) {
    const tester = new SimpleConnectionTester();
    return await tester.quickConnectionTest(server, port);
}

// Utility function for basic health check
export async function basicHealthCheck(server, port = 443) {
    const tester = new SimpleConnectionTester();
    const result = await tester.testServerConnectivity(server, port, 'https');
    
    return {
        healthy: result.reachable,
        latency: result.latency,
        error: result.error,
        server: server,
        port: port
    };
}
