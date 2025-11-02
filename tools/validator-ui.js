// tools/validator-ui.js - Phase 2: Enhanced with Connection Testing
import { validateVlessConfig, validateWithConnectionTest, generateResultsHTML } from './validator-core.js';

export function initValidatorUI(container) {
    // Get elements
    const validateBtn = document.getElementById('validateBtn');
    const validateWithConnectionBtn = document.getElementById('validateWithConnectionBtn');
    const input = document.getElementById('validatorInput');
    const resultsDiv = document.getElementById('validationResults');
    const errorDiv = document.getElementById('validatorError');

    // Add event listeners
    validateBtn.addEventListener('click', () => validateConfiguration({
        validateBtn, input, resultsDiv, errorDiv
    }, false));

    validateWithConnectionBtn.addEventListener('click', () => validateConfiguration({
        validateBtn: validateWithConnectionBtn, 
        input, 
        resultsDiv, 
        errorDiv
    }, true));

    // Auto-validate on paste (basic validation only)
    input.addEventListener('paste', (e) => {
        setTimeout(() => {
            if (input.value.trim().startsWith('vless://')) {
                validateConfiguration({
                    validateBtn, input, resultsDiv, errorDiv
                }, false);
            }
        }, 100);
    });

    // Enter key support
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            validateConfiguration({
                validateBtn, input, resultsDiv, errorDiv
            }, false);
        }
    });
}

async function validateConfiguration(elements, withConnectionTest = false) {
    const inputText = elements.input.value.trim();
    
    // Hide previous results and errors
    elements.resultsDiv.style.display = 'none';
    elements.errorDiv.style.display = 'none';

    if (!inputText) {
        showValidatorError('❌ Please paste a VLESS configuration to validate', elements);
        return;
    }

    if (!inputText.startsWith('vless://')) {
        showValidatorError('❌ This doesn\'t look like a VLESS configuration. Must start with "vless://"', elements);
        return;
    }

    try {
        // Show loading state
        const originalText = elements.validateBtn.innerHTML;
        elements.validateBtn.innerHTML = withConnectionTest ? 
            '🌐 Testing Connection...' : '⏳ Validating...';
        elements.validateBtn.disabled = true;

        let report;
        
        if (withConnectionTest) {
            report = await validateWithConnectionTest(inputText);
        } else {
            report = validateVlessConfig(inputText);
        }
        
        // Display results
        elements.resultsDiv.innerHTML = generateResultsHTML(report, withConnectionTest);
        elements.resultsDiv.style.display = 'block';
        
        // Reset button
        elements.validateBtn.innerHTML = originalText;
        elements.validateBtn.disabled = false;

        // Scroll to results
        elements.resultsDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    } catch (error) {
        showValidatorError('❌ Validation error: ' + error.message, elements);
        elements.validateBtn.innerHTML = elements.validateBtn.innerHTML.includes('Connection') ? 
            '🌐 Validate + Connection Test' : '🔍 Validate Configuration';
        elements.validateBtn.disabled = false;
    }
}

function showValidatorError(message, elements) {
    elements.errorDiv.textContent = message;
    elements.errorDiv.style.display = 'block';
    elements.resultsDiv.style.display = 'none';
}
