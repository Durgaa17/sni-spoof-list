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
    }

    stripConfig() {
        const input = this.configInput.value.trim();
        
        if (!input) {
            this.showMessage('Please paste a VLESS configuration', 'error');
            return;
        }

        try {
            const stripped = this.processVlessConfig(input);
            this.strippedConfig.textContent = stripped;
            this.outputSection.style.display = 'block';
            this.showMessage('Configuration stripped successfully!', 'success');
        } catch (error) {
            this.showMessage('Error: Invalid VLESS configuration', 'error');
            this.outputSection.style.display = 'none';
        }
    }

    processVlessConfig(config) {
        // Clean the input
        config = config.trim().replace(/["']/g, '');
        
        if (!config.startsWith('vless://')) {
            throw new Error('Not a VLESS configuration');
        }

        // Parse the URL
        const url = new URL(config);
        const uuid = url.username;
        const server = url.hostname;
        const port = url.port;

        // Get parameters (from search or hash)
        const params = url.search || url.hash.replace('#', '?');
        const searchParams = new URLSearchParams(params);

        // Essential parameters in priority order
        const essentialParams = [
            'encryption',
            'security', 
            'type',
            'sni',
            'host',
            'path',
            'flow'
        ];

        // Build new URL with only essential parameters
        let newParams = new URLSearchParams();
        
        for (const param of essentialParams) {
            const value = searchParams.get(param);
            if (value) {
                newParams.set(param, value);
            }
        }

        // Set default encryption if not present
        if (!newParams.get('encryption')) {
            newParams.set('encryption', 'none');
        }

        // Build the stripped configuration
        const stripped = `vless://${uuid}@${server}:${port}?${newParams.toString()}`;
        return stripped;
    }

    copyToClipboard() {
        const text = this.strippedConfig.textContent;
        
        if (!text) return;

        // Create temporary textarea for copying
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        
        try {
            document.execCommand('copy');
            this.showMessage('Copied to clipboard!', 'success');
        } catch (err) {
            this.showMessage('Failed to copy', 'error');
        }
        
        document.body.removeChild(textarea);
    }

    showMessage(text, type) {
        this.message.textContent = text;
        this.message.className = type + ' message';
        this.message.style.display = 'block';
        
        setTimeout(() => {
            this.message.style.display = 'none';
        }, 3000);
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    new VlessStripper();
});
