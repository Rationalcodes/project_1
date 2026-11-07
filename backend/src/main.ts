import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import compress from '@fastify/compress';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  // 1. Initialize NestJS with Fastify Adapter
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      logger: process.env.NODE_ENV === 'development',
      bodyLimit: 52428800, // 50MB body limit for media and video uploads
    }),
  );

  // 2. High-Performance Gzip/Deflate Payload Compression (Phase 1 Optimization)
  await app.register(compress, {
    encodings: ['gzip', 'deflate'],
    threshold: 1024, // Compress responses exceeding 1KB
  });

  // 3. Configure Global API Prefix (API Versioning v1)
  app.setGlobalPrefix('api/v1');
  app.enableShutdownHooks();

  // Fallback Redirect: Automatically redirect legacy requests missing /api/v1 to /api/v1 (307 preserves method and body)
  const fastify = app.getHttpAdapter().getInstance();
  fastify.addHook('onRequest', async (req: any, reply: any) => {
    const rawUrl = req.raw?.url || req.url || '';
    if (
      rawUrl &&
      !rawUrl.startsWith('/api/') &&
      !rawUrl.startsWith('/health') &&
      !rawUrl.startsWith('/docs') &&
      !rawUrl.startsWith('/favicon')
    ) {
      const destination = `/api/v1${rawUrl.startsWith('/') ? rawUrl : `/${rawUrl}`}`;
      reply.code(307).redirect(destination);
    }
  });

  // 3. Configure Production & Preview CORS
  const allowedOriginsEnv = process.env.ALLOWED_ORIGINS;
  const explicitOrigins = allowedOriginsEnv
    ? allowedOriginsEnv.split(',').map((o) => o.trim())
    : [];

  app.enableCors({
    origin: (origin, callback) => {
      // Allow mobile apps, curl, internal health checks, or missing origin header
      if (!origin) return callback(null, true);

      // Allow explicit origins configured in environment variables
      if (explicitOrigins.includes(origin)) return callback(null, true);

      // Allow local development origins
      if (/^https?:\/\/localhost(:\d+)?$/.test(origin)) return callback(null, true);
      if (/^https?:\/\/127\.0\.0\.1(:\d+)?$/.test(origin)) return callback(null, true);

      // Allow temporary & production Vercel URLs (*.vercel.app)
      if (/^https:\/\/.*\.vercel\.app$/.test(origin)) return callback(null, true);

      // Allow official Kumbhkaran Salons custom domains (*.kumbhkaransalons.in, *.kumbhakaran.in, *.kumbhkaransalon.in, *.kumbhakaransalons.in)
      if (/^https:\/\/(.*\.)?kumbhkaran(salons?)?\.in$/.test(origin)) return callback(null, true);
      if (/^https:\/\/(.*\.)?kumbhakaran(salons?)?\.in$/.test(origin)) return callback(null, true);
      if (/^https:\/\/(.*\.)?sloon\.in$/.test(origin)) return callback(null, true);
      if (/^https:\/\/(.*\.)?kumbhakaran-salons\..*$/.test(origin)) return callback(null, true);

      // In non-production environments, allow all origins
      if (process.env.NODE_ENV !== 'production') return callback(null, true);

      callback(new Error(`CORS Policy: Request from origin '${origin}' not authorized`), false);
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  // 4. Configure Global Request Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // 5. Configure OpenAPI / Swagger Documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Kumbhakaran Multi-Salon Platform API')
    .setDescription(
      'Enterprise High-Performance API for Real-Time Geographical Salon Discovery, PostGIS Spatial Queries, and Walk-In Telemetry. Built with NestJS, Fastify, PostGIS, and Prisma.',
    )
    .setVersion('1.0.0')
    .addTag('System Health', 'Health checks and PostGIS database diagnostics')
    .addTag('Salons', 'Salon registration and profile management')
    .addTag('Discovery', 'Geographical PostGIS radius search')
    .addTag('Queue Telemetry', 'Real-time walk-in transparency counters')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Enter JWT access token',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
    },
  });

  // 6. Listen on Port 3001
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;
  const host = '0.0.0.0';

  await app.listen(port, host);

  logger.log(`🚀 Kumbhakaran NestJS Fastify Backend running on: http://localhost:${port}`);
  logger.log(`📚 Swagger Documentation accessible at: http://localhost:${port}/api/docs`);
  logger.log(`🩺 Health & PostGIS Diagnostic endpoint: http://localhost:${port}/api/v1/health`);
}

bootstrap().catch((err) => {
  console.error('Fatal bootstrap error:', err);
  process.exit(1);
});
