// shared/external/check-host-api.js - Basic placeholder
export async function quickConnectionTest(server, port) {
    // Placeholder for now
    return {
        ping: { success: true, summary: { averageLatency: 150 } },
        tcp: { success: true, summary: { averageLatency: 200 } },
        http: { success: true, summary: { averageLatency: 180 } }
    };
}
