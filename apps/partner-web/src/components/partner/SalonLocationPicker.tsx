import React, { useState, useEffect, useRef } from 'react';
import {
  MapPin,
  Navigation,
  Search,
  CheckCircle2,
  Crosshair,
  Move,
  Check,
  ExternalLink,
} from 'lucide-react';
import {
  loadLeafletScript,
  openGoogleMapsLocation,
} from '@kumbhakaran/ui';

export interface LocationPickerResult {
  address: string;
  locality: string;
  city: string;
  state: string;
  pincode: string;
  latitude: number;
  longitude: number;
  placeId?: string;
}

interface SalonLocationPickerProps {
  initialResult?: Partial<LocationPickerResult>;
  onLocationConfirmed: (result: LocationPickerResult) => void;
}

type PickerOption = 'search' | 'gps' | 'pin' | 'coords';

export const SalonLocationPicker: React.FC<SalonLocationPickerProps> = ({
  initialResult,
  onLocationConfirmed,
}) => {
  const [activeOption, setActiveOption] = useState<PickerOption>('search');
  const [address, setAddress] = useState(initialResult?.address || '');
  const [locality, setLocality] = useState(initialResult?.locality || 'Koramangala');
  const [city, setCity] = useState(initialResult?.city || 'Bengaluru');
  const [state, setState] = useState(initialResult?.state || 'Karnataka');
  const [pincode, setPincode] = useState(initialResult?.pincode || '560034');
  const [lat, setLat] = useState<number>(initialResult?.latitude || 12.9344);
  const [lng, setLng] = useState<number>(initialResult?.longitude || 77.6258);
  const [placeId, setPlaceId] = useState<string | undefined>(initialResult?.placeId);

  // Manual coordinate input strings for easy typing
  const [manualLatStr, setManualLatStr] = useState<string>(lat.toString());
  const [manualLngStr, setManualLngStr] = useState<string>(lng.toString());
  const [coordsError, setCoordsError] = useState<string | null>(null);

  // Search input & presets
  const [searchQuery, setSearchQuery] = useState('');
  const [isGpsLoading, setIsGpsLoading] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isMapReady, setIsMapReady] = useState(false);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  // Popular Hub Presets for Quick Location in India
  const hubPresets = [
    { name: 'Koramangala 4th Block, Bengaluru', locality: 'Koramangala', city: 'Bengaluru', state: 'Karnataka', pincode: '560034', lat: 12.9344, lng: 77.6258 },
    { name: '100 Feet Road, Indiranagar, Bengaluru', locality: 'Indiranagar', city: 'Bengaluru', state: 'Karnataka', pincode: '560038', lat: 12.9719, lng: 77.6412 },
    { name: 'Sector 1, HSR Layout, Bengaluru', locality: 'HSR Layout', city: 'Bengaluru', state: 'Karnataka', pincode: '560102', lat: 12.9121, lng: 77.6446 },
    { name: 'Linking Road, Bandra West, Mumbai', locality: 'Bandra West', city: 'Mumbai', state: 'Maharashtra', pincode: '400050', lat: 19.0596, lng: 72.8295 },
    { name: 'Connaught Place, Central Delhi', locality: 'Connaught Place', city: 'New Delhi', state: 'Delhi', pincode: '110001', lat: 28.6315, lng: 77.2167 },
    { name: 'Jubilee Hills, Road No 36, Hyderabad', locality: 'Jubilee Hills', city: 'Hyderabad', state: 'Telangana', pincode: '500033', lat: 17.4319, lng: 78.4073 },
  ];

  // 1. Initialize open-source Leaflet map (zero keys, zero cost, 100% reliable)
  useEffect(() => {
    let isMounted = true;
    loadLeafletScript().then((loaded) => {
      if (isMounted) {
        setIsMapReady(loaded || Boolean((window as any).L));
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Mount and Synchronize Leaflet Map & Draggable Pin
  useEffect(() => {
    if (!isMapReady || !mapContainerRef.current) return;
    const L = (window as any).L;
    if (!L) return;

    if (!leafletMapRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [lat, lng],
        zoom: 16,
        zoomControl: false,
        attributionControl: false,
      });

      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        subdomains: 'abcd',
      }).addTo(map);

      // Custom draggable amber entrance pin
      const pinHtml = `
        <div style="position: relative; width: 34px; height: 34px; transform: translate(-50%, -100%); cursor: grab;">
          <div style="position: absolute; bottom: 0; left: 50%; transform: translateX(-50%); width: 8px; height: 8px; background: #000; border-radius: 50%; opacity: 0.4;"></div>
          <div style="width: 32px; height: 32px; background: #f59e0b; border: 3px solid #ffffff; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.6);">
            <div style="width: 10px; height: 10px; background: #000; border-radius: 50%;"></div>
          </div>
        </div>
      `;

      const markerIcon = L.divIcon({
        className: 'draggable-entrance-marker',
        html: pinHtml,
        iconSize: [34, 34],
        iconAnchor: [17, 34],
      });

      const marker = L.marker([lat, lng], {
        icon: markerIcon,
        draggable: true,
        title: 'Drag to salon entrance',
      }).addTo(map);

      marker.on('dragend', () => {
        const pos = marker.getLatLng();
        if (pos) {
          const newLat = Number(pos.lat.toFixed(6));
          const newLng = Number(pos.lng.toFixed(6));
          setLat(newLat);
          setLng(newLng);
          setManualLatStr(newLat.toString());
          setManualLngStr(newLng.toString());
          setIsConfirmed(false);
        }
      });

      map.on('click', (e: any) => {
        if (e.latlng) {
          const newLat = Number(e.latlng.lat.toFixed(6));
          const newLng = Number(e.latlng.lng.toFixed(6));
          marker.setLatLng(e.latlng);
          setLat(newLat);
          setLng(newLng);
          setManualLatStr(newLat.toString());
          setManualLngStr(newLng.toString());
          setIsConfirmed(false);
        }
      });

      leafletMapRef.current = map;
      markerRef.current = marker;
    } else {
      leafletMapRef.current.setView([lat, lng], 16);
      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
      }
    }

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
        markerRef.current = null;
      }
    };
  }, [isMapReady]);

  // Update marker position when lat/lng change from presets or manual inputs
  const updateMapPosition = (newLat: number, newLng: number) => {
    setLat(newLat);
    setLng(newLng);
    setManualLatStr(newLat.toString());
    setManualLngStr(newLng.toString());
    setIsConfirmed(false);

    if (leafletMapRef.current && markerRef.current) {
      leafletMapRef.current.setView([newLat, newLng], 16);
      markerRef.current.setLatLng([newLat, newLng]);
    }
  };

  // Option 1: Select preset location
  const handleSelectPreset = (hub: typeof hubPresets[0]) => {
    updateMapPosition(hub.lat, hub.lng);
    setLocality(hub.locality);
    setCity(hub.city);
    setState(hub.state);
    setPincode(hub.pincode);
    setAddress(hub.name);
  };

  // Option 2: Use Device GPS
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }
    setIsGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsGpsLoading(false);
        const newLat = Number(pos.coords.latitude.toFixed(6));
        const newLng = Number(pos.coords.longitude.toFixed(6));
        updateMapPosition(newLat, newLng);
      },
      (err) => {
        setIsGpsLoading(false);
        alert(`Could not fetch device location: ${err.message}`);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Option 4: Apply manual coordinates
  const handleApplyManualCoords = (e: React.FormEvent) => {
    e.preventDefault();
    setCoordsError(null);
    const parsedLat = parseFloat(manualLatStr.trim());
    const parsedLng = parseFloat(manualLngStr.trim());

    if (isNaN(parsedLat) || parsedLat < -90 || parsedLat > 90) {
      setCoordsError('Latitude must be a valid number between -90.0 and +90.0');
      return;
    }
    if (isNaN(parsedLng) || parsedLng < -180 || parsedLng > 180) {
      setCoordsError('Longitude must be a valid number between -180.0 and +180.0');
      return;
    }

    updateMapPosition(parsedLat, parsedLng);
  };

  // Confirm final location
  const handleConfirmLocation = () => {
    setIsConfirmed(true);
    onLocationConfirmed({
      address: address.trim() || `${locality}, ${city}`,
      locality: locality.trim(),
      city: city.trim(),
      state: state.trim(),
      pincode: pincode.trim(),
      latitude: lat,
      longitude: lng,
      placeId,
    });
  };

  return (
    <div className="space-y-4">
      {/* 4-Option Navigation Tabs */}
      <div className="flex flex-wrap p-1 rounded-2xl bg-zinc-950 border border-zinc-800 text-xs font-semibold gap-1">
        <button
          type="button"
          onClick={() => setActiveOption('search')}
          className={`flex-1 min-w-[120px] py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
            activeOption === 'search'
              ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
          }`}
        >
          <Search className="w-3.5 h-3.5" />
          <span>Option 1: Search</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveOption('gps');
            handleUseCurrentLocation();
          }}
          className={`flex-1 min-w-[120px] py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
            activeOption === 'gps'
              ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
          }`}
        >
          <Navigation className="w-3.5 h-3.5" />
          <span>Option 2: GPS</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveOption('pin')}
          className={`flex-1 min-w-[120px] py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
            activeOption === 'pin'
              ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
          }`}
        >
          <Move className="w-3.5 h-3.5" />
          <span>Option 3: Move Pin</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveOption('coords')}
          className={`flex-1 min-w-[120px] py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
            activeOption === 'coords'
              ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
          }`}
        >
          <Crosshair className="w-3.5 h-3.5" />
          <span>Option 4: Coords</span>
        </button>
      </div>

      {/* Sub-panel based on chosen option */}
      {activeOption === 'search' && (
        <div className="space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-amber-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter quick presets or enter salon locality..."
              className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-zinc-700/80 rounded-2xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400 shadow-inner"
            />
          </div>

          <div>
            <div className="text-[10px] uppercase font-bold text-zinc-400 mb-1.5">Quick Location Presets</div>
            <div className="flex flex-wrap gap-1.5">
              {hubPresets
                .filter(h => !searchQuery || h.name.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((hub) => (
                  <button
                    key={hub.name}
                    type="button"
                    onClick={() => handleSelectPreset(hub)}
                    className="px-2.5 py-1 rounded-xl bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-300 hover:border-amber-400 hover:text-white transition-colors"
                  >
                    📍 {hub.locality} ({hub.city})
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}

      {activeOption === 'gps' && (
        <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Navigation className={`w-4 h-4 text-amber-400 ${isGpsLoading ? 'animate-spin' : ''}`} />
            <span className="text-zinc-300">
              {isGpsLoading ? 'Acquiring high-accuracy GPS coordinates...' : 'Device GPS position acquired.'}
            </span>
          </div>
          <button
            type="button"
            onClick={handleUseCurrentLocation}
            className="px-3 py-1.5 rounded-xl bg-amber-500 text-black font-bold text-xs hover:bg-amber-400 shrink-0"
          >
            Re-locate
          </button>
        </div>
      )}

      {activeOption === 'pin' && (
        <div className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-400 flex items-center gap-2">
          <Move className="w-4 h-4 text-amber-400 shrink-0" />
          <span>Click anywhere on the map or drag the amber pin to place it exactly at your salon entrance.</span>
        </div>
      )}

      {activeOption === 'coords' && (
        <form onSubmit={handleApplyManualCoords} className="space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-zinc-400 block mb-1">Latitude (-90.000000 to +90.000000)</label>
              <input
                type="text"
                value={manualLatStr}
                onChange={(e) => setManualLatStr(e.target.value)}
                placeholder="12.934400"
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-xl text-xs text-white"
              />
            </div>
            <div>
              <label className="text-[10px] text-zinc-400 block mb-1">Longitude (-180.000000 to +180.000000)</label>
              <input
                type="text"
                value={manualLngStr}
                onChange={(e) => setManualLngStr(e.target.value)}
                placeholder="77.625800"
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-xl text-xs text-white"
              />
            </div>
          </div>
          {coordsError && <p className="text-[11px] text-rose-400 font-medium">{coordsError}</p>}
          <button
            type="submit"
            className="px-3 py-1.5 rounded-xl bg-amber-500 text-black font-bold text-xs hover:bg-amber-400"
          >
            Apply Coordinates
          </button>
        </form>
      )}

      {/* Interactive Leaflet Map Preview Container (Zero API keys required) */}
      <div className="relative w-full h-56 sm:h-72 rounded-2xl overflow-hidden border border-zinc-800 bg-[#0c0c11]">
        <div ref={mapContainerRef} className="w-full h-full" style={{ zIndex: 1 }} />

        {/* Live Coordinate Pill Overlay */}
        <div className="absolute bottom-3 left-3 z-20 px-3 py-1.5 rounded-xl bg-black/85 backdrop-blur-md border border-zinc-800 text-[11px] text-zinc-300 font-mono shadow-xl flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>{lat.toFixed(5)}, {lng.toFixed(5)}</span>
        </div>
      </div>

      {/* Confirmation & Address Summary Card */}
      <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold text-white">Selected Salon Location</span>
          </div>
          {isConfirmed ? (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
              <Check className="w-3 h-3" /> Confirmed
            </span>
          ) : (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
              Needs Confirmation
            </span>
          )}
        </div>

        <div className="text-xs text-zinc-300 space-y-1">
          <div><span className="text-zinc-500">Address:</span> {address || `${locality}, ${city}`}</div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-zinc-400">
            <span>Locality: <strong className="text-zinc-200">{locality}</strong></span>
            <span>City: <strong className="text-zinc-200">{city}</strong></span>
            <span>State: <strong className="text-zinc-200">{state}</strong></span>
            <span>PIN: <strong className="text-zinc-200">{pincode}</strong></span>
          </div>
        </div>

        {/* Direct Google Maps Location Verification */}
        <button
          type="button"
          onClick={() => openGoogleMapsLocation(lat, lng)}
          className="w-full py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-amber-400 text-xs font-bold border border-zinc-700/80 flex items-center justify-center gap-1.5 transition-colors"
          title="Verify exact coordinates on official Google Maps satellite/street view"
        >
          <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
          <span>Verify Exact Location on Google Maps ↗</span>
        </button>

        <button
          type="button"
          onClick={handleConfirmLocation}
          className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-lg ${
            isConfirmed
              ? 'bg-emerald-500 text-black shadow-emerald-500/20'
              : 'bg-amber-500 text-black hover:bg-amber-400 shadow-amber-500/20'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>{isConfirmed ? 'Location Confirmed ✓' : 'Confirm Salon Location'}</span>
        </button>
      </div>
    </div>
  );
};
