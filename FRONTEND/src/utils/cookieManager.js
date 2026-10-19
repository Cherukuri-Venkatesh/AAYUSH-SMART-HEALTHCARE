/**
 * Cookie and Client-Side Cache Manager
 * Handles cookie persistence, user consent, and performance optimizations.
 */

const CONSENT_COOKIE_KEY = 'aayush_cookie_consent';
const PERF_COOKIE_KEY = 'aayush_perf_cookies';

/**
 * Write standard browser cookie
 */
export function setCookie(name, value, days = 365) {
  try {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
  } catch (e) {
    // ignore
  }
}

/**
 * Read browser cookie by name
 */
export function getCookie(name) {
  try {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return decodeURIComponent(parts.pop().split(';').shift());
  } catch (e) {
    // ignore
  }
  return null;
}

/**
 * Check if the user has consented to performance cookies
 */
export function hasUserConsented() {
  const cookieVal = getCookie(CONSENT_COOKIE_KEY);
  const localVal = localStorage.getItem('aayush_cookies_accepted');
  return cookieVal !== null || localVal !== null;
}

/**
 * Check if performance acceleration is active
 */
export function isPerformanceModeEnabled() {
  const cookieVal = getCookie(PERF_COOKIE_KEY);
  const localVal = localStorage.getItem('aayush_perf_mode');
  return cookieVal === 'enabled' || localVal === 'true';
}

/**
 * Apply user cookie consent
 * @param {'all' | 'essential'} mode
 */
export function applyCookieConsent(mode) {
  if (mode === 'all') {
    setCookie(CONSENT_COOKIE_KEY, 'accepted', 365);
    setCookie(PERF_COOKIE_KEY, 'enabled', 365);
    localStorage.setItem('aayush_cookies_accepted', 'true');
    localStorage.setItem('aayush_perf_mode', 'true');

    // Trigger proactive background prefetch for instant page transitions
    prefetchAppResources();
  } else {
    setCookie(CONSENT_COOKIE_KEY, 'essential', 180);
    setCookie(PERF_COOKIE_KEY, 'disabled', 180);
    localStorage.setItem('aayush_cookies_accepted', 'essential');
    localStorage.setItem('aayush_perf_mode', 'false');
  }
}

import { fetchDoctorsForPatient } from '../patient/utils/doctorApi';
import { fetchHospitalsForPatient } from '../patient/utils/hospitalApi';

/**
 * Proactively prefetch common data to eliminate waiting time
 */
export async function prefetchAppResources() {
  if (typeof window === 'undefined') return;

  try {
    // Fetch in parallel in background
    Promise.allSettled([
      fetchDoctorsForPatient(),
      fetchHospitalsForPatient()
    ]).catch(() => {});
  } catch (e) {
    // ignore background prefetch errors
  }
}

