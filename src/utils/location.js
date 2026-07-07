/**
 * Location helpers for the Welcome / subdomain routing flow.
 */

export function isDevHost() {
  const hostname = window.location.hostname;
  return hostname === 'localhost' || hostname.includes('base44.app') || hostname.includes('base44.co');
}

export function isApexDomain() {
  if (isDevHost()) return true;
  const parts = window.location.hostname.split('.');
  return parts.length <= 2;
}

/** Returns the subdomain prefix (e.g. 'cafe1') or '' on apex/dev/www. */
export function getSubdomain() {
  if (isDevHost()) return '';
  const parts = window.location.hostname.split('.');
  if (parts.length <= 2) return '';
  const sub = parts[0];
  if (sub === 'www') return '';
  return sub;
}

/** Returns the apex domain (e.g. 'smartmenuiq.app') without subdomain. */
export function getApexDomain() {
  if (isDevHost()) return window.location.hostname;
  const parts = window.location.hostname.split('.');
  if (parts.length <= 2) return window.location.hostname;
  return parts.slice(1).join('.');
}

const SAVED_LOCATION_KEY = 'smartmenuiq_saved_location';

export function getSavedLocation() {
  try {
    const raw = localStorage.getItem(SAVED_LOCATION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveLocation(loc) {
  localStorage.setItem(SAVED_LOCATION_KEY, JSON.stringify(loc));
}

export function clearSavedLocation() {
  localStorage.removeItem(SAVED_LOCATION_KEY);
}

/** Redirect the browser to a location's subdomain (or / on dev). */
export function redirectToSubdomain(subdomain) {
  if (isDevHost()) {
    window.location.href = '/';
    return;
  }
  window.location.href = `https://${subdomain}.${getApexDomain()}`;
}

/** Clear saved choice and go back to the Welcome picker (apex domain). */
export function goToWelcome() {
  clearSavedLocation();
  if (isDevHost()) {
    window.location.href = '/Welcome';
    return;
  }
  window.location.href = `https://${getApexDomain()}/Welcome`;
}