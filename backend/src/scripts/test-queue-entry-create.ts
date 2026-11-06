import * as assert from 'node:assert/strict';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { QueueEngineService } from '../modules/salons/queue-engine.service';
import { QueueGateway } from '../modules/salons/queue.gateway';
import { SalonsService } from '../modules/salons/salons.service';
import { SalonsController } from '../modules/salons/salons.controller';
import { DiscoveryService } from '../modules/discovery/discovery.service';
import { CreateQueueEntryDto } from '../modules/salons/dto/create-queue-entry.dto';

const salonId = 'test-salon';
const openSalon = {
  id: salonId,
  name: 'Test Salon',
  isOpen: true,
  queueStatus: 'open',
  openingHoursOpen: '00:00',
  openingHoursClose: '23:59',
  avgServiceTimeMinutes: 20,
  startingPrice: 150,
};

function createHarness(options: {
  salon?: typeof openSalon | null;
  service?: { id: string; durationMinutes: number; price: number } | null;
  staff?: { id: string } | null;
  duplicate?: { ticket_number: string; position: number } | null;
  failTransaction?: boolean;
  failRecalculation?: boolean;
} = {}) {
  let createdEntry: Record<string, any> | null = null;
  const queries: string[] = [];
  const tx = {
    $queryRaw: async (query: any) => {
      const text = Array.isArray(query)
        ? query.join(' ')
        : query.sql || query.strings?.join(' ') || '';
      queries.push(text);
      if (text.includes('pg_advisory_xact_lock')) return [];
      if (text.includes('FROM public.salons')) {
        const salon = options.salon === undefined ? openSalon : options.salon;
        return salon
          ? [{
              is_open: salon.isOpen,
              queue_status: salon.queueStatus,
              opening_hours_open: salon.openingHoursOpen,
              opening_hours_close: salon.openingHoursClose,
            }]
          : [];
      }
      if (text.includes('MAX(position)')) {
        return [{ max_pos: 2, max_ticket: 2, waiting_count: 2 }];
      }
      if (text.includes('SELECT ticket_number, position')) {
        return options.duplicate ? [options.duplicate] : [];
      }
      throw new Error(`Unexpected raw query in test: ${text}`);
    },
    salonQueueEntry: {
      findUnique: async ({ where }: { where: { salonId_clientRequestId: { salonId: string; clientRequestId: string } } }) => {
        const request = where.salonId_clientRequestId;
        return createdEntry?.salonId === request.salonId &&
          createdEntry?.clientRequestId === request.clientRequestId
          ? createdEntry
          : null;
      },
      create: async ({ data }: { data: Record<string, any> }) => {
        createdEntry = { ...data };
        return createdEntry;
      },
    },
    salonStaff: {
      findFirst: async () => options.staff === undefined ? { id: 'test-staff' } : options.staff,
    },
  };
  const prisma = {
    salon: {
      findUnique: async () => options.salon === undefined ? openSalon : options.salon,
    },
    salonService: {
      findFirst: async () => options.service ?? null,
    },
    salonQueueEntry: {
      findUnique: async ({ where }: { where: { salonId_clientRequestId: { salonId: string; clientRequestId: string } } }) => {
        const request = where.salonId_clientRequestId;
        return createdEntry?.salonId === request.salonId &&
          createdEntry?.clientRequestId === request.clientRequestId
          ? createdEntry
          : null;
      },
      count: async () => createdEntry ? 1 : 0,
    },
    queueEvent: {
      create: async () => undefined,
    },
    runTransaction: async (_operation: string, callback: (transaction: typeof tx) => Promise<unknown>) => {
      if (options.failTransaction) throw new Error('test database unavailable');
      return callback(tx);
    },
  } as unknown as PrismaService;
  const queueEngine = {
    recalculateSalonQueue: async () => {
      if (options.failRecalculation) throw new Error('test recalculation unavailable');
      return {
        overview: { totalWaiting: 3 },
        activeEntries: [],
      };
    },
  } as unknown as QueueEngineService;
  const queueGateway = { broadcastToSalon: () => undefined } as unknown as QueueGateway;

  return {
    service: new SalonsService(prisma, queueEngine, queueGateway),
    queries,
    get createdEntry() {
      return createdEntry;
    },
  };
}

