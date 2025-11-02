// tools/stripper-analysis.js - Analysis functions only

export function analyzeConfig(config) {
    try {
        const url = new URL(config);
        const params = new URLSearchParams(url.search);
        
        const analysis = {
            protocol: 'VLESS',
            server: url.hostname,
            port: url.port,
            uuid: url.username,
            encryption: params.get('encryption') || 'none',
            security: params.get('security') || 'none',
            type: params.get('type') || 'tcp',
            hasTLS: params.get('security') === 'tls',
            hasWebSocket: params.get('type') === 'ws',
            sni: params.get('sni'),
            host: params.get('host'),
            path: params.get('path'),
            flow: params.get('flow'),
            headerType: params.get('headerType'),
            parametersRemoved: countRemovedParameters(params)
        };

        return analysis;
    } catch (error) {
        throw new Error('Failed to analyze configuration: ' + error.message);
    }
}

export function generateAnalysisHTML(analysis) {
    const securityIcon = analysis.hasTLS ? '🔒' : '⚠️';
    const typeIcon = analysis.hasWebSocket ? '🕸️' : '🔗';
    
    return `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 0.9rem;">
            <div><strong>Protocol:</strong></div>
            <div>${analysis.protocol}</div>
            
            <div><strong>Security:</strong></div>
            <div>${securityIcon} ${analysis.security.toUpperCase()}</div>
            
            <div><strong>Type:</strong></div>
            <div>${typeIcon} ${analysis.type.toUpperCase()}</div>
            
            <div><strong>Server:</strong></div>
            <div>${analysis.server}:${analysis.port}</div>
            
            ${analysis.sni ? `
                <div><strong>SNI:</strong></div>
                <div>${analysis.sni}</div>
            ` : ''}
            
            ${analysis.host ? `
                <div><strong>Host:</strong></div>
                <div>${analysis.host}</div>
            ` : ''}
            
            ${analysis.path ? `
                <div><strong>Path:</strong></div>
                <div>${analysis.path}</div>
            ` : ''}
            
            <div><strong>Parameters Removed:</strong></div>
            <div>${analysis.parametersRemoved}</div>
        </div>
    `;
}

function countRemovedParameters(params) {
    const essentialParams = ['encryption', 'security', 'type', 'sni', 'host', 'path', 'flow', 'headerType'];
    let removedCount = 0;
    
    for (let key of params.keys()) {
        if (!essentialParams.includes(key)) {
            removedCount++;
        }
    }
    
    return removedCount;
}

// Export validation functions too
export function validateConfig(config) {
    const errors = [];
    
    if (!config.startsWith('vless://')) {
        errors.push('Must start with vless://');
    }
    
    try {
        const url = new URL(config);
        if (!url.username) errors.push('Missing UUID');
        if (!url.hostname) errors.push('Missing server address');
        if (!url.port) errors.push('Missing port');
    } catch (e) {
        errors.push('Invalid URL format');
    }
    
    return {
        isValid: errors.length === 0,
        errors: errors
    };
}
