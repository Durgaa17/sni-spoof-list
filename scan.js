// scan.js – Payload Magic v3.2 Core (NO QR)
const SNI_URL = 'https://raw.githubusercontent.com/Durgaa17/sni-spoof-list/main/sni-list.txt';
const DOMAINS_URL = 'https://raw.githubusercontent.com/Durgaa17/sni-spoof-list/main/domains.txt';
const TIMEOUT = 8000;

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
  const id = setTimeout(() => controller.abort(), TIMEOUT);
  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(id);
    return await res.text();
  } catch (e) {
    clearTimeout(id);
    throw e;
  }
}

async function loadList(url, name) {
  setStatus(`Loading ${name}...`);
  const text = await fetchText(url);
  const lines = text.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#'));
  await log(`Result: [LIVE] ${lines.length} ${name} loaded`);
  return lines;
}

async function runScan() {
  clearOutput();

  await log('### PAYLOAD MAGIC v3.2 – FULL SCAN');
  await log('Starting...\n');

  let sniList = [];
  let domains = [];

  try { sniList = await loadList(SNI_URL, 'SNI'); }
  catch { await log('Result: [ERROR] SNI load failed'); sniList = ['www.speedtest.net']; }

  try { domains = await loadList(DOMAINS_URL, 'domains'); }
  catch { await log('Result: [ERROR] Domains load failed'); domains = ['unifi.com.my']; }

  await log('\n' + '='.repeat(70));
  await log('SCAN RESULTS');
  await log('='.repeat(70) + '\n');

  for (const host of domains) {
    await log(`SCAN: ${host}`);
    
    const cdn = await detectCdn(host);
    await log(`  CDN: ${cdn}`);

    const tlsResult = await testFullTls(host, sniList);
    if (tlsResult) {
      await log(`  TLS: ${tlsResult.sni} (${tlsResult.time}s) [HTTP/${tlsResult.http3 ? '3' : '2'}]`);
      const config = `vless://uuid@${host}:443?type=ws&security=tls&sni=${tlsResult.sni}&host=${host}#MY-ZT`;
      await log(`  CONFIG: ${config}`);
    } else {
      await log(`  TLS: [FAILED]`);
    }
    await log('');
  }

  await log('ALL DONE!');
  setStatus('Scan complete');
}

function clearOutput() {
  output.innerHTML = '';
}
