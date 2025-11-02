// scan.js – VLESS Builder v3.0 (TLS / No TLS + Real Test)
const output = document.getElementById('output');
const testBtn = document.getElementById('testBtn');
const resultSection = document.getElementById('resultSection');
const vlessConfig = document.getElementById('vlessConfig');
const sniField = document.getElementById('sniField');

let currentVlessLink = '';

// CORS Proxy (reliable)
const PROXY = 'https://api.allorigins.win/raw?url=';

async function log(msg) {
  output.innerHTML += msg + '\n';
  output.scrollTop = output.scrollHeight;
}

function clearOutput() {
  output.innerHTML = '';
  resultSection.style.display = 'none';
}

function toggleSNI() {
  const security = document.getElementById('security').value;
  if (security === 'none') {
    sniField.classList.add('disabled');
    document.getElementById('sni').value = '';
  } else {
    sniField.classList.remove('disabled');
  }
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

async function testConnection(domain, port, useTLS, sni = '') {
  const protocol = useTLS ? 'https' : 'http';
  const url = `${protocol}://${domain}:${port}`;
  const proxyUrl = `${PROXY}${encodeURIComponent(url)}`;

  try {
    const start = performance.now();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const headers = {};
    if (useTLS && sni) headers['Host'] = sni;

    const res = await fetch(proxyUrl, {
      method: 'HEAD',
      headers,
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
  const security = document.getElementById('security').value;
  const sni = security === 'tls' ? document.getElementById('sni').value.trim() : '';
  const hostHeader = document.getElementById('hostHeader').value.trim() || domain;
  const uuid = document.getElementById('uuid').value.trim();
  const port = document.getElementById('port').value.trim() || (security === 'tls' ? '443' : '80');

  if (!domain || !uuid) {
    log('<span class="fail">Error: Domain and UUID required</span>');
    return;
  }
  if (security === 'tls' && !sni) {
    log('<span class="fail">Error: SNI required for TLS</span>');
    return;
  }

  testBtn.disabled = true;
  testBtn.textContent = 'Testing...';
  log(`Testing: ${domain}:${port} (${security.toUpperCase()})\n`);

  if (security === 'tls') log(`SNI: ${sni}\n`);
  log(`Host Header: ${hostHeader}\n`);

  const result = await testConnection(domain, port, security === 'tls', sni);

  log(`Result: <span class="${result.success ? 'success' : 'fail'}">${result.success ? '200 OK' : 'BLOCKED'}</span>`);
  log(`Time: ${result.time}s`);
  log(`Real IP: ${result.ip}\n`);

  const securityParam = security === 'tls' ? 'tls' : 'none';
  const sniParam = security === 'tls' ? `&sni=${sni}` : '';
  const vless = `vless://${uuid}@${domain}:${port}?type=ws&security=${securityParam}${sniParam}&host=${hostHeader}#MY-ZT`;
  currentVlessLink = vless;

  vlessConfig.textContent = vless;
  resultSection.style.display = 'block';

  if (result.success) {
    log(`<span class="success">VLESS Ready!</span>`);
  } else {
    log(`<span class="fail">Connection failed. Check domain/port.</span>`);
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
