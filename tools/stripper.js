// tools/stripper.js - Main coordinator (now very simple!)
import { getStripperHTML } from './stripper-core.js';
import { initStripperUI } from './stripper-ui.js';

export default function initStripper(container) {
    console.log('VLESS Stripper tool loaded successfully!');
    
    // Add HTML to container
    container.insertAdjacentHTML('beforeend', getStripperHTML());
    
    // Initialize UI event handlers
    initStripperUI(container);
}
