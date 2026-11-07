import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface DatabaseVerificationResult {
  connected: boolean;
  error?: string;
  postgresVersion?: string;
  postgis: {
    available: boolean;
    version?: string;
    details?: string;
  };
  tables: {
    salons: boolean;
    salon_services: boolean;
    salon_staff: boolean;
    salon_reviews: boolean;
    allPresent: boolean;
    foundTables: string[];
  };
  spatialColumn: {
    available: boolean;
    tableName: string;
    columnName: string;
    udtName?: string;
    details?: string;
  };
  spatialIndex: {
    available: boolean;
    indexName: string;
    indexDef?: string;
  };
}

export interface SystemHealthResponse {
  status: 'operational' | 'degraded';
  service: string;
  version: string;
  timestamp: string;
  uptimeSeconds: number;
  environment: string;
  database: DatabaseVerificationResult;
}

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);
  private readonly startTime = Date.now();

  constructor(private readonly prisma: PrismaService) {}

  checkLiveness() {
    return {
      status: 'ok',
      service: 'Kumbhakaran API (NestJS + Fastify)',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor((Date.now() - this.startTime) / 1000),
      environment: process.env.NODE_ENV || 'development',
    };
  }

  async checkReadiness() {
    try {
      await this.prisma.$queryRawUnsafe('SELECT 1;');
      return {
        status: 'ready',
        database: 'connected',
        timestamp: new Date().toISOString(),
      };
    } catch (err) {
      throw new ServiceUnavailableException({
        status: 'not_ready',
        database: 'disconnected',
        error: (err as Error).message,
        timestamp: new Date().toISOString(),
      });
    }
  }

  async checkHealth(): Promise<SystemHealthResponse> {
    const dbVerification = await this.verifyDatabase();

    return {
      status: dbVerification.connected ? 'operational' : 'degraded',
      service: 'Kumbhakaran API (NestJS + Fastify)',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor((Date.now() - this.startTime) / 1000),
      environment: process.env.NODE_ENV || 'development',
      database: dbVerification,
    };
  }

  async verifyDatabase(): Promise<DatabaseVerificationResult> {
    const result: DatabaseVerificationResult = {
      connected: false,
      postgis: { available: false },
      tables: {
        salons: false,
        salon_services: false,
        salon_staff: false,
        salon_reviews: false,
        allPresent: false,
        foundTables: [],
      },
      spatialColumn: {
        available: false,
        tableName: 'salons',
        columnName: 'location',
      },
      spatialIndex: {
        available: false,
        indexName: 'idx_salons_location_gist',
      },
    };

    if (!process.env.DATABASE_URL) {
      result.error = 'DATABASE_URL environment variable is not defined.';
      return result;
    }

    try {
      // 1. Verify PostgreSQL Connectivity & Version
      const pgVerResult: any[] = await this.prisma.$queryRawUnsafe('SELECT version() AS version;');
      result.connected = true;
      result.postgresVersion = pgVerResult[0]?.version?.split(' ')?.[1] || pgVerResult[0]?.version;

      // 2. Verify PostGIS Extension & Version
      try {
        const postgisResult: any[] = await this.prisma.$queryRawUnsafe('SELECT PostGIS_Full_Version() AS full_version;');
        if (postgisResult.length > 0) {
          result.postgis.available = true;
          result.postgis.version = postgisResult[0]?.full_version?.split(' ')?.[1] || 'installed';
          result.postgis.details = postgisResult[0]?.full_version;
        }
      } catch (err) {
        this.logger.warn(`PostGIS function check returned: ${(err as Error).message}`);
        // Fallback check on pg_extension
        const extResult: any[] = await this.prisma.$queryRawUnsafe(
          "SELECT extname, extversion FROM pg_extension WHERE extname = 'postgis';"
        );
        if (extResult.length > 0) {
          result.postgis.available = true;
          result.postgis.version = extResult[0].extversion;
        }
      }

      // 3. Verify Existing Salon Tables
      const tablesResult: any[] = await this.prisma.$queryRawUnsafe(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
          AND table_name IN ('salons', 'salon_services', 'salon_staff', 'salon_reviews');
      `);

      const foundTables = tablesResult.map((t) => t.table_name);
      result.tables.foundTables = foundTables;
      result.tables.salons = foundTables.includes('salons');
      result.tables.salon_services = foundTables.includes('salon_services');
      result.tables.salon_staff = foundTables.includes('salon_staff');
      result.tables.salon_reviews = foundTables.includes('salon_reviews');
      result.tables.allPresent =
        result.tables.salons &&
        result.tables.salon_services &&
        result.tables.salon_staff &&
        result.tables.salon_reviews;

      // 4. Verify Spatial Column ('location' in 'salons' table)
      const columnResult: any[] = await this.prisma.$queryRawUnsafe(`
        SELECT column_name, udt_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'salons' AND column_name = 'location';
      `);

      if (columnResult.length > 0) {
        result.spatialColumn.available = true;
        result.spatialColumn.udtName = columnResult[0].udt_name;
        result.spatialColumn.details = `Column 'location' exists with type: ${columnResult[0].udt_name} (${columnResult[0].data_type})`;
      }

      // 5. Verify GiST Spatial Index ('idx_salons_location_gist')
      const indexResult: any[] = await this.prisma.$queryRawUnsafe(`
        SELECT indexname, indexdef
        FROM pg_indexes
        WHERE tablename = 'salons' AND (indexname = 'idx_salons_location_gist' OR indexdef LIKE '%gist%location%');
      `);

      if (indexResult.length > 0) {
        result.spatialIndex.available = true;
        result.spatialIndex.indexName = indexResult[0].indexname;
        result.spatialIndex.indexDef = indexResult[0].indexdef;
      }
    } catch (error) {
      result.connected = false;
      result.error = (error as Error).message;
      this.logger.error(`Database health verification error: ${(error as Error).message}`);
    }

    return result;
  }
}
