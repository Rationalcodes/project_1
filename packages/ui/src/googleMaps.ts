// ==============================================================================
// Kumbhakaran Platform - Independent Distance Engine & Google Maps Redirection
// ==============================================================================

/**
 * Haversine formula: Spherical distance in kilometers between two GPS coordinates.
 * Completely independent of Google Maps API (zero API keys, zero billing).
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371.0; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180.0;
  const dLon = ((lon2 - lon1) * Math.PI) / 180.0;
  const a =
    Math.sin(dLat / 2.0) ** 2 +
    Math.cos((lat1 * Math.PI) / 180.0) *
      Math.cos((lat2 * Math.PI) / 180.0) *
      Math.sin(dLon / 2.0) ** 2;
  const c = 2.0 * Math.atan2(Math.sqrt(a), Math.sqrt(1.0 - a));
  return Math.round(R * c * 100.0) / 100.0;
}

/**
 * Generates an official Google Maps turn-by-turn directions URL
 */
export function getGoogleMapsDirectionsUrl(
  destination: { lat: number; lng: number; name?: string; address?: string },
  origin?: { lat: number; lng: number }
): string {
  const destParam =
    destination.lat && destination.lng
      ? `${destination.lat},${destination.lng}`
      : encodeURIComponent(`${destination.name || ''} ${destination.address || ''}`);

  let url = `https://www.google.com/maps/dir/?api=1&destination=${destParam}`;
  if (origin?.lat && origin?.lng) {
    url += `&origin=${origin.lat},${origin.lng}`;
  }
  return url;
}

/**
 * Generates an official Google Maps search/pin URL for exact location
 */
export function getGoogleMapsSearchUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}

/**
 * Redirects the user's browser directly to Google Maps for exact navigation
 */
export function redirectToGoogleMaps(
  destination: { lat: number; lng: number; name?: string; address?: string },
  origin?: { lat: number; lng: number }
): void {
  const url = getGoogleMapsDirectionsUrl(destination, origin);
  window.open(url, '_blank', 'noopener,noreferrer');
}

/**
 * Opens exact coordinates on Google Maps in a new tab
 */
export function openGoogleMapsLocation(lat: number, lng: number): void {
  const url = getGoogleMapsSearchUrl(lat, lng);
  window.open(url, '_blank', 'noopener,noreferrer');
}

// ==============================================================================
// Leaflet & OpenStreetMap Dynamic Loader (Open Source, Zero API Key)
// ==============================================================================

let leafletLoadingPromise: Promise<boolean> | null = null;

export function loadLeafletScript(): Promise<boolean> {
  if (typeof window === 'undefined') return Promise.resolve(false);
  if ((window as any).L) return Promise.resolve(true);

  if (leafletLoadingPromise) return leafletLoadingPromise;

  leafletLoadingPromise = new Promise((resolve) => {
    // 1. Add Leaflet CSS
    if (!document.querySelector('link[href*="leaflet.css"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    // 2. Add Leaflet JS
    const existing = document.querySelector('script[src*="leaflet.js"]');
    if (existing) {
      existing.addEventListener('load', () => resolve(true));
      existing.addEventListener('error', () => resolve(false));
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      console.warn('Leaflet OpenStreetMap script failed to load.');
      resolve(false);
    };

    document.head.appendChild(script);
  });

  return leafletLoadingPromise;
}

// ==============================================================================
// Google Maps Dynamic Loader & Dark Theme Styles (Optional Fallback)
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
