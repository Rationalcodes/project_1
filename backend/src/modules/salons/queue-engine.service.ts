import { Injectable, Logger, OnModuleDestroy, OnModuleInit, Optional } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { QueueGateway } from './queue.gateway';

/**
 * Computes start of today in India Standard Time (UTC+05:30)
 */
export function getStartOfTodayIST(): Date {
  const now = new Date();
  const istOffsetMs = 5.5 * 60 * 60 * 1000;
  const istDate = new Date(now.getTime() + istOffsetMs);
  const year = istDate.getUTCFullYear();
  const month = istDate.getUTCMonth();
  const date = istDate.getUTCDate();
  return new Date(Date.UTC(year, month, date) - istOffsetMs);
}

/**
 * Computes start of the current week (Monday 00:00:00 IST) in India Standard Time (UTC+05:30).
 * Resets token numbering every week on Monday, running Monday through Sunday.
 */
export function getStartOfWeekMondayIST(referenceDate: Date = new Date()): Date {
  const istOffsetMs = 5.5 * 60 * 60 * 1000;
  const istDate = new Date(referenceDate.getTime() + istOffsetMs);
  const day = istDate.getUTCDay(); // 0 is Sunday, 1 is Monday, ..., 6 is Saturday
  const daysSinceMonday = (day + 6) % 7;
  const mondayDate = istDate.getUTCDate() - daysSinceMonday;
  const year = istDate.getUTCFullYear();
  const month = istDate.getUTCMonth();
  return new Date(Date.UTC(year, month, mondayDate) - istOffsetMs);
}

/**
 * Parses time string (e.g. "09:30 PM", "21:30") to minutes from midnight (0..1439)
 */
export function parseTimeToMinutes(timeStr?: string | null): number {
  if (!timeStr) return 21 * 60 + 30; // Default 09:30 PM = 1290m
  const trimmed = timeStr.trim();
  const match12 = trimmed.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (match12) {
    let hours = parseInt(match12[1], 10);
    const minutes = parseInt(match12[2], 10);
    const meridiem = (match12[3] || '').toUpperCase();
    if (meridiem === 'PM' && hours < 12) hours += 12;
    if (meridiem === 'AM' && hours === 12) hours = 0;
    return hours * 60 + minutes;
  }
  const match24 = trimmed.match(/^(\d{1,2}):(\d{2})$/);
  if (match24) {
    return parseInt(match24[1], 10) * 60 + parseInt(match24[2], 10);
  }
  return 21 * 60 + 30;
}

/**
 * Determines whether current IST time is outside salon's daily operating hours
 */
export function isSalonPastClosingTime(closingHoursStr?: string | null, openHoursStr?: string | null): boolean {
  const now = new Date();
  const istOffsetMs = 5.5 * 60 * 60 * 1000;
  const istDate = new Date(now.getTime() + istOffsetMs);
  const currentMinutesInDay = istDate.getUTCHours() * 60 + istDate.getUTCMinutes();

  const closeMinutes = parseTimeToMinutes(closingHoursStr || '09:30 PM');
  const openMinutes = parseTimeToMinutes(openHoursStr || '09:00 AM');

  if (closeMinutes > openMinutes) {
    // Standard daytime: e.g. 09:00 AM to 09:30 PM
    return currentMinutesInDay >= closeMinutes || currentMinutesInDay < openMinutes;
  } else {
    // Overnight: e.g. 06:00 PM to 02:00 AM
    return currentMinutesInDay >= closeMinutes && currentMinutesInDay < openMinutes;
  }
}

export interface CalculatedQueueItem {
  id: string;
  salonId: string;
  position: number;
  ticketNumber: string;
  customerName: string;
  phone?: string | null;
  serviceName: string;
  serviceId?: string | null;
  serviceDuration: number;
  partySize?: number;
  servicePrice: number;
  assignedStaffId?: string | null;
  assignedStaffName?: string | null;
  status: string;
  joinedAt: string;
  calledAt?: string | null;
  startedAt?: string | null;
  servedAt?: string | null;
  cancelledAt?: string | null;
  estimatedWaitMinutes: number;
  estimatedStartTime?: string | null;
  estimatedCompletionTime?: string | null;
  extendedMinutes: number;
  elapsedServiceMinutes?: number;
  remainingServiceMinutes?: number;
  isOverdue?: boolean;
}

