// shared/ping-tester.js - Tests if host is reachable
export async function testHostReachability(hostname) {
    const results = {
        reachable: false,
        latency: null,
        error: null,
        timestamp: new Date().toISOString()
    };

    try {
        // Method 1: Try using Image request (works for most domains)
        const startTime = performance.now();
        
        await new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = resolve;
            img.onerror = resolve; // Don't reject on error, just note it
            img.src = `https://${hostname}/favicon.ico?t=${Date.now()}`;
            
            // Timeout after 3 seconds
            setTimeout(resolve, 3000);
        });

        const latency = Math.round(performance.now() - startTime);
        
        // If latency is reasonable, consider host reachable
        if (latency < 3000) {
            results.reachable = true;
            results.latency = latency;
        } else {
            results.error = 'Host response too slow';
        }

    } catch (error) {
        results.error = error.message;
    }

    return results;
}