async function main() {
  const previousNodeEnv = process.env.NODE_ENV;
  const previousJwtSecret = process.env.JWT_SECRET;
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-only-queue-secret';

  try {
    const valid = createHarness();
    const validResult = await valid.service.addQueueEntry(
      salonId,
      { requestId: 'b6fca35f-2acf-4c64-8f66-477e0a4b4cd4', customerName: 'Test Customer', deviceId: 'test-device' } as CreateQueueEntryDto,
    );
    assert.equal(validResult.success, true);
    assert.equal(validResult.entry.position, 3);
    assert.equal(validResult.currentQueue, 3);
    assert.ok(validResult.queueAccessToken);
    assert.ok(valid.queries.some((query) => query.includes('pg_advisory_xact_lock')));
    console.log('PASS valid queue join and salon lock');

    await assert.rejects(
      createHarness({ salon: null }).service.addQueueEntry(
        salonId,
        { requestId: '4f05a073-4828-48a1-9e10-8da6c44d9bce' } as CreateQueueEntryDto,
      ),
      NotFoundException,
    );
    console.log('PASS invalid salon returns 404');

    await assert.rejects(
      createHarness().service.addQueueEntry(
        salonId,
        { requestId: '9a6f3132-9dc8-4d61-9307-1ed98f6533eb', serviceId: 'missing-service' } as CreateQueueEntryDto,
      ),
      BadRequestException,
    );
    console.log('PASS invalid service returns 400');

    await assert.rejects(
      createHarness({ salon: { ...openSalon, queueStatus: 'paused' } })
        .service.addQueueEntry(salonId, { requestId: '201b6756-949a-4b2d-bdd4-a109c00b4286' } as CreateQueueEntryDto),
      BadRequestException,
    );
    console.log('PASS paused queue rejects new joins');

    await assert.rejects(
      createHarness({ staff: null }).service.addQueueEntry(
        salonId,
        { requestId: 'eb827fff-66d4-4414-ac02-5c0c1981c038', preferredStaffId: 'missing-staff' } as CreateQueueEntryDto,
      ),
      BadRequestException,
    );
    console.log('PASS invalid preferred staff returns 400');

    await assert.rejects(
      createHarness({ duplicate: { ticket_number: '#02', position: 2 } })
        .service.addQueueEntry(
          salonId,
          { requestId: '2bb3db32-4e27-47e8-90e8-53e342e8b76a', deviceId: 'test-device' } as CreateQueueEntryDto,
        ),
      ConflictException,
    );
    console.log('PASS duplicate active ticket returns 409');

    const retried = createHarness();
    const retryRequest = {
      requestId: '67e22351-5f18-460d-948e-183a99b73db2',
      customerName: 'Retry Customer',
      deviceId: 'retry-device',
    } as CreateQueueEntryDto;
    const firstAttempt = await retried.service.addQueueEntry(salonId, retryRequest);
    const repeatedAttempt = await retried.service.addQueueEntry(salonId, retryRequest);
    assert.equal(repeatedAttempt.entry.id, firstAttempt.entry.id);
    assert.equal(repeatedAttempt.entry.ticketNumber, firstAttempt.entry.ticketNumber);
    assert.equal(repeatedAttempt.queueAccessToken, firstAttempt.queueAccessToken);
    await assert.rejects(
      retried.service.addQueueEntry(salonId, {
        ...retryRequest,
        customerName: 'Different Customer',
      }),
      ConflictException,
    );
    console.log('PASS repeated request ID returns the original ticket');

    const recalcFailure = createHarness({ failRecalculation: true });
    const committedResult = await recalcFailure.service.addQueueEntry(
      salonId,
      { requestId: 'a0dd0540-d5dc-4766-8a29-760de4d9d06e', customerName: 'Committed Customer', deviceId: 'recalc-failure-device' } as CreateQueueEntryDto,
    );
    assert.equal(committedResult.success, true);
    assert.ok(recalcFailure.createdEntry);
    assert.equal(committedResult.entry.id, recalcFailure.createdEntry?.id);
    assert.equal(committedResult.currentQueue, 3);
    assert.ok(committedResult.queueAccessToken);
    console.log('PASS committed ticket remains retrievable when ETA recalculation fails');

    await assert.rejects(
      createHarness({ failTransaction: true }).service.addQueueEntry(
        salonId,
        { requestId: '0feeb187-676d-4491-a338-fdb63628f012', deviceId: 'db-failure-device' } as CreateQueueEntryDto,
      ),
      /test database unavailable/,
    );
    console.log('PASS database transaction failure is not reported as success');

    const makeController = (failure: Error) => new SalonsController(
      { addQueueEntry: async () => { throw failure; } } as unknown as SalonsService,
      {} as DiscoveryService,
    );
    const duplicateDatabaseError = new Prisma.PrismaClientKnownRequestError('unique conflict', {
      code: 'P2002',
      clientVersion: '6.19.3',
    });
    await assert.rejects(
      makeController(duplicateDatabaseError).addQueueEntry(salonId, { requestId: '50aaf06c-a9b1-42b0-983e-c7b99348116a' } as CreateQueueEntryDto),
      (error: any) => error.getStatus() === 409,
    );
    console.log('PASS database duplicate maps to HTTP 409');

    const poolDatabaseError = new Prisma.PrismaClientKnownRequestError('pool exhausted', {
      code: 'P2024',
      clientVersion: '6.19.3',
    });
    await assert.rejects(
      makeController(poolDatabaseError).addQueueEntry(salonId, { requestId: 'c17bdd0d-627a-4372-9df9-2c5bd20b7786' } as CreateQueueEntryDto),
      (error: any) => error.getStatus() === 503,
    );
    await assert.rejects(
      makeController(new Error('EMAXCONNSESSION: max clients reached'))
        .addQueueEntry(salonId, { requestId: '99f5a928-cea2-41ae-9919-0c765d33e334' } as CreateQueueEntryDto),
      (error: any) => error.getStatus() === 503,
    );
    console.log('PASS Prisma pool exhaustion maps to sanitized HTTP 503');
  } finally {
    if (previousNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previousNodeEnv;
    if (previousJwtSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = previousJwtSecret;
  }
}

void main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
