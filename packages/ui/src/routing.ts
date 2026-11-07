import { calculateHaversineDistance } from './googleMaps';

export interface DrivingRouteResult {
  /** Array of [latitude, longitude] coordinates along the complete journey */
  coordinates: [number, number][];
  /** Off-road displacement from user GPS to the nearest road entry point (shortest distance to road) */
  userDisplacement: [number, number][] | null;
  /** Road/pathway coordinates along actual streets or campus walkways */
  roadCoordinates: [number, number][];
  /** Off-road displacement from road exit point to the shop pin (shortest distance to shop when road ends) */
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
  travelMode: 'walking' | 'driving' | 'direct';
}

const routeCache = new Map<string, DrivingRouteResult>();

/**
 * Intelligent Navigation Routing for India:
 * 1. Finds shortest distance from user location to the nearest accessible road and connects to it.
 * 2. Passes along the road network as far as road connectivity goes towards the destination.
 * 3. If there isn't road connectivity directly reaching the shop (e.g. inside a lane, bazaar, colony,
 *    or campus), selects the shortest direct distance from the road exit point to the destination pin.
 * 4. If there is NO road connectivity at all, or if following the road creates an absurd detour
 *    (e.g. 6 km outer loop when the shop is only 150m away), selects the direct shortest distance to reach.
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
      distanceFormatted: '0 m',
      durationMinutes: 0,
      durationFormatted: '0 min',
      isRoadRoute: false,
      hasUserDisplacement: false,
      hasShopDisplacement: false,
      routeSummaryLabel: 'Direct',
      travelMode: 'direct',
    };
  }

  const directKm = calculateHaversineDistance(oLat, oLng, dLat, dLng);
  const directMeters = Math.max(10, Math.round(directKm * 1000));
  const cacheKey = `${oLat.toFixed(4)},${oLng.toFixed(4)}->${dLat.toFixed(4)},${dLng.toFixed(4)}`;
  const cached = routeCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  // Format helper: Connects User -> Nearest Road -> Road Navigation -> Road Exit -> Shop Pin
  const formatResult = (
    rawCoords: [number, number][],
    roadDistMeters: number,
    roadDurSeconds: number,
    isRoad: boolean,
    mode: 'walking' | 'driving' | 'direct'
  ): DrivingRouteResult => {
    let userDisplacement: [number, number][] | null = null;
    let shopDisplacement: [number, number][] | null = null;
    let userToRoadM = 0;
    let roadToShopM = 0;

    let fullCoordinates: [number, number][] = [];

    if (isRoad && rawCoords.length > 0) {
      const roadStart = rawCoords[0];
      const roadEnd = rawCoords[rawCoords.length - 1];

      // 1. Find shortest distance to road and connect user to it (if not already on road > 3m)
      userToRoadM = calculateHaversineDistance(oLat, oLng, roadStart[0], roadStart[1]) * 1000;
      if (userToRoadM > 3) {
        userDisplacement = [[oLat, oLng], roadStart];
      }

      // 2. If there isn't road connectivity directly reaching the shop, select shortest distance from road to shop
      roadToShopM = calculateHaversineDistance(roadEnd[0], roadEnd[1], dLat, dLng) * 1000;
      if (roadToShopM > 3) {
        shopDisplacement = [roadEnd, [dLat, dLng]];
      }

      const totalJourneyM = Math.round(userToRoadM + roadDistMeters + roadToShopM);

      // 3. Indian Detour & Connectivity Check:
      // If taking the road creates a huge detour (> 2.2x direct distance for trips under 2.5 km, or > 3.5x overall),
      // or if direct distance is within immediate vicinity (<= 200m) and road is looping away,
      // select the shortest direct distance to reach!
      const isDetour = (totalJourneyM > directMeters * 2.2 && directMeters <= 2500) || (totalJourneyM > directMeters * 3.5);
      if (isDetour && directMeters <= 2500) {
        const directDurMin = Math.max(1, Math.round(directMeters / 75)); // ~4.5 km/h walk
        const resDirect: DrivingRouteResult = {
          coordinates: [[oLat, oLng], [dLat, dLng]],
          userDisplacement: null,
          roadCoordinates: [],
          shopDisplacement: null,
          distanceMeters: directMeters,
          distanceKm: Math.round((directMeters / 1000) * 10) / 10,
          distanceFormatted: directMeters < 1000 ? `${directMeters}m` : `${(directMeters / 1000).toFixed(1)} km`,
          durationMinutes: directDurMin,
          durationFormatted: `${directDurMin} min`,
          isRoadRoute: false,
          hasUserDisplacement: false,
          hasShopDisplacement: false,
          routeSummaryLabel: 'Shortest direct distance',
          travelMode: 'walking',
        };
        routeCache.set(cacheKey, resDirect);
        return resDirect;
      }

      // Unbroken continuous path: User -> Road Entry -> Road Route -> Road Exit -> Shop Pin
      fullCoordinates = [
        ...(userDisplacement ? [[oLat, oLng] as [number, number]] : []),
        ...rawCoords,
        ...(shopDisplacement ? [[dLat, dLng] as [number, number]] : []),
      ];

      const extraDurSeconds = Math.round((userToRoadM + roadToShopM) / 1.3); // pedestrian connector speed
      const totalDistMeters = Math.max(10, totalJourneyM);
      const distKm = Math.round((totalDistMeters / 1000) * 10) / 10;
      const distFormatted = totalDistMeters < 1000 ? `${totalDistMeters}m` : `${distKm.toFixed(1)} km`;

      let totalDurSec = roadDurSeconds + extraDurSeconds;
      if (mode === 'walking' && totalDurSec === 0) {
        totalDurSec = Math.round(totalDistMeters / 1.25);
      }
      const durMins = Math.max(1, Math.round(totalDurSec / 60));
      const durFormatted = durMins >= 60 ? `${Math.floor(durMins / 60)}h ${durMins % 60}m` : `${durMins} min`;

      let summaryLabel = mode === 'walking' ? 'Walking path' : 'Via Road';
      if (userDisplacement && shopDisplacement) {
        summaryLabel = 'Road + shortest connectors';
      }

      const res: DrivingRouteResult = {
        coordinates: fullCoordinates,
        userDisplacement,
        roadCoordinates: rawCoords,
        shopDisplacement,
        distanceMeters: totalDistMeters,
        distanceKm: distKm,
        distanceFormatted: distFormatted,
        durationMinutes: durMins,
        durationFormatted: durFormatted,
        isRoadRoute: true,
        hasUserDisplacement: Boolean(userDisplacement),
        hasShopDisplacement: Boolean(shopDisplacement),
        routeSummaryLabel: summaryLabel,
        travelMode: mode,
      };

      routeCache.set(cacheKey, res);
      return res;
    }

    // Fallback: If there isn't road connectivity at all, select shortest direct distance
    const directMinutes = Math.max(1, Math.round(directMeters / 75));
    const fallbackRes: DrivingRouteResult = {
      coordinates: [[oLat, oLng], [dLat, dLng]],
      userDisplacement: null,
      roadCoordinates: [],
      shopDisplacement: null,
      distanceMeters: directMeters,
      distanceKm: Math.round((directMeters / 1000) * 10) / 10,
      distanceFormatted: directMeters < 1000 ? `${directMeters}m` : `${(directMeters / 1000).toFixed(1)} km`,
      durationMinutes: directMinutes,
      durationFormatted: `${directMinutes} min`,
      isRoadRoute: false,
      hasUserDisplacement: false,
      hasShopDisplacement: false,
      routeSummaryLabel: 'Shortest direct distance',
      travelMode: directKm <= 1.2 ? 'walking' : 'direct',
    };

    routeCache.set(cacheKey, fallbackRes);
    return fallbackRes;
  };

  // Google Maps / OSRM logic:
  // Short trip (<= 1.2 km): Preferred mode is Walking (campus, neighborhood, gullies)
  // Longer trip (> 1.2 km): Preferred mode is Driving
  const preferredMode: 'walking' | 'driving' = directKm <= 1.2 ? 'walking' : 'driving';

  // 1. Google Maps DirectionsService (if available)
  if (typeof window !== 'undefined' && (window as any).google?.maps?.DirectionsService) {
    try {
      const gmaps = (window as any).google.maps;
      const directionsService = new gmaps.DirectionsService();

      const queryGoogle = (mode: any) =>
        new Promise<any>((resolve) => {
          directionsService.route(
            {
              origin: new gmaps.LatLng(oLat, oLng),
              destination: new gmaps.LatLng(dLat, dLng),
              travelMode: mode,
            },
            (result: any, status: any) => {
              if (status === gmaps.DirectionsStatus.OK && result?.routes?.[0]?.legs?.[0]) {
                const leg = result.routes[0].legs[0];
                const path = result.routes[0].overview_path || [];
                const coords: [number, number][] = path.map((p: any) => [p.lat(), p.lng()]);
                const distM = leg.distance?.value || 0;
                const durS = leg.duration?.value || 0;
                resolve({ coords, distM, durS });
              } else {
                resolve(null);
              }
            }
          );
        });

      if (preferredMode === 'walking') {
        const walkData = await queryGoogle(gmaps.TravelMode.WALKING);
        if (walkData && walkData.coords.length > 0) {
          return formatResult(walkData.coords, walkData.distM, walkData.durS, true, 'walking');
        }
      } else {
        const driveData = await queryGoogle(gmaps.TravelMode.DRIVING);
        if (driveData && driveData.coords.length > 0) {
          if (driveData.distM > directKm * 1000 * 2.2 && directKm <= 2.5) {
            const walkData = await queryGoogle(gmaps.TravelMode.WALKING);
            if (walkData && walkData.coords.length > 0 && walkData.distM < driveData.distM * 0.7) {
              return formatResult(walkData.coords, walkData.distM, walkData.durS, true, 'walking');
            }
          }
          return formatResult(driveData.coords, driveData.distM, driveData.durS, true, 'driving');
        }
      }
    } catch {
      // Fall through to OSRM
    }
  }

  // 2. OSRM High-Speed Network
  const queryOsrm = async (profile: 'foot' | 'driving'): Promise<{ coords: [number, number][]; distM: number; durS: number } | null> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const url = profile === 'foot'
        ? `https://router.project-osrm.org/route/v1/foot/${oLng},${oLat};${dLng},${dLat}?overview=full&geometries=geojson`
        : `https://router.project-osrm.org/route/v1/driving/${oLng},${oLat};${dLng},${dLat}?overview=full&geometries=geojson`;

      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (data.code === 'Ok' && data.routes && data.routes[0]) {
          const route = data.routes[0];
          const coords: [number, number][] = route.geometry.coordinates.map(
            ([lng, lat]: [number, number]) => [lat, lng]
          );
          return {
            coords,
            distM: Number(route.distance) || 0,
            durS: Number(route.duration) || 0,
          };
        }
      }
    } catch {
      // continue to backup
    }

    if (profile === 'foot') {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);
        const osmFootUrl = `https://routing.openstreetmap.de/routed-foot/route/v1/driving/${oLng},${oLat};${dLng},${dLat}?overview=full&geometries=geojson`;
        const res = await fetch(osmFootUrl, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();
          if (data.code === 'Ok' && data.routes && data.routes[0]) {
            const route = data.routes[0];
            const coords: [number, number][] = route.geometry.coordinates.map(
              ([lng, lat]: [number, number]) => [lat, lng]
            );
            return {
              coords,
              distM: Number(route.distance) || 0,
              durS: Number(route.duration) || 0,
            };
          }
        }
      } catch {
        // continue
      }
    }
    return null;
  };

  if (preferredMode === 'walking') {
    const footRes = await queryOsrm('foot');
    if (footRes && footRes.coords.length > 0) {
      return formatResult(footRes.coords, footRes.distM, footRes.durS, true, 'walking');
    }
    const driveRes = await queryOsrm('driving');
    if (driveRes && driveRes.coords.length > 0) {
      return formatResult(driveRes.coords, driveRes.distM, driveRes.durS, true, 'driving');
    }
  } else {
    const driveRes = await queryOsrm('driving');
    if (driveRes && driveRes.coords.length > 0) {
      if (driveRes.distM > directKm * 1000 * 2.2 && directKm <= 2.5) {
        const footRes = await queryOsrm('foot');
        if (footRes && footRes.coords.length > 0 && footRes.distM < driveRes.distM * 0.7) {
          return formatResult(footRes.coords, footRes.distM, footRes.durS, true, 'walking');
        }
      }
      return formatResult(driveRes.coords, driveRes.distM, driveRes.durS, true, 'driving');
    }
    const footRes = await queryOsrm('foot');
    if (footRes && footRes.coords.length > 0) {
      return formatResult(footRes.coords, footRes.distM, footRes.durS, true, 'walking');
    }
  }

  // 3. If there isn't road connectivity on the map network, select shortest direct distance
  return formatResult([], directMeters, Math.max(60, Math.round(directMeters / 1.25)), false, directKm <= 1.2 ? 'walking' : 'direct');
}
