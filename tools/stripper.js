// tools/stripper.js - Main stripper logic
import { analyzeConfig, generateAnalysisHTML, validateConfig } from './stripper-analysis.js';

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

    container.insertAdjacentHTML('beforeend', stripperHTML);

    // Get elements
    const stripBtn = document.getElementById('stripBtn');
    const copyBtn = document.getElementById('copyBtn');
    const clearBtn = document.getElementById('clearBtn');
    const input = document.getElementById('stripperInput');
    const output = document.getElementById('stripperOutput');
    const result = document.getElementById('stripperResult');
    const analysisDiv = document.getElementById('configAnalysis');
    const analysisResult = document.getElementById('analysisResult');
    const errorMessage = document.getElementById('errorMessage');

    // Add event listeners
    stripBtn.addEventListener('click', stripVlessConfig);
    copyBtn.addEventListener('click', copyStrippedConfig);
    clearBtn.addEventListener('click', clearAll);

    // Auto-strip on paste
    input.addEventListener('paste', (e) => {
        setTimeout(() => {
            if (input.value.trim().startsWith('vless://')) {
                stripVlessConfig();
            }
        }, 100);
    });

    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
        output.style.display = 'none';
        analysisDiv.style.display = 'none';
    }

    function stripVlessConfig() {
        const inputText = input.value.trim();
        
        // Hide previous errors and analysis
        errorMessage.style.display = 'none';
        analysisDiv.style.display = 'none';
        output.style.display = 'none';

        // Validate first
        const validation = validateConfig(inputText);
        if (!validation.isValid) {
            showError('❌ ' + validation.errors.join(', '));
            return;
        }

        try {
            stripBtn.innerHTML = '⏳ Processing...';
            stripBtn.disabled = true;

            setTimeout(() => {
                // Process configuration
                const stripped = processVlessConfig(inputText);
                
                // Generate analysis
                const analysis = analyzeConfig(inputText);
                const analysisHTML = generateAnalysisHTML(analysis);
                
                // Display results
                result.textContent = stripped;
                analysisResult.innerHTML = analysisHTML;
                analysisDiv.style.display = 'block';
                output.style.display = 'block';
                
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
        analysisDiv.style.display = 'none';
        errorMessage.style.display = 'none';
        input.focus();
    }

    function processVlessConfig(config) {
        config = config.trim().replace(/["']/g, '');
        
        // Parse URL
        const url = new URL(config);
        const uuid = url.username;
        const server = url.hostname;
        const port = url.port;

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
        
        // Build the stripped configuration
        const strippedConfig = `vless://${uuid}@${server}:${port}?${essential.toString()}`;
        
        return strippedConfig;
    }
}
