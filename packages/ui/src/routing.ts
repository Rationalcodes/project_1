import { calculateHaversineDistance } from './googleMaps';

export interface DrivingRouteResult {
  /** Array of [latitude, longitude] coordinates along the complete journey */
  coordinates: [number, number][];
  /** Off-road displacement from user GPS to the nearest road/walkway entry point (if user is off-road, max 75m) */
  userDisplacement: [number, number][] | null;
  /** Road/pathway coordinates along actual streets or campus walkways */
  roadCoordinates: [number, number][];
  /** Off-road displacement from the road/walkway exit point to the shop pin (if shop is off-road, max 75m) */
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
 * Intelligent Google Maps-style navigation routing:
 * 1. Straight-line distance <= 1.2 km: Defaults to walking / campus walkways (like Google Maps 2 min, 140m).
 * 2. Straight-line distance > 1.2 km: Evaluates driving along roads.
 * 3. Detour detection: If driving detour is > 2.2x direct distance for trips under 2.5 km (e.g. car blocked by campus gates),
 *    evaluates walking paths and selects the pedestrian route.
 * 4. Displacement connectors: Clamped to max 75m so unnatural diagonal lines are never drawn across campus fields.
 * 5. Returns precise travelMode ('walking' | 'driving') for authentic Google Maps styling.
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
  const cacheKey = `${oLat.toFixed(4)},${oLng.toFixed(4)}->${dLat.toFixed(4)},${dLng.toFixed(4)}`;
  const cached = routeCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  // Helper formatters with user displacement + route travel
  const formatResult = (
    rawCoords: [number, number][],
    distMeters: number,
    durSeconds: number,
    isRoad: boolean,
    mode: 'walking' | 'driving' | 'direct'
  ): DrivingRouteResult => {
    let userDisplacement: [number, number][] | null = null;
    let shopDisplacement: [number, number][] | null = null;
    let extraDistMeters = 0;
    let extraDurSeconds = 0;

    let fullCoordinates: [number, number][] = [];

    if (isRoad && rawCoords.length > 0) {
      const roadStart = rawCoords[0];
      const roadEnd = rawCoords[rawCoords.length - 1];

      // Displacement from user location to pathway/road entrance:
      // Only draw connector if within realistic walking/entrance proximity (6m to 75m).
      // Never draw an unnatural line across hundreds of meters of buildings or fields!
      const userToRoadM = calculateHaversineDistance(oLat, oLng, roadStart[0], roadStart[1]) * 1000;
      if (userToRoadM >= 6 && userToRoadM <= 75) {
        userDisplacement = [[oLat, oLng], roadStart];
        extraDistMeters += userToRoadM;
        extraDurSeconds += Math.round(userToRoadM / 1.3);
      }

      // Displacement from pathway/road exit to shop pin:
      // Only draw connector if within realistic entrance proximity (6m to 75m).
      const roadToShopM = calculateHaversineDistance(roadEnd[0], roadEnd[1], dLat, dLng) * 1000;
      if (roadToShopM >= 6 && roadToShopM <= 75) {
        shopDisplacement = [roadEnd, [dLat, dLng]];
        extraDistMeters += roadToShopM;
        extraDurSeconds += Math.round(roadToShopM / 1.3);
      }

      fullCoordinates = [
        ...(userDisplacement ? [[oLat, oLng] as [number, number]] : []),
        ...rawCoords,
        ...(shopDisplacement ? [[dLat, dLng] as [number, number]] : []),
      ];
    } else {
      fullCoordinates = [[oLat, oLng], [dLat, dLng]];
    }

    const totalDistMeters = Math.max(10, Math.round(distMeters + extraDistMeters));
    const distKm = Math.round((totalDistMeters / 1000) * 10) / 10;
    // Format distance: under 1 km shows meters like Google Maps (e.g. "140m")
    const distFormatted = totalDistMeters < 1000 ? `${totalDistMeters}m` : `${distKm.toFixed(1)} km`;

    // Speed estimation: pedestrian walking ~1.25 m/s (~4.5 km/h), driving from router
    let totalDurSec = durSeconds + extraDurSeconds;
    if (mode === 'walking' && totalDurSec === 0) {
      totalDurSec = Math.round(totalDistMeters / 1.25);
    }
    const durMins = Math.max(1, Math.round(totalDurSec / 60));
    const durFormatted = durMins >= 60 ? `${Math.floor(durMins / 60)}h ${durMins % 60}m` : `${durMins} min`;

    let summaryLabel = mode === 'walking' ? 'Walking path' : 'Via Road';
    if (!isRoad) summaryLabel = 'Direct';

    const res: DrivingRouteResult = {
      coordinates: fullCoordinates,
      userDisplacement,
      roadCoordinates: isRoad ? rawCoords : [],
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
      travelMode: mode,
    };

    routeCache.set(cacheKey, res);
    return res;
  };

  // Google Maps logic:
  // Direct distance <= 1.2 km -> Preferred mode is Walking (campus, neighborhood, footpaths)
  // Direct distance > 1.2 km -> Preferred mode is Driving
  const preferredMode: 'walking' | 'driving' = directKm <= 1.2 ? 'walking' : 'driving';

  // 1. Try Google Maps DirectionsService if window.google is loaded
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
          // Detour check: if driving requires a massive detour (> 2.2x direct distance) and direct distance is <= 2.5 km,
          // check if walking gives a cleaner campus/pedestrian path
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
  // Helper to query OSRM or OSM routed-foot
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

    // Backup for foot routing: OSM routed-foot
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
    // If foot router failed, try driving
    const driveRes = await queryOsrm('driving');
    if (driveRes && driveRes.coords.length > 0) {
      return formatResult(driveRes.coords, driveRes.distM, driveRes.durS, true, 'driving');
    }
  } else {
    // Preferred mode is driving
    const driveRes = await queryOsrm('driving');
    if (driveRes && driveRes.coords.length > 0) {
      // Detour check: if driving distance is > 2.2x direct distance and direct distance is <= 2.5 km,
      // try foot router to see if a direct campus or pedestrian path exists
      if (driveRes.distM > directKm * 1000 * 2.2 && directKm <= 2.5) {
        const footRes = await queryOsrm('foot');
        if (footRes && footRes.coords.length > 0 && footRes.distM < driveRes.distM * 0.7) {
          return formatResult(footRes.coords, footRes.distM, footRes.durS, true, 'walking');
        }
      }
      return formatResult(driveRes.coords, driveRes.distM, driveRes.durS, true, 'driving');
    }
    // If driving router failed, try foot
    const footRes = await queryOsrm('foot');
    if (footRes && footRes.coords.length > 0) {
      return formatResult(footRes.coords, footRes.distM, footRes.durS, true, 'walking');
    }
  }

  // 3. Fallback: If no road/pathway found, direct displacement
  const directMeters = Math.round(directKm * 1000);
  const directMinutes = Math.max(1, Math.round(preferredMode === 'walking' ? directMeters / 75 : directKm * 3));

  return formatResult(
    [[oLat, oLng], [dLat, dLng]],
    directMeters,
    directMinutes * 60,
    false,
    directKm <= 1.2 ? 'walking' : 'direct'
  );
}
