// tools/stripper.js
export default function initStripper(container) {
    console.log('VLESS Stripper tool loaded successfully!');
    
    const stripperHTML = `
        <div class="vless-stripper">
            <h2>⚡ VLESS Configuration Stripper</h2>
            <p style="color: #888; margin-bottom: 20px;">
                Strip VLESS configurations to essential parameters only. Removes fingerprints and unnecessary data.
            </p>
            
            <div style="margin-bottom: 15px;">
                <label for="stripperInput" style="display: block; margin-bottom: 8px; font-weight: bold;">
                    Paste VLESS Configuration:
                </label>
                <textarea 
                    class="stripper-input" 
                    id="stripperInput" 
                    placeholder="vless://uuid@server.com:443?encryption=none&security=tls&sni=domain.com&type=ws&host=domain.com&path=/path&fp=chrome"
                    rows="5"
                ></textarea>
            </div>
            
            <button class="stripper-btn" id="stripBtn">
                🛠️ Strip Configuration
            </button>
            
            <div style="margin: 20px 0; text-align: center; color: #666;">
                ↓
            </div>
            
            <div id="stripperOutput" class="stripper-output" style="display: none;">
                <h4>✨ Stripped Configuration:</h4>
                <pre class="stripper-result" id="stripperResult"></pre>
                <div style="display: flex; gap: 10px; margin-top: 15px;">
                    <button class="copy-btn" id="copyBtn" style="flex: 1;">📋 Copy</button>
                    <button class="stripper-btn" id="clearBtn" style="flex: 1; background: #6c757d;">🗑️ Clear</button>
                </div>
            </div>

            <div id="errorMessage" class="error" style="display: none; margin-top: 15px;">
                <!-- Error messages will appear here -->
            </div>
        </div>
    `;

    container.insertAdjacentHTML('beforeend', stripperHTML);

    // Get elements
    const stripBtn = document.getElementById('stripBtn');
    const copyBtn = document.getElementById('copyBtn');
    const clearBtn = document.getElementById('clearBtn');
    const input = document.getElementById('stripperInput');
    const output = document.getElementById('stripperOutput');
    const result = document.getElementById('stripperResult');
    const errorMessage = document.getElementById('errorMessage');

    // Add event listeners
    stripBtn.addEventListener('click', stripVlessConfig);
    copyBtn.addEventListener('click', copyStrippedConfig);
    clearBtn.addEventListener('click', clearAll);

    // Auto-strip on paste with delay
    input.addEventListener('paste', (e) => {
        setTimeout(() => {
            if (input.value.trim().startsWith('vless://')) {
                stripVlessConfig();
            }
        }, 100);
    });

    // Enter key support
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            stripVlessConfig();
        }
    });

    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
        output.style.display = 'none';
        
        setTimeout(() => {
            errorMessage.style.display = 'none';
        }, 5000);
    }

    function showSuccess(message) {
        // You can add a success message area if needed
        console.log('Success:', message);
    }

    function stripVlessConfig() {
        const inputText = input.value.trim();
        
        // Hide previous errors
        errorMessage.style.display = 'none';

        if (!inputText) {
            showError('❌ Please paste a VLESS configuration');
            return;
        }

        if (!inputText.startsWith('vless://')) {
            showError('❌ This doesn\'t look like a VLESS configuration. Must start with "vless://"');
            return;
        }

        try {
            stripBtn.innerHTML = '⏳ Processing...';
            stripBtn.disabled = true;

            // Small delay for better UX
            setTimeout(() => {
                const stripped = processVlessConfig(inputText);
                result.textContent = stripped;
                output.style.display = 'block';
                showSuccess('Configuration stripped successfully!');
                
                stripBtn.innerHTML = '🛠️ Strip Configuration';
                stripBtn.disabled = false;

                // Scroll to result
                output.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }, 300);

        } catch (error) {
            showError('❌ Error: ' + error.message);
            stripBtn.innerHTML = '🛠️ Strip Configuration';
            stripBtn.disabled = false;
        }
    }

    function copyStrippedConfig() {
        const text = result.textContent;
        if (!text) {
            showError('❌ No configuration to copy');
            return;
        }

        navigator.clipboard.writeText(text).then(() => {
            copyBtn.innerHTML = '✅ Copied!';
            setTimeout(() => {
                copyBtn.innerHTML = '📋 Copy';
            }, 2000);
        }).catch(err => {
            // Fallback for older browsers
            const textarea = document.createElement('textarea');
            textarea.value = text;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            
            copyBtn.innerHTML = '✅ Copied!';
            setTimeout(() => {
                copyBtn.innerHTML = '📋 Copy';
            }, 2000);
        });
    }

    function clearAll() {
        input.value = '';
        output.style.display = 'none';
        errorMessage.style.display = 'none';
        input.focus();
    }

    function processVlessConfig(config) {
        config = config.trim().replace(/["']/g, '');
        
        if (!config.startsWith('vless://')) {
            throw new Error('Invalid VLESS configuration format');
        }

        // Parse URL
        const url = new URL(config);
        const uuid = url.username;
        const server = url.hostname;
        const port = url.port;

        // Validate required fields
        if (!uuid) throw new Error('Missing UUID in configuration');
        if (!server) throw new Error('Missing server address');
        if (!port) throw new Error('Missing port number');

        // Get parameters
        const params = new URLSearchParams(url.search);
        const essential = new URLSearchParams();
        
        // Essential parameters to keep (in priority order)
        const keepParams = [
            'encryption', 
            'security', 
            'type', 
            'sni', 
            'host', 
            'path', 
            'flow',
            'headerType'
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

        // Set default type if not present
        if (!essential.get('type')) {
            essential.set('type', 'tcp');
        }
        
        // Build the stripped configuration
        const strippedConfig = `vless://${uuid}@${server}:${port}?${essential.toString()}`;
        
        return strippedConfig;
    }
}
