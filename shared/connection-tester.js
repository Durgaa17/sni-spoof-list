// shared/connection-tester.js - Main connection test coordinator
import { testHostReachability } from './ping-tester.js';
import { testPortConnectivity } from './port-tester.js';

export async function testConnection(configAnalysis) {
    const results = {
        hostReachability: null,
        portConnectivity: null,
        overall: 'unknown',
        timestamp: new Date().toISOString()
    };

    try {
        // Test 1: Host reachability
        console.log(`Testing host reachability: ${configAnalysis.server}`);
        results.hostReachability = await testHostReachability(configAnalysis.server);

        // Test 2: Port connectivity
        console.log(`Testing port connectivity: ${configAnalysis.server}:${configAnalysis.port}`);
        results.portConnectivity = await testPortConnectivity(configAnalysis.server, configAnalysis.port);

        // Determine overall status
        if (results.hostReachability.reachable && results.portConnectivity.reachable) {
            results.overall = 'healthy';
        } else if (!results.hostReachability.reachable) {
            results.overall = 'host_unreachable';
        } else {
            results.overall = 'port_unreachable';
        }

    } catch (error) {
        results.overall = 'error';
        results.error = error.message;
    }

    return results;
}

export function generateConnectionReport(connectionResults) {
    if (!connectionResults || connectionResults.overall === 'error') {
        return {
            summary: 'Connection test failed',
            details: 'Could not complete connection tests',
            status: 'error'
        };
    }

    const host = connectionResults.hostReachability;
    const port = connectionResults.portConnectivity;

    let summary, details, status;

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

    return {
        summary,
        details,
        status,
        latency: port.latency || host.latency,
        timestamp: connectionResults.timestamp
    };
}
