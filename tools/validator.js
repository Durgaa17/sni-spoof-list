// tools/validator.js - Main validator coordinator
import { getValidatorHTML } from './validator-core.js';
import { initValidatorUI } from './validator-ui.js';

export default function initValidator(container) {
    console.log('Config Validator tool loaded successfully!');
    
    // Add HTML to container
    container.insertAdjacentHTML('beforeend', getValidatorHTML());
    
    // Initialize UI event handlers
    initValidatorUI(container);
}