export interface SalonQueueOverview {
  salonId: string;
  queueStatus: 'open' | 'paused' | 'closed';
  totalWaiting: number;
  inServiceCount: number;
  completedCount: number;
  skippedCount: number;
  cancelledCount: number;
  averageWaitMinutes: number;
  estimatedTotalQueueDurationMinutes: number;
  availableStaffCount: number;
  totalStaffCount: number;
  lastQueueUpdate: string;
}

export interface RecalculationResult {
  overview: SalonQueueOverview;
  activeEntries: CalculatedQueueItem[];
  staffStates: Array<{
    id: string;
    name: string;
    role: string;
    availability: string;
    currentCustomerName?: string | null;
    currentQueueEntryId?: string | null;
    elapsedMinutes?: number;
    remainingMinutes?: number;
  }>;
}

@Injectable()
export class QueueEngineService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(QueueEngineService.name);
  private readonly recalculationCacheMs = 2000;
  private readonly recalculationCache = new Map<string, { result: RecalculationResult; expiresAt: number }>();
  private readonly recalculations = new Map<string, {
    promise: Promise<RecalculationResult>;
    rerunRequested: boolean;
    persistRequested: boolean;
  }>();
  private sweepTimer?: NodeJS.Timeout;
  private isSweepInFlight = false;

  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly queueGateway?: QueueGateway,
  ) {}

  async onModuleInit() {
    this.logger.log('QueueEngineService initialized. Starting initial closing/daily queue reset sweep...');
    // Initial run asynchronously
    this.sweepAllSalonsClosingAndDailyReset().catch((err) => {
      this.logger.error(`Error in initial queue closing sweep: ${err.message}`, err.stack);
    });

    // Schedule regular sweeps every 3 minutes
    this.sweepTimer = setInterval(() => {
      this.sweepAllSalonsClosingAndDailyReset().catch((err) => {
        this.logger.error(`Error in periodic queue closing sweep: ${err.message}`, err.stack);
      });
    }, 3 * 60 * 1000);
  }

  onModuleDestroy() {
    if (this.sweepTimer) clearInterval(this.sweepTimer);
  }

  /**
   * Resets active queue entries when a salon closes or at start of a new business day.
   * Preserves all completed service sessions, completed queue entries, and revenue history.
   */
  async performSalonClosingQueueReset(salonId: string, reason = 'Shop closed for the day'): Promise<number> {
    const now = new Date();
    let cancelledCount = 0;

    await this.prisma.runTransaction('queue.closing_reset', async (tx) => {
      const cancelledEntries = await tx.salonQueueEntry.updateMany({
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
      cancelledCount = cancelledEntries.count;

      // Free all staff back to AVAILABLE
      await tx.salonStaff.updateMany({
        where: { salonId },
        data: {
          availability: 'AVAILABLE',
          currentQueueEntryId: null,
          breakStartedAt: null,
        },
      });

      // Reset salon current queue counter
      await tx.salon.update({
        where: { id: salonId },
        data: {
          currentQueue: 0,
          lastQueueUpdate: now,
        },
      });
    });

    if (cancelledCount > 0) {
      this.logger.log(`[performSalonClosingQueueReset] Salon ${salonId}: reset ${cancelledCount} active entries. Reason: ${reason}`);
      if (this.queueGateway) {
        this.queueGateway.broadcastToSalon(salonId, 'queue.cleared', {
          salonId,
          clearedAt: now.toISOString(),
          reason,
        });
      }
    }

    return cancelledCount;
  }

  /**
   * Sweeps all salons to check if they are closed (manually or past closing time) or have stale tickets from previous days.
   * Guarded by in-flight execution mutex to prevent overlapping background runs (Phase 5 Scalability).
   */
  async sweepAllSalonsClosingAndDailyReset(): Promise<void> {
    if (this.isSweepInFlight) {
      this.logger.warn('[sweepAllSalonsClosingAndDailyReset] Prior sweep still in flight; skipping overlapping execution.');
      return;
    }
    this.isSweepInFlight = true;

    try {
      const startOfToday = getStartOfTodayIST();

      // 1. Single batch cleanup for ALL yesterday's stale tickets across the platform (Phase 2 Optimization)
      const staleBatch = await this.prisma.salonQueueEntry.updateMany({
        where: {
          status: { in: ['waiting', 'called', 'in_service', 'skipped'] },
          joinedAt: { lt: startOfToday },
        },
        data: {
          status: 'cancelled',
          cancelledAt: new Date(),
          cancellationReason: 'Daily reset: Ticket expired at end of business day',
        },
      });

      if (staleBatch.count > 0) {
        this.logger.log(`[sweepAllSalonsClosingAndDailyReset] Cleaned up ${staleBatch.count} stale tickets from previous business days.`);
      }

      // 2. Query salons and check closing hours
      const salons = await this.prisma.salon.findMany({
        select: {
          id: true,
          name: true,
          isOpen: true,
          queueStatus: true,
          openingHoursClose: true,
          openingHoursOpen: true,
        },
      });

      // Filter in memory: only closed salons require closing reset verification
      const closedSalons = salons.filter((s) => {
        const isManuallyClosed = s.isOpen === false || s.queueStatus === 'closed';
        const isPastClosingHours = isSalonPastClosingTime(s.openingHoursClose, s.openingHoursOpen);
        return isManuallyClosed || isPastClosingHours;
      });

      for (const salon of closedSalons) {
        const isManuallyClosed = salon.isOpen === false || salon.queueStatus === 'closed';
        const activeCount = await this.prisma.salonQueueEntry.count({
          where: {
            salonId: salon.id,
            status: { in: ['waiting', 'called', 'in_service', 'skipped'] },
          },
        });
        if (activeCount > 0) {
          await this.performSalonClosingQueueReset(
            salon.id,
            isManuallyClosed ? 'Shop closed by salon partner' : `Daily reset: Operating hours ended (${salon.openingHoursClose || '09:30 PM'})`,
          );
        }
      }
    } catch (err) {
      this.logger.error(`Error in sweepAllSalonsClosingAndDailyReset: ${(err as Error).message}`);
    } finally {
      this.isSweepInFlight = false;
    }
  }

  /**
   * Recalculate intelligent ETAs and staff assignments for all active customers in a salon.
   * Coalesces concurrent reads and persists derived fields only after queue mutations.
   */
  async recalculateSalonQueue(
    salonId: string,
    options: { force?: boolean; persist?: boolean } = {},
  ): Promise<RecalculationResult> {
    const force = options.force === true;
    const persist = options.persist === true;
    const cached = this.recalculationCache.get(salonId);
    if (!force && cached && cached.expiresAt > Date.now()) {
      return cached.result;
    }

    const activeRecalculation = this.recalculations.get(salonId);
    if (activeRecalculation) {
      if (force) {
        activeRecalculation.rerunRequested = true;
        activeRecalculation.persistRequested ||= persist;
      }
      return activeRecalculation.promise;
    }

    const recalculation = {
      promise: Promise.resolve(null as unknown as RecalculationResult),
      rerunRequested: false,
      persistRequested: persist,
    };
    const startedAt = Date.now();
    let didPersist = false;
    recalculation.promise = (async () => {
      let result: RecalculationResult;
      do {
        recalculation.rerunRequested = false;
        const shouldPersist = recalculation.persistRequested;
        recalculation.persistRequested = false;
        didPersist ||= shouldPersist;
        result = await this.calculateSalonQueue(salonId, shouldPersist);
        this.recalculationCache.set(salonId, {
          result,
          expiresAt: Date.now() + this.recalculationCacheMs,
        });
      } while (recalculation.rerunRequested);
      this.logger.log(JSON.stringify({
        event: 'queue.recalculation.completed',
        salonId,
        durationMs: Date.now() - startedAt,
        entryCount: result.activeEntries.length,
        persisted: didPersist,
      }));
      return result;
    })().catch((error: unknown) => {
      this.logger.error(JSON.stringify({
        event: 'queue.recalculation.failed',
        salonId,
        durationMs: Date.now() - startedAt,
        errorType: error instanceof Error ? error.name : 'UnknownError',
      }));
      throw error;
    }).finally(() => {
      this.recalculations.delete(salonId);
    });
    this.recalculations.set(salonId, recalculation);
    return recalculation.promise;
  }

  private async calculateSalonQueue(salonId: string, persist: boolean): Promise<RecalculationResult> {
    const now = new Date();
    const nowMs = now.getTime();
    const startOfToday = getStartOfTodayIST();

    // 1. Fetch Salon metadata
    const salon = await this.prisma.salon.findUnique({
      where: { id: salonId },
      select: {
        id: true,
        name: true,
        activeBarbers: true,
        avgServiceTimeMinutes: true,
        queueStatus: true,
        isOpen: true,
        openingHoursOpen: true,
        openingHoursClose: true,
      },
    });

    const isPastClosing = isSalonPastClosingTime(salon?.openingHoursClose, salon?.openingHoursOpen);
    const isClosed = salon?.isOpen === false || salon?.queueStatus === 'closed' || isPastClosing;

    const activeBarbersCount = Math.max(1, salon?.activeBarbers || 2);
    const queueStatus: 'open' | 'paused' | 'closed' = isClosed
      ? 'closed'
      : salon?.queueStatus === 'paused'
        ? 'paused'
        : 'open';

    const [staffRecords, rows, dailyMetrics] = await Promise.all([
      this.prisma.salonStaff.findMany({
        where: { salonId, status: 'active' },
        orderBy: { createdAt: 'asc' },
      }),
      isClosed
        ? Promise.resolve([])
        : this.prisma.salonQueueEntry.findMany({
            where: {
              salonId,
              status: { in: ['waiting', 'called', 'in_service', 'skipped'] },
              joinedAt: { gte: startOfToday },
            },
            orderBy: { joinedAt: 'asc' },
            include: { assignedStaff: { select: { id: true, name: true } } },
          }),
      this.prisma.$queryRaw<Array<{
        completed_count: number;
        cancelled_count: number;
        today_revenue: string | number;
      }>>`
        SELECT
          (SELECT COUNT(*)::int
           FROM public.salon_queue_entries
           WHERE salon_id = ${salonId} AND status = 'completed' AND served_at >= ${startOfToday}) AS completed_count,
          (SELECT COUNT(*)::int
           FROM public.salon_queue_entries
           WHERE salon_id = ${salonId} AND status = 'cancelled' AND cancelled_at >= ${startOfToday}) AS cancelled_count,
          COALESCE(
            (SELECT SUM(price)
             FROM public.service_sessions
             WHERE salon_id = ${salonId} AND completed_at >= ${startOfToday}),
            0
          )::numeric AS today_revenue
      `,
    ]);

    let staffList = staffRecords;

    // Avoid redundant SQL count if active staff already loaded (Phase 2 Optimization)
    const existingStaffCount = staffList.length > 0
      ? staffList.length
      : await this.prisma.salonStaff.count({ where: { salonId } });

    // Only create initial default staff slots if salon is newly registered and has never had any staff configured
    if (staffList.length === 0 && existingStaffCount === 0) {
      const defaultSlots = Array.from({ length: activeBarbersCount }).map((_, i) => ({
        id: `staff-${salonId}-slot-${i + 1}`,
        salonId,
        name: `Stylist #${i + 1}`,
        role: 'Stylist',
        experience: 'Professional',
        specialties: ['Haircut', 'Beard Trim'],
        photo: null,
        status: 'active',
        availability: 'AVAILABLE',
        currentQueueEntryId: null,
        breakStartedAt: null,
        workingHoursStart: '09:00 AM',
        workingHoursEnd: '09:00 PM',
        assignedServices: ['Haircut', 'Beard Trim'],
        rating: 5.0 as any,
        createdAt: now,
      }));

      await this.prisma.salonStaff.createMany({
        data: defaultSlots,
        skipDuplicates: true,
      });

      staffList = await this.prisma.salonStaff.findMany({
        where: { salonId, status: 'active' },
        orderBy: { createdAt: 'asc' },
      });

      if (staffList.length === 0) {
        staffList = Array.from({ length: activeBarbersCount }).map((_, i) => ({
          id: `staff-${salonId}-slot-${i + 1}`,
          salonId,
          name: `Stylist #${i + 1}`,
          role: 'Stylist',
          experience: 'Professional',
          specialties: ['Haircut', 'Beard Trim'],
          photo: null,
          status: 'active',
          availability: 'AVAILABLE',
          currentQueueEntryId: null,
          breakStartedAt: null,
          workingHoursStart: '09:00 AM',
          workingHoursEnd: '09:00 PM',
          assignedServices: [],
          rating: 5.0 as any,
          createdAt: now,
        }));
      }
    }

    const metrics = dailyMetrics[0];
    const completedCount = Number(metrics?.completed_count || 0);
    const cancelledCount = Number(metrics?.cancelled_count || 0);
    const todayRevenue = Number(metrics?.today_revenue || 0);

    // 4. Map in_service entries and assign to staff
    const inServiceEntries = rows.filter((r) => r.status === 'in_service');
    const waitingEntries = rows.filter((r) => r.status === 'waiting' || r.status === 'called');
    const skippedEntries = rows.filter((r) => r.status === 'skipped');

    // Build timeline for staff availability
    // timeline[staffId] = Date timestamp when staff will become available for next customer
    const staffTimelines: Record<string, number> = {};
    const staffBusyMap: Record<string, any> = {};

    for (const staff of staffList) {
      if (staff.availability === 'OFFLINE') {
        // Offline staff are excluded from receiving new customers
        staffTimelines[staff.id] = Number.MAX_SAFE_INTEGER;
      } else if (staff.availability === 'ON_BREAK') {
        // Break duration estimate (default 20 mins from break start)
        const breakStart = staff.breakStartedAt ? staff.breakStartedAt.getTime() : nowMs;
        staffTimelines[staff.id] = Math.max(nowMs, breakStart + 20 * 60 * 1000);
      } else {
        // Check if staff has an active in_service customer
        const activeItem = inServiceEntries.find(
          (item) => item.assignedStaffId === staff.id,
        );

        if (activeItem && activeItem.startedAt) {
          staffBusyMap[staff.id] = activeItem;
          const startedMs = activeItem.startedAt.getTime();
          const totalDurationMs =
            (
              (activeItem.serviceDuration || 20) * Math.max(1, activeItem.partySize || 1) +
              (activeItem.extendedMinutes || 0)
            ) * 60 * 1000;
          const expectedFinishMs = startedMs + totalDurationMs;

          // If expected finish is in the past, add an overdue buffer of 3 minutes
          staffTimelines[staff.id] = Math.max(nowMs + 3 * 60 * 1000, expectedFinishMs);
        } else {
          // Staff is available immediately
          staffTimelines[staff.id] = nowMs;
        }
      }
    }

    // Assign any in_service entries without explicit staff to available staff slots
    for (const item of inServiceEntries) {
      if (!item.assignedStaffId || !staffTimelines[item.assignedStaffId]) {
        // Find an unassigned staff slot
        const freeStaff = staffList.find(
          (s) => s.availability !== 'OFFLINE' && !staffBusyMap[s.id],
        );
        if (freeStaff) {
          staffBusyMap[freeStaff.id] = item;
          const startedMs = item.startedAt ? item.startedAt.getTime() : nowMs;
          const totalDurationMs =
            ((item.serviceDuration || 20) + (item.extendedMinutes || 0)) * 60 * 1000;
          staffTimelines[freeStaff.id] = Math.max(nowMs + 3 * 60 * 1000, startedMs + totalDurationMs);
          item.assignedStaffId = freeStaff.id;
        }
      }
    }

    const calculatedItems: CalculatedQueueItem[] = [];

    // Process IN_SERVICE items
    for (const item of inServiceEntries) {
      const startedMs = item.startedAt ? item.startedAt.getTime() : nowMs;
      const durationMins =
        (item.serviceDuration || 20) * Math.max(1, item.partySize || 1) + (item.extendedMinutes || 0);
      const elapsedMins = Math.max(0, Math.floor((nowMs - startedMs) / (60 * 1000)));
      const remainingMins = Math.max(0, durationMins - elapsedMins);
      const isOverdue = elapsedMins > durationMins;
      const expectedEnd = new Date(startedMs + durationMins * 60 * 1000);

      const staff = staffList.find((s) => s.id === item.assignedStaffId);

      calculatedItems.push({
        id: item.id,
        salonId: item.salonId,
        position: 0,
        ticketNumber: item.ticketNumber || '#01',
        customerName: item.customerName,
        phone: item.phone,
        serviceName: item.serviceName,
        serviceId: item.serviceId,
        serviceDuration: item.serviceDuration,
        partySize: item.partySize || 1,
        servicePrice: Number(item.servicePrice || 150),
        assignedStaffId: item.assignedStaffId,
        assignedStaffName: staff?.name || 'Assigned Stylist',
        status: item.status,
        joinedAt: item.joinedAt.toISOString(),
        calledAt: item.calledAt?.toISOString() || null,
        startedAt: item.startedAt?.toISOString() || null,
        servedAt: item.servedAt?.toISOString() || null,
        cancelledAt: item.cancelledAt?.toISOString() || null,
        estimatedWaitMinutes: 0,
        estimatedStartTime: item.startedAt?.toISOString() || now.toISOString(),
        estimatedCompletionTime: expectedEnd.toISOString(),
        extendedMinutes: item.extendedMinutes || 0,
        elapsedServiceMinutes: elapsedMins,
        remainingServiceMinutes: isOverdue ? 0 : remainingMins,
        isOverdue,
      });
    }

    // Process WAITING / CALLED items with multi-staff simulation
    let waitPos = 0;
    for (const item of waitingEntries) {
      waitPos += 1;
      const durationMins =
        (item.serviceDuration || salon?.avgServiceTimeMinutes || 20) * Math.max(1, item.partySize || 1);
      const durationMs = durationMins * 60 * 1000;

      // Identify eligible staff
      let eligibleStaff = staffList.filter((s) => s.availability !== 'OFFLINE');
      if (item.assignedStaffId && staffTimelines[item.assignedStaffId]) {
        eligibleStaff = staffList.filter((s) => s.id === item.assignedStaffId);
      } else {
        // Filter by service capability if staff has assignedServices
        const capableStaff = eligibleStaff.filter(
          (s) =>
            !s.assignedServices ||
            s.assignedServices.length === 0 ||
            s.assignedServices.includes(item.serviceName) ||
            s.assignedServices.includes(item.serviceId || ''),
        );
        if (capableStaff.length > 0) {
          eligibleStaff = capableStaff;
        }
      }

      if (eligibleStaff.length === 0) {
        eligibleStaff = staffList;
      }

      // Pick the staff member with the earliest available slot
      let earliestStaff = eligibleStaff[0];
      let earliestTime = staffTimelines[earliestStaff.id] || nowMs;

      for (const s of eligibleStaff) {
        const time = staffTimelines[s.id] || nowMs;
        if (time < earliestTime) {
          earliestTime = time;
          earliestStaff = s;
        }
      }

      const estimatedStartMs = earliestTime;
      const estimatedCompletionMs = estimatedStartMs + durationMs;
      const estimatedWaitMins = Math.max(0, Math.ceil((estimatedStartMs - nowMs) / (60 * 1000)));

      // Advance this staff's timeline
      staffTimelines[earliestStaff.id] = estimatedCompletionMs;

      const estimatedStartDate = new Date(estimatedStartMs);
      const estimatedCompletionDate = new Date(estimatedCompletionMs);

      calculatedItems.push({
        id: item.id,
        salonId: item.salonId,
        position: waitPos,
        ticketNumber: item.ticketNumber || `#${String(waitPos).padStart(2, '0')}`,
        customerName: item.customerName,
        phone: item.phone,
        serviceName: item.serviceName,
        serviceId: item.serviceId,
        serviceDuration: durationMins,
        partySize: item.partySize || 1,
        servicePrice: Number(item.servicePrice || 150),
        assignedStaffId: item.assignedStaffId || earliestStaff.id,
        assignedStaffName: earliestStaff.name,
        status: item.status,
        joinedAt: item.joinedAt.toISOString(),
        calledAt: item.calledAt?.toISOString() || null,
        startedAt: null,
        servedAt: null,
        cancelledAt: null,
        estimatedWaitMinutes: estimatedWaitMins,
        estimatedStartTime: estimatedStartDate.toISOString(),
        estimatedCompletionTime: estimatedCompletionDate.toISOString(),
        extendedMinutes: 0,
      });

    }

    // Process SKIPPED items
    for (const item of skippedEntries) {
      calculatedItems.push({
        id: item.id,
        salonId: item.salonId,
        position: 999,
        ticketNumber: item.ticketNumber || '#--',
        customerName: item.customerName,
        phone: item.phone,
        serviceName: item.serviceName,
        serviceId: item.serviceId,
        serviceDuration: item.serviceDuration || 20,
        servicePrice: Number(item.servicePrice || 150),
        assignedStaffId: item.assignedStaffId,
        assignedStaffName: null,
        status: 'skipped',
        joinedAt: item.joinedAt.toISOString(),
        calledAt: item.calledAt?.toISOString() || null,
        startedAt: null,
        servedAt: null,
        cancelledAt: null,
        estimatedWaitMinutes: 0,
        extendedMinutes: 0,
      });
    }

    // 5. Aggregate metrics
    const waitingItems = calculatedItems.filter((i) => i.status === 'waiting' || i.status === 'called');
    const totalWaitSum = waitingItems.reduce((acc, cur) => acc + cur.estimatedWaitMinutes, 0);
    const avgWait = waitingItems.length > 0 ? Math.round(totalWaitSum / waitingItems.length) : 0;

    // Total queue completion duration = max timeline across active staff minus now
    let maxStaffEndMs = nowMs;
    for (const s of staffList) {
      if (s.availability !== 'OFFLINE' && staffTimelines[s.id] < Number.MAX_SAFE_INTEGER) {
        if (staffTimelines[s.id] > maxStaffEndMs) {
          maxStaffEndMs = staffTimelines[s.id];
        }
      }
    }
    const totalQueueDuration = Math.max(0, Math.ceil((maxStaffEndMs - nowMs) / (60 * 1000)));

    // Available staff count
    const availableStaffCount = staffList.filter(
      (s) => s.availability === 'AVAILABLE' && !staffBusyMap[s.id],
    ).length;

    const overview: SalonQueueOverview = {
      salonId,
      queueStatus,
      totalWaiting: waitingItems.length,
      inServiceCount: inServiceEntries.length,
      completedCount,
      skippedCount: skippedEntries.length,
      cancelledCount,
      averageWaitMinutes: avgWait,
      estimatedTotalQueueDurationMinutes: totalQueueDuration,
      availableStaffCount,
      totalStaffCount: staffList.filter((s) => s.availability !== 'OFFLINE').length,
      lastQueueUpdate: now.toISOString(),
    };

    if (persist) {
      await this.prisma.runTransaction('queue.recalculation.persist', async (tx) => {
        for (let offset = 0; offset < waitingItems.length; offset += 500) {
          const etaValues = waitingItems.slice(offset, offset + 500).map((item) => Prisma.sql`(
            ${item.id},
            ${item.position},
            ${item.estimatedWaitMinutes},
            ${new Date(item.estimatedStartTime || now.toISOString())},
            ${new Date(item.estimatedCompletionTime || now.toISOString())},
            ${item.assignedStaffId || null}
          )`);
          await tx.$executeRaw(Prisma.sql`
            UPDATE public.salon_queue_entries AS entry
            SET position = eta.position,
                estimated_wait_minutes = eta.estimated_wait_minutes,
                estimated_start_time = eta.estimated_start_time,
                estimated_completion_time = eta.estimated_completion_time,
                assigned_staff_id = eta.assigned_staff_id
            FROM (VALUES ${Prisma.join(etaValues)}) AS eta(
              id, position, estimated_wait_minutes, estimated_start_time,
              estimated_completion_time, assigned_staff_id
            )
            WHERE entry.id = eta.id AND entry.salon_id = ${salonId}
          `);
        }
        await tx.salon.update({
          where: { id: salonId },
          data: {
            currentQueue: isClosed ? 0 : waitingItems.length,
            lastQueueUpdate: now,
            queueStatus,
            todayCustomersServed: completedCount,
            todayRevenue,
          },
        });
      });
    }

    // Prepare staff states
    const staffStates = staffList.map((s) => {
      const activeCust = staffBusyMap[s.id];
      let elapsedMinutes: number | undefined;
      let remainingMinutes: number | undefined;

      if (activeCust && activeCust.startedAt) {
        const startMs = activeCust.startedAt.getTime();
        const totalMs =
          ((activeCust.serviceDuration || 20) + (activeCust.extendedMinutes || 0)) * 60 * 1000;
        elapsedMinutes = Math.max(0, Math.floor((nowMs - startMs) / 60000));
        remainingMinutes = Math.max(0, Math.ceil((startMs + totalMs - nowMs) / 60000));
      }

      return {
        id: s.id,
        name: s.name,
        role: s.role || 'Barber',
        availability: s.availability,
        currentCustomerName: activeCust?.customerName || null,
        currentQueueEntryId: activeCust?.id || null,
        elapsedMinutes,
        remainingMinutes,
      };
    });

    return {
      overview,
      activeEntries: calculatedItems,
      staffStates,
    };
  }
}
