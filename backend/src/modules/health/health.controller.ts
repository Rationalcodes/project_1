import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HealthService, SystemHealthResponse } from './health.service';

@ApiTags('System Health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({
    summary: 'System and database health check',
    description:
      'Verifies PostgreSQL connectivity, PostGIS availability, salon tables, geography column, and GiST index.',
  })
  @ApiResponse({
    status: 200,
    description: 'System health diagnostic status',
    schema: {
      example: {
        status: 'operational',
        service: 'Kumbhakaran API (NestJS + Fastify)',
        version: '1.0.0',
        timestamp: '2026-11-03T12:00:00.000Z',
        uptimeSeconds: 120,
        environment: 'development',
        database: {
          connected: true,
          postgresVersion: 'PostgreSQL 15.1 on x86_64-pc-linux-gnu',
          postgis: {
            available: true,
            version: '3.3.2',
            details: 'POSTGIS="3.3.2" [EXTENSION] PGSQL="150" GEOS="3.11.1"...',
          },
          tables: {
            salons: true,
            salon_services: true,
            salon_staff: true,
            salon_reviews: true,
            allPresent: true,
            foundTables: ['salons', 'salon_services', 'salon_staff', 'salon_reviews'],
          },
          spatialColumn: {
            available: true,
            tableName: 'salons',
            columnName: 'location',
            udtName: 'geography',
          },
          spatialIndex: {
            available: true,
            indexName: 'idx_salons_location_gist',
          },
        },
      },
    },
  })
  async getHealth(): Promise<SystemHealthResponse> {
    return this.healthService.checkHealth();
  }
}
