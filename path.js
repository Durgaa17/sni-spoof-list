// path.js - Add new viewers
export const MODULE_PATHS = {
    TOOLS: {
        VLESS_STRIPPER: 'tools/stripper.js',
        CONFIG_VALIDATOR: 'tools/validator.js',
        DOMAINS_VIEWER: 'tools/domains-viewer.js',    // NEW
        SNI_VIEWER: 'tools/sni-viewer.js',            // NEW
        STRIPPER_ANALYSIS: 'tools/stripper-analysis.js',
        STRIPPER_CORE: 'tools/stripper-core.js',
        STRIPPER_UI: 'tools/stripper-ui.js',
        VALIDATOR_CORE: 'tools/validator-core.js',
        VALIDATOR_UI: 'tools/validator-ui.js'
    },
    SHARED: {
        VALIDATION_RULES: 'shared/validation-rules.js',
        CONNECTION_TESTER: 'shared/connection-tester.js',
        PING_TESTER: 'shared/ping-tester.js',
        PORT_TESTER: 'shared/port-tester.js'
    },
    EXTERNAL: {
        CHECK_HOST_API: 'shared/external/check-host-api.js',
        API_CONFIG: 'shared/external/api-config.js'
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
