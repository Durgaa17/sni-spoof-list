// shared/validation-rules.js
export const VLESS_RULES = {
    REQUIRED_FIELDS: ['encryption', 'security', 'type'],
    PORT_RANGE: { min: 1, max: 65535 },
    VALID_TYPES: ['tcp', 'ws', 'grpc', 'h2', 'kcp'],
    VALID_SECURITY: ['none', 'tls', 'reality', 'xtls'],
    VALID_ENCRYPTION: ['none'],
    TLS_REQUIRES_SNI: true,
    WS_REQUIRES_PATH: false,
    WS_REQUIRES_HOST: false
};

export function validateAgainstRules(configAnalysis) {
    const errors = [];
    const warnings = [];
    const suggestions = [];

    const { server, port, encryption, security, type, sni, host, path } = configAnalysis;

    // Critical Errors
    if (!configAnalysis.uuid) errors.push('Missing UUID');
    else if (!isValidUUID(configAnalysis.uuid)) errors.push('Invalid UUID format');

    if (!server) errors.push('Missing server address');
    if (!port) errors.push('Missing port');
    else if (port < VLESS_RULES.PORT_RANGE.min || port > VLESS_RULES.PORT_RANGE.max) {
        errors.push(`Port must be between ${VLESS_RULES.PORT_RANGE.min}-${VLESS_RULES.PORT_RANGE.max}`);
    }

    if (!encryption) errors.push('Missing encryption parameter');
    else if (!VLESS_RULES.VALID_ENCRYPTION.includes(encryption)) {
        errors.push(`Invalid encryption: ${encryption}`);
    }

    if (!security) errors.push('Missing security parameter');
    else if (!VLESS_RULES.VALID_SECURITY.includes(security)) {
        errors.push(`Invalid security: ${security}`);
    }

    if (!type) errors.push('Missing type parameter');
    else if (!VLESS_RULES.VALID_TYPES.includes(type)) {
        errors.push(`Invalid type: ${type}`);
    }

    // Warnings
    if (security === 'tls' && !sni) {
        warnings.push('TLS enabled but no SNI specified');
    }

    if (type === 'ws') {
        if (!host) warnings.push('WebSocket type without host header');
        if (!path) warnings.push('WebSocket type without path');
    }

    if (security === 'none') {
        warnings.push('No security layer - consider using TLS');
    }

    // Suggestions
    if (type === 'tcp' && security === 'tls') {
        suggestions.push('Consider using WebSocket for better anti-censorship');
    }

    return {
        isValid: errors.length === 0,
        errors,
        warnings,
        suggestions,
        score: calculateConfigScore(errors, warnings)
    };
}

export function calculateConfigScore(errors, warnings) {
    if (errors.length > 0) return 0;
    let score = 100;
    score -= warnings.length * 5;
    return Math.max(0, Math.min(100, score));
}

function isValidUUID(uuid) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
}
