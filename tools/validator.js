// tools/validator.js - Main coordinator
import { getValidatorHTML } from './validator-core.js';
import { initValidatorUI } from './validator-ui.js';

export default function initValidator(container) {
    console.log('Config Validator tool loaded successfully!');
    container.insertAdjacentHTML('beforeend', getValidatorHTML());
    initValidatorUI(container);
}
