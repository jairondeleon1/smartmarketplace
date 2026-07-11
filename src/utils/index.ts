import { getSavedLocation } from '@/utils/location';

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
    // On localhost or base44 preview, use saved location if available
    if (hostname === 'localhost' || hostname.includes('base44.app') || hostname.includes('base44.co')) {
        const saved = getSavedLocation();
        return saved?.subdomain || 'smartmenuiq';
    }
    const parts = hostname.split('.');
    // Apex domain (e.g. smartmenuiq.com) — no subdomain, use smartmenuiq
    if (parts.length <= 2) {
        return 'smartmenuiq';
    }
    // Subdomain (e.g. eatiburon.smartmenuiq.com) → use the subdomain
    return parts[0] || 'smartmenuiq';
}