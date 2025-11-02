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

        // Auto-strip when typing VLESS URL pattern
        this.configInput.addEventListener('input', (e) => {
            const value = e.target.value.trim();
            if (value.startsWith('vless://') && value.length > 60) {
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
        
        throw new Error('Please use VLESS URL format starting with vless://');
    }

    parseVlessUrl(url) {
        try {
            // Clean the URL - handle both ? and # parameters
            let cleanUrl = url;
            
            // If URL has # but no ?, replace # with ? for proper parsing
            if (url.includes('#') && !url.includes('?')) {
                cleanUrl = url.replace('#', '?');
            }
            
            const parsed = new URL(cleanUrl);
            
            // Extract basic components
            const uuid = parsed.username;
            const server = parsed.hostname;
            const port = parsed.port;
            
            // Get parameters from search OR hash
            const searchParams = parsed.searchParams;
            const hashParams = new URLSearchParams(parsed.hash.substring(1));
            const params = searchParams.toString() ? searchParams : hashParams;
            
            // Essential parameters based on your examples
            const type = params.get('type') || 'tcp';
            const security = params.get('security') || 'none';
            const encryption = params.get('encryption') || 'none';
            const path = params.get('path');
            const host = params.get('host');
            const sni = params.get('sni');
            
            // Build stripped configuration - optimized for your use cases
            let stripped = `vless://${uuid}@${server}:${port}?`;
            
            // Add essential parameters in optimal order
            const essentialParams = [];
            
            // Always include encryption and security
            essentialParams.push(`encryption=${encryption}`);
            essentialParams.push(`security=${security}`);
            
            // Add type
            essentialParams.push(`type=${type}`);
            
            // Add WebSocket specific parameters if type is ws
            if (type === 'ws') {
                if (host) {
                    essentialParams.push(`host=${encodeURIComponent(host)}`);
                }
                if (path) {
                    essentialParams.push(`path=${encodeURIComponent(path)}`);
                }
            }
            
            // Add TLS specific parameters
            if (security === 'tls' && sni) {
                essentialParams.push(`sni=${encodeURIComponent(sni)}`);
            }
            
            // Join all parameters
            stripped += essentialParams.join('&');
            
            return stripped;
            
        } catch (error) {
            console.error('URL parsing error:', error);
            throw new Error('Invalid VLESS URL format');
        }
    }

    async copyToClipboard() {
        const text = this.strippedConfig.textContent;
        
        if (!text)
