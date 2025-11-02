// tls.js – Full TLS + HTTP/3 via WebTransport
async function detectCdn(host) {
  try {
    const res = await fetch(`https://${host}`, { method: 'HEAD' });
    const server = res.headers.get('server') || '';
    const cf = res.headers.get('cf-ray');
    if (server.includes('cloudflare') || cf) return 'Cloudflare';
    if (server.includes('amazon')) return 'AWS';
    if (server.includes('akamai')) return 'Akamai';
    return 'Direct';
  } catch {
    return 'Unknown';
  }
}

async function testFullTls(host, sniList) {
  // Try HTTP/3 via WebTransport
  for (const sni of sniList) {
    if (sni === host) continue;
    try {
      const transport = new WebTransport(`https://${host}:443`, {
        serverCertificateHashes: []
      });
      await transport.ready;
      const writer = await transport.createBidirectionalStream();
      const encoder = new TextEncoder();
      writer.writable.getWriter().write(encoder.encode(
        `GET / HTTP/1.1\r\nHost: ${sni}\r\n\r\n`
      ));
      const reader = writer.readable.getReader();
      const { value } = await reader.read();
      transport.close();
      if (value && value.includes('200')) {
        return { sni, time: '0.1', http3: true };
      }
    } catch (e) {
      // HTTP/3 failed
    }
  }

  // Fallback: HTTPS + SNI hint
  for (const sni of sniList) {
    if (sni === host) continue;
    const start = performance.now();
    try {
      const res = await fetch(`https://${host}`, {
        headers: { 'Host': sni },
        signal: AbortSignal.timeout(5000)
      });
      if (res.ok) {
        const time = ((performance.now() - start) / 1000).toFixed(2);
        return { sni, time, http3: false };
      }
    } catch {}
  }
  return null;
}
