// tools/validator-core.js - Enhanced with simple connection testing
import { analyzeConfig } from './stripper-analysis.js';
import { validateAgainstRules, calculateConfigScore } from '../shared/validation-rules.js';
import { testConnection, generateConnectionReport } from '../shared/connection-tester.js';

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

export async function validateWithConnectionTest(config) {
    try {
        // Step 1: Basic validation
        const validationReport = validateVlessConfig(config);
        
        // Step 2: Connection test (if config is valid)
        let connectionReport = null;
        if (validationReport.isValid) {
            connectionReport = await testConnection(validationReport.analysis);
        }
        
        // Step 3: Combined report
        return {
            validation: validationReport,
            connection: connectionReport,
            overallScore: calculateOverallScore(validationReport, connectionReport),
            timestamp: new Date().toISOString()
        };

    } catch (error) {
        return {
            validation: {
                isValid: false,
                errors: ['Validation failed: ' + error.message],
                warnings: [],
                suggestions: [],
                score: 0,
                analysis: null
            },
            connection: null,
            overallScore: 0,
            timestamp: new Date().toISOString()
        };
    }
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
            
            <div style="display: flex; gap: 10px; margin-bottom: 20px; flex-wrap: wrap;">
                <button class="stripper-btn" id="validateBtn" style="flex: 1;">
                    🔍 Validate Configuration
                </button>
                <button class="stripper-btn" id="validateWithConnectionBtn" style="flex: 1; background: #17a2b8;">
                    🌐 Validate + Connection Test
                </button>
            </div>
            
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

export function generateResultsHTML(report, includeConnection = false) {
    const validation = report.validation || report;
    const connection = report.connection;
    
    const scoreColor = validation.score >= 80 ? '#28a745' : 
                      validation.score >= 60 ? '#ffc107' : '#dc3545';
    
    const scoreEmoji = validation.score >= 80 ? '🎉' : 
                      validation.score >= 60 ? '⚠️' : '❌';

    let connectionHTML = '';
    
    if (includeConnection && connection) {
        const connectionReport = generateConnectionReport(connection);
        connectionHTML = generateConnectionHTML(connectionReport);
    }

    return `
        <div class="validation-results">
            <!-- Score Header -->
            <div style="text-align: center; margin-bottom: 25px; padding: 20px; background: #1a1a1a; border-radius: 10px; border-left: 4px solid ${scoreColor};">
                <div style="font-size: 2rem; margin-bottom: 10px;">${scoreEmoji}</div>
                <h3 style="margin: 0 0 5px 0; color: ${scoreColor};">
                    ${validation.isValid ? 'VALID CONFIGURATION' : 'INVALID CONFIGURATION'}
                </h3>
                <div style="font-size: 1.5rem; font-weight: bold; color: ${scoreColor};">
                    ${includeConnection && report.overallScore ? 
                      `Overall Score: ${report.overallScore}/100` : 
                      `Score: ${validation.score}/100`}
                </div>
                ${includeConnection && connection ? `
                    <div style="margin-top: 10px; font-size: 0.9rem; color: #888;">
                        Test Method: Browser Direct Test
                    </div>
                ` : ''}
            </div>

            <!-- Connection Test Results -->
            ${connectionHTML}

            <!-- Configuration Analysis -->
            <div style="margin-bottom: 20px; padding: 15px; background: #1a1a1a; border-radius: 5px;">
                <h4 style="margin-bottom: 10px;">📊 Configuration Analysis</h4>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 0.9rem;">
                    <div><strong>Protocol:</strong></div>
                    <div>${validation.analysis.protocol}</div>
                    
                    <div><strong>Security:</strong></div>
                    <div>${validation.analysis.hasTLS ? '🔒 TLS' : '⚠️ None'}</div>
                    
                    <div><strong>Type:</strong></div>
                    <div>${validation.analysis.hasWebSocket ? '🕸️ WebSocket' : '🔗 TCP'}</div>
                    
                    <div><strong>Server:</strong></div>
                    <div>${validation.analysis.server}:${validation.analysis.port}</div>
                    
                    ${validation.analysis.sni ? `
                        <div><strong>SNI:</strong></div>
                        <div>${validation.analysis.sni}</div>
                    ` : ''}
                    
                    ${validation.analysis.host ? `
                        <div><strong>Host:</strong></div>
                        <div>${validation.analysis.host}</div>
                    ` : ''}
                    
                    ${validation.analysis.path ? `
                        <div><strong>Path:</strong></div>
                        <div>${validation.analysis.path}</div>
                    ` : ''}
                </div>
            </div>

            <!-- Errors -->
            ${validation.errors.length > 0 ? `
                <div style="margin-bottom: 20px; padding: 15px; background: #2d1a1a; border-radius: 5px; border-left: 4px solid #dc3545;">
                    <h4 style="margin-bottom: 10px; color: #dc3545;">❌ Critical Errors</h4>
                    <ul style="margin: 0; padding-left: 20px;">
                        ${validation.errors.map(error => `<li>${error}</li>`).join('')}
                    </ul>
                </div>
            ` : ''}

            <!-- Warnings -->
            ${validation.warnings.length > 0 ? `
                <div style="margin-bottom: 20px; padding: 15px; background: #2d2a1a; border-radius: 5px; border-left: 4px solid #ffc107;">
                    <h4 style="margin-bottom: 10px; color: #ffc107;">⚠️ Warnings</h4>
                    <ul style="margin: 0; padding-left: 20px;">
                        ${validation.warnings.map(warning => `<li>${warning}</li>`).join('')}
                    </ul>
                </div>
            ` : ''}

            <!-- Suggestions -->
            ${validation.suggestions.length > 0 ? `
                <div style="margin-bottom: 20px; padding: 15px; background: #1a2d1a; border-radius: 5px; border-left: 4px solid #28a745;">
                    <h4 style="margin-bottom: 10px; color: #28a745;">💡 Suggestions</h4>
                    <ul style="margin: 0; padding-left: 20px;">
                        ${validation.suggestions.map(suggestion => `<li>${suggestion}</li>`).join('')}
                    </ul>
                </div>
            ` : ''}

            <!-- Timestamp -->
            <div style="text-align: center; color: #666; font-size: 0.8rem; margin-top: 20px;">
                Validated at: ${new Date(validation.timestamp).toLocaleString()}
            </div>
        </div>
    `;
}

function generateConnectionHTML(connectionReport) {
    const statusColor = connectionReport.status === 'success' ? '#28a745' :
                       connectionReport.status === 'warning' ? '#ffc107' : '#dc3545';
    
    const statusIcon = connectionReport.status === 'success' ? '✅' :
                      connectionReport.status === 'warning' ? '⚠️' : '❌';

    return `
        <div style="margin-bottom: 20px; padding: 15px; background: #1a1a1a; border-radius: 5px; border-left: 4px solid ${statusColor};">
            <h4 style="margin-bottom: 10px;">🔗 Connection Test Results</h4>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 0.9rem;">
                <div><strong>Status:</strong></div>
                <div>${statusIcon} ${connectionReport.summary}</div>
                
                <div><strong>Details:</strong></div>
                <div>${connectionReport.details}</div>
                
                ${connectionReport.latency ? `
                    <div><strong>Latency:</strong></div>
                    <div>${connectionReport.latency}ms</div>
                ` : ''}
                
                ${connectionReport.protocol ? `
                    <div><strong>Protocol:</strong></div>
                    <div>${connectionReport.protocol.toUpperCase()}</div>
                ` : ''}
                
                <div><strong>Method:</strong></div>
                <div>${connectionReport.method === 'browser_direct' ? '🔧 Browser Direct Test' : '🌐 External API'}</div>
            </div>
            
            ${connectionReport.error ? `
                <div style="margin-top: 10px; padding: 10px; background: #2d1a1a; border-radius: 3px;">
                    <strong>Error Details:</strong> ${connectionReport.error}
                </div>
            ` : ''}
        </div>
    `;
}

function calculateOverallScore(validationReport, connectionReport) {
    if (!validationReport.isValid) return 0;
    
    let score = validationReport.score;
    
    // Adjust score based on connection test results
    if (connectionReport) {
        const connectionResult = connectionReport.result;
        
        if (connectionResult && connectionResult.summary && connectionResult.summary.reachable) {
            // Bonus for good connection
            score += 15;
            
            // Extra bonus for low latency
            if (connectionResult.summary.latency && connectionResult.summary.latency < 100) {
                score += 5;
            }
        } else {
            // Penalty for connection issues
            score -= 25;
        }
    }
    
    return Math.max(0, Math.min(100, score));
}

export function generateConfigPreview(config) {
    if (config.length <= 70) return config;
    
    const start = config.substring(0, 50);
    const end = config.substring(config.length - 20);
    return `${start}...${end}`;
}
