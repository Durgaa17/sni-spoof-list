// tools/sni-viewer.js - Simple SNI list viewer
export default function initSniViewer(container) {
    console.log('SNI Viewer loaded');
    
    const viewerHTML = `
        <div class="sni-viewer">
            <h2>🔒 SNI List</h2>
            <p style="color: #888; margin-bottom: 20px;">
                Available SNI domains from sni-list.txt
            </p>
            
            <div class="viewer-controls">
                <input type="text" id="searchSni" placeholder="Search SNI domains..." style="width: 100%; padding: 10px; margin-bottom: 15px;">
                <button id="copyAllSni" class="stripper-btn">📋 Copy All</button>
            </div>
            
            <div id="sniList" class="content-list">
                <div style="text-align: center; padding: 20px; color: #666;">
                    Loading SNI list...
                </div>
            </div>
        </div>
    `;

    container.insertAdjacentHTML('beforeend', viewerHTML);
    loadSniList();
}

async function loadSniList() {
    try {
        const response = await fetch('./sni-list.txt');
        if (!response.ok) throw new Error('Failed to load sni-list.txt');
        
        const text = await response.text();
        const sniList = text.split('\n')
            .map(line => line.trim())
            .filter(line => line && !line.startsWith('#'))
            .filter(Boolean);
        
        displaySniList(sniList);
        
    } catch (error) {
        document.getElementById('sniList').innerHTML = `
            <div style="color: #dc3545; text-align: center; padding: 20px;">
                ❌ Error loading SNI list: ${error.message}
            </div>
        `;
    }
}

function displaySniList(sniList) {
    const listElement = document.getElementById('sniList');
    
    if (sniList.length === 0) {
        listElement.innerHTML = '<div style="text-align: center; color: #666; padding: 20px;">No SNI domains found</div>';
        return;
    }
    
    const sniHTML = sniList.map(sni => `
        <div class="list-item">
            <span class="sni-text">${sni}</span>
            <button class="copy-btn" data-sni="${sni}">📋</button>
        </div>
    `).join('');
    
    listElement.innerHTML = `
        <div style="margin-bottom: 10px; color: #888;">
            Total: ${sniList.length} SNI domains
        </div>
        ${sniHTML}
    `;
    
    // Add copy functionality
    listElement.querySelectorAll('.copy-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const sni = btn.getAttribute('data-sni');
            navigator.clipboard.writeText(sni).then(() => {
                btn.textContent = '✅';
                setTimeout(() => btn.textContent = '📋', 2000);
            });
        });
    });
    
    // Add search functionality
    document.getElementById('searchSni').addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const items = listElement.querySelectorAll('.list-item');
        
        items.forEach(item => {
            const sni = item.querySelector('.sni-text').textContent.toLowerCase();
            item.style.display = sni.includes(searchTerm) ? 'block' : 'none';
        });
    });
    
    // Add copy all functionality
    document.getElementById('copyAllSni').addEventListener('click', () => {
        const allSni = sniList.join('\n');
        navigator.clipboard.writeText(allSni).then(() => {
            const btn = document.getElementById('copyAllSni');
            btn.textContent = '✅ Copied All!';
            setTimeout(() => btn.textContent = '📋 Copy All', 2000);
        });
    });
}
