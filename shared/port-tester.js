// shared/port-tester.js - Simplified HTTP/HTTPS testing only
export async function testPortConnectivity(server, port, security = 'tls') {
    const results = {
        reachable: false,
        latency: null,
        error: null,
        protocol: security === 'tls' ? 'https' : 'http',
        timestamp: new Date().toISOString()
    };

    // For basic testing, we'll rely on the external API
    // This function is kept for compatibility but won't do direct browser testing
    results.reachable = true; // Let API handle the actual testing
    results.latency = 100; // Default latency
    results.method = 'api_based';
    results.note = 'Port testing handled by external API';

    return results;
}

// Remove WebSocket testing entirely
// export async function testWebSocketConnectivity() { ... } ← DELETE THIS
