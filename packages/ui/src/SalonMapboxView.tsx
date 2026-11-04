import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Navigation, Plus, Minus, Crosshair, Layers, ExternalLink, Check, Copy } from 'lucide-react';
import { loadMapboxScript, isMapboxLoaded, getMapboxToken, MAPBOX_DARK_STYLE, MAPBOX_SATELLITE_STYLE } from './mapbox';
import { loadLeafletScript, redirectToGoogleMaps, openGoogleMapsLocation } from './googleMaps';

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

  const mapboxInstanceRef = useRef<any>(null);
  const mapboxMarkerRef = useRef<any>(null);
  const leafletInstanceRef = useRef<any>(null);

  const { lat, lng } = salon.coordinates;

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

        // Custom Amber Salon Pin Marker
        const pinEl = document.createElement('div');
        pinEl.className = 'salon-mapbox-marker';
        pinEl.innerHTML = `
          <div style="position: relative; cursor: pointer; display: flex; flex-direction: column; align-items: center;">
            <div style="background: #f59e0b; color: #000; padding: 4px 10px; border-radius: 9999px; font-weight: 800; font-size: 11px; box-shadow: 0 4px 14px rgba(0,0,0,0.7); border: 2px solid #ffffff; white-space: nowrap; display: flex; align-items: center; gap: 4px;">
              <span>✂</span>
              <span>${salon.name.length > 16 ? salon.name.slice(0, 16) + '…' : salon.name}</span>
            </div>
            <div style="width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 8px solid #f59e0b; margin-top: -1px;"></div>
          </div>
        `;

        const marker = new mapboxgl.Marker({ element: pinEl })
          .setLngLat([lng, lat])
          .addTo(map);

        // User Location Beacon (if provided)
        if (userLocation) {
          const userPin = document.createElement('div');
          userPin.innerHTML = `
            <div style="width: 16px; height: 16px; background: #3b82f6; border: 2.5px solid #ffffff; border-radius: 9999px; box-shadow: 0 0 12px #3b82f6;"></div>
          `;
          new mapboxgl.Marker({ element: userPin })
            .setLngLat([userLocation.lng, userLocation.lat])
            .addTo(map);
        }

        mapboxInstanceRef.current = map;
        mapboxMarkerRef.current = marker;
      } else {
        mapboxInstanceRef.current.flyTo({ center: [lng, lat], zoom: 15 });
        if (mapboxMarkerRef.current) {
          mapboxMarkerRef.current.setLngLat([lng, lat]);
        }
      }
    } catch (e) {
      console.warn('Mapbox initialization fallback:', e);
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
    <div className={`relative rounded-3xl overflow-hidden border border-[#E8E2D8] bg-[#FAF7F2] shadow-sm ${className}`}>
      <style>{`
        .osm-dark-tiles {
          filter: none !important;
        }
        .leaflet-container {
          background-color: #FAF7F2 !important;
        }
      `}</style>
      {/* Map Canvas */}
      <div ref={mapContainerRef} style={{ width: '100%', height }} />

      {/* Top Header Badge */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
        <div className="px-3 py-1 rounded-xl bg-white/95 backdrop-blur-md border border-[#E2DDD5] text-[11px] font-bold text-stone-800 flex items-center gap-1.5 shadow-xs">
          <span className="w-2 h-2 rounded-full bg-[#FF6422] animate-pulse"></span>
          <span>{mapEngine === 'mapbox' ? 'Mapbox Location' : 'Studio Location'}</span>
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
          title="Open turn-by-turn navigation"
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
          className="w-8 h-8 rounded-xl bg-white/90 backdrop-blur-md border border-[#E2DDD5] text-stone-700 hover:text-[#FF6422] flex items-center justify-center shadow-xs transition-transform active:scale-90"
          title="Recenter on studio"
        >
          <Crosshair className="w-4 h-4" />
        </button>
        <div className="bg-white/90 backdrop-blur-md border border-[#E2DDD5] rounded-xl overflow-hidden shadow-xs flex flex-col">
          <button
            type="button"
            onClick={() => handleZoom(1)}
            className="w-8 h-8 flex items-center justify-center text-stone-700 hover:text-stone-900 hover:bg-stone-50 transition-colors"
            title="Zoom in"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          <div className="w-full h-px bg-[#E2DDD5]" />
          <button
            type="button"
            onClick={() => handleZoom(-1)}
            className="w-8 h-8 flex items-center justify-center text-stone-700 hover:text-stone-900 hover:bg-stone-50 transition-colors"
            title="Zoom out"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Bottom Left: Quick Address Copier */}
      <div className="absolute bottom-3 left-3 z-10 max-w-[calc(100%-80px)]">
        <button
          type="button"
          onClick={handleCopyAddress}
          className="px-3 py-1.5 rounded-xl bg-white/90 backdrop-blur-md border border-[#E2DDD5] text-left text-[11px] text-stone-700 hover:text-stone-900 flex items-center gap-2 shadow-xs transition-colors group"
          title="Copy full studio address"
        >
          <MapPin className="w-3.5 h-3.5 text-[#FF6422] shrink-0" />
          <span className="truncate max-w-[180px] sm:max-w-xs">{salon.address}</span>
          {copiedAddress ? (
            <span className="text-emerald-700 font-bold flex items-center gap-0.5 text-[10px] shrink-0">
              <Check className="w-3 h-3" /> Copied
            </span>
          ) : (
            <Copy className="w-3 h-3 text-stone-400 group-hover:text-stone-600 shrink-0" />
          )}
        </button>
      </div>
    </div>
  );
};
