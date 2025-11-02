class VlessStripper {
    constructor() {
        this.configInput = document.getElementById('configInput');
        this.stripBtn = document.getElementById('stripBtn');
        this.pasteBtn = document.getElementById('pasteBtn');
        this.outputSection = document.getElementById('outputSection');
        this.strippedConfig = document.getElementById('strippedConfig');
        this.copyBtn = document.getElementById('copyBtn');
        this.message = document.getElementById('message');
        
        this.initEventListeners();
    }

    initEventListeners() {
        this.stripBtn.addEventListener('click', () => this.stripConfig());
        this.pasteBtn.addEventListener('click', () => this.handlePaste());
        this.copyBtn.addEventListener('click', () => this.copyToClipboard());
        
        // Auto-strip when manual paste happens in textarea
        this.configInput.addEventListener('input', (e) => {
            // Auto-strip if it looks like a VLESS config
            const value = e.target.value.trim();
            if (value.includes('vless://') && value.length > 50) {
                setTimeout(() => {
                    this.stripConfig();
                }, 500);
            }
        });

        // Handle Enter key in textarea
        this.configInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                this.stripConfig();
            }
        });
    }

    async handlePaste() {
        try {
            // Show loading state
            this.setButtonLoading(this.pasteBtn, true);
            
            // Check if clipboard API is available
            if (!navigator.clipboard || !navigator.clipboard.readText) {
                throw new Error('Clipboard API not supported');
            }
            
            const text = await navigator.clipboard.readText();
            if (!text) {
                throw new Error('No text in clipboard');
            }
            
            this.configInput.value = text;
            this.showMessage('Content pasted successfully! Stripping...', 'success');
            
            // Auto-strip after paste
            setTimeout(() => {
                this.stripConfig();
            }, 300);
            
        } catch (error) {
            console.warn('Clipboard API failed, using fallback:', error);
            this.fallbackPasteMethod();
        } finally {
            this.setButtonLoading(this.pasteBtn, false);
        }
    }

    fallbackPasteMethod() {
        // Focus on textarea and show message for manual paste
        this.configInput.focus();
        this.showMessage('Please paste manually (Ctrl+V) in the text area above', 'error');
        
        // Select all text to make manual paste easier
        this.configInput.select();
    }

    stripConfig() {
        const input = this.configInput.value.trim();
        
        if (!input) {
            this.showMessage('Please paste a VLESS configuration', 'error');
            this.hideOutput();
            return;
        }

        // Show loading state
        this.setButtonLoading(this.stripBtn, true);

        setTimeout(() => {
            try {
                const stripped = this.processVlessConfig(input);
                this.strippedConfig.textContent = stripped;
                this.showOutput();
                this.showMessage('Configuration stripped successfully!', 'success');
                
                // Show config type detected
                this.showConfigType(stripped);
            } catch (error) {
                this.showMessage(`Error: ${error.message}`, 'error');
                this.hideOutput();
                console.error('Stripping error:', error);
            } finally {
                this.setButtonLoading(this.stripBtn, false);
            }
        }, 300);
    }

    processVlessConfig(config) {
        // Remove any quotes and trim
        config = config.replace(/["']/g, '').trim();
        
        // Check if it's a URL format
        if (config.startsWith('vless://')) {
            return this.parseVlessUrl(config);
        }
        
        // If it's already a stripped format or raw parameters
        return this.parseRawConfig(config);
    }

    parseVlessUrl(url) {
        try {
            // Fix URL parsing for vless:// format
            let cleanUrl = url;
            if (!url.includes('?') && url.includes('#')) {
                cleanUrl = url.replace('#', '?');
            }
            
            const parsed = new URL(cleanUrl);
            
            // Extract basic components
            const uuid = parsed.username;
            const server = parsed.hostname;
            const port = parsed.port;
            
            // Get parameters from search OR hash (support both formats)
            const searchParams = parsed.searchParams;
            const hashParams = new URLSearchParams(parsed.hash.substring(1));
            const params = searchParams.toString() ? searchParams : hashParams;
            
            // Essential parameters for WS and TLS
            const type = params.get('type') || 'tcp';
            const security = params.get('security') || 'none';
            const path = params.get('path') || '';
            const host = params.get('host') || '';
            const sni = params.get('sni') || '';
            
            // Build stripped configuration - optimized for WS setups
            let stripped = `vless://${uuid}@${server}:${port}`;
            stripped += `?type=${type}&security=${security}`;
            
            // Add WebSocket specific parameters
            if (type === 'ws') {
                if (path) {
                    stripped += `&path=${encodeURIComponent(path)}`;
                }
                if (host) {
                    stripped += `&host=${encodeURIComponent(host)}`;
                }
            }
            
            // Add TLS specific parameters
            if (security === 'tls' || security === 'reality') {
                if (sni) {
                    stripped += `&sni=${encodeURIComponent(sni)}`;
                }
                if (params.get('fp')) {
                    stripped += `&fp=${params.get('fp')}`;
                }
                if (params.get('alpn')) {
                    stripped += `&alpn=${params.get('alpn')}`;
                }
            }
            
            // Add flow for specific security types
            if (params.get('flow')) {
                stripped += `&flow=${params.get('flow')}`;
            }
            
            // Add encryption if specified
            if (params.get('encryption') && params.get('encryption') !== 'none') {
                stripped += `&encryption=${params.get('encryption')}`;
            }
            
            return stripped;
            
        } catch (error) {
            console.error('URL parsing error:', error);
            throw new Error('Invalid VLESS URL format. Make sure it starts with vless://');
        }
    }

    parseRawConfig(config) {
        // If it's already a simple format, just clean it up
        if (config.includes('vless://')) {
            return config.replace(/["']/g, '').trim();
        }
        
        // Try to extract common parameters
        const uuidMatch = config.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
        const serverMatch = config.match(/(?:server|host|address)[=:]\s*([^\s,]+)/i);
        const portMatch = config.match(/(?:port)[=:]\s*(\d+)/i);
        const typeMatch = config.match(/(?:type)[=:]\s*(\w+)/i);
        const pathMatch = config.match(/(?:path)[=:]\s*([^\s,]+)/i);
        const sniMatch = config.match(/(?:sni|servername)[=:]\s*([^\s,]+)/i);
        
        if (uuidMatch && serverMatch && portMatch) {
            const type = typeMatch ? typeMatch[1] : 'tcp';
            const security = config.toLowerCase().includes('tls') ? 'tls' : 'none';
            
            let stripped = `vless://${uuidMatch[0]}@${serverMatch[1]}:${portMatch[1]}`;
            stripped += `?type=${type}&security=${security}`;
            
            if (pathMatch && type === 'ws') {
                stripped += `&path=${encodeURIComponent(pathMatch[1])}`;
            }
            
            if (sniMatch && security === 'tls') {
                stripped += `&sni=${encodeURIComponent(sniMatch[1])}`;
            }
            
            return stripped;
        }
        
        throw new Error('Could not parse configuration format. Please use VLESS URL format.');
    }

    showConfigType(config) {
        const type = config.includes('type=ws') ? 'WebSocket' : 'TCP';
        const security = config.includes('security=tls') ? '+TLS' : '';
        const message = `Detected: VLESS+${type}${security}`;
        
        // You can show this in a separate info box or log it
        console.log(message);
    }

    async copyToClipboard() {
        const text = this.strippedConfig.textContent;
        
        if (!text) {
            this.showMessage('No configuration to copy', 'error');
            return;
        }

        try {
            // Try modern clipboard API first
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(text);
            } else {
                // Fallback method
                this.fallbackCopyToClipboard(text);
            }
            
            this.copyBtn.textContent = '✅ Copied!';
            this.copyBtn.classList.add('copied');
            this.showMessage('Configuration copied to clipboard!', 'success');
            
            setTimeout(() => {
                this.copyBtn.textContent = '📋 Copy Stripped Config';
                this.copyBtn.classList.remove('copied');
            }, 2000);
        } catch (error) {
            console.error('Copy failed, using fallback:', error);
            this.fallbackCopyToClipboard(text);
        }
    }

    fallbackCopyToClipboard(text) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
            document.execCommand('copy');
            this.showMessage('Configuration copied to clipboard!', 'success');
        } catch (err) {
            this.showMessage('Failed to copy to clipboard. Please copy manually.', 'error');
        }
        
        document.body.removeChild(textArea);
    }

    setButtonLoading(button, isLoading) {
        if (isLoading) {
            button.classList.add('loading');
            button.innerHTML = '<span class="spinner"></span>Processing...';
            button.disabled = true;
        } else {
            button.classList.remove('loading');
            button.disabled = false;
            if (button === this.pasteBtn) {
                button.textContent = '📋 Paste';
            } else if (button === this.stripBtn) {
                button.textContent = '⚡ Strip';
            }
        }
    }

    showOutput() {
        this.outputSection.style.display = 'block';
        // Smooth scroll to output
        setTimeout(() => {
            this.outputSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 100);
    }

    hideOutput() {
        this.outputSection.style.display = 'none';
    }

    showMessage(text, type) {
        this.message.textContent = text;
        this.message.className = type;
        this.message.style.display = 'block';
        
        setTimeout(() => {
            if (this.message.textContent === text) {
                this.message.style.display = 'none';
            }
        }, 4000);
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new VlessStripper();
});
