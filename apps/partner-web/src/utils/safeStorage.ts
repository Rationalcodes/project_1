/**
 * Safe localStorage wrapper that protects against SecurityError (blocked cookies, private browsing, iframes)
 * and QuotaExceededError across all browsers.
 */
export const safeStorage = {
  getItem: (key: string): string | null => {
    try {
      if (typeof window !== 'undefined' && 'localStorage' in window) {
        return window.localStorage.getItem(key);
      }
    } catch (e) {
      console.warn(`[safeStorage] Access denied for getItem("${key}"):`, e);
    }
    return null;
  },
  setItem: (key: string, value: string): void => {
    try {
      if (typeof window !== 'undefined' && 'localStorage' in window) {
        window.localStorage.setItem(key, value);
      }
    } catch (e) {
      console.warn(`[safeStorage] Access denied for setItem("${key}"):`, e);
    }
  },
  removeItem: (key: string): void => {
    try {
      if (typeof window !== 'undefined' && 'localStorage' in window) {
        window.localStorage.removeItem(key);
      }
    } catch (e) {
      console.warn(`[safeStorage] Access denied for removeItem("${key}"):`, e);
    }
  },
};
