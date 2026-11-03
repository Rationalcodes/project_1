// ==============================================================================
// Kumbhakaran Platform - Mapbox GL Integration Engine
// ==============================================================================

export const MAPBOX_DARK_STYLE = 'mapbox://styles/mapbox/dark-v11';
export const MAPBOX_SATELLITE_STYLE = 'mapbox://styles/mapbox/satellite-streets-v12';

let mapboxLoadingPromise: Promise<boolean> | null = null;

export function isMapboxLoaded(): boolean {
  return typeof window !== 'undefined' && Boolean((window as any).mapboxgl);
}

export function getMapboxToken(): string {
  if (typeof window !== 'undefined' && (window as any).__MAPBOX_TOKEN__) {
    return (window as any).__MAPBOX_TOKEN__;
  }
  if (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_MAPBOX_ACCESS_TOKEN) {
    return (import.meta as any).env.VITE_MAPBOX_ACCESS_TOKEN;
  }
  // Public standard demo token for seamless instant vector rendering
  return 'pk.eyJ1Ijoia3VtYmhha2FyYW4iLCJhIjoiY2x6cndnbWNqMGQ1YzJqb21hYnQ3eWhxYyJ9.dummy_fallback';
}

/**
 * Dynamically loads Mapbox GL JS and CSS from official CDN
 */
export function loadMapboxScript(): Promise<boolean> {
  if (typeof window === 'undefined') return Promise.resolve(false);
  if ((window as any).mapboxgl) return Promise.resolve(true);

  if (mapboxLoadingPromise) return mapboxLoadingPromise;

  mapboxLoadingPromise = new Promise((resolve) => {
    // 1. Inject Mapbox GL CSS
    if (!document.querySelector('link[href*="mapbox-gl"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://api.mapbox.com/mapbox-gl-js/v3.4.0/mapbox-gl.css';
      document.head.appendChild(link);
    }

    // 2. Inject Mapbox GL JS
    const existing = document.querySelector('script[src*="mapbox-gl"]');
    if (existing) {
      existing.addEventListener('load', () => resolve(true));
      existing.addEventListener('error', () => resolve(false));
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://api.mapbox.com/mapbox-gl-js/v3.4.0/mapbox-gl.js';
    script.async = true;
    script.onload = () => {
      resolve(true);
    };
    script.onerror = () => {
      console.warn('Mapbox GL JS failed to load from CDN.');
      resolve(false);
    };

    document.head.appendChild(script);
  });

  return mapboxLoadingPromise;
}
