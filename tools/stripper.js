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

    // Auto-strip on paste
    input.addEventListener('paste', (e) => {
        setTimeout(() => {
            if (input.value.trim().startsWith('vless://')) {
                stripVlessConfig();
            }
        }, 100);
    });

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
            
            // Scroll to result
            output.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        } catch (error) {
            alert('Error: ' + error.message);
            console.error('Stripping error:', error);
        }
    }

    function copyStrippedConfig() {
        const text = result.textContent;
        if (!text) {
            alert('No configuration to copy');
            return;
        }

        navigator.clipboard.writeText(text).then(() => {
            // Visual feedback
            copyBtn.textContent = '✅ Copied!';
            setTimeout(() => {
                copyBtn.textContent = 'Copy to Clipboard';
            }, 2000);
        }).catch(err => {
            // Fallback for older browsers
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            
            copyBtn.textContent = '✅ Copied!';
            setTimeout(() => {
                copyBtn.textContent = 'Copy to Clipboard';
            }, 2000);
        });
    }

    function processVlessConfig(config) {
        // Clean the input
        config = config.trim().replace(/["']/g, '');
        
        if (!config.startsWith('vless://')) {
            throw new Error('Not a VLESS configuration. Must start with "vless://"');
        }

        // Parse URL
        const url = new URL(config);
        const uuid = url.username;
        const server = url.hostname;
        const port = url.port;

        if (!uuid || !server || !port) {
            throw new Error('Invalid VLESS URL: missing UUID, server, or port');
        }

        // Get parameters
        const params = new URLSearchParams(url.search);
        const essential = new URLSearchParams();
        
        // Essential parameters to keep
        const keepParams = [
            'encryption', 
            'security', 
            'type', 
            'sni', 
            'host', 
            'path', 
            'flow'
        ];
        
        // Add essential parameters
        keepParams.forEach(param => {
            const value = params.get(param);
            if (value) {
                essential.set(param, value);
            }
        });
        
        // Set default encryption if not present
        if (!essential.get('encryption')) {
            essential.set('encryption', 'none');
        }
        
        // Build the stripped configuration
        const strippedConfig = `vless://${uuid}@${server}:${port}?${essential.toString()}`;
        
        return strippedConfig;
    }
}
