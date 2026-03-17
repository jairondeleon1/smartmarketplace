import { useState, useEffect } from 'react';

const CACHE_KEY = 'cachedMenuItems';
const CACHE_TIME_KEY = 'cachedMenuItemsTime';

export function saveMenuToCache(items) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(items));
    localStorage.setItem(CACHE_TIME_KEY, Date.now().toString());
  } catch {}
}

export function loadMenuFromCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function getCacheAge() {
  try {
    const t = localStorage.getItem(CACHE_TIME_KEY);
    if (!t) return null;
    const mins = Math.round((Date.now() - parseInt(t)) / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.round(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.round(hrs / 24)}d ago`;
  } catch {
    return null;
  }
}

export default function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const on = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);

  return isOnline;
}