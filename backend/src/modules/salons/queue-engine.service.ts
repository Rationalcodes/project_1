import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

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
export class QueueEngineService {
  private readonly logger = new Logger(QueueEngineService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Recalculate intelligent ETAs and staff assignments for all active customers in a salon.
   * Deterministic, multi-server safe, single source of truth.
   */
  async recalculateSalonQueue(salonId: string): Promise<RecalculationResult> {
    const now = new Date();
    const nowMs = now.getTime();

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
      },
    });

    const activeBarbersCount = Math.max(1, salon?.activeBarbers || 2);
    const queueStatus: 'open' | 'paused' | 'closed' =
      salon?.isOpen === false
        ? 'closed'
        : (salon?.queueStatus as any) || 'open';

    // 2. Fetch staff members
    let staffList = await this.prisma.salonStaff.findMany({
      where: { salonId, status: 'active' },
      orderBy: { createdAt: 'asc' },
    });

    // If no explicit staff records exist, dynamically create & persist default staff slots so foreign keys never fail
    if (staffList.length === 0) {
      try {
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
      } catch (err) {
        this.logger.warn(`Could not seed default staff records: ${(err as Error).message}`);
      }

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

    // 3. Fetch all active and recent queue entries for today
    const rows = await this.prisma.salonQueueEntry.findMany({
      where: {
        salonId,
        status: { in: ['waiting', 'called', 'in_service', 'skipped'] },
      },
      orderBy: [
        { joinedAt: 'asc' },
      ],
      include: {
        assignedStaff: { select: { id: true, name: true } },
      },
    });

    // Count today's completed and cancelled entries
    const [completedCount, cancelledCount] = await Promise.all([
      this.prisma.salonQueueEntry.count({
        where: {
          salonId,
          status: 'completed',
          servedAt: { gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()) },
        },
      }),
      this.prisma.salonQueueEntry.count({
        where: {
          salonId,
          status: 'cancelled',
          cancelledAt: { gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()) },
        },
      }),
    ]);

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
            ((activeItem.serviceDuration || 20) + (activeItem.extendedMinutes || 0)) * 60 * 1000;
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
      const durationMins = (item.serviceDuration || 20) + (item.extendedMinutes || 0);
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
      const durationMins = item.serviceDuration || salon?.avgServiceTimeMinutes || 20;
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

      // Persist calculated ETAs in database asynchronously
      this.prisma.salonQueueEntry
        .update({
          where: { id: item.id },
          data: {
            position: waitPos,
            estimatedWaitMinutes: estimatedWaitMins,
            estimatedStartTime: estimatedStartDate,
            estimatedCompletionTime: estimatedCompletionDate,
            assignedStaffId: item.assignedStaffId || earliestStaff.id,
          },
        })
        .catch(() => {});
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

    // Update salons table aggregate current_queue & queue_status
    await this.prisma.salon
      .update({
        where: { id: salonId },
        data: {
          currentQueue: waitingItems.length,
          lastQueueUpdate: now,
          queueStatus,
        },
      })
      .catch(() => {});

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
