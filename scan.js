class VlessStripper {
    constructor() {
        this.configInput = document.getElementById('configInput');
        this.stripBtn = document.getElementById('stripBtn');
        this.outputSection = document.getElementById('outputSection');
        this.strippedConfig = document.getElementById('strippedConfig');
        this.copyBtn = document.getElementById('copyBtn');
        this.message = document.getElementById('message');
        
        this.initEventListeners();
    }

    initEventListeners() {
        this.stripBtn.addEventListener('click', () => this.stripConfig());
        this.copyBtn.addEventListener('click', () => this.copyToClipboard());
        
        // Auto-strip when paste happens
        this.configInput.addEventListener('paste', (e) => {
            setTimeout(() => {
                this.stripConfig();
            }, 100);
        });
    }

    stripConfig() {
        const input = this.configInput.value.trim();
        
        if (!input) {
            this.showMessage('Please paste a VLESS configuration', 'error');
            this.hideOutput();
            return;
        }

        try {
            const stripped = this.processVlessConfig(input);
            this.strippedConfig.textContent = stripped;
            this.showOutput();
            this.showMessage('Configuration stripped successfully!', 'success');
        } catch (error) {
            this.showMessage('Error: Invalid VLESS configuration format', 'error');
            this.hideOutput();
            console.error('Stripping error:', error);
        }
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
            const params = new URLSearchParams(parsed.hash.substring(1)); // Remove # from hash
            
            // Get type (default to tcp if not specified)
            const type = params.get('type') || 'tcp';
            
            // Get security (default to none if not specified)
            const security = params.get('security') || 'none';
            
            // Build stripped configuration
            let stripped = `vless://${uuid}@${server}:${port}`;
            stripped += `?type=${type}&security=${security}`;
            
            // Add path for ws types
            if (type === 'ws' && params.get('path')) {
                stripped += `&path=${encodeURIComponent(params.get('path'))}`;
            }
            
            // Add host header if present
            if (params.get('host')) {
                stripped += `&host=${encodeURIComponent(params.get('host'))}`;
            }
            
            // Add sni if present
            if (params.get('sni')) {
                stripped += `&sni=${encodeURIComponent(params.get('sni'))}`;
            }
            
            // Add flow if present (for xtls-rprx-vision, etc)
            if (params.get('flow')) {
                stripped += `&flow=${params.get('flow')}`;
            }
            
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
        
        try {
            await navigator.clipboard.writeText(text);
            this.copyBtn.textContent = 'Copied!';
            this.copyBtn.classList.add('copied');
            this.showMessage('Configuration copied to clipboard!', 'success');
            
            setTimeout(() => {
                this.copyBtn.textContent = 'Copy';
                this.copyBtn.classList.remove('copied');
            }, 2000);
        } catch (error) {
            this.showMessage('Failed to copy to clipboard', 'error');
            console.error('Copy error:', error);
        }
    }

    showOutput() {
        this.outputSection.style.display = 'block';
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
        }, 3000);
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new VlessStripper();
});
