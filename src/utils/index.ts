export function createPageUrl(pageName: string) {
    return '/' + pageName.replace(/ /g, '-');
}

/**
 * Returns the current location ID based on the subdomain.
 * e.g. "cafe1.yourdomain.com" → "cafe1"
 * Falls back to "default" on localhost/base44 preview URLs.
 */
export function getCurrentLocationId(): string {
    const hostname = window.location.hostname;
    // On localhost or base44 preview, return a default
    if (hostname === 'localhost' || hostname.includes('base44.app') || hostname.includes('base44.co')) {
        return 'default';
    }
    const subdomain = hostname.split('.')[0];
    return subdomain || 'default';
}