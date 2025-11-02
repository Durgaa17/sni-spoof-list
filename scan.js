function stripConfig() {
    const input = document.getElementById('input').value.trim();
    if (!input) {
        alert('Please paste a VLESS config');
        return;
    }

    try {
        // Basic VLESS URL parsing
        const url = new URL(input);
        const uuid = url.username;
        const server = url.hostname;
        const port = url.port;
        
        // Get parameters
        const params = new URLSearchParams(url.search);
        
        // Keep only essential parameters
        const essential = new URLSearchParams();
        
        // Essential parameters in priority
        const keepParams = ['encryption', 'security', 'type', 'sni', 'host', 'path', 'flow'];
        
        keepParams.forEach(param => {
            if (params.get(param)) {
                essential.set(param, params.get(param));
            }
        });
        
        // Set default encryption
        if (!essential.get('encryption')) {
            essential.set('encryption', 'none');
        }
        
        // Build stripped URL
        const stripped = `vless://${uuid}@${server}:${port}?${essential.toString()}`;
        
        // Show result
        document.getElementById('result').textContent = stripped;
        document.getElementById('output').style.display = 'block';
        
    } catch (error) {
        alert('Invalid VLESS configuration: ' + error.message);
    }
}

function copyConfig() {
    const text = document.getElementById('result').textContent;
    navigator.clipboard.writeText(text).then(() => {
        alert('Copied to clipboard!');
    });
}
