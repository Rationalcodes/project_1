import React, { useEffect, useRef, useState } from 'react';
import {
  MapPin,
  Navigation,
  Plus,
  Minus,
  Crosshair,
  Layers,
  ExternalLink,
  Check,
  Copy,
  Car,
  Maximize2,
  Minimize2,
  X,
  Compass,
} from 'lucide-react';
import { loadMapboxScript, isMapboxLoaded, getMapboxToken, MAPBOX_DARK_STYLE, MAPBOX_SATELLITE_STYLE } from './mapbox';
import { loadLeafletScript, redirectToGoogleMaps, openGoogleMapsLocation } from './googleMaps';
import { fetchDrivingRoute, DrivingRouteResult } from './routing';

export interface SalonMapboxViewProps {
  salon: {
    id: string;
    name: string;
    address: string;
    locality: string;
    coordinates: {
      lat: number;
      lng: number;
    };
    currentQueue?: number;
    rating?: number;
  };
  userLocation?: {
    lat: number;
    lng: number;
  } | null;
  className?: string;
  height?: string;
  initialFullscreen?: boolean;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

export const SalonMapboxView: React.FC<SalonMapboxViewProps> = ({
  salon,
  userLocation,
  className = '',
  height = '320px',
  initialFullscreen = false,
  isFullscreen: propIsFullscreen,
  onToggleFullscreen,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [mapEngine, setMapEngine] = useState<'mapbox' | 'leaflet' | 'loading'>('loading');
  const [mapStyle, setMapStyle] = useState<'dark' | 'satellite'>('dark');
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [drivingRoute, setDrivingRoute] = useState<DrivingRouteResult | null>(null);
  const [internalFullscreen, setInternalFullscreen] = useState(initialFullscreen);
  const isFullscreen = propIsFullscreen !== undefined ? propIsFullscreen : internalFullscreen;

  const mapboxInstanceRef = useRef<any>(null);
  const mapboxMarkerRef = useRef<any>(null);
  const leafletInstanceRef = useRef<any>(null);
  const leafletRouteLayerRef = useRef<any>(null);

  const rawLat = salon?.coordinates?.lat ?? (salon as any)?.latitude;
  const rawLng = salon?.coordinates?.lng ?? (salon as any)?.longitude;
  const lat = Number.isFinite(Number(rawLat)) ? Number(rawLat) : 12.9716;
  const lng = Number.isFinite(Number(rawLng)) ? Number(rawLng) : 77.5946;

  // Toggle Full Screen View & Invalidate Map Sizes
  const toggleFullscreen = () => {
    if (onToggleFullscreen) {
      onToggleFullscreen();
    } else {
      setInternalFullscreen((prev) => !prev);
    }
    setTimeout(() => {
      if (leafletInstanceRef.current) {
        try { leafletInstanceRef.current.invalidateSize(); } catch {}
      }
      if (mapboxInstanceRef.current) {
        try { mapboxInstanceRef.current.resize(); } catch {}
      }
    }, 100);
    setTimeout(() => {
      if (leafletInstanceRef.current) {
        try { leafletInstanceRef.current.invalidateSize(); } catch {}
      }
      if (mapboxInstanceRef.current) {
        try { mapboxInstanceRef.current.resize(); } catch {}
      }
    }, 350);
  };

  // Close on Escape when in fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        toggleFullscreen();
      }
    };
    if (isFullscreen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'auto';
    };
  }, [isFullscreen]);

  // Fetch real road route (like Google Maps) when user location is available
  useEffect(() => {
    let isCancelled = false;
    if (userLocation && salon.coordinates) {
      fetchDrivingRoute(userLocation, salon.coordinates).then((result) => {
        if (!isCancelled) {
          setDrivingRoute(result);
        }
      });
    } else {
      setDrivingRoute(null);
    }
    return () => {
      isCancelled = true;
    };
  }, [userLocation?.lat, userLocation?.lng, salon.coordinates?.lat, salon.coordinates?.lng]);

  // Load Map Engine (Mapbox if token is configured; otherwise fallback to Leaflet)
  useEffect(() => {
    let isMounted = true;
    const token = getMapboxToken();

    if (!token) {
      loadLeafletScript().then((leafletSuccess) => {
        if (isMounted) {
          setMapEngine(leafletSuccess ? 'leaflet' : 'loading');
        }
      });
      return;
    }

    loadMapboxScript().then((success) => {
      if (!isMounted) return;
      if (success && (window as any).mapboxgl) {
        setMapEngine('mapbox');
      } else {
        loadLeafletScript().then((leafletSuccess) => {
          if (isMounted) {
            setMapEngine(leafletSuccess ? 'leaflet' : 'loading');
          }
        });
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  // Mount Mapbox GL
  useEffect(() => {
    if (mapEngine !== 'mapbox' || !mapContainerRef.current) return;
    const mapboxgl = (window as any).mapboxgl;
    if (!mapboxgl) return;

    try {
      mapboxgl.accessToken = getMapboxToken();

      if (!mapboxInstanceRef.current) {
        const map = new mapboxgl.Map({
          container: mapContainerRef.current,
          style: mapStyle === 'dark' ? MAPBOX_DARK_STYLE : MAPBOX_SATELLITE_STYLE,
          center: [lng, lat],
          zoom: 15,
          pitch: 30,
          attributionControl: false,
          touchZoomRotate: true,
          dragPan: true,
          scrollZoom: true,
          doubleClickZoom: true,
          touchPitch: false,
        });

        // Ensure pinch-to-zoom is active
        try {
          if (map.touchZoomRotate) map.touchZoomRotate.enable();
          if (map.dragPan) map.dragPan.enable();
        } catch {}

        // Add 3D Salon Custom Marker
        const el = document.createElement('div');
        el.className = 'custom-mapbox-marker';
        el.innerHTML = `
          <div style="background: #FF6422; color: #ffffff; padding: 5px 12px; border-radius: 9999px; font-weight: 800; font-size: 11px; box-shadow: 0 4px 16px rgba(255,100,34,0.4); border: 2.5px solid #ffffff; white-space: nowrap; display: flex; align-items: center; gap: 5px;">
            <span>✂</span>
            <span>${salon.name.length > 16 ? salon.name.slice(0, 16) + '…' : salon.name}</span>
          </div>
        `;

        mapboxMarkerRef.current = new mapboxgl.Marker({ element: el, anchor: 'center' })
          .setLngLat([lng, lat])
          .addTo(map);

        if (userLocation) {
          const userEl = document.createElement('div');
          userEl.innerHTML = `<div style="width: 14px; height: 14px; background: #3b82f6; border: 2.5px solid #ffffff; border-radius: 9999px; box-shadow: 0 0 10px #3b82f6;"></div>`;
          new mapboxgl.Marker({ element: userEl, anchor: 'center' })
            .setLngLat([userLocation.lng, userLocation.lat])
            .addTo(map);
        }

        mapboxInstanceRef.current = map;

        setTimeout(() => {
          try { map.resize(); } catch (_) {}
        }, 100);
        setTimeout(() => {
          try { map.resize(); } catch (_) {}
        }, 350);
      } else {
        mapboxInstanceRef.current.setStyle(mapStyle === 'dark' ? MAPBOX_DARK_STYLE : MAPBOX_SATELLITE_STYLE);
      }
    } catch {
      setMapEngine('leaflet');
    }

    return () => {
      if (mapboxInstanceRef.current) {
        mapboxInstanceRef.current.remove();
        mapboxInstanceRef.current = null;
        mapboxMarkerRef.current = null;
      }
    };
  }, [mapEngine, lat, lng, mapStyle]);

  // Mount Leaflet Fallback
  useEffect(() => {
    if (mapEngine !== 'leaflet' || !mapContainerRef.current) return;
    const L = (window as any).L;
    if (!L) return;

    if (!leafletInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [lat, lng],
        zoom: 15,
        zoomControl: false,
        attributionControl: false,
        touchZoom: true,
        dragging: true,
        tap: false, // Critical for iOS and Android two-finger pinch zoom
        scrollWheelZoom: true,
        doubleClickZoom: true,
        boxZoom: true,
        bounceAtZoomLimits: false,
      });

      // Explicitly enable touch zoom & dragging for all finger gestures
      try {
        if (map.touchZoom) map.touchZoom.enable();
        if (map.dragging) map.dragging.enable();
      } catch {}

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        subdomains: ['a', 'b', 'c'],
        className: 'osm-dark-tiles',
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);

      // Custom Orange Marker
      const pinHtml = `
        <div style="background: #FF6422; color: #ffffff; padding: 4px 10px; border-radius: 9999px; font-weight: 800; font-size: 11px; box-shadow: 0 4px 14px rgba(0,0,0,0.25); border: 2px solid #ffffff; white-space: nowrap; display: flex; align-items: center; gap: 4px;">
          <span>✂</span>
          <span>${salon.name.length > 16 ? salon.name.slice(0, 16) + '…' : salon.name}</span>
        </div>
      `;
      const icon = L.divIcon({
        className: 'custom-salon-pin',
        html: pinHtml,
        iconSize: [120, 26],
        iconAnchor: [60, 13],
      });

      L.marker([lat, lng], { icon }).addTo(map);

      if (userLocation) {
        const userHtml = `<div style="width: 14px; height: 14px; background: #3b82f6; border: 2.5px solid #ffffff; border-radius: 9999px; box-shadow: 0 0 10px #3b82f6;"></div>`;
        const userIcon = L.divIcon({ className: 'user-pin', html: userHtml, iconSize: [14, 14], iconAnchor: [7, 7] });
        L.marker([userLocation.lat, userLocation.lng], { icon: userIcon }).addTo(map);
      }

      leafletInstanceRef.current = map;

      setTimeout(() => {
        try { map.invalidateSize(); } catch (_) {}
      }, 100);
      setTimeout(() => {
        try { map.invalidateSize(); } catch (_) {}
      }, 350);
    }

    return () => {
      if (leafletInstanceRef.current) {
        leafletInstanceRef.current.remove();
        leafletInstanceRef.current = null;
        leafletRouteLayerRef.current = null;
      }
    };
  }, [mapEngine, lat, lng]);

  // Draw real driving road route on Leaflet map
  useEffect(() => {
    if (mapEngine !== 'leaflet' || !leafletInstanceRef.current) return;
    const map = leafletInstanceRef.current;
    const L = (window as any).L;
    if (!L) return;

    if (leafletRouteLayerRef.current) {
      map.removeLayer(leafletRouteLayerRef.current);
      leafletRouteLayerRef.current = null;
    }

    if (!drivingRoute || !userLocation) return;

    const layerGroup = L.layerGroup().addTo(map);

    if (drivingRoute.hasUserDisplacement && drivingRoute.userDisplacement && drivingRoute.userDisplacement.length >= 2) {
      L.polyline(drivingRoute.userDisplacement, {
        color: '#3b82f6',
        weight: 4,
        dashArray: '6, 6',
        opacity: 0.85,
      }).addTo(layerGroup);
    }
    if (drivingRoute.hasShopDisplacement && drivingRoute.shopDisplacement && drivingRoute.shopDisplacement.length >= 2) {
      L.polyline(drivingRoute.shopDisplacement, {
        color: '#FF6422',
        weight: 4,
        dashArray: '6, 6',
        opacity: 0.85,
      }).addTo(layerGroup);
    }

    const activePoints = (drivingRoute.roadCoordinates && drivingRoute.roadCoordinates.length >= 2)
      ? drivingRoute.roadCoordinates
      : drivingRoute.coordinates;

    if (activePoints && activePoints.length >= 2) {
      L.polyline(activePoints, {
        color: '#ffffff',
        weight: 7,
        opacity: 0.9,
      }).addTo(layerGroup);

      L.polyline(activePoints, {
        color: '#FF6422',
        weight: 4.5,
        opacity: 1.0,
      }).addTo(layerGroup);
    }

    leafletRouteLayerRef.current = layerGroup;

    try {
      const bounds = L.latLngBounds([
        [userLocation.lat, userLocation.lng],
        [lat, lng],
      ]);
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 16 });
    } catch (_) {}
  }, [drivingRoute, mapEngine, userLocation, lat, lng]);

  // Draw real driving road route on Mapbox map
  useEffect(() => {
    if (mapEngine !== 'mapbox' || !mapboxInstanceRef.current) return;
    const map = mapboxInstanceRef.current;

    const applyRoute = () => {
      if (!map.isStyleLoaded()) return;

      ['user-displacement', 'user-displacement-case', 'shop-displacement', 'shop-displacement-case', 'road-route', 'road-route-case'].forEach((id) => {
        if (map.getLayer(id)) map.removeLayer(id);
        if (map.getSource(id)) map.removeSource(id);
      });

      if (!drivingRoute || !userLocation) return;

      const toLngLat = (pts: [number, number][]) => pts.map(([pLat, pLng]) => [pLng, pLat]);

      if (drivingRoute.hasUserDisplacement && drivingRoute.userDisplacement && drivingRoute.userDisplacement.length >= 2) {
        map.addSource('user-displacement', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: { type: 'LineString', coordinates: toLngLat(drivingRoute.userDisplacement) },
          },
        });
        map.addLayer({
          id: 'user-displacement',
          type: 'line',
          source: 'user-displacement',
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: { 'line-color': '#3b82f6', 'line-width': 3.5, 'line-dasharray': [2, 2] },
        });
      }

      if (drivingRoute.hasShopDisplacement && drivingRoute.shopDisplacement && drivingRoute.shopDisplacement.length >= 2) {
        map.addSource('shop-displacement', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: { type: 'LineString', coordinates: toLngLat(drivingRoute.shopDisplacement) },
          },
        });
        map.addLayer({
          id: 'shop-displacement',
          type: 'line',
          source: 'shop-displacement',
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: { 'line-color': '#FF6422', 'line-width': 3.5, 'line-dasharray': [2, 2] },
        });
      }

      const activeRoadPts = (drivingRoute.roadCoordinates && drivingRoute.roadCoordinates.length >= 2)
        ? drivingRoute.roadCoordinates
        : drivingRoute.coordinates;

      if (activeRoadPts && activeRoadPts.length >= 2) {
        const coords = toLngLat(activeRoadPts);

        map.addSource('road-route-case', {
          type: 'geojson',
          data: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: coords } },
        });
        map.addLayer({
          id: 'road-route-case',
          type: 'line',
          source: 'road-route-case',
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: { 'line-color': '#ffffff', 'line-width': 6.5, 'line-opacity': 0.9 },
        });

        map.addSource('road-route', {
          type: 'geojson',
          data: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: coords } },
        });
        map.addLayer({
          id: 'road-route',
          type: 'line',
          source: 'road-route',
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: { 'line-color': '#FF6422', 'line-width': 4.5 },
        });

        const mapboxgl = (window as any).mapboxgl;
        if (mapboxgl) {
          const bounds = new mapboxgl.LngLatBounds();
          bounds.extend([userLocation.lng, userLocation.lat]);
          bounds.extend([lng, lat]);
          map.fitBounds(bounds, { padding: 60, maxZoom: 16 });
        }
      }
    };

    if (map.isStyleLoaded()) {
      applyRoute();
    } else {
      map.once('load', applyRoute);
      map.once('styledata', applyRoute);
    }
  }, [drivingRoute, mapEngine, userLocation, lat, lng]);

  const handleZoom = (delta: number) => {
    if (mapEngine === 'mapbox' && mapboxInstanceRef.current) {
      const z = mapboxInstanceRef.current.getZoom();
      mapboxInstanceRef.current.zoomTo(z + delta);
    } else if (mapEngine === 'leaflet' && leafletInstanceRef.current) {
      if (delta > 0) leafletInstanceRef.current.zoomIn();
      else leafletInstanceRef.current.zoomOut();
    }
  };

  const handleRecenter = () => {
    if (mapEngine === 'mapbox' && mapboxInstanceRef.current) {
      mapboxInstanceRef.current.flyTo({ center: [lng, lat], zoom: 15, pitch: 30 });
    } else if (mapEngine === 'leaflet' && leafletInstanceRef.current) {
      leafletInstanceRef.current.setView([lat, lng], 15);
    }
  };

  const handleRecenterUser = () => {
    if (!userLocation) return;
    if (mapEngine === 'mapbox' && mapboxInstanceRef.current) {
      mapboxInstanceRef.current.flyTo({ center: [userLocation.lng, userLocation.lat], zoom: 16, pitch: 30 });
    } else if (mapEngine === 'leaflet' && leafletInstanceRef.current) {
      leafletInstanceRef.current.setView([userLocation.lat, userLocation.lng], 16);
    }
  };

  return (
    <div
      className={`relative overflow-hidden bg-[#FAF7F2] flex flex-col transition-all ${
        isFullscreen
          ? 'fixed inset-0 z-[9999] w-screen h-[100dvh] rounded-none border-0 shadow-none'
          : `rounded-3xl border border-[#E8E2D8] shadow-sm ${className}`
      }`}
      style={{
        width: '100%',
        height: isFullscreen ? '100dvh' : height || '100%',
        minHeight: isFullscreen ? '100dvh' : '300px',
      }}
    >
      <style>{`
        .osm-dark-tiles {
          filter: none !important;
        }
        .leaflet-container {
          background-color: #FAF7F2 !important;
          width: 100% !important;
          height: 100% !important;
          touch-action: none !important;
          user-select: none !important;
          -webkit-user-select: none !important;
        }
        .leaflet-pane, .leaflet-tile-pane, .leaflet-layer, .leaflet-marker-pane {
          touch-action: none !important;
        }
        .mapboxgl-canvas-container, .mapboxgl-canvas {
          touch-action: none !important;
        }
      `}</style>

      {/* Map Canvas with direct touch-action delegation */}
      <div
        ref={mapContainerRef}
        className="w-full flex-1"
        style={{
          width: '100%',
          height: '100%',
          touchAction: 'none',
        }}
      />

      {/* Loading Indicator */}
      {mapEngine === 'loading' && (
        <div className="absolute inset-0 bg-[#FAF7F2]/80 backdrop-blur-xs flex flex-col items-center justify-center gap-2 z-20">
          <div className="w-7 h-7 border-3 border-orange-200 border-t-[#FF6422] rounded-full animate-spin" />
          <span className="text-xs font-bold text-stone-600">Loading interactive map...</span>
        </div>
      )}

      {/* Top Header Badge */}
      <div className="absolute top-3 left-3 z-20 flex items-center gap-2 max-w-[85%] sm:max-w-none">
        <div className="px-3 py-1.5 rounded-2xl bg-white/95 backdrop-blur-md border border-[#E2DDD5] text-xs font-bold text-stone-800 flex items-center gap-2 shadow-sm">
          <span className="w-2.5 h-2.5 rounded-full bg-[#FF6422] animate-pulse shrink-0"></span>
          <span className="truncate">{salon.name}</span>
          {drivingRoute && (
            <span className="text-[#FF6422] font-black border-l border-stone-200 pl-2 hidden sm:flex items-center gap-1 shrink-0">
              <span>{drivingRoute.travelMode === 'walking' ? '🚶' : '🚗'}</span>
              <span>{drivingRoute.distanceFormatted} ({drivingRoute.durationFormatted})</span>
            </span>
          )}
        </div>

        {mapEngine === 'mapbox' && (
          <button
            type="button"
            onClick={() => setMapStyle(mapStyle === 'dark' ? 'satellite' : 'dark')}
            className="px-2.5 py-1.5 rounded-2xl bg-white/95 backdrop-blur-md border border-[#E2DDD5] text-[11px] font-semibold text-stone-700 hover:text-stone-900 flex items-center gap-1 transition-colors shadow-xs cursor-pointer shrink-0"
            title="Toggle map style"
          >
            <Layers className="w-3.5 h-3.5 text-[#FF6422]" />
            <span className="capitalize">{mapStyle === 'dark' ? 'Satellite' : 'Light'}</span>
          </button>
        )}
      </div>

      {/* Top Right Controls: Directions & Fullscreen Toggle */}
      <div className="absolute top-3 right-3 z-20 flex items-center gap-2">
        <button
          type="button"
          onClick={() => redirectToGoogleMaps(salon.coordinates, userLocation)}
          className="px-3.5 py-1.5 rounded-2xl bg-[#FF6422] hover:bg-orange-600 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md shadow-orange-500/25 transition-all active:scale-95 cursor-pointer"
          title="Open turn-by-turn navigation in Google Maps"
        >
          <Navigation className="w-3.5 h-3.5 fill-white" />
          <span className="hidden sm:inline">Directions ↗</span>
        </button>

        <button
          type="button"
          onClick={toggleFullscreen}
          className="p-2 rounded-2xl bg-white/95 backdrop-blur-md border border-[#E2DDD5] text-stone-800 hover:text-stone-950 shadow-md transition-all active:scale-90 cursor-pointer"
          title={isFullscreen ? 'Exit Full Screen' : 'Open Full Screen (Pinch to Zoom)'}
        >
          {isFullscreen ? (
            <X className="w-4 h-4 text-stone-800" />
          ) : (
            <Maximize2 className="w-4 h-4 text-stone-800" />
          )}
        </button>
      </div>

      {/* Bottom Floating Control Buttons (Zoom, Recenter, Finger-zoom hint) */}
      <div className="absolute bottom-4 right-4 z-20 flex flex-col gap-2">
        {userLocation && (
          <button
            type="button"
            onClick={handleRecenterUser}
            className="w-9 h-9 rounded-2xl bg-white/95 backdrop-blur-md border border-[#E2DDD5] text-blue-600 hover:text-blue-700 flex items-center justify-center shadow-md transition-transform active:scale-90 cursor-pointer"
            title="Center on my location"
          >
            <Navigation className="w-4 h-4 fill-blue-600 rotate-45" />
          </button>
        )}

        <button
          type="button"
          onClick={handleRecenter}
          className="w-9 h-9 rounded-2xl bg-white/95 backdrop-blur-md border border-[#E2DDD5] text-stone-700 hover:text-[#FF6422] flex items-center justify-center shadow-md transition-transform active:scale-90 cursor-pointer"
          title="Recenter on studio"
        >
          <Crosshair className="w-4 h-4" />
        </button>

        <div className="flex flex-col bg-white/95 backdrop-blur-md border border-[#E2DDD5] rounded-2xl shadow-md overflow-hidden">
          <button
            type="button"
            onClick={() => handleZoom(1)}
            className="w-9 h-9 text-stone-700 hover:text-stone-950 hover:bg-stone-50 flex items-center justify-center transition-colors active:scale-90 cursor-pointer border-b border-[#E2DDD5]"
            title="Zoom In (or pinch fingers on screen)"
          >
            <Plus className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => handleZoom(-1)}
            className="w-9 h-9 text-stone-700 hover:text-stone-950 hover:bg-stone-50 flex items-center justify-center transition-colors active:scale-90 cursor-pointer"
            title="Zoom Out (or pinch fingers on screen)"
          >
            <Minus className="w-4 h-4" />
          </button>
        </div>

        {!isFullscreen && (
          <button
            type="button"
            onClick={toggleFullscreen}
            className="w-9 h-9 rounded-2xl bg-[#FF6422] hover:bg-orange-600 text-white flex items-center justify-center shadow-md shadow-orange-500/25 transition-transform active:scale-90 cursor-pointer"
            title="Open Fullscreen Map"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Floating Touch / Pinch Hint for Mobile */}
      <div className="absolute bottom-4 left-4 z-20 pointer-events-none">
        <div className="px-3 py-1.5 rounded-xl bg-black/75 backdrop-blur-md text-[11px] font-bold text-white border border-white/10 shadow-lg flex items-center gap-1.5">
          <span>🤌</span>
          <span>Pinch with two fingers to zoom in & out</span>
        </div>
      </div>
    </div>
  );
};
