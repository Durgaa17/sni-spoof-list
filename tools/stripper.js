export default function initStripper(container) {
    const stripperHTML = `
        <div class="vless-stripper">
            <h2>VLESS Configuration Stripper</h2>
            <p style="color: #888; margin-bottom: 20px;">
                Paste your VLESS configuration to strip it down to essential parameters
            </p>
            
            <textarea 
                class="stripper-input" 
                id="stripperInput" 
                placeholder="Paste VLESS config here... Example: vless://uuid@server.com:443?type=ws&security=tls&sni=domain.com&path=/path"
            ></textarea>
            
            <button class="stripper-btn" onclick="stripVlessConfig()">Strip Configuration</button>
            
            <div id="stripperOutput" class="stripper-output" style="display: none;">
                <h4>Stripped Configuration:</h4>
                <pre class="stripper-result" id="stripperResult"></pre>
                <button class="copy-btn" onclick="copyStrippedConfig()">Copy to Clipboard</button>
            </div>
        </div>
    `;

    container.insertAdjacentHTML('beforeend', stripperHTML);

    // Add functions to global scope for onclick handlers
    window.stripVlessConfig = function() {
        const input = document.getElementById('stripperInput').value.trim();
        if (!input) {
            alert('Please paste a VLESS configuration');
            return;
        }

        try {
            const stripped = processVlessConfig(input);
            document.getElementById('stripperResult').textContent = stripped;
            document.getElementById('stripperOutput').style.display = 'block';
        } catch (error) {
            alert('Error: ' + error.message);
        }
    };

    window.copyStrippedConfig = function() {
        const text = document.getElementById('stripperResult').textContent;
        navigator.clipboard.writeText(text).then(() => {
            alert('Copied to clipboard!');
        });
    };

    function processVlessConfig(config) {
        config = config.trim().replace(/["']/g, '');
        
        if (!config.startsWith('vless://')) {
            throw new Error('Not a VLESS configuration');
        }

        const url = new URL(config);
        const uuid = url.username;
        const server = url.hostname;
        const port = url.port;

        const params = new URLSearchParams(url.search);
        const essential = new URLSearchParams();
        
        const keepParams = ['encryption', 'security', 'type', 'sni', 'host', 'path', 'flow'];
        
        keepParams.forEach(param => {
            if (params.get(param)) {
                essential.set(param, params.get(param));
            }
        });
        
        if (!essential.get('encryption')) {
            essential.set('encryption', 'none');
        }
        
        return `vless://${uuid}@${server}:${port}?${essential.toString()}`;
    }
}
