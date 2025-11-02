// scan.js – Payload Magic v3.1 Web Scanner
const SNI_URL = 'https://raw.githubusercontent.com/Durgaa17/sni-spoof-list/main/sni-list.txt';
const DOMAINS_URL = 'https://raw.githubusercontent.com/Durgaa17/sni-spoof-list/main/domains.txt';
const TIMEOUT = 7000;

const output = document.getElementById('output');
const status = document.getElementById('status');

async function log(msg) {
  output.innerHTML += msg + '\n';
  output.scrollTop = output.scrollHeight;
}

async function setStatus(msg) {
  status.textContent = msg;
}

async function fetchText(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT);
  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    return await res.text();
  } catch (e) {
    clearTimeout(timeout);
    throw e;
  }
}

async function loadList(url, name) {
  setStatus(`Loading ${name}...`);
  const text = await fetchText(url);
  const lines = text.split('\n')
    .map(l => l.trim())
    .filter(l => l && !l.startsWith('#'));
  await log(`Result: [LIVE] ${lines.length} ${name} loaded`);
  return lines;
}

async function detectCdn(host) {
  try {
    const res = await fetch(`https://${host}`, { method: 'HEAD', mode: 'no-cors' });
    // no-cors blocks headers → fallback to known patterns
    return 'Unknown (no-cors)';
  } catch {
    return 'Unknown';
  }
}

async function testSni(host, sniList) {
  for (const sni of sniList) {
    if (sni === host) continue;
    const start = performance.now();
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), TIMEOUT);
      const res = await fetch(`https://${host}`, {
        headers: { 'Host': sni },
        signal: controller.signal
      });
      clearTimeout(id);
      if (res.ok) {
        const time = ((performance.now() - start) / 1000).toFixed(2);
        return { sni, time };
      }
    } catch (e) {
      // fail silently
    }
  }
  return null;
}

async function runScan() {
  output.innerHTML = '';
  await log('### PAYLOAD MAGIC v3.1 – WEB SCANNER');
  await log('Starting scan...\n');

  let sniList = [];
  let domains = [];

  try {
    sniList = await loadList(SNI_URL, 'SNI');
  } catch (e) {
    await log('Result: [ERROR] Failed to load SNI list');
    sniList = ['www.speedtest.net', 'cdn.unifi.com.my'];
  }

  try {
    domains = await loadList(DOMAINS_URL, 'domains');
  } catch (e) {
    await log('Result: [ERROR] Failed to load domains');
    domains = ['unifi.com.my'];
  }

  await log('\n' + '='.repeat(70));
  await log('SCAN RESULTS');
  await log('='.repeat(70) + '\n');

  for (const host of domains) {
    await log(`SCAN: ${host}`);
    const cdn = await detectCdn(host);
    await log(`  CDN: ${cdn}`);

    const result = await testSni(host, sniList);
    if (result) {
      const config = `vless://uuid@${host}:443?type=ws&security=tls&sni=${result.sni}&host=${host}#MY-ZT`;
      await log(`  SNI: ${result.sni} (${result.time}s)`);
      await log(`  CONFIG: ${config}`);
    } else {
      await log(`  SNI: [FAILED]`);
    }
    await log('');
  }

  await log('ALL DONE! NO FILES CREATED');
  setStatus('Scan complete');
}
