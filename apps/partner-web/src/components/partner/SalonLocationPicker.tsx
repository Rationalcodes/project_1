import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  MapPin,
  Navigation,
  Search,
  CheckCircle2,
  ExternalLink,
  Loader2,
  Building2,
  Compass,
  Store,
} from 'lucide-react';
import {
  loadLeafletScript,
  loadGoogleMapsScript,
  isGoogleMapsLoaded,
  loadMapboxScript,
  hasValidMapboxToken,
  getMapboxToken,
  MAPBOX_DARK_STYLE,
  KUMBHAKARAN_MAP_STYLES,
  openGoogleMapsLocation,
} from '@kumbhakaran/ui';

export interface LocationPickerResult {
  address: string; // The landmark / street address (e.g. "Near Koni Chowk, Opp. Engineering College Gate")
  locality: string;
  city: string;
  state: string;
  pincode: string;
  latitude: number;
  longitude: number;
  placeId?: string;
  buildingOrShop?: string;
}

interface SalonLocationPickerProps {
  value?: Partial<LocationPickerResult>;
  initialResult?: Partial<LocationPickerResult>;
  onChange?: (result: LocationPickerResult) => void;
  onLocationConfirmed?: (result: LocationPickerResult) => void;
}

// Quick Landmark Direction Chips popular in Indian shop navigation
const LANDMARK_PREFIX_CHIPS = [
  'Near',
  'Opposite (Opp.)',
  'Beside',
  'Behind',
  'Next to',
  'Left side of',
  'Right side of',
  'At Chowk',
];

