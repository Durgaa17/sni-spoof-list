// shared/connection-tester.js - Simplified API-only testing
import { testHostReachability } from './ping-tester.js';
import { testPortConnectivity } from './port-tester.js';
import { quickConnectionTest } from './external/check-host-api.js';

export async function testConnection(configAnalysis, useExternalAPI = true) {
    const results = {
        method: 'external_api', // Always use API for reliable testing
        externalResults: null,
        overall: 'unknown',
        timestamp: new Date().toISOString(),
        configType: getConfigType(configAnalysis)
    };

    try {
        console.log('Using Check-Host.net API for reliable connection testing...');
        
        results.externalResults = await quickConnectionTest(
            configAnalysis.server, 
            configAnalysis.port
        );
        
        results.overall = determineOverallStatusFromExternal(results.externalResults);
        
    } catch (error) {
        console.log('External API failed:', error);
        results.overall = 'error';
        results.error = error.message;
    }

    return results;
}

function getConfigType(analysis) {
    return analysis.security === 'tls' ? 'https' : 'http';
}

function determineOverallStatusFromExternal(externalResults) {
    if (!externalResults) return 'error';
    
    const { ping, tcp, http } = externalResults;
    
    if (ping?.success && tcp?.success) {
        return 'healthy';
    } else if (!ping?.success) {
        return 'host_unreachable';
    } else {
        return 'port_unreachable';
    }
}

export function generateConnectionReport(connectionResults) {
    if (!connectionResults || connectionResults.overall === 'error') {
        return {
            summary: 'Connection test failed',
            details: 'External API is not responding',
            status: 'error',
            method: 'external_api'
        };
    }

    return generateExternalAPIReport(connectionResults);
}

function generateExternalAPIReport(connectionResults) {
    const externalResults = connectionResults.externalResults;
    
    if (!externalResults) {
        return {
            summary: 'External API unavailable',
            details: 'Check-Host.net API is not responding',
            status: 'error',
            method: 'external_api'
        };
    }

    const { ping, tcp, http } = externalResults;
    
    if (ping?.success && tcp?.success) {
        const avgLatency = ping.summary?.averageLatency || tcp.summary?.averageLatency || 0;
        const successRate = ping.summary?.successRate || tcp.summary?.successRate || 0;
        
        return {
            summary: `✅ Connection Healthy (${Math.round(avgLatency)}ms avg)`,
            details: `Tested from ${ping.summary?.totalNodes || 0} locations (${Math.round(successRate)}% success)`,
            status: 'success',
            latency: avgLatency,
            method: 'external_api',
            nodesTested: ping.summary?.totalNodes || 0,
            successRate: successRate
        };
    } else if (!ping?.success) {
        return {
            summary: '❌ Host Unreachable',
            details: 'Server not reachable from test locations',
            status: 'error',
            method: 'external_api'
        };
    } else {
        return {
            summary: '⚠️ Port Not Reachable',
            details: 'Server is reachable but port is not responding',
            status: 'warning', 
            method: 'external_api'
        };
    }
}

// Remove unused functions:
// - generateMixedContentReport
// - generateFallbackReport  
// - determineOverallStatusFromFallback
// - shouldUseExternalAPI
