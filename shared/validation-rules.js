// shared/validation-rules.js - Shared validation rules for all tools

export const VLESS_RULES = {
    REQUIRED_FIELDS: ['encryption', 'security', 'type'],
    PORT_RANGE: { min: 1, max: 65535 },
    VALID_TYPES: ['tcp', 'ws', 'grpc', 'h2', 'kcp'],
    VALID_SECURITY: ['none', 'tls', 'reality', 'xtls'],
    VALID_ENCRYPTION: ['none'],
    TLS_REQUIRES_SNI: true,
    WS_REQUIRES_PATH: false, // Path is recommended but not required
    WS_REQUIRES_HOST: false  // Host is recommended but not required
};

export function validateAgainstRules(configAnalysis) {
    const errors = [];
    const warnings = [];
    const suggestions = [];

    const { server, port, encryption, security, type, sni, host, path } = configAnalysis;

    // === CRITICAL ERRORS ===
    
    // UUID validation
    if (!configAnalysis.uuid) {
        errors.push('Missing UUID');
    } else if (!isValidUUID(configAnalysis.uuid)) {
        errors.push('Invalid UUID format');
    }

    // Server validation
    if (!server) {
        errors.push('Missing server address');
    }

    // Port validation
    if (!port) {
        errors.push('Missing port');
    } else if (port < VLESS_RULES.PORT_RANGE.min || port > VLESS_RULES.PORT_RANGE.max) {
        errors.push(`Port must be between ${VLESS_RULES.PORT_RANGE.min}-${VLESS_RULES.PORT_RANGE.max}`);
    }

    // Encryption validation
    if (!encryption) {
        errors.push('Missing encryption parameter');
    } else if (!VLESS_RULES.VALID_ENCRYPTION.includes(encryption)) {
        errors.push(`Invalid encryption: ${encryption}. Must be: ${VLESS_RULES.VALID_ENCRYPTION.join(', ')}`);
    }

    // Security validation
    if (!security) {
        errors.push('Missing security parameter');
    } else if (!VLESS_RULES.VALID_SECURITY.includes(security)) {
        errors.push(`Invalid security: ${security}. Must be: ${VLESS_RULES.VALID_SECURITY.join(', ')}`);
    }

    // Type validation
    if (!type) {
        errors.push('Missing type parameter');
    } else if (!VLESS_RULES.VALID_TYPES.includes(type)) {
        errors.push(`Invalid type: ${type}. Must be: ${VLESS_RULES.VALID_TYPES.join(', ')}`);
    }

    // === WARNINGS ===

    // TLS without SNI
    if (security === 'tls' && !sni) {
        warnings.push('TLS enabled but no SNI specified - may cause connection issues');
    }

    // WebSocket recommendations
    if (type === 'ws') {
        if (!host) {
            warnings.push('WebSocket type without host header - recommended for CDN compatibility');
        }
        if (!path) {
            warnings.push('WebSocket type without path - recommended to avoid detection');
        }
    }

    // Security recommendations
    if (security === 'none') {
        warnings.push('No security layer - consider using TLS for production');
    }

    // === SUGGESTIONS ===

    // Performance suggestions
    if (type === 'tcp' && security === 'tls') {
        suggestions.push('Consider using WebSocket (ws) for better anti-censorship');
    }

    // Security suggestions
    if (security === 'tls' && !configAnalysis.alpn) {
        suggestions.push('Add ALPN parameter for better TLS handshake');
    }

    // Flow control
    if (!configAnalysis.flow && security === 'tls') {
        suggestions.push('Consider adding flow control for better performance');
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
    
    // Deduct points for warnings
    score -= warnings.length * 5;
    
    // Ensure score is between 0-100
    return Math.max(0, Math.min(100, score));
}

function isValidUUID(uuid) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
}

// Export for other tools to use
export default {
    VLESS_RULES,
    validateAgainstRules,
    calculateConfigScore
};
