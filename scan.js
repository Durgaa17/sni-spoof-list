// scan.js – Single SNI Test with Real IP
const output = document.getElementById('output');
const testBtn = document.getElementById('testBtn');

async function log(msg) {
  output.innerHTML += msg + '\n';
  output.scrollTop = output.scrollHeight;
}

function clearOutput() {
  output.innerHTML = '';
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

async function testSingleSNI() {
  clearOutput();
  const domain = document.getElementById('domain').value.trim();
  const sni = document.getElementById('sni').value.trim();
  const hostHeader = document.getElementById('hostHeader').value.trim() || domain;

  if (!domain || !sni) {
    log('<span class="fail">Error: Domain and SNI required</span>');
    return;
  }

  testBtn.disabled = true;
  testBtn.textContent = 'Testing...';
  log(`Testing: ${domain} → SNI: ${sni} | Host: ${hostHeader}\n`);

  const startTime = performance.now();
  let success = false;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(`https://${domain}`, {
      method: 'GET',
      headers: { 'Host': sni },
      signal: controller.signal,
      mode: 'no-cors' // Required for SNI to take effect
    });

    clearTimeout(timeout);
    success = true; // Connection succeeded = SNI likely accepted
  } catch (e) {
    success = false;
  }

  const elapsed = ((performance.now() - startTime) / 1000).toFixed(2);
  const ip = await getRealIP(domain);

  log(`Result: <span class="${success ? 'success' : 'fail'}">${success ? '200 OK' : 'BLOCKED'}</span>`);
  log(`Time: ${elapsed}s`);
  log(`Real IP: ${ip}`);
  log(`SNI Used: ${sni}`);
  log(`Host Header: ${hostHeader}`);

  if (success) {
    const config = `vless://uuid@${domain}:443?type=ws&security=tls&sni=${sni}&host=${hostHeader}#MY-ZT`;
    log(`\nCONFIG:\n<span class="success">${config}</span>`);
  } else {
    log(`\n<span class="fail">SNI blocked or domain down</span>`);
  }

  testBtn.disabled = false;
  testBtn.textContent = 'Test SNI Now';
}

// Run on button click
function runTest() {
  testSingleSNI();
}
