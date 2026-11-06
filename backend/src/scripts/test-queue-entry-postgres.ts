import * as assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { Prisma, PrismaClient } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { QueueEngineService } from '../modules/salons/queue-engine.service';
import { QueueGateway } from '../modules/salons/queue.gateway';
import { SalonsService } from '../modules/salons/salons.service';
import { CreateQueueEntryDto } from '../modules/salons/dto/create-queue-entry.dto';

const databaseUrl = process.env.QUEUE_TEST_DATABASE_URL;
if (!databaseUrl) {
  throw new Error('Set QUEUE_TEST_DATABASE_URL to an isolated local PostgreSQL test database.');
}

let parsedDatabaseUrl: URL;
try {
  parsedDatabaseUrl = new URL(databaseUrl);
} catch {
  throw new Error('QUEUE_TEST_DATABASE_URL must be a valid PostgreSQL URL.');
}
const databaseHost = parsedDatabaseUrl.hostname.replace(/^\[|\]$/g, '').toLowerCase();
const databaseName = decodeURIComponent(parsedDatabaseUrl.pathname.replace(/^\/+/, ''));
if (!['localhost', '127.0.0.1', '::1'].includes(databaseHost) || !/(test|queue)/i.test(databaseName)) {
  throw new Error('PostgreSQL queue integration tests only allow loopback hosts and test/queue-named databases.');
}

const previousNodeEnv = process.env.NODE_ENV;
const previousJwtSecret = process.env.JWT_SECRET;
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'queue-integration-test-secret';

const prisma = new PrismaClient({ datasourceUrl: parsedDatabaseUrl.toString() });
const prismaService = Object.assign(prisma, {
  runTransaction: <T>(operation: string, callback: (tx: Prisma.TransactionClient) => Promise<T>) => {
    void operation;
    return prisma.$transaction(callback);
  },
});
const salonIds: string[] = [];
let connected = false;

function createService(failRecalculation = false): SalonsService {
  const queueEngine = {
    recalculateSalonQueue: async () => {
      if (failRecalculation) throw new Error('test ETA failure');
      return {
        overview: { totalWaiting: 0 },
        activeEntries: [],
      };
    },
  } as unknown as QueueEngineService;
  const service = new SalonsService(
    prismaService as unknown as PrismaService,
    queueEngine,
    { broadcastToSalon: () => undefined } as unknown as QueueGateway,
  );
  return service;
}

async function createTestSalon(): Promise<string> {
  const id = `queue-test-${randomUUID()}`;
  await prisma.$executeRaw`
    INSERT INTO public.salons (
      id, name, owner_name, phone, address, locality, city, pincode,
      latitude, longitude, location, opening_hours_open, opening_hours_close,
      is_open, queue_status
    ) VALUES (
      ${id}, 'Queue Integration Test', 'Test Owner', '0000000000',
      'Test Address', 'Test Locality', 'Test City', '000000',
      0, 0, ST_SetSRID(ST_MakePoint(0, 0), 4326)::geography,
      '00:00', '23:59', TRUE, 'open'
    )
  `;
  salonIds.push(id);
  return id;
}

function joinRequest(requestId: string, customerName: string, deviceId?: string): CreateQueueEntryDto {
  return { requestId, customerName, deviceId } as CreateQueueEntryDto;
}

async function assertMigrationPresent() {
  const column = await prisma.$queryRaw<Array<{ exists: boolean }>>`
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'salon_queue_entries'
        AND column_name = 'client_request_id'
    ) AS exists
  `;
  const index = await prisma.$queryRaw<Array<{ exists: boolean }>>`
    SELECT to_regclass('public.uq_queue_salon_request') IS NOT NULL AS "exists"
  `;
  assert.equal(column[0]?.exists, true, 'queue idempotency migration column must be applied');
  assert.equal(index[0]?.exists, true, 'queue idempotency unique index must be applied');
}

