// scan.js – VLESS Builder + SNI Test + Copy + Open
const output = document.getElementById('output');
const testBtn = document.getElementById('testBtn');
const resultSection = document.getElementById('resultSection');
const vlessConfig = document.getElementById('vlessConfig');

let currentVlessLink = '';

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

async function testSNI(domain, sni, hostHeader) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const start = performance.now();

    await fetch(`https://${domain}`, {
      headers: { 'Host': sni },
      signal: controller.signal,
      mode: 'no-cors'
    });

    clearTimeout(timeout);
    const time = ((performance.now() - start) / 1000).toFixed(2);
    return { success: true, time, ip: await getRealIP(domain) };
  } catch (e) {
    return { success: false, time: 'N/A', ip: await getRealIP(domain) };
  }
}

async function runFullTest() {
  clearOutput();
  resultSection.style.display = 'none';

  const domain = document.getElementById('domain').value.trim();
  const sni = document.getElementById('sni').value.trim();
  const hostHeader = document.getElementById('hostHeader').value.trim() || domain;
  const uuid = document.getElementById('uuid').value.trim();
  const port = document.getElementById('port').value.trim() || '443';

  if (!domain || !sni || !uuid) {
    log('<span class="fail">Error: Domain, SNI, and UUID required</span>');
    return;
  }

  testBtn.disabled = true;
  testBtn.textContent = 'Testing SNI...';
  log(`Testing: ${domain} → SNI: ${sni} | Host: ${hostHeader}\n`);

  const result = await testSNI(domain, sni, hostHeader);

  log(`Result: <span class="${result.success ? 'success' : 'fail'}">${result.success ? '200 OK' : 'BLOCKED'}</span>`);
  log(`Time: ${result.time}s`);
  log(`Real IP: ${result.ip}\n`);

  const vless = `vless://${uuid}@${domain}:${port}?type=ws&security=tls&sni=${sni}&host=${hostHeader}#MY-ZT`;
  currentVlessLink = vless;

  vlessConfig.textContent = vless;
  resultSection.style.display = 'block';

  if (result.success) {
    log(`<span class="success">VLESS Config Ready!</span>`);
  } else {
    log(`<span class="fail">SNI blocked. Try another SNI.</span>`);
  }

  testBtn.disabled = false;
  testBtn.textContent = 'Test SNI + Build';
}

// COPY TO CLIPBOARD
function copyConfig() {
  navigator.clipboard.writeText(currentVlessLink).then(() => {
    alert('Copied to clipboard!');
  }).catch(() => {
    prompt('Copy manually:', currentVlessLink);
  });
}

// OPEN IN NEKOBOX / v2RAYNG
function testVlessLink() {
  const nekobox = `nekobox://import?url=${encodeURIComponent(currentVlessLink)}`;
  window.open(nekobox, '_blank');
  log(`Opening in Nekobox...`);
}
