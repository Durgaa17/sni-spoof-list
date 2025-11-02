// path.js - Central configuration for all module paths
export const MODULE_PATHS = {
    TOOLS: {
        VLESS_STRIPPER: 'tools/stripper.js',
        STRIPPER_ANALYSIS: 'tools/stripper-analysis.js',
        STRIPPER_CORE: 'tools/stripper-core.js',
        STRIPPER_UI: 'tools/stripper-ui.js',
        CONFIG_VALIDATOR: 'tools/validator.js',
        VALIDATOR_CORE: 'tools/validator-core.js',
        VALIDATOR_UI: 'tools/validator-ui.js'
        // Add more tools here as needed
    },
    SHARED: {
        VALIDATION_RULES: 'shared/validation-rules.js',
        CONNECTION_TESTER: 'shared/connection-tester.js',  // NEW
        PING_TESTER: 'shared/ping-tester.js',             // NEW
        PORT_TESTER: 'shared/port-tester.js'              // NEW
    },
    ASSETS: {
        IMAGES: 'assets/images/',
        ICONS: 'assets/icons/'
    },
    PAGES: {
        ABOUT: 'pages/about.js',
        HELP: 'pages/help.js'
    }
};
