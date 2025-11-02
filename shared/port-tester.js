// shared/port-tester.js - Enhanced with real testing
export async function testPortConnectivity(server, port) {
    const results = {
        reachable: false,
        latency: null,
        error: null,
        timestamp: new Date().toISOString()
    };

    try {
        const startTime = performance.now();
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        try {
            // Try HTTPS first (common for VLESS)
            const response = await fetch(`https://${server}:${port}`, {
                method: 'HEAD',
                mode: 'no-cors',
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            results.reachable = true;
            results.latency = Math.round(performance.now() - startTime);
            results.method = 'https';
            
        } catch (httpsError) {
            clearTimeout(timeoutId);
            
            // If HTTPS fails, try HTTP (for port 80/8080)
            if (port === '80' || port === 80 || port === '8080' || port === 8080) {
                try {
                    const httpStartTime = performance.now();
                    const httpController = new AbortController();
                    const httpTimeoutId = setTimeout(() => httpController.abort(), 5000);
                    
                    const httpResponse = await fetch(`http://${server}:${port}`, {
                        method: 'HEAD',
                        mode: 'no-cors',
                        signal: httpController.signal
                    });
                    
                    clearTimeout(httpTimeoutId);
                    results.reachable = true;
                    results.latency = Math.round(performance.now() - httpStartTime);
                    results.method = 'http';
                    
                } catch (httpError) {
                    results.error = `Port ${port} not reachable via HTTP or HTTPS`;
                }
            } else {
                results.error = `Port ${port} not reachable via HTTPS`;
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
