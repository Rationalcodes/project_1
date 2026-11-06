import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { createHmac, randomUUID, timingSafeEqual } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterSalonDto } from './dto/register-salon.dto';
import { UpdateSalonDto } from './dto/update-salon.dto';
import { UpdateQueueDto } from './dto/update-queue.dto';
import { PublicSalonResponseDto, PublicReviewDto } from './dto/public-salon-response.dto';
import { CreateReviewDto } from './dto/create-review.dto';
import { AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';
import { QueueEngineService, getStartOfTodayIST, isSalonPastClosingTime } from './queue-engine.service';
import { QueueGateway } from './queue.gateway';
import { validateQueueTransition } from './queue-state-machine';
import {
  StartServiceDto,
  CompleteServiceDto,
  ExtendServiceDto,
  ReassignStaffDto,
  CancelQueueEntryDto,
  UpdateQueueStatusDto,
  ClearQueueDto,
  UpdateStaffStatusDto,
  UpsertServiceDto,
  SubmitCrowdReportDto,
} from './dto/queue-action.dto';
import { CreateQueueEntryDto } from './dto/create-queue-entry.dto';
import {
  SmartQueueCheckInDto,
  SmartQueueConsentDto,
  SmartQueueDepartureResponseDto,
  SmartQueueLocationDto,
  SmartQueueSettingsDto,
} from './dto/smart-queue.dto';

@Injectable()
export class SalonsService {
  private readonly logger = new Logger(SalonsService.name);
  private readonly departureAccuracyLimitMeters = 50;
  private readonly minimumOutsideObservations = 2;
  private readonly departureGracePeriodMs = 3 * 60 * 1000;
  private readonly staffReviewDelayMs = 5 * 60 * 1000;

  // In-memory backing store for local testing / offline development
  private localSalons: Map<string, any> = new Map();

  constructor(
    private readonly prisma: PrismaService,
    private readonly queueEngine: QueueEngineService = new QueueEngineService(prisma),
    private readonly queueGateway: QueueGateway = new QueueGateway(),
  ) {}

  private smartQueueSignature(purpose: string, value: string): string {
    if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
      throw new InternalServerErrorException('Secure SmartQueue tokens are not configured.');
    }
    const secret = process.env.JWT_SECRET || 'kumbhakaran-jwt-secure-default-key-32chars-min';
    return createHmac('sha256', secret).update(`${purpose}:${value}`).digest('base64url');
  }

  private secureTokenMatches(expected: string, provided?: string): boolean {
    if (!provided) return false;
    const expectedBytes = Buffer.from(expected);
    const providedBytes = Buffer.from(provided);
    return expectedBytes.length === providedBytes.length && timingSafeEqual(expectedBytes, providedBytes);
  }

  private isValidSalonCheckInToken(salonId: string, token?: string): boolean {
    return this.secureTokenMatches(this.smartQueueSignature('salon-check-in', salonId), token);
  }

  private queueEntryAccessToken(entry: { id: string; salonId: string; joinedAt: Date }): string {
    return this.smartQueueSignature(
      'queue-entry-access',
      `${entry.salonId}:${entry.id}:${entry.joinedAt.getTime()}`,
    );
  }

  private requireQueueEntryAccess(
    entry: { id: string; salonId: string; joinedAt: Date },
    accessToken?: string,
  ) {
    if (!this.secureTokenMatches(this.queueEntryAccessToken(entry), accessToken)) {
      throw new ForbiddenException('A valid ticket access link is required.');
    }
  }

  async registerSalon(dto: RegisterSalonDto, resolvedOwnerId?: string): Promise<any> {
    const searchEmail = dto.email?.toLowerCase().trim();
    let effectiveOwnerId = resolvedOwnerId;

    if (!effectiveOwnerId && searchEmail) {
      try {
        const existingUser = await this.prisma.user.findFirst({
          where: { email: { equals: searchEmail, mode: 'insensitive' } },
        });
        if (existingUser) {
          effectiveOwnerId = existingUser.id;
        }
      } catch (e) {
        this.logger.warn(`Could not lookup existing user by email: ${(e as Error).message}`);
      }
    }

    const ownerId = effectiveOwnerId || dto.ownerId || `owner-${Date.now()}`;

    // 1. Enforce 1 Gmail ID = 1 Salon policy (Idempotent: update existing if already registered)
    try {
      let existingSalon: any = null;
      if (searchEmail || effectiveOwnerId) {
        existingSalon = await this.prisma.salon.findFirst({
          where: {
            OR: [
              ...(searchEmail ? [{ email: searchEmail }] : []),
              ...(effectiveOwnerId ? [{ ownerId: effectiveOwnerId }] : []),
            ],
          },
        });
      }

      if (existingSalon) {
        this.logger.log(`Found existing salon ${existingSalon.id} for ${searchEmail || effectiveOwnerId}. Updating salon.`);
        await this.prisma.$executeRawUnsafe(
          `UPDATE salons
           SET name = $1, tagline = $2, owner_name = $3, phone = $4,
               address = $5, locality = $6, city = $7, state = $8, pincode = $9,
               latitude = $10, longitude = $11, location = ST_SetSRID(ST_MakePoint($11, $10), 4326)::geography,
               is_verified = TRUE, status = 'active', last_queue_update = NOW()
           WHERE id = $12;`,
          dto.name,
          dto.tagline || existingSalon.tagline,
          dto.ownerName || existingSalon.ownerName,
          dto.phone || existingSalon.phone,
          dto.address || existingSalon.address,
          dto.locality || existingSalon.locality,
          dto.city || existingSalon.city,
          dto.state || existingSalon.state || 'Chhattisgarh',
          dto.pincode || existingSalon.pincode,
          dto.latitude,
          dto.longitude,
          existingSalon.id,
        );

        // Ensure ownerId is bound
        if (resolvedOwnerId && existingSalon.ownerId !== resolvedOwnerId) {
          await this.prisma.$executeRawUnsafe(
            `UPDATE salons SET owner_id = $1 WHERE id = $2;`,
            resolvedOwnerId,
            existingSalon.id,
          );
        }

        const updatedSalon = await this.getPublicSalonById(existingSalon.id);
        return {
          success: true,
          message: `Your salon '${existingSalon.name}' was synced with this Gmail account`,
          salon: updatedSalon,
        };
      }
    } catch (e) {
      this.logger.warn(`Could not verify existing salon: ${(e as Error).message}`);
    }

    const salonId = `salon-${Date.now()}`;

    // Validate coordinates
    if (dto.latitude < -90 || dto.latitude > 90) {
      throw new BadRequestException('Latitude must be between -90 and 90 degrees');
    }
    if (dto.longitude < -180 || dto.longitude > 180) {
      throw new BadRequestException('Longitude must be between -180 and 180 degrees');
    }

    const openingHoursFormatted = `${dto.openingHoursOpen || '09:00 AM'} – ${dto.openingHoursClose || '09:30 PM'} (All Days)`;
    const startingPrice = dto.startingPrice || (dto.services && dto.services.length > 0 ? Math.min(...dto.services.map((s) => s.price)) : 150.0);

    const newSalonRecord = {
      id: salonId,
      name: dto.name,
      tagline: dto.tagline || 'Grooming & authentic walk-in transparency',
      ownerName: dto.ownerName,
      ownerId: ownerId,
      phone: dto.phone,
      email: searchEmail || null,
      address: dto.address,
      locality: dto.locality,
      city: dto.city,
      state: dto.state || 'Chhattisgarh',
      pincode: dto.pincode,
      latitude: dto.latitude,
      longitude: dto.longitude,
      coverImage: dto.coverImage || '',
      openingHoursFormatted,
      currentQueue: 0,
      avgServiceTimeMinutes: dto.avgServiceTimeMinutes || 20,
      activeBarbers: dto.activeBarbers || 2,
      startingPrice,
      isOpen: true,
      isVerified: true, // Immediate verification so salon is visible to customers immediately!
      status: 'active',
      rating: 5.0,
      reviewCount: 0,
      lastQueueUpdate: new Date().toISOString(),
      todayCustomersServed: 0,
      todayRevenue: 0.0,
      monthlyRevenue: 0.0,
      services: dto.services
        ? dto.services.map((s, idx) => ({
            id: `svc-${Date.now()}-${idx}`,
            name: s.name,
            category: s.category,
            price: s.price,
            durationMinutes: s.durationMinutes || 20,
            isAvailable: true,
          }))
        : [],
      reviews: [],
    };

    // Attempt Parameterized PostGIS Insert if database is connected
    try {
      // 1. Ensure owner user exists in users table to satisfy foreign key fk_salons_owner
      if (newSalonRecord.ownerId) {
        await this.prisma.$executeRawUnsafe(
          `INSERT INTO users (id, email, name, role, created_at, updated_at)
           VALUES ($1, $2, $3, 'CUSTOMER', NOW(), NOW())
           ON CONFLICT (id) DO NOTHING;`,
          newSalonRecord.ownerId,
          dto.email || `${newSalonRecord.ownerId}@kumbhakaran.local`,
          dto.ownerName || 'Salon Partner',
        );
      }

      await this.prisma.$executeRawUnsafe(
        `INSERT INTO salons (
          id, name, tagline, owner_name, owner_id, phone, email,
          address, locality, city, state, pincode,
          latitude, longitude, location,
          cover_image, opening_hours_open, opening_hours_close, opening_hours_formatted,
          current_queue, avg_service_time_minutes, active_barbers, is_open,
          rating, review_count, starting_price, is_verified, status,
          today_customers_served, today_revenue, monthly_revenue, created_at, last_queue_update
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7,
          $8, $9, $10, $11, $12,
          $13, $14, ST_SetSRID(ST_MakePoint($14, $13), 4326)::geography,
          $15, $16, $17, $18,
          $19, $20, $21, $22,
          $23, $24, $25, $26, $27,
          $28, $29, $30, NOW(), NOW()
        );`,
        newSalonRecord.id,
        newSalonRecord.name,
        newSalonRecord.tagline,
        newSalonRecord.ownerName,
        newSalonRecord.ownerId,
        newSalonRecord.phone,
        newSalonRecord.email,
        newSalonRecord.address,
        newSalonRecord.locality,
        newSalonRecord.city,
        newSalonRecord.state,
        newSalonRecord.pincode,
        newSalonRecord.latitude,
        newSalonRecord.longitude, // Notice $14 is longitude, $13 is latitude in ST_MakePoint($14, $13)
        newSalonRecord.coverImage,
        dto.openingHoursOpen || '09:00 AM',
        dto.openingHoursClose || '09:30 PM',
        newSalonRecord.openingHoursFormatted,
        newSalonRecord.currentQueue,
        newSalonRecord.avgServiceTimeMinutes,
        newSalonRecord.activeBarbers,
        newSalonRecord.isOpen,
        newSalonRecord.rating,
        newSalonRecord.reviewCount,
        newSalonRecord.startingPrice,
        newSalonRecord.isVerified,
        newSalonRecord.status,
        0,
        0.0,
        0.0,
      );

      // Insert services if any
      if (dto.services && dto.services.length > 0) {
        for (const s of newSalonRecord.services) {
          await this.prisma.$executeRawUnsafe(
            `INSERT INTO salon_services (id, salon_id, name, category, price, duration_minutes, is_available, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, NOW());`,
            s.id,
            newSalonRecord.id,
            s.name,
            s.category,
            s.price,
            s.durationMinutes,
            true,
          );
        }
      }

      // Automatically register salon membership with PARTNER_OWNER role
      if (newSalonRecord.ownerId) {
        const membershipId = `mem-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        await this.prisma.$executeRawUnsafe(
          `INSERT INTO salon_members (id, salon_id, user_id, role, is_active, created_at)
           VALUES ($1, $2, $3, 'PARTNER_OWNER', TRUE, NOW())
           ON CONFLICT (salon_id, user_id) DO NOTHING;`,
          membershipId,
          newSalonRecord.id,
          newSalonRecord.ownerId,
        );
      }

      this.logger.log(`✅ Salon ${newSalonRecord.id} successfully registered in PostGIS database.`);
    } catch (err) {
      this.logger.error(`Database insert failed (${(err as Error).message}). Local state updated.`);
      throw new BadRequestException(`Failed to register salon in database: ${(err as Error).message}`);
    }

    // Always maintain local memory state for high availability
    this.localSalons.set(newSalonRecord.id, newSalonRecord);

    return {
      success: true,
      message: `Salon '${newSalonRecord.name}' registered successfully`,
      salon: {
        id: newSalonRecord.id,
        name: newSalonRecord.name,
        ownerId: newSalonRecord.ownerId,
        latitude: newSalonRecord.latitude,
        longitude: newSalonRecord.longitude,
        locality: newSalonRecord.locality,
        city: newSalonRecord.city,
        status: newSalonRecord.status,
      },
    };
  }

  /**
   * Look up the single salon belonging to this owner or Gmail address
   */
  async getMySalon(
    userId?: string,
    userEmail?: string,
    memberships?: Array<{ salonId: string; role?: string }>,
  ): Promise<PublicSalonResponseDto | null> {
    const emailNorm = userEmail?.toLowerCase().trim();
    const membershipSalonIds = (memberships || [])
      .map((m) => m.salonId)
      .filter(Boolean);

    try {
      let salon: any = null;

      // 1. Direct membership match from authenticated token payload
      if (membershipSalonIds.length > 0) {
        salon = await this.prisma.salon.findFirst({
          where: {
            id: { in: membershipSalonIds },
          },
          orderBy: { createdAt: 'desc' },
        });
      }

      // 2. Search database by ownerId or email (case-insensitive)
      if (!salon && (userId || emailNorm)) {
        salon = await this.prisma.salon.findFirst({
          where: {
            OR: [
              ...(userId ? [{ ownerId: userId }] : []),
              ...(emailNorm ? [{ email: { equals: emailNorm, mode: 'insensitive' as const } }] : []),
            ],
          },
          orderBy: { createdAt: 'desc' },
        });

        // 3. Check salon_members table if not found by direct email/ownerId
        if (!salon && userId) {
          const mem = await this.prisma.salonMember.findFirst({
            where: { userId, isActive: true },
            orderBy: { createdAt: 'desc' },
          });
          if (mem) {
            salon = await this.prisma.salon.findUnique({ where: { id: mem.salonId } });
          }
        }

        // 4. Check user record by email -> join with salon_members
        if (!salon && emailNorm) {
          const userRec = await this.prisma.user.findFirst({
            where: { email: { equals: emailNorm, mode: 'insensitive' as const } },
            select: { id: true },
          });
          if (userRec) {
            const mem = await this.prisma.salonMember.findFirst({
              where: { userId: userRec.id, isActive: true },
              orderBy: { createdAt: 'desc' },
            });
            if (mem) {
              salon = await this.prisma.salon.findUnique({ where: { id: mem.salonId } });
            }
          }
        }
      }

      if (salon) {
        return this.getPublicSalonById(salon.id);
      }
    } catch (err) {
      this.logger.warn(`getMySalon database query error: ${(err as Error).message}`);
    }

    // 5. Check local memory state fallback
    const local = Array.from(this.localSalons.values()).find(
      (s) =>
        (membershipSalonIds.length > 0 && membershipSalonIds.includes(s.id)) ||
        (userId && s.ownerId === userId) ||
        (emailNorm && s.email?.toLowerCase().trim() === emailNorm),
    );

    if (local) {
      return this.getPublicSalonById(local.id);
    }

    return null;
  }

  async getPublicSalonById(id: string): Promise<PublicSalonResponseDto> {
    let salonData: any = null;

    try {
      const rows: any[] = await this.prisma.$queryRawUnsafe(
        `SELECT id, name, tagline, address, locality, city, state, pincode,
                latitude, longitude, cover_image, poster_image, loop_video_url,
                location_images, work_images, opening_hours_formatted,
                current_queue, avg_service_time_minutes, active_barbers,
                rating, review_count, starting_price, is_open, is_verified,
                queue_status, opening_hours_open, opening_hours_close,
                status, last_queue_update
         FROM salons
         WHERE id = $1 LIMIT 1;`,
        id,
      );

      if (rows && rows.length > 0) {
        salonData = rows[0];

        // Fetch services
        const services: any[] = await this.prisma.$queryRawUnsafe(
          `SELECT id, name, category, price, duration_minutes, description, is_available
           FROM salon_services
           WHERE salon_id = $1 AND is_available = true;`,
          id,
        );
        salonData.services = services;

        // Fetch public reviews
        const reviews: any[] = await this.prisma.$queryRawUnsafe(
          `SELECT id, customer_name, customer_avatar, rating, comment, verified_visit, created_at, owner_reply
           FROM salon_reviews
           WHERE salon_id = $1 AND flagged = false
           ORDER BY created_at DESC LIMIT 50;`,
          id,
        );
        salonData.reviews = reviews;

        // Fetch staff members
        const staff = await this.prisma.$queryRawUnsafe<any[]>(
          `SELECT id, name, role, experience, specialties, photo, rating, status
           FROM salon_staff
           WHERE salon_id = $1 AND status = 'active';`,
          id,
        ).catch(() => [] as any[]);
        salonData.staff = staff;
      }
    } catch {
      // Fallback to local memory
      salonData = this.localSalons.get(id);
    }

    if (!salonData) {
      salonData = this.localSalons.get(id);
    }

    if (!salonData) {
      throw new NotFoundException(`Salon with ID '${id}' not found`);
    }

    if (salonData.status === 'suspended') {
      throw new NotFoundException(`Salon with ID '${id}' is currently suspended`);
    }

    const barbers = Math.max(1, salonData.activeBarbers || salonData.active_barbers || 2);
    const avgTime = salonData.avgServiceTimeMinutes || salonData.avg_service_time_minutes || 20;
    const currentQueue = salonData.currentQueue !== undefined ? salonData.currentQueue : salonData.current_queue || 0;
    const isQueueOpen =
      Boolean(salonData.isOpen !== undefined ? salonData.isOpen : salonData.is_open) &&
      salonData.queueStatus !== 'closed' &&
      salonData.queue_status !== 'closed' &&
      !isSalonPastClosingTime(
        salonData.openingHoursClose || salonData.opening_hours_close,
        salonData.openingHoursOpen || salonData.opening_hours_open,
      );
    const displayedQueue = isQueueOpen ? Number(currentQueue) : 0;
    const estimatedWaitMinutes = displayedQueue > 0 ? Math.ceil((displayedQueue * avgTime) / barbers) : 0;

    return {
      id: salonData.id,
      name: salonData.name,
      tagline: salonData.tagline || 'Verified Kumbhakaran Salon Partner',
      address: salonData.address || `${salonData.locality || ''}, ${salonData.city || ''}`,
      locality: salonData.locality || '',
      city: salonData.city || '',
      state: salonData.state || '',
      pincode: salonData.pincode || '',
      latitude: Number(salonData.latitude || 28.6139),
      longitude: Number(salonData.longitude || 77.2090),
      coordinates: {
        lat: Number(salonData.latitude || 28.6139),
        lng: Number(salonData.longitude || 77.2090),
      },
      coverImage: salonData.coverImage || salonData.cover_image || salonData.posterImage || salonData.poster_image || (Array.isArray(salonData.locationImages) && salonData.locationImages[0]) || (Array.isArray(salonData.location_images) && salonData.location_images[0]) || '',
      posterImage: salonData.posterImage || salonData.poster_image || salonData.coverImage || salonData.cover_image || '',
      loopVideoUrl: salonData.loopVideoUrl || salonData.loop_video_url || '',
      images: Array.isArray(salonData.images) && salonData.images.length > 0
        ? salonData.images
        : (salonData.coverImage || salonData.cover_image || (Array.isArray(salonData.locationImages) && salonData.locationImages[0]) || (Array.isArray(salonData.location_images) && salonData.location_images[0]) ? [salonData.coverImage || salonData.cover_image || salonData.locationImages?.[0] || salonData.location_images?.[0]] : []),
      locationImages: Array.isArray(salonData.locationImages) ? salonData.locationImages : (Array.isArray(salonData.location_images) ? salonData.location_images : []),
      workImages: Array.isArray(salonData.workImages) ? salonData.workImages : (Array.isArray(salonData.work_images) ? salonData.work_images : []),
      mediaGallery: salonData.mediaGallery || salonData.media_gallery || [],
      openingHoursFormatted: salonData.openingHoursFormatted || salonData.opening_hours_formatted || '09:00 AM – 09:30 PM (All Days)',
      openingHours: {
        open: salonData.openingHoursOpen || salonData.opening_hours_open || '09:00 AM',
        close: salonData.openingHoursClose || salonData.opening_hours_close || '09:30 PM',
        formatted: salonData.openingHoursFormatted || salonData.opening_hours_formatted || '09:00 AM – 09:30 PM (All Days)',
      },
      currentQueue: displayedQueue,
      estimatedWaitMinutes,
      activeBarbers: barbers,
      avgServiceTimeMinutes: avgTime,
      rating: Number(salonData.rating || 5.0),
      reviewCount: Number(salonData.reviewCount || salonData.review_count || 0),
      startingPrice: Number(salonData.startingPrice || salonData.starting_price || 150.0),
      isOpen: isQueueOpen,
      isVerified: Boolean(salonData.isVerified !== undefined ? salonData.isVerified : salonData.is_verified),
      lastQueueUpdate: salonData.lastQueueUpdate || salonData.last_queue_update || new Date().toISOString(),
      services: (salonData.services || []).map((s: any) => ({
        id: s.id,
        name: s.name,
        category: s.category,
        price: Number(s.price),
        durationMinutes: s.durationMinutes || s.duration_minutes || 20,
        description: s.description,
        isAvailable: Boolean(s.isAvailable !== undefined ? s.isAvailable : s.is_available),
      })),
      staff: (salonData.staff || []).length > 0
        ? (salonData.staff || []).map((st: any) => ({
            id: st.id,
            name: st.name,
            role: st.role || 'Senior Stylist',
            experience: st.experience || '4 Years',
            specialization: Array.isArray(st.specialties) ? st.specialties.join(', ') : (st.specialization || 'Hair styling & Grooming'),
            rating: Number(st.rating || 5.0),
            reviewsCount: Number(st.reviewsCount || 0),
            avatarUrl: st.photo || st.avatarUrl || st.avatar_url || '',
            photo: st.photo || st.avatarUrl || st.avatar_url || '',
            status: st.status || 'active',
            isAvailable: st.status === 'active' || st.isAvailable !== false,
          }))
        : [],
      ratingBreakdown: salonData.ratingBreakdown || {
        serviceQuality: 4.9,
        waitingTimeAccuracy: 4.8,
        cleanlinessHygiene: 4.9,
        staffHospitality: 4.9,
        valueForMoney: 4.8,
      },
      phone: salonData.phone || '+91 98765 43210',
      email: salonData.email || '',
      ownerName: salonData.ownerName || salonData.owner_name || '',
      ownerId: salonData.ownerId || salonData.owner_id || '',
      todayCustomersServed: Number(salonData.todayCustomersServed || salonData.today_customers_served || 0),
      todayRevenue: Number(salonData.todayRevenue || salonData.today_revenue || 0),
      monthlyRevenue: Number(salonData.monthlyRevenue || salonData.monthly_revenue || 0),
      reviews: (salonData.reviews || []).map((r: any) => ({
        id: r.id,
        customerName: r.customerName || r.customer_name,
        customerAvatar: r.customerAvatar || r.customer_avatar,
        rating: Number(r.rating),
        comment: r.comment,
        verifiedVisit: Boolean(r.verifiedVisit !== undefined ? r.verifiedVisit : r.verified_visit),
        createdAt: r.createdAt || r.created_at,
        ownerReply: r.ownerReply || r.owner_reply,
      })),
    };
  }

  async addReview(salonId: string, dto: CreateReviewDto): Promise<PublicReviewDto> {
    const reviewId = `rev-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date();
    const rating = Math.max(1, Math.min(5, Math.round(Number(dto.rating) || 5)));
    const haircutQuality = Math.max(1, Math.min(5, Number(dto.criteria?.haircutQuality || rating)));
    const staffBehaviour = Math.max(1, Math.min(5, Number(dto.criteria?.staffBehaviour || rating)));
    const cleanliness = Math.max(1, Math.min(5, Number(dto.criteria?.cleanliness || rating)));
    const pricing = Math.max(1, Math.min(5, Number(dto.criteria?.pricing || rating)));
    const overallExperience = Math.max(1, Math.min(5, Number(dto.criteria?.overallExperience || rating)));

    const reviewRecord = {
      id: reviewId,
      salonId,
      customerName: dto.customerName?.trim() || 'Anonymous Customer',
      customerAvatar: dto.customerAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
      rating,
      comment: dto.comment?.trim() || '',
      verifiedVisit: dto.verifiedVisit !== false,
      haircutQuality,
      staffBehaviour,
      cleanliness,
      pricing,
      overallExperience,
      createdAt: now,
    };

    // 1. Try to persist into PostgreSQL
    try {
      // Prevent duplicate review submissions with the exact same customer name and comment
      const existingDuplicate = await this.prisma.salonReview.findFirst({
        where: {
          salonId,
          customerName: reviewRecord.customerName,
          comment: reviewRecord.comment,
        },
      });

      if (existingDuplicate) {
        this.logger.warn(`Deduplicated repeat review submission for salon ${salonId}`);
        return {
          id: existingDuplicate.id,
          customerName: existingDuplicate.customerName,
          customerAvatar: existingDuplicate.customerAvatar || reviewRecord.customerAvatar,
          rating: existingDuplicate.rating,
          comment: existingDuplicate.comment,
          verifiedVisit: existingDuplicate.verifiedVisit,
          createdAt: existingDuplicate.createdAt.toISOString(),
        };
      }

      await this.prisma.salonReview.create({
        data: reviewRecord,
      });

      // Recalculate average rating & review count for the salon
      const agg = await this.prisma.salonReview.aggregate({
        where: { salonId, flagged: false },
        _avg: { rating: true },
        _count: { id: true },
      });

      const newAvgRating = Number((agg._avg.rating || rating).toFixed(1));
      const newReviewCount = agg._count.id;

      await this.prisma.salon.update({
        where: { id: salonId },
        data: {
          rating: newAvgRating,
          reviewCount: newReviewCount,
        },
      });
      this.logger.log(`Review persisted to database for salon ${salonId}: ${reviewId}`);
    } catch (err) {
      this.logger.warn(`Could not save review to database (${(err as Error).message}). Updating local memory cache.`);
    }

    // 2. Also update localSalons cache
    const localSalon = this.localSalons.get(salonId);
    if (localSalon) {
      if (!localSalon.reviews) localSalon.reviews = [];
      localSalon.reviews.unshift({
        id: reviewId,
        customerName: reviewRecord.customerName,
        customerAvatar: reviewRecord.customerAvatar,
        rating: reviewRecord.rating,
        comment: reviewRecord.comment,
        verifiedVisit: reviewRecord.verifiedVisit,
        createdAt: now.toISOString(),
      });
      const count = (localSalon.reviewCount || 0) + 1;
      const avg = Number((((localSalon.rating || 5) * (localSalon.reviewCount || 0) + rating) / count).toFixed(1));
      localSalon.reviewCount = count;
      localSalon.rating = avg;
    }

    return {
      id: reviewId,
      customerName: reviewRecord.customerName,
      customerAvatar: reviewRecord.customerAvatar,
      rating: reviewRecord.rating,
      comment: reviewRecord.comment,
      verifiedVisit: reviewRecord.verifiedVisit,
      createdAt: now.toISOString(),
    };
  }

  async getReviews(salonId: string): Promise<PublicReviewDto[]> {
    try {
      const dbReviews = await this.prisma.salonReview.findMany({
        where: { salonId, flagged: false },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });

      if (dbReviews && dbReviews.length > 0) {
        return dbReviews.map((r) => ({
          id: r.id,
          customerName: r.customerName,
          customerAvatar: r.customerAvatar || undefined,
          rating: r.rating,
          comment: r.comment,
          verifiedVisit: r.verifiedVisit,
          createdAt: r.createdAt.toISOString(),
          ownerReply: r.ownerReply || undefined,
        }));
      }
    } catch (err) {
      this.logger.debug(`Could not read reviews from DB: ${(err as Error).message}`);
    }

    const localSalon = this.localSalons.get(salonId);
    return localSalon?.reviews || [];
  }

  async replyToReview(salonId: string, reviewId: string, comment: string): Promise<any> {
    const trimmed = (comment || '').trim();
    if (!trimmed) {
      throw new BadRequestException('Reply comment cannot be empty');
    }

    const now = new Date();
    try {
      await this.prisma.salonReview.update({
        where: { id: reviewId },
        data: {
          ownerReply: trimmed,
          ownerReplyDate: now,
        },
      });
      this.logger.log(`Owner replied to review ${reviewId} for salon ${salonId}`);
    } catch (err) {
      this.logger.warn(`Could not update review in DB (${(err as Error).message}). Updating memory cache.`);
    }

    // Also update local memory cache
    const localSalon = this.localSalons.get(salonId);
    if (localSalon && Array.isArray(localSalon.reviews)) {
      localSalon.reviews = localSalon.reviews.map((r: any) =>
        r.id === reviewId ? { ...r, ownerReply: trimmed } : r,
      );
    }

    return {
      success: true,
      reviewId,
      ownerReply: trimmed,
      date: now.toISOString(),
    };
  }

  async updateSalon(id: string, dto: UpdateSalonDto, requesterOwnerId?: string): Promise<any> {
    const salon = this.localSalons.get(id);
    let effectiveIsOpen = dto.isOpen;

    if (dto.latitude !== undefined && (dto.latitude < -90 || dto.latitude > 90)) {
      throw new BadRequestException('Latitude must be between -90 and 90');
    }
    if (dto.longitude !== undefined && (dto.longitude < -180 || dto.longitude > 180)) {
      throw new BadRequestException('Longitude must be between -180 and 180');
    }

    if (dto.isOpen !== undefined) {
      const updatedCount = await this.prisma.$executeRaw`
        UPDATE public.salons
        SET is_open = ${dto.isOpen},
            queue_status = CASE
              WHEN ${dto.isOpen} = false THEN 'closed'
              WHEN queue_status = 'closed' THEN 'open'
              ELSE queue_status
            END,
            last_queue_update = NOW()
        WHERE id = ${id}
      `;
      if (updatedCount === 0 && !salon) {
        throw new NotFoundException(`Salon with ID '${id}' not found`);
      }
    }

    // Try PostGIS database update
    try {
      if (dto.latitude !== undefined && dto.longitude !== undefined) {
        await this.prisma.$executeRawUnsafe(
          `UPDATE salons 
           SET latitude = $1, longitude = $2, location = ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography
           WHERE id = $3;`,
          dto.latitude,
          dto.longitude,
          id,
        );
      }
      if (dto.name) {
        await this.prisma.$executeRawUnsafe(`UPDATE salons SET name = $1 WHERE id = $2;`, dto.name, id);
      }
      if (dto.status) {
        await this.prisma.$executeRawUnsafe(`UPDATE salons SET status = $1 WHERE id = $2;`, dto.status, id);
      }
      let effectiveCover = dto.coverImage;
      if (!effectiveCover && dto.posterImage) {
        effectiveCover = dto.posterImage;
      }
      if (!effectiveCover && Array.isArray(dto.locationImages) && dto.locationImages.length > 0) {
        effectiveCover = dto.locationImages[0];
      }
      if (!effectiveCover && Array.isArray(dto.workImages) && dto.workImages.length > 0) {
        effectiveCover = dto.workImages[0];
      }

      if (effectiveCover) {
        await this.prisma.$executeRawUnsafe(`UPDATE salons SET cover_image = $1 WHERE id = $2;`, effectiveCover, id);
      }
      if (dto.posterImage !== undefined) {
        await this.prisma.$executeRawUnsafe(`UPDATE salons SET poster_image = $1 WHERE id = $2;`, dto.posterImage || effectiveCover || null, id);
      }
      if (dto.loopVideoUrl !== undefined) {
        await this.prisma.$executeRawUnsafe(`UPDATE salons SET loop_video_url = $1 WHERE id = $2;`, dto.loopVideoUrl || null, id);
      }
      if (dto.locationImages !== undefined) {
        await this.prisma.$executeRawUnsafe(
          `UPDATE salons SET location_images = $1::jsonb WHERE id = $2;`,
          JSON.stringify(dto.locationImages || []),
          id,
        );
      }
      if (dto.workImages !== undefined) {
        await this.prisma.$executeRawUnsafe(
          `UPDATE salons SET work_images = $1::jsonb WHERE id = $2;`,
          JSON.stringify(dto.workImages || []),
          id,
        );
      }
    } catch (err) {
      this.logger.warn(`Failed to update salon in database: ${err}`);
    }

    // Local state update
    if (salon) {
      if (dto.name) salon.name = dto.name;
      if (dto.tagline) salon.tagline = dto.tagline;
      if (dto.phone) salon.phone = dto.phone;
      if (dto.address) salon.address = dto.address;
      if (dto.locality) salon.locality = dto.locality;
      if (dto.city) salon.city = dto.city;
      if (dto.latitude !== undefined) salon.latitude = dto.latitude;
      if (dto.longitude !== undefined) salon.longitude = dto.longitude;
      if (dto.isOpen !== undefined) salon.isOpen = dto.isOpen;
      if (dto.status) salon.status = dto.status;
      if (dto.coverImage) salon.coverImage = dto.coverImage;
      if (dto.posterImage) salon.posterImage = dto.posterImage;
      if (dto.loopVideoUrl !== undefined) salon.loopVideoUrl = dto.loopVideoUrl;
      if (dto.images) salon.images = dto.images;
      if (dto.locationImages) salon.locationImages = dto.locationImages;
      if (dto.workImages) salon.workImages = dto.workImages;
      if (dto.mediaGallery) salon.mediaGallery = dto.mediaGallery;
    }

    if (dto.isOpen === false) {
      await this.clearQueue(id, { clearOption: 'cancelled', reason: 'Shop closed by owner' }, requesterOwnerId);
    } else if (dto.isOpen === true) {
      const queueData = await this.queueEngine.recalculateSalonQueue(id, { force: true, persist: true });
      this.syncLocalQueueCache(id, queueData.overview.totalWaiting);
      effectiveIsOpen = queueData.overview.queueStatus !== 'closed';
    }

    return {
      success: true,
      message: 'Salon updated successfully',
      salonId: id,
      ...(effectiveIsOpen !== undefined ? { isOpen: effectiveIsOpen } : {}),
    };
  }

  async updateQueue(id: string, dto: UpdateQueueDto, requesterOwnerId?: string): Promise<any> {
    const salon = this.localSalons.get(id);

    // Read current queue accurately from database first, fallback to memory
    let currentQueue = salon ? Number(salon.currentQueue || 0) : 0;
    try {
      const dbRow = await this.prisma.salon.findUnique({
        where: { id },
        select: { currentQueue: true },
      });
      if (dbRow && dbRow.currentQueue !== null && dbRow.currentQueue !== undefined) {
        currentQueue = Number(dbRow.currentQueue);
      }
    } catch {}

    let newQueue = 0;
    if (dto.manualValue !== undefined) {
      newQueue = Math.max(0, dto.manualValue);
    } else if (dto.delta !== undefined) {
      newQueue = Math.max(0, currentQueue + dto.delta);
    }

    const now = new Date().toISOString();

    // Database update
    try {
      // If decrementing or clearing, mark oldest waiting customer as served
      if (dto.delta && dto.delta < 0) {
        await this.prisma.$executeRawUnsafe(
          `UPDATE salon_queue_entries SET status = 'completed', served_at = NOW()
           WHERE id IN (
             SELECT id FROM salon_queue_entries
             WHERE salon_id = $1 AND status = 'waiting'
             ORDER BY position ASC, joined_at ASC
             LIMIT $2
           );`,
          id,
          Math.abs(dto.delta),
        );
      } else if (dto.manualValue === 0) {
        await this.prisma.$executeRawUnsafe(
          `UPDATE salon_queue_entries SET status = 'completed', served_at = NOW() WHERE salon_id = $1 AND status = 'waiting';`,
          id,
        );
      }

      await this.prisma.$executeRawUnsafe(
        `UPDATE salons 
         SET current_queue = $1, last_queue_update = NOW()
         WHERE id = $2;`,
        newQueue,
        id,
      );
    } catch (err) {
      this.logger.warn(`Could not update current_queue in database for ${id}: ${(err as Error).message}`);
    }

    if (salon) {
      salon.currentQueue = newQueue;
      salon.lastQueueUpdate = now;
      if (dto.delta && dto.delta < 0) {
        salon.todayCustomersServed = (salon.todayCustomersServed || 0) + Math.abs(dto.delta);
      }
    }

    return {
      success: true,
      salonId: id,
      currentQueue: newQueue,
      lastQueueUpdate: now,
    };
  }

  // ==========================================================================
  // INTELLIGENT REAL-TIME QUEUE ENGINE & OPERATIONAL CONTROLS
  // ==========================================================================

  /**
   * Helper to log audit trail of queue events
   */
  private async logQueueEvent(
    salonId: string,
    queueEntryId: string | null,
    actorId: string,
    actorRole: string,
    eventType: string,
    fromStatus: string | null,
    toStatus: string | null,
    details?: any,
  ) {
    try {
      await this.prisma.queueEvent.create({
        data: {
          id: `qev-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          salonId,
          queueEntryId,
          actorId,
          actorRole,
          eventType,
          fromStatus,
          toStatus,
          details: details || {},
        },
      });
    } catch (err) {
      this.logger.warn(`Could not record queue audit event: ${err}`);
    }
  }

  /**
   * Helper to sync in-memory local salon queue count with recalculation result
   */
  private syncLocalQueueCache(salonId: string, count: number) {
    const local = this.localSalons.get(salonId);
    if (local) {
      local.currentQueue = count;
      local.lastQueueUpdate = new Date().toISOString();
    }
  }

  /**
   * 1. Get live queue overview with staff states & statistics
   */
  async getQueueOverview(salonId: string) {
    const res = await this.queueEngine.recalculateSalonQueue(salonId);
    this.syncLocalQueueCache(salonId, res.overview.totalWaiting);
    return res;
  }

  /**
   * 2. Get all active queue entries with calculated ETAs & assigned staff
   */
  async getQueueEntries(salonId: string) {
    const res = await this.queueEngine.recalculateSalonQueue(salonId);
    this.syncLocalQueueCache(salonId, res.overview.totalWaiting);
    return res.activeEntries.map((entry: any) => ({
      id: entry.id,
      salonId: entry.salonId,
      position: entry.position,
      ticketNumber: entry.ticketNumber,
      partySize: entry.partySize || 1,
      status: entry.status,
      serviceName: entry.serviceName,
      joinedAt: entry.joinedAt,
      estimatedWaitMinutes: entry.estimatedWaitMinutes,
    }));
  }

  async getPartnerQueueEntries(salonId: string) {
    const res = await this.queueEngine.recalculateSalonQueue(salonId);
    this.syncLocalQueueCache(salonId, res.overview.totalWaiting);
    const smartMetadata = await this.prisma.salonQueueEntry.findMany({
      where: {
        salonId,
        status: { in: ['waiting', 'called', 'in_service', 'skipped', 'no_show'] },
      },
      select: {
        id: true,
        checkInMethod: true,
        partySize: true,
        locationConsent: true,
        arrivalConfirmedAt: true,
        departureDetectedAt: true,
        departureReviewRequired: true,
        departureConfirmationSource: true,
      },
    });
    const metadataById = new Map(smartMetadata.map((entry) => [entry.id, entry]));
    const activeEntries = res.activeEntries.map((entry: any) => ({
      ...entry,
      ...metadataById.get(entry.id),
      checkInMethod: metadataById.get(entry.id)?.checkInMethod || 'online',
      arrivalConfirmedAt: metadataById.get(entry.id)?.arrivalConfirmedAt?.toISOString() || null,
      departureDetectedAt: metadataById.get(entry.id)?.departureDetectedAt?.toISOString() || null,
    }));
    const absentEntries = await this.prisma.salonQueueEntry.findMany({
      where: { salonId, status: 'no_show' },
      orderBy: { updatedAt: 'desc' },
      take: 20,
      select: {
        id: true,
        salonId: true,
        position: true,
        ticketNumber: true,
        customerName: true,
        phone: true,
        serviceName: true,
        serviceDuration: true,
        servicePrice: true,
        status: true,
        joinedAt: true,
        updatedAt: true,
        checkInMethod: true,
        partySize: true,
        locationConsent: true,
        arrivalConfirmedAt: true,
        departureDetectedAt: true,
        departureReviewRequired: true,
        departureConfirmationSource: true,
      },
    });
    return [
      ...activeEntries,
      ...absentEntries.map((entry) => ({
        ...entry,
        servicePrice: Number(entry.servicePrice),
        joinedAt: entry.joinedAt.toISOString(),
        updatedAt: entry.updatedAt.toISOString(),
        arrivalConfirmedAt: entry.arrivalConfirmedAt?.toISOString() || null,
        departureDetectedAt: entry.departureDetectedAt?.toISOString() || null,
      })),
    ];
  }

  /**
   * 2b. Get single queue entry status by ID (including completed/cancelled tickets)
   */
  async getQueueEntryById(salonId: string, entryId: string) {
    const entry = await this.prisma.salonQueueEntry.findFirst({
      where: { id: entryId, salonId },
      include: {
        assignedStaff: { select: { id: true, name: true } },
      },
    });
    if (!entry) {
      throw new NotFoundException(`Queue ticket '${entryId}' not found.`);
    }
    return {
      id: entry.id,
      salonId: entry.salonId,
      position: entry.position,
      ticketNumber: entry.ticketNumber,
      customerName: entry.customerName,
      phone: entry.phone,
      serviceName: entry.serviceName,
      serviceDuration: entry.serviceDuration,
      servicePrice: Number(entry.servicePrice),
      assignedStaffId: entry.assignedStaffId,
      assignedStaffName: entry.assignedStaff?.name || null,
      status: entry.status,
      joinedAt: entry.joinedAt.toISOString(),
      calledAt: entry.calledAt?.toISOString() || null,
      startedAt: entry.startedAt?.toISOString() || null,
      servedAt: entry.servedAt?.toISOString() || null,
      cancelledAt: entry.cancelledAt?.toISOString() || null,
      estimatedWaitMinutes: entry.estimatedWaitMinutes,
      estimatedStartTime: entry.estimatedStartTime?.toISOString() || null,
      estimatedCompletionTime: entry.estimatedCompletionTime?.toISOString() || null,
      cancellationReason: entry.cancellationReason || null,
    };
  }

  async getCustomerQueueEntry(salonId: string, entryId: string, accessToken?: string) {
    const entry = await this.prisma.salonQueueEntry.findFirst({
      where: { id: entryId, salonId },
    });
    if (!entry) throw new NotFoundException(`Queue ticket '${entryId}' not found.`);
    this.requireQueueEntryAccess(entry, accessToken);
    const publicQueueEntries = await this.getQueueEntries(salonId);
    const activeQueueEntry = publicQueueEntries.find((item: any) => item.id === entryId);
    return {
      id: entry.id,
      salonId: entry.salonId,
      position: activeQueueEntry?.position ?? entry.position,
      ticketNumber: entry.ticketNumber,
      customerName: entry.customerName,
      serviceName: entry.serviceName,
      partySize: entry.partySize,
      status: entry.status,
      joinedAt: entry.joinedAt.toISOString(),
      calledAt: entry.calledAt?.toISOString() || null,
      startedAt: entry.startedAt?.toISOString() || null,
      servedAt: entry.servedAt?.toISOString() || null,
      cancelledAt: entry.cancelledAt?.toISOString() || null,
      estimatedWaitMinutes: activeQueueEntry?.estimatedWaitMinutes ?? entry.estimatedWaitMinutes,
      checkInMethod: entry.checkInMethod,
      locationConsent: entry.locationConsent,
      arrivalConfirmedAt: entry.arrivalConfirmedAt?.toISOString() || null,
      departureDetectedAt: entry.departureDetectedAt?.toISOString() || null,
      departureReviewRequired: entry.departureReviewRequired,
    };
  }

  async getSalonCheckInQr(salonId: string) {
    const salon = await this.prisma.salon.findUnique({
      where: { id: salonId },
      select: { id: true, smartQueueGeofenceRadiusMeters: true },
    });
    if (!salon) throw new NotFoundException(`Salon with ID '${salonId}' not found.`);
    return {
      salonId,
      checkInToken: this.smartQueueSignature('salon-check-in', salonId),
      geofenceRadiusMeters: salon.smartQueueGeofenceRadiusMeters,
    };
  }

  async updateSmartQueueSettings(salonId: string, dto: SmartQueueSettingsDto) {
    if (dto.geofenceRadiusMeters === undefined) {
      return this.getSalonCheckInQr(salonId);
    }
    const radius = Math.round(dto.geofenceRadiusMeters);
    if (radius < 50 || radius > 500) {
      throw new BadRequestException('The SmartQueue radius must be between 50 and 500 metres.');
    }
    const salon = await this.prisma.salon.update({
      where: { id: salonId },
      data: { smartQueueGeofenceRadiusMeters: radius },
      select: { id: true, smartQueueGeofenceRadiusMeters: true },
    });
    return { salonId: salon.id, geofenceRadiusMeters: salon.smartQueueGeofenceRadiusMeters };
  }

  async confirmQueueEntryArrival(
    salonId: string,
    entryId: string,
    dto: SmartQueueCheckInDto,
    accessToken?: string,
  ) {
    if (!this.isValidSalonCheckInToken(salonId, dto.qrToken)) {
      throw new ForbiddenException('This salon check-in QR code is invalid.');
    }
    const entry = await this.prisma.salonQueueEntry.findFirst({ where: { id: entryId, salonId } });
    if (!entry) throw new NotFoundException(`Queue ticket '${entryId}' not found.`);
    this.requireQueueEntryAccess(entry, accessToken);
    if (!['waiting', 'called', 'skipped'].includes(entry.status)) {
      throw new BadRequestException('Only an active queue ticket can be checked in.');
    }
    if (entry.arrivalConfirmedAt) {
      return this.getCustomerQueueEntry(salonId, entryId, accessToken);
    }
    const now = new Date();
    const confirmed = await this.prisma.salonQueueEntry.updateMany({
      where: {
        id: entryId,
        salonId,
        status: { in: ['waiting', 'called', 'skipped'] },
        arrivalConfirmedAt: null,
      },
      data: { arrivalConfirmedAt: now, checkInMethod: 'qr' },
    });
    if (confirmed.count === 0) {
      const current = await this.prisma.salonQueueEntry.findFirst({
        where: { id: entryId, salonId },
      });
      if (current?.arrivalConfirmedAt) {
        return this.getCustomerQueueEntry(salonId, entryId, accessToken);
      }
      throw new BadRequestException('This queue ticket changed before check-in was saved.');
    }
    await this.logQueueEvent(salonId, entryId, entry.userId || 'customer', 'customer', 'queue.arrival.qr_confirmed', entry.status, entry.status);
    this.queueGateway.broadcastToSalon(salonId, 'queue.entry.arrival_confirmed', {
      entryId,
      method: 'qr',
      arrivalConfirmedAt: now.toISOString(),
    });
    return this.getCustomerQueueEntry(salonId, entryId, accessToken);
  }

  async updateQueueLocationConsent(
    salonId: string,
    entryId: string,
    dto: SmartQueueConsentDto,
    accessToken?: string,
  ) {
    const entry = await this.prisma.salonQueueEntry.findFirst({ where: { id: entryId, salonId } });
    if (!entry) throw new NotFoundException(`Queue ticket '${entryId}' not found.`);
    this.requireQueueEntryAccess(entry, accessToken);
    if (!['waiting', 'called', 'skipped'].includes(entry.status)) {
      throw new BadRequestException('Location assistance is no longer available for this ticket.');
    }
    const updated = await this.prisma.salonQueueEntry.update({
      where: { id: entryId },
      data: dto.enabled
        ? { locationConsent: true }
        : {
            locationConsent: false,
            lastLocationObservedAt: null,
            lastLocationAccuracy: null,
            outsideObservationCount: 0,
            firstOutsideObservedAt: null,
            departureDetectedAt: null,
            departureReviewRequired: false,
          },
      select: { locationConsent: true },
    });
    await this.logQueueEvent(salonId, entryId, entry.userId || 'customer', 'customer', 'queue.location.consent_changed', entry.status, entry.status, {
      enabled: updated.locationConsent,
    });
    return { success: true, locationConsent: updated.locationConsent };
  }

  async observeQueueEntryLocation(
    salonId: string,
    entryId: string,
    dto: SmartQueueLocationDto,
    accessToken?: string,
  ) {
    const entry = await this.prisma.salonQueueEntry.findFirst({ where: { id: entryId, salonId } });
    if (!entry) throw new NotFoundException(`Queue ticket '${entryId}' not found.`);
    this.requireQueueEntryAccess(entry, accessToken);
    if (!entry.locationConsent) {
      throw new ForbiddenException('Enable location assistance first.');
    }
    if (!['waiting', 'called', 'skipped'].includes(entry.status)) {
      return { accepted: false, reason: 'ticket_not_waiting', departureCandidate: false };
    }

    const observedAt = new Date(dto.observedAt);
    const now = new Date();
    if (
      Number.isNaN(observedAt.getTime()) ||
      observedAt.getTime() > now.getTime() + 30_000 ||
      now.getTime() - observedAt.getTime() > 2 * 60 * 1000
    ) {
      throw new BadRequestException('Location observation timestamp is stale or invalid.');
    }
    if (entry.lastLocationObservedAt && observedAt <= entry.lastLocationObservedAt) {
      return {
        accepted: false,
        reason: 'duplicate_observation',
        departureCandidate: Boolean(entry.departureDetectedAt),
        requiresStaffReview: entry.departureReviewRequired,
      };
    }
    if (dto.accuracyMeters > this.departureAccuracyLimitMeters) {
      return { accepted: false, reason: 'location_accuracy_too_low', departureCandidate: Boolean(entry.departureDetectedAt) };
    }

    const salon = await this.prisma.salon.findUnique({
      where: { id: salonId },
      select: { latitude: true, longitude: true, smartQueueGeofenceRadiusMeters: true },
    });
    if (!salon) throw new NotFoundException(`Salon with ID '${salonId}' not found.`);
    const distanceMeters = this.calculateDistanceMeters(
      dto.latitude,
      dto.longitude,
      salon.latitude,
      salon.longitude,
    );
    const isInside = distanceMeters <= salon.smartQueueGeofenceRadiusMeters;
    if (!entry.arrivalConfirmedAt) {
      const observed = await this.prisma.salonQueueEntry.updateMany({
        where: {
          id: entryId,
          salonId,
          status: { in: ['waiting', 'called', 'skipped'] },
          lastLocationObservedAt: entry.lastLocationObservedAt,
        },
        data: {
          lastLocationObservedAt: observedAt,
          lastLocationAccuracy: dto.accuracyMeters,
        },
      });
      if (observed.count === 0) {
        return { accepted: false, reason: 'observation_already_processed', arrivalAssistance: true };
      }
      return {
        accepted: true,
        nearSalon: isInside,
        arrivalAssistance: true,
        requiresQrCheckIn: isInside,
      };
    }

    const firstOutsideAt = isInside ? null : entry.firstOutsideObservedAt || observedAt;
    const outsideObservationCount = isInside ? 0 : (entry.outsideObservationCount || 0) + 1;
    const departureDetectedAt =
      !isInside &&
      outsideObservationCount >= this.minimumOutsideObservations &&
      firstOutsideAt &&
      observedAt.getTime() - firstOutsideAt.getTime() >= this.departureGracePeriodMs
        ? entry.departureDetectedAt || observedAt
        : isInside
          ? null
          : entry.departureDetectedAt;
    const departureReviewRequired = Boolean(
      departureDetectedAt && now.getTime() - departureDetectedAt.getTime() >= this.staffReviewDelayMs,
    );

    const updated = await this.prisma.salonQueueEntry.updateMany({
      where: {
        id: entryId,
        salonId,
        status: { in: ['waiting', 'called', 'skipped'] },
        lastLocationObservedAt: entry.lastLocationObservedAt,
      },
      data: {
        lastLocationObservedAt: observedAt,
        lastLocationAccuracy: dto.accuracyMeters,
        outsideObservationCount,
        firstOutsideObservedAt: firstOutsideAt,
        departureDetectedAt,
        departureReviewRequired,
      },
    });
    if (updated.count === 0) {
      return { accepted: false, reason: 'observation_already_processed', departureCandidate: Boolean(entry.departureDetectedAt) };
    }
    if (departureDetectedAt) {
      this.queueGateway.broadcastToSalon(salonId, 'queue.entry.departure_candidate', {
        entryId,
        detectedAt: departureDetectedAt.toISOString(),
        requiresStaffReview: departureReviewRequired,
      });
    }
    return {
      accepted: true,
      nearSalon: isInside,
      departureCandidate: Boolean(departureDetectedAt),
      requiresCustomerConfirmation: Boolean(departureDetectedAt),
      requiresStaffReview: departureReviewRequired,
    };
  }

  async respondToQueueDeparture(
    salonId: string,
    entryId: string,
    dto: SmartQueueDepartureResponseDto,
    accessToken?: string,
  ) {
    const entry = await this.prisma.salonQueueEntry.findFirst({ where: { id: entryId, salonId } });
    if (!entry) throw new NotFoundException(`Queue ticket '${entryId}' not found.`);
    this.requireQueueEntryAccess(entry, accessToken);
    if (!entry.departureDetectedAt) {
      throw new BadRequestException('There is no departure confirmation to respond to.');
    }
    if (!['waiting', 'called', 'skipped'].includes(entry.status)) {
      throw new BadRequestException('This queue ticket can no longer be changed by the customer.');
    }

    if (dto.response === 'left') {
      validateQueueTransition(entry.status, 'cancelled');
      const now = new Date();
      const updated = await this.prisma.salonQueueEntry.updateMany({
        where: {
          id: entryId,
          salonId,
          status: { in: ['waiting', 'called', 'skipped'] },
          departureDetectedAt: { not: null },
        },
        data: {
          status: 'cancelled',
          cancelledAt: now,
          departureConfirmedAt: now,
          departureConfirmationSource: 'customer',
          departureReviewRequired: false,
          cancellationReason: 'Customer confirmed leaving before service',
        },
      });
      if (updated.count === 0) {
        throw new BadRequestException('This queue ticket changed before the departure response was saved.');
      }
      await this.logQueueEvent(salonId, entryId, entry.userId || 'customer', 'customer', 'queue.departure.customer_confirmed', entry.status, 'cancelled');
      const queueData = await this.queueEngine.recalculateSalonQueue(salonId, { force: true, persist: true });
      this.syncLocalQueueCache(salonId, queueData.overview.totalWaiting);
      this.queueGateway.broadcastToSalon(salonId, 'queue.entry.updated', {
        entryId,
        status: 'cancelled',
        overview: queueData.overview,
        entries: queueData.activeEntries,
      });
      return { success: true, status: 'cancelled', overview: queueData.overview };
    }

    await this.prisma.salonQueueEntry.update({
      where: { id: entryId },
      data: {
        outsideObservationCount: 0,
        firstOutsideObservedAt: null,
        departureDetectedAt: null,
        departureReviewRequired: false,
      },
    });
    await this.logQueueEvent(salonId, entryId, entry.userId || 'customer', 'customer', `queue.departure.${dto.response}`, entry.status, entry.status);
    return { success: true, status: entry.status };
  }

  async confirmQueueDepartureByStaff(salonId: string, entryId: string, actorId?: string) {
    const entry = await this.prisma.salonQueueEntry.findFirst({ where: { id: entryId, salonId } });
    if (!entry) throw new NotFoundException(`Queue ticket '${entryId}' not found.`);
    if (!['waiting', 'called', 'skipped'].includes(entry.status)) {
      throw new BadRequestException('Only a waiting customer can be marked as having left.');
    }
    validateQueueTransition(entry.status, 'no_show');
    const now = new Date();
    const updated = await this.prisma.salonQueueEntry.updateMany({
      where: { id: entryId, salonId, status: { in: ['waiting', 'called', 'skipped'] } },
      data: {
        status: 'no_show',
        departureConfirmedAt: now,
        departureConfirmationSource: 'staff',
        departureReviewRequired: false,
        departureDetectedAt: null,
        locationConsent: false,
        lastLocationObservedAt: null,
        lastLocationAccuracy: null,
        outsideObservationCount: 0,
        firstOutsideObservedAt: null,
      },
    });
    if (updated.count === 0) {
      throw new BadRequestException('This queue ticket is no longer waiting for service.');
    }
    await this.logQueueEvent(salonId, entryId, actorId || 'staff', 'staff', 'queue.departure.staff_confirmed', entry.status, 'no_show');
    const queueData = await this.queueEngine.recalculateSalonQueue(salonId, { force: true, persist: true });
    this.syncLocalQueueCache(salonId, queueData.overview.totalWaiting);
    this.queueGateway.broadcastToSalon(salonId, 'queue.entry.updated', {
      entryId,
      status: 'no_show',
      overview: queueData.overview,
      entries: queueData.activeEntries,
    });
    return { success: true, status: 'no_show', overview: queueData.overview };
  }

  async customerCancelQueueEntry(salonId: string, entryId: string, accessToken?: string) {
    const entry = await this.prisma.salonQueueEntry.findFirst({ where: { id: entryId, salonId } });
    if (!entry) throw new NotFoundException(`Queue ticket '${entryId}' not found.`);
    this.requireQueueEntryAccess(entry, accessToken);
    if (!['waiting', 'called', 'skipped'].includes(entry.status)) {
      throw new BadRequestException('Only an unserved queue ticket can be cancelled by the customer.');
    }
    validateQueueTransition(entry.status, 'cancelled');
    const now = new Date();
    const updated = await this.prisma.salonQueueEntry.updateMany({
      where: { id: entryId, salonId, status: { in: ['waiting', 'called', 'skipped'] } },
      data: {
        status: 'cancelled',
        cancelledAt: now,
        departureConfirmedAt: entry.departureDetectedAt ? now : null,
        departureConfirmationSource: entry.departureDetectedAt ? 'customer' : null,
        departureReviewRequired: false,
        cancellationReason: 'Customer cancelled their queue ticket',
      },
    });
    if (updated.count === 0) {
      throw new BadRequestException('This queue ticket is no longer waiting for service.');
    }
    await this.logQueueEvent(salonId, entryId, entry.userId || 'customer', 'customer', 'queue.entry.customer_cancelled', entry.status, 'cancelled');
    const queueData = await this.queueEngine.recalculateSalonQueue(salonId, { force: true, persist: true });
    this.syncLocalQueueCache(salonId, queueData.overview.totalWaiting);
    this.queueGateway.broadcastToSalon(salonId, 'queue.entry.updated', {
      entryId,
      status: 'cancelled',
      overview: queueData.overview,
      entries: queueData.activeEntries,
    });
    return { success: true, status: 'cancelled', overview: queueData.overview };
  }

  /**
   * 3. Add customer to queue (With service duration & price snapshotting!)
   */
  async addQueueEntry(salonId: string, dto: CreateQueueEntryDto, actorId?: string) {
    const entryId = `q-${randomUUID()}`;
    const cleanName = (dto.customerName || '').trim() || 'Walk-in Customer';
    const cleanPhone = (dto.phone || '').trim() || null;
    const cleanDeviceId = (dto.deviceId || '').trim() || null;
    const cleanService = (dto.serviceName || '').trim() || 'Haircut & Styling';
    const checkInMethod = dto.checkInToken ? 'qr' : 'online';

    if (dto.checkInToken && !this.isValidSalonCheckInToken(salonId, dto.checkInToken)) {
      throw new ForbiddenException('This salon check-in QR code is invalid.');
    }

    // Verify salon exists & queue is not closed
    const salon = await this.prisma.salon.findUnique({
      where: { id: salonId },
      select: {
        id: true,
        name: true,
        isOpen: true,
        queueStatus: true,
        openingHoursOpen: true,
        openingHoursClose: true,
        avgServiceTimeMinutes: true,
        startingPrice: true,
      },
    });
    if (!salon) {
      throw new NotFoundException(`Salon with ID '${salonId}' not found`);
    }
    if (
      salon.isOpen === false ||
      salon.queueStatus === 'closed' ||
      isSalonPastClosingTime(salon.openingHoursClose, salon.openingHoursOpen)
    ) {
      throw new BadRequestException('This salon queue is currently closed.');
    }

    // SNAPSHOT: Look up service configuration to lock duration & price for this ticket
    let snapshotDuration = salon.avgServiceTimeMinutes || 20;
    let snapshotPrice = Number(salon.startingPrice || 150);
    let matchedServiceId = dto.serviceId || null;

    try {
      let matchedService: any = null;
      if (dto.serviceId) {
        matchedService = await this.prisma.salonService.findFirst({
          where: { id: dto.serviceId, salonId },
        });
      }
      if (!matchedService && cleanService) {
        matchedService = await this.prisma.salonService.findFirst({
          where: {
            salonId,
            name: { equals: cleanService, mode: 'insensitive' },
          },
        });
      }
      if (matchedService) {
        snapshotDuration = matchedService.durationMinutes || snapshotDuration;
        snapshotPrice = Number(matchedService.price) || snapshotPrice;
        matchedServiceId = matchedService.id;
      }
    } catch {}

    // Validate token configuration before creating a durable queue entry.
    const joinedAt = new Date();
    const queueAccessToken = this.queueEntryAccessToken({ id: entryId, salonId, joinedAt });
    const startOfToday = getStartOfTodayIST();
    const { entry, nextPos, ticketNumber } = await this.prisma.runTransaction(
      'queue.entry.create',
      async (tx) => {
        await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${salonId}), hashtext('queue-position'))`;
        const [maxRow] = await tx.$queryRaw<Array<{ max_pos: number; max_ticket: number }>>`
          SELECT
            COALESCE(MAX(position) FILTER (WHERE status IN ('waiting', 'called', 'in_service', 'skipped')), 0)::int AS max_pos,
            COALESCE(
              MAX(NULLIF(regexp_replace(ticket_number, '[^0-9]', '', 'g'), '')::int),
              0
            )::int AS max_ticket
          FROM public.salon_queue_entries
          WHERE salon_id = ${salonId} AND joined_at >= ${startOfToday}
        `;
        const nextPos = Number(maxRow?.max_pos || 0) + 1;
        const ticketNumber = `#${String(Number(maxRow?.max_ticket || 0) + 1).padStart(2, '0')}`;
        const phoneIdentity = cleanPhone?.replace(/\D/g, '') || null;
        const identityConditions = [
          ...(actorId ? [Prisma.sql`user_id = ${actorId}`] : []),
          ...(cleanDeviceId ? [Prisma.sql`device_id = ${cleanDeviceId}`] : []),
          ...(phoneIdentity
            ? [Prisma.sql`regexp_replace(COALESCE(phone, ''), '[^0-9]', '', 'g') = ${phoneIdentity}`]
            : []),
        ];
        if (identityConditions.length > 0) {
          const [existingEntry] = await tx.$queryRaw<Array<{ ticket_number: string | null; position: number }>>(
            Prisma.sql`
              SELECT ticket_number, position
              FROM public.salon_queue_entries
              WHERE salon_id = ${salonId}
                AND status IN ('waiting', 'called', 'in_service', 'skipped', 'no_show')
                AND (${Prisma.join(identityConditions, ' OR ')})
              ORDER BY joined_at DESC
              LIMIT 1
            `,
          );
          if (existingEntry) {
            const existingTicket =
              existingEntry.ticket_number || `#${String(existingEntry.position).padStart(2, '0')}`;
            throw new ConflictException(
              `You already have an active queue ticket (${existingTicket}). Leave that queue before joining again.`,
            );
          }
        }
        const entry = await tx.salonQueueEntry.create({
          data: {
            id: entryId,
            salonId,
            position: nextPos,
            ticketNumber,
            customerName: cleanName,
            phone: cleanPhone,
            serviceName: cleanService,
            serviceId: matchedServiceId,
            serviceDuration: snapshotDuration,
            servicePrice: snapshotPrice,
            assignedStaffId: dto.preferredStaffId || null,
            status: 'waiting',
            joinedAt,
            deviceId: cleanDeviceId,
            userId: actorId || null,
            notes: dto.notes || null,
            checkInMethod,
            partySize: dto.partySize || 1,
            arrivalConfirmedAt: checkInMethod === 'qr' ? joinedAt : null,
          },
        });
        return { entry, nextPos, ticketNumber };
      },
    );

    // Audit Event
    await this.logQueueEvent(
      salonId,
      entryId,
      actorId || dto.userId || 'customer',
      'customer',
      'queue.entry.created',
      null,
      'waiting',
      {
        ticketNumber,
        serviceName: cleanService,
        serviceDuration: snapshotDuration,
        price: snapshotPrice,
      },
    );

    // Recalculate whole queue with intelligent engine
    const queueData = await this.queueEngine.recalculateSalonQueue(salonId, { force: true, persist: true });
    this.syncLocalQueueCache(salonId, queueData.overview.totalWaiting);
    const createdItem = queueData.activeEntries.find((e) => e.id === entryId);

    // Broadcast real-time WebSockets
    this.queueGateway.broadcastToSalon(salonId, 'queue.entry.created', {
      entry: createdItem,
      overview: queueData.overview,
    });
    this.queueGateway.broadcastToSalon(salonId, 'queue.eta.updated', {
      overview: queueData.overview,
      entries: queueData.activeEntries,
    });

    return {
      success: true,
      entry: createdItem || {
        id: entryId,
        position: nextPos,
        ticketNumber,
        customerName: cleanName,
        phone: cleanPhone,
        serviceName: cleanService,
        serviceDuration: snapshotDuration,
        servicePrice: snapshotPrice,
        status: 'waiting',
        joinedAt: new Date().toISOString(),
      },
      queueAccessToken,
      smartQueue: {
        checkInMethod: entry.checkInMethod,
        partySize: entry.partySize,
        arrivalConfirmedAt: entry.arrivalConfirmedAt?.toISOString() || null,
        locationConsent: entry.locationConsent,
      },
      currentQueue: queueData.overview.totalWaiting,
      overview: queueData.overview,
    };
  }

  /**
   * 4. Start Service (Transition: WAITING/CALLED -> IN_SERVICE)
   */
  async startService(salonId: string, entryId: string, dto: StartServiceDto, actorId?: string) {
    const entry = await this.prisma.salonQueueEntry.findFirst({
      where: { id: entryId, salonId },
    });
    if (!entry) throw new NotFoundException(`Queue ticket '${entryId}' not found.`);

    validateQueueTransition(entry.status, 'in_service');

    let targetStaffId: string | null = dto.staffId || entry.assignedStaffId || null;
    const now = new Date();

    await this.prisma.runTransaction('queue.service.start', async (tx) => {
      if (dto.staffId) {
        const reserved = await tx.salonStaff.updateMany({
          where: {
            id: dto.staffId,
            salonId,
            status: 'active',
            availability: 'AVAILABLE',
            currentQueueEntryId: null,
          },
          data: { availability: 'BUSY', currentQueueEntryId: entryId },
        });
        if (reserved.count === 0) {
          throw new BadRequestException('The selected staff member is not available.');
        }
      } else {
        const staffCandidates = await tx.salonStaff.findMany({
          where: { salonId, status: 'active', availability: 'AVAILABLE', currentQueueEntryId: null },
          select: { id: true },
          orderBy: { createdAt: 'asc' },
        });
        const orderedCandidates = targetStaffId
          ? [...staffCandidates].sort((a, b) => Number(b.id === targetStaffId) - Number(a.id === targetStaffId))
          : staffCandidates;
        targetStaffId = null;
        for (const candidate of orderedCandidates) {
          const reserved = await tx.salonStaff.updateMany({
            where: {
              id: candidate.id,
              salonId,
              status: 'active',
              availability: 'AVAILABLE',
              currentQueueEntryId: null,
            },
            data: { availability: 'BUSY', currentQueueEntryId: entryId },
          });
          if (reserved.count > 0) {
            targetStaffId = candidate.id;
            break;
          }
        }
      }

      const updated = await tx.salonQueueEntry.updateMany({
        where: { id: entryId, salonId, status: entry.status },
        data: {
          status: 'in_service',
          startedAt: now,
          assignedStaffId: targetStaffId,
          notes: dto.notes ? (entry.notes ? `${entry.notes} | ${dto.notes}` : dto.notes) : entry.notes,
        },
      });
      if (updated.count === 0) {
        throw new BadRequestException('This queue ticket changed before service could start.');
      }
    });

    await this.logQueueEvent(salonId, entryId, actorId || 'staff', 'staff', 'queue.service.started', entry.status, 'in_service', {
      staffId: targetStaffId,
      startedAt: now.toISOString(),
    });

    const queueData = await this.queueEngine.recalculateSalonQueue(salonId, { force: true, persist: true });
    this.syncLocalQueueCache(salonId, queueData.overview.totalWaiting);

    this.queueGateway.broadcastToSalon(salonId, 'queue.service.started', {
      entryId,
      staffId: targetStaffId,
      startedAt: now.toISOString(),
      overview: queueData.overview,
      entries: queueData.activeEntries,
    });

    return {
      success: true,
      entryId,
      status: 'in_service',
      startedAt: now.toISOString(),
      overview: queueData.overview,
    };
  }

  /**
   * 5. Complete Service (Transition: IN_SERVICE -> COMPLETED)
   * Staff confirmation required — NEVER auto-completes purely on timer!
   */
  async completeService(salonId: string, entryId: string, dto: CompleteServiceDto, actorId?: string) {
    const entry = await this.prisma.salonQueueEntry.findFirst({
      where: { id: entryId, salonId },
    });
    if (!entry) throw new NotFoundException(`Queue ticket '${entryId}' not found.`);

    validateQueueTransition(entry.status, 'completed');

    const now = new Date();
    const startedMs = entry.startedAt ? entry.startedAt.getTime() : (now.getTime() - (entry.serviceDuration || 20) * 60000);
    const actualDuration = Math.max(1, Math.round((now.getTime() - startedMs) / 60000));
    const finalPrice = dto.actualPrice !== undefined ? dto.actualPrice : Number(entry.servicePrice || 150);

    await this.prisma.runTransaction('queue.service.complete', async (tx) => {
      // 1. Update queue entry
      const updatedEntry = await tx.salonQueueEntry.updateMany({
        where: { id: entryId, salonId, status: entry.status },
        data: {
          status: 'completed',
          servedAt: now,
        },
      });
      if (updatedEntry.count === 0) {
        throw new BadRequestException('This queue ticket changed before the service could be completed.');
      }

      // 2. Insert historical service session
      await tx.serviceSession.create({
        data: {
          id: `sess-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          salonId,
          queueEntryId: entryId,
          staffId: entry.assignedStaffId,
          customerName: entry.customerName,
          serviceName: entry.serviceName,
          startedAt: entry.startedAt || new Date(startedMs),
          completedAt: now,
          expectedDurationMinutes: (entry.serviceDuration || 20) + (entry.extendedMinutes || 0),
          actualDurationMinutes: actualDuration,
          price: finalPrice,
          notes: dto.notes || null,
        },
      });

      // 3. Release staff member
      if (entry.assignedStaffId) {
        await tx.salonStaff.update({
          where: { id: entry.assignedStaffId },
          data: {
            availability: 'AVAILABLE',
            currentQueueEntryId: null,
          },
        });
      }

      // 4. Update salon revenue and customers served
      await tx.salon.update({
        where: { id: salonId },
        data: {
          todayCustomersServed: { increment: 1 },
          todayRevenue: { increment: finalPrice },
          monthlyRevenue: { increment: finalPrice },
        },
      });
    });

    await this.logQueueEvent(salonId, entryId, actorId || 'staff', 'staff', 'queue.service.completed', entry.status, 'completed', {
      actualDuration,
      price: finalPrice,
    });

    const queueData = await this.queueEngine.recalculateSalonQueue(salonId, { force: true, persist: true });
    this.syncLocalQueueCache(salonId, queueData.overview.totalWaiting);

    this.queueGateway.broadcastToSalon(salonId, 'queue.service.completed', {
      entryId,
      actualDuration,
      price: finalPrice,
      overview: queueData.overview,
      entries: queueData.activeEntries,
    });

    return {
      success: true,
      entryId,
      status: 'completed',
      actualDurationMinutes: actualDuration,
      overview: queueData.overview,
    };
  }

  /**
   * 6. Call Customer (Transition: WAITING -> CALLED)
   */
  async callCustomer(salonId: string, entryId: string, actorId?: string) {
    const entry = await this.prisma.salonQueueEntry.findFirst({
      where: { id: entryId, salonId },
    });
    if (!entry) throw new NotFoundException(`Queue ticket '${entryId}' not found.`);

    validateQueueTransition(entry.status, 'called');

    const now = new Date();
    await this.prisma.salonQueueEntry.update({
      where: { id: entryId },
      data: { status: 'called', calledAt: now },
    });

    await this.logQueueEvent(salonId, entryId, actorId || 'staff', 'staff', 'queue.entry.called', entry.status, 'called');

    const queueData = await this.queueEngine.recalculateSalonQueue(salonId, { force: true, persist: true });
    this.syncLocalQueueCache(salonId, queueData.overview.totalWaiting);

    this.queueGateway.broadcastToSalon(salonId, 'queue.entry.called', {
      entryId,
      calledAt: now.toISOString(),
      overview: queueData.overview,
      entries: queueData.activeEntries,
    });

    return { success: true, entryId, status: 'called' };
  }

  /**
   * 7. Skip Customer (Transition: WAITING/CALLED -> SKIPPED)
   */
  async skipCustomer(salonId: string, entryId: string, actorId?: string) {
    const entry = await this.prisma.salonQueueEntry.findFirst({
      where: { id: entryId, salonId },
    });
    if (!entry) throw new NotFoundException(`Queue ticket '${entryId}' not found.`);

    validateQueueTransition(entry.status, 'skipped');

    await this.prisma.salonQueueEntry.update({
      where: { id: entryId },
      data: { status: 'skipped' },
    });

    await this.logQueueEvent(salonId, entryId, actorId || 'staff', 'staff', 'queue.entry.skipped', entry.status, 'skipped');

    const queueData = await this.queueEngine.recalculateSalonQueue(salonId, { force: true, persist: true });
    this.syncLocalQueueCache(salonId, queueData.overview.totalWaiting);

    this.queueGateway.broadcastToSalon(salonId, 'queue.entry.updated', {
      entryId,
      status: 'skipped',
      overview: queueData.overview,
      entries: queueData.activeEntries,
    });

    return { success: true, entryId, status: 'skipped' };
  }

  /**
   * 8. Recall Customer (Transition: SKIPPED -> WAITING)
   */
  async recallCustomer(salonId: string, entryId: string, actorId?: string) {
    const entry = await this.prisma.salonQueueEntry.findFirst({
      where: { id: entryId, salonId },
    });
    if (!entry) throw new NotFoundException(`Queue ticket '${entryId}' not found.`);

    validateQueueTransition(entry.status, 'waiting');

    const updated = await this.prisma.salonQueueEntry.updateMany({
      where: { id: entryId, salonId, status: entry.status },
      data: {
        status: 'waiting',
        ...(entry.status === 'no_show'
          ? {
              departureDetectedAt: null,
              departureConfirmedAt: null,
              departureConfirmationSource: null,
              departureReviewRequired: false,
              locationConsent: false,
              lastLocationObservedAt: null,
              lastLocationAccuracy: null,
              outsideObservationCount: 0,
              firstOutsideObservedAt: null,
            }
          : {}),
      },
    });
    if (updated.count === 0) {
      throw new BadRequestException('This queue ticket changed before it could be restored.');
    }

    await this.logQueueEvent(salonId, entryId, actorId || 'staff', 'staff', 'queue.entry.recalled', entry.status, 'waiting');

    const queueData = await this.queueEngine.recalculateSalonQueue(salonId, { force: true, persist: true });
    this.syncLocalQueueCache(salonId, queueData.overview.totalWaiting);

    this.queueGateway.broadcastToSalon(salonId, 'queue.entry.updated', {
      entryId,
      status: 'waiting',
      overview: queueData.overview,
      entries: queueData.activeEntries,
    });

    return { success: true, entryId, status: 'waiting' };
  }

  /**
   * 9. Cancel Queue Entry
   */
  async cancelQueueEntry(salonId: string, entryId: string, dto?: CancelQueueEntryDto, actorId?: string) {
    const entry = await this.prisma.salonQueueEntry.findFirst({
      where: { id: entryId, salonId },
    });
    if (!entry) throw new NotFoundException(`Queue ticket '${entryId}' not found.`);

    validateQueueTransition(entry.status, 'cancelled');

    const now = new Date();

    await this.prisma.runTransaction('queue.entry.cancel', async (tx) => {
      const updated = await tx.salonQueueEntry.updateMany({
        where: { id: entryId, salonId, status: entry.status },
        data: {
          status: 'cancelled',
          cancelledAt: now,
          cancellationReason: dto?.reason || 'Cancelled by staff or customer',
        },
      });
      if (updated.count === 0) {
        throw new BadRequestException('This queue ticket changed before it could be cancelled.');
      }

      // If customer was in service, release staff
      if (entry.status === 'in_service' && entry.assignedStaffId) {
        await tx.salonStaff.update({
          where: { id: entry.assignedStaffId },
          data: { availability: 'AVAILABLE', currentQueueEntryId: null },
        }).catch(() => {});
      }
    });

    await this.logQueueEvent(salonId, entryId, actorId || 'staff', 'staff', 'queue.entry.cancelled', entry.status, 'cancelled', {
      reason: dto?.reason,
    });

    const queueData = await this.queueEngine.recalculateSalonQueue(salonId, { force: true, persist: true });
    this.syncLocalQueueCache(salonId, queueData.overview.totalWaiting);

    this.queueGateway.broadcastToSalon(salonId, 'queue.entry.updated', {
      entryId,
      status: 'cancelled',
      overview: queueData.overview,
      entries: queueData.activeEntries,
    });

    return { success: true, entryId, status: 'cancelled' };
  }

  /**
   * 10. Extend Service Time
   */
  async extendService(salonId: string, entryId: string, dto: ExtendServiceDto, actorId?: string) {
    const entry = await this.prisma.salonQueueEntry.findFirst({
      where: { id: entryId, salonId },
    });
    if (!entry) throw new NotFoundException(`Queue ticket '${entryId}' not found.`);
    if (entry.status !== 'in_service') {
      throw new BadRequestException('Only active in-service tickets can have their duration extended.');
    }

    const addedMins = Number(dto.additionalMinutes || 10);

    await this.prisma.salonQueueEntry.update({
      where: { id: entryId },
      data: {
        extendedMinutes: { increment: addedMins },
      },
    });

    await this.logQueueEvent(salonId, entryId, actorId || 'staff', 'staff', 'queue.service.extended', entry.status, 'in_service', {
      additionalMinutes: addedMins,
      reason: dto.reason,
    });

    const queueData = await this.queueEngine.recalculateSalonQueue(salonId, { force: true, persist: true });

    this.queueGateway.broadcastToSalon(salonId, 'queue.eta.updated', {
      overview: queueData.overview,
      entries: queueData.activeEntries,
    });

    return { success: true, entryId, extendedMinutes: (entry.extendedMinutes || 0) + addedMins };
  }

  /**
   * 11. Reassign Staff
   */
  async reassignStaff(salonId: string, entryId: string, dto: ReassignStaffDto, actorId?: string) {
    const entry = await this.prisma.salonQueueEntry.findFirst({
      where: { id: entryId, salonId },
    });
    if (!entry) throw new NotFoundException(`Queue ticket '${entryId}' not found.`);

    const newStaff = await this.prisma.salonStaff.findFirst({
      where: { id: dto.staffId, salonId },
    });
    if (!newStaff) throw new NotFoundException(`Staff member '${dto.staffId}' not found.`);

    await this.prisma.runTransaction('queue.entry.reassign_staff', async (tx) => {
      // If was in_service, release old staff
      if (entry.status === 'in_service' && entry.assignedStaffId && entry.assignedStaffId !== dto.staffId) {
        await tx.salonStaff.update({
          where: { id: entry.assignedStaffId },
          data: { availability: 'AVAILABLE', currentQueueEntryId: null },
        }).catch(() => {});

        await tx.salonStaff.update({
          where: { id: dto.staffId },
          data: { availability: 'BUSY', currentQueueEntryId: entryId },
        }).catch(() => {});
      }

      await tx.salonQueueEntry.update({
        where: { id: entryId },
        data: { assignedStaffId: dto.staffId },
      });
    });

    await this.logQueueEvent(salonId, entryId, actorId || 'staff', 'staff', 'queue.staff.reassigned', entry.status, entry.status, {
      fromStaff: entry.assignedStaffId,
      toStaff: dto.staffId,
      reason: dto.reason,
    });

    const queueData = await this.queueEngine.recalculateSalonQueue(salonId, { force: true, persist: true });

    this.queueGateway.broadcastToSalon(salonId, 'queue.entry.updated', {
      entryId,
      assignedStaffId: dto.staffId,
      overview: queueData.overview,
      entries: queueData.activeEntries,
    });

    return { success: true, entryId, assignedStaffId: dto.staffId };
  }

  /**
   * 12. Update Queue Status (Open / Paused / Closed)
   */
  async updateQueueStatus(salonId: string, dto: UpdateQueueStatusDto, actorId?: string) {
    const status = dto.status;
    const isOpen = status !== 'closed';

    await this.prisma.salon.update({
      where: { id: salonId },
      data: {
        queueStatus: status,
        isOpen,
        lastQueueUpdate: new Date(),
      },
    });

    if (status === 'closed' || !isOpen) {
      await this.clearQueue(salonId, { clearOption: 'cancelled', reason: dto.reason || 'Shop closed for the day' }, actorId);
    } else {
      await this.queueEngine.recalculateSalonQueue(salonId, { force: true, persist: true });
    }

    await this.logQueueEvent(salonId, null, actorId || 'owner', 'owner', 'queue.status.updated', null, status, {
      reason: dto.reason,
    });

    this.queueGateway.broadcastToSalon(salonId, 'queue.status.updated', {
      queueStatus: status,
      isOpen,
      reason: dto.reason,
    });

    return { success: true, queueStatus: status, isOpen };
  }

  /**
   * 13. Clear Active Queue with audit & history preservation
   */
  async clearQueue(salonId: string, dto?: ClearQueueDto, actorId?: string) {
    const now = new Date();
    const reason = dto?.reason || 'Queue cleared at end of day by salon partner';

    // Never delete completed service sessions! Only update remaining active tickets.
    await this.prisma.runTransaction('queue.clear', async (tx) => {
      await tx.salonQueueEntry.updateMany({
        where: {
          salonId,
          status: { in: ['waiting', 'called', 'in_service', 'skipped'] },
        },
        data: {
          status: 'cancelled',
          cancelledAt: now,
          cancellationReason: reason,
        },
      });

      // Release all staff to AVAILABLE
      await tx.salonStaff.updateMany({
        where: { salonId },
        data: {
          availability: 'AVAILABLE',
          currentQueueEntryId: null,
          breakStartedAt: null,
        },
      });

      // Reset queue counter
      await tx.salon.update({
        where: { id: salonId },
        data: {
          currentQueue: 0,
          lastQueueUpdate: now,
        },
      });
    });

    this.syncLocalQueueCache(salonId, 0);
    await this.queueEngine.recalculateSalonQueue(salonId, { force: true, persist: true });

    await this.logQueueEvent(salonId, null, actorId || 'owner', 'owner', 'queue.cleared', null, 'cleared', {
      clearOption: dto?.clearOption || 'cancelled',
      reason,
    });

    this.queueGateway.broadcastToSalon(salonId, 'queue.cleared', {
      salonId,
      clearedAt: now.toISOString(),
      reason,
    });

    return { success: true, message: 'Active queue cleared. Completed history preserved.' };
  }

  /**
   * Backwards-compatible status update router
   */
  async updateQueueEntryStatus(salonId: string, entryId: string, status: string = 'completed') {
    const normalized = (status || '').toLowerCase();
    if (normalized === 'in_service') {
      return this.startService(salonId, entryId, {});
    }
    if (normalized === 'completed') {
      return this.completeService(salonId, entryId, {});
    }
    if (normalized === 'called') {
      return this.callCustomer(salonId, entryId);
    }
    if (normalized === 'skipped') {
      return this.skipCustomer(salonId, entryId);
    }
    if (normalized === 'cancelled') {
      return this.cancelQueueEntry(salonId, entryId);
    }
    if (normalized === 'waiting') {
      return this.recallCustomer(salonId, entryId);
    }
    throw new BadRequestException(`Unsupported queue status '${status}'.`);
  }

  /**
   * Backwards-compatible clear entries
   */
  async clearQueueEntries(salonId: string) {
    return this.clearQueue(salonId, { clearOption: 'cancelled' });
  }

  // ==========================================================================
  // STAFF AVAILABILITY MANAGEMENT
  // ==========================================================================

  async getSalonStaff(salonId: string) {
    const staffList = await this.prisma.salonStaff.findMany({
      where: { salonId, status: 'active' },
      orderBy: { createdAt: 'asc' },
    });

    return staffList;
  }

  async updateStaffStatus(salonId: string, staffId: string, dto: UpdateStaffStatusDto, actorId?: string) {
    const staff = await this.prisma.salonStaff.findFirst({
      where: { id: staffId, salonId },
    });
    if (!staff) throw new NotFoundException(`Staff '${staffId}' not found in salon '${salonId}'.`);

    const now = new Date();
    const updateData: any = {
      availability: dto.availability,
    };

    if (dto.availability === 'ON_BREAK') {
      updateData.breakStartedAt = now;
    } else if (dto.availability === 'AVAILABLE') {
      updateData.breakStartedAt = null;
    }

    const updated = await this.prisma.salonStaff.update({
      where: { id: staffId },
      data: updateData,
    });

    await this.logQueueEvent(salonId, null, actorId || 'owner', 'staff', 'staff.availability.updated', staff.availability, dto.availability, {
      staffId,
      staffName: staff.name,
      note: dto.note,
    });

    const queueData = await this.queueEngine.recalculateSalonQueue(salonId, { force: true, persist: true });

    this.queueGateway.broadcastToSalon(salonId, 'staff.availability.updated', {
      staffId,
      availability: dto.availability,
      overview: queueData.overview,
      entries: queueData.activeEntries,
    });

    return updated;
  }

  // ==========================================================================
  // SERVICE DURATION & PRICING MANAGEMENT
  // ==========================================================================

  async getSalonServices(salonId: string) {
    return this.prisma.salonService.findMany({
      where: { salonId, isAvailable: true },
      orderBy: { price: 'asc' },
    });
  }

  async upsertSalonService(salonId: string, dto: UpsertServiceDto, serviceId?: string) {
    if (serviceId) {
      return this.prisma.salonService.update({
        where: { id: serviceId },
        data: {
          name: dto.name,
          category: dto.category || 'General',
          price: dto.price,
          durationMinutes: dto.durationMinutes,
          description: dto.description,
          isAvailable: true,
        },
      });
    }

    const newId = `srv-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    return this.prisma.salonService.create({
      data: {
        id: newId,
        salonId,
        name: dto.name,
        category: dto.category || 'General',
        price: dto.price,
        durationMinutes: dto.durationMinutes,
        description: dto.description,
        isAvailable: true,
      },
    });
  }

  async deleteSalonService(salonId: string, serviceId: string) {
    return this.prisma.salonService.update({
      where: { id: serviceId },
      data: { isAvailable: false },
    });
  }

  // ==========================================================================
  // SERVICE SESSION HISTORY & AUDIT REPORTING
  // ==========================================================================

  async getServiceHistory(salonId: string, page = 1, limit = 50) {
    const offset = (page - 1) * limit;
    const [sessions, total] = await Promise.all([
      this.prisma.serviceSession.findMany({
        where: { salonId },
        orderBy: { completedAt: 'desc' },
        skip: offset,
        take: limit,
        include: {
          staff: { select: { id: true, name: true, role: true } },
        },
      }),
      this.prisma.serviceSession.count({ where: { salonId } }),
    ]);

    return {
      sessions,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // Internal accessor for discovery engine
  getAllLocalSalons(): any[] {
    return Array.from(this.localSalons.values());
  }

  // ==========================================================================
  // ADMINISTRATOR SALON GOVERNANCE & SAFE DELETION
  // ==========================================================================

  async getAllSalonsForAdmin(): Promise<any[]> {
    try {
      const dbSalons = await this.prisma.salon.findMany({
        include: {
          services: true,
          staff: true,
          members: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      return dbSalons.map((s) => ({
        id: s.id,
        name: s.name,
        tagline: s.tagline,
        ownerName: s.ownerName,
        ownerId: s.ownerId,
        phone: s.phone,
        email: s.email,
        address: s.address,
        locality: s.locality,
        city: s.city,
        state: s.state,
        pincode: s.pincode,
        coordinates: { lat: s.latitude, lng: s.longitude },
        currentQueue: s.currentQueue,
        isVerified: s.isVerified,
        status: s.status,
        rating: Number(s.rating),
        reviewCount: s.reviewCount,
        startingPrice: Number(s.startingPrice),
        isOpen: s.isOpen,
        servicesCount: s.services.length,
        staffCount: s.staff.length,
        membersCount: s.members.length,
        createdAt: s.createdAt,
        coverImage: s.coverImage,
      }));
    } catch (err: any) {
      this.logger.error(`Failed to load salons for admin: ${err.message}`);
      return Array.from(this.localSalons.values());
    }
  }

  async verifySalon(id: string, isVerified: boolean, actor: AuthenticatedUser): Promise<any> {
    const salon = await this.prisma.salon.findUnique({ where: { id } });
    if (!salon) {
      throw new NotFoundException(`Salon with ID "${id}" not found`);
    }

    const updated = await this.prisma.salon.update({
      where: { id },
      data: { isVerified },
    });

    if (this.localSalons.has(id)) {
      this.localSalons.get(id).isVerified = isVerified;
    }

    // Audit log
    await this.prisma.adminAuditLog.create({
      data: {
        id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        actorId: actor.id,
        actorEmail: actor.email,
        action: isVerified ? 'APPROVE_SALON' : 'UNVERIFY_SALON',
        targetType: 'SALON',
        targetId: id,
        targetName: salon.name,
        details: { isVerified, verifiedBy: actor.email },
      },
    });

    this.logger.log(`[AUDIT] Salon "${salon.name}" (${id}) verification updated to ${isVerified} by Admin ${actor.email}`);

    return {
      success: true,
      salonId: id,
      isVerified: updated.isVerified,
      message: `Salon "${salon.name}" verification status updated to ${isVerified ? 'VERIFIED' : 'PENDING'}.`,
    };
  }

  async updateAdminSalonStatus(id: string, status: string, actor: AuthenticatedUser): Promise<any> {
    if (!['active', 'suspended', 'pending'].includes(status)) {
      throw new BadRequestException('Invalid status. Must be active, suspended, or pending.');
    }

    const salon = await this.prisma.salon.findUnique({ where: { id } });
    if (!salon) {
      throw new NotFoundException(`Salon with ID "${id}" not found`);
    }

    const updated = await this.prisma.salon.update({
      where: { id },
      data: { status },
    });

    if (this.localSalons.has(id)) {
      this.localSalons.get(id).status = status;
    }

    // Audit log
    await this.prisma.adminAuditLog.create({
      data: {
        id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        actorId: actor.id,
        actorEmail: actor.email,
        action: 'UPDATE_SALON_STATUS',
        targetType: 'SALON',
        targetId: id,
        targetName: salon.name,
        details: { status, updatedBy: actor.email },
      },
    });

    this.logger.log(`[AUDIT] Salon "${salon.name}" (${id}) status updated to ${status} by Admin ${actor.email}`);

    return {
      success: true,
      salonId: id,
      status: updated.status,
      message: `Salon "${salon.name}" status updated to ${status.toUpperCase()}.`,
    };
  }

  async deleteSalon(salonId: string, confirmSalonName: string, actor: AuthenticatedUser): Promise<any> {
    const salon = await this.prisma.salon.findUnique({
      where: { id: salonId },
      include: {
        services: true,
        staff: true,
        reviews: true,
        members: true,
      },
    });

    if (!salon) {
      throw new NotFoundException(`Salon with ID "${salonId}" not found`);
    }

    // Require explicit confirmation of exact salon name
    if (
      !confirmSalonName ||
      confirmSalonName.trim().toLowerCase() !== salon.name.trim().toLowerCase()
    ) {
      throw new BadRequestException(
        `Confirmation failed: Provided name "${confirmSalonName}" does not match salon name "${salon.name}". Deletion aborted.`,
      );
    }

    const deletedStats = {
      salonId,
      salonName: salon.name,
      locality: salon.locality,
      servicesCount: salon.services.length,
      staffCount: salon.staff.length,
      reviewsCount: salon.reviews.length,
      membersCount: salon.members.length,
      deletedAt: new Date().toISOString(),
      deletedBy: actor.email,
    };

    // Execute atomic deletion transaction
    return await this.prisma.runTransaction('salon.delete', async (tx) => {
      // 1. Delete the salon record (PostgreSQL and Prisma CASCADE deletes services, staff, reviews, members)
      await tx.salon.delete({
        where: { id: salonId },
      });

      // 2. Remove from in-memory fallback cache if present
      this.localSalons.delete(salonId);

      // 3. Record audit log
      await tx.adminAuditLog.create({
        data: {
          id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          actorId: actor.id,
          actorEmail: actor.email,
          action: 'DELETE_SALON',
          targetType: 'SALON',
          targetId: salonId,
          targetName: salon.name,
          details: deletedStats,
        },
      });

      this.logger.warn(
        `[SECURITY AUDIT] Salon "${salon.name}" (${salonId}) was permanently deleted by Admin ${actor.email}. (${deletedStats.servicesCount} services, ${deletedStats.staffCount} staff, ${deletedStats.membersCount} memberships removed)`,
      );

      return {
        success: true,
        message: `Salon "${salon.name}" and all associated operational records were permanently deleted.`,
        deletedSalonId: salonId,
        deletedSalonName: salon.name,
        details: deletedStats,
      };
    });
  }

  // ==========================================================================
  // Customer-submitted live location reports
  // ==========================================================================

  private readonly crowdReports = new Map<string, any[]>();

  /**
   * Calculates spherical distance in meters between two lat/lng coordinates (Haversine)
   */
  calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371000; // Radius of Earth in meters
    const dLat = ((lat2 - lat1) * Math.PI) / 180.0;
    const dLon = ((lon2 - lon1) * Math.PI) / 180.0;
    const a =
      Math.sin(dLat / 2.0) ** 2 +
      Math.cos((lat1 * Math.PI) / 180.0) *
        Math.cos((lat2 * Math.PI) / 180.0) *
        Math.sin(dLon / 2.0) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Customers can only contribute if their current GPS coordinates are within 3m of the salon.
   */
  async submitCrowdReport(salonId: string, dto: SubmitCrowdReportDto, actorId?: string) {
    // 1. Fetch salon coordinates
    const salon = await this.prisma.salon.findUnique({
      where: { id: salonId },
      select: {
        id: true,
        name: true,
        latitude: true,
        longitude: true,
        isOpen: true,
        queueStatus: true,
      },
    });

    const targetSalon = salon || this.localSalons.get(salonId);
    if (!targetSalon) {
      throw new NotFoundException(`Salon with ID ${salonId} not found`);
    }

    if (
      !Number.isFinite(dto.latitude) ||
      dto.latitude < -90 ||
      dto.latitude > 90 ||
      !Number.isFinite(dto.longitude) ||
      dto.longitude < -180 ||
      dto.longitude > 180
    ) {
      throw new BadRequestException('A valid device location is required to share a queue update.');
    }

    if (
      !Number.isFinite(targetSalon.latitude) ||
      targetSalon.latitude < -90 ||
      targetSalon.latitude > 90 ||
      !Number.isFinite(targetSalon.longitude) ||
      targetSalon.longitude < -180 ||
      targetSalon.longitude > 180
    ) {
      throw new BadRequestException('This salon does not have a valid location for queue updates.');
    }

    // Verify that the customer is near the selected salon.
    const distanceMeters = this.calculateDistanceMeters(
      dto.latitude,
      dto.longitude,
      targetSalon.latitude,
      targetSalon.longitude,
    );

    const MAX_ALLOWED_DISTANCE_METERS = 3;
    if (distanceMeters > MAX_ALLOWED_DISTANCE_METERS) {
      const formattedDistance =
        distanceMeters >= 1000
          ? `${(distanceMeters / 1000).toFixed(1)} km`
          : `${Math.round(distanceMeters)} meters`;
      throw new ForbiddenException(
        `Live status contribution is only allowed when you are physically at ${targetSalon.name}. You are currently ${formattedDistance} away (location limit is ${MAX_ALLOWED_DISTANCE_METERS}m).`,
      );
    }

    // 3. Create verified report record
    const now = new Date();
    const report = {
      id: `cr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      salonId,
      peopleCount: Math.max(0, Math.round(dto.peopleCount)),
      estimatedWaitMinutes: Math.max(0, Math.round(dto.estimatedWaitMinutes)),
      activeBarbers: dto.activeBarbers ? Math.max(1, Math.round(dto.activeBarbers)) : undefined,
      notes: dto.notes?.trim() || undefined,
      customerName: dto.customerName?.trim() || 'Verified Customer at Studio',
      distanceMeters,
      reportedAt: now.toISOString(),
      isFresh: true,
    };

    // 4. Cache in memory (keep last 10 reports, purge older than 24h)
    const existingReports = this.crowdReports.get(salonId) || [];
    const oneDayAgo = now.getTime() - 24 * 60 * 60 * 1000;
    const filtered = existingReports.filter(
      (r) => new Date(r.reportedAt).getTime() >= oneDayAgo,
    );
    this.crowdReports.set(salonId, [report, ...filtered].slice(0, 10));

    // 5. Audit log in queue_events
    await this.logQueueEvent(
      salonId,
      null,
      actorId || 'verified-customer',
      'customer',
      'queue.crowdsource.report',
      null,
      null,
      report,
    );

    // 6. Update salon's live queue if shop is currently open
    const isShopOpen = targetSalon.isOpen !== false && targetSalon.queueStatus !== 'closed';
    if (isShopOpen) {
      this.syncLocalQueueCache(salonId, report.peopleCount);
      await this.prisma.salon
        .update({
          where: { id: salonId },
          data: {
            currentQueue: report.peopleCount,
            lastQueueUpdate: now,
          },
        })
        .catch(() => {});
    }

    // 7. Realtime broadcast to all connected customers and partner
    this.queueGateway.broadcastToSalon(salonId, 'queue.crowd_report', {
      ...report,
      salonName: targetSalon.name,
    });

    this.logger.log(
      `[CrowdReport] Salon ${targetSalon.name} (${salonId}): verified customer at ${distanceMeters}m reported ${report.peopleCount} waiting, ~${report.estimatedWaitMinutes}m wait.`,
    );

    return {
      success: true,
      message: `Thank you for contributing! Live status verified at location (${distanceMeters}m away).`,
      report,
    };
  }

  /**
   * Get the latest verified crowd reports for a salon
   */
  async getLatestCrowdReport(salonId: string): Promise<{ report: any | null; history: any[] }> {
    const inMemory = this.crowdReports.get(salonId) || [];
    const fortyFiveMinutesAgo = Date.now() - 45 * 60 * 1000;
    const recentInMemory = inMemory.filter(
      (r) => new Date(r.reportedAt).getTime() >= fortyFiveMinutesAgo,
    );

    if (recentInMemory.length > 0) {
      return {
        report: recentInMemory[0],
        history: recentInMemory.slice(0, 5),
      };
    }

    // Fallback to database queue_events
    try {
      const dbEvents = await this.prisma.queueEvent.findMany({
        where: {
          salonId,
          eventType: 'queue.crowdsource.report',
          createdAt: { gte: new Date(fortyFiveMinutesAgo) },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      });

      if (dbEvents.length > 0) {
        const reports = dbEvents.map((e) => {
          const details = (e.details as any) || {};
          return {
            id: details.id || e.id,
            salonId: e.salonId,
            peopleCount: details.peopleCount ?? 0,
            estimatedWaitMinutes: details.estimatedWaitMinutes ?? 0,
            activeBarbers: details.activeBarbers,
            notes: details.notes,
            customerName: details.customerName || 'Verified Customer',
            distanceMeters: details.distanceMeters ?? 0,
            reportedAt: e.createdAt.toISOString(),
            isFresh: true,
          };
        });

        this.crowdReports.set(salonId, reports);
        return {
          report: reports[0],
          history: reports,
        };
      }
    } catch {}

    return { report: null, history: [] };
  }
}
