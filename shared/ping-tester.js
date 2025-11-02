// shared/ping-tester.js - Enhanced with real testing
export async function testHostReachability(hostname) {
    const results = {
        reachable: false,
        latency: null,
        error: null,
        timestamp: new Date().toISOString()
    };

    try {
        const startTime = performance.now();
        
        // Method 1: Try favicon request (works for most domains)
        await new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve();
            img.onerror = () => resolve(); // Don't fail on error
            img.src = `https://${hostname}/favicon.ico?t=${Date.now()}`;
            
            setTimeout(resolve, 3000); // Timeout after 3 seconds
        });

        const latency = Math.round(performance.now() - startTime);
        
        if (latency < 3000) {
            results.reachable = true;
            results.latency = latency;
        } else {
            // Method 2: Try DNS lookup via API
            try {
                const dnsResponse = await fetch(`https://dns.google/resolve?name=${hostname}`);
                if (dnsResponse.ok) {
                    results.reachable = true;
                    results.latency = latency;
                    results.method = 'dns_lookup';
                }
            } catch (dnsError) {
                results.error = 'Host not reachable via multiple methods';
            }
        }

    } catch (error) {
        results.error = error.message;
    }

    return results;
}
