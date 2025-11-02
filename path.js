// path.js - Central configuration for all module paths
export const MODULE_PATHS = {
    TOOLS: {
        VLESS_STRIPPER: 'tools/stripper.js',
        // Add more tools here as you create them
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
