import React, { useState, useEffect, useRef } from 'react';
import {
  MapPin,
  Search,
  Star,
  Users,
  Clock,
  Navigation,
  ArrowRight,
  List,
  Map as MapIcon,
  Compass,
  Plus,
  Minus,
  SlidersHorizontal,
  X,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Crosshair,
  Layers,
  RefreshCw,
} from 'lucide-react';
import { useCustomer, getEstimatedWaitMinutes, getQueueDisplay, getQueueFreshness } from '../../context/CustomerContext';
import { Salon } from '@kumbhakaran/shared-types';
import { loadGoogleMapsScript, KUMBHAKARAN_MAP_STYLES, isGoogleMapsLoaded } from '@kumbhakaran/ui';

export const MapScreen: React.FC = () => {
  const {
    salons,
    userLocation,
    setUserLocation,
    setSelectedSalonForDetail,
    requestDeviceLocation,
    triggerNotification,
  } = useCustomer();

  const [selectedMarkerSalon, setSelectedMarkerSalon] = useState<Salon | null>(salons[0] || null);
  const [mapSearch, setMapSearch] = useState('');
  const [radiusKm, setRadiusKm] = useState<number>(5);
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [isGoogleMapsReady, setIsGoogleMapsReady] = useState(false);
  const [hasMapMoved, setHasMapMoved] = useState(false);
  const [mapCenterCoords, setMapCenterCoords] = useState<{ lat: number; lng: number }>({
    lat: userLocation.lat,
    lng: userLocation.lng,
  });

  const googleMapContainerRef = useRef<HTMLDivElement>(null);
  const googleMapInstance = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const userMarkerRef = useRef<any>(null);

  // Filter salons by search text and radius
  const visibleSalons = salons.filter((s) => {
    if (s.distanceKm > radiusKm) return false;
    if (mapSearch.trim()) {
      const q = mapSearch.toLowerCase();
      return (
        s.name.toLowerCase().includes(q) ||
        s.locality.toLowerCase().includes(q) ||
        s.pincode.includes(q)
      );
    }
    return true;
  });

  // 1. Initialize Google Maps JavaScript SDK
  useEffect(() => {
    let isMounted = true;
    loadGoogleMapsScript().then((loaded) => {
      if (isMounted) {
        setIsGoogleMapsReady(loaded || isGoogleMapsLoaded());
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Instantiate and mount Google Map
  useEffect(() => {
    if (!isGoogleMapsReady || !googleMapContainerRef.current) return;
    const gmaps = (window as any).google?.maps;
    if (!gmaps) return;

    if (!googleMapInstance.current) {
      const map = new gmaps.Map(googleMapContainerRef.current, {
        center: { lat: userLocation.lat, lng: userLocation.lng },
        zoom: 14,
        styles: KUMBHAKARAN_MAP_STYLES,
        disableDefaultUI: true,
        gestureHandling: 'greedy', // Smooth mobile gestures
        zoomControl: false,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      });

      googleMapInstance.current = map;

      // Track pan/drag to enable "Search This Area"
      map.addListener('dragend', () => {
        const center = map.getCenter();
        if (center) {
          setMapCenterCoords({ lat: center.lat(), lng: center.lng() });
          setHasMapMoved(true);
        }
      });
    } else {
      googleMapInstance.current.setCenter({ lat: userLocation.lat, lng: userLocation.lng });
    }
  }, [isGoogleMapsReady, userLocation]);

  // 3. Render and Synchronize Salon Markers
  useEffect(() => {
    if (!isGoogleMapsReady || !googleMapInstance.current) return;
    const gmaps = (window as any).google?.maps;
    if (!gmaps) return;

    // Clear previous markers
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    // Add User Current Location Marker
    if (userMarkerRef.current) userMarkerRef.current.setMap(null);
    userMarkerRef.current = new gmaps.Marker({
      position: { lat: userLocation.lat, lng: userLocation.lng },
      map: googleMapInstance.current,
      title: 'Your Location',
      icon: {
        path: gmaps.SymbolPath.CIRCLE,
        scale: 9,
        fillColor: '#38bdf8',
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 3,
      },
      zIndex: 999,
    });

    // Add Salon Markers
    visibleSalons.forEach((salon) => {
      const isSelected = selectedMarkerSalon?.id === salon.id;

      // Pin icon with SVG
      const marker = new gmaps.Marker({
        position: { lat: salon.coordinates.lat, lng: salon.coordinates.lng },
        map: googleMapInstance.current,
        title: salon.name,
        icon: {
          path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
          fillColor: isSelected ? '#f59e0b' : salon.isOpen ? '#fbbf24' : '#6b7280',
          fillOpacity: 1,
          strokeColor: '#000000',
          strokeWeight: 1.5,
          scale: isSelected ? 1.8 : 1.4,
          anchor: new gmaps.Point(12, 22),
        },
        zIndex: isSelected ? 100 : 10,
      });

      marker.addListener('click', () => {
        setSelectedMarkerSalon(salon);
        googleMapInstance.current.panTo({
          lat: salon.coordinates.lat,
          lng: salon.coordinates.lng,
        });
      });

      markersRef.current.push(marker);
    });
  }, [isGoogleMapsReady, visibleSalons, selectedMarkerSalon, userLocation]);

  const handleZoom = (delta: number) => {
    if (!googleMapInstance.current) return;
    const curZoom = googleMapInstance.current.getZoom() || 14;
    googleMapInstance.current.setZoom(curZoom + delta);
  };

  const handlePanToUser = async () => {
    await requestDeviceLocation();
    if (googleMapInstance.current) {
      googleMapInstance.current.panTo({ lat: userLocation.lat, lng: userLocation.lng });
      googleMapInstance.current.setZoom(15);
      setHasMapMoved(false);
    }
  };

  const handleSearchThisArea = () => {
    setUserLocation({
      name: `Map Center (${mapCenterCoords.lat.toFixed(3)}, ${mapCenterCoords.lng.toFixed(3)})`,
      lat: mapCenterCoords.lat,
      lng: mapCenterCoords.lng,
    });
    setHasMapMoved(false);
    triggerNotification('Searching salons in visible map area...');
  };

  const handleSelectSalonClick = (salon: Salon) => {
    setSelectedMarkerSalon(salon);
    if (googleMapInstance.current) {
      googleMapInstance.current.panTo({
        lat: salon.coordinates.lat,
        lng: salon.coordinates.lng,
      });
      googleMapInstance.current.setZoom(15);
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
          {/* Real Google Maps Container */}
          <div ref={googleMapContainerRef} className="w-full h-full" />

          {/* Fallback Display if Google Maps Key is missing */}
          {!isGoogleMapsReady && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-[#0d0d14]/90 z-10 backdrop-blur-sm">
              <div className="w-14 h-14 rounded-3xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center mb-3 shadow-lg shadow-amber-500/10">
                <Compass className="w-7 h-7 text-amber-400" />
              </div>
              <h3 className="text-base font-bold text-white font-['Syne',sans-serif]">
                Google Maps JavaScript API Radar
              </h3>
              <p className="text-xs text-zinc-400 max-w-sm mt-1">
                To render live street & satellite tiles, set <code className="text-amber-300">VITE_GOOGLE_MAPS_API_KEY</code> in Vercel. Showing live spatial studio positions below.
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-2 max-w-md">
                {visibleSalons.slice(0, 4).map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSelectedMarkerSalon(s)}
                    className="px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-700 text-xs text-zinc-200 hover:border-amber-400 transition-colors"
                  >
                    📍 {s.name} ({s.distanceKm}km)
                  </button>
                ))}
              </div>
            </div>
          )}

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

          {/* Selected Salon Floating Card (Mobile view overlay) */}
          {selectedMarkerSalon && (
            <div className="lg:hidden absolute bottom-4 left-3 right-16 z-20 animate-in slide-in-from-bottom-3 duration-200">
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
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300">
                      Queue: {selectedMarkerSalon.currentQueue}
                    </span>
                    <button
                      onClick={() => setSelectedSalonForDetail(selectedMarkerSalon)}
                      className="text-[10px] font-bold text-amber-400 hover:underline flex items-center gap-0.5"
                    >
                      View Details →
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
                          <span className="text-[10px] text-zinc-500">
                            From ₹{salon.startingPrice}
                          </span>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedSalonForDetail(salon);
                            }}
                            className="ml-auto text-[11px] font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1"
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
