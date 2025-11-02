// shared/connection-tester.js - Complete enhanced version
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
        configType: getConfigType(configAnalysis),
        warnings: []
    };

    try {
        // Check if we need external API due to mixed content restrictions
        const needsExternalAPI = shouldUseExternalAPI(configAnalysis);
        
        if (useExternalAPI || needsExternalAPI) {
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
                
                // Add warning if we're using external API due to mixed content
                if (needsExternalAPI && !useExternalAPI) {
                    results.warnings.push('Auto-switched to external API due to mixed content restrictions');
                }
                
            } catch (externalError) {
                console.log('External API failed, switching to fallback:', externalError);
                results.method = 'fallback';
                results.warnings.push('External API unavailable, using basic tests');
                
                // If external API was required due to mixed content, we can't test properly
                if (needsExternalAPI) {
                    results.overall = 'mixed_content_blocked';
                    return results;
                }
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

function shouldUseExternalAPI(configAnalysis) {
    // We need external API if:
    // 1. Testing HTTP protocol from HTTPS page (mixed content)
    // 2. Testing WebSocket (ws://) from HTTPS page
    const isHttpsPage = window.location.protocol === 'https:';
    const isHttpConfig = configAnalysis.security === 'none';
    const isWebSocketConfig = configAnalysis.type === 'ws';
    
    return isHttpsPage && (isHttpConfig || (isWebSocketConfig && !configAnalysis.security === 'tls'));
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

function determineOverallStatusFromFallback(results, configAnalysis) {
    if (!results.hostReachability?.reachable) {
        return 'host_unreachable';
    }
    
    // Check for mixed content blocking
    if (results.portConnectivity?.blockedByBrowser || results.websocketConnectivity?.blockedByBrowser) {
        return 'mixed_content_blocked';
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

    // Handle mixed content blocking as special case
    if (connectionResults.overall === 'mixed_content_blocked') {
        return generateMixedContentReport(connectionResults);
    }

    if (connectionResults.method === 'external_api') {
        return generateExternalAPIReport(connectionResults);
    } else {
        return generateFallbackReport(connectionResults);
    }
}

function generateMixedContentReport(connectionResults) {
    const configType = connectionResults.configType;
    let protocolInfo = '';
    
    if (configType === 'tcp_plain') {
        protocolInfo = 'HTTP (port 80, 8080, etc.)';
    } else if (configType === 'websocket_plain') {
        protocolInfo = 'WebSocket (ws://)';
    } else {
        protocolInfo = 'non-HTTPS protocol';
    }
    
    return {
        summary: '🌐 Browser Security Restriction',
        details: `Cannot test ${protocolInfo} from HTTPS page`,
        status: 'warning',
        method: 'browser_restricted',
        suggestion: 'Use "Validate + Connection Test" for external API testing',
        configType: connectionResults.configType
    };
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
            summary: `✅ Multi-region Test Healthy (${Math.round(avgLatency)}ms avg)`,
            details: `Tested from ${ping.summary?.totalNodes || 0} global locations (${Math.round(successRate)}% success)`,
            status: 'success',
            latency: avgLatency,
            method: 'external_api',
            nodesTested: ping.summary?.totalNodes || 0,
            successRate: successRate,
            warnings: connectionResults.warnings
        };
    } else if (!ping?.success) {
        return {
            summary: '❌ Host Unreachable (Multi-region)',
            details: 'Host not reachable from multiple test locations',
            status: 'error',
            method: 'external_api',
            warnings: connectionResults.warnings
        };
    } else {
        return {
            summary: '⚠️ Port Issues (Multi-region)',
            details: 'Host reachable but port connectivity issues',
            status: 'warning', 
            method: 'external_api',
            warnings: connectionResults.warnings
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
                const protocolName = port.protocol === 'https' ? 'HTTPS' : 'HTTP';
                details = `Host reachable (${host.latency}ms), ${protocolName} responsive (${port.latency}ms)`;
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
            const protocolName = port?.protocol === 'https' ? 'HTTPS' : 'HTTP';
            details = `Host OK (${host.latency}ms) but ${protocolName} port: ${port?.error || 'connection failed'}`;
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

    const report = {
        summary,
        details,
        status,
        latency: websocket?.latency || port?.latency || host?.latency,
        timestamp: connectionResults.timestamp,
        method: 'basic_test',
        configType: connectionResults.configType
    };

    // Add warnings if any
    if (connectionResults.warnings && connectionResults.warnings.length > 0) {
        report.warnings = connectionResults.warnings;
    }

    return report;
}

// Utility function to get connection test recommendations
export function getTestRecommendation(configAnalysis) {
    const isHttpsPage = window.location.protocol === 'https:';
    const isHttpConfig = configAnalysis.security === 'none';
    const isWebSocketConfig = configAnalysis.type === 'ws';
    
    if (isHttpsPage && (isHttpConfig || (isWebSocketConfig && configAnalysis.security === 'none'))) {
        return {
            recommended: 'external_api',
            reason: 'HTTP/WS testing requires external API from HTTPS pages',
            suggestion: 'Use "Validate + Connection Test" button'
        };
    }
    
    return {
        recommended: 'any',
        reason: 'HTTPS configurations can be tested directly',
        suggestion: 'Both test methods will work'
    };
}

// Batch testing for multiple configurations
export async function batchConnectionTest(configs, useExternalAPI = true) {
    const results = [];
    
    for (const config of configs) {
        try {
            const analysis = config.analysis || await analyzeConfig(config.config);
            const testResult = await testConnection(analysis, useExternalAPI);
            results.push({
                config: config.config,
                analysis: analysis,
                connection: testResult,
                report: generateConnectionReport(testResult)
            });
        } catch (error) {
            results.push({
                config: config.config,
                error: error.message,
                connection: null,
                report: {
                    summary: 'Test failed',
                    details: error.message,
                    status: 'error'
                }
            });
        }
    }
    
    return results;
}

// Quick health check (lightweight version)
export async function quickHealthCheck(server, port) {
    try {
        const startTime = performance.now();
        const controller = new AbortController();
        setTimeout(() => controller.abort(), 3000);
        
        // Try HTTPS first (most common)
        const response = await fetch(`https://${server}:${port}`, {
            method: 'HEAD',
            mode: 'no-cors',
            signal: controller.signal
        });
        
        return {
            healthy: true,
            latency: Math.round(performance.now() - startTime),
            protocol: 'https'
        };
    } catch (error) {
        return {
            healthy: false,
            error: error.message,
            protocol: 'https'
        };
    }
}

// At the VERY END of shared/connection-tester.js - Add this:

// Export all main functions
export {
    testConnection,
    generateConnectionReport,
    getTestRecommendation,
    batchConnectionTest,
    quickHealthCheck
};

// Or as default export for easier importing
export default {
    testConnection,
    generateConnectionReport, 
    getTestRecommendation,
    batchConnectionTest,
    quickHealthCheck
};
