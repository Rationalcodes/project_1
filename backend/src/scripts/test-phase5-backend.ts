import { HttpStatus, HttpException, NotFoundException, ConflictException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { GlobalExceptionFilter } from '../common/filters/global-exception.filter';
import { QueueEngineService } from '../modules/salons/queue-engine.service';
import { PrismaService } from '../prisma/prisma.service';

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`FAIL: ${message}`);
  }
  console.log(`PASS: ${message}`);
}

async function runPhase5Tests() {
  console.log('=============================================================');
  console.log('   SLOON PHASE 5: BACKEND ARCHITECTURE & SCALABILITY TESTS');
  console.log('=============================================================');

  const filter = new GlobalExceptionFilter();

  function mockHost(url = '/api/v1/salons', method = 'GET') {
    let responseCode = 0;
    let responsePayload: any = null;

    const reply = {
      code(c: number) {
        responseCode = c;
        return this;
      },
      send(payload: any) {
        responsePayload = payload;
        return this;
      },
    };

    const request = {
      url,
      method,
      ip: '127.0.0.1',
    };

    const host = {
      switchToHttp() {
        return {
          getResponse: () => reply,
          getRequest: () => request,
        };
      },
    } as any;

    return { host, getCode: () => responseCode, getPayload: () => responsePayload };
  }

  console.log('\n--- Section 1: Global Exception Filter — HTTP Exceptions ---');
  {
    const { host, getCode, getPayload } = mockHost();
    filter.catch(new NotFoundException('Salon not found'), host);
    assert(getCode() === HttpStatus.NOT_FOUND, 'NotFoundException maps to HTTP 404');
    assert(getPayload().statusCode === 404, 'Response payload contains statusCode 404');
    assert(getPayload().message === 'Salon not found', 'Response payload contains user-facing message');
    assert(getPayload().path === '/api/v1/salons', 'Response payload includes request path');
  }

  {
    const { host, getCode, getPayload } = mockHost('/api/v1/queue/join', 'POST');
    filter.catch(new ConflictException('Queue is at capacity'), host);
    assert(getCode() === HttpStatus.CONFLICT, 'ConflictException maps to HTTP 409');
    assert(getPayload().message === 'Queue is at capacity', 'Conflict message preserved');
  }

  console.log('\n--- Section 2: Global Exception Filter — Prisma Database Error Mapping ---');
  {
    const { host, getCode, getPayload } = mockHost();
    const p2002Error = new Prisma.PrismaClientKnownRequestError(
      'Unique constraint failed on the fields: (`phone`)',
      { code: 'P2002', clientVersion: '6.19.3' },
    );
    filter.catch(p2002Error, host);
    assert(getCode() === HttpStatus.CONFLICT, 'Prisma P2002 maps to HTTP 409 Conflict');
    assert(getPayload().message === 'A duplicate record with this unique identifier already exists', 'P2002 message sanitized without leaking DB field details');
  }

  {
    const { host, getCode, getPayload } = mockHost();
    const p2025Error = new Prisma.PrismaClientKnownRequestError(
      'An operation failed because it depends on one or more records that were required but not found. Record to update not found.',
      { code: 'P2025', clientVersion: '6.19.3' },
    );
    filter.catch(p2025Error, host);
    assert(getCode() === HttpStatus.NOT_FOUND, 'Prisma P2025 maps to HTTP 404 Not Found');
    assert(getPayload().message === 'The requested resource was not found', 'P2025 message sanitized');
  }

  {
    const { host, getCode, getPayload } = mockHost();
    const p2024Error = new Prisma.PrismaClientKnownRequestError(
      'Timed out fetching a new connection from the connection pool. (More info: http://pris.ly/d/connection-pool-timeout)',
      { code: 'P2024', clientVersion: '6.19.3' },
    );
    filter.catch(p2024Error, host);
    assert(getCode() === HttpStatus.SERVICE_UNAVAILABLE, 'Prisma P2024 pool timeout maps to HTTP 503');
    assert(getPayload().message.includes('Database connection pool is temporarily busy'), 'P2024 message friendly to client');
  }

  {
    const { host, getCode, getPayload } = mockHost();
    const initError = new Prisma.PrismaClientInitializationError(
      'Can\'t reach database server at aws-0-eu-west-1.pooler.supabase.com:6543',
      '6.19.3',
    );
    filter.catch(initError, host);
    assert(getCode() === HttpStatus.SERVICE_UNAVAILABLE, 'PrismaClientInitializationError maps to HTTP 503');
    assert(getPayload().message.includes('Database service temporarily unreachable'), 'DB host and credentials sanitized');
  }

  console.log('\n--- Section 3: Global Exception Filter — Generic Unhandled Errors ---');
  {
    const { host, getCode, getPayload } = mockHost();
    const prevEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    try {
      const dbLeak = new Error('SELECT * FROM "users" WHERE "password" = \'secret\' failed: socket closed');
      filter.catch(dbLeak, host);
      assert(getCode() === HttpStatus.INTERNAL_SERVER_ERROR, 'Unhandled error returns HTTP 500');
      assert(getPayload().message === 'Internal server error', 'Production 500 does NOT leak raw SQL query or table names');
    } finally {
      process.env.NODE_ENV = prevEnv;
    }
  }

  console.log('\n--- Section 4: Background Sweep Concurrency Mutex ---');
  {
    let sweepCallCount = 0;
    let releaseSweep: (() => void) | null = null;

    const mockPrisma = {
      salonQueueEntry: {
        updateMany: async () => {
          sweepCallCount++;
          // simulate a slow sweep in progress
          await new Promise<void>((resolve) => {
            releaseSweep = resolve;
          });
          return { count: 0 };
        },
      },
      salon: {
        findMany: async () => {
          return [];
        },
      },
    } as any;

    const mockLogger = {
      log: () => {},
      warn: (msg: string) => {
        assert(msg.includes('Prior sweep still in flight'), 'Warning logged when overlapping sweep is dropped');
      },
      error: () => {},
      debug: () => {},
    };

    const engine = new QueueEngineService(
      mockPrisma,
    );
    (engine as any).logger = mockLogger;

    // Start sweep 1 (will pause inside findMany)
    const sweep1Promise = engine.sweepAllSalonsClosingAndDailyReset();

    // Give it a tick to enter
    await new Promise((r) => setTimeout(r, 10));

    // Attempt overlapping sweep 2 while sweep 1 is still in flight
    await engine.sweepAllSalonsClosingAndDailyReset();
    assert(sweepCallCount === 1, 'Overlapping sweep was rejected by mutex; findMany called exactly once');

    // Complete sweep 1
    if (releaseSweep) (releaseSweep as () => void)();
    await sweep1Promise;

    // Now sweep 3 should succeed since mutex is released
    let releaseSweep3: (() => void) | null = null;
    (mockPrisma.salonQueueEntry.updateMany as any) = async () => {
      sweepCallCount++;
      return { count: 0 };
    };

    await engine.sweepAllSalonsClosingAndDailyReset();
    assert(sweepCallCount === 2, 'Subsequent sweep succeeds after previous sweep releases mutex');
  }

  console.log('\n--- Section 5: Prisma Transaction Options Configuration ---');
  {
    let capturedOptions: any = null;
    const mockPrismaClient = {
      $transaction: async (cb: any, opts: any) => {
        capturedOptions = opts;
        return cb({});
      },
      logger: { error: () => {}, log: () => {} },
    };

    const prismaService = new PrismaService();
    (prismaService as any).$transaction = mockPrismaClient.$transaction;
    (prismaService as any).logger = mockPrismaClient.logger;

    // Call runTransaction with default options
    await prismaService.runTransaction('test-op', async () => 'ok');
    assert(capturedOptions.maxWait === 5000, 'Default maxWait is 5000ms');
    assert(capturedOptions.timeout === 10000, 'Default timeout is 10000ms');

    // Call runTransaction with custom overrides
    await prismaService.runTransaction('custom-op', async () => 'ok', {
      maxWait: 8000,
      timeout: 15000,
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    });
    assert(capturedOptions.maxWait === 8000, 'Custom maxWait passed through to Prisma');
    assert(capturedOptions.timeout === 15000, 'Custom timeout passed through to Prisma');
    assert(
      capturedOptions.isolationLevel === Prisma.TransactionIsolationLevel.Serializable,
      'Custom isolationLevel passed through',
    );
  }

  console.log('\n=============================================================');
  console.log('  PHASE 5: ALL TESTS PASSED SUCCESSFULLY');
  console.log('=============================================================');
}

runPhase5Tests().catch((err) => {
  console.error('Phase 5 test failed:', err);
  process.exit(1);
});
