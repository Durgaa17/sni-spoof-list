// shared/connection-tester.js - Enhanced with smart testing
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
            console.log('Attempting Check-Host.net API connection test...');
            results.method = 'external_api';
            
            try {
                results.externalResults = await quickConnectionTest(
                    configAnalysis.server, 
                    configAnalysis.port
                );
                
                // If external API returns fallback flag, switch to basic
                if (results.externalResults.ping?.fallback) {
                    throw new Error('External API unavailable, using fallback');
                }
                
                results.overall = determineOverallStatusFromExternal(results.externalResults);
                
            } catch (externalError) {
                console.log('External API failed, switching to fallback:', externalError);
                results.method = 'fallback';
                // Continue to fallback method
            }
        }

        // Use fallback methods if external API not used or failed
        if (results.method === 'fallback') {
            console.log('Using fallback connection testing...');
            
            // Test host reachability
            results.hostReachability = await testHostReachability(configAnalysis.server);
            
            // Only test port if host is reachable
            if (results.hostReachability.reachable) {
                results.portConnectivity = await testPortConnectivity(
                    configAnalysis.server, 
                    configAnalysis.port
                );
            }
            
            results.overall = determineOverallStatusFromFallback(results);
        }

    } catch (error) {
        console.error('Connection test completely failed:', error);
        results.overall = 'error';
        results.error = error.message;
    }

    return results;
}

function determineOverallStatusFromExternal(externalResults) {
    if (!externalResults) return 'error';
    
    const { ping, tcp, http } = externalResults;
    
    // If we have ping and TCP results
    if (ping?.success && tcp?.success) {
        return 'healthy';
    } else if (!ping?.success) {
        return 'host_unreachable';
    } else {
        return 'port_unreachable';
    }
}

function determineOverallStatusFromFallback(results) {
    if (!results.hostReachability?.reachable) {
        return 'host_unreachable';
    } else if (!results.portConnectivity?.reachable) {
        return 'port_unreachable';
    } else if (results.hostReachability.reachable && results.portConnectivity.reachable) {
        return 'healthy';
    } else {
        return 'unknown';
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

    if (connectionResults.method === 'external_api') {
        return generateExternalAPIReport(connectionResults.externalResults);
    } else {
        return generateFallbackReport(connectionResults);
    }
}

function generateExternalAPIReport(externalResults) {
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
        return {
            summary: `✅ Multi-region Test Healthy (${Math.round(avgLatency)}ms avg)`,
            details: `Tested from multiple global locations`,
            status: 'success',
            latency: avgLatency,
            method: 'external_api',
            nodesTested: ping.summary?.totalNodes || 0,
            successRate: ping.summary?.successRate || 0
        };
    } else if (!ping?.success) {
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

function generateFallbackReport(connectionResults) {
    const host = connectionResults.hostReachability;
    const port = connectionResults.portConnectivity;

    let summary, details, status;

    switch (connectionResults.overall) {
        case 'healthy':
            status = 'success';
            summary = `✅ Connection Healthy (${port.latency}ms)`;
            details = `Host reachable (${host.latency}ms), Port responsive (${port.latency}ms)`;
            break;
        
        case 'host_unreachable':
            status = 'error';
            summary = '❌ Host Unreachable';
            details = `Cannot reach server: ${host.error || 'Unknown error'}`;
            break;
        
        case 'port_unreachable':
            status = 'warning';
            summary = '⚠️ Port Not Reachable';
            details = `Host OK (${host.latency}ms) but port ${port.error}`;
            break;
        
        default:
            status = 'unknown';
            summary = '🔍 Connection Unknown';
            details = 'Test could not determine connection status';
    }

    return {
        summary,
        details,
        status,
        latency: port?.latency || host?.latency,
        timestamp: connectionResults.timestamp,
        method: 'basic_test'
    };
}
