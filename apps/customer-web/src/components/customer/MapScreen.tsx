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
  Store,
  SlidersHorizontal,
  Check,
  RotateCcw,
} from 'lucide-react';
import {
  useCustomer,
  getEstimatedWaitMinutes,
  matchesGenderFilter,
} from '../../context/CustomerContext';
import { Salon } from '@kumbhakaran/shared-types';
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
    genderFilter,
  } = useCustomer();

  const isWomen = genderFilter === 'women';
  const primaryHex = isWomen ? '#E11D48' : '#FF6422';
  const primaryHoverHex = isWomen ? '#BE123C' : '#E55215';

  const [selectedMarkerSalon, setSelectedMarkerSalon] = useState<Salon | null>(salons[0] || null);
  const [mapSearch, setMapSearch] = useState('');
  const [customDistanceInput, setCustomDistanceInput] = useState<string>('10');
  const [radiusKm, setRadiusKm] = useState<number>(10);
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);
  const [maxPriceFilter, setMaxPriceFilter] = useState<number>(1500);
  const [minRatingFilter, setMinRatingFilter] = useState<number>(0);
  const [onlyOpenFilter, setOnlyOpenFilter] = useState<boolean>(false);
  const [onlyVerifiedFilter, setOnlyVerifiedFilter] = useState<boolean>(false);
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
  const googlePolylineRef = useRef<any>(null);
  const googleMidpointMarkerRef = useRef<any>(null);

  // Leaflet references
  const leafletMapRef = useRef<any>(null);
  const leafletMarkersLayerRef = useRef<any>(null);
  const hasInitialFittedRef = useRef<boolean>(false);

  // Dynamic distance computation with independent Haversine formula & Filters
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
      if (!matchesGenderFilter(s, genderFilter)) return false;
      if (userLocation && s.computedDistance > radiusKm) return false;
      if (onlyOpenFilter && s.isOpen === false) return false;
      if (onlyVerifiedFilter && !s.isVerified) return false;
      if (minRatingFilter > 0 && (s.rating || 0) < minRatingFilter) return false;
      if (maxPriceFilter < 1500 && (s.startingPrice || 150) > maxPriceFilter) return false;

      if (mapSearch.trim()) {
        const q = mapSearch.toLowerCase();
        return (
          s.name.toLowerCase().includes(q) ||
          s.locality.toLowerCase().includes(q) ||
          s.city.toLowerCase().includes(q) ||
          s.pincode.includes(q)
        );
      }
      return true;
    })
    .sort((a, b) => a.computedDistance - b.computedDistance);

  // Auto-detect location on map mount & select nearest studio
  useEffect(() => {
    if (!userLocation) {
      requestDeviceLocation();
    }
  }, []);

  useEffect(() => {
    if (!selectedMarkerSalon && visibleSalons.length > 0) {
      setSelectedMarkerSalon(visibleSalons[0]);
    }
  }, [visibleSalons, selectedMarkerSalon]);


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
    }
  }, [mapEngine, isGoogleLoaded, mapLayerType, currentCoords.lat, currentCoords.lng]);

  // 2B. Synchronize Google Markers
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
          fillColor: primaryHex,
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
          fillColor: isSelected ? primaryHex : salon.isOpen ? (isWomen ? '#E11D48' : '#EA4335') : '#9CA3AF',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 1.5,
          scale: isSelected ? 1.8 : 1.4,
          anchor: new gmaps.Point(12, 22),
        },
        label: {
          text: salon.name,
          color: '#1F1F1F',
          fontSize: '11px',
          fontWeight: '700',
          className: 'google-maps-label',
        },
        zIndex: isSelected ? 100 : 10,
      });

      marker.addListener('click', () => {
        setSelectedMarkerSalon(salon);
        if (userLocation && googleMapRef.current) {
          const bounds = new gmaps.LatLngBounds();
          bounds.extend({ lat: userLocation.lat, lng: userLocation.lng });
          bounds.extend({ lat: salon.coordinates.lat, lng: salon.coordinates.lng });
          googleMapRef.current.fitBounds(bounds, 50);
        } else {
          googleMapRef.current.panTo({
            lat: salon.coordinates.lat,
            lng: salon.coordinates.lng,
          });
        }
      });

      googleMarkersRef.current.push(marker);
    });

    // Distance route line from Customer Location -> Selected Shop Location
    if (googlePolylineRef.current) {
      googlePolylineRef.current.setMap(null);
      googlePolylineRef.current = null;
    }
    if (googleMidpointMarkerRef.current) {
      googleMidpointMarkerRef.current.setMap(null);
      googleMidpointMarkerRef.current = null;
    }

    if (userLocation && selectedMarkerSalon) {
      googlePolylineRef.current = new gmaps.Polyline({
        path: [
          { lat: userLocation.lat, lng: userLocation.lng },
          { lat: selectedMarkerSalon.coordinates.lat, lng: selectedMarkerSalon.coordinates.lng },
        ],
        geodesic: true,
        strokeColor: primaryHex,
        strokeOpacity: 0.9,
        strokeWeight: 4,
        map: googleMapRef.current,
      });

      const distKm = calculateHaversineDistance(
        userLocation.lat,
        userLocation.lng,
        selectedMarkerSalon.coordinates.lat,
        selectedMarkerSalon.coordinates.lng,
      );
      const distFormatted = distKm < 1 ? `${Math.round(distKm * 1000)} m` : `${distKm.toFixed(1)} km`;
      const midLat = (userLocation.lat + selectedMarkerSalon.coordinates.lat) / 2;
      const midLng = (userLocation.lng + selectedMarkerSalon.coordinates.lng) / 2;

      googleMidpointMarkerRef.current = new gmaps.Marker({
        position: { lat: midLat, lng: midLng },
        map: googleMapRef.current,
        label: {
          text: `● ${distFormatted}`,
          color: '#1F1F1F',
          fontSize: '11px',
          fontWeight: '800',
          className: 'google-maps-label',
        },
        icon: {
          path: gmaps.SymbolPath.CIRCLE,
          scale: 0,
        },
        zIndex: 500,
      });
    }
  }, [mapEngine, visibleSalons, selectedMarkerSalon, userLocation, genderFilter]);

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

  // 3B. Synchronize Leaflet Markers, Distance Line & Midpoint Badges
  useEffect(() => {
    if (mapEngine !== 'leaflet' || !leafletMapRef.current || !leafletMarkersLayerRef.current) return;
    const L = (window as any).L;
    if (!L) return;

    const layer = leafletMarkersLayerRef.current;
    layer.clearLayers();

    // 1. User Beacon (only if location is set)
    if (userLocation) {
      const userBeaconHtml = `
        <div style="position: relative; width: 26px; height: 26px;">
          <div style="position: absolute; inset: -5px; background: ${isWomen ? 'rgba(225, 29, 72, 0.28)' : 'rgba(255, 100, 34, 0.28)'}; border-radius: 9999px; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <div style="position: absolute; inset: 2px; background: ${primaryHex}; border: 2.5px solid #ffffff; border-radius: 9999px; box-shadow: 0 2px 10px ${isWomen ? 'rgba(225, 29, 72, 0.6)' : 'rgba(255,100,34,0.6)'};"></div>
          <div style="position: absolute; top: -18px; left: 50%; transform: translateX(-50%); background: #1F1F1F; color: #FFFFFF; font-size: 9px; font-weight: 800; padding: 1px 6px; border-radius: 6px; border: 1px solid #FFF; white-space: nowrap; pointer-events: none; box-shadow: 0 2px 5px rgba(0,0,0,0.25);">You</div>
        </div>
      `;
      const userIcon = L.divIcon({
        className: 'user-beacon-marker',
        html: userBeaconHtml,
        iconSize: [26, 26],
        iconAnchor: [13, 13],
      });
      L.marker([userLocation.lat, userLocation.lng], { icon: userIcon, title: 'Your Location', zIndexOffset: 900 }).addTo(layer);
    }

    // 2. Draw Distance Line connecting Customer Location -> Selected Shop Location
    if (userLocation && selectedMarkerSalon) {
      const startPoint: [number, number] = [userLocation.lat, userLocation.lng];
      const endPoint: [number, number] = [
        selectedMarkerSalon.coordinates.lat,
        selectedMarkerSalon.coordinates.lng,
      ];

      // White outline casing for crisp contrast on any map background
      L.polyline([startPoint, endPoint], {
        color: '#FFFFFF',
        weight: 6,
        opacity: 0.9,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(layer);

      // Main dashed animated polyline in primary brand color
      L.polyline([startPoint, endPoint], {
        color: primaryHex,
        weight: 3.5,
        opacity: 0.95,
        dashArray: '8, 8',
        lineCap: 'round',
        lineJoin: 'round',
        className: 'animated-route-line',
      }).addTo(layer);

      // Midpoint distance pill badge
      const distKm = calculateHaversineDistance(
        userLocation.lat,
        userLocation.lng,
        selectedMarkerSalon.coordinates.lat,
        selectedMarkerSalon.coordinates.lng,
      );
      const distFormatted = distKm < 1 ? `${Math.round(distKm * 1000)} m` : `${distKm.toFixed(1)} km`;
      const estMins = Math.max(1, Math.round(distKm * 3));
      const midLat = (userLocation.lat + selectedMarkerSalon.coordinates.lat) / 2;
      const midLng = (userLocation.lng + selectedMarkerSalon.coordinates.lng) / 2;

      const midpointHtml = `
        <div style="
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background: #18181B;
          color: #FFFFFF;
          padding: 3px 9px;
          border-radius: 9999px;
          border: 1.5px solid #FFFFFF;
          box-shadow: 0 4px 14px rgba(0,0,0,0.35);
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-size: 11px;
          font-weight: 800;
          white-space: nowrap;
          pointer-events: none;
          transform: translate(-50%, -50%);
        ">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="${primaryHex}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
            <line x1="5" y1="12" x2="19" y2="12"></line>
            <polyline points="12 5 19 12 12 19"></polyline>
          </svg>
          <span>${distFormatted}</span>
          <span style="color: #A1A1AA; font-size: 9px; font-weight: 600;">(~${estMins}m)</span>
        </div>
      `;

      const midpointIcon = L.divIcon({
        className: 'route-midpoint-badge',
        html: midpointHtml,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      });

      L.marker([midLat, midLng], {
        icon: midpointIcon,
        zIndexOffset: 700,
        interactive: false,
      }).addTo(layer);

      // Frame map view to fit both user and destination studio on initial load
      if (!hasInitialFittedRef.current && leafletMapRef.current) {
        hasInitialFittedRef.current = true;
        try {
          leafletMapRef.current.fitBounds([startPoint, endPoint], {
            padding: [60, 60],
            maxZoom: 16,
          });
        } catch {}
      }
    }

    // 3. Salon Markers - Authentic Google Maps Location Pin & Place Label
    visibleSalons.forEach((salon) => {
      const isSelected = selectedMarkerSalon?.id === salon.id;
      const pinColor = isSelected
        ? (isWomen ? '#E11D48' : '#FF6422')
        : (isWomen ? '#E11D48' : '#EA4335');

      const salonBadgeHtml = `
        <div style="display: inline-flex; align-items: center; cursor: pointer; user-select: none; transition: transform 0.15s ease; filter: drop-shadow(0 2px 5px rgba(0,0,0,0.3)); ${isSelected ? 'transform: scale(1.12); z-index: 999;' : ''}">
          <!-- Iconic Google Maps Teardrop Location Pin -->
          <div style="width: 28px; height: 38px; flex-shrink: 0; position: relative;">
            <svg width="28" height="38" viewBox="0 0 28 38" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M14 0C6.268 0 0 6.268 0 14C0 24.5 14 38 14 38C14 38 28 24.5 28 14C28 6.268 21.732 0 14 0Z" fill="${pinColor}" stroke="#FFFFFF" stroke-width="1.5"/>
              <circle cx="14" cy="14" r="5.5" fill="#FFFFFF"/>
              <circle cx="14" cy="14" r="2.5" fill="${pinColor}"/>
            </svg>
          </div>
          <!-- Google Maps Business Name & Live Queue Text with White Halo -->
          <div style="display: flex; flex-direction: column; justify-content: center; margin-left: 4px; pointer-events: none;">
            <span style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 12px; font-weight: 800; color: #1F1F1F; text-shadow: -1px -1px 0 #FFF, 1px -1px 0 #FFF, -1px 1px 0 #FFF, 1px 1px 0 #FFF, 0 0 4px #FFF, 0 0 6px #FFF; white-space: nowrap; line-height: 1.2; letter-spacing: -0.2px;">
              ${salon.name}
            </span>
            <span style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 10px; font-weight: 700; color: ${salon.currentQueue === 0 ? '#188038' : '#D93025'}; text-shadow: -1px -1px 0 #FFF, 1px -1px 0 #FFF, -1px 1px 0 #FFF, 1px 1px 0 #FFF, 0 0 3px #FFF; white-space: nowrap; line-height: 1.2; margin-top: 1px;">
              ${salon.currentQueue === 0 ? '● No wait' : `● ${salon.currentQueue} waiting`}
            </span>
          </div>
        </div>
      `;

      const salonIcon = L.divIcon({
        className: 'google-maps-radar-marker',
        html: salonBadgeHtml,
        iconSize: [220, 42],
        iconAnchor: [14, 38],
      });

      const marker = L.marker([salon.coordinates.lat, salon.coordinates.lng], {
        icon: salonIcon,
        zIndexOffset: isSelected ? 1000 : 100,
      });
      marker.on('click', () => {
        setSelectedMarkerSalon(salon);
        if (userLocation && leafletMapRef.current) {
          leafletMapRef.current.fitBounds(
            [
              [userLocation.lat, userLocation.lng],
              [salon.coordinates.lat, salon.coordinates.lng],
            ],
            { padding: [60, 60], maxZoom: 16 }
          );
        } else if (leafletMapRef.current) {
          leafletMapRef.current.panTo([salon.coordinates.lat, salon.coordinates.lng]);
        }
      });
      marker.addTo(layer);
    });
  }, [mapEngine, isLeafletLoaded, visibleSalons, selectedMarkerSalon, userLocation, genderFilter]);

  // Handle Zoom In / Out
  const handleZoom = (delta: number) => {
    if (mapEngine === 'google' && googleMapRef.current) {
      const current = googleMapRef.current.getZoom() || 14;
      googleMapRef.current.setZoom(current + delta);
    } else if (mapEngine === 'leaflet' && leafletMapRef.current) {
      if (delta > 0) leafletMapRef.current.zoomIn();
      else leafletMapRef.current.zoomOut();
    }
  };

  // Center on user location
  const handlePanToUser = () => {
    if (!userLocation) {
      requestDeviceLocation();
    } else {
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
      if (userLocation) {
        const gmaps = (window as any).google?.maps;
        if (gmaps) {
          const bounds = new gmaps.LatLngBounds();
          bounds.extend({ lat: userLocation.lat, lng: userLocation.lng });
          bounds.extend({ lat: salon.coordinates.lat, lng: salon.coordinates.lng });
          googleMapRef.current.fitBounds(bounds, 50);
          return;
        }
      }
      googleMapRef.current.panTo({
        lat: salon.coordinates.lat,
        lng: salon.coordinates.lng,
      });
      googleMapRef.current.setZoom(15);
    } else if (mapEngine === 'leaflet' && leafletMapRef.current) {
      if (userLocation) {
        leafletMapRef.current.fitBounds(
          [
            [userLocation.lat, userLocation.lng],
            [salon.coordinates.lat, salon.coordinates.lng],
          ],
          { padding: [60, 60], maxZoom: 16 }
        );
      } else {
        leafletMapRef.current.panTo([salon.coordinates.lat, salon.coordinates.lng]);
        leafletMapRef.current.setZoom(15);
      }
    }
  };

  return (
    <div className="space-y-4 pb-28 text-stone-900">
      {/* Header controls & distance entry */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className={`text-[10px] uppercase tracking-widest font-extrabold px-2 py-0.5 rounded border flex items-center gap-1.5 ${
              isWomen
                ? 'bg-rose-100/70 text-[#E11D48] border-rose-200'
                : 'bg-orange-100/70 text-[#FF6422] border-orange-200'
            }`}>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              {mapEngine === 'google' ? 'Google Maps Live' : 'Google Maps Radar'}
            </span>
            <span className="text-xs text-stone-500 font-medium">
              {visibleSalons.length} studios within {radiusKm} km
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-stone-900 mt-0.5 tracking-tight">
            Salon Location Map
          </h1>
        </div>

        {/* Distance Entry Input & Filter Button */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Direct Distance Input */}
          <div className="flex items-center bg-white border border-[#E2DDD5] rounded-xl px-2.5 py-1 shadow-2xs gap-1.5">
            <Navigation className="w-3.5 h-3.5 text-stone-400" />
            <span className="text-[11px] font-bold text-stone-500">Radius:</span>
            <input
              type="number"
              min="1"
              max="100"
              value={customDistanceInput}
              onChange={(e) => {
                const val = e.target.value;
                setCustomDistanceInput(val);
                const num = parseFloat(val);
                if (!isNaN(num) && num > 0) {
                  setRadiusKm(num);
                }
              }}
              className="w-12 text-xs font-black text-stone-900 focus:outline-none"
              placeholder="10"
            />
            <span className="text-[11px] font-extrabold text-stone-600">km</span>
          </div>

          {/* Filter Bar Trigger Button */}
          <button
            onClick={() => setShowFilterDrawer(!showFilterDrawer)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-black transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer ${
              showFilterDrawer || minRatingFilter > 0 || maxPriceFilter < 1500 || onlyOpenFilter || onlyVerifiedFilter
                ? isWomen
                  ? 'bg-rose-50 border-[#E11D48] text-[#E11D48]'
                  : 'bg-orange-50 border-[#FF6422] text-[#FF6422]'
                : 'bg-white border-[#E2DDD5] text-stone-700 hover:bg-stone-50'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filters</span>
            {(minRatingFilter > 0 || maxPriceFilter < 1500 || onlyOpenFilter || onlyVerifiedFilter) && (
              <span className="w-2 h-2 rounded-full bg-[#FF6422]" />
            )}
          </button>

          {/* Toggle Map / List view on mobile */}
          <div className="sm:hidden flex items-center bg-[#F3ECE4] border border-[#E2DDD5] rounded-xl p-0.5 text-xs">
            <button
              onClick={() => setViewMode('map')}
              className={`p-1.5 rounded-lg ${
                viewMode === 'map'
                  ? isWomen
                    ? 'bg-[#E11D48] text-white shadow-sm'
                    : 'bg-[#FF6422] text-white shadow-sm'
                  : 'text-stone-600'
              }`}
              title="Map view"
            >
              <MapIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg ${
                viewMode === 'list'
                  ? isWomen
                    ? 'bg-[#E11D48] text-white shadow-sm'
                    : 'bg-[#FF6422] text-white shadow-sm'
                  : 'text-stone-600'
              }`}
              title="List view"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* FILTER DRAWER / EXPANDABLE BAR */}
      {showFilterDrawer && (
        <div className="bg-white border border-[#E8E2D8] rounded-2xl p-4 shadow-sm animate-in slide-in-from-top-2 duration-150 space-y-3.5">
          <div className="flex items-center justify-between border-b border-stone-100 pb-2">
            <span className="text-xs font-black text-stone-900 flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#FF6422]" />
              <span>Map Search Filters</span>
            </span>
            <button
              onClick={() => {
                setMinRatingFilter(0);
                setMaxPriceFilter(1500);
                setOnlyOpenFilter(false);
                setOnlyVerifiedFilter(false);
              }}
              className="text-[11px] font-bold text-stone-500 hover:text-stone-800 flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            {/* 1. Max Price Filter */}
            <div>
              <label className="block text-[11px] font-bold text-stone-600 mb-1">
                Max Price: <strong className="text-stone-900">₹{maxPriceFilter}</strong>
              </label>
              <input
                type="range"
                min="100"
                max="1500"
                step="50"
                value={maxPriceFilter}
                onChange={(e) => setMaxPriceFilter(Number(e.target.value))}
                className="w-full accent-[#FF6422] cursor-pointer"
              />
            </div>

            {/* 2. Rating Filter */}
            <div>
              <label className="block text-[11px] font-bold text-stone-600 mb-1">
                Minimum Rating: <strong className="text-stone-900">{minRatingFilter > 0 ? `${minRatingFilter}★+` : 'Any'}</strong>
              </label>
              <div className="flex items-center gap-1">
                {[0, 4.0, 4.5, 4.8].map((rat) => (
                  <button
                    key={rat}
                    onClick={() => setMinRatingFilter(rat)}
                    className={`flex-1 py-1 rounded-lg border text-[11px] font-bold transition-all cursor-pointer ${
                      minRatingFilter === rat
                        ? 'bg-[#FF6422] text-white border-orange-500'
                        : 'bg-stone-50 text-stone-700 border-stone-200'
                    }`}
                  >
                    {rat === 0 ? 'All' : `${rat}★`}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Open Now Toggle */}
            <div className="flex items-center">
              <label className="flex items-center gap-2 cursor-pointer pt-3">
                <input
                  type="checkbox"
                  checked={onlyOpenFilter}
                  onChange={(e) => setOnlyOpenFilter(e.target.checked)}
                  className="w-4 h-4 rounded text-[#FF6422] accent-[#FF6422] cursor-pointer"
                />
                <span className="text-xs font-bold text-stone-800">Only Open Studios</span>
              </label>
            </div>

            {/* 4. Verified Salons Toggle */}
            <div className="flex items-center">
              <label className="flex items-center gap-2 cursor-pointer pt-3">
                <input
                  type="checkbox"
                  checked={onlyVerifiedFilter}
                  onChange={(e) => setOnlyVerifiedFilter(e.target.checked)}
                  className="w-4 h-4 rounded text-[#FF6422] accent-[#FF6422] cursor-pointer"
                />
                <span className="text-xs font-bold text-stone-800">SLOON Verified Only</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Salon Searching Option Input Bar */}
      <div className="relative">
        <Search className={`w-4 h-4 absolute left-3.5 top-3 ${isWomen ? 'text-[#E11D48]' : 'text-[#FF6422]'}`} />
        <input
          type="text"
          value={mapSearch}
          onChange={(e) => setMapSearch(e.target.value)}
          placeholder={isWomen ? "Search salon name, locality or PIN code on map..." : "Search salon name, locality or PIN code on map..."}
          className={`w-full pl-10 pr-4 py-2.5 bg-white border rounded-2xl text-xs text-stone-900 placeholder-stone-400 focus:outline-none shadow-sm transition-colors ${
            isWomen
              ? 'border-[#FED7CC] focus:border-[#E11D48] focus:ring-1 focus:ring-[#E11D48]'
              : 'border-[#E8E2D8] focus:border-[#FF6422] focus:ring-1 focus:ring-[#FF6422]'
          }`}
        />
        {mapSearch && (
          <button
            onClick={() => setMapSearch('')}
            className="absolute right-3 top-3 text-stone-400 hover:text-stone-700 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Main Split Layout: Desktop Side-by-Side / Mobile Stack */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* MAP CONTAINER (Left or Top) */}
        <div
          className={`lg:col-span-7 xl:col-span-8 relative rounded-3xl overflow-hidden border shadow-md min-h-[460px] h-[60vh] lg:h-[650px] ${
            isWomen ? 'border-[#FED7CC] bg-[#FFF8F5]' : 'border-[#E8E2D8] bg-[#FAF7F2]'
          } ${viewMode === 'list' ? 'hidden sm:block' : 'block'}`}
        >
          {/* Interactive Google Map / Leaflet Container */}
          <style>{`
            .osm-tiles {
              filter: none !important;
            }
            .leaflet-container {
              background-color: ${isWomen ? '#FFF8F5' : '#FAF7F2'} !important;
            }
          `}</style>
          <div ref={mapContainerRef} className="w-full h-full" style={{ zIndex: 1 }} />

          {/* Real-time Distance Status Indicator & GPS Prompt */}
          {userLocation && selectedMarkerSalon ? (
            <div className="absolute top-4 left-4 z-20 hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/95 backdrop-blur-md border border-[#E8E2D8] text-[11px] font-bold text-stone-800 shadow-md animate-in fade-in">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>
                Distance to <strong className="text-stone-900">{selectedMarkerSalon.name}</strong>:{' '}
                <span className={isWomen ? 'text-[#E11D48]' : 'text-[#FF6422]'}>
                  {calculateHaversineDistance(
                    userLocation.lat,
                    userLocation.lng,
                    selectedMarkerSalon.coordinates.lat,
                    selectedMarkerSalon.coordinates.lng,
                  ).toFixed(1)}{' '}
                  km
                </span>
              </span>
            </div>
          ) : !userLocation ? (
            <button
              onClick={requestDeviceLocation}
              className="absolute top-4 left-4 z-20 px-3 py-1.5 rounded-xl bg-white/95 backdrop-blur-md border border-orange-200 text-[11px] font-bold text-orange-900 shadow-md flex items-center gap-1.5 hover:bg-orange-50 transition-colors animate-in fade-in"
              title="Click to detect your location and show distance line"
            >
              <Crosshair className="w-3.5 h-3.5 text-[#FF6422]" />
              <span>Enable GPS to draw route</span>
            </button>
          ) : null}

          {/* Floating "Search This Area" Pill */}
          {hasMapMoved && (
            <button
              onClick={handleSearchThisArea}
              className={`absolute top-4 left-1/2 -translate-x-1/2 z-20 px-4 py-2 rounded-2xl text-white text-xs font-black shadow-lg flex items-center gap-2 transition-transform active:scale-95 animate-in fade-in ${
                isWomen
                  ? 'bg-[#E11D48] shadow-rose-500/25 hover:bg-[#BE123C]'
                  : 'bg-[#FF6422] shadow-orange-500/25 hover:bg-[#E55215]'
              }`}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Search This Area</span>
            </button>
          )}

          {/* Google Maps Official Open in App shortcut badge */}
          <div className="absolute top-4 right-4 z-20 hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/90 backdrop-blur-md border border-[#E8E2D8] text-[11px] font-bold text-stone-700 shadow-sm">
            <span className={isWomen ? 'text-[#E11D48]' : 'text-[#FF6422]'}>Google Maps</span>
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
              className={`w-10 h-10 rounded-2xl bg-white/95 border flex items-center justify-center shadow-md backdrop-blur-md transition-all active:scale-90 ${
                isWomen
                  ? 'border-[#FED7CC] text-[#E11D48] hover:bg-rose-50'
                  : 'border-[#E8E2D8] text-[#FF6422] hover:bg-orange-50'
              }`}
              title="Center on my location"
            >
              <Crosshair className="w-5 h-5" />
            </button>
            <div className="bg-white/95 border border-[#E8E2D8] rounded-2xl flex flex-col shadow-md backdrop-blur-md overflow-hidden">
              <button
                onClick={() => handleZoom(1)}
                className={`w-10 h-10 flex items-center justify-center text-stone-700 hover:bg-stone-50 transition-colors ${
                  isWomen ? 'hover:text-[#E11D48]' : 'hover:text-[#FF6422]'
                }`}
                title="Zoom in"
              >
                <Plus className="w-4 h-4" />
              </button>
              <div className="w-full h-px bg-stone-200" />
              <button
                onClick={() => handleZoom(-1)}
                className={`w-10 h-10 flex items-center justify-center text-stone-700 hover:bg-stone-50 transition-colors ${
                  isWomen ? 'hover:text-[#E11D48]' : 'hover:text-[#FF6422]'
                }`}
                title="Zoom out"
              >
                <Minus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Selected Salon Floating Card (Mobile/Overlay) */}
          {selectedMarkerSalon && (
            <div className="absolute bottom-4 left-3 right-16 z-20 animate-in slide-in-from-bottom-3 duration-200">
              <div className={`bg-white/95 backdrop-blur-md border rounded-2xl p-3 shadow-xl flex items-center gap-3 ${
                isWomen ? 'border-rose-200' : 'border-orange-200'
              }`}>
                {selectedMarkerSalon.coverImage || selectedMarkerSalon.posterImage || (selectedMarkerSalon.locationImages && selectedMarkerSalon.locationImages[0]) || (selectedMarkerSalon.images && selectedMarkerSalon.images[0]) ? (
                  <img
                    src={selectedMarkerSalon.coverImage || selectedMarkerSalon.posterImage || (selectedMarkerSalon.locationImages && selectedMarkerSalon.locationImages[0]) || (selectedMarkerSalon.images && selectedMarkerSalon.images[0])}
                    alt={selectedMarkerSalon.name}
                    className="w-16 h-16 rounded-xl object-cover shrink-0 border border-stone-200"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-orange-50 border border-orange-200 flex flex-col items-center justify-center shrink-0 text-[#FF6422]">
                    <Store className="w-6 h-6" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 text-[10px]">
                    <span className={`font-bold ${isWomen ? 'text-[#E11D48]' : 'text-[#FF6422]'}`}>
                      {selectedMarkerSalon.rating} ★
                    </span>
                    <span className="text-stone-300">•</span>
                    <span className="text-stone-600 font-semibold">
                      {userLocation
                        ? `${calculateHaversineDistance(
                            userLocation.lat,
                            userLocation.lng,
                            selectedMarkerSalon.coordinates.lat,
                            selectedMarkerSalon.coordinates.lng,
                          ).toFixed(1)} km away`
                        : `${selectedMarkerSalon.distanceKm} km`}
                    </span>
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
                      className={`px-2.5 py-1 rounded-lg text-white font-extrabold text-[10px] flex items-center gap-1 transition-colors shadow-sm ${
                        isWomen
                          ? 'bg-[#E11D48] hover:bg-[#BE123C]'
                          : 'bg-[#FF6422] hover:bg-[#E55215]'
                      }`}
                      title="Navigate turn-by-turn in Google Maps"
                    >
                      <Navigation className="w-3 h-3 fill-white" />
                      <span>Google Maps Directions ↗</span>
                    </button>

                    {/* View Details button */}
                    <button
                      onClick={() => setSelectedSalonForDetail(selectedMarkerSalon)}
                      className={`text-[10px] font-bold underline flex items-center gap-0.5 ${
                        isWomen
                          ? 'text-[#E11D48] hover:text-rose-700'
                          : 'text-[#FF6422] hover:text-orange-700'
                      }`}
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
            <h3 className="text-sm font-bold text-stone-900">
              Studio Listings ({visibleSalons.length})
            </h3>
            <span className="text-[11px] text-stone-500">Sorted by distance</span>
          </div>

          <div className="space-y-3 max-h-[650px] overflow-y-auto pr-1">
            {visibleSalons.length === 0 ? (
              <div className={`p-8 text-center bg-white rounded-3xl border shadow-sm ${
                isWomen ? 'border-[#FED7CC]' : 'border-[#E8E2D8]'
              }`}>
                <MapPin className="w-8 h-8 text-stone-400 mx-auto mb-2" />
                <p className="text-xs font-semibold text-stone-800">No studios found in this range</p>
                <p className="text-[11px] text-stone-500 mt-1">Try expanding search radius to 10km or 20km.</p>
                <button
                  onClick={() => setRadiusKm(20)}
                  className={`mt-3 px-3 py-1.5 rounded-xl text-white text-xs font-bold shadow-sm ${
                    isWomen ? 'bg-[#E11D48] hover:bg-[#BE123C]' : 'bg-[#FF6422] hover:bg-[#E55215]'
                  }`}
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
                        ? isWomen
                          ? 'bg-rose-50/80 border-rose-300 shadow-md ring-1 ring-rose-200'
                          : 'bg-orange-50/80 border-orange-300 shadow-md ring-1 ring-orange-200'
                        : isWomen
                          ? 'bg-white border-[#FED7CC] hover:border-rose-300 hover:bg-[#FFFDFB] shadow-sm'
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
                          <span className={`text-[10px] font-bold shrink-0 ${isWomen ? 'text-[#E11D48]' : 'text-[#FF6422]'}`}>
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
                        className={`text-[10px] font-bold flex items-center gap-1 ${
                          isWomen ? 'text-[#E11D48] hover:text-rose-700' : 'text-[#FF6422] hover:text-orange-700'
                        }`}
                        title="Open in Google Maps"
                      >
                        <Navigation className={`w-3 h-3 ${isWomen ? 'fill-[#E11D48] text-[#E11D48]' : 'fill-[#FF6422] text-[#FF6422]'}`} />
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
