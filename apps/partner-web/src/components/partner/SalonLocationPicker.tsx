import React, { useState, useEffect, useRef } from 'react';
import {
  MapPin,
  Navigation,
  Search,
  CheckCircle2,
  Crosshair,
  AlertCircle,
  Sparkles,
  Move,
  Compass,
  Check,
} from 'lucide-react';
import { loadGoogleMapsScript, KUMBHAKARAN_MAP_STYLES, isGoogleMapsLoaded } from '@kumbhakaran/ui';

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
  const [isGoogleMapsReady, setIsGoogleMapsReady] = useState(false);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const googleMapInstance = useRef<any>(null);
  const markerInstance = useRef<any>(null);

  // Popular Hub Presets for Quick Location in India
  const hubPresets = [
    { name: 'Koramangala 4th Block, Bengaluru', locality: 'Koramangala', city: 'Bengaluru', state: 'Karnataka', pincode: '560034', lat: 12.9344, lng: 77.6258 },
    { name: '100 Feet Road, Indiranagar, Bengaluru', locality: 'Indiranagar', city: 'Bengaluru', state: 'Karnataka', pincode: '560038', lat: 12.9719, lng: 77.6412 },
    { name: 'Sector 1, HSR Layout, Bengaluru', locality: 'HSR Layout', city: 'Bengaluru', state: 'Karnataka', pincode: '560102', lat: 12.9121, lng: 77.6446 },
    { name: 'Linking Road, Bandra West, Mumbai', locality: 'Bandra West', city: 'Mumbai', state: 'Maharashtra', pincode: '400050', lat: 19.0596, lng: 72.8295 },
    { name: 'Connaught Place, Central Delhi', locality: 'Connaught Place', city: 'New Delhi', state: 'Delhi', pincode: '110001', lat: 28.6315, lng: 77.2167 },
    { name: 'Jubilee Hills, Road No 36, Hyderabad', locality: 'Jubilee Hills', city: 'Hyderabad', state: 'Telangana', pincode: '500033', lat: 17.4319, lng: 78.4073 },
  ];

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

  // 2. Mount and Synchronize Google Map & Draggable Pin
  useEffect(() => {
    if (!isGoogleMapsReady || !mapContainerRef.current) return;
    const gmaps = (window as any).google?.maps;
    if (!gmaps) return;

    if (!googleMapInstance.current) {
      const map = new gmaps.Map(mapContainerRef.current, {
        center: { lat, lng },
        zoom: 16,
        styles: KUMBHAKARAN_MAP_STYLES,
        disableDefaultUI: true,
        gestureHandling: 'greedy',
      });

      const marker = new gmaps.Marker({
        position: { lat, lng },
        map,
        draggable: true,
        title: 'Drag to salon entrance',
        animation: gmaps.Animation.DROP,
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
          reverseGeocodeCoords(newLat, newLng);
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
          reverseGeocodeCoords(newLat, newLng);
        }
      });

      googleMapInstance.current = map;
      markerInstance.current = marker;

      // Initialize Places Autocomplete on input if available
      if (searchInputRef.current && gmaps.places?.Autocomplete) {
        const autocomplete = new gmaps.places.Autocomplete(searchInputRef.current, {
          types: ['establishment', 'geocode'],
          componentRestrictions: { country: 'in' },
        });

        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace();
          if (place && place.geometry?.location) {
            const placeLat = Number(place.geometry.location.lat().toFixed(6));
            const placeLng = Number(place.geometry.location.lng().toFixed(6));
            setLat(placeLat);
            setLng(placeLng);
            setManualLatStr(placeLat.toString());
            setManualLngStr(placeLng.toString());
            if (place.place_id) setPlaceId(place.place_id);
            if (place.formatted_address) setAddress(place.formatted_address);

            // Extract locality, city, state, postal code from address components
            if (place.address_components) {
              extractAddressComponents(place.address_components);
            }

            map.panTo(place.geometry.location);
            map.setZoom(17);
            marker.setPosition(place.geometry.location);
            setIsConfirmed(false);
          }
        });
      }
    } else {
      googleMapInstance.current.setCenter({ lat, lng });
      if (markerInstance.current) {
        markerInstance.current.setPosition({ lat, lng });
      }
    }
  }, [isGoogleMapsReady]);

  // Helper to extract address components from Google Places
  const extractAddressComponents = (components: any[]) => {
    let sublocality = '';
    let localityVal = '';
    let cityVal = '';
    let stateVal = '';
    let pinVal = '';

    for (const c of components) {
      if (c.types.includes('sublocality') || c.types.includes('sublocality_level_1')) {
        sublocality = c.long_name;
      }
      if (c.types.includes('locality')) {
        localityVal = c.long_name;
      }
      if (c.types.includes('administrative_area_level_2') || (!localityVal && c.types.includes('locality'))) {
        cityVal = c.long_name;
      }
      if (c.types.includes('administrative_area_level_1')) {
        stateVal = c.long_name;
      }
      if (c.types.includes('postal_code')) {
        pinVal = c.long_name;
      }
    }

    if (sublocality) setLocality(sublocality);
    else if (localityVal) setLocality(localityVal);
    if (cityVal || localityVal) setCity(cityVal || localityVal);
    if (stateVal) setState(stateVal);
    if (pinVal) setPincode(pinVal);
  };

  // Helper for reverse geocoding via Google Geocoder
  const reverseGeocodeCoords = (targetLat: number, targetLng: number) => {
    const gmaps = (window as any).google?.maps;
    if (!gmaps?.Geocoder) return;

    const geocoder = new gmaps.Geocoder();
    geocoder.geocode({ location: { lat: targetLat, lng: targetLng } }, (results: any[], status: string) => {
      if (status === 'OK' && results && results[0]) {
        const result = results[0];
        setAddress(result.formatted_address);
        if (result.place_id) setPlaceId(result.place_id);
        if (result.address_components) {
          extractAddressComponents(result.address_components);
        }
      }
    });
  };

  // Update map viewport to target lat/lng
  const updateMapPosition = (newLat: number, newLng: number) => {
    setLat(newLat);
    setLng(newLng);
    setManualLatStr(newLat.toString());
    setManualLngStr(newLng.toString());
    setIsConfirmed(false);

    if (googleMapInstance.current) {
      googleMapInstance.current.panTo({ lat: newLat, lng: newLng });
      if (markerInstance.current) {
        markerInstance.current.setPosition({ lat: newLat, lng: newLng });
      }
    }
  };

  // OPTION 1: Select Preset Hub or Address
  const handleSelectPreset = (hub: typeof hubPresets[0]) => {
    setLocality(hub.locality);
    setCity(hub.city);
    setState(hub.state);
    setPincode(hub.pincode);
    setAddress(hub.name);
    setSearchQuery(hub.name);
    updateMapPosition(hub.lat, hub.lng);
  };

  // OPTION 2: Acquire Device GPS
  const handleUseCurrentLocation = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setIsGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsGpsLoading(false);
        const curLat = Number(pos.coords.latitude.toFixed(6));
        const curLng = Number(pos.coords.longitude.toFixed(6));
        updateMapPosition(curLat, curLng);
        reverseGeocodeCoords(curLat, curLng);
      },
      (err) => {
        setIsGpsLoading(false);
        alert(`Location permission denied or timeout: ${err.message}. Please use search or enter coordinates.`);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  // OPTION 4: Validate and Apply Coordinates Manually
  const handleApplyManualCoords = (e: React.FormEvent) => {
    e.preventDefault();
    setCoordsError(null);
    const parsedLat = parseFloat(manualLatStr);
    const parsedLng = parseFloat(manualLngStr);

    if (isNaN(parsedLat) || parsedLat < -90 || parsedLat > 90) {
      setCoordsError('Latitude must be a valid number between -90 and +90.');
      return;
    }
    if (isNaN(parsedLng) || parsedLng < -180 || parsedLng > 180) {
      setCoordsError('Longitude must be a valid number between -180 and +180.');
      return;
    }

    updateMapPosition(parsedLat, parsedLng);
    reverseGeocodeCoords(parsedLat, parsedLng);
  };

  // Final Confirmation Action
  const handleConfirmLocation = () => {
    const finalData: LocationPickerResult = {
      address: address.trim() || `${locality}, ${city}, ${state} - ${pincode}`,
      locality: locality.trim(),
      city: city.trim(),
      state: state.trim(),
      pincode: pincode.trim(),
      latitude: lat,
      longitude: lng,
      placeId,
    };
    setIsConfirmed(true);
    onLocationConfirmed(finalData);
  };

  return (
    <div className="space-y-4 rounded-3xl bg-[#0f0f15] border border-zinc-800 p-4 sm:p-5 shadow-2xl">
      {/* Tab Selector for 4 Location Options */}
      <div className="flex flex-wrap items-center gap-1.5 p-1 bg-black/60 border border-zinc-800/80 rounded-2xl text-xs font-bold">
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
          <Navigation className={`w-3.5 h-3.5 ${isGpsLoading ? 'animate-spin' : ''}`} />
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
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Enter salon name, street, locality or Google Place..."
              className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-zinc-700/80 rounded-2xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400 shadow-inner"
            />
          </div>

          <div>
            <div className="text-[10px] uppercase font-bold text-zinc-400 mb-1.5">Quick Location Presets</div>
            <div className="flex flex-wrap gap-1.5">
              {hubPresets.map((hub) => (
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
              {isGpsLoading ? 'Acquiring high-accuracy GPS coordinates...' : 'Device GPS position locked.'}
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
          <span>Click anywhere on the map or drag the amber pin to place it exactly at your salon door.</span>
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

      {/* Interactive Google Map Preview Container */}
      <div className="relative w-full h-56 sm:h-72 rounded-2xl overflow-hidden border border-zinc-800 bg-[#0c0c11]">
        <div ref={mapContainerRef} className="w-full h-full" />

        {!isGoogleMapsReady && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center bg-[#0d0d14]/90 backdrop-blur-sm z-10">
            <Compass className="w-8 h-8 text-amber-400 mb-2" />
            <h5 className="text-xs font-bold text-white">Interactive Spatial Coordinates Active</h5>
            <p className="text-[11px] text-zinc-400 max-w-xs mt-1">
              Lat: <code className="text-amber-300">{lat}</code> • Lng: <code className="text-amber-300">{lng}</code>
            </p>
          </div>
        )}

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
