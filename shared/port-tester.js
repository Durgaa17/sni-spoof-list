// shared/port-tester.js - Enhanced with mixed content handling
export async function testPortConnectivity(server, port, security = 'tls') {
    const results = {
        reachable: false,
        latency: null,
        error: null,
        protocol: security === 'tls' ? 'https' : 'http',
        timestamp: new Date().toISOString(),
        blockedByBrowser: false
    };

    try {
        const startTime = performance.now();
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        // Determine protocol based on security setting
        const protocol = security === 'tls' ? 'https' : 'http';
        const testUrl = `${protocol}://${server}:${port}`;

        console.log(`Testing ${protocol} connectivity to: ${testUrl}`);

        try {
            const response = await fetch(testUrl, {
                method: 'HEAD',
                mode: 'no-cors',
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            results.reachable = true;
            results.latency = Math.round(performance.now() - startTime);
            results.method = protocol;
            results.status = 'success';
            
        } catch (protocolError) {
            clearTimeout(timeoutId);
            
            // Check if this is a mixed content error
            if (isMixedContentError(protocolError, protocol)) {
                results.blockedByBrowser = true;
                results.error = `Mixed Content Blocked: Cannot test HTTP from HTTPS page`;
                results.suggestion = 'Use Validate + Connection Test for HTTP port testing';
                return results;
            }
            
            // If the preferred protocol fails, try the alternative
            const fallbackProtocol = protocol === 'https' ? 'http' : 'https';
            const fallbackUrl = `${fallbackProtocol}://${server}:${port}`;
            
            console.log(`Primary protocol failed, trying fallback: ${fallbackUrl}`);
            
            try {
                const fallbackStartTime = performance.now();
                const fallbackController = new AbortController();
                const fallbackTimeoutId = setTimeout(() => fallbackController.abort(), 5000);
                
                const fallbackResponse = await fetch(fallbackUrl, {
                    method: 'HEAD',
                    mode: 'no-cors',
                    signal: fallbackController.signal
                });
                
                clearTimeout(fallbackTimeoutId);
                results.reachable = true;
                results.latency = Math.round(performance.now() - fallbackStartTime);
                results.method = fallbackProtocol;
                results.status = 'success_fallback';
                results.note = `Used ${fallbackProtocol} instead of ${protocol}`;
                
            } catch (fallbackError) {
                // Check if fallback also has mixed content error
                if (isMixedContentError(fallbackError, fallbackProtocol)) {
                    results.blockedByBrowser = true;
                    results.error = `Mixed Content Blocked: Cannot test HTTP from HTTPS page`;
                    results.suggestion = 'Use Validate + Connection Test for HTTP port testing';
                } else {
                    results.error = `Port ${port} not reachable via ${protocol} or ${fallbackProtocol}`;
                    results.details = getErrorDetails(fallbackError);
                }
            }
        }

    } catch (error) {
        if (error.name === 'AbortError') {
            results.error = 'Connection timeout (5s)';
        } else {
            results.error = error.message;
        }
    }

    return results;
}

// Enhanced WebSocket testing with mixed content handling
export async function testWebSocketConnectivity(server, port, security = 'tls', path = '/') {
    const results = {
        reachable: false,
        latency: null,
        error: null,
        protocol: 'websocket',
        timestamp: new Date().toISOString(),
        blockedByBrowser: false
    };

    try {
        const startTime = performance.now();
        const wsProtocol = security === 'tls' ? 'wss' : 'ws';
        const wsUrl = `${wsProtocol}://${server}:${port}${path}`;
        
        console.log(`Testing WebSocket connectivity to: ${wsUrl}`);

        // Check for mixed content before attempting WebSocket
        if (wsProtocol === 'ws' && window.location.protocol === 'https:') {
            results.blockedByBrowser = true;
            results.error = 'Mixed Content Blocked: Cannot test WS from HTTPS page';
            results.suggestion = 'Use Validate + Connection Test for WebSocket testing';
            return results;
        }

        // WebSocket test with timeout
        const wsTest = new Promise((resolve, reject) => {
            const socket = new WebSocket(wsUrl);
            const timeoutId = setTimeout(() => {
                socket.close();
                reject(new Error('WebSocket connection timeout (3s)'));
            }, 3000);

            socket.onopen = () => {
                clearTimeout(timeoutId);
                results.latency = Math.round(performance.now() - startTime);
                socket.close();
                resolve(true);
            };

            socket.onerror = (error) => {
                clearTimeout(timeoutId);
                reject(new Error('WebSocket connection failed'));
            };
        });

        await wsTest;
        results.reachable = true;
        results.status = 'success';

    } catch (error) {
        results.error = error.message;
    }

    return results;
}

function isMixedContentError(error, protocol) {
    // Mixed content errors are tricky to detect directly, but we can infer:
    const errorMessage = error.message.toLowerCase();
    
    // Common mixed content indicators
    if (protocol === 'http' && window.location.protocol === 'https:') {
        return true;
    }
    
    if (errorMessage.includes('mixed content') ||
        errorMessage.includes('blocked by client') ||
        errorMessage.includes('insecure') ||
        errorMessage.includes('scheme')) {
        return true;
    }
    
    return false;
}

function getErrorDetails(error) {
    if (error.name === 'AbortError') return 'Request timed out';
    if (error.message.includes('CORS')) return 'CORS policy blocked the request';
    if (error.message.includes('Failed to fetch')) return 'Network error or domain not resolved';
    if (error.message.includes('Mixed Content')) return 'Blocked by browser mixed content policy';
    return error.message;
}
