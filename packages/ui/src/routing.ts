import { calculateHaversineDistance } from './googleMaps';

export interface DrivingRouteResult {
  /** Array of [latitude, longitude] coordinates along the complete journey */
  coordinates: [number, number][];
  /** Off-road displacement from user GPS to the nearest road entry point (if user is off-road) */
  userDisplacement: [number, number][] | null;
  /** Road driving coordinates along actual streets and turns */
  roadCoordinates: [number, number][];
  /** Off-road displacement from the road exit point to the shop pin (if shop is off-road) */
  shopDisplacement: [number, number][] | null;
  distanceMeters: number;
  distanceKm: number;
  distanceFormatted: string;
  durationMinutes: number;
  durationFormatted: string;
  isRoadRoute: boolean;
  hasUserDisplacement: boolean;
  hasShopDisplacement: boolean;
  routeSummaryLabel: string;
}

const routeCache = new Map<string, DrivingRouteResult>();

/**
 * Fetches accurate Google Maps-style navigation routing:
 * 1. If user is off-road (e.g. inside building/park), takes direct displacement from user -> nearest road
 * 2. Follows proper road travel (turn-by-turn road network) along actual streets to reach the shop
 * 3. If shop is set back off-road, takes displacement from road -> exact shop pin
 * 4. If no road route exists at all between points, falls back to direct displacement
 */
