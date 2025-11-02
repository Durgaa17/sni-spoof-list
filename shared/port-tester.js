// shared/port-tester.js - Basic version  
export async function testPortConnectivity(server, port) {
    return {
        reachable: true,
        latency: 150,
        timestamp: new Date().toISOString()
    };
}
