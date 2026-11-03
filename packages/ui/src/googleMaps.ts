// ==============================================================================
// Kumbhakaran Platform - Google Maps Dynamic Loader & Dark Theme Styles
// ==============================================================================

let mapsLoadingPromise: Promise<boolean> | null = null;

export function isGoogleMapsLoaded(): boolean {
  return typeof window !== 'undefined' && Boolean((window as any).google?.maps);
}

export function loadGoogleMapsScript(apiKeyOverride?: string): Promise<boolean> {
  if (typeof window === 'undefined') return Promise.resolve(false);
  if ((window as any).google?.maps) return Promise.resolve(true);

  if (mapsLoadingPromise) return mapsLoadingPromise;

  const key =
    apiKeyOverride ||
    (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY) ||
    '';

  if (!key || key.trim() === '') {
    // Graceful degradation when key not yet configured
    return Promise.resolve(false);
  }

  mapsLoadingPromise = new Promise((resolve) => {
    // Check if script already attached
    const existing = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existing) {
      existing.addEventListener('load', () => resolve(true));
      existing.addEventListener('error', () => resolve(false));
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key.trim())}&libraries=places,geometry`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      resolve(true);
    };
    script.onerror = () => {
      console.warn('Google Maps JavaScript SDK failed to load. Please verify API key and HTTP referrer restrictions.');
      resolve(false);
    };

    document.head.appendChild(script);
  });

  return mapsLoadingPromise;
}

// Custom Kumbhakaran Dark Map Style
export const KUMBHAKARAN_MAP_STYLES = [
  { elementType: 'geometry', stylers: [{ color: '#13131a' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#13131a' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#9ca3af' }] },
  {
    featureType: 'administrative.locality',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#f59e0b' }],
  },
  {
    featureType: 'poi',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#6b7280' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{ color: '#18241d' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#4ade80' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#22222e' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#181822' }],
  },
  {
    featureType: 'road',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#9ca3af' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#2e2e3d' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#1c1c26' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#fcd34d' }],
  },
  {
    featureType: 'transit',
    elementType: 'geometry',
    stylers: [{ color: '#1e1e28' }],
  },
  {
    featureType: 'transit.station',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#f59e0b' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#0d131f' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#38bdf8' }],
  },
];
