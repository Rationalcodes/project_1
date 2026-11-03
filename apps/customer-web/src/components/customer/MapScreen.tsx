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
} from 'lucide-react';
import {
  useCustomer,
  getEstimatedWaitMinutes,
} from '../../context/CustomerContext';
import { Salon } from '@kumbhakaran/shared-types';
import {
  calculateHaversineDistance,
  redirectToGoogleMaps,
  loadLeafletScript,
} from '@kumbhakaran/ui';

export const MapScreen: React.FC = () => {
  const {
    salons,
    userLocation,
    setSelectedSalonForDetail,
    requestDeviceLocation,
    triggerNotification,
  } = useCustomer();

  const [selectedMarkerSalon, setSelectedMarkerSalon] = useState<Salon | null>(salons[0] || null);
  const [mapSearch, setMapSearch] = useState('');
  const [radiusKm, setRadiusKm] = useState<number>(10);
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [isLeafletReady, setIsLeafletReady] = useState(false);
  const [hasMapMoved, setHasMapMoved] = useState(false);
  const [mapCenterCoords, setMapCenterCoords] = useState<{ lat: number; lng: number }>({
    lat: userLocation.lat,
    lng: userLocation.lng,
  });

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<any>(null);
  const markersLayerRef = useRef<any>(null);

  // Filter salons by radius & search, calculating distance dynamically with Haversine formula
  const visibleSalons = salons
    .map((s) => ({
      ...s,
      computedDistance: calculateHaversineDistance(
        userLocation.lat,
        userLocation.lng,
        s.coordinates.lat,
        s.coordinates.lng,
      ),
    }))
    .filter((s) => {
      if (s.computedDistance > radiusKm) return false;
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

  // 1. Load Leaflet script and CSS dynamically (zero API keys, open-source dark tiles)
  useEffect(() => {
    let isMounted = true;
    loadLeafletScript().then((loaded) => {
      if (isMounted) {
        setIsLeafletReady(loaded || Boolean((window as any).L));
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Instantiate and mount Leaflet map
  useEffect(() => {
    if (!isLeafletReady || !mapContainerRef.current) return;
    const L = (window as any).L;
    if (!L) return;

    if (!leafletMapRef.current) {
      // Create map instance
      const map = L.map(mapContainerRef.current, {
        center: [userLocation.lat, userLocation.lng],
        zoom: 14,
        zoomControl: false,
        attributionControl: false,
      });

      // CartoDB Dark Matter tiles (sleek, high-contrast dark radar theme)
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        subdomains: 'abcd',
      }).addTo(map);

      // Layer group for dynamic markers
      const markersLayer = L.layerGroup().addTo(map);
      markersLayerRef.current = markersLayer;

      map.on('moveend', () => {
        const c = map.getCenter();
        if (c) {
          setMapCenterCoords({ lat: c.lat(), lng: c.lng });
          setHasMapMoved(true);
        }
      });

      leafletMapRef.current = map;
    } else {
      leafletMapRef.current.setView([userLocation.lat, userLocation.lng], 14);
    }

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
        markersLayerRef.current = null;
      }
    };
  }, [isLeafletReady, userLocation.lat, userLocation.lng]);

  // 3. Render and synchronize salon markers & user position beacon
  useEffect(() => {
    if (!leafletMapRef.current || !markersLayerRef.current) return;
    const L = (window as any).L;
    if (!L) return;

    const layer = markersLayerRef.current;
    layer.clearLayers();

    // A. User GPS Beacon (Blue pulsing radar marker)
    const userBeaconHtml = `
      <div style="position: relative; width: 24px; height: 24px;">
        <div style="position: absolute; inset: -4px; background: rgba(59, 130, 246, 0.4); border-radius: 9999px; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
        <div style="position: absolute; inset: 2px; background: #3b82f6; border: 2.5px solid #ffffff; border-radius: 9999px; box-shadow: 0 0 12px #3b82f6;"></div>
      </div>
    `;
    const userIcon = L.divIcon({
      className: 'user-beacon-marker',
      html: userBeaconHtml,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });
    L.marker([userLocation.lat, userLocation.lng], { icon: userIcon, title: 'Your Location' }).addTo(layer);

    // B. Salon markers with live queue count & name
    visibleSalons.forEach((salon) => {
      const isSelected = selectedMarkerSalon?.id === salon.id;
      const salonBadgeHtml = `
        <div style="background: ${isSelected ? '#f59e0b' : '#14141e'}; color: ${isSelected ? '#000' : '#fff'}; border: 2px solid #f59e0b; border-radius: 9999px; padding: 4px 10px; font-size: 11px; font-weight: 800; font-family: 'Syne', sans-serif; display: flex; align-items: center; gap: 5px; box-shadow: 0 4px 16px rgba(0,0,0,0.8); cursor: pointer; transition: transform 0.15s ease; white-space: nowrap;">
          <span>✂ ${salon.name.length > 14 ? salon.name.slice(0, 14) + '…' : salon.name}</span>
          <span style="background: ${isSelected ? '#000' : '#f59e0b'}; color: ${isSelected ? '#f59e0b' : '#000'}; border-radius: 9999px; padding: 1px 6px; font-size: 10px; font-weight: 900;">
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
  }, [visibleSalons, selectedMarkerSalon, userLocation, isLeafletReady]);

  // Handle zooming
  const handleZoom = (delta: number) => {
    if (!leafletMapRef.current) return;
    if (delta > 0) {
      leafletMapRef.current.zoomIn();
    } else {
      leafletMapRef.current.zoomOut();
    }
  };

  // Center on user GPS position
  const handlePanToUser = async () => {
    await requestDeviceLocation();
    if (leafletMapRef.current) {
      leafletMapRef.current.setView([userLocation.lat, userLocation.lng], 15);
      setHasMapMoved(false);
    }
  };

  // Center on searched area
  const handleSearchThisArea = () => {
    setHasMapMoved(false);
    triggerNotification(`Scanning studios around (${mapCenterCoords.lat.toFixed(3)}, ${mapCenterCoords.lng.toFixed(3)})`);
  };

  const handleSelectSalonClick = (salon: Salon) => {
    setSelectedMarkerSalon(salon);
    if (leafletMapRef.current) {
      leafletMapRef.current.panTo([salon.coordinates.lat, salon.coordinates.lng]);
      leafletMapRef.current.setZoom(15);
    }
  };

  return (
    <div className="space-y-4 pb-28 text-slate-100">
      {/* Header controls & radius switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-widest font-extrabold px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
              Interactive Radar
            </span>
            <span className="text-xs text-zinc-400 font-medium">
              {visibleSalons.length} studios within {radiusKm} km
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white mt-0.5 font-['Syne',sans-serif]">
            Nearby Salon Map
          </h1>
        </div>

        {/* Radius & View Mode pills */}
        <div className="flex items-center gap-2">
          {/* Radius Filter */}
          <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-xl p-0.5 text-xs font-semibold">
            {[2, 5, 10, 20].map((r) => (
              <button
                key={r}
                onClick={() => setRadiusKm(r)}
                className={`px-2.5 py-1 rounded-lg transition-colors ${
                  radiusKm === r
                    ? 'bg-amber-500 text-black font-bold'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {r}km
              </button>
            ))}
          </div>

          {/* Toggle Map / List view on mobile */}
          <div className="sm:hidden flex items-center bg-zinc-900 border border-zinc-800 rounded-xl p-0.5 text-xs">
            <button
              onClick={() => setViewMode('map')}
              className={`p-1.5 rounded-lg ${viewMode === 'map' ? 'bg-amber-500 text-black' : 'text-zinc-400'}`}
              title="Map view"
            >
              <MapIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg ${viewMode === 'list' ? 'bg-amber-500 text-black' : 'text-zinc-400'}`}
              title="List view"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-amber-400 absolute left-3.5 top-3" />
        <input
          type="text"
          value={mapSearch}
          onChange={(e) => setMapSearch(e.target.value)}
          placeholder="Filter map by studio name, locality or PIN code..."
          className="w-full pl-10 pr-4 py-2.5 bg-zinc-900/90 border border-zinc-700/80 rounded-2xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400 shadow-inner"
        />
        {mapSearch && (
          <button
            onClick={() => setMapSearch('')}
            className="absolute right-3 top-3 text-zinc-500 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Main Split Layout: Desktop Side-by-Side / Mobile Stack */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* MAP CONTAINER (Left or Top) */}
        <div
          className={`lg:col-span-7 xl:col-span-8 relative rounded-3xl overflow-hidden border border-zinc-800 bg-[#0c0c12] shadow-2xl min-h-[460px] h-[60vh] lg:h-[650px] ${
            viewMode === 'list' ? 'hidden sm:block' : 'block'
          }`}
        >
          {/* Interactive Leaflet Dark Map (Zero API keys required) */}
          <div ref={mapContainerRef} className="w-full h-full" style={{ zIndex: 1 }} />

          {/* Floating "Search This Area" Pill */}
          {hasMapMoved && (
            <button
              onClick={handleSearchThisArea}
              className="absolute top-4 left-1/2 -translate-x-1/2 z-20 px-4 py-2 rounded-2xl bg-amber-500 text-black text-xs font-black shadow-2xl flex items-center gap-2 hover:bg-amber-400 transition-transform active:scale-95 animate-in fade-in"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Search This Area</span>
            </button>
          )}

          {/* Map Controls (Zoom in/out + My Location) */}
          <div className="absolute bottom-6 right-4 z-20 flex flex-col gap-2">
            <button
              onClick={handlePanToUser}
              className="w-10 h-10 rounded-2xl bg-[#121218]/90 border border-zinc-700/80 text-amber-400 hover:bg-zinc-800 flex items-center justify-center shadow-xl backdrop-blur-md transition-all active:scale-90"
              title="Center on my location"
            >
              <Crosshair className="w-5 h-5 text-amber-400" />
            </button>
            <div className="bg-[#121218]/90 border border-zinc-700/80 rounded-2xl flex flex-col shadow-xl backdrop-blur-md overflow-hidden">
              <button
                onClick={() => handleZoom(1)}
                className="w-10 h-10 flex items-center justify-center text-zinc-200 hover:bg-zinc-800 transition-colors"
                title="Zoom in"
              >
                <Plus className="w-4 h-4" />
              </button>
              <div className="w-full h-px bg-zinc-800" />
              <button
                onClick={() => handleZoom(-1)}
                className="w-10 h-10 flex items-center justify-center text-zinc-200 hover:bg-zinc-800 transition-colors"
                title="Zoom out"
              >
                <Minus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Selected Salon Floating Card (Mobile/Overlay) */}
          {selectedMarkerSalon && (
            <div className="absolute bottom-4 left-3 right-16 z-20 animate-in slide-in-from-bottom-3 duration-200">
              <div className="bg-[#12121a]/95 backdrop-blur-md border border-amber-500/40 rounded-2xl p-3 shadow-2xl flex items-center gap-3">
                <img
                  src={selectedMarkerSalon.coverImage}
                  alt={selectedMarkerSalon.name}
                  className="w-16 h-16 rounded-xl object-cover shrink-0 border border-zinc-800"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 text-[10px]">
                    <span className="font-bold text-amber-400">{selectedMarkerSalon.rating} ★</span>
                    <span className="text-zinc-500">•</span>
                    <span className="text-zinc-400">{selectedMarkerSalon.distanceKm} km</span>
                  </div>
                  <h4 className="text-xs font-bold text-white truncate">{selectedMarkerSalon.name}</h4>
                  <p className="text-[11px] text-zinc-400 truncate">{selectedMarkerSalon.locality}</p>
                  
                  <div className="flex items-center gap-2 mt-1.5">
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
                          userLocation,
                        )
                      }
                      className="px-2.5 py-1 rounded-lg bg-amber-500 text-black font-extrabold text-[10px] flex items-center gap-1 hover:bg-amber-400 transition-colors shadow-md"
                      title="Navigate turn-by-turn in Google Maps"
                    >
                      <Navigation className="w-3 h-3 fill-black" />
                      <span>Directions ↗</span>
                    </button>

                    {/* View Details button */}
                    <button
                      onClick={() => setSelectedSalonForDetail(selectedMarkerSalon)}
                      className="text-[10px] font-bold text-amber-400 hover:text-amber-300 underline flex items-center gap-0.5"
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
            <h3 className="text-sm font-bold text-white font-['Syne',sans-serif]">
              Studio Listings ({visibleSalons.length})
            </h3>
            <span className="text-[11px] text-zinc-400">Sorted by distance</span>
          </div>

          <div className="space-y-3 max-h-[650px] overflow-y-auto pr-1">
            {visibleSalons.length === 0 ? (
              <div className="p-8 text-center bg-zinc-900/50 rounded-3xl border border-zinc-800">
                <MapPin className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                <p className="text-xs font-semibold text-zinc-300">No studios found in this range</p>
                <p className="text-[11px] text-zinc-500 mt-1">Try expanding search radius to 10km or 20km.</p>
                <button
                  onClick={() => setRadiusKm(20)}
                  className="mt-3 px-3 py-1.5 rounded-xl bg-amber-500 text-black text-xs font-bold hover:bg-amber-400"
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
                        ? 'bg-amber-500/10 border-amber-500/50 shadow-lg shadow-amber-500/5 ring-1 ring-amber-500/30'
                        : 'bg-[#121217] border-zinc-800/80 hover:border-zinc-700 hover:bg-[#16161d]'
                    }`}
                  >
                    <div className="flex gap-3">
                      <img
                        src={salon.coverImage}
                        alt={salon.name}
                        className="w-16 h-16 rounded-xl object-cover shrink-0 border border-zinc-800"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <h4 className="text-xs font-bold text-white truncate">{salon.name}</h4>
                          <span className="text-[10px] font-bold text-amber-400 flex items-center gap-0.5 shrink-0">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                            {salon.rating}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                          {salon.locality} • {salon.distanceKm} km away
                        </p>

                        <div className="flex items-center gap-2 mt-2">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              salon.currentQueue === 0
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : 'bg-amber-500/20 text-amber-300'
                            }`}
                          >
                            {salon.currentQueue === 0
                              ? 'Zero wait'
                              : `${salon.currentQueue} waiting (~${waitTime}m)`}
                          </span>

                          {/* Google Maps Directions button */}
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
                                userLocation,
                              );
                            }}
                            className="ml-auto text-[10px] font-bold px-2 py-1 rounded-lg bg-zinc-800 hover:bg-amber-500 hover:text-black text-amber-400 transition-colors flex items-center gap-1"
                            title="Navigate in Google Maps"
                          >
                            <Navigation className="w-2.5 h-2.5" />
                            <span>Maps ↗</span>
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedSalonForDetail(salon);
                            }}
                            className="text-[11px] font-bold text-zinc-300 hover:text-white flex items-center gap-0.5"
                          >
                            <span>Open</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
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
