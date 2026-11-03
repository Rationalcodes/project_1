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
  loadGoogleMapsScript,
  isGoogleMapsLoaded,
  KUMBHAKARAN_MAP_STYLES,
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
  const [mapEngine, setMapEngine] = useState<'google' | 'leaflet'>('google');
  const [isGoogleReady, setIsGoogleReady] = useState(false);
  const [isLeafletReady, setIsLeafletReady] = useState(false);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  
  // Google Maps references
  const googleMapRef = useRef<any>(null);
  const googleMarkerRef = useRef<any>(null);

  // Leaflet references
  const leafletMapRef = useRef<any>(null);
  const leafletMarkerRef = useRef<any>(null);

  // Popular Hub Presets for Quick Location in India
  const hubPresets = [
    { name: 'Koramangala 4th Block, Bengaluru', locality: 'Koramangala', city: 'Bengaluru', state: 'Karnataka', pincode: '560034', lat: 12.9344, lng: 77.6258 },
    { name: '100 Feet Road, Indiranagar, Bengaluru', locality: 'Indiranagar', city: 'Bengaluru', state: 'Karnataka', pincode: '560038', lat: 12.9719, lng: 77.6412 },
    { name: 'Sector 1, HSR Layout, Bengaluru', locality: 'HSR Layout', city: 'Bengaluru', state: 'Karnataka', pincode: '560102', lat: 12.9121, lng: 77.6446 },
    { name: 'Linking Road, Bandra West, Mumbai', locality: 'Bandra West', city: 'Mumbai', state: 'Maharashtra', pincode: '400050', lat: 19.0596, lng: 72.8295 },
    { name: 'Connaught Place, Central Delhi', locality: 'Connaught Place', city: 'New Delhi', state: 'Delhi', pincode: '110001', lat: 28.6315, lng: 77.2167 },
    { name: 'Jubilee Hills, Road No 36, Hyderabad', locality: 'Jubilee Hills', city: 'Hyderabad', state: 'Telangana', pincode: '500033', lat: 17.4319, lng: 78.4073 },
  ];

  // 1. Initialize Map Engines (Google Maps with Leaflet fallback)
  useEffect(() => {
    let isMounted = true;
    loadGoogleMapsScript().then((loaded) => {
      if (!isMounted) return;
      if (loaded || isGoogleMapsLoaded()) {
        setIsGoogleReady(true);
        setMapEngine('google');
      } else {
        loadLeafletScript().then((lLoaded) => {
          if (!isMounted) return;
          setIsLeafletReady(lLoaded || Boolean((window as any).L));
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
    if (mapEngine !== 'google' || !isGoogleReady || !mapContainerRef.current) return;
    const gmaps = (window as any).google?.maps;
    if (!gmaps) return;

    if (!googleMapRef.current) {
      const map = new gmaps.Map(mapContainerRef.current, {
        center: { lat, lng },
        zoom: 16,
        styles: KUMBHAKARAN_MAP_STYLES,
        disableDefaultUI: true,
        gestureHandling: 'greedy',
        zoomControl: false,
      });

      const marker = new gmaps.Marker({
        position: { lat, lng },
        map,
        draggable: true,
        title: 'Drag to salon entrance',
        icon: {
          path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
          fillColor: '#f59e0b',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
          scale: 1.8,
          anchor: new gmaps.Point(12, 22),
        },
      });

      marker.addListener('dragend', () => {
        const pos = marker.getPosition();
        if (pos) {
          const newLat = Number(pos.lat().toFixed(6));
          const newLng = Number(pos.lng().toFixed(6));
          setLat(newLat);
          setLng(newLng);
          setManualLatStr(newLat.toString());
          setManualLngStr(newLng.toString());
          setIsConfirmed(false);
        }
      });

      map.addListener('click', (e: any) => {
        if (e.latLng) {
          const newLat = Number(e.latLng.lat().toFixed(6));
          const newLng = Number(e.latLng.lng().toFixed(6));
          marker.setPosition(e.latLng);
          setLat(newLat);
          setLng(newLng);
          setManualLatStr(newLat.toString());
          setManualLngStr(newLng.toString());
          setIsConfirmed(false);
        }
      });

      googleMapRef.current = map;
      googleMarkerRef.current = marker;
    } else {
      googleMapRef.current.setCenter({ lat, lng });
      if (googleMarkerRef.current) {
        googleMarkerRef.current.setPosition({ lat, lng });
      }
    }
  }, [mapEngine, isGoogleReady]);

  // 2B. Mount Leaflet Map as resilient fallback
  useEffect(() => {
    if (mapEngine !== 'leaflet' || !isLeafletReady || !mapContainerRef.current) return;
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
      leafletMarkerRef.current = marker;
    } else {
      leafletMapRef.current.setView([lat, lng], 16);
      if (leafletMarkerRef.current) {
        leafletMarkerRef.current.setLatLng([lat, lng]);
      }
    }

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
        leafletMarkerRef.current = null;
      }
    };
  }, [mapEngine, isLeafletReady]);

  // Update marker position when lat/lng change from presets or manual inputs
  const updateMapPosition = (newLat: number, newLng: number) => {
    setLat(newLat);
    setLng(newLng);
    setManualLatStr(newLat.toString());
    setManualLngStr(newLng.toString());
    setIsConfirmed(false);

    if (mapEngine === 'google' && googleMapRef.current && googleMarkerRef.current) {
      googleMapRef.current.panTo({ lat: newLat, lng: newLng });
      googleMarkerRef.current.setPosition({ lat: newLat, lng: newLng });
    } else if (mapEngine === 'leaflet' && leafletMapRef.current && leafletMarkerRef.current) {
      leafletMapRef.current.setView([newLat, newLng], 16);
      leafletMarkerRef.current.setLatLng([newLat, newLng]);
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
      {/* 4 Flexible Input Options */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <button
          type="button"
          onClick={() => setActiveOption('search')}
          className={`p-2.5 rounded-xl border text-left transition-all ${
            activeOption === 'search'
              ? 'bg-amber-500/10 border-amber-500/50 text-amber-400'
              : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
          }`}
        >
          <div className="flex items-center gap-1.5 text-xs font-bold">
            <Search className="w-3.5 h-3.5" />
            <span>Popular Hubs</span>
          </div>
          <p className="text-[10px] text-zinc-500 mt-0.5">Select top city localities</p>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveOption('gps');
            handleUseCurrentLocation();
          }}
          className={`p-2.5 rounded-xl border text-left transition-all ${
            activeOption === 'gps'
              ? 'bg-amber-500/10 border-amber-500/50 text-amber-400'
              : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
          }`}
        >
          <div className="flex items-center gap-1.5 text-xs font-bold">
            <Navigation className="w-3.5 h-3.5" />
            <span>Current GPS</span>
          </div>
          <p className="text-[10px] text-zinc-500 mt-0.5">Use salon device location</p>
        </button>

        <button
          type="button"
          onClick={() => setActiveOption('pin')}
          className={`p-2.5 rounded-xl border text-left transition-all ${
            activeOption === 'pin'
              ? 'bg-amber-500/10 border-amber-500/50 text-amber-400'
              : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
          }`}
        >
          <div className="flex items-center gap-1.5 text-xs font-bold">
            <Move className="w-3.5 h-3.5" />
            <span>Drag Pin</span>
          </div>
          <p className="text-[10px] text-zinc-500 mt-0.5">Pinpoint exact entrance</p>
        </button>

        <button
          type="button"
          onClick={() => setActiveOption('coords')}
          className={`p-2.5 rounded-xl border text-left transition-all ${
            activeOption === 'coords'
              ? 'bg-amber-500/10 border-amber-500/50 text-amber-400'
              : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
          }`}
        >
          <div className="flex items-center gap-1.5 text-xs font-bold">
            <Crosshair className="w-3.5 h-3.5" />
            <span>Coordinates</span>
          </div>
          <p className="text-[10px] text-zinc-500 mt-0.5">Enter Lat / Long values</p>
        </button>
      </div>

      {/* Option Panel 1: Search & Hub Presets */}
      {activeOption === 'search' && (
        <div className="p-3 bg-zinc-900/60 rounded-2xl border border-zinc-800 space-y-2">
          <label className="text-[11px] font-semibold text-zinc-400">Quick Select Prime Commercial Hubs:</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-40 overflow-y-auto">
            {hubPresets.map((hub, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectPreset(hub)}
                className="text-left p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-xs text-zinc-300 transition-colors"
              >
                <div className="font-bold text-white truncate">{hub.name}</div>
                <div className="text-[10px] text-zinc-500">{hub.locality}, {hub.city}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Option Panel 4: Manual Coordinates Form */}
      {activeOption === 'coords' && (
        <form onSubmit={handleApplyManualCoords} className="p-3 bg-zinc-900/60 rounded-2xl border border-zinc-800 space-y-2.5">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-semibold text-zinc-400 block mb-1">Latitude (°N/S)</label>
              <input
                type="text"
                value={manualLatStr}
                onChange={(e) => setManualLatStr(e.target.value)}
                placeholder="12.9344"
                className="w-full p-2 bg-zinc-900 border border-zinc-700 rounded-xl text-xs text-white"
              />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-zinc-400 block mb-1">Longitude (°E/W)</label>
              <input
                type="text"
                value={manualLngStr}
                onChange={(e) => setManualLngStr(e.target.value)}
                placeholder="77.6258"
                className="w-full p-2 bg-zinc-900 border border-zinc-700 rounded-xl text-xs text-white"
              />
            </div>
          </div>
          {coordsError && <p className="text-[11px] text-red-400 font-medium">{coordsError}</p>}
          <button
            type="submit"
            className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-amber-400 text-xs font-bold rounded-xl transition-colors"
          >
            Apply Coordinates to Map Pin
          </button>
        </form>
      )}

      {/* Interactive Map with Live Draggable Entrance Marker */}
      <div className="relative rounded-2xl overflow-hidden border border-zinc-800 bg-[#0c0c12] h-64 sm:h-72">
        <div ref={mapContainerRef} className="w-full h-full" style={{ zIndex: 1 }} />
        
        {/* Top Hint Badge */}
        <div className="absolute top-2.5 left-2.5 z-10 px-2.5 py-1 rounded-lg bg-black/80 backdrop-blur-md border border-zinc-800 text-[10px] font-semibold text-zinc-300 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
          <span>{mapEngine === 'google' ? 'Google Maps Draggable Pin' : 'Draggable Pin active'}</span>
        </div>

        {/* Google Maps Verification Action */}
        <div className="absolute top-2.5 right-2.5 z-10">
          <button
            type="button"
            onClick={() => openGoogleMapsLocation(lat, lng)}
            className="px-2.5 py-1 rounded-lg bg-black/80 backdrop-blur-md border border-zinc-800 text-[10px] font-bold text-amber-400 hover:text-white flex items-center gap-1 transition-colors"
            title="Verify location in Google Maps app"
          >
            <span>Verify in Google Maps</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Address Details Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
        <div>
          <label className="text-[11px] font-semibold text-zinc-400 block mb-1">Locality / Area Name *</label>
          <input
            type="text"
            required
            value={locality}
            onChange={(e) => setLocality(e.target.value)}
            placeholder="e.g. Koramangala 4th Block"
            className="w-full p-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-xs text-white"
          />
        </div>

        <div>
          <label className="text-[11px] font-semibold text-zinc-400 block mb-1">Postal PIN Code *</label>
          <input
            type="text"
            required
            value={pincode}
            onChange={(e) => setPincode(e.target.value)}
            placeholder="e.g. 560034"
            className="w-full p-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-xs text-white"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="text-[11px] font-semibold text-zinc-400 block mb-1">Building, Floor, Landmark *</label>
          <input
            type="text"
            required
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="e.g. #42, 2nd Floor, 80ft Road, Next to Sony Signal"
            className="w-full p-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-xs text-white"
          />
        </div>
      </div>

      {/* Confirmation & Status Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        <div className="text-xs text-zinc-400">
          <span className="font-semibold text-zinc-300">Selected GPS: </span>
          <span className="font-mono text-amber-400">{lat.toFixed(5)}, {lng.toFixed(5)}</span>
        </div>

        <button
          type="button"
          onClick={handleConfirmLocation}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-lg ${
            isConfirmed
              ? 'bg-emerald-500 text-black'
              : 'bg-amber-500 hover:bg-amber-400 text-black'
          }`}
        >
          {isConfirmed ? (
            <>
              <Check className="w-4 h-4" />
              <span>Location Verified & Confirmed</span>
            </>
          ) : (
            <>
              <MapPin className="w-4 h-4 fill-black" />
              <span>Confirm Salon Location</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
