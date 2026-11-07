import { calculateHaversineDistance } from './googleMaps';

export interface DrivingRouteResult {
  /** Array of [latitude, longitude] coordinates along actual roads */
  coordinates: [number, number][];
  distanceMeters: number;
  distanceKm: number;
  distanceFormatted: string;
  durationMinutes: number;
  durationFormatted: string;
  isRoadRoute: boolean;
}

const routeCache = new Map<string, DrivingRouteResult>();

/**
 * Fetches accurate driving road route and distance (like Google Maps)
 * 1. Tries Google Maps DirectionsService if client has Google Maps loaded
 * 2. Falls back to OSRM Open Routing API (zero-key, free, instant turn-by-turn road geometry)
 * 3. Gracefully falls back to geodesic displacement if offline/unreachable
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
      distanceMeters: 0,
      distanceKm: 0,
      distanceFormatted: '0 km',
      durationMinutes: 0,
      durationFormatted: '0 min',
      isRoadRoute: false,
    };
  }

  const cacheKey = `${oLat.toFixed(4)},${oLng.toFixed(4)}->${dLat.toFixed(4)},${dLng.toFixed(4)}`;
  const cached = routeCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  // Helper formatters
  const formatResult = (
    coords: [number, number][],
    distMeters: number,
    durSeconds: number,
    isRoad: boolean
  ): DrivingRouteResult => {
    const distKm = Math.round((distMeters / 1000) * 10) / 10;
    const distFormatted = distKm < 1 ? `${Math.round(distMeters)} m` : `${distKm.toFixed(1)} km`;
    const durMins = Math.max(1, Math.round(durSeconds / 60));
    const durFormatted = durMins >= 60 ? `${Math.floor(durMins / 60)}h ${durMins % 60}m` : `~${durMins} min`;

    const res: DrivingRouteResult = {
      coordinates: coords,
      distanceMeters: Math.round(distMeters),
      distanceKm: distKm,
      distanceFormatted: distFormatted,
      durationMinutes: durMins,
      durationFormatted: durFormatted,
      isRoadRoute: isRoad,
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

  // 3. Fallback: Haversine displacement distance with straight line
  const directKm = calculateHaversineDistance(oLat, oLng, dLat, dLng);
  // Real driving distance in urban areas is roughly 1.3x - 1.4x straight air displacement
  const estimatedDrivingKm = Math.round(directKm * 1.35 * 10) / 10;
  const estimatedMeters = estimatedDrivingKm * 1000;
  const estimatedMinutes = Math.max(1, Math.round(estimatedDrivingKm * 2.5));

  return formatResult(
    [[oLat, oLng], [dLat, dLng]],
    estimatedMeters,
    estimatedMinutes * 60,
    false
  );
}