export const SalonLocationPicker: React.FC<SalonLocationPickerProps> = ({
  value,
  initialResult,
  onChange,
  onLocationConfirmed,
}) => {
  const currentVal = value || initialResult;

  const [address, setAddress] = useState(currentVal?.address || '');
  const [locality, setLocality] = useState(currentVal?.locality || '');
  const [city, setCity] = useState(currentVal?.city || '');
  const [state, setState] = useState(currentVal?.state || '');
  const [pincode, setPincode] = useState(currentVal?.pincode || '');
  const [buildingOrShop, setBuildingOrShop] = useState(currentVal?.buildingOrShop || '');

  // Coordinates: dynamic with zero hardcoding
  const [lat, setLat] = useState<number>(currentVal?.latitude || 0);
  const [lng, setLng] = useState<number>(currentVal?.longitude || 0);
  const [placeId, setPlaceId] = useState<string | undefined>(currentVal?.placeId);

  // Status & Geolocation States
  const [isGpsLoading, setIsGpsLoading] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [nearbyLandmarks, setNearbyLandmarks] = useState<string[]>([]);
  const [gpsActive, setGpsActive] = useState(false);

  // Search autocomplete state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef<any>(null);

  // Map Engine state
  const [mapEngine, setMapEngine] = useState<'mapbox' | 'google' | 'leaflet'>('mapbox');
  const [isMapboxReady, setIsMapboxReady] = useState(false);
  const [isGoogleReady, setIsGoogleReady] = useState(false);
  const [isLeafletReady, setIsLeafletReady] = useState(false);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapboxMapRef = useRef<any>(null);
  const mapboxMarkerRef = useRef<any>(null);
  const googleMapRef = useRef<any>(null);
  const googleMarkerRef = useRef<any>(null);
  const leafletMapRef = useRef<any>(null);
  const leafletMarkerRef = useRef<any>(null);

  // Helper to sync back to parent
  const syncToParent = useCallback(
    (overrides: Partial<LocationPickerResult> = {}) => {
      const targetLat = overrides.latitude !== undefined ? overrides.latitude : lat;
      const targetLng = overrides.longitude !== undefined ? overrides.longitude : lng;

      const result: LocationPickerResult = {
        address: overrides.address !== undefined ? overrides.address : address,
        locality: overrides.locality !== undefined ? overrides.locality : locality,
        city: overrides.city !== undefined ? overrides.city : city,
        state: overrides.state !== undefined ? overrides.state : state,
        pincode: overrides.pincode !== undefined ? overrides.pincode : pincode,
        latitude: targetLat,
        longitude: targetLng,
        placeId: overrides.placeId !== undefined ? overrides.placeId : placeId,
        buildingOrShop: overrides.buildingOrShop !== undefined ? overrides.buildingOrShop : buildingOrShop,
      };

      if (onChange) onChange(result);
      if (onLocationConfirmed) onLocationConfirmed(result);
    },
    [address, locality, city, state, pincode, lat, lng, placeId, buildingOrShop, onChange, onLocationConfirmed]
  );

  // Dynamic Reverse Geocode & Famous Landmark Detection (Zero Hardcoding)
  const reverseGeocode = useCallback(
    async (targetLat: number, targetLng: number) => {
      if (!targetLat || !targetLng) return;
      setIsGeocoding(true);

      let detectedCity = '';
      let detectedState = '';
      let detectedPincode = '';
      let detectedLocality = '';
      let detectedRoad = '';
      let detectedAmenity = '';
      let wikiLandmarks: string[] = [];

      // 1. Nominatim Reverse Geocoding
      try {
        const nomRes = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${targetLat}&lon=${targetLng}&addressdetails=1`,
          { headers: { 'User-Agent': 'KumbhakaranPartnerApp/1.0' } }
        );

        if (nomRes.ok) {
          const data = await nomRes.json();
          const addr = data.address || {};

          detectedCity = addr.city || addr.town || addr.district || addr.county || '';
          detectedState = addr.state || '';
          detectedPincode = addr.postcode || '';
          detectedLocality =
            addr.suburb ||
            addr.neighbourhood ||
            addr.village ||
            addr.hamlet ||
            addr.county ||
            detectedCity ||
            '';
          detectedRoad = addr.road || addr.street || '';
          detectedAmenity = addr.amenity || addr.shop || addr.building || addr.college || addr.university || '';
        }
      } catch (err) {
        console.warn('Nominatim reverse geocode error:', err);
      }

      // 2. Wikipedia Nearby Geosearch for Famous Local Landmarks & Institutions
      try {
        const wikiUrl = `https://en.wikipedia.org/w/api.php?action=query&list=geosearch&gscoord=${targetLat}|${targetLng}&gsradius=5000&gslimit=5&format=json&origin=*`;
        const wikiRes = await fetch(wikiUrl);
        if (wikiRes.ok) {
          const wikiData = await wikiRes.json();
          if (wikiData.query?.geosearch) {
            wikiLandmarks = wikiData.query.geosearch
              .map((item: any) => item.title)
              .filter(
                (title: string) =>
                  !title.toLowerCase().includes('constituency') &&
                  !title.toLowerCase().includes('division')
              );
          }
        }
      } catch (wikiErr) {
        console.warn('Wiki geosearch error:', wikiErr);
      }

      // 3. Fallback to BigDataCloud if Nominatim had empty locality
      if (!detectedCity && !detectedLocality) {
        try {
          const bdcRes = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${targetLat}&longitude=${targetLng}&localityLanguage=en`
          );
          if (bdcRes.ok) {
            const bdc = await bdcRes.json();
            detectedCity = bdc.city || bdc.locality || '';
            detectedLocality = bdc.locality || bdc.city || '';
            detectedState = bdc.principalSubdivision || '';
            detectedPincode = bdc.postcode || '';
          }
        } catch (bdcErr) {
          console.warn('BigDataCloud error:', bdcErr);
        }
      }

      // Combine nearby landmark candidates
      const candidates: string[] = [];
      if (detectedAmenity) candidates.push(detectedAmenity);
      if (detectedRoad) candidates.push(detectedRoad);
      for (const lm of wikiLandmarks) {
        if (!candidates.includes(lm)) candidates.push(lm);
      }

      setNearbyLandmarks(candidates);
      if (detectedLocality) setLocality(detectedLocality);
      if (detectedCity) setCity(detectedCity);
      if (detectedState) setState(detectedState);
      if (detectedPincode) setPincode(detectedPincode);

      // Auto-suggest landmark in address field if currently empty
      let updatedAddress = address;
      if (!updatedAddress.trim() && candidates.length > 0) {
        updatedAddress = `Near ${candidates[0]}`;
        setAddress(updatedAddress);
      }

      syncToParent({
        latitude: targetLat,
        longitude: targetLng,
        locality: detectedLocality,
        city: detectedCity,
        state: detectedState,
        pincode: detectedPincode,
        address: updatedAddress,
      });

      setIsGeocoding(false);
    },
    [address, syncToParent]
  );

  // Initialize Map Engines (Mapbox GL prioritized when token configured, else Google or Leaflet)
  useEffect(() => {
    let isMounted = true;

    if (hasValidMapboxToken()) {
      loadMapboxScript().then((mLoaded) => {
        if (!isMounted) return;
        if (mLoaded || Boolean((window as any).mapboxgl)) {
          setIsMapboxReady(true);
          setMapEngine('mapbox');
          return;
        }
        initFallback();
      });
    } else {
      initFallback();
    }

    function initFallback() {
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
    }

    return () => {
      isMounted = false;
    };
  }, []);

  // Update Map Position Helper
  const updateMapPosition = useCallback(
    (newLat: number, newLng: number, triggerReverseGeocode = true) => {
      setLat(newLat);
      setLng(newLng);

      if (mapEngine === 'mapbox' && mapboxMapRef.current && mapboxMarkerRef.current) {
        mapboxMapRef.current.flyTo({ center: [newLng, newLat], zoom: 16 });
        mapboxMarkerRef.current.setLngLat([newLng, newLat]);
      } else if (mapEngine === 'google' && googleMapRef.current && googleMarkerRef.current) {
        googleMapRef.current.panTo({ lat: newLat, lng: newLng });
        googleMarkerRef.current.setPosition({ lat: newLat, lng: newLng });
      } else if (mapEngine === 'leaflet' && leafletMapRef.current && leafletMarkerRef.current) {
        leafletMapRef.current.setView([newLat, newLng], 16);
        leafletMarkerRef.current.setLatLng([newLat, newLng]);
      }

      if (triggerReverseGeocode) {
        reverseGeocode(newLat, newLng);
      }
    },
    [mapEngine, reverseGeocode]
  );

  // Dynamic Device Location Auto-Detection on Mount (Zero Hardcoding)
  useEffect(() => {
    // 1. If coordinates already supplied by prop, use them
    if (currentVal?.latitude && currentVal?.longitude) {
      updateMapPosition(currentVal.latitude, currentVal.longitude, !currentVal.locality);
      return;
    }

    // 2. Query browser device GPS
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      setIsGpsLoading(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setIsGpsLoading(false);
          setGpsActive(true);
          const userLat = Number(pos.coords.latitude.toFixed(6));
          const userLng = Number(pos.coords.longitude.toFixed(6));
          updateMapPosition(userLat, userLng, true);
        },
        () => {
          // 3. Fallback to dynamic IP location detection (never hardcoded)
          fetch('https://ipwho.is/')
            .then((r) => r.json())
            .then((d) => {
              setIsGpsLoading(false);
              if (d && d.success && d.latitude && d.longitude) {
                const ipLat = Number(d.latitude.toFixed(6));
                const ipLng = Number(d.longitude.toFixed(6));
                updateMapPosition(ipLat, ipLng, true);
              }
            })
            .catch(() => setIsGpsLoading(false));
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else {
      // Dynamic IP location detection
      fetch('https://ipwho.is/')
        .then((r) => r.json())
        .then((d) => {
          if (d && d.success && d.latitude && d.longitude) {
            updateMapPosition(Number(d.latitude.toFixed(6)), Number(d.longitude.toFixed(6)), true);
          }
        })
        .catch(() => {});
    }
  }, []);

  // 1-Click Detect Live GPS Location
  const handleUseCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setIsGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsGpsLoading(false);
        setGpsActive(true);
        const userLat = Number(pos.coords.latitude.toFixed(6));
        const userLng = Number(pos.coords.longitude.toFixed(6));
        updateMapPosition(userLat, userLng, true);
      },
      (err) => {
        setIsGpsLoading(false);
        alert(`Could not retrieve your location: ${err.message}. You can search your area or click on the map.`);
      },
      { enableHighAccuracy: true, timeout: 12000 }
    );
  }, [updateMapPosition]);

  // Mount Mapbox GL Map
  useEffect(() => {
    if (mapEngine !== 'mapbox' || !isMapboxReady || !mapContainerRef.current) return;
    const mapboxgl = (window as any).mapboxgl;
    if (!mapboxgl) return;

    try {
      mapboxgl.accessToken = getMapboxToken();

      const initialCenter = lat && lng ? [lng, lat] : [78.9629, 20.5937]; // Center of India view until GPS arrives

      if (!mapboxMapRef.current) {
        const map = new mapboxgl.Map({
          container: mapContainerRef.current,
          style: MAPBOX_DARK_STYLE,
          center: initialCenter,
          zoom: lat && lng ? 16 : 5,
          pitch: 20,
          attributionControl: false,
        });

        const marker = new mapboxgl.Marker({
          draggable: true,
          color: '#f59e0b',
        })
          .setLngLat(initialCenter)
          .addTo(map);

        marker.on('dragend', () => {
          const pos = marker.getLngLat();
          if (pos) {
            const newLat = Number(pos.lat.toFixed(6));
            const newLng = Number(pos.lng.toFixed(6));
            updateMapPosition(newLat, newLng, true);
          }
        });

        map.on('click', (e: any) => {
          if (e.lngLat) {
            const newLat = Number(e.lngLat.lat.toFixed(6));
            const newLng = Number(e.lngLat.lng.toFixed(6));
            marker.setLngLat(e.lngLat);
            updateMapPosition(newLat, newLng, true);
          }
        });

        mapboxMapRef.current = map;
        mapboxMarkerRef.current = marker;
      } else if (lat && lng) {
        mapboxMapRef.current.flyTo({ center: [lng, lat], zoom: 16 });
        if (mapboxMarkerRef.current) {
          mapboxMarkerRef.current.setLngLat([lng, lat]);
        }
      }
    } catch (e) {
      console.warn('Mapbox mount fallback to Leaflet:', e);
      setMapEngine('leaflet');
    }

    return () => {
      if (mapboxMapRef.current) {
        mapboxMapRef.current.remove();
        mapboxMapRef.current = null;
        mapboxMarkerRef.current = null;
      }
    };
  }, [mapEngine, isMapboxReady, updateMapPosition]);

  // Mount Google Maps
  useEffect(() => {
    if (mapEngine !== 'google' || !isGoogleReady || !mapContainerRef.current) return;
    const gmaps = (window as any).google?.maps;
    if (!gmaps) return;

    const initialCenter = lat && lng ? { lat, lng } : { lat: 20.5937, lng: 78.9629 };

    if (!googleMapRef.current) {
      const map = new gmaps.Map(mapContainerRef.current, {
        center: initialCenter,
        zoom: lat && lng ? 16 : 5,
        styles: KUMBHAKARAN_MAP_STYLES,
        disableDefaultUI: true,
        gestureHandling: 'greedy',
        zoomControl: false,
      });

      const marker = new gmaps.Marker({
        position: initialCenter,
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
          updateMapPosition(newLat, newLng, true);
        }
      });

      map.addListener('click', (e: any) => {
        if (e.latLng) {
          const newLat = Number(e.latLng.lat().toFixed(6));
          const newLng = Number(e.latLng.lng().toFixed(6));
          marker.setPosition(e.latLng);
          updateMapPosition(newLat, newLng, true);
        }
      });

      googleMapRef.current = map;
      googleMarkerRef.current = marker;
    } else if (lat && lng) {
      googleMapRef.current.setCenter({ lat, lng });
      if (googleMarkerRef.current) {
        googleMarkerRef.current.setPosition({ lat, lng });
      }
    }
  }, [mapEngine, isGoogleReady, updateMapPosition]);

  // Mount Leaflet
  useEffect(() => {
    if (mapEngine !== 'leaflet' || !isLeafletReady || !mapContainerRef.current) return;
    const L = (window as any).L;
    if (!L) return;

    const initialCenter: [number, number] = lat && lng ? [lat, lng] : [20.5937, 78.9629];

    if (!leafletMapRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: initialCenter,
        zoom: lat && lng ? 16 : 5,
        zoomControl: false,
        attributionControl: false,
      });

      const mapboxToken = (import.meta as any).env?.VITE_MAPBOX_ACCESS_TOKEN;
      if (mapboxToken && typeof mapboxToken === 'string' && mapboxToken.startsWith('pk.') && !mapboxToken.includes('dummy')) {
        L.tileLayer(`https://api.mapbox.com/styles/v1/mapbox/dark-v11/tiles/{z}/{x}/{y}?access_token=${mapboxToken}`, {
          maxZoom: 19,
          tileSize: 512,
          zoomOffset: -1,
          attribution: '&copy; Mapbox',
        }).addTo(map);
      } else {
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          subdomains: ['a', 'b', 'c'],
          className: 'osm-dark-tiles',
        }).addTo(map);
      }

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

      const marker = L.marker(initialCenter, {
        icon: markerIcon,
        draggable: true,
        title: 'Drag to salon entrance',
      }).addTo(map);

      marker.on('dragend', () => {
        const pos = marker.getLatLng();
        if (pos) {
          const newLat = Number(pos.lat.toFixed(6));
          const newLng = Number(pos.lng.toFixed(6));
          updateMapPosition(newLat, newLng, true);
        }
      });

      map.on('click', (e: any) => {
        if (e.latlng) {
          const newLat = Number(e.latlng.lat.toFixed(6));
          const newLng = Number(e.latlng.lng.toFixed(6));
          marker.setLatLng(e.latlng);
          updateMapPosition(newLat, newLng, true);
        }
      });

      leafletMapRef.current = map;
      leafletMarkerRef.current = marker;
    } else if (lat && lng) {
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
  }, [mapEngine, isLeafletReady, updateMapPosition]);

  // Live Location / Colony / Landmark Search
  const handleSearchInput = (query: string) => {
    setSearchQuery(query);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (query.trim().length < 3) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(
            query.trim()
          )}&countrycodes=in&limit=5&addressdetails=1`,
          { headers: { 'User-Agent': 'KumbhakaranPartnerApp/1.0' } }
        );
        if (res.ok) {
          const items = await res.json();
          setSearchResults(
            items.map((it: any) => {
              const a = it.address || {};
              const short = it.name || a.road || a.suburb || a.village || a.city || query;
              return {
                shortName: short,
                displayName: it.display_name,
                lat: parseFloat(it.lat),
                lng: parseFloat(it.lon),
                locality: a.suburb || a.neighbourhood || a.village || a.county || a.city || '',
                city: a.city || a.town || a.county || '',
                state: a.state || '',
                pincode: a.postcode || '',
              };
            })
          );
        }
      } catch (err) {
        console.warn('Search query error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 400);
  };

  const handleSelectSearchResult = (result: any) => {
    setSearchQuery(result.shortName);
    setSearchResults([]);
    updateMapPosition(result.lat, result.lng, true);
  };

  // Add Landmark Direction Prefix chip into the landmark text field
  const handleAddPrefixChip = (prefix: string) => {
    let cleanPrefix = prefix.replace(/\s*\([^)]*\)/, ''); // Remove (Opp.) helper
    if (!address.toLowerCase().startsWith(cleanPrefix.toLowerCase())) {
      const newAddress = address.trim()
        ? `${cleanPrefix} ${address.trim()}`
        : `${cleanPrefix} `;
      setAddress(newAddress);
      syncToParent({ address: newAddress });
    }
  };

  // Set Landmark from dynamically detected nearby places
  const handleSelectLandmarkChip = (landmarkName: string) => {
    const newAddress = `Near ${landmarkName}`;
    setAddress(newAddress);
    syncToParent({ address: newAddress });
  };

  return (
    <div className="space-y-3.5">
      {/* TOP CONTROLS: 1-Click Current GPS + Fast Colony / Area Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <button
          type="button"
          onClick={handleUseCurrentLocation}
          disabled={isGpsLoading}
          className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all shrink-0 active:scale-[0.98]"
          title="Detect live GPS coordinates of your salon device"
        >
          {isGpsLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Navigation className="w-4 h-4 fill-black" />
          )}
          <span>{isGpsLoading ? 'Fetching GPS Location...' : 'Use Current GPS'}</span>
        </button>

        {/* Search locality, colony or chowk */}
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-3 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchInput(e.target.value)}
            placeholder="Search colony, chowk, landmark, or PIN..."
            className="w-full pl-9 pr-8 py-2.5 bg-zinc-900 border border-zinc-700/80 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400 shadow-inner"
          />
          {isSearching && (
            <Loader2 className="w-3.5 h-3.5 text-amber-400 animate-spin absolute right-3 top-3" />
          )}

          {/* Autocomplete dropdown */}
          {searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-zinc-900/98 backdrop-blur-md border border-zinc-700 rounded-xl shadow-2xl p-1 z-50 max-h-56 overflow-y-auto">
              {searchResults.map((res, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSelectSearchResult(res)}
                  className="w-full text-left p-2 rounded-lg hover:bg-zinc-800 text-xs text-zinc-300 transition-colors flex items-start gap-2 border-b border-zinc-800/60 last:border-0"
                >
                  <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <div className="font-bold text-white truncate">{res.shortName}</div>
                    <div className="text-[10px] text-zinc-400 truncate">{res.displayName}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Interactive Map with Drag-To-Entrance Pin */}
      <div className="relative rounded-2xl overflow-hidden border border-zinc-800 bg-[#0c0c12] h-60 sm:h-72 shadow-xl">
        <style>{`
          .osm-dark-tiles {
            filter: invert(100%) hue-rotate(180deg) brightness(92%) contrast(90%) !important;
          }
          .leaflet-container {
            background-color: #0b0f17 !important;
          }
        `}</style>
        <div ref={mapContainerRef} className="w-full h-full" style={{ zIndex: 1 }} />

        {/* Live GPS Coordinates and Status Badge */}
        <div className="absolute top-2.5 left-2.5 z-10 px-2.5 py-1.5 rounded-xl bg-black/85 backdrop-blur-md border border-zinc-800 text-[10px] font-semibold text-zinc-300 flex items-center gap-2 shadow-lg">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0"></span>
          <span className="font-mono text-amber-300 font-bold">
            {lat && lng ? `${lat.toFixed(5)}, ${lng.toFixed(5)}` : 'Waiting for GPS...'}
          </span>
          {isGeocoding && (
            <span className="text-[10px] text-amber-400 flex items-center gap-1 border-l border-zinc-700 pl-2">
              <Loader2 className="w-3 h-3 animate-spin" /> Detecting address & landmarks...
            </span>
          )}
        </div>

        {/* Google Maps Verification Action */}
        {lat && lng ? (
          <div className="absolute top-2.5 right-2.5 z-10">
            <button
              type="button"
              onClick={() => openGoogleMapsLocation(lat, lng)}
              className="px-2.5 py-1.5 rounded-xl bg-black/85 backdrop-blur-md border border-zinc-800 text-[10px] font-bold text-amber-400 hover:text-white flex items-center gap-1.5 transition-colors shadow-lg"
              title="Verify location marker in official Google Maps"
            >
              <span>Verify in Google Maps</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        ) : null}

        {/* Draggable hint pill at bottom of map */}
        <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 z-10 px-3 py-1 rounded-full bg-black/80 backdrop-blur-md border border-zinc-800 text-[10px] text-zinc-300 flex items-center gap-1.5 pointer-events-none shadow-md whitespace-nowrap">
          <Compass className="w-3 h-3 text-amber-400" />
          <span>Click anywhere or drag marker to pinpoint salon entrance</span>
        </div>
      </div>

      {/* DYNAMIC INDIAN SHOP ADDRESS & LANDMARK DETAILS */}
      <div className="bg-[#14141c] border border-zinc-800 rounded-2xl p-4 space-y-3.5 shadow-lg">
        {/* SECTION 1: FAMOUS LANDMARK / CHOWK / NEARBY DUKAN */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-bold text-white flex items-center gap-1.5">
              <span>Famous Landmark, Nearby Dukan or Chowk *</span>
              <span className="text-[10px] bg-amber-500/20 text-amber-300 font-semibold px-2 py-0.2 rounded-full border border-amber-500/30">
                Key for customers
              </span>
            </label>
          </div>
          <p className="text-[11px] text-zinc-400 mb-2">
            How customers & delivery riders find your salon (e.g. Near Koni Chowk, Opp. Engineering College Gate, Beside Verma Medical).
          </p>

          {/* Quick-Add Landmark Direction Chips */}
          <div className="flex flex-wrap items-center gap-1.5 mb-2">
            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mr-1">
              Add Direction:
            </span>
            {LANDMARK_PREFIX_CHIPS.map((chip, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleAddPrefixChip(chip)}
                className="px-2 py-0.5 rounded-lg bg-zinc-900 hover:bg-amber-500/15 border border-zinc-700/80 hover:border-amber-400/50 text-[11px] text-zinc-300 hover:text-amber-300 font-medium transition-all"
              >
                + {chip}
              </button>
            ))}
          </div>

          {/* Dynamically Detected Famous Nearby Landmarks & Chowks */}
          {nearbyLandmarks.length > 0 && (
            <div className="mb-2.5 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-1.5">
              <div className="text-[10px] text-amber-400 uppercase font-bold tracking-wider flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-amber-400" />
                <span>Detected Famous Nearby Landmarks & Spots (Click to set):</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {nearbyLandmarks.map((lm, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectLandmarkChip(lm)}
                    className="px-2.5 py-1 rounded-lg bg-zinc-900/90 hover:bg-amber-500 hover:text-black border border-amber-500/30 text-[11px] text-zinc-200 font-medium transition-all flex items-center gap-1 shadow-sm"
                  >
                    <Store className="w-3 h-3 text-amber-400" />
                    <span>Near {lm}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <input
            type="text"
            required
            value={address}
            onChange={(e) => {
              setAddress(e.target.value);
              syncToParent({ address: e.target.value });
            }}
            placeholder="e.g. Near Koni Chowk, Opp. Engineering College Gate, Beside Verma Medical"
            className="w-full p-2.5 bg-zinc-900 border border-zinc-700/90 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400"
          />
        </div>

        {/* SECTION 2: SHOP NO. / BUILDING (OPTIONAL) */}
        <div>
          <label className="text-xs font-semibold text-zinc-300 block mb-1">
            Shop No., Building or Floor <span className="text-zinc-500 font-normal">(Optional)</span>
          </label>
          <input
            type="text"
            value={buildingOrShop}
            onChange={(e) => {
              setBuildingOrShop(e.target.value);
              syncToParent({ buildingOrShop: e.target.value });
            }}
            placeholder="e.g. Shop #4, Ground Floor, Sai Plaza"
            className="w-full p-2.5 bg-zinc-900 border border-zinc-700/80 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400"
          />
        </div>

        {/* SECTION 3: LOCALITY, CITY, STATE & PIN CODE (AUTO-DETECTED FROM GPS) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-zinc-800/80">
          <div>
            <label className="text-xs font-semibold text-zinc-300 block mb-1 flex items-center justify-between">
              <span>Locality / Colony / Neighborhood *</span>
              {locality && (
                <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-normal">
                  <CheckCircle2 className="w-3 h-3" /> Auto-detected
                </span>
              )}
            </label>
            <input
              type="text"
              required
              value={locality}
              onChange={(e) => {
                setLocality(e.target.value);
                syncToParent({ locality: e.target.value });
              }}
              placeholder="Locality (e.g. Koni / Civil Lines)"
              className="w-full p-2.5 bg-zinc-900 border border-zinc-700/80 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-300 block mb-1">
              Postal PIN Code *
            </label>
            <input
              type="text"
              required
              value={pincode}
              onChange={(e) => {
                setPincode(e.target.value);
                syncToParent({ pincode: e.target.value });
              }}
              placeholder="e.g. 495004"
              className="w-full p-2.5 bg-zinc-900 border border-zinc-700/80 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="text-xs font-semibold text-zinc-300 block mb-1">
              City & State *
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                required
                value={city}
                onChange={(e) => {
                  setCity(e.target.value);
                  syncToParent({ city: e.target.value });
                }}
                placeholder="City (e.g. Bilaspur)"
                className="w-full p-2.5 bg-zinc-900 border border-zinc-700/80 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400"
              />
              <input
                type="text"
                required
                value={state}
                onChange={(e) => {
                  setState(e.target.value);
                  syncToParent({ state: e.target.value });
                }}
                placeholder="State (e.g. Chhattisgarh)"
                className="w-full p-2.5 bg-zinc-900 border border-zinc-700/80 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
