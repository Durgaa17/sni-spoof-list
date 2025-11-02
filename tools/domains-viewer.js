// tools/domains-viewer.js - Simple domains list viewer
export default function initDomainsViewer(container) {
    console.log('Domains Viewer loaded');
    
    const viewerHTML = `
        <div class="domains-viewer">
            <h2>🌐 Domains List</h2>
            <p style="color: #888; margin-bottom: 20px;">
                Available domains from domains.txt
            </p>
            
            <div class="viewer-controls">
                <input type="text" id="searchDomains" placeholder="Search domains..." style="width: 100%; padding: 10px; margin-bottom: 15px;">
                <button id="copyAllDomains" class="stripper-btn">📋 Copy All</button>
            </div>
            
            <div id="domainsList" class="content-list">
                <div style="text-align: center; padding: 20px; color: #666;">
                    Loading domains...
                </div>
            </div>
        </div>
    `;

    container.insertAdjacentHTML('beforeend', viewerHTML);
    loadDomainsList();
}

async function loadDomainsList() {
    try {
        const response = await fetch('./domains.txt');
        if (!response.ok) throw new Error('Failed to load domains.txt');
        
        const text = await response.text();
        const domains = text.split('\n')
            .map(line => line.trim())
            .filter(line => line && !line.startsWith('#'))
            .filter(Boolean);
        
        displayDomains(domains);
        
    } catch (error) {
        document.getElementById('domainsList').innerHTML = `
            <div style="color: #dc3545; text-align: center; padding: 20px;">
                ❌ Error loading domains: ${error.message}
            </div>
        `;
    }
}

function displayDomains(domains) {
    const listElement = document.getElementById('domainsList');
    
    if (domains.length === 0) {
        listElement.innerHTML = '<div style="text-align: center; color: #666; padding: 20px;">No domains found</div>';
        return;
    }
    
    const domainsHTML = domains.map(domain => `
        <div class="list-item">
            <span class="domain-text">${domain}</span>
            <button class="copy-btn" data-domain="${domain}">📋</button>
        </div>
    `).join('');
    
    listElement.innerHTML = `
        <div style="margin-bottom: 10px; color: #888;">
            Total: ${domains.length} domains
        </div>
        ${domainsHTML}
    `;
    
    // Add copy functionality
    listElement.querySelectorAll('.copy-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const domain = btn.getAttribute('data-domain');
            navigator.clipboard.writeText(domain).then(() => {
                btn.textContent = '✅';
                setTimeout(() => btn.textContent = '📋', 2000);
            });
        });
    });
    
    // Add search functionality
    document.getElementById('searchDomains').addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const items = listElement.querySelectorAll('.list-item');
        
        items.forEach(item => {
            const domain = item.querySelector('.domain-text').textContent.toLowerCase();
            item.style.display = domain.includes(searchTerm) ? 'block' : 'none';
        });
    });
    
    // Add copy all functionality
    document.getElementById('copyAllDomains').addEventListener('click', () => {
        const allDomains = domains.join('\n');
        navigator.clipboard.writeText(allDomains).then(() => {
            const btn = document.getElementById('copyAllDomains');
            btn.textContent = '✅ Copied All!';
            setTimeout(() => btn.textContent = '📋 Copy All', 2000);
        });
    });
}
