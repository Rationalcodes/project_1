import React, { useState, useEffect, useRef } from 'react';
import {
  MapPin,
  Search,
  Star,
  Navigation,
  ArrowRight,
  List,
  Map as MapIcon,
  Plus,
  Minus,
  X,
  Crosshair,
  RefreshCw,
  Layers,
  ExternalLink,
} from 'lucide-react';
import {
  useSalon,
  getEstimatedWaitMinutes,
} from '../../context/SalonContext';
import { Salon } from '../../types';
import {
  calculateHaversineDistance,
  redirectToGoogleMaps,
  openGoogleMapsLocation,
  loadGoogleMapsScript,
  loadLeafletScript,
  KUMBHAKARAN_MAP_STYLES,
  isGoogleMapsLoaded,
} from '@kumbhakaran/ui';

export const MapScreen: React.FC = () => {
  const {
    salons,
    userLocation,
    setSelectedSalonForDetail,
    requestDeviceLocation,
    triggerNotification,
  } = useSalon();

  const [selectedMarkerSalon, setSelectedMarkerSalon] = useState<Salon | null>(salons[0] || null);
  const [mapSearch, setMapSearch] = useState('');
  const [radiusKm, setRadiusKm] = useState<number>(10);
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [mapEngine, setMapEngine] = useState<'google' | 'leaflet'>('google');
  const [mapLayerType, setMapLayerType] = useState<'dark' | 'satellite'>('dark');
  const [isGoogleLoaded, setIsGoogleLoaded] = useState(false);
  const [isLeafletLoaded, setIsLeafletLoaded] = useState(false);
  const [hasMapMoved, setHasMapMoved] = useState(false);
  const fallbackCoords = { lat: 12.9716, lng: 77.5946 };
  const currentCoords = userLocation ? { lat: userLocation.lat, lng: userLocation.lng } : fallbackCoords;
  const [mapCenterCoords, setMapCenterCoords] = useState<{ lat: number; lng: number }>({
    lat: currentCoords.lat,
    lng: currentCoords.lng,
  });

  const mapContainerRef = useRef<HTMLDivElement>(null);
  
  // Google Maps references
  const googleMapRef = useRef<any>(null);
  const googleMarkersRef = useRef<any[]>([]);
  const googleUserMarkerRef = useRef<any>(null);

  // Leaflet references
  const leafletMapRef = useRef<any>(null);
  const leafletMarkersLayerRef = useRef<any>(null);

  // Dynamic distance computation with independent Haversine formula
  const visibleSalons = salons
    .map((s) => ({
      ...s,
      computedDistance: userLocation
        ? calculateHaversineDistance(
            userLocation.lat,
            userLocation.lng,
            s.coordinates.lat,
            s.coordinates.lng,
          )
        : s.distanceKm,
    }))
    .filter((s) => {
      if (userLocation && s.computedDistance > radiusKm) return false;
      if (mapSearch.trim()) {
        const q = mapSearch.toLowerCase();
        return (
          s.name.toLowerCase().includes(q) ||
          s.locality.toLowerCase().includes(q) ||
          s.pincode.includes(q)
        );
      }
      return true;
    })
    .sort((a, b) => a.computedDistance - b.computedDistance);

  // 1. Initialize Google Maps with Leaflet fallback
  useEffect(() => {
    let isMounted = true;

    loadGoogleMapsScript().then((gmapsSuccess) => {
      if (!isMounted) return;
      if (gmapsSuccess || isGoogleMapsLoaded()) {
        setIsGoogleLoaded(true);
        setMapEngine('google');
      } else {
        // Fallback to Leaflet tiles
        loadLeafletScript().then((leafletSuccess) => {
          if (!isMounted) return;
          setIsLeafletLoaded(leafletSuccess || Boolean((window as any).L));
          setMapEngine('leaflet');
        });
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  // 2A. Mount Google Maps when available
  useEffect(() => {
    if (mapEngine !== 'google' || !isGoogleLoaded || !mapContainerRef.current) return;
    const gmaps = (window as any).google?.maps;
    if (!gmaps) return;

    if (!googleMapRef.current) {
      const map = new gmaps.Map(mapContainerRef.current, {
        center: { lat: currentCoords.lat, lng: currentCoords.lng },
        zoom: 14,
        styles: mapLayerType === 'dark' ? [] : [],
        mapTypeId: mapLayerType === 'satellite' ? 'hybrid' : 'roadmap',
        disableDefaultUI: true,
        gestureHandling: 'greedy',
        zoomControl: false,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      });

      googleMapRef.current = map;

      map.addListener('dragend', () => {
        const center = map.getCenter();
        if (center) {
          setMapCenterCoords({ lat: center.lat(), lng: center.lng() });
          setHasMapMoved(true);
        }
      });
    } else {
      googleMapRef.current.setCenter({ lat: currentCoords.lat, lng: currentCoords.lng });
      googleMapRef.current.setMapTypeId(mapLayerType === 'satellite' ? 'hybrid' : 'roadmap');
      googleMapRef.current.setOptions({ styles: [] });
    }
  }, [mapEngine, isGoogleLoaded, mapLayerType, currentCoords.lat, currentCoords.lng]);

  // 2B. Synchronize Google Maps Markers
  useEffect(() => {
    if (mapEngine !== 'google' || !googleMapRef.current) return;
    const gmaps = (window as any).google?.maps;
    if (!gmaps) return;

    // Clear previous markers
    googleMarkersRef.current.forEach((m) => m.setMap(null));
    googleMarkersRef.current = [];

    // User Location Beacon (only if location is set)
    if (googleUserMarkerRef.current) googleUserMarkerRef.current.setMap(null);
    if (userLocation) {
      googleUserMarkerRef.current = new gmaps.Marker({
        position: { lat: userLocation.lat, lng: userLocation.lng },
        map: googleMapRef.current,
        title: 'Your Location',
        icon: {
          path: gmaps.SymbolPath.CIRCLE,
          scale: 9,
          fillColor: '#FF6422',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2.5,
        },
        zIndex: 999,
      });
    }

    // Salon Markers
    visibleSalons.forEach((salon) => {
      const isSelected = selectedMarkerSalon?.id === salon.id;

      const marker = new gmaps.Marker({
        position: { lat: salon.coordinates.lat, lng: salon.coordinates.lng },
        map: googleMapRef.current,
        title: `${salon.name} • ${salon.currentQueue} waiting`,
        icon: {
          path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
          fillColor: isSelected ? '#FF6422' : salon.isOpen ? '#F59F00' : '#9CA3AF',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 1.5,
          scale: isSelected ? 1.8 : 1.4,
          anchor: new gmaps.Point(12, 22),
        },
        zIndex: isSelected ? 100 : 10,
      });

      marker.addListener('click', () => {
        setSelectedMarkerSalon(salon);
        googleMapRef.current.panTo({
          lat: salon.coordinates.lat,
          lng: salon.coordinates.lng,
        });
      });

      googleMarkersRef.current.push(marker);
    });
  }, [mapEngine, visibleSalons, selectedMarkerSalon, userLocation]);

  // 3A. Mount Leaflet fallback when Google Maps SDK key is not configured
  useEffect(() => {
    if (mapEngine !== 'leaflet' || !isLeafletLoaded || !mapContainerRef.current) return;
    const L = (window as any).L;
    if (!L) return;

    if (!leafletMapRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [currentCoords.lat, currentCoords.lng],
        zoom: 14,
        zoomControl: false,
        attributionControl: false,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        subdomains: ['a', 'b', 'c'],
        className: 'osm-tiles',
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);

      const markersLayer = L.layerGroup().addTo(map);
      leafletMarkersLayerRef.current = markersLayer;

      map.on('moveend', () => {
        const c = map.getCenter();
        if (c) {
          const lat = typeof c.lat === 'function' ? c.lat() : c.lat;
          const lng = typeof c.lng === 'function' ? c.lng() : c.lng;
          setMapCenterCoords({ lat, lng });
          setHasMapMoved(true);
        }
      });

      leafletMapRef.current = map;
    } else {
      leafletMapRef.current.setView([currentCoords.lat, currentCoords.lng], 14);
    }

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
        leafletMarkersLayerRef.current = null;
      }
    };
  }, [mapEngine, isLeafletLoaded, currentCoords.lat, currentCoords.lng]);

  // 3B. Synchronize Leaflet Markers
  useEffect(() => {
    if (mapEngine !== 'leaflet' || !leafletMapRef.current || !leafletMarkersLayerRef.current) return;
    const L = (window as any).L;
    if (!L) return;

    const layer = leafletMarkersLayerRef.current;
    layer.clearLayers();

    // User Beacon (only if location is set)
    if (userLocation) {
      const userBeaconHtml = `
        <div style="position: relative; width: 24px; height: 24px;">
          <div style="position: absolute; inset: -4px; background: rgba(255, 100, 34, 0.3); border-radius: 9999px; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <div style="position: absolute; inset: 2px; background: #FF6422; border: 2.5px solid #ffffff; border-radius: 9999px; box-shadow: 0 0 12px rgba(255,100,34,0.6);"></div>
        </div>
      `;
      const userIcon = L.divIcon({
        className: 'user-beacon-marker',
        html: userBeaconHtml,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });
      L.marker([userLocation.lat, userLocation.lng], { icon: userIcon, title: 'Your Location' }).addTo(layer);
    }

    // Salon Markers
    visibleSalons.forEach((salon) => {
      const isSelected = selectedMarkerSalon?.id === salon.id;
      const salonBadgeHtml = `
        <div style="background: ${isSelected ? '#FF6422' : '#FFFFFF'}; color: ${isSelected ? '#FFFFFF' : '#1C1917'}; border: 2px solid #FF6422; border-radius: 9999px; padding: 4px 10px; font-size: 11px; font-weight: 800; font-family: 'Syne', sans-serif; display: flex; align-items: center; gap: 5px; box-shadow: 0 4px 14px rgba(232, 89, 12, 0.25); cursor: pointer; transition: transform 0.15s ease; white-space: nowrap;">
          <span>✂ ${salon.name.length > 14 ? salon.name.slice(0, 14) + '…' : salon.name}</span>
          <span style="background: ${isSelected ? '#FFFFFF' : '#FF6422'}; color: ${isSelected ? '#FF6422' : '#FFFFFF'}; border-radius: 9999px; padding: 1px 6px; font-size: 10px; font-weight: 900;">
            ${salon.currentQueue}Q
          </span>
        </div>
      `;

      const salonIcon = L.divIcon({
        className: 'salon-radar-marker',
        html: salonBadgeHtml,
        iconSize: [130, 30],
        iconAnchor: [65, 15],
      });

      const marker = L.marker([salon.coordinates.lat, salon.coordinates.lng], { icon: salonIcon });
      marker.on('click', () => {
        setSelectedMarkerSalon(salon);
        if (leafletMapRef.current) {
          leafletMapRef.current.panTo([salon.coordinates.lat, salon.coordinates.lng]);
        }
      });
      marker.addTo(layer);
    });
  }, [mapEngine, visibleSalons, selectedMarkerSalon, userLocation, isLeafletLoaded]);

  // Handle Zoom In/Out across both engines
  const handleZoom = (delta: number) => {
    if (mapEngine === 'google' && googleMapRef.current) {
      const curZoom = googleMapRef.current.getZoom() || 14;
      googleMapRef.current.setZoom(curZoom + delta);
    } else if (mapEngine === 'leaflet' && leafletMapRef.current) {
      if (delta > 0) leafletMapRef.current.zoomIn();
      else leafletMapRef.current.zoomOut();
    }
  };

  // Center on user GPS position
  const handlePanToUser = async () => {
    const success = await requestDeviceLocation();
    if (success && userLocation) {
      if (mapEngine === 'google' && googleMapRef.current) {
        googleMapRef.current.panTo({ lat: userLocation.lat, lng: userLocation.lng });
        googleMapRef.current.setZoom(15);
        setHasMapMoved(false);
      } else if (mapEngine === 'leaflet' && leafletMapRef.current) {
        leafletMapRef.current.setView([userLocation.lat, userLocation.lng], 15);
        setHasMapMoved(false);
      }
    }
  };

  // Center on searched area
  const handleSearchThisArea = () => {
    setHasMapMoved(false);
    triggerNotification(`Scanning studios around (${mapCenterCoords.lat.toFixed(3)}, ${mapCenterCoords.lng.toFixed(3)})`);
  };

  const handleSelectSalonClick = (salon: Salon) => {
    setSelectedMarkerSalon(salon);
    if (mapEngine === 'google' && googleMapRef.current) {
      googleMapRef.current.panTo({
        lat: salon.coordinates.lat,
        lng: salon.coordinates.lng,
      });
      googleMapRef.current.setZoom(15);
    } else if (mapEngine === 'leaflet' && leafletMapRef.current) {
      leafletMapRef.current.panTo([salon.coordinates.lat, salon.coordinates.lng]);
      leafletMapRef.current.setZoom(15);
    }
  };

  return (
    <div className="space-y-4 pb-28 text-stone-900">
      {/* Header controls & radius switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-widest font-extrabold px-2 py-0.5 rounded bg-orange-100/70 text-[#FF6422] border border-orange-200 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              {mapEngine === 'google' ? 'Google Maps Live' : 'Google Maps Radar'}
            </span>
            <span className="text-xs text-stone-500 font-medium">
              {visibleSalons.length} studios within {radiusKm} km
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-stone-900 mt-0.5 font-['Syne',sans-serif]">
            Nearby Salon Map
          </h1>
        </div>

        {/* Radius, Layer & View Mode pills */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Layer switcher for Google Maps */}
          {mapEngine === 'google' && (
            <div className="flex items-center bg-[#F3ECE4] border border-[#E2DDD5] rounded-xl p-0.5 text-xs font-semibold">
              <button
                onClick={() => setMapLayerType('dark')}
                className={`px-2 py-1 rounded-lg transition-colors ${
                  mapLayerType === 'dark' ? 'bg-[#FF6422] text-white font-bold shadow-sm' : 'text-stone-600 hover:text-stone-900'
                }`}
                title="Default map style"
              >
                Standard
              </button>
              <button
                onClick={() => setMapLayerType('satellite')}
                className={`px-2 py-1 rounded-lg transition-colors ${
                  mapLayerType === 'satellite' ? 'bg-[#FF6422] text-white font-bold shadow-sm' : 'text-stone-600 hover:text-stone-900'
                }`}
                title="Satellite hybrid"
              >
                Satellite
              </button>
            </div>
          )}

          {/* Radius Filter */}
          <div className="flex items-center bg-[#F3ECE4] border border-[#E2DDD5] rounded-xl p-0.5 text-xs font-semibold">
            {[2, 5, 10, 20].map((r) => (
              <button
                key={r}
                onClick={() => setRadiusKm(r)}
                className={`px-2.5 py-1 rounded-lg transition-colors ${
                  radiusKm === r
                    ? 'bg-[#FF6422] text-white font-bold shadow-sm'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                {r}km
              </button>
            ))}
          </div>

          {/* Toggle Map / List view on mobile */}
          <div className="sm:hidden flex items-center bg-[#F3ECE4] border border-[#E2DDD5] rounded-xl p-0.5 text-xs">
            <button
              onClick={() => setViewMode('map')}
              className={`p-1.5 rounded-lg ${viewMode === 'map' ? 'bg-[#FF6422] text-white shadow-sm' : 'text-stone-600'}`}
              title="Map view"
            >
              <MapIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg ${viewMode === 'list' ? 'bg-[#FF6422] text-white shadow-sm' : 'text-stone-600'}`}
              title="List view"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-[#FF6422] absolute left-3.5 top-3" />
        <input
          type="text"
          value={mapSearch}
          onChange={(e) => setMapSearch(e.target.value)}
          placeholder="Filter map by studio name, locality or PIN code..."
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#E8E2D8] rounded-2xl text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-[#FF6422] focus:ring-1 focus:ring-[#FF6422] shadow-sm"
        />
        {mapSearch && (
          <button
            onClick={() => setMapSearch('')}
            className="absolute right-3 top-3 text-stone-400 hover:text-stone-700"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Main Split Layout: Desktop Side-by-Side / Mobile Stack */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* MAP CONTAINER (Left or Top) */}
        <div
          className={`lg:col-span-7 xl:col-span-8 relative rounded-3xl overflow-hidden border border-[#E8E2D8] bg-[#FAF7F2] shadow-md min-h-[460px] h-[60vh] lg:h-[650px] ${
            viewMode === 'list' ? 'hidden sm:block' : 'block'
          }`}
        >
          {/* Interactive Google Map / Leaflet Container */}
          <style>{`
            .osm-tiles {
              filter: none !important;
            }
            .leaflet-container {
              background-color: #FAF7F2 !important;
            }
          `}</style>
          <div ref={mapContainerRef} className="w-full h-full" style={{ zIndex: 1 }} />

          {/* Floating "Search This Area" Pill */}
          {hasMapMoved && (
            <button
              onClick={handleSearchThisArea}
              className="absolute top-4 left-1/2 -translate-x-1/2 z-20 px-4 py-2 rounded-2xl bg-[#FF6422] text-white text-xs font-black shadow-lg shadow-orange-500/25 flex items-center gap-2 hover:bg-[#E55215] transition-transform active:scale-95 animate-in fade-in"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Search This Area</span>
            </button>
          )}

          {/* Google Maps Official Open in App shortcut badge */}
          <div className="absolute top-4 right-4 z-20 hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/90 backdrop-blur-md border border-[#E8E2D8] text-[11px] font-bold text-stone-700 shadow-sm">
            <span className="text-[#FF6422]">Google Maps</span>
            <button
              onClick={() => openGoogleMapsLocation(currentCoords.lat, currentCoords.lng)}
              className="text-stone-500 hover:text-stone-900 flex items-center gap-1"
              title="Launch in Google Maps"
            >
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>

          {/* Map Controls (Zoom in/out + My Location) */}
          <div className="absolute bottom-6 right-4 z-20 flex flex-col gap-2">
            <button
              onClick={handlePanToUser}
              className="w-10 h-10 rounded-2xl bg-white/95 border border-[#E8E2D8] text-[#FF6422] hover:bg-orange-50 flex items-center justify-center shadow-md backdrop-blur-md transition-all active:scale-90"
              title="Center on my location"
            >
              <Crosshair className="w-5 h-5 text-[#FF6422]" />
            </button>
            <div className="bg-white/95 border border-[#E8E2D8] rounded-2xl flex flex-col shadow-md backdrop-blur-md overflow-hidden">
              <button
                onClick={() => handleZoom(1)}
                className="w-10 h-10 flex items-center justify-center text-stone-700 hover:text-[#FF6422] hover:bg-stone-50 transition-colors"
                title="Zoom in"
              >
                <Plus className="w-4 h-4" />
              </button>
              <div className="w-full h-px bg-stone-200" />
              <button
                onClick={() => handleZoom(-1)}
                className="w-10 h-10 flex items-center justify-center text-stone-700 hover:text-[#FF6422] hover:bg-stone-50 transition-colors"
                title="Zoom out"
              >
                <Minus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Selected Salon Floating Card (Mobile/Overlay) */}
          {selectedMarkerSalon && (
            <div className="absolute bottom-4 left-3 right-16 z-20 animate-in slide-in-from-bottom-3 duration-200">
              <div className="bg-white/95 backdrop-blur-md border border-orange-200 rounded-2xl p-3 shadow-xl flex items-center gap-3">
                <img
                  src={selectedMarkerSalon.coverImage}
                  alt={selectedMarkerSalon.name}
                  className="w-16 h-16 rounded-xl object-cover shrink-0 border border-stone-200"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 text-[10px]">
                    <span className="font-bold text-[#FF6422]">{selectedMarkerSalon.rating} ★</span>
                    <span className="text-stone-300">•</span>
                    <span className="text-stone-600">{selectedMarkerSalon.distanceKm} km</span>
                  </div>
                  <h4 className="text-xs font-bold text-stone-900 truncate">{selectedMarkerSalon.name}</h4>
                  <p className="text-[11px] text-stone-500 truncate">{selectedMarkerSalon.locality}</p>
                  
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    {/* Google Maps Directions Redirection Button */}
                    <button
                      onClick={() =>
                        redirectToGoogleMaps(
                          {
                            lat: selectedMarkerSalon.coordinates.lat,
                            lng: selectedMarkerSalon.coordinates.lng,
                            name: selectedMarkerSalon.name,
                            address: selectedMarkerSalon.address,
                          },
                          userLocation || undefined,
                        )
                      }
                      className="px-2.5 py-1 rounded-lg bg-[#FF6422] text-white font-extrabold text-[10px] flex items-center gap-1 hover:bg-[#E55215] transition-colors shadow-sm"
                      title="Navigate turn-by-turn in Google Maps"
                    >
                      <Navigation className="w-3 h-3 fill-white" />
                      <span>Google Maps Directions ↗</span>
                    </button>

                    {/* View Details button */}
                    <button
                      onClick={() => setSelectedSalonForDetail(selectedMarkerSalon)}
                      className="text-[10px] font-bold text-[#FF6422] hover:text-orange-700 underline flex items-center gap-0.5"
                    >
                      Studio Info →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* SALON LIST SIDEBAR (Right side on desktop, full list on mobile) */}
        <div
          className={`lg:col-span-5 xl:col-span-4 space-y-3 ${
            viewMode === 'map' ? 'hidden sm:block' : 'block'
          }`}
        >
          <div className="flex items-center justify-between pb-1">
            <h3 className="text-sm font-bold text-stone-900 font-['Syne',sans-serif]">
              Studio Listings ({visibleSalons.length})
            </h3>
            <span className="text-[11px] text-stone-500">Sorted by distance</span>
          </div>

          <div className="space-y-3 max-h-[650px] overflow-y-auto pr-1">
            {visibleSalons.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-3xl border border-[#E8E2D8] shadow-sm">
                <MapPin className="w-8 h-8 text-stone-400 mx-auto mb-2" />
                <p className="text-xs font-semibold text-stone-800">No studios found in this range</p>
                <p className="text-[11px] text-stone-500 mt-1">Try expanding search radius to 10km or 20km.</p>
                <button
                  onClick={() => setRadiusKm(20)}
                  className="mt-3 px-3 py-1.5 rounded-xl bg-[#FF6422] text-white text-xs font-bold hover:bg-[#E55215] shadow-sm"
                >
                  Expand to 20 km
                </button>
              </div>
            ) : (
              visibleSalons.map((salon) => {
                const isSelected = selectedMarkerSalon?.id === salon.id;
                const waitTime = getEstimatedWaitMinutes(
                  salon.currentQueue,
                  salon.avgServiceTimeMinutes,
                  salon.activeBarbers,
                );

                return (
                  <div
                    key={salon.id}
                    onClick={() => handleSelectSalonClick(salon)}
                    className={`cursor-pointer rounded-2xl p-3.5 transition-all border ${
                      isSelected
                        ? 'bg-orange-50/80 border-orange-300 shadow-md ring-1 ring-orange-200'
                        : 'bg-white border-[#E8E2D8] hover:border-orange-200 hover:bg-[#FFFDF9] shadow-sm'
                    }`}
                  >
                    <div className="flex gap-3">
                      <img
                        src={salon.coverImage}
                        alt={salon.name}
                        className="w-16 h-16 rounded-xl object-cover shrink-0 border border-stone-100"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-stone-900 truncate">{salon.name}</h4>
                          <span className="text-[10px] font-bold text-[#FF6422] shrink-0">
                            {salon.rating} ★
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-500 truncate mt-0.5">{salon.locality}</p>

                        <div className="flex items-center gap-3 text-[10px] text-stone-600 mt-1">
                          <span className="font-semibold text-stone-700">{salon.distanceKm} km away</span>
                          <span>•</span>
                          <span className={`${salon.isOpen ? 'text-emerald-700 font-semibold' : 'text-stone-400'}`}>
                            {salon.isOpen ? `${salon.currentQueue} in queue (${waitTime}m)` : 'Closed'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-stone-100">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          redirectToGoogleMaps(
                            {
                              lat: salon.coordinates.lat,
                              lng: salon.coordinates.lng,
                              name: salon.name,
                              address: salon.address,
                            },
                            userLocation || undefined,
                          );
                        }}
                        className="text-[10px] font-bold text-[#FF6422] hover:text-orange-700 flex items-center gap-1"
                        title="Open in Google Maps"
                      >
                        <Navigation className="w-3 h-3 fill-[#FF6422]" />
                        <span>Google Maps Directions ↗</span>
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedSalonForDetail(salon);
                        }}
                        className="text-[10px] font-semibold text-stone-500 hover:text-stone-900 flex items-center gap-1"
                      >
                        <span>Details</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
