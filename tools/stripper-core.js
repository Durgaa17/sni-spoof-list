// tools/stripper-core.js - Pure stripping logic only
export function processVlessConfig(config) {
    config = config.trim().replace(/["']/g, '');
    
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
    
    // Essential parameters to keep
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

export function getStripperHTML() {
    return `
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
            
            <!-- Analysis Section -->
            <div id="configAnalysis" style="display: none; margin-bottom: 20px; padding: 15px; background: #1a1a1a; border-radius: 5px; border-left: 4px solid #667eea;">
                <h4 style="margin-bottom: 10px;">🔍 Configuration Analysis</h4>
                <div id="analysisResult"></div>
            </div>
            
            <!-- Stripped Output Section -->
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
}