async function run() {
  await prisma.$connect();
  connected = true;
  await assertMigrationPresent();
  const service = createService();

  const concurrentSalonId = await createTestSalon();
  const concurrentResults = await Promise.all(
    Array.from({ length: 20 }, (_, index) =>
      service.addQueueEntry(
        concurrentSalonId,
        joinRequest(randomUUID(), `Concurrent customer ${index}`),
      ),
    ),
  );
  assert.equal(new Set(concurrentResults.map(({ entry }) => entry.position)).size, 20);
  assert.equal(new Set(concurrentResults.map(({ entry }) => entry.ticketNumber)).size, 20);
  console.log('PASS PostgreSQL: 20 concurrent joins receive unique positions and serials');

  const retrySalonId = await createTestSalon();
  const sharedRequestId = randomUUID();
  const retryResults = await Promise.all(
    Array.from({ length: 10 }, () =>
      service.addQueueEntry(
        retrySalonId,
        joinRequest(sharedRequestId, 'Retry customer', 'retry-device'),
      ),
    ),
  );
  assert.equal(new Set(retryResults.map(({ entry }) => entry.id)).size, 1);
  assert.equal(new Set(retryResults.map(({ entry }) => entry.position)).size, 1);
  assert.equal(await prisma.salonQueueEntry.count({
    where: { salonId: retrySalonId, clientRequestId: sharedRequestId },
  }), 1);
  console.log('PASS PostgreSQL: 10 concurrent retries return the same committed ticket');

  const differentCustomersSalonId = await createTestSalon();
  const differentCustomerResults = await Promise.all(
    Array.from({ length: 8 }, (_, index) =>
      service.addQueueEntry(
        differentCustomersSalonId,
        joinRequest(randomUUID(), `Independent customer ${index}`, `device-${index}`),
      ),
    ),
  );
  assert.equal(new Set(differentCustomerResults.map(({ entry }) => entry.id)).size, 8);
  assert.equal(new Set(differentCustomerResults.map(({ entry }) => entry.position)).size, 8);
  console.log('PASS PostgreSQL: distinct customers join concurrently and independently');

  const failingSalonId = await createTestSalon();
  const suffix = randomUUID().replace(/-/g, '');
  const functionName = `queue_failure_${suffix}`;
  const triggerName = `queue_failure_trigger_${suffix}`;
  await prisma.$executeRawUnsafe(`
    CREATE FUNCTION public.${functionName}() RETURNS trigger LANGUAGE plpgsql AS $$
    BEGIN
      IF NEW.salon_id = '${failingSalonId}' AND NEW.customer_name = 'integration-db-failure' THEN
        RAISE EXCEPTION 'intentional isolated queue test failure';
      END IF;
      RETURN NEW;
    END
    $$
  `);
  await prisma.$executeRawUnsafe(`
    CREATE TRIGGER ${triggerName}
    BEFORE INSERT ON public.salon_queue_entries
    FOR EACH ROW EXECUTE FUNCTION public.${functionName}()
  `);
  const failedRequestId = randomUUID();
  try {
    await assert.rejects(
      service.addQueueEntry(failingSalonId, joinRequest(failedRequestId, 'integration-db-failure')),
    );
    assert.equal(await prisma.salonQueueEntry.count({
      where: { salonId: failingSalonId, clientRequestId: failedRequestId },
    }), 0);
    console.log('PASS PostgreSQL: ticket insert failure rolls back the transaction');
  } finally {
    await prisma.$executeRawUnsafe(`DROP TRIGGER IF EXISTS ${triggerName} ON public.salon_queue_entries`);
    await prisma.$executeRawUnsafe(`DROP FUNCTION IF EXISTS public.${functionName}()`);
  }

  const etaFailureSalonId = await createTestSalon();
  const etaFailureRequestId = randomUUID();
  const etaFailureService = createService(true);
  const committedDespiteEtaFailure = await etaFailureService.addQueueEntry(
    etaFailureSalonId,
    joinRequest(etaFailureRequestId, 'ETA failure customer'),
  );
  assert.equal(committedDespiteEtaFailure.success, true);
  assert.equal(await prisma.salonQueueEntry.count({
    where: { salonId: etaFailureSalonId, clientRequestId: etaFailureRequestId },
  }), 1);
  console.log('PASS PostgreSQL: ETA failure after commit still returns a persisted ticket');

  const lostResponseSalonId = await createTestSalon();
  const lostResponseId = randomUUID();
  const committedTicket = await service.addQueueEntry(
    lostResponseSalonId,
    joinRequest(lostResponseId, 'Lost response customer'),
  );
  await prisma.salon.update({
    where: { id: lostResponseSalonId },
    data: { isOpen: false, queueStatus: 'closed' },
  });
  const recoveredTicket = await service.addQueueEntry(
    lostResponseSalonId,
    joinRequest(lostResponseId, 'Lost response customer'),
  );
  assert.equal(recoveredTicket.entry.id, committedTicket.entry.id);
  assert.equal(recoveredTicket.entry.position, committedTicket.entry.position);
  assert.equal(recoveredTicket.queueAccessToken, committedTicket.queueAccessToken);
  assert.equal(await prisma.salonQueueEntry.count({
    where: { salonId: lostResponseSalonId, clientRequestId: lostResponseId },
  }), 1);
  console.log('PASS PostgreSQL: retry after a lost response recovers the original ticket and access token');
}

void run()
  .catch((error: unknown) => {
    console.error(`Queue PostgreSQL integration test failed (${error instanceof Error ? error.name : 'UnknownError'}).`);
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      if (connected) {
        for (const salonId of salonIds) {
          await prisma.salon.deleteMany({ where: { id: salonId } });
        }
      }
    } finally {
      try {
        await prisma.$disconnect();
      } finally {
        if (previousNodeEnv === undefined) delete process.env.NODE_ENV;
        else process.env.NODE_ENV = previousNodeEnv;
        if (previousJwtSecret === undefined) delete process.env.JWT_SECRET;
        else process.env.JWT_SECRET = previousJwtSecret;
      }
    }
  });
