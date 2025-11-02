// shared/port-tester.js - Tests if server:port is reachable
export async function testPortConnectivity(server, port) {
    const results = {
        reachable: false,
        latency: null,
        error: null,
        timestamp: new Date().toISOString()
    };

    try {
        const startTime = performance.now();
        
        // Try to connect using fetch with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);

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
            
        } catch (httpsError) {
            clearTimeout(timeoutId);
            
            // If HTTPS fails, try HTTP (for port 80)
            if (port === '80' || port === 80) {
                try {
                    const httpResponse = await fetch(`http://${server}:${port}`, {
                        method: 'HEAD',
                        mode: 'no-cors',
                        signal: controller.signal
                    });
                    
                    results.reachable = true;
                    results.latency = Math.round(performance.now() - startTime);
                } catch (httpError) {
                    results.error = `Port ${port} not reachable via HTTP or HTTPS`;
                }
            } else {
                results.error = `Port ${port} not reachable via HTTPS`;
            }
        }

    } catch (error) {
        if (error.name === 'AbortError') {
            results.error = 'Connection timeout (3s)';
        } else {
            results.error = error.message;
        }
    }

    return results;
}
