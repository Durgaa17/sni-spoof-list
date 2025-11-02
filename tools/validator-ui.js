// tools/validator-ui.js - Phase 1: Real Validation
import { validateVlessConfig, generateResultsHTML } from './validator-core.js';

export function initValidatorUI(container) {
    // Get elements
    const validateBtn = document.getElementById('validateBtn');
    const input = document.getElementById('validatorInput');
    const resultsDiv = document.getElementById('validationResults');
    const errorDiv = document.getElementById('validatorError');

    // Add event listeners
    validateBtn.addEventListener('click', () => validateConfiguration({
        validateBtn, input, resultsDiv, errorDiv
    }));

    // Auto-validate on paste
    input.addEventListener('paste', (e) => {
        setTimeout(() => {
            if (input.value.trim().startsWith('vless://')) {
                validateConfiguration({
                    validateBtn, input, resultsDiv, errorDiv
                });
            }
        }, 100);
    });

    // Enter key support
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            validateConfiguration({
                validateBtn, input, resultsDiv, errorDiv
            });
        }
    });
}

function validateConfiguration(elements) {
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
        elements.validateBtn.innerHTML = '⏳ Validating...';
        elements.validateBtn.disabled = true;

        setTimeout(() => {
            // Perform real validation
            const report = validateVlessConfig(inputText);
            
            // Display results
            elements.resultsDiv.innerHTML = generateResultsHTML(report);
            elements.resultsDiv.style.display = 'block';
            
            // Reset button
            elements.validateBtn.innerHTML = '🔍 Validate Configuration';
            elements.validateBtn.disabled = false;

            // Scroll to results
            elements.resultsDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

        }, 300);

    } catch (error) {
        showValidatorError('❌ Validation error: ' + error.message, elements);
        elements.validateBtn.innerHTML = '🔍 Validate Configuration';
        elements.validateBtn.disabled = false;
    }
}

function showValidatorError(message, elements) {
    elements.errorDiv.textContent = message;
    elements.errorDiv.style.display = 'block';
    elements.resultsDiv.style.display = 'none';
}
