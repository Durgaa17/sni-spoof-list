// tools/validator-core.js - Validator business logic
import { analyzeConfig } from './stripper-analysis.js';
import { validateAgainstRules, calculateConfigScore } from '../shared/validation-rules.js';

export function validateVlessConfig(config) {
    try {
        // Step 1: Basic analysis (reuse from stripper)
        const analysis = analyzeConfig(config);
        
        // Step 2: Advanced validation against rules
        const validation = validateAgainstRules(analysis);
        
        // Step 3: Generate detailed report
        const report = {
            ...validation,
            analysis: analysis,
            timestamp: new Date().toISOString(),
            configPreview: generateConfigPreview(config)
        };

        return report;

    } catch (error) {
        return {
            isValid: false,
            errors: ['Invalid configuration format: ' + error.message],
            warnings: [],
            suggestions: [],
            score: 0,
            analysis: null,
            timestamp: new Date().toISOString()
        };
    }
}

export function generateConfigPreview(config) {
    // Show first 50 chars and last 20 chars to give preview without exposing full config
    if (config.length <= 70) return config;
    
    const start = config.substring(0, 50);
    const end = config.substring(config.length - 20);
    return `${start}...${end}`;
}

export function getValidatorHTML() {
    return `
        <div class="config-validator">
            <h2>✅ VLESS Configuration Validator</h2>
            <p style="color: #888; margin-bottom: 20px;">
                Validate your VLESS configurations for errors, warnings, and best practices.
            </p>
            
            <div style="margin-bottom: 15px;">
                <label for="validatorInput" style="display: block; margin-bottom: 8px; font-weight: bold;">
                    Paste VLESS Configuration to Validate:
                </label>
                <textarea 
                    class="stripper-input" 
                    id="validatorInput" 
                    placeholder="vless://uuid@server.com:443?encryption=none&security=tls&sni=domain.com&type=ws&host=domain.com&path=/path"
                    rows="5"
                ></textarea>
            </div>
            
            <button class="stripper-btn" id="validateBtn">
                🔍 Validate Configuration
            </button>
            
            <div style="margin: 20px 0; text-align: center; color: #666;">
                ↓
            </div>
            
            <!-- Validation Results -->
            <div id="validationResults" style="display: none;">
                <!-- Results will be dynamically inserted here -->
            </div>

            <div id="validatorError" class="error" style="display: none; margin-top: 15px;">
                <!-- Error messages will appear here -->
            </div>
        </div>
    `;
}

export function generateResultsHTML(report) {
    const scoreColor = report.score >= 80 ? '#28a745' : 
                      report.score >= 60 ? '#ffc107' : '#dc3545';
    
    const scoreEmoji = report.score >= 80 ? '🎉' : 
                      report.score >= 60 ? '⚠️' : '❌';

    return `
        <div class="validation-results">
            <!-- Score Header -->
            <div style="text-align: center; margin-bottom: 25px; padding: 20px; background: #1a1a1a; border-radius: 10px; border-left: 4px solid ${scoreColor};">
                <div style="font-size: 2rem; margin-bottom: 10px;">${scoreEmoji}</div>
                <h3 style="margin: 0 0 5px 0; color: ${scoreColor};">
                    ${report.isValid ? 'VALID CONFIGURATION' : 'INVALID CONFIGURATION'}
                </h3>
                <div style="font-size: 1.5rem; font-weight: bold; color: ${scoreColor};">
                    Score: ${report.score}/100
                </div>
            </div>

            <!-- Configuration Analysis -->
            <div style="margin-bottom: 20px; padding: 15px; background: #1a1a1a; border-radius: 5px;">
                <h4 style="margin-bottom: 10px;">📊 Configuration Analysis</h4>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 0.9rem;">
                    <div><strong>Protocol:</strong></div>
                    <div>${report.analysis.protocol}</div>
                    
                    <div><strong>Security:</strong></div>
                    <div>${report.analysis.hasTLS ? '🔒 TLS' : '⚠️ None'}</div>
                    
                    <div><strong>Type:</strong></div>
                    <div>${report.analysis.hasWebSocket ? '🕸️ WebSocket' : '🔗 TCP'}</div>
                    
                    <div><strong>Server:</strong></div>
                    <div>${report.analysis.server}:${report.analysis.port}</div>
                    
                    ${report.analysis.sni ? `
                        <div><strong>SNI:</strong></div>
                        <div>${report.analysis.sni}</div>
                    ` : ''}
                </div>
            </div>

            <!-- Errors -->
            ${report.errors.length > 0 ? `
                <div style="margin-bottom: 20px; padding: 15px; background: #2d1a1a; border-radius: 5px; border-left: 4px solid #dc3545;">
                    <h4 style="margin-bottom: 10px; color: #dc3545;">❌ Critical Errors</h4>
                    <ul style="margin: 0; padding-left: 20px;">
                        ${report.errors.map(error => `<li>${error}</li>`).join('')}
                    </ul>
                </div>
            ` : ''}

            <!-- Warnings -->
            ${report.warnings.length > 0 ? `
                <div style="margin-bottom: 20px; padding: 15px; background: #2d2a1a; border-radius: 5px; border-left: 4px solid #ffc107;">
                    <h4 style="margin-bottom: 10px; color: #ffc107;">⚠️ Warnings</h4>
                    <ul style="margin: 0; padding-left: 20px;">
                        ${report.warnings.map(warning => `<li>${warning}</li>`).join('')}
                    </ul>
                </div>
            ` : ''}

            <!-- Suggestions -->
            ${report.suggestions.length > 0 ? `
                <div style="margin-bottom: 20px; padding: 15px; background: #1a2d1a; border-radius: 5px; border-left: 4px solid #28a745;">
                    <h4 style="margin-bottom: 10px; color: #28a745;">💡 Suggestions</h4>
                    <ul style="margin: 0; padding-left: 20px;">
                        ${report.suggestions.map(suggestion => `<li>${suggestion}</li>`).join('')}
                    </ul>
                </div>
            ` : ''}

            <!-- Timestamp -->
            <div style="text-align: center; color: #666; font-size: 0.8rem; margin-top: 20px;">
                Validated at: ${new Date(report.timestamp).toLocaleString()}
            </div>
        </div>
    `;
}
