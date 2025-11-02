// tools/stripper.js
export default function initStripper(container) {
    console.log('VLESS Stripper tool loaded successfully!');
    
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
                rows="4"
            ></textarea>
            
            <button class="stripper-btn" id="stripBtn">Strip Configuration</button>
            
            <div id="stripperOutput" class="stripper-output" style="display: none;">
                <h4>Stripped Configuration:</h4>
                <pre class="stripper-result" id="stripperResult"></pre>
                <button class="copy-btn" id="copyBtn">Copy to Clipboard</button>
            </div>
        </div>
    `;

    container.insertAdjacentHTML('beforeend', stripperHTML);

    // Get elements after they are added to DOM
    const stripBtn = document.getElementById('stripBtn');
    const copyBtn = document.getElementById('copyBtn');
    const input = document.getElementById('stripperInput');
    const output = document.getElementById('stripperOutput');
    const result = document.getElementById('stripperResult');

    // Add event listeners
    stripBtn.addEventListener('click', stripVlessConfig);
    copyBtn.addEventListener('click', copyStrippedConfig);

    function stripVlessConfig() {
        const inputText = input.value.trim();
        if (!inputText) {
            alert('Please paste a VLESS configuration');
            return;
        }

        try {
            const stripped = processVlessConfig(inputText);
            result.textContent = stripped;
            output.style.display = 'block';
        } catch (error) {
            alert('Error: ' + error.message);
        }
    }

    function copyStrippedConfig() {
        const text = result.textContent;
        if (!text) {
            alert('No configuration to copy');
            return;
        }

        navigator.clipboard.writeText(text).then(() => {
            alert('Copied to clipboard!');
        }).catch(err => {
            // Fallback for older browsers
            const textarea = document.createElement('textarea');
            textarea.value = text;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            alert('Copied to clipboard!');
        });
    }

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
