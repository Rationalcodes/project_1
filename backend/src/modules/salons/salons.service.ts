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
    const salonId = `salon-${Date.now()}`;
    const ownerId = resolvedOwnerId || dto.ownerId || `owner-${Date.now()}`;

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
      email: dto.email || null,
      address: dto.address,
      locality: dto.locality,
      city: dto.city,
      state: dto.state || 'Karnataka',
      pincode: dto.pincode,
      latitude: dto.latitude,
      longitude: dto.longitude,
      coverImage: dto.coverImage || 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=1200&q=80',
      openingHoursFormatted,
      currentQueue: 0,
      avgServiceTimeMinutes: dto.avgServiceTimeMinutes || 20,
      activeBarbers: dto.activeBarbers || 2,
      startingPrice,
      isOpen: true,
      isVerified: false,
      status: 'active', // 'active' for immediate test availability, or 'pending'
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

  async getPublicSalonById(id: string): Promise<PublicSalonResponseDto> {
    let salonData: any = null;

    try {
      const rows: any[] = await this.prisma.$queryRawUnsafe(
        `SELECT id, name, tagline, address, locality, city, state, pincode,
                latitude, longitude, cover_image, opening_hours_formatted,
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
      tagline: salonData.tagline,
      address: salonData.address,
      locality: salonData.locality,
      city: salonData.city,
      state: salonData.state,
      pincode: salonData.pincode,
      latitude: Number(salonData.latitude),
      longitude: Number(salonData.longitude),
      coverImage: salonData.coverImage || salonData.cover_image,
      openingHoursFormatted: salonData.openingHoursFormatted || salonData.opening_hours_formatted || '09:00 AM – 09:30 PM',
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
      // Debounce duplicate reviews submitted within 15 seconds (e.g. double-tapping on mobile)
      const recentDuplicate = await this.prisma.salonReview.findFirst({
        where: {
          salonId,
          customerName: reviewRecord.customerName,
          comment: reviewRecord.comment,
          createdAt: {
            gte: new Date(Date.now() - 15000),
          },
        },
      });

      if (recentDuplicate) {
        this.logger.warn(`Debounced duplicate review submission for salon ${salonId}`);
        return {
          id: recentDuplicate.id,
          customerName: recentDuplicate.customerName,
          customerAvatar: recentDuplicate.customerAvatar || reviewRecord.customerAvatar,
          rating: recentDuplicate.rating,
          comment: recentDuplicate.comment,
          verifiedVisit: recentDuplicate.verifiedVisit,
          createdAt: recentDuplicate.createdAt.toISOString(),
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

    // Verify ownership
    if (salon && salon.ownerId && requesterOwnerId && salon.ownerId !== requesterOwnerId) {
      throw new ForbiddenException('Security violation: You do not own this salon');
    }

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
    }

    return {
      success: true,
      message: 'Salon updated successfully',
      salonId: id,
    };
  }

  async updateQueue(id: string, dto: UpdateQueueDto, requesterOwnerId?: string): Promise<any> {
    const salon = this.localSalons.get(id);

    if (salon && salon.ownerId && requesterOwnerId && salon.ownerId !== requesterOwnerId) {
      throw new ForbiddenException('Security violation: You do not own this salon');
    }

    let newQueue = 0;
    const current = salon ? salon.currentQueue : 0;

    if (dto.manualValue !== undefined) {
      newQueue = Math.max(0, dto.manualValue);
    } else if (dto.delta !== undefined) {
      newQueue = Math.max(0, current + dto.delta);
    }

    const now = new Date().toISOString();

    // Database update
    try {
      await this.prisma.$executeRawUnsafe(
        `UPDATE salons 
         SET current_queue = $1, last_queue_update = NOW()
         WHERE id = $2;`,
        newQueue,
        id,
      );
    } catch {
      // Local state fallback
    }

    if (salon) {
      salon.currentQueue = newQueue;
      salon.lastQueueUpdate = now;
      if (dto.delta && dto.delta < 0) {
        salon.todayCustomersServed += Math.abs(dto.delta);
      }
    }

    return {
      success: true,
      salonId: id,
      currentQueue: newQueue,
      lastQueueUpdate: now,
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
