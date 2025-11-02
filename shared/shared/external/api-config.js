// shared/external/api-config.js - External API configurations
export const EXTERNAL_APIS = {
    CHECK_HOST: {
        BASE_URL: 'https://check-host.net',
        ENDPOINTS: {
            PING: '/check-ping',
            HTTP: '/check-http',
            TCP: '/check-tcp',
            DNS: '/check-dns'
        },
        // Free tier limits
        RATE_LIMIT: {
            requestsPerMinute: 10,
            requestsPerHour: 50
        }
    }
};

// API keys and configurations (can be expanded later)
export const API_KEYS = {
    CHECK_HOST: null // Free tier doesn't need API key
};
