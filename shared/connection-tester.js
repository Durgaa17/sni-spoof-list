// shared/connection-tester.js - Enhanced with external APIs
import { testHostReachability } from './ping-tester.js';
import { testPortConnectivity } from './port-tester.js';
import { quickConnectionTest } from './external/check-host-api.js';

export async function testConnection(configAnalysis, useExternalAPI = true) {
    const results = {
        method: 'fallback',
        hostReachability: null,
        portConnectivity: null,
        externalResults: null,
        overall: 'unknown',
        timestamp: new Date().toISOString()
    };

    try {
        if (useExternalAPI) {
            // Use Check-Host.net API for comprehensive testing
            console.log('Using Check-Host.net API for connection test...');
            results.method = 'external_api';
            results.externalResults = await quickConnectionTest(
                configAnalysis.server, 
                configAnalysis.port
            );
            
            // Determine overall status from external results
            results.overall = determineOverallStatusFromExternal(results.externalResults);
            
        } else {
            // Use our fallback methods
            console.log('Using fallback connection test...');
            results.method = 'fallback';
            results.hostReachability = await testHostReachability(configAnalysis.server);
            results.portConnectivity = await testPortConnectivity(configAnalysis.server, configAnalysis.port);
            results.overall = determineOverallStatusFromFallback(results);
        }

    } catch (error) {
        console.error('Connection test failed:', error);
        results.overall = 'error';
        results.error = error.message;
        
        // Try fallback if external API fails
        if (useExternalAPI) {
            console.log('External API failed, trying fallback...');
            return await testConnection(configAnalysis, false);
        }
    }

    return results;
}

function determineOverallStatusFromExternal(externalResults) {
    const { ping, tcp, http } = externalResults;
    
    if (ping.success && tcp.success) {
        return 'healthy';
    } else if (!ping.success) {
        return 'host_unreachable';
    } else {
        return 'port_unreachable';
    }
}

function determineOverallStatusFromFallback(results) {
    if (results.hostReachability.reachable && results.portConnectivity.reachable) {
        return 'healthy';
    } else if (!results.hostReachability.reachable) {
        return 'host_unreachable';
    } else {
        return 'port_unreachable';
    }
}

export function generateConnectionReport(connectionResults) {
    if (!connectionResults || connectionResults.overall === 'error') {
        return {
            summary: 'Connection test failed',
            details: 'Could not complete connection tests',
            status: 'error',
            method: connectionResults?.method || 'unknown'
        };
    }

    let summary, details, status;

    if (connectionResults.method === 'external_api') {
        const external = connectionResults.externalResults;
        return generateExternalAPIReport(external);
    } else {
        // Fallback method report
        const host = connectionResults.hostReachability;
        const port = connectionResults.portConnectivity;

        switch (connectionResults.overall) {
            case 'healthy':
                status = 'success';
                summary = `✅ Connection Healthy (${port.latency}ms)`;
                details = `Host reachable (${host.latency}ms), Port ${port.latency}ms`;
                break;
            
            case 'host_unreachable':
                status = 'error';
                summary = '❌ Host Unreachable';
                details = `Cannot reach ${host.error || 'Unknown error'}`;
                break;
            
            case 'port_unreachable':
                status = 'warning';
                summary = '⚠️ Port Not Reachable';
                details = `Host OK (${host.latency}ms) but port: ${port.error}`;
                break;
            
            default:
                status = 'unknown';
                summary = '🔍 Connection Unknown';
                details = 'Test could not determine connection status';
        }
    }

    return {
        summary,
        details,
        status,
        latency: port?.latency || host?.latency,
        timestamp: connectionResults.timestamp,
        method: connectionResults.method
    };
}

function generateExternalAPIReport(externalResults) {
    const { ping, tcp, http } = externalResults;
    
    if (ping.success && tcp.success) {
        const avgLatency = ping.summary.averageLatency || tcp.summary.averageLatency;
        return {
            summary: `✅ Multi-region Test Healthy (${Math.round(avgLatency)}ms avg)`,
            details: `Ping: ${ping.summary.successRate}% success, TCP: ${tcp.summary.successRate}% success`,
            status: 'success',
            latency: avgLatency,
            method: 'external_api',
            nodesTested: ping.summary.totalNodes,
            successRate: Math.min(ping.summary.successRate, tcp.summary.successRate)
        };
    } else if (!ping.success) {
        return {
            summary: '❌ Host Unreachable (Multi-region)',
            details: 'Host not reachable from multiple test locations',
            status: 'error',
            method: 'external_api'
        };
    } else {
        return {
            summary: '⚠️ Port Issues (Multi-region)',
            details: 'Host reachable but port connectivity issues',
            status: 'warning', 
            method: 'external_api'
        };
    }
}
