// path.js - Central configuration for all module paths
export const MODULE_PATHS = {
    TOOLS: {
        VLESS_STRIPPER: 'tools/stripper.js',
        // Add more tools here as you create them
        STRIPPER_ANALYSIS: 'tools/stripper-analysis.js',  // NEW
        STRIPPER_CORE: 'tools/stripper-core.js',      // NEW
        STRIPPER_UI: 'tools/stripper-ui.js',          // NEW
        CONFIG_VALIDATOR: 'tools/validator.js',
        SNI_CHECKER: 'tools/sni-checker.js'
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

// Example of how to add new paths easily:
/*
export const MODULE_PATHS = {
    TOOLS: {
        VLESS_STRIPPER: 'tools/stripper.js',
        NEW_TOOL: 'tools/new-tool.js'  // Just add here!
    }
};
*/
