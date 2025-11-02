// shared/connection-tester.js - Enhanced with protocol awareness
import { testHostReachability } from './ping-tester.js';
import { testPortConnectivity, testWebSocketConnectivity } from './port-tester.js';
import { quickConnectionTest } from './external/check-host-api.js';

export async function testConnection(configAnalysis, useExternalAPI = true) {
    const results = {
        method: 'fallback',
        hostReachability: null,
        portConnectivity: null,
        websocketConnectivity: null,
        externalResults: null,
        overall: 'unknown',
        timestamp: new Date().toISOString(),
        configType: getConfigType(configAnalysis)
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
                
                if (results.externalResults.ping?.fallback) {
                    throw new Error('External API unavailable, using fallback');
                }
                
                results.overall = determineOverallStatusFromExternal(results.externalResults);
                
            } catch (externalError) {
                console.log('External API failed, switching to fallback:', externalError);
                results.method = 'fallback';
            }
        }

        // Use fallback methods if external API not used or failed
        if (results.method === 'fallback') {
            console.log('Using protocol-aware fallback testing...');
            
            // Test host reachability
            results.hostReachability = await testHostReachability(configAnalysis.server);
            
            // Only test port if host is reachable
            if (results.hostReachability.reachable) {
                // Test regular port connectivity
                results.portConnectivity = await testPortConnectivity(
                    configAnalysis.server, 
                    configAnalysis.port,
                    configAnalysis.security
                );
                
                // Additional WebSocket test for WS configurations
                if (configAnalysis.type === 'ws') {
                    results.websocketConnectivity = await testWebSocketConnectivity(
                        configAnalysis.server,
                        configAnalysis.port,
                        configAnalysis.security,
                        configAnalysis.path || '/'
                    );
                }
            }
            
            results.overall = determineOverallStatusFromFallback(results, configAnalysis);
        }

    } catch (error) {
        console.error('Connection test completely failed:', error);
        results.overall = 'error';
        results.error = error.message;
    }

    return results;
}

function getConfigType(analysis) {
    if (analysis.type === 'ws') {
        return analysis.security === 'tls' ? 'websocket_tls' : 'websocket_plain';
    }
    return analysis.security === 'tls' ? 'tcp_tls' : 'tcp_plain';
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

function determineOverallStatusFromFallback(results, configAnalysis) {
    if (!results.hostReachability?.reachable) {
        return 'host_unreachable';
    }
    
    // For WebSocket configs, check WebSocket connectivity specifically
    if (configAnalysis.type === 'ws' && results.websocketConnectivity) {
        if (!results.websocketConnectivity.reachable) {
            return 'websocket_unreachable';
        }
    }
    
    // For regular TCP/HTTP configs, check port connectivity
    if (!results.portConnectivity?.reachable) {
        return 'port_unreachable';
    }
    
    if (results.hostReachability.reachable && results.portConnectivity.reachable) {
        return 'healthy';
    }
    
    return 'unknown';
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
    const websocket = connectionResults.websocketConnectivity;

    let summary, details, status;

    switch (connectionResults.overall) {
        case 'healthy':
            status = 'success';
            if (websocket?.reachable) {
                summary = `✅ WebSocket Healthy (${websocket.latency}ms)`;
                details = `Host reachable (${host.latency}ms), WebSocket responsive (${websocket.latency}ms)`;
            } else {
                summary = `✅ Connection Healthy (${port.latency}ms)`;
                details = `Host reachable (${host.latency}ms), ${port.protocol?.toUpperCase()} responsive (${port.latency}ms)`;
                if (port.note) details += ` - ${port.note}`;
            }
            break;
        
        case 'host_unreachable':
            status = 'error';
            summary = '❌ Host Unreachable';
            details = `Cannot reach server: ${host.error || 'Unknown error'}`;
            break;
        
        case 'port_unreachable':
            status = 'warning';
            summary = '⚠️ Port Not Reachable';
            details = `Host OK (${host.latency}ms) but ${port.protocol?.toUpperCase()} port ${port.error}`;
            break;
            
        case 'websocket_unreachable':
            status = 'warning';
            summary = '⚠️ WebSocket Not Reachable';
            details = `Host OK (${host.latency}ms) but WebSocket failed: ${websocket.error}`;
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
        latency: websocket?.latency || port?.latency || host?.latency,
        timestamp: connectionResults.timestamp,
        method: 'protocol_aware_test',
        configType: connectionResults.configType
    };
}
