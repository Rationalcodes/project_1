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
import { PublicSalonResponseDto } from './dto/public-salon-response.dto';

@Injectable()
export class SalonsService {
  private readonly logger = new Logger(SalonsService.name);

  // In-memory backing store for local testing / offline development
  private localSalons: Map<string, any> = new Map();

  constructor(private readonly prisma: PrismaService) {
    this.seedInitialSalons();
  }

  private seedInitialSalons() {
    const initial = [
      {
        id: 'salon-1',
        name: 'The Gentleman Studio',
        tagline: 'Precision cuts, beard sculpting & timeless grooming',
        ownerName: 'Vikram Malhotra',
        ownerId: 'owner-1',
        phone: '+91 98450 12890',
        email: 'vikram@gentlemanstudio.in',
        address: '42, 80 Feet Road, 4th Block, Koramangala',
        locality: 'Koramangala',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560034',
        latitude: 12.9344,
        longitude: 77.6258,
        coverImage: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=1200&q=80',
        openingHoursFormatted: '09:00 AM – 09:30 PM (All Days)',
        currentQueue: 3,
        avgServiceTimeMinutes: 20,
        activeBarbers: 3,
        startingPrice: 150.0,
        isOpen: true,
        isVerified: true,
        status: 'active',
        rating: 4.8,
        reviewCount: 342,
        lastQueueUpdate: new Date().toISOString(),
        todayCustomersServed: 24,
        todayRevenue: 3600.0,
        monthlyRevenue: 85000.0,
        services: [
          { id: 'svc-1', name: 'Signature Fade', category: 'Hair', price: 180, durationMinutes: 25, isAvailable: true },
          { id: 'svc-2', name: 'Beard Trim & Sculpt', category: 'Beard', price: 120, durationMinutes: 15, isAvailable: true },
        ],
        reviews: [
          {
            id: 'rev-1',
            customerName: 'Karthik R.',
            rating: 5,
            comment: 'Zero wait time, walked straight in! Master fade cut.',
            verifiedVisit: true,
            createdAt: new Date().toISOString(),
          },
        ],
      },
      {
        id: 'salon-2',
        name: 'Urban Blade Barbershop',
        tagline: 'Modern street fades, textured crops & urban styling',
        ownerName: 'David Lee',
        ownerId: 'owner-2',
        phone: '+91 97312 88410',
        email: 'david@urbanblade.in',
        address: '15, 12th Main Road, Indiranagar',
        locality: 'Indiranagar',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560038',
        latitude: 12.9719,
        longitude: 77.6412,
        coverImage: 'https://images.unsplash.com/photo-1512690459411-b9245aed614b?auto=format&fit=crop&w=1200&q=80',
        openingHoursFormatted: '09:00 AM – 09:00 PM (All Days)',
        currentQueue: 1,
        avgServiceTimeMinutes: 20,
        activeBarbers: 4,
        startingPrice: 180.0,
        isOpen: true,
        isVerified: true,
        status: 'active',
        rating: 4.9,
        reviewCount: 488,
        lastQueueUpdate: new Date().toISOString(),
        todayCustomersServed: 31,
        todayRevenue: 5580.0,
        monthlyRevenue: 112000.0,
        services: [
          { id: 'svc-3', name: 'Textured Crop Fade', category: 'Hair', price: 200, durationMinutes: 30, isAvailable: true },
        ],
        reviews: [],
      },
    ];

    for (const s of initial) {
      this.localSalons.set(s.id, s);
    }
  }

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
          `INSERT INTO salon_members (id, salon_id, user_id, role, status, created_at, updated_at)
           VALUES ($1, $2, $3, 'PARTNER_OWNER', 'ACTIVE', NOW(), NOW())
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
}
