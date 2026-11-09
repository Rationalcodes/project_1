import { InstagramGradientIcon } from '../common/InstagramIcon';
import React, { useState, useEffect, useRef } from 'react';
import {
  MapPin,
  ArrowLeft,
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
  Phone,
} from 'lucide-react';
import {
  useCustomer,
  getEstimatedWaitMinutes,
  formatDuration,
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
  fetchDrivingRoute,
  DrivingRouteResult,
} from '@kumbhakaran/ui';

export interface MapScreenProps {
  onClose?: () => void;
  isFullScreen?: boolean;
}

export const MapScreen: React.FC<MapScreenProps> = ({ onClose, isFullScreen = false }) => {
  const {
    salons,
    userLocation,
    setSelectedSalonForDetail,
    requestDeviceLocation,
    triggerNotification,
    genderFilter,
  } = useCustomer();

  const isWomen = genderFilter === 'women';
  const primaryHex = isWomen ? '#F47B70' : '#FF6422';
  const primaryHoverHex = isWomen ? '#E0665B' : '#E55215';

  const [selectedMarkerSalon, setSelectedMarkerSalon] = useState<Salon | null>(salons[0] || null);
  const [drivingRoute, setDrivingRoute] = useState<DrivingRouteResult | null>(null);

  // Resize map when entering full screen
  useEffect(() => {
    if (!isFullScreen) return;
    const timer = setTimeout(() => {
      if (googleMapRef.current && (window as any).google?.maps?.event) {
        (window as any).google.maps.event.trigger(googleMapRef.current, 'resize');
      }
      if (leafletMapRef.current) {
        leafletMapRef.current.invalidateSize();
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [isFullScreen]);

  // Escape key handler for full screen
  useEffect(() => {
    if (!isFullScreen || !onClose) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullScreen, onClose]);

  // Fetch real Google Maps / OSRM turn-by-turn road route
  useEffect(() => {
    let isCancelled = false;
    if (userLocation && selectedMarkerSalon) {
      const sLat = selectedMarkerSalon.coordinates?.lat ?? (selectedMarkerSalon as any)?.latitude;
      const sLng = selectedMarkerSalon.coordinates?.lng ?? (selectedMarkerSalon as any)?.longitude;
      if (Number.isFinite(sLat) && Number.isFinite(sLng)) {
        fetchDrivingRoute(
          { lat: userLocation.lat, lng: userLocation.lng },
          { lat: Number(sLat), lng: Number(sLng) }
        ).then((route) => {
          if (!isCancelled) {
            setDrivingRoute(route);
          }
        });
      }
    } else {
      setDrivingRoute(null);
    }

    return () => {
      isCancelled = true;
    };
  }, [userLocation?.lat, userLocation?.lng, selectedMarkerSalon?.id]);
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
  const googleUserDispRef = useRef<any>(null);
  const googleShopDispRef = useRef<any>(null);
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
          fillColor: isSelected ? primaryHex : salon.isOpen ? (isWomen ? '#F47B70' : '#EA4335') : '#9CA3AF',
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

    // Real road driving route line (like Google Maps) from Customer Location -> Selected Shop Location
    if (googlePolylineRef.current) {
      googlePolylineRef.current.setMap(null);
      googlePolylineRef.current = null;
    }
    if (googleUserDispRef.current) {
      googleUserDispRef.current.setMap(null);
      googleUserDispRef.current = null;
    }
    if (googleShopDispRef.current) {
      googleShopDispRef.current.setMap(null);
      googleShopDispRef.current = null;
    }
    if (googleMidpointMarkerRef.current) {
      googleMidpointMarkerRef.current.setMap(null);
      googleMidpointMarkerRef.current = null;
    }

    if (userLocation && selectedMarkerSalon) {
      const sLat = selectedMarkerSalon.coordinates?.lat ?? (selectedMarkerSalon as any)?.latitude;
      const sLng = selectedMarkerSalon.coordinates?.lng ?? (selectedMarkerSalon as any)?.longitude;
      const destCoords = { lat: Number(sLat) || 12.9716, lng: Number(sLng) || 77.5946 };

      const isWalking = drivingRoute?.travelMode === 'walking';

      if (drivingRoute?.isRoadRoute && drivingRoute.roadCoordinates.length > 0) {
        if (isWalking) {
          // Google Maps Walking Polyline: Crisp Circular Dots
          if (drivingRoute.userDisplacement && drivingRoute.userDisplacement.length > 1) {
            googleUserDispRef.current = new gmaps.Polyline({
              path: drivingRoute.userDisplacement.map(([lat, lng]) => ({ lat, lng })),
              geodesic: true,
              strokeOpacity: 0,
              icons: [{
                icon: { path: gmaps.SymbolPath.CIRCLE, scale: 2.5, fillOpacity: 0.8, fillColor: '#6366F1', strokeColor: '#6366F1' },
                offset: '0',
                repeat: '8px',
              }],
              map: googleMapRef.current,
            });
          }

          googlePolylineRef.current = new gmaps.Polyline({
            path: drivingRoute.roadCoordinates.map(([lat, lng]) => ({ lat, lng })),
            geodesic: true,
            strokeOpacity: 0,
            icons: [{
              icon: { path: gmaps.SymbolPath.CIRCLE, scale: 4.5, fillOpacity: 1, fillColor: '#4338CA', strokeColor: '#4338CA' },
              offset: '0',
              repeat: '12px',
            }],
            map: googleMapRef.current,
          });

          if (drivingRoute.shopDisplacement && drivingRoute.shopDisplacement.length > 1) {
            googleShopDispRef.current = new gmaps.Polyline({
              path: drivingRoute.shopDisplacement.map(([lat, lng]) => ({ lat, lng })),
              geodesic: true,
              strokeOpacity: 0,
              icons: [{
                icon: { path: gmaps.SymbolPath.CIRCLE, scale: 2.5, fillOpacity: 0.8, fillColor: '#6366F1', strokeColor: '#6366F1' },
                offset: '0',
                repeat: '8px',
              }],
              map: googleMapRef.current,
            });
          }
        } else {
          // Driving Mode: Solid Travel Line
          if (drivingRoute.userDisplacement && drivingRoute.userDisplacement.length > 1) {
            googleUserDispRef.current = new gmaps.Polyline({
              path: drivingRoute.userDisplacement.map(([lat, lng]) => ({ lat, lng })),
              geodesic: true,
              strokeColor: primaryHex,
              strokeOpacity: 0.8,
              strokeWeight: 3.5,
              icons: [{
                icon: { path: 'M 0,-1 0,1', strokeOpacity: 1, scale: 2 },
                offset: '0',
                repeat: '8px',
              }],
              map: googleMapRef.current,
            });
          }

          googlePolylineRef.current = new gmaps.Polyline({
            path: drivingRoute.roadCoordinates.map(([lat, lng]) => ({ lat, lng })),
            geodesic: true,
            strokeColor: primaryHex,
            strokeOpacity: 0.95,
            strokeWeight: 5,
            map: googleMapRef.current,
          });

          if (drivingRoute.shopDisplacement && drivingRoute.shopDisplacement.length > 1) {
            googleShopDispRef.current = new gmaps.Polyline({
              path: drivingRoute.shopDisplacement.map(([lat, lng]) => ({ lat, lng })),
              geodesic: true,
              strokeColor: primaryHex,
              strokeOpacity: 0.8,
              strokeWeight: 3.5,
              icons: [{
                icon: { path: 'M 0,-1 0,1', strokeOpacity: 1, scale: 2 },
                offset: '0',
                repeat: '8px',
              }],
              map: googleMapRef.current,
            });
          }
        }
      } else {
        // Direct displacement fallback when no road exists on map
        googlePolylineRef.current = new gmaps.Polyline({
          path: [
            { lat: userLocation.lat, lng: userLocation.lng },
            destCoords,
          ],
          geodesic: true,
          strokeColor: isWalking ? '#4338CA' : primaryHex,
          strokeOpacity: 0.9,
          strokeWeight: 4,
          map: googleMapRef.current,
        });
      }

      const distFormatted = drivingRoute?.distanceFormatted || `${calculateHaversineDistance(
        userLocation.lat,
        userLocation.lng,
        destCoords.lat,
        destCoords.lng,
      ).toFixed(1)} km`;

      const durText = drivingRoute?.durationFormatted ? ` (${drivingRoute.durationFormatted})` : '';

      const routePath = (drivingRoute && drivingRoute.coordinates.length > 0)
        ? drivingRoute.coordinates.map(([lat, lng]) => ({ lat, lng }))
        : [{ lat: userLocation.lat, lng: userLocation.lng }, destCoords];

      const midIdx = Math.floor(routePath.length / 2);
      const midPoint = routePath[midIdx] || {
        lat: (userLocation.lat + destCoords.lat) / 2,
        lng: (userLocation.lng + destCoords.lng) / 2,
      };

      const labelText = isWalking
        ? `🚶 ${drivingRoute?.durationFormatted || '2 min'} (${distFormatted})`
        : `🚗 ${distFormatted}${durText}`;

      googleMidpointMarkerRef.current = new gmaps.Marker({
        position: midPoint,
        map: googleMapRef.current,
        label: {
          text: labelText,
          color: '#FFFFFF',
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
  }, [mapEngine, visibleSalons, selectedMarkerSalon, userLocation, genderFilter, drivingRoute]);

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

    // 2. Draw Real Road Driving Route connecting Customer Location -> Selected Shop Location
    if (userLocation && selectedMarkerSalon) {
      const sLat = selectedMarkerSalon.coordinates?.lat ?? (selectedMarkerSalon as any)?.latitude;
      const sLng = selectedMarkerSalon.coordinates?.lng ?? (selectedMarkerSalon as any)?.longitude;
      const destPoint: [number, number] = [Number(sLat) || 12.9716, Number(sLng) || 77.5946];
      const startPoint: [number, number] = [userLocation.lat, userLocation.lng];

      const routePoints: [number, number][] = (drivingRoute && drivingRoute.coordinates.length > 0)
        ? drivingRoute.coordinates
        : [startPoint, destPoint];

      const isWalking = drivingRoute?.travelMode === 'walking';

      if (drivingRoute?.isRoadRoute && drivingRoute.roadCoordinates.length > 0) {
        if (isWalking) {
          // Walking Mode (Google Maps style as in Image 2)
          // 1. Dotted walking connector from user/building to pathway (if applicable)
          if (drivingRoute.userDisplacement && drivingRoute.userDisplacement.length > 1) {
            L.polyline(drivingRoute.userDisplacement, {
              color: '#6366F1',
              weight: 4,
              dashArray: '2, 8',
              opacity: 0.85,
              lineCap: 'round',
            }).addTo(layer);
          }

          // 2. Main walking route along campus walkway / footpath (crisp purple circular dots)
          L.polyline(drivingRoute.roadCoordinates, {
            color: '#4338CA',
            weight: 6,
            dashArray: '2, 10',
            opacity: 0.95,
            lineCap: 'round',
          }).addTo(layer);

          // 3. Dotted walking connector from pathway to destination building (if applicable)
          if (drivingRoute.shopDisplacement && drivingRoute.shopDisplacement.length > 1) {
            L.polyline(drivingRoute.shopDisplacement, {
              color: '#6366F1',
              weight: 4,
              dashArray: '2, 8',
              opacity: 0.85,
              lineCap: 'round',
            }).addTo(layer);
          }
        } else {
          // Driving Mode (Road travel)
          // 1. Off-road displacement from user -> road network entry (dashed connector)
          if (drivingRoute.userDisplacement && drivingRoute.userDisplacement.length > 1) {
            L.polyline(drivingRoute.userDisplacement, {
              color: primaryHex,
              weight: 3.5,
              dashArray: '5, 7',
              opacity: 0.9,
              lineCap: 'round',
            }).addTo(layer);
          }

          // 2. Road route along actual streets (white casing + solid brand color route)
          L.polyline(drivingRoute.roadCoordinates, {
            color: '#FFFFFF',
            weight: 7,
            opacity: 0.95,
            lineCap: 'round',
            lineJoin: 'round',
          }).addTo(layer);

          L.polyline(drivingRoute.roadCoordinates, {
            color: primaryHex,
            weight: 4.5,
            opacity: 0.95,
            lineCap: 'round',
            lineJoin: 'round',
            className: 'animated-route-line',
          }).addTo(layer);

          // 3. Off-road displacement from road exit -> shop pin (dashed connector)
          if (drivingRoute.shopDisplacement && drivingRoute.shopDisplacement.length > 1) {
            L.polyline(drivingRoute.shopDisplacement, {
              color: primaryHex,
              weight: 3.5,
              dashArray: '5, 7',
              opacity: 0.9,
              lineCap: 'round',
            }).addTo(layer);
          }
        }
      } else {
        // Direct displacement fallback when no road exists on map
        L.polyline(routePoints, {
          color: isWalking ? '#4338CA' : primaryHex,
          weight: 4,
          dashArray: '3, 8',
          opacity: 0.95,
          lineCap: 'round',
        }).addTo(layer);
      }

      // Midpoint distance and duration pill badge
      const distFormatted = drivingRoute?.distanceFormatted || `${calculateHaversineDistance(
        userLocation.lat,
        userLocation.lng,
        destPoint[0],
        destPoint[1],
      ).toFixed(1)} km`;

      const estMins = drivingRoute?.durationMinutes || Math.max(1, Math.round(Number(distFormatted.replace(/[^0-9.]/g, '')) * 3));
      const midIdx = Math.floor(routePoints.length / 2);
      const [midLat, midLng] = routePoints[midIdx] || [
        (userLocation.lat + destPoint[0]) / 2,
        (userLocation.lng + destPoint[1]) / 2,
      ];

      const midpointHtml = isWalking ? `
        <div style="
          display: inline-flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: #1D4ED8;
          color: #FFFFFF;
          padding: 3px 8px;
          border-radius: 6px;
          border: 1.5px solid #FFFFFF;
          box-shadow: 0 4px 14px rgba(29, 78, 216, 0.45);
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          white-space: nowrap;
          pointer-events: none;
          transform: translate(-50%, -50%);
        ">
          <div style="display: flex; align-items: center; gap: 3px; font-size: 11px; font-weight: 800; line-height: 1.2;">
            <span>🚶</span>
            <span>${drivingRoute?.durationFormatted || `${estMins} min`}</span>
          </div>
          <div style="font-size: 9px; font-weight: 700; opacity: 0.95; line-height: 1.2;">
            ${distFormatted}
          </div>
        </div>
      ` : `
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
          <span style="color: ${primaryHex};">🚗</span>
          <span>${distFormatted}</span>
          <span style="color: #A1A1AA; font-size: 9px; font-weight: 600;">(~${formatDuration(estMins)} drive)</span>
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

      // Frame map view to fit road route on load or when selected studio changes
      if (leafletMapRef.current && (!hasInitialFittedRef.current || drivingRoute)) {
        hasInitialFittedRef.current = true;
        try {
          const fitCoords = routePoints.length > 20
            ? routePoints.filter((_, idx) => idx % 4 === 0 || idx === routePoints.length - 1)
            : routePoints;
          leafletMapRef.current.fitBounds(fitCoords, {
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
        ? (isWomen ? '#F47B70' : '#FF6422')
        : (isWomen ? '#F47B70' : '#EA4335');

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
  }, [mapEngine, isLeafletLoaded, visibleSalons, selectedMarkerSalon, userLocation, genderFilter, drivingRoute]);

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

  if (isFullScreen) {
    return (
      <div className="fixed inset-0 z-50 w-screen h-[100dvh] bg-[#FAF7F2] overflow-hidden flex flex-col animate-in fade-in duration-200 text-stone-900">
        <style>{`
          .osm-tiles {
            filter: none !important;
          }
          .leaflet-container {
            background-color: ${isWomen ? '#FFF8F5' : '#FAF7F2'} !important;
          }
        `}</style>

        {/* 1. True Full Screen Map Viewport taking 100% */}
        <div className="relative w-full h-full flex-1">
          <div ref={mapContainerRef} className="w-full h-full absolute inset-0" style={{ zIndex: 1 }} />

          {/* Top Floating Controls Bar */}
          <div className="absolute top-3 left-3 right-3 z-30 flex items-center justify-between gap-2 pointer-events-none">
            {/* Left: Back to List View Button + Zoom Out & Zoom In Controls */}
            <div className="pointer-events-auto flex items-center gap-1.5 shrink-0">
              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-white/95 backdrop-blur-md border border-stone-200 shadow-md text-xs font-black text-stone-900 hover:bg-white active:scale-95 transition-all cursor-pointer"
                  title="Return to List View"
                >
                  <ArrowLeft className="w-4 h-4 text-stone-700" />
                  <span>List View</span>
                </button>
              )}

              {/* Zoom Out & Zoom In Buttons beside List View */}
              <div className="flex items-center bg-white/95 backdrop-blur-md border border-stone-200 rounded-2xl shadow-md overflow-hidden p-0.5">
                <button
                  type="button"
                  onClick={() => handleZoom(-1)}
                  className={`flex items-center gap-1 px-2.5 py-2 hover:bg-stone-100 text-stone-800 transition-colors cursor-pointer rounded-xl active:scale-95 ${
                    isWomen ? 'hover:text-[#F47B70]' : 'hover:text-[#FF6422]'
                  }`}
                  title="Zoom Out"
                  aria-label="Zoom Out"
                >
                  <Minus className="w-4 h-4 stroke-[2.5]" />
                  <span className="hidden sm:inline text-xs font-bold">Zoom Out</span>
                </button>
                <div className="w-px h-5 bg-stone-200" />
                <button
                  type="button"
                  onClick={() => handleZoom(1)}
                  className={`flex items-center gap-1 px-2.5 py-2 hover:bg-stone-100 text-stone-800 transition-colors cursor-pointer rounded-xl active:scale-95 ${
                    isWomen ? 'hover:text-[#F47B70]' : 'hover:text-[#FF6422]'
                  }`}
                  title="Zoom In"
                  aria-label="Zoom In"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span className="hidden sm:inline text-xs font-bold">Zoom In</span>
                </button>
              </div>
            </div>

            {/* Middle: Map Search Input */}
            <div className="pointer-events-auto flex-1 max-w-sm sm:max-w-md mx-auto relative hidden xs:block">
              <Search className={`w-3.5 h-3.5 absolute left-3 top-3 ${isWomen ? 'text-[#F47B70]' : 'text-[#FF6422]'}`} />
              <input
                type="text"
                value={mapSearch}
                onChange={(e) => setMapSearch(e.target.value)}
                placeholder="Search salon on map..."
                className="w-full pl-9 pr-8 py-2 bg-white/95 backdrop-blur-md border border-stone-200 rounded-2xl text-xs text-stone-900 placeholder-stone-400 focus:outline-none shadow-md focus:ring-1 focus:ring-stone-400"
              />
              {mapSearch && (
                <button
                  type="button"
                  onClick={() => setMapSearch('')}
                  className="absolute right-2.5 top-2.5 text-stone-400 hover:text-stone-700 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Right: Direct Google Maps External Launch + Filter Button */}
            <div className="pointer-events-auto flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => openGoogleMapsLocation(currentCoords.lat, currentCoords.lng)}
                className="flex items-center gap-1.5 px-3 py-2.5 rounded-2xl bg-white/95 backdrop-blur-md border border-stone-200 shadow-md text-xs font-bold text-stone-800 hover:bg-white active:scale-95 transition-all cursor-pointer"
                title="Open in Google Maps Application"
              >
                <ExternalLink className={`w-3.5 h-3.5 ${isWomen ? 'text-[#F47B70]' : 'text-[#FF6422]'}`} />
                <span className="hidden sm:inline">Google Maps</span>
              </button>

              <button
                type="button"
                onClick={() => setShowFilterDrawer(!showFilterDrawer)}
                className={`p-2.5 rounded-2xl border text-xs font-bold shadow-md transition-all cursor-pointer ${
                  showFilterDrawer || minRatingFilter > 0 || maxPriceFilter < 1500 || onlyOpenFilter || onlyVerifiedFilter
                    ? isWomen
                      ? 'bg-rose-50 border-[#F47B70] text-[#F47B70]'
                      : 'bg-orange-50 border-[#FF6422] text-[#FF6422]'
                    : 'bg-white/95 border-stone-200 text-stone-700 hover:bg-white'
                }`}
                title="Filters & Radius"
              >
                <SlidersHorizontal className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Floating Filter Drawer (overlaid when open) */}
          {showFilterDrawer && (
            <div className="absolute top-16 left-3 right-3 sm:left-auto sm:right-3 sm:w-96 z-30 bg-white/95 backdrop-blur-md border border-stone-200 rounded-3xl p-4 shadow-2xl animate-in slide-in-from-top-2 duration-150 space-y-3">
              <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                <span className="text-xs font-black text-stone-900 flex items-center gap-1.5">
                  <SlidersHorizontal className={`w-3.5 h-3.5 ${isWomen ? 'text-[#F47B70]' : 'text-[#FF6422]'}`} />
                  <span>Map Filters</span>
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setMinRatingFilter(0);
                      setMaxPriceFilter(1500);
                      setOnlyOpenFilter(false);
                      setOnlyVerifiedFilter(false);
                      setRadiusKm(10);
                      setCustomDistanceInput('10');
                    }}
                    className="text-[11px] font-bold text-stone-500 hover:text-stone-800 flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowFilterDrawer(false)}
                    className="p-1 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Radius Filter */}
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-stone-600">Search Radius</span>
                <div className="flex items-center gap-1">
                  {[5, 10, 20, 50].map((km) => (
                    <button
                      key={km}
                      type="button"
                      onClick={() => {
                        setRadiusKm(km);
                        setCustomDistanceInput(String(km));
                      }}
                      className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all ${
                        radiusKm === km
                          ? isWomen
                            ? 'bg-[#F47B70] text-white shadow-xs'
                            : 'bg-[#FF6422] text-white shadow-xs'
                          : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                      }`}
                    >
                      {km}km
                    </button>
                  ))}
                </div>
              </div>

              {/* Only Open Toggle */}
              <label className="flex items-center justify-between text-xs font-bold text-stone-700 pt-1 cursor-pointer">
                <span>Only Open Studios</span>
                <input
                  type="checkbox"
                  checked={onlyOpenFilter}
                  onChange={(e) => setOnlyOpenFilter(e.target.checked)}
                  className="w-4 h-4 rounded text-[#FF6422] accent-[#FF6422] cursor-pointer"
                />
              </label>
            </div>
          )}

          {/* Distance Indicator Badge */}
          {userLocation && selectedMarkerSalon && (
            <div className="absolute top-16 left-3 z-20 hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/95 backdrop-blur-md border border-stone-200 text-[11px] font-bold text-stone-800 shadow-md animate-in fade-in">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>
                Distance to <strong className="text-stone-900">{selectedMarkerSalon.name}</strong>:{' '}
                <span className={isWomen ? 'text-[#F47B70]' : 'text-[#FF6422]'}>
                  {drivingRoute
                    ? `${drivingRoute.distanceFormatted} (${drivingRoute.durationFormatted} ${drivingRoute.travelMode === 'walking' ? 'walk' : 'drive'})`
                    : `${calculateHaversineDistance(
                        userLocation.lat,
                        userLocation.lng,
                        selectedMarkerSalon.coordinates.lat,
                        selectedMarkerSalon.coordinates.lng,
                      ).toFixed(1)} km`}
                </span>
              </span>
            </div>
          )}

          {/* Floating Right Map Controls (GPS, Zoom) */}
          <div className="absolute bottom-24 sm:bottom-28 right-3.5 z-20 flex flex-col gap-2">
            <button
              type="button"
              onClick={handlePanToUser}
              className={`w-10 h-10 rounded-2xl bg-white/95 border flex items-center justify-center shadow-lg backdrop-blur-md transition-all active:scale-90 cursor-pointer ${
                isWomen
                  ? 'border-[#F1DDE3] text-[#F47B70] hover:bg-rose-50'
                  : 'border-[#E7DED5] text-[#FF6422] hover:bg-orange-50'
              }`}
              title="Recenter on my location"
            >
              <Crosshair className="w-5 h-5" />
            </button>
            <div className="bg-white/95 border border-[#E7DED5] rounded-2xl flex flex-col shadow-lg backdrop-blur-md overflow-hidden">
              <button
                type="button"
                onClick={() => handleZoom(1)}
                className={`w-10 h-10 flex items-center justify-center text-stone-700 hover:bg-stone-50 transition-colors cursor-pointer ${
                  isWomen ? 'hover:text-[#F47B70]' : 'hover:text-[#FF6422]'
                }`}
                title="Zoom in"
              >
                <Plus className="w-4 h-4" />
              </button>
              <div className="w-full h-px bg-stone-200" />
              <button
                type="button"
                onClick={() => handleZoom(-1)}
                className={`w-10 h-10 flex items-center justify-center text-stone-700 hover:bg-stone-50 transition-colors cursor-pointer ${
                  isWomen ? 'hover:text-[#F47B70]' : 'hover:text-[#FF6422]'
                }`}
                title="Zoom out"
              >
                <Minus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Floating Selected Salon Preview Card */}
          {selectedMarkerSalon && (
            <div className="absolute bottom-4 left-3 right-3 sm:right-auto sm:max-w-md z-20 animate-in slide-in-from-bottom-3 duration-200">
              <div className={`bg-white/95 backdrop-blur-md border rounded-2xl p-3 shadow-2xl flex items-center gap-3 ${
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
                    <span className={`font-bold ${isWomen ? 'text-[#F47B70]' : 'text-[#FF6422]'}`}>
                      {selectedMarkerSalon.rating} ★
                    </span>
                    <span className="text-stone-300">•</span>
                    <span className="text-stone-600 font-semibold truncate">
                      {userLocation
                        ? drivingRoute
                          ? `${drivingRoute.distanceFormatted} · ${drivingRoute.durationFormatted}`
                          : `${calculateHaversineDistance(
                              userLocation.lat,
                              userLocation.lng,
                              selectedMarkerSalon.coordinates.lat,
                              selectedMarkerSalon.coordinates.lng,
                            ).toFixed(1)} km away`
                        : `${selectedMarkerSalon.distanceKm} km`}
                    </span>
                    <span className="text-stone-300">•</span>
                    <span className={`font-bold ${selectedMarkerSalon.isOpen ? 'text-emerald-600' : 'text-stone-400'}`}>
                      {selectedMarkerSalon.isOpen ? `${selectedMarkerSalon.currentQueue} in line` : 'Closed'}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-stone-900 truncate">{selectedMarkerSalon.name}</h4>
                  <p className="text-[11px] text-stone-500 truncate">{selectedMarkerSalon.locality}</p>

                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <button
                      type="button"
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
                      className={`px-3 py-1.5 rounded-xl text-white font-extrabold text-[11px] flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer ${
                        isWomen
                          ? 'bg-[#F47B70] hover:bg-[#E0665B]'
                          : 'bg-[#FF6422] hover:bg-[#E55215]'
                      }`}
                      title="Navigate turn-by-turn in Google Maps"
                    >
                      <Navigation className="w-3.5 h-3.5 fill-white" />
                      <span>Directions in Google Maps ↗</span>
                    </button>

                    {(selectedMarkerSalon.instagramUrl || selectedMarkerSalon.instagramHandle) && (
                      <a
                        href={
                          selectedMarkerSalon.instagramUrl?.startsWith('http')
                            ? selectedMarkerSalon.instagramUrl
                            : `https://instagram.com/${(selectedMarkerSalon.instagramHandle || selectedMarkerSalon.instagramUrl || '').replace(/^@/, '')}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1 rounded-lg border border-rose-200 text-stone-800 hover:text-pink-600 bg-white shadow-xs text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                        title="Visit Salon on Instagram"
                      >
                        <InstagramGradientIcon className="w-3.5 h-3.5" />
                        <span>Insta</span>
                      </a>
                    )}

                    {selectedMarkerSalon.phone && (
                      <a
                        href={`tel:${selectedMarkerSalon.phone}`}
                        className="px-2.5 py-1 rounded-lg border border-stone-200 text-stone-700 hover:text-stone-900 bg-white shadow-xs text-[10px] font-bold flex items-center gap-1 transition-all"
                        title="Call salon"
                      >
                        <Phone className="w-3 h-3 text-emerald-600" />
                        <span>Call</span>
                      </a>
                    )}

                    <button
                      type="button"
                      onClick={() => setSelectedSalonForDetail(selectedMarkerSalon)}
                      className={`text-[11px] font-bold underline flex items-center gap-0.5 cursor-pointer ${
                        isWomen
                          ? 'text-[#F47B70] hover:text-rose-700'
                          : 'text-[#FF6422] hover:text-orange-700'
                      }`}
                    >
                      View Studio →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-28 text-stone-900">
      {/* Header controls & distance entry */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className={`text-[10px] uppercase tracking-widest font-extrabold px-2 py-0.5 rounded border flex items-center gap-1.5 ${
              isWomen
                ? 'bg-rose-100/70 text-[#F47B70] border-rose-200'
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
          <div className="flex items-center bg-white border border-[#E7DED5] rounded-xl px-2.5 py-1 shadow-2xs gap-1.5">
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
                  ? 'bg-rose-50 border-[#F47B70] text-[#F47B70]'
                  : 'bg-orange-50 border-[#FF6422] text-[#FF6422]'
                : 'bg-white border-[#E7DED5] text-stone-700 hover:bg-stone-50'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filters</span>
            {(minRatingFilter > 0 || maxPriceFilter < 1500 || onlyOpenFilter || onlyVerifiedFilter) && (
              <span className="w-2 h-2 rounded-full bg-[#FF6422]" />
            )}
          </button>

        </div>
      </div>

      {/* FILTER DRAWER / EXPANDABLE BAR */}
      {showFilterDrawer && (
        <div className="bg-white border border-[#E7DED5] rounded-2xl p-4 shadow-sm animate-in slide-in-from-top-2 duration-150 space-y-3.5">
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
        <Search className={`w-4 h-4 absolute left-3.5 top-3 ${isWomen ? 'text-[#F47B70]' : 'text-[#FF6422]'}`} />
        <input
          type="text"
          value={mapSearch}
          onChange={(e) => setMapSearch(e.target.value)}
          placeholder={isWomen ? "Search salon name, locality or PIN code on map..." : "Search salon name, locality or PIN code on map..."}
          className={`w-full pl-10 pr-4 py-2.5 bg-white border rounded-2xl text-xs text-stone-900 placeholder-stone-400 focus:outline-none shadow-sm transition-colors ${
            isWomen
              ? 'border-[#F1DDE3] focus:border-[#F47B70] focus:ring-1 focus:ring-[#F47B70]'
              : 'border-[#E7DED5] focus:border-[#FF6422] focus:ring-1 focus:ring-[#FF6422]'
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

      {/* Pure Full-Width Map Layout (No Sidebar Listing) */}
      <div className="relative rounded-3xl overflow-hidden border shadow-md min-h-[520px] h-[72vh] lg:h-[700px] border-[#E7DED5] bg-[#FAF7F2]">
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
          <div className="absolute top-4 left-4 z-20 hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/95 backdrop-blur-md border border-[#E7DED5] text-[11px] font-bold text-stone-800 shadow-md animate-in fade-in">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>
              Distance to <strong className="text-stone-900">{selectedMarkerSalon.name}</strong>:{' '}
              <span className={isWomen ? 'text-[#F47B70]' : 'text-[#FF6422]'}>
                {drivingRoute ? `${drivingRoute.distanceFormatted} (${drivingRoute.durationFormatted} ${drivingRoute.travelMode === 'walking' ? 'walk' : 'drive'})` : `${calculateHaversineDistance(
                  userLocation.lat,
                  userLocation.lng,
                  selectedMarkerSalon.coordinates.lat,
                  selectedMarkerSalon.coordinates.lng,
                ).toFixed(1)} km`}
              </span>
            </span>
          </div>
        ) : !userLocation ? (
          <button
            onClick={requestDeviceLocation}
            className="absolute top-4 left-4 z-20 px-3 py-1.5 rounded-xl bg-white/95 backdrop-blur-md border border-orange-200 text-[11px] font-bold text-orange-900 shadow-md flex items-center gap-1.5 hover:bg-orange-50 transition-colors animate-in fade-in cursor-pointer"
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
            className={`absolute top-4 left-1/2 -translate-x-1/2 z-20 px-4 py-2 rounded-2xl text-white text-xs font-black shadow-lg flex items-center gap-2 transition-transform active:scale-95 animate-in fade-in cursor-pointer ${
              isWomen
                ? 'bg-[#F47B70] shadow-rose-500/25 hover:bg-[#E0665B]'
                : 'bg-[#FF6422] shadow-orange-500/25 hover:bg-[#E55215]'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Search This Area</span>
          </button>
        )}

        {/* Google Maps Official Open in App shortcut badge */}
        <div className="absolute top-4 right-4 z-20 hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/90 backdrop-blur-md border border-[#E7DED5] text-[11px] font-bold text-stone-700 shadow-sm">
          <span className={isWomen ? 'text-[#F47B70]' : 'text-[#FF6422]'}>Google Maps</span>
          <button
            onClick={() => openGoogleMapsLocation(currentCoords.lat, currentCoords.lng)}
            className="text-stone-500 hover:text-stone-900 flex items-center gap-1 cursor-pointer"
            title="Launch in Google Maps"
          >
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>

        {/* Map Controls (Zoom in/out + My Location) */}
        <div className="absolute bottom-6 right-4 z-20 flex flex-col gap-2">
          <button
            onClick={handlePanToUser}
            className={`w-10 h-10 rounded-2xl bg-white/95 border flex items-center justify-center shadow-md backdrop-blur-md transition-all active:scale-90 cursor-pointer ${
              isWomen
                ? 'border-[#F1DDE3] text-[#F47B70] hover:bg-rose-50'
                : 'border-[#E7DED5] text-[#FF6422] hover:bg-orange-50'
            }`}
            title="Center on my location"
          >
            <Crosshair className="w-5 h-5" />
          </button>
          <div className="bg-white/95 border border-[#E7DED5] rounded-2xl flex flex-col shadow-md backdrop-blur-md overflow-hidden">
            <button
              onClick={() => handleZoom(1)}
              className={`w-10 h-10 flex items-center justify-center text-stone-700 hover:bg-stone-50 transition-colors cursor-pointer ${
                isWomen ? 'hover:text-[#F47B70]' : 'hover:text-[#FF6422]'
              }`}
              title="Zoom in"
            >
              <Plus className="w-4 h-4" />
            </button>
            <div className="w-full h-px bg-stone-200" />
            <button
              onClick={() => handleZoom(-1)}
              className={`w-10 h-10 flex items-center justify-center text-stone-700 hover:bg-stone-50 transition-colors cursor-pointer ${
                isWomen ? 'hover:text-[#F47B70]' : 'hover:text-[#FF6422]'
              }`}
              title="Zoom out"
            >
              <Minus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Selected Salon Floating Card (Overlay at bottom of map) */}
        {selectedMarkerSalon && (
          <div className="absolute bottom-4 left-3 right-16 sm:right-auto sm:max-w-md z-20 animate-in slide-in-from-bottom-3 duration-200">
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
                  <span className={`font-bold ${isWomen ? 'text-[#F47B70]' : 'text-[#FF6422]'}`}>
                    {selectedMarkerSalon.rating} ★
                  </span>
                  <span className="text-stone-300">•</span>
                  <span className="text-stone-600 font-semibold">
                    {userLocation
                      ? drivingRoute
                        ? `${drivingRoute.distanceFormatted} · ${drivingRoute.durationFormatted} ${drivingRoute.travelMode === 'walking' ? 'walk' : 'drive'}`
                        : `${calculateHaversineDistance(
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
                    className={`px-2.5 py-1 rounded-lg text-white font-extrabold text-[10px] flex items-center gap-1 transition-colors shadow-sm cursor-pointer ${
                      isWomen
                        ? 'bg-[#F47B70] hover:bg-[#E0665B]'
                        : 'bg-[#FF6422] hover:bg-[#E55215]'
                    }`}
                    title="Navigate turn-by-turn in Google Maps"
                  >
                    <Navigation className="w-3 h-3 fill-white" />
                    <span>Navigate ↗</span>
                  </button>

                  {/* View Details button */}
                  {(selectedMarkerSalon.instagramUrl || selectedMarkerSalon.instagramHandle) && (
                    <a
                      href={
                        selectedMarkerSalon.instagramUrl?.startsWith('http')
                          ? selectedMarkerSalon.instagramUrl
                          : `https://instagram.com/${(selectedMarkerSalon.instagramHandle || selectedMarkerSalon.instagramUrl || '').replace(/^@/, '')}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2 py-1 rounded-lg border border-rose-200 text-stone-800 hover:text-pink-600 bg-white shadow-xs text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                      title="Visit Salon on Instagram"
                    >
                      <InstagramGradientIcon className="w-3.5 h-3.5" />
                      <span>Insta</span>
                    </a>
                  )}

                  {selectedMarkerSalon.phone && (
                    <a
                      href={`tel:${selectedMarkerSalon.phone}`}
                      className="px-2 py-1 rounded-lg border border-stone-200 text-stone-700 hover:text-stone-900 bg-white shadow-xs text-[10px] font-bold flex items-center gap-1 transition-all"
                      title="Call salon"
                    >
                      <Phone className="w-3 h-3 text-emerald-600" />
                      <span>Call</span>
                    </a>
                  )}

                  <button
                    onClick={() => setSelectedSalonForDetail(selectedMarkerSalon)}
                    className={`text-[10px] font-bold underline flex items-center gap-0.5 cursor-pointer ${
                      isWomen
                        ? 'text-[#F47B70] hover:text-rose-700'
                        : 'text-[#FF6422] hover:text-orange-700'
                    }`}
                  >
                    Studio Details →
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
