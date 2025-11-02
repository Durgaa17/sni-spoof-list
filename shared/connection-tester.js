// shared/connection-tester.js - Simplified with new implementation
import { quickConnectionTest } from './external/simple-connection-tester.js';

export async function testConnection(configAnalysis) {
    console.log(`🔍 Testing connection for: ${configAnalysis.server}:${configAnalysis.port}`);
    
    try {
        const connectionResult = await quickConnectionTest(
            configAnalysis.server, 
            configAnalysis.port
        );
        
        return {
            method: 'browser_direct',
            result: connectionResult,
            overall: connectionResult.overall,
            timestamp: new Date().toISOString()
        };
        
    } catch (error) {
        console.error('Connection test failed:', error);
        return {
            method: 'browser_direct',
            result: null,
            overall: 'error',
            error: error.message,
            timestamp: new Date().toISOString()
        };
    }
}

export function generateConnectionReport(connectionResults) {
    if (!connectionResults || connectionResults.overall === 'error') {
        return {
            summary: 'Connection test failed',
            details: 'Could not complete connection test',
            status: 'error',
            method: connectionResults?.method || 'unknown'
        };
    }

    const result = connectionResults.result;
    
    if (!result || !result.summary) {
        return {
            summary: 'No test results',
            details: 'Connection test did not return valid results',
            status: 'unknown',
            method: connectionResults.method
        };
    }

    const summary = result.summary;
    
    if (summary.reachable) {
        return {
            summary: `✅ Connection Healthy (${summary.latency}ms)`,
            details: `Server reachable via ${summary.workingProtocol?.toUpperCase() || 'HTTPS'}`,
            status: 'success',
            latency: summary.latency,
            method: connectionResults.method,
            protocol: summary.workingProtocol
        };
    } else {
        return {
            summary: '❌ Connection Failed',
            details: summary.details || 'Server is not reachable',
            status: 'error',
            method: connectionResults.method,
            error: summary.error
        };
    }
}

// Remove all Check-Host.net related functions
export { quickConnectionTest } from './external/simple-connection-tester.js';
