import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Navigation, Plus, Minus, Crosshair, Layers, ExternalLink, Check, Copy, Car } from 'lucide-react';
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
}

export const SalonMapboxView: React.FC<SalonMapboxViewProps> = ({
  salon,
  userLocation,
  className = '',
  height = '320px',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [mapEngine, setMapEngine] = useState<'mapbox' | 'leaflet' | 'loading'>('loading');
  const [mapStyle, setMapStyle] = useState<'dark' | 'satellite'>('dark');
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [drivingRoute, setDrivingRoute] = useState<DrivingRouteResult | null>(null);

  const mapboxInstanceRef = useRef<any>(null);
  const mapboxMarkerRef = useRef<any>(null);
  const leafletInstanceRef = useRef<any>(null);
  const leafletRouteLayerRef = useRef<any>(null);

  const rawLat = salon?.coordinates?.lat ?? (salon as any)?.latitude;
  const rawLng = salon?.coordinates?.lng ?? (salon as any)?.longitude;
  const lat = Number.isFinite(Number(rawLat)) ? Number(rawLat) : 12.9716;
  const lng = Number.isFinite(Number(rawLng)) ? Number(rawLng) : 77.5946;

  // Fetch real road route (like Google Maps) when user location is available
  useEffect(() => {
    let isCancelled = false;
    if (userLocation && Number.isFinite(userLocation.lat) && Number.isFinite(userLocation.lng)) {
      fetchDrivingRoute(
        { lat: userLocation.lat, lng: userLocation.lng },
        { lat, lng }
      ).then((route) => {
        if (!isCancelled) {
          setDrivingRoute(route);
        }
      });
    } else {
      setDrivingRoute(null);
    }

    return () => {
      isCancelled = true;
    };
  }, [userLocation?.lat, userLocation?.lng, lat, lng]);

  useEffect(() => {
    let isMounted = true;

    // First attempt to load Mapbox GL JS
    loadMapboxScript().then((mapboxSuccess) => {
      if (!isMounted) return;
      const token = getMapboxToken();
      const hasValidToken = token && !token.includes('dummy_fallback');

      if (mapboxSuccess && hasValidToken && isMapboxLoaded()) {
        setMapEngine('mapbox');
      } else {
        // Fallback to high-contrast Leaflet tiles
        loadLeafletScript().then((leafletSuccess) => {
          if (!isMounted) return;
          if (leafletSuccess || Boolean((window as any).L)) {
            setMapEngine('leaflet');
          } else if (mapboxSuccess && isMapboxLoaded()) {
            setMapEngine('mapbox');
          }
        });
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  // Mount Mapbox GL Map
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
          center: [lng, lat], // Mapbox uses [lng, lat]
          zoom: 15,
          pitch: 30, // 3D perspective
          attributionControl: false,
        });

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
      // Fallback to Leaflet if Mapbox initialization encounters issues
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
      });

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
    } else {
      leafletInstanceRef.current.setView([lat, lng], 15);
    }

    return () => {
      if (leafletInstanceRef.current) {
        leafletInstanceRef.current.remove();
        leafletInstanceRef.current = null;
      }
    };
  }, [mapEngine, lat, lng]);

  // Draw real driving road route on Leaflet map
  useEffect(() => {
    if (mapEngine !== 'leaflet' || !leafletInstanceRef.current) return;
    const L = (window as any).L;
    if (!L) return;

    const map = leafletInstanceRef.current;

    // Remove previous route layer
    if (leafletRouteLayerRef.current) {
      map.removeLayer(leafletRouteLayerRef.current);
      leafletRouteLayerRef.current = null;
    }

    if (userLocation && drivingRoute && drivingRoute.coordinates.length > 0) {
      const routeGroup = L.layerGroup();

      // White outline casing for high contrast on roads
      L.polyline(drivingRoute.coordinates, {
        color: '#FFFFFF',
        weight: 6.5,
        opacity: 0.95,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(routeGroup);

      // Main primary orange road path
      L.polyline(drivingRoute.coordinates, {
        color: '#FF6422',
        weight: 4,
        opacity: 0.95,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(routeGroup);

      // Route midpoint driving distance pill
      const midIdx = Math.floor(drivingRoute.coordinates.length / 2);
      const [midLat, midLng] = drivingRoute.coordinates[midIdx] || [(userLocation.lat + lat) / 2, (userLocation.lng + lng) / 2];

      const midHtml = `
        <div style="
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background: #18181B;
          color: #FFFFFF;
          padding: 2.5px 8px;
          border-radius: 9999px;
          border: 1.5px solid #FFFFFF;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-size: 10px;
          font-weight: 800;
          white-space: nowrap;
          pointer-events: none;
          transform: translate(-50%, -50%);
        ">
          <span style="color: #FF6422;">🚗</span>
          <span>${drivingRoute.distanceFormatted}</span>
          <span style="color: #A1A1AA; font-size: 9px;">(${drivingRoute.durationFormatted})</span>
        </div>
      `;

      const midIcon = L.divIcon({
        className: 'route-dist-pill',
        html: midHtml,
        iconSize: [110, 24],
        iconAnchor: [55, 12],
      });

      L.marker([midLat, midLng], { icon: midIcon, interactive: false }).addTo(routeGroup);

      routeGroup.addTo(map);
      leafletRouteLayerRef.current = routeGroup;

      // Fit map bounds to show complete driving route
      try {
        const bounds = L.latLngBounds([
          [userLocation.lat, userLocation.lng],
          [lat, lng],
          ...drivingRoute.coordinates.filter((_, idx) => idx % 5 === 0),
        ]);
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
      } catch (_) {}
    }
  }, [mapEngine, userLocation, drivingRoute, lat, lng]);

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

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(`${salon.name}, ${salon.address}, ${salon.locality}`);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  return (
    <div
      className={`relative rounded-3xl overflow-hidden border border-[#E8E2D8] bg-[#FAF7F2] shadow-sm flex flex-col ${className}`}
      style={{ width: '100%', height: height || '100%', minHeight: '300px' }}
    >
      <style>{`
        .osm-dark-tiles {
          filter: none !important;
        }
        .leaflet-container {
          background-color: #FAF7F2 !important;
          width: 100% !important;
          height: 100% !important;
        }
      `}</style>
      {/* Map Canvas */}
      <div ref={mapContainerRef} className="w-full flex-1 min-h-[300px]" style={{ width: '100%', height: '100%', minHeight: '300px' }} />

      {/* Top Header Badge */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
        <div className="px-3 py-1 rounded-xl bg-white/95 backdrop-blur-md border border-[#E2DDD5] text-[11px] font-bold text-stone-800 flex items-center gap-1.5 shadow-xs">
          <span className="w-2 h-2 rounded-full bg-[#FF6422] animate-pulse"></span>
          <span>{salon.name}</span>
          {drivingRoute && (
            <span className="text-[#FF6422] font-black border-l border-stone-200 pl-1.5 flex items-center gap-1">
              <Car className="w-3 h-3" />
              <span>{drivingRoute.distanceFormatted} ({drivingRoute.durationFormatted})</span>
            </span>
          )}
        </div>

        {mapEngine === 'mapbox' && (
          <button
            type="button"
            onClick={() => setMapStyle(mapStyle === 'dark' ? 'satellite' : 'dark')}
            className="px-2.5 py-1 rounded-xl bg-white/90 backdrop-blur-md border border-[#E2DDD5] text-[10px] font-semibold text-stone-700 hover:text-stone-900 flex items-center gap-1 transition-colors shadow-xs"
            title="Toggle map style"
          >
            <Layers className="w-3 h-3 text-[#FF6422]" />
            <span className="capitalize">{mapStyle === 'dark' ? 'Satellite' : 'Light'}</span>
          </button>
        )}
      </div>

      {/* Top Right: Open in Navigation */}
      <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => redirectToGoogleMaps(salon.coordinates, userLocation)}
          className="px-3 py-1.5 rounded-xl bg-[#FF6422] hover:bg-orange-600 text-white font-extrabold text-[11px] flex items-center gap-1.5 shadow-md shadow-orange-500/20 transition-all active:scale-95"
          title="Open turn-by-turn navigation in Google Maps"
        >
          <Navigation className="w-3.5 h-3.5 fill-white" />
          <span>Directions ↗</span>
        </button>
      </div>

      {/* Bottom Floating Control Buttons */}
      <div className="absolute bottom-3 right-3 z-10 flex flex-col gap-1.5">
        <button
          type="button"
          onClick={handleRecenter}
          className="w-8 h-8 rounded-xl bg-white/90 backdrop-blur-md border border-[#E2DDD5] text-stone-700 hover:text-[#FF6422] flex items-center justify-center shadow-xs transition-transform active:scale-90 cursor-pointer"
          title="Recenter on studio"
        >
          <Crosshair className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => handleZoom(1)}
          className="w-8 h-8 rounded-xl bg-white/90 backdrop-blur-md border border-[#E2DDD5] text-stone-700 hover:text-stone-950 flex items-center justify-center shadow-xs transition-transform active:scale-90 cursor-pointer"
          title="Zoom In"
        >
          <Plus className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => handleZoom(-1)}
          className="w-8 h-8 rounded-xl bg-white/90 backdrop-blur-md border border-[#E2DDD5] text-stone-700 hover:text-stone-950 flex items-center justify-center shadow-xs transition-transform active:scale-90 cursor-pointer"
          title="Zoom Out"
        >
          <Minus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
