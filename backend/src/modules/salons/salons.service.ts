import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterSalonDto } from './dto/register-salon.dto';
import { UpdateSalonDto } from './dto/update-salon.dto';
import { UpdateQueueDto } from './dto/update-queue.dto';
import { PublicSalonResponseDto, PublicReviewDto } from './dto/public-salon-response.dto';
import { CreateReviewDto } from './dto/create-review.dto';
import { AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';

@Injectable()
export class SalonsService {
  private readonly logger = new Logger(SalonsService.name);

  // In-memory backing store for local testing / offline development
  private localSalons: Map<string, any> = new Map();

  constructor(private readonly prisma: PrismaService) {}

  async registerSalon(dto: RegisterSalonDto, resolvedOwnerId?: string): Promise<any> {
    const ownerId = resolvedOwnerId || dto.ownerId || `owner-${Date.now()}`;
    const searchEmail = dto.email?.toLowerCase().trim();

    // 1. Enforce 1 Gmail ID = 1 Salon policy (Idempotent: update existing if already registered)
    try {
      let existingSalon: any = null;
      if (searchEmail || resolvedOwnerId) {
        existingSalon = await this.prisma.salon.findFirst({
          where: {
            OR: [
              ...(searchEmail ? [{ email: searchEmail }] : []),
              ...(resolvedOwnerId ? [{ ownerId: resolvedOwnerId }] : []),
            ],
          },
        });
      }

      if (existingSalon) {
        this.logger.log(`Found existing salon ${existingSalon.id} for ${searchEmail || resolvedOwnerId}. Updating salon.`);
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
      this.logger.warn(`Database insert skipped or failed (${(err as Error).message}). Storing in local state.`);
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
           ORDER BY created_at DESC LIMIT 10;`,
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
    const estimatedWaitMinutes = currentQueue > 0 ? Math.ceil((currentQueue * avgTime) / barbers) : 0;

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
      coverImage: salonData.coverImage || salonData.cover_image || '',
      posterImage: salonData.posterImage || salonData.poster_image || salonData.coverImage || salonData.cover_image || '',
      loopVideoUrl: salonData.loopVideoUrl || salonData.loop_video_url || '',
      images: Array.isArray(salonData.images) && salonData.images.length > 0
        ? salonData.images
        : (salonData.coverImage || salonData.cover_image ? [salonData.coverImage || salonData.cover_image] : []),
      locationImages: Array.isArray(salonData.locationImages) ? salonData.locationImages : (Array.isArray(salonData.location_images) ? salonData.location_images : []),
      workImages: Array.isArray(salonData.workImages) ? salonData.workImages : (Array.isArray(salonData.work_images) ? salonData.work_images : []),
      mediaGallery: salonData.mediaGallery || salonData.media_gallery || [],
      openingHoursFormatted: salonData.openingHoursFormatted || salonData.opening_hours_formatted || '09:00 AM – 09:30 PM (All Days)',
      openingHours: {
        open: salonData.openingHoursOpen || salonData.opening_hours_open || '09:00 AM',
        close: salonData.openingHoursClose || salonData.opening_hours_close || '09:30 PM',
        formatted: salonData.openingHoursFormatted || salonData.opening_hours_formatted || '09:00 AM – 09:30 PM (All Days)',
      },
      currentQueue: Number(currentQueue),
      estimatedWaitMinutes,
      activeBarbers: barbers,
      avgServiceTimeMinutes: avgTime,
      rating: Number(salonData.rating || 5.0),
      reviewCount: Number(salonData.reviewCount || salonData.review_count || 0),
      startingPrice: Number(salonData.startingPrice || salonData.starting_price || 150.0),
      isOpen: Boolean(salonData.isOpen !== undefined ? salonData.isOpen : salonData.is_open),
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

  async updateSalon(id: string, dto: UpdateSalonDto, requesterOwnerId?: string): Promise<any> {
    const salon = this.localSalons.get(id);

    if (dto.latitude !== undefined && (dto.latitude < -90 || dto.latitude > 90)) {
      throw new BadRequestException('Latitude must be between -90 and 90');
    }
    if (dto.longitude !== undefined && (dto.longitude < -180 || dto.longitude > 180)) {
      throw new BadRequestException('Longitude must be between -180 and 180');
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
      if (dto.isOpen !== undefined) {
        await this.prisma.$executeRawUnsafe(`UPDATE salons SET is_open = $1 WHERE id = $2;`, dto.isOpen, id);
      }
      if (dto.coverImage !== undefined) {
        await this.prisma.$executeRawUnsafe(`UPDATE salons SET cover_image = $1 WHERE id = $2;`, dto.coverImage || null, id);
      }
      if (dto.posterImage !== undefined) {
        await this.prisma.$executeRawUnsafe(`UPDATE salons SET poster_image = $1 WHERE id = $2;`, dto.posterImage || null, id);
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
    } catch {
      // Handled via local update
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

    return {
      success: true,
      message: 'Salon updated successfully',
      salonId: id,
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
      if (dto.delta && dto.delta > 0) {
        for (let i = 0; i < dto.delta; i++) {
          const entryId = `q-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`;
          await this.prisma.$executeRawUnsafe(
            `INSERT INTO salon_queue_entries (id, salon_id, position, customer_name, status, joined_at)
             VALUES ($1, $2, (SELECT COALESCE(MAX(position), 0) + 1 FROM salon_queue_entries WHERE salon_id = $2 AND status = 'waiting'), $3, 'waiting', NOW());`,
            entryId,
            id,
            `Walk-in #${currentQueue + i + 1}`,
          );
        }
      } else if (dto.delta && dto.delta < 0) {
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

  /**
   * Get all currently waiting customers in queue for a salon
   */
  async getQueueEntries(salonId: string) {
    try {
      const rows: any[] = await this.prisma.$queryRawUnsafe(
        `SELECT id, position, customer_name AS "customerName", phone, service_name AS "serviceName",
                status, joined_at AS "joinedAt", served_at AS "servedAt", device_id AS "deviceId", user_id AS "userId"
         FROM salon_queue_entries
         WHERE salon_id = $1 AND status IN ('waiting', 'in_service')
         ORDER BY CASE WHEN status = 'in_service' THEN 0 ELSE 1 END, position ASC, joined_at ASC;`,
        salonId,
      );
      let waitIndex = 0;
      return rows.map((r) => {
        if (r.status === 'in_service') {
          return {
            ...r,
            ticketNumber: `#01`,
            position: 1,
          };
        }
        waitIndex += 1;
        return {
          ...r,
          ticketNumber: `#0${waitIndex}`.slice(-3),
          position: waitIndex,
        };
      });
    } catch (err) {
      this.logger.warn(`Failed to fetch queue entries for salon ${salonId}: ${err}`);
      return [];
    }
  }

  /**
   * Add a customer to queue with their name, phone, and ticket ID
   */
  async addQueueEntry(salonId: string, dto: any) {
    const entryId = `q-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const cleanName = (dto.customerName || '').trim() || 'Walk-in Customer';
    const cleanPhone = (dto.phone || '').trim() || null;
    const cleanService = (dto.serviceName || '').trim() || 'Haircut & Styling';

    try {
      const maxRow: any[] = await this.prisma.$queryRawUnsafe(
        `SELECT COALESCE(MAX(position), 0) AS max_pos FROM salon_queue_entries WHERE salon_id = $1 AND status = 'waiting';`,
        salonId,
      );
      const nextPos = Number(maxRow[0]?.max_pos || 0) + 1;

      await this.prisma.$executeRawUnsafe(
        `INSERT INTO salon_queue_entries (id, salon_id, position, customer_name, phone, service_name, status, joined_at, device_id, user_id)
         VALUES ($1, $2, $3, $4, $5, $6, 'waiting', NOW(), $7, $8);`,
        entryId,
        salonId,
        nextPos,
        cleanName,
        cleanPhone,
        cleanService,
        dto.deviceId || null,
        dto.userId || null,
      );

      const countRow: any[] = await this.prisma.$queryRawUnsafe(
        `SELECT COUNT(*) AS total FROM salon_queue_entries WHERE salon_id = $1 AND status = 'waiting';`,
        salonId,
      );
      const newQueueCount = Number(countRow[0]?.total || 1);

      await this.prisma.$executeRawUnsafe(
        `UPDATE salons SET current_queue = $1, last_queue_update = NOW() WHERE id = $2;`,
        newQueueCount,
        salonId,
      );

      const local = this.localSalons.get(salonId);
      if (local) {
        local.currentQueue = newQueueCount;
        local.lastQueueUpdate = new Date().toISOString();
      }

      return {
        success: true,
        entry: {
          id: entryId,
          position: nextPos,
          ticketNumber: `#0${nextPos}`.slice(-3),
          customerName: cleanName,
          phone: cleanPhone,
          serviceName: cleanService,
          status: 'waiting',
          joinedAt: new Date().toISOString(),
        },
        currentQueue: newQueueCount,
      };
    } catch (err) {
      this.logger.error(`Error adding queue entry: ${err}`);
      throw new BadRequestException(`Failed to add customer to queue: ${err}`);
    }
  }

  /**
   * Update queue entry status (e.g. in_service / completed / cancelled)
   */
  async updateQueueEntryStatus(salonId: string, entryId: string, status: string = 'completed') {
    try {
      await this.prisma.$executeRawUnsafe(
        `UPDATE salon_queue_entries SET status = $1, served_at = NOW() WHERE id = $2 AND salon_id = $3;`,
        status,
        entryId,
        salonId,
      );

      const countRow: any[] = await this.prisma.$queryRawUnsafe(
        `SELECT COUNT(*) AS total FROM salon_queue_entries WHERE salon_id = $1 AND status = 'waiting';`,
        salonId,
      );
      const newQueueCount = Number(countRow[0]?.total || 0);

      if (status === 'completed') {
        await this.prisma.$executeRawUnsafe(
          `UPDATE salons SET current_queue = $1, today_customers_served = today_customers_served + 1, last_queue_update = NOW() WHERE id = $2;`,
          newQueueCount,
          salonId,
        );
      } else {
        await this.prisma.$executeRawUnsafe(
          `UPDATE salons SET current_queue = $1, last_queue_update = NOW() WHERE id = $2;`,
          newQueueCount,
          salonId,
        );
      }

      const local = this.localSalons.get(salonId);
      if (local) {
        local.currentQueue = newQueueCount;
        local.lastQueueUpdate = new Date().toISOString();
      }

      return { success: true, currentQueue: newQueueCount, entryId, status };
    } catch (err) {
      throw new BadRequestException(`Failed to update queue entry: ${err}`);
    }
  }

  /**
   * Clear all waiting queue entries for a salon
   */
  async clearQueueEntries(salonId: string) {
    try {
      await this.prisma.$executeRawUnsafe(
        `UPDATE salon_queue_entries SET status = 'completed', served_at = NOW() WHERE salon_id = $1 AND status = 'waiting';`,
        salonId,
      );
      await this.prisma.$executeRawUnsafe(
        `UPDATE salons SET current_queue = 0, last_queue_update = NOW() WHERE id = $1;`,
        salonId,
      );
      const local = this.localSalons.get(salonId);
      if (local) {
        local.currentQueue = 0;
        local.lastQueueUpdate = new Date().toISOString();
      }
      return { success: true, currentQueue: 0 };
    } catch (err) {
      throw new BadRequestException(`Failed to clear queue: ${err}`);
    }
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
    return await this.prisma.$transaction(async (tx) => {
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

}
