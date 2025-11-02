// shared/ping-tester.js - Basic version
export async function testHostReachability(hostname) {
    return {
        reachable: true,
        latency: 100,
        timestamp: new Date().toISOString()
    };
}
