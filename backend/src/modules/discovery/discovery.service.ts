import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SalonsService } from '../salons/salons.service';
import { NearbySalonsQueryDto, LazyFilterOption } from './dto/nearby-salons-query.dto';
import {
  NearbySalonsResponseDto,
  NearbySalonItemDto,
} from './dto/nearby-salon-response.dto';

@Injectable()
export class DiscoveryService {
  private readonly logger = new Logger(DiscoveryService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly salonsService: SalonsService,
  ) {}

  /**
   * Spherical Haversine distance in km between two coordinate pairs
   */
  private calculateHaversineDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371.0; // Earth radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180.0;
    const dLon = ((lon2 - lon1) * Math.PI) / 180.0;
    const a =
      Math.sin(dLat / 2.0) ** 2 +
      Math.cos((lat1 * Math.PI) / 180.0) *
        Math.cos((lat2 * Math.PI) / 180.0) *
        Math.sin(dLon / 2.0) ** 2;
    const c = 2.0 * Math.atan2(Math.sqrt(a), Math.sqrt(1.0 - a));
    return Math.round(R * c * 100.0) / 100.0;
  }

  private calculateFreshnessBadge(isoDate: string): string {
    if (!isoDate) return 'Updated recently';
    const diffMs = Date.now() - new Date(isoDate).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 2) return 'Updated just now';
    if (diffMins < 20) return `Updated ${diffMins}m ago`;
    return `Updated ${diffMins}m ago • Stale`;
  }

  async getNearbySalons(query: NearbySalonsQueryDto): Promise<NearbySalonsResponseDto> {
    const radiusKm = query.radius_km || 10;
    const radiusMeters = radiusKm * 1000;
    const page = query.page || 1;
    const limit = query.limit || 20;
    const offset = (page - 1) * limit;

    let items: NearbySalonItemDto[] = [];
    let queriedFromDatabase = false;

    // Attempt native PostGIS parameterized query or national discovery
    try {
      let dbRows: any[] = [];

      if (query.latitude !== undefined && query.longitude !== undefined) {
        // Optimized PostGIS ST_DWithin query (omits heavy full gallery arrays on list views)
        dbRows = await this.prisma.$queryRawUnsafe(
          `SELECT 
            id, name, tagline, locality, city, latitude, longitude, phone, address, instagram_handle, instagram_url,
            ROUND((ST_Distance(location, ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography) / 1000)::numeric, 2) AS distance_km,
            rating, review_count, current_queue, avg_service_time_minutes, active_barbers,
            starting_price, is_open, queue_status, is_verified, cover_image, poster_image, loop_video_url,
            last_queue_update, status,
            has_home_service, home_service_radius_km, home_service_categories, service_modes, marketing_config
          FROM salons
          WHERE status = 'active'
            AND ST_DWithin(location, ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography, $3)
          ORDER BY distance_km ASC
          LIMIT $4 OFFSET $5;`,
          query.latitude,
          query.longitude,
          radiusMeters,
          limit,
          offset,
        );
      } else {
        // Query active salons across India (omits heavy gallery arrays on list view)
        dbRows = await this.prisma.$queryRawUnsafe(
          `SELECT 
            id, name, tagline, locality, city, latitude, longitude, phone, address, instagram_handle, instagram_url,
            0.0 AS distance_km,
            rating, review_count, current_queue, avg_service_time_minutes, active_barbers,
            starting_price, is_open, queue_status, is_verified, cover_image, poster_image, loop_video_url,
            last_queue_update, status,
            has_home_service, home_service_radius_km, home_service_categories, service_modes, marketing_config
          FROM salons
          WHERE status = 'active'
          ORDER BY rating DESC, review_count DESC
          LIMIT $1 OFFSET $2;`,
          limit,
          offset,
        );
      }

      queriedFromDatabase = true;
      if (dbRows && dbRows.length > 0) {
        items = dbRows.map((row) => {
          const barbers = Math.max(1, row.active_barbers || 2);
          const avgTime = row.avg_service_time_minutes || 20;
          const queue = Number(row.current_queue || 0);
          const waitMins = queue > 0 ? Math.ceil((queue * avgTime) / barbers) : 0;
          const effectiveCover = row.cover_image || row.poster_image || '';

          return {
            id: row.id,
            name: row.name,
            tagline: row.tagline,
            locality: row.locality,
            city: row.city,
            latitude: Number(row.latitude),
            longitude: Number(row.longitude),
            distanceKm: Number(row.distance_km),
            rating: Number(row.rating),
            reviewCount: Number(row.review_count),
            currentQueue: queue,
            estimatedWaitMinutes: waitMins,
            startingPrice: Number(row.starting_price),
            isOpen: Boolean(row.is_open),
            queueStatus: row.is_open ? (row.queue_status || 'open') : 'closed',
            isVerified: Boolean(row.is_verified),
            phone: row.phone || '',
            address: row.address || '',
            instagramHandle: row.instagram_handle || '',
            instagramUrl: row.instagram_url || '',
            coverImage: effectiveCover,
            posterImage: (row.poster_image && row.poster_image !== effectiveCover) ? row.poster_image : '',
            loopVideoUrl: row.loop_video_url || '',
            hasHomeService: Boolean(row.has_home_service),
            homeServiceRadiusKm: Number(row.home_service_radius_km || 10),
            homeServiceCategories: row.home_service_categories || [],
            serviceModes: row.service_modes || ['at_salon'],
            marketingConfig: row.marketing_config || {},
            // Lightweight arrays for 100% frontend contract safety; full galleries loaded on salon detail page
            images: effectiveCover ? [effectiveCover] : [],
            locationImages: [],
            workImages: [],
            services: [],
            lastQueueUpdate: row.last_queue_update || new Date().toISOString(),
            freshnessBadge: this.calculateFreshnessBadge(row.last_queue_update),
          };
        });

        // Concurrently populate genuine relational services from PostgreSQL salon_services table
        try {
          const salonIds = items.map((it) => it.id);
          const dbServices = await this.prisma.$queryRawUnsafe<any[]>(
            `SELECT id, salon_id, name, category, price, duration_minutes, description
             FROM salon_services
             WHERE salon_id = ANY($1::text[]) AND is_available = true;`,
            salonIds,
          );

          if (dbServices && dbServices.length > 0) {
            const svcBySalon = new Map<string, any[]>();
            for (const s of dbServices) {
              if (!svcBySalon.has(s.salon_id)) svcBySalon.set(s.salon_id, []);
              svcBySalon.get(s.salon_id)!.push({
                id: s.id,
                name: s.name,
                category: s.category,
                price: Number(s.price),
                durationMinutes: s.duration_minutes,
                description: s.description || '',
                isAvailable: true,
              });
            }
            for (const item of items) {
              const matched = svcBySalon.get(item.id);
              if (matched && matched.length > 0) {
                (item as any).services = matched;
              }
            }
          }
        } catch (e) {
          this.logger.warn(`Could not attach relational services: ${(e as Error).message}`);
        }
      }
    } catch (err) {
      this.logger.debug(`Database PostGIS query skipped or failed (${(err as Error).message}). Using discovery engine.`);
    }

    // High-availability fallback engine (or local dev with seed salons)
    if (!queriedFromDatabase) {
      const allSalons = this.salonsService.getAllLocalSalons();

      const filtered = allSalons
        .filter((s) => s.status === 'active' && s.isVerified === true) // Only approved & active salons
        .map((s) => {
          const hasCoords = query.latitude !== undefined && query.longitude !== undefined;
          const dist = hasCoords
            ? this.calculateHaversineDistance(
                query.latitude!,
                query.longitude!,
                s.latitude,
                s.longitude,
              )
            : 0;
          const barbers = Math.max(1, s.activeBarbers || 2);
          const avgTime = s.avgServiceTimeMinutes || 20;
          const queue = Number(s.currentQueue || 0);
          const waitMins = queue > 0 ? Math.ceil((queue * avgTime) / barbers) : 0;

          const locImages = Array.isArray(s.locationImages) ? s.locationImages : [];
          const workImages = Array.isArray(s.workImages) ? s.workImages : [];
          const effectiveCover = s.coverImage || s.posterImage || locImages[0] || workImages[0] || '';
          const allImages = Array.isArray(s.images) && s.images.length > 0
            ? s.images
            : [
                ...(effectiveCover ? [effectiveCover] : []),
                ...locImages,
                ...workImages,
              ].filter((v: string, i: number, a: string[]) => a.indexOf(v) === i);

          return {
            id: s.id,
            name: s.name,
            tagline: s.tagline,
            locality: s.locality,
            city: s.city,
            latitude: s.latitude,
            longitude: s.longitude,
            distanceKm: dist,
            rating: Number(s.rating || 5.0),
            reviewCount: Number(s.reviewCount || 0),
            currentQueue: queue,
            estimatedWaitMinutes: waitMins,
            startingPrice: Number(s.startingPrice || 150),
            isOpen: Boolean(s.isOpen),
            queueStatus: s.isOpen ? (s.queueStatus || 'open') : 'closed',
            isVerified: Boolean(s.isVerified),
            phone: s.phone || '',
            address: s.address || '',
            instagramHandle: s.instagramHandle || '',
            instagramUrl: s.instagramUrl || '',
            coverImage: effectiveCover,
            posterImage: s.posterImage || effectiveCover,
            loopVideoUrl: s.loopVideoUrl || '',
            images: allImages,
            locationImages: locImages,
            workImages: workImages,
            lastQueueUpdate: s.lastQueueUpdate || new Date().toISOString(),
            freshnessBadge: this.calculateFreshnessBadge(s.lastQueueUpdate),
          };
        })
        .filter((s) => {
          if (query.latitude !== undefined && query.longitude !== undefined) {
            return s.distanceKm <= radiusKm;
          }
          return true;
        });

      items = filtered;
    }

    // Apply Lazy Mode preset filters and feature sorting
    if (query.lazy_filter) {
      switch (query.lazy_filter) {
        case LazyFilterOption.ZERO_WAIT:
          items = items.filter((s) => s.currentQueue === 0);
          items.sort((a, b) => a.currentQueue - b.currentQueue || a.estimatedWaitMinutes - b.estimatedWaitMinutes);
          break;
        case LazyFilterOption.SHORT_WAIT:
          items = items.filter((s) => s.currentQueue <= 3);
          items.sort((a, b) => a.currentQueue - b.currentQueue || a.estimatedWaitMinutes - b.estimatedWaitMinutes);
          break;
        case LazyFilterOption.TOP_RATED:
          items = items.filter((s) => s.rating >= 4.0);
          items.sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount);
          break;
        case LazyFilterOption.BUDGET_FRIENDLY:
          items.sort((a, b) => a.startingPrice - b.startingPrice);
          break;
        case LazyFilterOption.NEAREST_FIRST:
        default:
          items.sort((a, b) => a.distanceKm - b.distanceKm);
          break;
      }
    }

    // Apply granular filters
    if (query.min_rating) {
      items = items.filter((s) => s.rating >= query.min_rating);
    }
    if (query.max_queue !== undefined) {
      items = items.filter((s) => s.currentQueue <= query.max_queue);
    }
    if (query.max_price !== undefined) {
      items = items.filter((s) => s.startingPrice <= query.max_price);
    }

    // Apply sorting
    if (query.sort_by === 'rating') {
      items.sort((a, b) => b.rating - a.rating || a.distanceKm - b.distanceKm);
    } else if (query.sort_by === 'queue') {
      items.sort((a, b) => a.currentQueue - b.currentQueue || a.distanceKm - b.distanceKm);
    } else if (query.sort_by === 'price') {
      items.sort((a, b) => a.startingPrice - b.startingPrice || a.distanceKm - b.distanceKm);
    } else {
      // Default: nearest distance first
      items.sort((a, b) => a.distanceKm - b.distanceKm);
    }

    const totalFound = items.length;
    const paginated = items.slice(offset, offset + limit);

    return {
      totalFound,
      page,
      limit,
      radiusKm,
      salons: paginated,
    };
  }
}
