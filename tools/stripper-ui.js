// tools/stripper-ui.js - UI event handlers and interactions
import { processVlessConfig } from './stripper-core.js';
import { analyzeConfig, generateAnalysisHTML, validateConfig } from './stripper-analysis.js';

export function initStripperUI(container) {
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
    stripBtn.addEventListener('click', () => stripVlessConfig({
        stripBtn, input, output, result, analysisDiv, analysisResult, errorMessage
    }));
    
    copyBtn.addEventListener('click', () => copyStrippedConfig({
        copyBtn, result, errorMessage
    }));
    
    clearBtn.addEventListener('click', () => clearAll({
        input, output, analysisDiv, errorMessage
    }));

    // Auto-strip on paste
    input.addEventListener('paste', (e) => {
        setTimeout(() => {
            if (input.value.trim().startsWith('vless://')) {
                stripVlessConfig({
                    stripBtn, input, output, result, analysisDiv, analysisResult, errorMessage
                });
            }
        }, 100);
    });
}

function showError(message, elements) {
    elements.errorMessage.textContent = message;
    elements.errorMessage.style.display = 'block';
    elements.output.style.display = 'none';
    elements.analysisDiv.style.display = 'none';
}

function stripVlessConfig(elements) {
    const inputText = elements.input.value.trim();
    
    // Hide previous errors and analysis
    elements.errorMessage.style.display = 'none';
    elements.analysisDiv.style.display = 'none';
    elements.output.style.display = 'none';

    // Validate first
    const validation = validateConfig(inputText);
    if (!validation.isValid) {
        showError('❌ ' + validation.errors.join(', '), elements);
        return;
    }

    try {
        elements.stripBtn.innerHTML = '⏳ Processing...';
        elements.stripBtn.disabled = true;

        setTimeout(() => {
            // Process configuration
            const stripped = processVlessConfig(inputText);
            
            // Generate analysis
            const analysis = analyzeConfig(inputText);
            const analysisHTML = generateAnalysisHTML(analysis);
            
            // Display results
            elements.result.textContent = stripped;
            elements.analysisResult.innerHTML = analysisHTML;
            elements.analysisDiv.style.display = 'block';
            elements.output.style.display = 'block';
            
            elements.stripBtn.innerHTML = '🛠️ Strip Configuration';
            elements.stripBtn.disabled = false;

            // Scroll to result
            elements.output.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 300);

    } catch (error) {
        showError('❌ Error: ' + error.message, elements);
        elements.stripBtn.innerHTML = '🛠️ Strip Configuration';
        elements.stripBtn.disabled = false;
    }
}

function copyStrippedConfig(elements) {
    const text = elements.result.textContent;
    if (!text) {
        showError('❌ No configuration to copy', elements);
        return;
    }

    navigator.clipboard.writeText(text).then(() => {
        elements.copyBtn.innerHTML = '✅ Copied!';
        setTimeout(() => {
            elements.copyBtn.innerHTML = '📋 Copy';
        }, 2000);
    }).catch(err => {
        // Fallback for older browsers
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        
        elements.copyBtn.innerHTML = '✅ Copied!';
        setTimeout(() => {
            elements.copyBtn.innerHTML = '📋 Copy';
        }, 2000);
    });
}

function clearAll(elements) {
    elements.input.value = '';
    elements.output.style.display = 'none';
    elements.analysisDiv.style.display = 'none';
    elements.errorMessage.style.display = 'none';
    elements.input.focus();
}
