// In the generateFallbackReport function, add mixed content handling:
function generateFallbackReport(connectionResults) {
    const host = connectionResults.hostReachability;
    const port = connectionResults.portConnectivity;
    const websocket = connectionResults.websocketConnectivity;

    let summary, details, status;

    // Handle mixed content blocking first
    if (port?.blockedByBrowser || websocket?.blockedByBrowser) {
        status = 'warning';
        summary = '🌐 Browser Security Restriction';
        details = 'Cannot test HTTP/WS ports from HTTPS page due to mixed content policy';
        
        return {
            summary,
            details,
            status,
            suggestion: 'Use the "Validate + Connection Test" button for comprehensive testing',
            method: 'browser_restricted',
            configType: connectionResults.configType
        };
    }

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
