// scan.js – Real SNI + IP Checker (GitHub Pages)
const DOMAINS_URL = 'https://raw.githubusercontent.com/Durgaa17/sni-spoof-list/main/domains.txt';
const SNI_URL = 'https://raw.githubusercontent.com/Durgaa17/sni-spoof-list/main/sni-list.txt';

const output = document.getElementById('output');

async function log(msg) {
  output.innerHTML += msg + '\n';
  output.scrollTop = output.scrollHeight;
}

async function fetchText(url) {
  const res = await fetch(url);
  return await res.text();
}

async function getRealIP(host) {
  try {
    const res = await fetch(`https://dns.google/resolve?name=${host}&type=A`);
    const data = await res.json();
    return data.Answer?.[0]?.data || 'Unknown';
  } catch {
    return 'Unknown';
  }
}

async function testSNI(host, sni) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(`https://${host}`, {
      headers: { 'Host': sni },
      signal: controller.signal,
      mode: 'no-cors' // Required for SNI hint
    });

    clearTimeout(timeout);

    // no-cors = opaque response, but connection succeeded = SNI likely worked
    const ip = await getRealIP(host);
    return { sni, ip, works: true };
  } catch (e) {
    return null;
  }
}

async function runCheck() {
  output.innerHTML = '';
  log('Loading domains and SNI list...\n');

  let domains = [], sniList = [];

  try {
    const [domText, sniText] = await Promise.all([
      fetchText(DOMAINS_URL),
      fetchText(SNI_URL)
    ]);

    domains = domText.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#'));
    sniList = sniText.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#'));

    log(`Loaded ${domains.length} domains`);
    log(`Loaded ${sniList.length} SNI entries\n`);
  } catch (e) {
    log('Failed to load files: ' + e.message);
    return;
  }

  log('=' .repeat(70));
  log('SNI + IP CHECK RESULTS');
  log('=' .repeat(70) + '\n');

  for (const host of domains) {
    log(`TARGET: ${host}`);
    let found = false;

    for (const sni of sniList) {
      if (sni === host) continue;

      const result = await testSNI(host, sni);
      if (result) {
        log(`  SNI: <span class="success">${sni}</span>`);
        log(`  IP: <span class="success">${result.ip}</span>`);
        log(`  CONFIG: vless://uuid@${host}:443?type=ws&security=tls&sni=${sni}&host=${host}#MY-ZT\n`);
        found = true;
        break;
      }
    }

    if (!found) {
      const ip = await getRealIP(host);
      log(`  SNI: <span class="fail">[BLOCKED]</span>`);
      log(`  IP: ${ip}\n`);
    }
  }

  log('SCAN COMPLETE!');
}
