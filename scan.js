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
        this.configInput.addEventListener('paste', (e) => {
            setTimeout(() => {
                this.stripConfig();
            }, 100);
        });

        // Handle Enter key in textarea
        this.configInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                this.stripConfig();
            }
        });
    }

    async handlePaste() {
        try {
            // Show loading state
            this.setButtonLoading(this.pasteBtn, true);
            
            const text = await navigator.clipboard.readText();
            this.configInput.value = text;
            this.showMessage('Content pasted successfully!', 'success');
            
            // Auto-strip after paste
            setTimeout(() => {
                this.stripConfig();
            }, 500);
            
        } catch (error) {
            this.showMessage('Please allow clipboard permissions or paste manually', 'error');
            console.error('Paste error:', error);
            
            // Fallback: focus on textarea for manual paste
            this.configInput.focus();
            this.showMessage('Please paste manually in the text area', 'error');
        } finally {
            this.setButtonLoading(this.pasteBtn, false);
        }
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
            } catch (error) {
                this.showMessage('Error: Invalid VLESS configuration format', 'error');
                this.hideOutput();
                console.error('Stripping error:', error);
            } finally {
                this.setButtonLoading(this.stripBtn, false);
            }
        }, 500);
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
            const parsed = new URL(url);
            
            // Extract basic components
            const uuid = parsed.username;
            const server = parsed.hostname;
            const port = parsed.port;
            const params = new URLSearchParams(parsed.hash.substring(1));
            
            // Get type (default to tcp if not specified)
            const type = params.get('type') || 'tcp';
            
            // Get security (default to none if not specified)
            const security = params.get('security') || 'none';
            
            // Build stripped configuration
            let stripped = `vless://${uuid}@${server}:${port}`;
            stripped += `?type=${type}&security=${security}`;
            
            // Add essential parameters only
            const essentialParams = ['path', 'host', 'sni', 'flow', 'encryption'];
            essentialParams.forEach(param => {
                if (params.get(param)) {
                    stripped += `&${param}=${encodeURIComponent(params.get(param))}`;
                }
            });
            
            return stripped;
            
        } catch (error) {
            throw new Error('Invalid VLESS URL format');
        }
    }

    parseRawConfig(config) {
        // If it's already a simple format, just clean it up
        if (config.includes('vless://')) {
            return config.replace(/["']/g, '').trim();
        }
        
        // Try to extract UUID, server, port from various formats
        const uuidMatch = config.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
        const serverMatch = config.match(/(?:server|host|address)[=:]\s*([^\s,]+)/i);
        const portMatch = config.match(/(?:port)[=:]\s*(\d+)/i);
        
        if (uuidMatch && serverMatch && portMatch) {
            return `vless://${uuidMatch[0]}@${serverMatch[1]}:${portMatch[1]}?type=tcp&security=none`;
        }
        
        throw new Error('Could not parse configuration format');
    }

    async copyToClipboard() {
        const text = this.strippedConfig.textContent;
        
        if (!text) {
            this.showMessage('No configuration to copy', 'error');
            return;
        }

        try {
            await navigator.clipboard.writeText(text);
            this.copyBtn.textContent = '✅ Copied!';
            this.copyBtn.classList.add('copied');
            this.showMessage('Configuration copied to clipboard!', 'success');
            
            setTimeout(() => {
                this.copyBtn.textContent = '📋 Copy Stripped Config';
                this.copyBtn.classList.remove('copied');
            }, 2000);
        } catch (error) {
            this.showMessage('Failed to copy to clipboard', 'error');
            
            // Fallback method
            this.fallbackCopyToClipboard(text);
        }
    }

    fallbackCopyToClipboard(text) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
            this.showMessage('Configuration copied to clipboard!', 'success');
        } catch (err) {
            this.showMessage('Failed to copy to clipboard', 'error');
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
        this.outputSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    hideOutput() {
        this.outputSection.style.display = 'none';
    }

    showMessage(text, type) {
        this.message.textContent = text;
        this.message.className = type;
        this.message.style.display = 'block';
        
        setTimeout(() => {
            this.message.style.display = 'none';
        }, 4000);
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new VlessStripper();
});