export async function fetchDrivingRoute(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number }
): Promise<DrivingRouteResult> {
  const oLat = Number(origin.lat);
  const oLng = Number(origin.lng);
  const dLat = Number(destination.lat);
  const dLng = Number(destination.lng);

  if (!Number.isFinite(oLat) || !Number.isFinite(oLng) || !Number.isFinite(dLat) || !Number.isFinite(dLng)) {
    return {
      coordinates: [],
      userDisplacement: null,
      roadCoordinates: [],
      shopDisplacement: null,
      distanceMeters: 0,
      distanceKm: 0,
      distanceFormatted: '0 km',
      durationMinutes: 0,
      durationFormatted: '0 min',
      isRoadRoute: false,
      hasUserDisplacement: false,
      hasShopDisplacement: false,
      routeSummaryLabel: 'Direct',
    };
  }

  const cacheKey = `${oLat.toFixed(4)},${oLng.toFixed(4)}->${dLat.toFixed(4)},${dLng.toFixed(4)}`;
  const cached = routeCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  // Helper formatters with user displacement + road travel
  const formatResult = (
    rawRoadCoords: [number, number][],
    roadDistMeters: number,
    roadDurSeconds: number,
    isRoad: boolean
  ): DrivingRouteResult => {
    let userDisplacement: [number, number][] | null = null;
    let shopDisplacement: [number, number][] | null = null;
    let extraDistMeters = 0;
    let extraDurSeconds = 0;

    let fullCoordinates: [number, number][] = [];

    if (isRoad && rawRoadCoords.length > 0) {
      const roadStart = rawRoadCoords[0];
      const roadEnd = rawRoadCoords[rawRoadCoords.length - 1];

      // Displacement from user location to road entrance (if off-road > 8m)
      const userToRoadM = calculateHaversineDistance(oLat, oLng, roadStart[0], roadStart[1]) * 1000;
      if (userToRoadM > 8) {
        userDisplacement = [[oLat, oLng], roadStart];
        extraDistMeters += userToRoadM;
        extraDurSeconds += Math.round(userToRoadM / 1.3); // ~4.7 km/h walking to road
      }

      // Displacement from road exit to shop pin (if off-road > 8m)
      const roadToShopM = calculateHaversineDistance(roadEnd[0], roadEnd[1], dLat, dLng) * 1000;
      if (roadToShopM > 8) {
        shopDisplacement = [roadEnd, [dLat, dLng]];
        extraDistMeters += roadToShopM;
        extraDurSeconds += Math.round(roadToShopM / 1.3); // ~4.7 km/h walking to shop
      }

      // Build complete unbroken path: User GPS -> Road Entry -> Road Route -> Shop Pin
      fullCoordinates = [
        ...(userDisplacement ? [[oLat, oLng] as [number, number]] : []),
        ...rawRoadCoords,
        ...(shopDisplacement ? [[dLat, dLng] as [number, number]] : []),
      ];
    } else {
      fullCoordinates = [[oLat, oLng], [dLat, dLng]];
      userDisplacement = [[oLat, oLng], [dLat, dLng]];
    }

    const totalDistMeters = Math.round(roadDistMeters + extraDistMeters);
    const distKm = Math.round((totalDistMeters / 1000) * 10) / 10;
    const distFormatted = distKm < 1 ? `${totalDistMeters} m` : `${distKm.toFixed(1)} km`;
    const totalDurSeconds = Math.round(roadDurSeconds + extraDurSeconds);
    const durMins = Math.max(1, Math.round(totalDurSeconds / 60));
    const durFormatted = durMins >= 60 ? `${Math.floor(durMins / 60)}h ${durMins % 60}m` : `~${durMins} min`;

    let summaryLabel = 'Via Road';
    if (userDisplacement && isRoad) {
      summaryLabel = 'Walk to road + Drive';
    } else if (!isRoad) {
      summaryLabel = 'Direct';
    }

    const res: DrivingRouteResult = {
      coordinates: fullCoordinates,
      userDisplacement,
      roadCoordinates: isRoad ? rawRoadCoords : [],
      shopDisplacement,
      distanceMeters: totalDistMeters,
      distanceKm: distKm,
      distanceFormatted: distFormatted,
      durationMinutes: durMins,
      durationFormatted: durFormatted,
      isRoadRoute: isRoad,
      hasUserDisplacement: Boolean(userDisplacement),
      hasShopDisplacement: Boolean(shopDisplacement),
      routeSummaryLabel: summaryLabel,
    };
    routeCache.set(cacheKey, res);
    return res;
  };

  // 1. Try Google Maps DirectionsService if window.google is loaded
  if (typeof window !== 'undefined' && (window as any).google?.maps?.DirectionsService) {
    try {
      const gmaps = (window as any).google.maps;
      const directionsService = new gmaps.DirectionsService();

      const googleRoute = await new Promise<DrivingRouteResult | null>((resolve) => {
        directionsService.route(
          {
            origin: new gmaps.LatLng(oLat, oLng),
            destination: new gmaps.LatLng(dLat, dLng),
            travelMode: gmaps.TravelMode.DRIVING,
          },
          (result: any, status: any) => {
            if (status === gmaps.DirectionsStatus.OK && result?.routes?.[0]?.legs?.[0]) {
              const leg = result.routes[0].legs[0];
              const path = result.routes[0].overview_path || [];
              const coords: [number, number][] = path.map((p: any) => [p.lat(), p.lng()]);
              const distMeters = leg.distance?.value || 0;
              const durSeconds = leg.duration?.value || 0;
              resolve(formatResult(coords, distMeters, durSeconds, true));
            } else {
              resolve(null);
            }
          }
        );
      });

      if (googleRoute && googleRoute.coordinates.length > 0) {
        return googleRoute;
      }
    } catch {
      // Fall through to OSRM
    }
  }

  // 2. Try OSRM (Open Source Routing Machine) high-speed road network
  try {
    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${oLng},${oLat};${dLng},${dLat}?overview=full&geometries=geojson`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const response = await fetch(osrmUrl, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      if (data.code === 'Ok' && data.routes && data.routes[0]) {
        const route = data.routes[0];
        // OSRM returns coordinates as [lng, lat] GeoJSON -> convert to [lat, lng]
        const coords: [number, number][] = route.geometry.coordinates.map(
          ([lng, lat]: [number, number]) => [lat, lng]
        );
        const distMeters = Number(route.distance) || 0;
        const durSeconds = Number(route.duration) || 0;

        return formatResult(coords, distMeters, durSeconds, true);
      }
    }
  } catch {
    // Fall through to fallback
  }

  // 3. Fallback: If no road on map at all, take direct displacement
  const directKm = calculateHaversineDistance(oLat, oLng, dLat, dLng);
  const directMeters = Math.round(directKm * 1000);
  const directMinutes = Math.max(1, Math.round(directKm * 3));

  return formatResult(
    [[oLat, oLng], [dLat, dLng]],
    directMeters,
    directMinutes * 60,
    false
  );
}
