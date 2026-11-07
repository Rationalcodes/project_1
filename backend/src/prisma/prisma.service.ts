import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';

const DEFAULT_CONNECTION_LIMIT = 5;
const MAX_CONNECTION_LIMIT = 5;

function getPrismaConnectionOptions(connectionLimit: number) {
  const options = {
    log: [
      { emit: 'event' as const, level: 'query' as const },
      { emit: 'event' as const, level: 'error' as const },
      { emit: 'event' as const, level: 'warn' as const },
    ],
  };
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) return options;

  let url: URL;
  try {
    url = new URL(databaseUrl);
  } catch {
    throw new Error('DATABASE_URL must be a valid PostgreSQL URL.');
  }
  if (!['postgres:', 'postgresql:'].includes(url.protocol)) {
    throw new Error('DATABASE_URL must use the PostgreSQL protocol.');
  }

  url.searchParams.set('connection_limit', String(connectionLimit));
  return { ...options, datasourceUrl: url.toString() };
}

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private readonly connectionLimit: number;
  private reconnectTimer?: NodeJS.Timeout;
  private reconnectAttempt = 0;
  private shuttingDown = false;

  constructor() {
    const connectionLimit = process.env.PRISMA_CONNECTION_LIMIT
      ? Number(process.env.PRISMA_CONNECTION_LIMIT)
      : DEFAULT_CONNECTION_LIMIT;
    if (!Number.isInteger(connectionLimit) || connectionLimit < 1 || connectionLimit > MAX_CONNECTION_LIMIT) {
      throw new Error(`PRISMA_CONNECTION_LIMIT must be an integer between 1 and ${MAX_CONNECTION_LIMIT}.`);
    }
    super(getPrismaConnectionOptions(connectionLimit));
    this.connectionLimit = connectionLimit;

    this.$on('query', (event) => {
      const payload = {
        event: 'db.query.duration',
        durationMs: event.duration,
        target: event.target,
      };
      this.logger.debug(JSON.stringify(payload));
      if (event.duration >= 1000) {
        this.logger.warn(JSON.stringify({ ...payload, event: 'db.query.slow' }));
      }
    });

    this.$on('error', (event) => {
      this.logger.error(JSON.stringify({
        event: 'db.client.error',
        target: event.target,
      }));
    });

    this.$on('warn', (event) => {
      this.logger.warn(JSON.stringify({
        event: 'db.client.warning',
        target: event.target,
      }));
    });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logConnectionReady(false);
    } catch (error) {
      this.logger.error(JSON.stringify({
        event: 'db.connection.failed',
        code: this.getSafeErrorCode(error),
      }));
      this.scheduleConnectionRetry();
    }
  }

  async onModuleDestroy() {
    this.shuttingDown = true;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    await this.$disconnect();
    this.logger.log(JSON.stringify({ event: 'db.connection.closed' }));
  }

  async runTransaction<T>(
    operation: string,
    callback: (transaction: Prisma.TransactionClient) => Promise<T>,
    options?: { maxWait?: number; timeout?: number; isolationLevel?: Prisma.TransactionIsolationLevel },
  ): Promise<T> {
    const startedAt = Date.now();
    try {
      return await this.$transaction(callback, {
        maxWait: options?.maxWait ?? 5000,
        timeout: options?.timeout ?? 10000,
        isolationLevel: options?.isolationLevel,
      });
    } catch (error) {
      this.logger.error(JSON.stringify({
        event: 'db.transaction.failed',
        operation,
        durationMs: Date.now() - startedAt,
        code: this.getSafeErrorCode(error),
      }));
      throw error;
    }
  }

  private getSafeErrorCode(error: unknown): string | null {
    if (typeof error !== 'object' || error === null || !('code' in error)) return null;
    const code = (error as { code?: unknown }).code;
    return typeof code === 'string' && /^[A-Z0-9_]+$/.test(code) ? code : null;
  }

  private logConnectionReady(recovered: boolean) {
    this.logger.log(JSON.stringify({
      event: 'db.connection.ready',
      connectionLimit: this.connectionLimit,
      recovered,
    }));
  }

  private scheduleConnectionRetry() {
    if (this.shuttingDown || this.reconnectTimer) return;
    this.reconnectAttempt += 1;
    const delayMs = Math.min(60_000, 1000 * 2 ** Math.min(this.reconnectAttempt - 1, 6));
    this.logger.warn(JSON.stringify({
      event: 'db.connection.retry_scheduled',
      attempt: this.reconnectAttempt,
      delayMs,
    }));
    this.reconnectTimer = setTimeout(async () => {
      this.reconnectTimer = undefined;
      try {
        await this.$connect();
        this.reconnectAttempt = 0;
        this.logConnectionReady(true);
      } catch (error) {
        this.logger.error(JSON.stringify({
          event: 'db.connection.retry_failed',
          attempt: this.reconnectAttempt,
          code: this.getSafeErrorCode(error),
        }));
        this.scheduleConnectionRetry();
      }
    }, delayMs);
  }
}
