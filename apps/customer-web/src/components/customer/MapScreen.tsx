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
  CheckCircle2
} from 'lucide-react';
import { useSalon, getEstimatedWaitMinutes, getQueueDisplay, getQueueFreshness } from '../../context/CustomerContext';
import { Salon } from '@kumbhakaran/shared-types';

export const MapScreen: React.FC = () => {
  const {
    salons,
    userLocation,
    setSelectedSalonForDetail
  } = useSalon();

  const [selectedMarkerSalon, setSelectedMarkerSalon] = useState<Salon | null>(salons[0]);
  const [mapSearch, setMapSearch] = useState('');
  const [zoomLevel, setZoomLevel] = useState(1);
  const [radiusKm, setRadiusKm] = useState<number>(5);
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [isGoogleMapsReady, setIsGoogleMapsReady] = useState(false);

  const googleMapRef = useRef<HTMLDivElement>(null);
  const googleMapInstance = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  const apiKey = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '').trim();

  // Filter salons by radius and search
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

  // Calculate relative map coordinates for canvas layout
  const getMarkerPosition = (salon: Salon, index: number) => {
    const angles = [35, 120, 210, 310, 75, 170];
    const angle = (angles[index % angles.length] * Math.PI) / 180;
    const distanceScaled = Math.min(140, Math.max(45, salon.distanceKm * 28 * zoomLevel));
    const leftPercent = 50 + (Math.cos(angle) * distanceScaled) / 3.8;
    const topPercent = 46 + (Math.sin(angle) * distanceScaled) / 3.8;
    return {
      left: `${Math.max(12, Math.min(88, leftPercent))}%`,
      top: `${Math.max(15, Math.min(78, topPercent))}%`
    };
  };

  // Google Maps Dynamic Loader
  useEffect(() => {
    if (!apiKey || (window as any).google?.maps) {
      if ((window as any).google?.maps) setIsGoogleMapsReady(true);
      return;
    }

    const scriptId = 'google-maps-script';
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,marker&loading=async`;
      script.async = true;
      script.defer = true;
      script.onload = () => setIsGoogleMapsReady(true);
      document.head.appendChild(script);
    }
  }, [apiKey]);

  // Initialize Real Google Maps if API key is active
  useEffect(() => {
    if (!isGoogleMapsReady || !googleMapRef.current || !(window as any).google?.maps) return;

    try {
      const google = (window as any).google;
      const center = { lat: userLocation.lat, lng: userLocation.lng };

      if (!googleMapInstance.current) {
        googleMapInstance.current = new google.maps.Map(googleMapRef.current, {
          center,
          zoom: 14,
          disableDefaultUI: true,
          zoomControl: false,
          styles: [
            { elementType: 'geometry', stylers: [{ color: '#121217' }] },
            { elementType: 'labels.text.stroke', stylers: [{ color: '#121217' }] },
            { elementType: 'labels.text.fill', stylers: [{ color: '#a1a1aa' }] },
            { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#27272a' }] },
            { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#18181b' }] },
            { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#3f3f46' }] },
            { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#09090b' }] }
          ]
        });
      }

      // Clear existing markers
      markersRef.current.forEach((m) => m.setMap(null));
      markersRef.current = [];

      // Add Customer Live Location Beacon
      new google.maps.Marker({
        position: center,
        map: googleMapInstance.current,
        title: 'Your Location',
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: '#f59e0b',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2
        }
      });

      // Add Salon Markers
      visibleSalons.forEach((salon) => {
        const marker = new google.maps.Marker({
          position: { lat: salon.coordinates.lat, lng: salon.coordinates.lng },
          map: googleMapInstance.current,
          title: `${salon.name} (${salon.currentQueue} waiting)`
        });

        marker.addListener('click', () => {
          setSelectedMarkerSalon(salon);
        });

        markersRef.current.push(marker);
      });
    } catch (e) {
      console.warn("Google Maps init fallback to canvas:", e);
    }
  }, [isGoogleMapsReady, userLocation, visibleSalons]);

  return (
    <div className="relative min-h-[620px] h-[calc(100vh-140px)] flex flex-col overflow-hidden rounded-3xl border border-zinc-800/80 bg-[#0b0b0e] text-slate-100 shadow-2xl">
      {/* Top Map Floating Search & Controls Bar */}
      <div className="absolute top-3 left-3 right-3 z-20 space-y-2">
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
              <Search className="w-4 h-4 text-amber-400" />
            </div>
            <input
              type="text"
              value={mapSearch}
              onChange={(e) => setMapSearch(e.target.value)}
              placeholder="Search by city, locality or PIN code..."
              className="w-full pl-9 pr-8 py-2.5 bg-zinc-900/90 border border-zinc-700/80 rounded-2xl text-xs text-white placeholder-zinc-500 backdrop-blur-md focus:outline-none focus:border-amber-400 shadow-xl"
            />
            {mapSearch && (
              <button
                onClick={() => setMapSearch('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-zinc-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Toggle Map / List button */}
          <div className="flex items-center bg-zinc-900/90 border border-zinc-800 p-1 rounded-2xl shadow-xl backdrop-blur-md">
            <button
              onClick={() => setViewMode('map')}
              className={`p-1.5 rounded-xl text-xs flex items-center gap-1 font-semibold transition-all ${
                viewMode === 'map' ? 'bg-amber-500 text-black shadow' : 'text-zinc-400 hover:text-white'
              }`}
              title="Map View"
            >
              <MapIcon className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-xl text-xs flex items-center gap-1 font-semibold transition-all ${
                viewMode === 'list' ? 'bg-amber-500 text-black shadow' : 'text-zinc-400 hover:text-white'
              }`}
              title="List View"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Radius Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-[11px]">
          <span className="text-zinc-400 font-medium px-2 py-0.5 bg-black/60 rounded-full backdrop-blur-sm border border-zinc-800 shrink-0">
            Radius:
          </span>
          {[1, 3, 5, 10].map((km) => (
            <button
              key={km}
              onClick={() => setRadiusKm(km)}
              className={`px-2.5 py-0.5 rounded-full font-bold whitespace-nowrap transition-all border shrink-0 ${
                radiusKm === km
                  ? 'bg-amber-400 text-black border-amber-300 shadow'
                  : 'bg-zinc-900/80 text-zinc-300 border-zinc-800 hover:border-zinc-700'
              }`}
            >
              Within {km} km
            </button>
          ))}

          {/* Maps Engine Indicator Pill */}
          <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-700 text-zinc-400 hidden sm:inline-flex items-center gap-1 shrink-0">
            <span className={`w-1.5 h-1.5 rounded-full ${isGoogleMapsReady ? 'bg-emerald-400' : 'bg-amber-400'}`} />
            <span>{isGoogleMapsReady ? 'Google Maps Active' : 'Vector Map Canvas'}</span>
          </span>
        </div>
      </div>

      {/* Main Map View or List View */}
      {viewMode === 'map' ? (
        <div className="relative flex-1 w-full h-full overflow-hidden select-none">
          {/* If Real Google Maps is ready, render into container */}
          {isGoogleMapsReady && apiKey ? (
            <div ref={googleMapRef} className="w-full h-full" />
          ) : (
            /* Interactive Dark Luxury Vector Canvas Map */
            <div className="absolute inset-0 bg-[#09090c] overflow-hidden">
              <svg className="w-full h-full opacity-25" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="city-grid" width="60" height="60" patternUnits="userSpaceOnUse">
                    <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#52525b" strokeWidth="0.8" />
                  </pattern>
                  <pattern id="city-roads" width="240" height="240" patternUnits="userSpaceOnUse">
                    <path d="M 0 120 L 240 120 M 120 0 L 120 240" fill="none" stroke="#f59e0b" strokeWidth="1.2" opacity="0.3" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#city-grid)" />
                <rect width="100%" height="100%" fill="url(#city-roads)" />
              </svg>

              {/* Geographic Arteries */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40">
                <path d="M -50,180 Q 200,120 400,260 T 900,220" fill="none" stroke="#3f3f46" strokeWidth="16" strokeLinecap="round" />
                <path d="M 280,-40 Q 320,240 220,550 T 380,850" fill="none" stroke="#3f3f46" strokeWidth="14" strokeLinecap="round" />
                <path d="M 50,420 Q 300,380 650,490" fill="none" stroke="#52525b" strokeWidth="8" strokeLinecap="round" />
              </svg>

              {/* User Location Pulse Center Marker */}
              <div className="absolute left-1/2 top-[46%] -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center pointer-events-none">
                <div className="relative flex items-center justify-center">
                  <span className="w-10 h-10 rounded-full bg-amber-500/20 animate-ping absolute" />
                  <span className="w-6 h-6 rounded-full bg-amber-500/30 border border-amber-400 flex items-center justify-center shadow-lg shadow-amber-500/40">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  </span>
                </div>
                <div className="mt-1 px-2 py-0.5 rounded-md bg-black/80 border border-zinc-700 text-[10px] font-bold text-amber-300 backdrop-blur-sm whitespace-nowrap shadow-lg">
                  You are here ({userLocation.name.split(',')[0]})
                </div>
              </div>

              {/* Interactive Nearby Salon Map Markers with Queue Count Badges */}
              {visibleSalons.map((salon, index) => {
                const pos = getMarkerPosition(salon, index);
                const isSelected = selectedMarkerSalon?.id === salon.id;
                const queueInfo = getQueueDisplay(salon.currentQueue, salon.isOpen);

                return (
                  <div
                    key={salon.id}
                    style={{ left: pos.left, top: pos.top }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 z-20 cursor-pointer transition-transform duration-300 hover:scale-110"
                    onClick={() => setSelectedMarkerSalon(salon)}
                  >
                    <div
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-2xl shadow-2xl border transition-all duration-300 backdrop-blur-md ${
                        isSelected
                          ? 'bg-amber-500 text-black border-white ring-4 ring-amber-500/30 scale-110 font-bold'
                          : `${queueInfo.badgeClass} font-semibold hover:border-amber-400`
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-black' : queueInfo.dotClass}`} />
                      <span className="text-[11px] whitespace-nowrap">
                        {salon.currentQueue < 10 ? `0${salon.currentQueue}` : salon.currentQueue} waiting
                      </span>
                    </div>

                    <div className="flex justify-center -mt-0.5">
                      <div
                        className={`w-2 h-2 rotate-45 ${
                          isSelected ? 'bg-amber-500' : 'bg-zinc-900 border-r border-b border-zinc-700'
                        }`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Map Zoom & Center Controls */}
          <div className="absolute right-3 top-28 z-20 flex flex-col gap-1.5 bg-zinc-900/90 border border-zinc-800 p-1 rounded-2xl shadow-2xl backdrop-blur-md">
            <button
              onClick={() => setZoomLevel((z) => Math.min(1.6, z + 0.2))}
              className="p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition-colors"
              title="Zoom in"
            >
              <Plus className="w-4 h-4" />
            </button>
            <div className="h-px bg-zinc-800 mx-1" />
            <button
              onClick={() => setZoomLevel((z) => Math.max(0.7, z - 0.2))}
              className="p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition-colors"
              title="Zoom out"
            >
              <Minus className="w-4 h-4" />
            </button>
            <div className="h-px bg-zinc-800 mx-1" />
            <button
              onClick={() => setZoomLevel(1)}
              className="p-2 text-amber-400 hover:text-amber-300 rounded-xl hover:bg-zinc-800 transition-colors"
              title="Reset center"
            >
              <Compass className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        /* List View alternative */
        <div className="flex-1 overflow-y-auto p-4 pt-20 space-y-3 pb-32">
          {visibleSalons.map((salon) => {
            const queueInfo = getQueueDisplay(salon.currentQueue, salon.isOpen);
            const waitTime = getEstimatedWaitMinutes(salon.currentQueue, salon.avgServiceTimeMinutes, salon.activeBarbers);

            return (
              <div
                key={salon.id}
                onClick={() => {
                  setSelectedMarkerSalon(salon);
                  setSelectedSalonForDetail(salon);
                }}
                className="bg-[#15151c] border border-zinc-800 rounded-2xl p-3 flex items-center justify-between gap-3 hover:border-amber-400/50 cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <img src={salon.coverImage} alt={salon.name} className="w-14 h-14 rounded-xl object-cover shrink-0" />
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-white truncate">{salon.name}</h4>
                    <p className="text-[11px] text-zinc-400">{salon.locality} • {salon.distanceKm} km</p>
                    <div className="flex items-center gap-2 mt-1 text-[10px]">
                      <span className="text-amber-400 font-bold flex items-center gap-0.5">
                        <Star className="w-3 h-3 fill-amber-400" /> {salon.rating}
                      </span>
                      <span className="text-zinc-500">•</span>
                      <span className="text-emerald-400 font-semibold">~{waitTime}m wait</span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${queueInfo.pillClass}`}>
                    {salon.currentQueue} waiting
                  </span>
                  <div className="text-xs font-bold text-amber-400 mt-1">₹{salon.startingPrice}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Bottom Information Sliding Card */}
      {selectedMarkerSalon && viewMode === 'map' && (
        <div className="absolute bottom-3 left-3 right-3 z-30 animate-in fade-in slide-in-from-bottom duration-300">
          <div className="bg-[#15151c]/95 backdrop-blur-xl border border-zinc-700/80 rounded-3xl p-3.5 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden relative shrink-0">
                <img
                  src={selectedMarkerSalon.coverImage}
                  alt={selectedMarkerSalon.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-1 right-1 bg-black/80 px-1.5 py-0.5 rounded text-[9px] font-bold text-amber-400 flex items-center gap-0.5">
                  <Star className="w-2.5 h-2.5 fill-amber-400" />
                  {selectedMarkerSalon.rating}
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white truncate">
                      {selectedMarkerSalon.name}
                    </h3>
                    <p className="text-[11px] text-zinc-400 flex items-center gap-1 mt-0.5">
                      <Navigation className="w-3 h-3 text-zinc-500" />
                      {selectedMarkerSalon.distanceKm} km away • {selectedMarkerSalon.locality}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedMarkerSalon(null)}
                    className="p-1 rounded-full text-zinc-500 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center gap-2 mt-2">
                  <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 font-extrabold text-xs">
                    <Users className="w-3.5 h-3.5" />
                    <span>{selectedMarkerSalon.currentQueue < 10 ? `0${selectedMarkerSalon.currentQueue}` : selectedMarkerSalon.currentQueue} Waiting</span>
                  </div>
                  <span className="text-[11px] text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-1 rounded-xl border border-emerald-500/20">
                    ~{getEstimatedWaitMinutes(selectedMarkerSalon.currentQueue, selectedMarkerSalon.avgServiceTimeMinutes, selectedMarkerSalon.activeBarbers)} min wait
                  </span>
                </div>

                <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-zinc-800">
                  <span className="text-xs text-zinc-300 font-semibold">
                    Haircut: <span className="text-amber-400 font-bold">₹{selectedMarkerSalon.startingPrice}</span>
                  </span>

                  <button
                    onClick={() => setSelectedSalonForDetail(selectedMarkerSalon)}
                    className="px-3.5 py-1.5 rounded-xl bg-amber-500 text-black font-bold text-xs hover:bg-amber-400 transition-colors flex items-center gap-1 shadow-lg shadow-amber-500/20"
                  >
                    View Salon <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
