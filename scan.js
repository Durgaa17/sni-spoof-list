// scan.js – VLESS Builder v3.1 (TLS Only + IP + Ping)
const output = document.getElementById('output');
const testBtn = document.getElementById('testBtn');
const resultSection = document.getElementById('resultSection');
const vlessConfig = document.getElementById('vlessConfig');

let currentVlessLink = '';

const PROXY = 'https://api.allorigins.win/raw?url=';

async function log(msg) {
  output.innerHTML += msg + '\n';
  output.scrollTop = output.scrollHeight;
}

function clearOutput() {
  output.innerHTML = '';
  resultSection.style.display = 'none';
}

async function getRealIP(domain) {
  try {
    const res = await fetch(`https://dns.google/resolve?name=${domain}&type=A`);
    const data = await res.json();
    return data.Answer?.[0]?.data || 'Unknown';
  } catch {
    return 'Unknown';
  }
}

async function pingHost(host) {
  try {
    const start = performance.now();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    await fetch(`https://${host}`, { signal: controller.signal, method: 'HEAD' });
    const time = ((performance.now() - start) / 1000).toFixed(2);
    return { alive: true, time };
  } catch {
    return { alive: false, time: 'N/A' };
  }
}

async function testConnection(domain, port, sni) {
  const url = `https://${domain}:${port}`;
  const proxyUrl = `${PROXY}${encodeURIComponent(url)}`;

  try {
    const start = performance.now();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(proxyUrl, {
      method: 'HEAD',
      headers: { 'Host': sni },
      signal: controller.signal
    });

    clearTimeout(timeout);
    const time = ((performance.now() - start) / 1000).toFixed(2);
    const ip = await getRealIP(domain);

    return { success: res.ok, time, ip };
  } catch (e) {
    const ip = await getRealIP(domain);
    return { success: false, time: 'N/A', ip };
  }
}

async function runFullTest() {
  clearOutput();

  const domain = document.getElementById('domain').value.trim();
  const sni = document.getElementById('sni').value.trim();
  const hostHeader = document.getElementById('hostHeader').value.trim() || domain;
  const uuid = document.getElementById('uuid').value.trim();
  const port = document.getElementById('port').value.trim() || '443';
  const pingCheck = document.getElementById('pingCheck').checked;

  if (!domain || !sni || !uuid) {
    log('<span class="fail">Error: Domain, SNI, and UUID required</span>');
    return;
  }

  testBtn.disabled = true;
  testBtn.textContent = 'Testing...';
  log(`Testing: ${domain}:${port}\nSNI: ${sni}\nHost: ${hostHeader}\n`);

  if (pingCheck) {
    const pingResult = await pingHost(hostHeader);
    log(`Ping Check: ${pingResult.alive ? '<span class="success">Alive</span>' : '<span class="fail">Dead</span>'} (${pingResult.time}s)`);
    if (!pingResult.alive) {
      log('<span class="fail">Host may be down. Proceed with caution.</span>\n');
    }
  }

  const result = await testConnection(domain, port, sni);

  log(`Result: <span class="${result.success ? 'success' : 'fail'}">${result.success ? '200 OK' : 'BLOCKED'}</span>`);
  log(`Time: ${result.time}s`);
  log(`Real IP: ${result.ip}\n`);

  const vless = `vless://${uuid}@${domain}:${port}?type=ws&security=tls&sni=${sni}&host=${hostHeader}#MY-ZT`;
  currentVlessLink = vless;

  vlessConfig.textContent = vless;
  resultSection.style.display = 'block';

  if (result.success) {
    log(`<span class="success">VLESS Ready!</span>`);
  } else {
    log(`<span class="fail">SNI blocked or connection failed.</span>`);
  }

  testBtn.disabled = false;
  testBtn.textContent = 'Test + Build';
}

// COPY
function copyConfig() {
  navigator.clipboard.writeText(currentVlessLink).then(() => {
    alert('Copied!');
  }).catch(() => {
    prompt('Copy:', currentVlessLink);
  });
}

// OPEN NEKOBOX
function testVlessLink() {
  const nekobox = `nekobox://import?url=${encodeURIComponent(currentVlessLink)}`;
  window.open(nekobox, '_blank');
  log(`Opening in Nekobox...`);
}
