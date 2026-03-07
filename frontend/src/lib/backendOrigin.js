function parseOrigin(input) {
    try {
        return new URL(input);
    } catch {
        return null;
    }
}

function normalizeConfiguredOrigin() {
    const configured =
        import.meta.env.VITE_BACKEND_ORIGIN ||
        import.meta.env.VITE_BACKEND_URL ||
        import.meta.env.VITE_API_BASE_URL ||
        "http://127.0.0.1:8000";

    const parsed = parseOrigin(configured);
    if (!parsed) {
        return "http://127.0.0.1:8000";
    }

    return `${parsed.protocol}//${parsed.host}`;
}

export function resolveBackendOrigin() {
    const configuredOrigin = normalizeConfiguredOrigin();
    return configuredOrigin;
}

export function resolveApiBaseUrl() {
    return `${resolveBackendOrigin()}/api`;
}
