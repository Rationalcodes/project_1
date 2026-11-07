/**
 * Google Translate Integration Helper for SLOON Partner OS
 * Allows programmatic switching of languages without manual dictionary files.
 */

export const GOOGLE_TRANSLATE_LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو' },
  { code: 'or', name: 'Odia', nativeName: 'ଓଡ଼ିଆ' },
  { code: 'as', name: 'Assamese', nativeName: 'অসমীয়া' },
];

/**
 * Programmatically sets Google Translate's active language
 */
export function setGoogleTranslateLanguage(targetLang: string) {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  const langCode = targetLang || 'en';
  const cookieValue = `/en/${langCode}`;

  // 1. Set Google Translate cookie across all host variants
  const host = window.location.hostname;
  document.cookie = `googtrans=${cookieValue}; path=/;`;
  document.cookie = `googtrans=${cookieValue}; path=/; domain=${host};`;
  document.cookie = `googtrans=${cookieValue}; path=/; domain=.${host};`;

  // Handle localhost or IP addresses
  if (host.includes('.')) {
    const domainParts = host.split('.');
    if (domainParts.length >= 2) {
      const rootDomain = domainParts.slice(-2).join('.');
      document.cookie = `googtrans=${cookieValue}; path=/; domain=.${rootDomain};`;
    }
  }

  // 2. If Google Translate dropdown exists in DOM, trigger change event immediately
  const combo = document.querySelector<HTMLSelectElement>('.goog-te-combo');
  if (combo) {
    combo.value = langCode;
    combo.dispatchEvent(new Event('change'));
  }
}

/**
 * Initializes or re-applies current language on widget load
 */
export function syncCurrentGoogleTranslateLanguage(savedLang: string) {
  if (typeof window === 'undefined') return;

  const applyWhenReady = (retriesLeft = 20) => {
    const combo = document.querySelector<HTMLSelectElement>('.goog-te-combo');
    if (combo) {
      if (combo.value !== savedLang) {
        combo.value = savedLang;
        combo.dispatchEvent(new Event('change'));
      }
      return;
    }
    if (retriesLeft > 0) {
      setTimeout(() => applyWhenReady(retriesLeft - 1), 250);
    }
  };

  applyWhenReady();
}
